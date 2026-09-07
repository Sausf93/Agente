import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { SqlRunner } from '@/db/sqlRunner';
import { calcularOrientacion, cargarSustancia, filtrarSustancias, listarSustancias } from './sustancias';

/**
 * Test de INTEGRACIÓN de SUSTANCIAS contra el `.sqlite` REAL empaquetado (`assets/content/…db`),
 * abierto con `node:sqlite` a través de la MISMA interfaz `SqlRunner` que usa la app. Valida el
 * SQL de la tabla `sustancia` (§4.7), el buscador por jerga y la orientación consumo/tráfico con
 * datos REALES, sin necesidad de dispositivo. Se salta (no rompe el CI) si el paquete no existe.
 */
const require = createRequire(import.meta.url);
const { DatabaseSync } = require('node:sqlite') as typeof import('node:sqlite');

const AQUI = dirname(fileURLToPath(import.meta.url));
const RUTA_DB = resolve(AQUI, '../../../assets/content/contenido-0.1.0.db');

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
  console.warn(`[sustancias.integration] Falta ${RUTA_DB}; genera el paquete y cópialo (ver README).`);
}

suite('sustancias contra el paquete real', () => {
  const runner = runnerDesdeArchivo(RUTA_DB);

  it('listarSustancias trae la tabla del INTCF con su jerga de calle', async () => {
    const lista = await listarSustancias(runner);
    const ids = lista.map((s) => s.id);
    expect(ids).toContain('cocaina');
    expect(ids).toContain('cannabis-marihuana');
    expect(ids.length).toBeGreaterThanOrEqual(5);
    const coca = lista.find((s) => s.id === 'cocaina');
    expect(coca?.aliases).toContain('farlopa');
    // El seed se publica SIEMPRE pendiente de revisión (nada se autopublica verificado).
    expect(coca?.pendienteRevision).toBe(true);
  });

  it('el buscador de la lista encuentra por jerga de calle', async () => {
    const lista = await listarSustancias(runner);
    expect(filtrarSustancias(lista, 'farlopa').map((s) => s.id)).toContain('cocaina');
    expect(filtrarSustancias(lista, 'maria').map((s) => s.id)).toContain('cannabis-marihuana');
  });

  it('cargarSustancia devuelve umbrales, pureza, fuente y fecha; id inexistente → null', async () => {
    const coca = await cargarSustancia(runner, 'cocaina');
    expect(coca).not.toBeNull();
    expect(coca!.umbralConsumoDiarioMg).toBeGreaterThan(0);
    expect(coca!.umbralAcopioG).toBeGreaterThan(0);
    expect(coca!.indicadoresTrafico.length).toBeGreaterThan(0);
    expect(coca!.fuente).toMatch(/INTCF|Tribunal Supremo|19\/10\/2001/i);
    expect(coca!.actualizadoEn).toBeTruthy();
    // Cocaína: umbral en peso PURO (aviso de reducción a riqueza del laboratorio).
    expect(coca!.basePeso).toBe('puro');

    expect(await cargarSustancia(runner, 'no-existe')).toBeNull();
  });

  it('cannabis usa peso BRUTO (no se reduce a THC puro)', async () => {
    const cannabis = await cargarSustancia(runner, 'cannabis-marihuana');
    expect(cannabis!.basePeso).toBe('bruto');
  });

  it('la orientación con pureza real evita sobre-marcar tráfico en cocaína de baja riqueza', async () => {
    const coca = await cargarSustancia(runner, 'cocaina');
    // Una cantidad bruta que supera el umbral, pero con baja pureza queda por debajo tras reducir.
    const brutoSupera = coca!.umbralAcopioG * 3;
    const conBajaPureza = calcularOrientacion(coca!, brutoSupera, 20);
    expect(conBajaPureza.resultado.orientacion).toBe('probable_consumo');
    // Sin reducir, esa misma cantidad bruta apuntaría a tráfico.
    const sinReducir = calcularOrientacion(coca!, brutoSupera, null);
    expect(sinReducir.resultado.orientacion).toBe('indicios_trafico');
  });
});
