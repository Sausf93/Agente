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
    const consecuenciasSeed = SEED_TRAFICO.infracciones.reduce(
      (n, i) => n + i.consecuencias.length,
      0,
    );
    // Las cuentas se derivan del propio seed para no quedar acopladas a un número mágico.
    expect(cuenta('norma')).toBe(SEED_TRAFICO.normas.length);
    expect(cuenta('articulo')).toBe(SEED_TRAFICO.articulos.length);
    expect(cuenta('infraccion')).toBe(SEED_TRAFICO.infracciones.length);
    expect(cuenta('busqueda')).toBe(SEED_TRAFICO.infracciones.length);
    expect(cuenta('sinonimo')).toBeGreaterThanOrEqual(14);
    expect(cuenta('consecuencia')).toBe(consecuenciasSeed);
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
    expect(resultado.resumen.pendientesRevision).toBe(SEED_TRAFICO.infracciones.length);
  });

  it('marca todas las infracciones del seed como pendientes de revisión', () => {
    const n = (
      db
        .prepare(`SELECT COUNT(*) AS n FROM infraccion WHERE estado_revision = 'verificado'`)
        .get() as {
        n: number;
      }
    ).n;
    expect(n).toBe(0);
  });

  it('la columna cuerpos viaja como JSON y el RGC (tráfico) excluye a la Policía Nacional', () => {
    const fila = db.prepare(`SELECT cuerpos FROM norma WHERE codigo = 'RGC'`).get() as {
      cuerpos: string;
    };
    const cuerpos = JSON.parse(fila.cuerpos) as string[];
    // El RGC es una norma de TRÁFICO: un PN no la lleva de oficio (bug E-03 corregido).
    expect(cuerpos).toEqual(['guardia_civil', 'policia_local', 'policia_autonomica']);
    expect(cuerpos).not.toContain('policia_nacional');
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

describe('buscador de ARTÍCULOS de la ley (§4.3, segundo nivel)', () => {
  /** MATCH en el FTS de artículos con ranking bm25 (título > número > texto). */
  function buscarArticuloFts(consulta: string): { numero: string; norma: string }[] {
    // Prefijos por token, igual que `construirConsultaFts` de la app (búsqueda a medida que se teclea).
    const match = normalizarBusqueda(consulta)
      .split(/[^a-z0-9]+/)
      .filter((tok) => tok.length > 0)
      .map((tok) => `${tok}*`)
      .join(' ');
    const filas = db
      .prepare(
        `SELECT b.articulo_id AS id, b.norma_codigo AS norma,
                bm25(busqueda_articulo, 6, 10, 1) AS score
           FROM busqueda_articulo b
          WHERE busqueda_articulo MATCH ? ORDER BY score`,
      )
      .all(match) as { id: string; norma: string; score: number }[];
    return filas.map((f) => {
      const a = db.prepare(`SELECT numero FROM articulo WHERE id = ?`).get(f.id) as {
        numero: string;
      };
      return { numero: a.numero, norma: f.norma };
    });
  }

  it('indexa un artículo VIGENTE por cada artículo del seed', () => {
    const nArticulos = (db.prepare(`SELECT COUNT(*) AS n FROM articulo`).get() as { n: number }).n;
    const nFts = (
      db.prepare(`SELECT COUNT(*) AS n FROM busqueda_articulo`).get() as { n: number }
    ).n;
    expect(nFts).toBe(nArticulos);
    expect(nFts).toBeGreaterThan(0);
  });

  it('encuentra un artículo por el código+número de norma ("rgc 18")', () => {
    const res = buscarArticuloFts('rgc 18');
    expect(res.some((r) => r.norma === 'RGC' && r.numero === '18')).toBe(true);
  });

  it('encuentra por PREFIJO de token en el texto (a medida que se teclea)', () => {
    // El seed de tráfico habla de "circulación"/"conducción": el prefijo debe casar.
    expect(buscarArticuloFts('conduc').length).toBeGreaterThan(0);
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
