import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  FTS_PESOS_BM25_ORDENADOS,
  normalizarBusqueda,
  validarImporte,
  validarMinimosPublicacion,
} from '@agente/shared';
import { DatabaseSync } from '../paquete/sqlite.js';
import { construirPaquete } from '../paquete/buildPackage.js';
import { combinarSeeds } from '../paquete/combinar.js';
import { SEED_SEGURIDAD_CIUDADANA } from './seguridadCiudadanaSeed.js';
import { SEED_TRAFICO } from './traficoSeed.js';
import { SEED_PENAL } from './penalSeed.js';

/**
 * Tests del SEED de SEGURIDAD CIUDADANA (LO 4/2015): garantizan que cada infracción cumple los
 * mínimos de publicación (§8.3), que su importe cae en el rango legal del marco
 * `seguridad_ciudadana` (art. 39: leves 100–600, graves 601–30.000, muy graves 30.001–600.000),
 * que TODO queda pendiente de revisión con nota "a verificar", que las consecuencias son
 * orientativas y con fuente, y que la jerga de calle ("okupas", "porro en la vía pública",
 * "insultar a la policía"…) llega a la ficha correcta en el paquete SQLite.
 */

const idsArticulos = new Set(SEED_SEGURIDAD_CIUDADANA.articulos.map((a) => a.id));
const porId = (id: string) =>
  SEED_SEGURIDAD_CIUDADANA.infracciones.find((i) => i.infraccion.id === id);

describe('SEED_SEGURIDAD_CIUDADANA: integridad', () => {
  it('siembra 10 infracciones de calle de la LO 4/2015', () => {
    expect(SEED_SEGURIDAD_CIUDADANA.infracciones).toHaveLength(10);
  });

  it('todas son administrativas, estatales y sin puntos (no es tráfico)', () => {
    for (const { infraccion } of SEED_SEGURIDAD_CIUDADANA.infracciones) {
      expect(infraccion.tipo, infraccion.id).toBe('administrativa');
      expect(infraccion.ambito, infraccion.id).toBe('estatal');
      expect(infraccion.puntos, infraccion.id).toBeNull();
      expect(infraccion.codigoDgt, infraccion.id).toBeNull();
    }
  });

  it('cada infracción cita un artículo de la LO 4/2015 presente en el seed y tiene ≥3 sinónimos', () => {
    for (const { infraccion, sinonimos } of SEED_SEGURIDAD_CIUDADANA.infracciones) {
      expect(idsArticulos.has(infraccion.articuloId), infraccion.id).toBe(true);
      expect(sinonimos.length, infraccion.id).toBeGreaterThanOrEqual(3);
    }
  });

  it('la competencia cubre a los tres cuerpos generalistas (GC, Nacional, Local)', () => {
    for (const { infraccion } of SEED_SEGURIDAD_CIUDADANA.infracciones) {
      expect(infraccion.competencia.cuerpos.sort(), infraccion.id).toEqual([
        'guardia_civil',
        'policia_local',
        'policia_nacional',
      ]);
    }
  });

  it('todas quedan pendientes de revisión con nota "a verificar" (nada se autopublica)', () => {
    for (const item of SEED_SEGURIDAD_CIUDADANA.infracciones) {
      expect(item.revision, item.infraccion.id).toBe('pendiente_revision');
      expect(item.marcoImporte, item.infraccion.id).toBe('seguridad_ciudadana');
      expect(item.notaRevision.toUpperCase()).toContain('A VERIFICAR');
    }
  });
});

describe('SEED_SEGURIDAD_CIUDADANA: calidad de importes (§8.3, art. 39)', () => {
  it('cada importe cae dentro de su rango legal (marco seguridad_ciudadana)', () => {
    for (const { infraccion, marcoImporte } of SEED_SEGURIDAD_CIUDADANA.infracciones) {
      const problemas = validarImporte(infraccion, marcoImporte);
      expect(problemas, `${infraccion.id}: ${JSON.stringify(problemas)}`).toEqual([]);
    }
  });

  it('cada infracción supera los mínimos de publicación', () => {
    for (const { infraccion, sinonimos } of SEED_SEGURIDAD_CIUDADANA.infracciones) {
      const problemas = validarMinimosPublicacion(infraccion, sinonimos.length);
      expect(problemas, `${infraccion.id}: ${JSON.stringify(problemas)}`).toEqual([]);
    }
  });

  it('las graves fijan el extremo inferior (601 €) y las leves (100 €); el pronto pago es el 50 %', () => {
    for (const { infraccion } of SEED_SEGURIDAD_CIUDADANA.infracciones) {
      if (infraccion.gravedad === 'grave') expect(infraccion.importeEur, infraccion.id).toBe(601);
      if (infraccion.gravedad === 'leve') expect(infraccion.importeEur, infraccion.id).toBe(100);
      // Reducido = 50 % del base (art. 54: procedimiento abreviado / pago voluntario).
      expect(infraccion.importeReducidoEur, infraccion.id).toBeCloseTo(infraccion.importeEur! / 2);
    }
  });
});

