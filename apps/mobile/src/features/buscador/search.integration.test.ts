import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { SqlRunner } from '@/db/sqlRunner';
import { buscarInfracciones } from './search';
import { cargarFicha } from '../ficha/ficha';

/**
 * Test de INTEGRACIÓN del buscador y la ficha contra el `.sqlite` REAL empaquetado con la app
 * (`assets/content/contenido-0.1.0.db`, copiado del pipeline). Valida el SQL y el ranking sin
 * necesidad de dispositivo, abriendo el paquete con `node:sqlite` (mismo motor con FTS5 que usa
 * el pipeline para construirlo) a través de la MISMA interfaz `SqlRunner` que usa la app.
 *
 * Si el paquete no está generado, el test avisa y se salta (no rompe el CI en un checkout limpio):
 *   corepack pnpm -F @agente/content-pipeline build:content --offline
 *   cp packages/content-pipeline/output/contenido-0.1.0.sqlite \
 *      apps/mobile/assets/content/contenido-0.1.0.db
 */

// `node:sqlite` se carga con require nativo para evitar la transformación de vite-node
// (que le quita el prefijo `node:` e intenta resolver un paquete inexistente).
const require = createRequire(import.meta.url);
const { DatabaseSync } = require('node:sqlite') as typeof import('node:sqlite');

const AQUI = dirname(fileURLToPath(import.meta.url));
const RUTA_DB = resolve(AQUI, '../../../assets/content/contenido-0.1.0.db');

/** Adaptador `SqlRunner` sobre `node:sqlite` (equivalente al de `expo-sqlite` en el dispositivo). */
function runnerDesdeArchivo(ruta: string): SqlRunner {
  const db = new DatabaseSync(ruta, { readOnly: true });
  return {
    getAll: async <T>(sql: string, params: readonly unknown[] = []) =>
      db.prepare(sql).all(...(params as never[])) as T[],
    getFirst: async <T>(sql: string, params: readonly unknown[] = []) =>
      (db.prepare(sql).get(...(params as never[])) as T) ?? null,
  };
}

const hayPaquete = existsSync(RUTA_DB);
const suite = hayPaquete ? describe : describe.skip;
if (!hayPaquete) {
  // eslint-disable-next-line no-console
  console.warn(`[search.integration] Falta ${RUTA_DB}; genera el paquete y cópialo (ver README).`);
}

suite('buscador contra el paquete real (FTS5 + ranking)', () => {
  const runner = runnerDesdeArchivo(RUTA_DB);

  it('"faro roto" (sinónimo exacto) → alumbrado deficiente, primero', async () => {
    const res = await buscarInfracciones(runner, 'faro roto');
    expect(res[0]?.infraccionId).toBe('inf-alumbrado-deficiente');
    expect(res[0]?.porSinonimoExacto).toBe(true);
  });

  it('"sin seguro" → ficha con inmovilización', async () => {
    const res = await buscarInfracciones(runner, 'sin seguro');
    expect(res[0]?.infraccionId).toBe('inf-sin-seguro');

    const ficha = await cargarFicha(runner, 'inf-sin-seguro');
    expect(ficha).not.toBeNull();
    const tipos = ficha!.consecuencias.map((c) => c.tipo);
    expect(tipos).toContain('inmovilizacion');
    // El texto de la consecuencia es ORIENTATIVO (nunca imperativo) y lleva su fuente.
    const inmoviliza = ficha!.consecuencias.find((c) => c.tipo === 'inmovilizacion');
    expect(inmoviliza?.textoCorto.toLowerCase()).toMatch(/procede|puede/);
    expect(inmoviliza?.fuente).toMatch(/LSV/);
  });

  it('"móvil" (tildes plegadas) → uso del móvil conduciendo', async () => {
    const res = await buscarInfracciones(runner, 'móvil');
    expect(res.map((r) => r.infraccionId)).toContain('inf-movil-conduciendo');
  });

  it('"rgc 18" (por artículo) → uso del móvil conduciendo', async () => {
    const res = await buscarInfracciones(runner, 'rgc 18');
    expect(res.map((r) => r.infraccionId)).toContain('inf-movil-conduciendo');
  });

  it('consulta sin coincidencias → lista vacía', async () => {
    const res = await buscarInfracciones(runner, 'zzzzzz palabra inexistente');
    expect(res).toEqual([]);
  });

  it('la ficha expone gravedad, importes, fuente y estado de revisión', async () => {
    const ficha = await cargarFicha(runner, 'inf-movil-conduciendo');
    expect(ficha).not.toBeNull();
    expect(ficha!.gravedad).toBe('grave');
    expect(ficha!.importeEur).toBe(200);
    expect(ficha!.importeReducidoEur).toBe(100);
    expect(ficha!.puntos).toBe(6);
    expect(ficha!.normaCodigo).toBe('RGC');
    expect(ficha!.articuloNumero).toBe('18');
    // El seed no publica nada como verificado: la app mostrará el distintivo.
    expect(ficha!.estadoRevision).toBe('pendiente_revision');
    expect(ficha!.actualizadoEn).toBeTruthy();
  });

  it('id inexistente → null', async () => {
    expect(await cargarFicha(runner, 'no-existe')).toBeNull();
  });
});
