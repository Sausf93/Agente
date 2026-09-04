import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { FTS_PESOS_BM25_ORDENADOS, normalizarBusqueda } from '@agente/shared';
import { DatabaseSync } from './sqlite.js';
import { construirPaquete, validarContenido } from './buildPackage.js';
import { SEED_TRAFICO } from '../seed/traficoSeed.js';

/**
 * Tests del constructor del paquete SQLite + FTS5. Deterministas y SIN red: construyen el
 * paquete a partir del seed en un directorio temporal y consultan el fichero resultante como
 * lo hará la app. Cubren, además, que "faro roto" encuentra "alumbrado" y "sin seguro" su
 * infracción (jerga de calle → ficha), que es el corazón del producto.
 */

let dir: string;
let ruta: string;
let db: DatabaseSync;
let resultado: ReturnType<typeof construirPaquete>;

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), 'agente-content-'));
  ruta = join(dir, 'contenido-test.sqlite');
  resultado = construirPaquete(SEED_TRAFICO, {
    rutaSalida: ruta,
    version: '0.1.0',
    fecha: '2026-09-04T00:00:00.000Z',
    changelog: { resumen: 'test' },
  });
  db = new DatabaseSync(ruta, { readOnly: true });
});

afterAll(() => {
  db?.close();
  rmSync(dir, { recursive: true, force: true });
});

/** Búsqueda por sinónimo EXACTO (nivel superior del ranking): lookup directo. */
function buscarSinonimoExacto(consulta: string): string[] {
  const filas = db
    .prepare(`SELECT DISTINCT infraccion_id FROM sinonimo WHERE termino_normalizado = ?`)
    .all(normalizarBusqueda(consulta)) as { infraccion_id: string }[];
  return filas.map((f) => f.infraccion_id);
}

/** Búsqueda FTS con ranking bm25 ponderado por columna (título > sinónimos > artículo > texto). */
function buscarFts(consulta: string): string[] {
  const [w0, w1, w2, w3] = FTS_PESOS_BM25_ORDENADOS;
  const filas = db
    .prepare(
      `SELECT infraccion_id, bm25(busqueda, ${w0}, ${w1}, ${w2}, ${w3}) AS score
       FROM busqueda WHERE busqueda MATCH ? ORDER BY score`,
    )
    .all(normalizarBusqueda(consulta)) as { infraccion_id: string; score: number }[];
  return filas.map((f) => f.infraccion_id);
}

describe('construirPaquete: estructura y metadatos', () => {
  it('puebla todas las tablas con las cuentas del seed', () => {
    const cuenta = (tabla: string): number =>
      (db.prepare(`SELECT COUNT(*) AS n FROM ${tabla}`).get() as { n: number }).n;
    expect(cuenta('norma')).toBe(4);
    expect(cuenta('articulo')).toBe(9);
    expect(cuenta('infraccion')).toBe(7);
    expect(cuenta('busqueda')).toBe(7);
    expect(cuenta('sinonimo')).toBeGreaterThanOrEqual(14);
    expect(cuenta('consecuencia')).toBe(2); // sin seguro: inmovilización + depósito
  });

  it('escribe la meta con la versión de esquema y de contenido', () => {
    const meta = (clave: string): string =>
      (db.prepare(`SELECT valor FROM meta WHERE clave = ?`).get(clave) as { valor: string }).valor;
    expect(meta('schema_version')).toBe('1');
    expect(meta('content_version')).toBe('0.1.0');
  });

  it('genera un manifiesto con hash SHA-256 y firma pendiente (stub)', () => {
    expect(resultado.manifiesto.hash).toMatch(/^[0-9a-f]{64}$/);
    expect(resultado.manifiesto.firma).toBeNull();
    expect(resultado.manifiesto.schemaVersion).toBe(1);
    expect(resultado.resumen.pendientesRevision).toBe(7);
  });

  it('marca todas las infracciones del seed como pendientes de revisión', () => {
    const n = (
      db.prepare(`SELECT COUNT(*) AS n FROM infraccion WHERE estado_revision = 'verificado'`).get() as {
        n: number;
      }
    ).n;
    expect(n).toBe(0);
  });
});

describe('buscador FTS5: jerga de calle → infracción', () => {
  it('"faro roto" (sinónimo exacto) resuelve a alumbrado deficiente', () => {
    expect(buscarSinonimoExacto('faro roto')).toContain('inf-alumbrado-deficiente');
    expect(buscarFts('faro roto')[0]).toBe('inf-alumbrado-deficiente');
  });

  it('"sin seguro" resuelve a conducir sin seguro (con su consecuencia)', () => {
    expect(buscarFts('sin seguro')[0]).toBe('inf-sin-seguro');
    const cons = db
      .prepare(`SELECT tipo FROM consecuencia WHERE infraccion_id = 'inf-sin-seguro' ORDER BY tipo`)
      .all() as { tipo: string }[];
    expect(cons.map((c) => c.tipo)).toEqual(['deposito', 'inmovilizacion']);
  });

  it('encuentra por tildes plegadas ("móvil" ~ "movil")', () => {
    expect(buscarFts('móvil')[0]).toBe('inf-movil-conduciendo');
  });

  it('encuentra por número de artículo ("RGC 18")', () => {
    expect(buscarFts('rgc 18')).toContain('inf-movil-conduciendo');
  });

  it('"semáforo rojo" resuelve a no respetar la luz roja', () => {
    expect(buscarFts('semaforo rojo')[0]).toBe('inf-semaforo-rojo');
  });
});

describe('validación de calidad (§8.3) al construir', () => {
  it('lanza si una infracción tiene el importe fuera del rango legal', () => {
    const alumbrado = SEED_TRAFICO.infracciones[0]!;
    const roto = {
      ...SEED_TRAFICO,
      infracciones: [
        {
          ...alumbrado,
          infraccion: { ...alumbrado.infraccion, gravedad: 'leve' as const, importeEur: 500 },
          marcoImporte: 'trafico' as const,
        },
      ],
    };
    expect(() => validarContenido(roto)).toThrow(/fuera del rango legal/);
  });
});
