import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { SqlRunner } from '@/db/sqlRunner';
import { cargarNovedades } from './novedades';

/**
 * Test de INTEGRACIÓN de NOVEDADES (§4.13) contra el `.sqlite` REAL empaquetado, abierto con
 * `node:sqlite` por la MISMA interfaz `SqlRunner` que usa la app. Valida que el SQL de la tabla
 * `novedad` casa con el esquema del paquete. Se salta si el paquete no está generado.
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
  console.warn(`[novedades.integration] Falta ${RUTA_DB}; genera el paquete y cópialo (ver README).`);
}

suite('novedades contra el paquete real', () => {
  const runner = runnerDesdeArchivo(RUTA_DB);

  it('cargarNovedades trae al menos la carga inicial, con fecha y resumen', async () => {
    const novedades = await cargarNovedades(runner);
    expect(novedades.length).toBeGreaterThanOrEqual(1);
    const primera = novedades[0]!;
    expect(primera.resumen.length).toBeGreaterThan(0);
    expect(primera.fecha).toMatch(/^\d{4}-\d{2}-\d{2}/);
    expect(Array.isArray(primera.articulos)).toBe(true);
  });

  it('vienen ordenadas por fecha descendente', async () => {
    const novedades = await cargarNovedades(runner);
    for (let i = 1; i < novedades.length; i += 1) {
      expect(novedades[i - 1]!.fecha >= novedades[i]!.fecha).toBe(true);
    }
  });
});