describe('SEED_SEGURIDAD_CIUDADANA: consecuencias orientativas con fuente', () => {
  it('drogas en vía pública lleva decomiso de la sustancia', () => {
    const drogas = porId('sc-drogas-via-publica');
    expect(drogas).toBeDefined();
    const decomiso = drogas!.consecuencias.find((c) => c.tipo === 'decomiso');
    expect(decomiso).toBeDefined();
    expect(decomiso!.fuente).toMatch(/LO 4\/2015/);
    expect(decomiso!.textoCorto.toLowerCase()).toMatch(/procede|puede/);
  });

  it('armas prohibidas lleva decomiso del arma', () => {
    const armas = porId('sc-armas-prohibidas');
    expect(armas!.consecuencias.some((c) => c.tipo === 'decomiso')).toBe(true);
  });

  it('la negativa a identificarse lleva una consecuencia de identificación orientativa', () => {
    const negativa = porId('sc-negativa-identificarse');
    const ident = negativa!.consecuencias.find((c) => c.tipo === 'identificacion');
    expect(ident).toBeDefined();
    // Lenguaje ORIENTATIVO, nunca imperativo (CLAUDE.md §4.6).
    expect(ident!.textoCorto.toLowerCase()).toMatch(/procede|puede/);
    expect(ident!.fuente).toMatch(/art\. 16/);
  });
});

describe('combinarSeeds: tráfico + penal + seguridad ciudadana', () => {
  const combinado = combinarSeeds(SEED_TRAFICO, SEED_PENAL, SEED_SEGURIDAD_CIUDADANA);

  it('la norma LO 4/2015 (LOSC) aparece una sola vez', () => {
    expect(combinado.normas.filter((n) => n.codigo === 'LOSC')).toHaveLength(1);
  });

  it('no hay ids de norma ni de artículo duplicados', () => {
    const normaIds = combinado.normas.map((n) => n.id);
    const artIds = combinado.articulos.map((a) => a.id);
    expect(new Set(normaIds).size).toBe(normaIds.length);
    expect(new Set(artIds).size).toBe(artIds.length);
  });

  it('suma las infracciones de los tres seeds', () => {
    expect(combinado.infracciones).toHaveLength(
      SEED_TRAFICO.infracciones.length +
        SEED_PENAL.infracciones.length +
        SEED_SEGURIDAD_CIUDADANA.infracciones.length,
    );
  });
});

describe('buscador FTS5: jerga de calle → infracción de seguridad ciudadana', () => {
  let dir: string;
  let db: DatabaseSync;

  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), 'agente-losc-'));
    const ruta = join(dir, 'contenido-losc-test.sqlite');
    construirPaquete(combinarSeeds(SEED_TRAFICO, SEED_PENAL, SEED_SEGURIDAD_CIUDADANA), {
      rutaSalida: ruta,
      version: '0.1.0',
      fecha: '2026-09-07T00:00:00.000Z',
      changelog: { resumen: 'test' },
    });
    db = new DatabaseSync(ruta, { readOnly: true });
  });

  afterAll(() => {
    db?.close();
    rmSync(dir, { recursive: true, force: true });
  });

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

  function buscarSinonimoExacto(consulta: string): string[] {
    const filas = db
      .prepare(`SELECT DISTINCT infraccion_id FROM sinonimo WHERE termino_normalizado = ?`)
      .all(normalizarBusqueda(consulta)) as { infraccion_id: string }[];
    return filas.map((f) => f.infraccion_id);
  }

  it('"okupas" resuelve a ocupación de inmueble', () => {
    expect(buscarSinonimoExacto('okupas')).toContain('sc-ocupacion-inmueble');
    expect(buscarFts('okupas')[0]).toBe('sc-ocupacion-inmueble');
  });

  it('"insultar a la policia" resuelve a falta de respeto (tildes plegadas)', () => {
    expect(buscarFts('insultar a la policía')[0]).toBe('sc-falta-respeto-agente');
  });

  it('"porro en la via publica" resuelve a drogas en vía pública', () => {
    expect(buscarFts('porro en la via publica')[0]).toBe('sc-drogas-via-publica');
  });

  it('"no se identifica" resuelve a negativa a identificarse', () => {
    expect(buscarSinonimoExacto('no se identifica')).toContain('sc-negativa-identificarse');
  });

  it('"desobediencia" resuelve a desobediencia o resistencia', () => {
    expect(buscarSinonimoExacto('desobediencia')).toContain('sc-desobediencia-resistencia');
  });

  it('encuentra por número de artículo ("LOSC 36")', () => {
    // La consulta se tokeniza por el separador ".", así que "36" localiza los arts. 36.x de la
    // LO 4/2015 (la app debe pasar la consulta por normalizarBusqueda antes del MATCH).
    expect(buscarFts('losc 36')).toContain('sc-drogas-via-publica');
    expect(buscarFts('losc 37')).toContain('sc-falta-respeto-agente');
  });
});
