import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { SqlRunner } from '@/db/sqlRunner';
import { cargarArticulo, filtrarArticulos, listarArticulos, listarNormas } from './normas';

/**
 * Test de INTEGRACIÓN de NORMAS contra el `.sqlite` REAL empaquetado (`assets/content/…db`),
 * abierto con `node:sqlite` a través de la MISMA interfaz `SqlRunner` que usa la app. Valida el
 * SQL de navegación norma→artículo, la ordenación y el buscador dentro de la norma, sin
 * necesidad de dispositivo. Se salta (no rompe el CI) si el paquete no está generado.
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
  console.warn(`[normas.integration] Falta ${RUTA_DB}; genera el paquete y cópialo (ver README).`);
}

suite('normas contra el paquete real', () => {
  const runner = runnerDesdeArchivo(RUTA_DB);

  it('listarNormas trae las normas de tráfico con recuento de artículos', async () => {
    const normas = await listarNormas(runner);
    const codigos = normas.map((n) => n.codigo);
    expect(codigos).toContain('RGC');
    expect(codigos).toContain('LSV');
    const rgc = normas.find((n) => n.codigo === 'RGC');
    expect(rgc?.numArticulos).toBeGreaterThan(200);
    expect(rgc?.urlBoe).toMatch(/boe\.es/);
  });

  it('listarArticulos del RGC viene ordenado y con la marca de resumen', async () => {
    const rgcId = (await listarNormas(runner)).find((n) => n.codigo === 'RGC')!.id;
    const articulos = await listarArticulos(runner, rgcId);
    expect(articulos.length).toBeGreaterThan(200);
    // Dentro del mismo `orden`, los números salen ascendentes (5 antes que 18 antes que 118).
    const ordenes = articulos.map((a) => a.orden);
    for (let i = 1; i < ordenes.length; i += 1) expect(ordenes[i]).toBeGreaterThanOrEqual(ordenes[i - 1]);
    // Los textos de seed llevan la marca de resumen orientativo.
    expect(articulos.some((a) => a.esResumen)).toBe(true);
  });

  it('el buscador dentro de la norma filtra por número exacto y por texto', async () => {
    const rgcId = (await listarNormas(runner)).find((n) => n.codigo === 'RGC')!.id;
    const articulos = await listarArticulos(runner, rgcId);

    const porNumero = filtrarArticulos(articulos, '18');
    expect(porNumero.some((a) => a.numero === '18')).toBe(true);
    expect(porNumero.every((a) => a.numero.startsWith('18'))).toBe(true);

    const porTexto = filtrarArticulos(articulos, 'alumbrado');
    expect(porTexto.some((a) => a.numero === '99')).toBe(true);
  });

  it('cargarArticulo devuelve texto, fuente y fecha; id inexistente → null', async () => {
    const rgcId = (await listarNormas(runner)).find((n) => n.codigo === 'RGC')!.id;
    const articulos = await listarArticulos(runner, rgcId);
    const alumbrado = articulos.find((a) => a.numero === '99')!;

    const detalle = await cargarArticulo(runner, alumbrado.id);
    expect(detalle).not.toBeNull();
    expect(detalle!.normaCodigo).toBe('RGC');
    expect(detalle!.numero).toBe('99');
    expect(detalle!.texto.length).toBeGreaterThan(0);
    expect(detalle!.actualizadoEn).toBeTruthy();
    expect(detalle!.urlBoe).toMatch(/boe\.es/);

    expect(await cargarArticulo(runner, 'no-existe')).toBeNull();
  });
});
