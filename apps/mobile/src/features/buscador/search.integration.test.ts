import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { SqlRunner } from '@/db/sqlRunner';
import { buscarArticulos, buscarInfracciones, buscarTodo } from './search';
import { cargarFicha } from '../ficha/ficha';

/**
 * Test de INTEGRACIÓN del buscador y la ficha contra el `.sqlite` REAL empaquetado con la app
 * (`assets/content/contenido-0.1.0.db`, copiado del pipeline). Valida el SQL y el ranking sin
 * necesidad de dispositivo, abriendo el paquete con `node:sqlite` (mismo motor con FTS5 que usa
 * el pipeline para construirlo) a través de la MISMA interfaz `SqlRunner` que usa la app.
 *
 * Si el paquete no está generado, el test avisa y se salta (no rompe el CI en un checkout limpio):
 *   corepack pnpm -F @agente/content-pipeline build:content   # EN VIVO (BOE)
 *   cp packages/content-pipeline/output/contenido-0.1.0.sqlite \
 *      apps/mobile/assets/content/contenido-0.1.0.db
 *
 * Los tests del SEGUNDO NIVEL (artículos de la ley: "temeraria"→art. 380 CP, "alejamiento"→art.
 * 468 CP) necesitan el paquete EN VIVO: el modo `--offline` solo trae el RGC (fixture) y no
 * enriquece el Código Penal, así que esos casos no encontrarían el artículo.
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
    // La fila del buscador ya trae la pista de consecuencia determinante (chip inline, P0-4).
    expect(res[0]?.pista).toEqual({ tipo: 'inmovilizacion', peligro: false });

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

/**
 * Segundo nivel del buscador (§4.3): cobertura del ARTICULADO. El agente escribe un término
 * legal SIN infracción curada ("temeraria", "alejamiento") y el buscador ya no dice "nada
 * exacto": encuentra el artículo del BOE que viaja en el paquete. Las infracciones (la joya)
 * siguen saliendo primero cuando existen.
 */
suite('buscador en dos niveles: infracciones + artículos de la ley', () => {
  const runner = runnerDesdeArchivo(RUTA_DB);

  it('"hurto" sigue saliendo como INFRACCIÓN (del-hurto), la joya primero', async () => {
    const { infracciones } = await buscarTodo(runner, 'hurto');
    expect(infracciones.map((r) => r.infraccionId)).toContain('del-hurto');
  });

  it('"temeraria" (sin infracción curada) → artículo(s) de la ley, no "nada exacto"', async () => {
    const { infracciones, articulos } = await buscarTodo(runner, 'temeraria');
    // No hay infracción curada de conducción temeraria, pero el articulado la cubre.
    expect(articulos.length).toBeGreaterThan(0);
    // Debe aparecer el Código Penal (arts. 379-380 CP, conducción temeraria).
    expect(articulos.some((a) => a.normaCodigo === 'CP')).toBe(true);
    // Con o sin infracciones, el conjunto NO está vacío → la UI no muestra "nada exacto".
    expect(infracciones.length + articulos.length).toBeGreaterThan(0);
  });

  it('"alejamiento" → quebrantamiento como infracción (sinónimo) y/o artículo del CP', async () => {
    const { infracciones, articulos } = await buscarTodo(runner, 'alejamiento');
    const idsInf = infracciones.map((r) => r.infraccionId);
    const cubierto = idsInf.includes('del-quebrantamiento') || articulos.length > 0;
    expect(cubierto).toBe(true);
  });

  it('"agresion" → lesiones como infracción (sinónimo de calle)', async () => {
    const { infracciones } = await buscarTodo(runner, 'agresion');
    expect(infracciones.map((r) => r.infraccionId)).toContain('del-lesiones');
  });

  it('buscarArticulos devuelve artículos con su código de norma, número y extracto', async () => {
    const arts = await buscarArticulos(runner, 'temeraria');
    expect(arts.length).toBeGreaterThan(0);
    const a = arts[0]!;
    expect(a.articuloId).toBeTruthy();
    expect(a.normaCodigo).toBeTruthy();
    expect(a.numero).toBeTruthy();
    expect(a.extracto.length).toBeGreaterThan(0);
  });

  it('término sin sentido → sin infracciones y sin artículos (único caso de "nada exacto")', async () => {
    const { infracciones, articulos } = await buscarTodo(runner, 'zzzzzz palabra inexistente');
    expect(infracciones).toEqual([]);
    expect(articulos).toEqual([]);
  });
});

/**
 * Filtro TERRITORIAL del buscador (ADR-006/008): la ordenanza municipal de un municipio (piloto:
 * Santa Cruz de Tenerife) solo debe salir al agente de ESE municipio. Un agente de otro municipio
 * (o sin territorio) solo ve lo estatal. Cubre el mismo contrato que Normas, ahora en Buscar.
 */
suite('buscador: filtro territorial de la ordenanza municipal', () => {
  const runner = runnerDesdeArchivo(RUTA_DB);

  /** Cadena territorial de un Policía Local de Santa Cruz de Tenerife (Canarias). */
  const CADENA_SCTF = ['es-ccaa-05', 'es-prov-38', 'mun-santa-cruz-de-tenerife'];
  /** Cadena de un Local de otro municipio (no debe ver la ordenanza ajena). */
  const CADENA_OTRO_MUNICIPIO = ['es-ccaa-05', 'es-prov-38', 'mun-la-laguna'];

  it('un agente de OTRO municipio NO ve la ordenanza de SCTF ("perro suelto")', async () => {
    const { infracciones } = await buscarTodo(runner, 'perro suelto', CADENA_OTRO_MUNICIPIO);
    expect(infracciones.every((r) => !r.infraccionId.startsWith('ord-sctf-'))).toBe(true);
  });

  it('sin territorio (perfil neutro) tampoco ve la ordenanza municipal', async () => {
    const infracciones = await buscarInfracciones(runner, 'perro suelto');
    expect(infracciones.every((r) => !r.infraccionId.startsWith('ord-sctf-'))).toBe(true);
  });

  it('un Local de SCTF SÍ ve su ordenanza ("perro suelto" → ord-sctf-perro-suelto)', async () => {
    const { infracciones } = await buscarTodo(runner, 'perro suelto', CADENA_SCTF);
    expect(infracciones.map((r) => r.infraccionId)).toContain('ord-sctf-perro-suelto');
  });

  it('el articulado municipal de SCTF tampoco fuga a otro municipio', async () => {
    const propios = await buscarArticulos(runner, 'animales vía pública', new Set(), CADENA_SCTF);
    const ajenos = await buscarArticulos(runner, 'animales vía pública', new Set(), CADENA_OTRO_MUNICIPIO);
    // El artículo de la ordenanza de animales (norma municipal de SCTF) solo aparece para SCTF.
    const esMunicipalSctf = (id: string): boolean => id.startsWith('OM-SCTF-');
    expect(ajenos.every((a) => !esMunicipalSctf(a.articuloId))).toBe(true);
    // (No exigimos que aparezca para SCTF: depende del ranking FTS; sí que NUNCA aparezca al ajeno.)
    void propios;
  });
});
