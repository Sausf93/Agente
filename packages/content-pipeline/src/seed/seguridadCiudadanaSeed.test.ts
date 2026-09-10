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
  it('siembra 22 entradas de calle (10 infracciones LOSC base + 7 de la ola de ARMAS + 5 consultables: identificación art. 16, consumo de alcohol 37.17, MENA, derechos de la víctima y cacheo/registro)', () => {
    expect(SEED_SEGURIDAD_CIUDADANA.infracciones).toHaveLength(22);
  });

  it('todas son administrativas, estatales y sin puntos (no es tráfico)', () => {
    for (const { infraccion } of SEED_SEGURIDAD_CIUDADANA.infracciones) {
      expect(infraccion.tipo, infraccion.id).toBe('administrativa');
      expect(infraccion.ambito, infraccion.id).toBe('estatal');
      expect(infraccion.puntos, infraccion.id).toBeNull();
      expect(infraccion.codigoDgt, infraccion.id).toBeNull();
    }
  });

  it('cada infracción cita un artículo presente en el seed y tiene ≥3 sinónimos', () => {
    for (const { infraccion, sinonimos } of SEED_SEGURIDAD_CIUDADANA.infracciones) {
      expect(idsArticulos.has(infraccion.articuloId), infraccion.id).toBe(true);
      expect(sinonimos.length, infraccion.id).toBeGreaterThanOrEqual(3);
    }
  });

  it('la competencia cubre a todos los cuerpos (GC, Nacional, Local, Autonómica)', () => {
    for (const { infraccion } of SEED_SEGURIDAD_CIUDADANA.infracciones) {
      expect(infraccion.competencia.cuerpos.sort(), infraccion.id).toEqual([
        'guardia_civil',
        'policia_autonomica',
        'policia_local',
        'policia_nacional',
      ]);
    }
  });

  it('todas quedan pendientes de revisión con nota "a verificar" (nada se autopublica)', () => {
    for (const item of SEED_SEGURIDAD_CIUDADANA.infracciones) {
      expect(item.revision, item.infraccion.id).toBe('pendiente_revision');
      // Todas son del marco de seguridad ciudadana salvo el requerimiento de identificación
      // (art. 16), que es una entrada consultable sin sanción (`no_sancionador`).
      expect(['seguridad_ciudadana', 'no_sancionador'], item.infraccion.id).toContain(
        item.marcoImporte,
      );
      expect(item.notaRevision.toUpperCase()).toContain('A VERIFICAR');
    }
  });

  it('el requerimiento de identificación (art. 16) es una entrada consultable SIN sanción', () => {
    const ident = porId('sc-identificacion-requerimiento');
    expect(ident).toBeDefined();
    expect(ident!.marcoImporte).toBe('no_sancionador');
    expect(ident!.infraccion.importeEur).toBeNull();
    expect(ident!.infraccion.importeReducidoEur).toBeNull();
    // Lleva una consecuencia de identificación ORIENTATIVA con su fuente (art. 16).
    const cons = ident!.consecuencias.find((c) => c.tipo === 'identificacion');
    expect(cons).toBeDefined();
    expect(cons!.textoCorto.toLowerCase()).toMatch(/procede|puede/);
    expect(cons!.fuente).toMatch(/art\. 16/);
    // Diferencia con la detención: no se leen los derechos del art. 520 LECrim.
    expect(ident!.infraccion.textoBoletin).toMatch(/520|no es una detenci/i);
    // Tope del art. 16.2: el traslado a dependencias no puede superar las 6 horas.
    expect(ident!.infraccion.textoBoletin).toMatch(/6 horas/);
    expect(cons!.textoCorto).toMatch(/6 horas/);
    expect(ident!.notaRevision).toMatch(/6 horas/);
  });

  it('el MENA es una entrada consultable de PROTECCIÓN, sin sanción ni importe', () => {
    const mena = porId('sc-mena-consulta');
    expect(mena).toBeDefined();
    expect(mena!.marcoImporte).toBe('no_sancionador');
    expect(mena!.infraccion.importeEur).toBeNull();
    expect(mena!.infraccion.importeReducidoEur).toBeNull();
    // Mensaje clave: es PROTECCIÓN (no sanción) y NUNCA procede calabozo por menor/extranjero.
    expect(mena!.infraccion.textoBoletin.toLowerCase()).toMatch(/protecci/);
    expect(mena!.infraccion.textoBoletin.toLowerCase()).toMatch(/nunca procede el calabozo|nunca procede calabozo/);
    expect(mena!.infraccion.textoBoletin).toMatch(/Fiscal/);
    const cons = mena!.consecuencias.find((c) => c.tipo === 'proteccion');
    expect(cons).toBeDefined();
    expect(cons!.textoCorto.toLowerCase()).toMatch(/procede/);
  });

  it('el consumo de alcohol (art. 37.17) es LEVE y marca la frontera con la ordenanza (botellón)', () => {
    const alcohol = porId('sc-consumo-alcohol-via-publica');
    expect(alcohol).toBeDefined();
    expect(alcohol!.infraccion.gravedad).toBe('leve');
    expect(alcohol!.infraccion.importeEur).toBe(100);
    // El tipo estatal EXIGE perturbación grave; el botellón simple es materia de ORDENANZA municipal.
    expect(alcohol!.infraccion.textoBoletin.toLowerCase()).toMatch(/perturbe gravemente|perturbaci/);
    expect(alcohol!.infraccion.textoBoletin.toLowerCase()).toMatch(/ordenanza/);
  });

  it('los derechos de la víctima son una entrada consultable SIN sanción (Estatuto + LECrim)', () => {
    const victima = porId('sc-derechos-victima');
    expect(victima).toBeDefined();
    expect(victima!.marcoImporte).toBe('no_sancionador');
    expect(victima!.infraccion.importeEur).toBeNull();
    expect(victima!.infraccion.importeReducidoEur).toBeNull();
    // Diferenciarlo de los derechos del DETENIDO (art. 520 LECrim) y citar la orden de protección.
    expect(victima!.infraccion.textoBoletin).toMatch(/520/);
    expect(victima!.infraccion.textoBoletin.toLowerCase()).toMatch(/orden de protecci/);
    expect(victima!.infraccion.textoBoletin).toMatch(/544 ter/);
    // SIN consecuencia coercitiva (revisor): es una consulta GENERAL de derechos, no un caso activo de
    // VG; sin consecuencia cae al chip informativo "Consulta · orientación" (no al destacado de
    // `proteccion`, pensado para VG). La orden de protección queda acotada a VG dentro del texto.
    expect(victima!.consecuencias).toHaveLength(0);
  });

  it('el cacheo/registro es una entrada consultable SIN sanción y deja claro qué requiere autorización judicial', () => {
    const cacheo = porId('sc-cacheo-registro');
    expect(cacheo).toBeDefined();
    expect(cacheo!.marcoImporte).toBe('no_sancionador');
    expect(cacheo!.infraccion.importeEur).toBeNull();
    expect(cacheo!.infraccion.importeReducidoEur).toBeNull();
    // Garantías del art. 20 LO 4/2015 y la entrada en domicilio (18.2 CE / resolución judicial).
    expect(cacheo!.infraccion.textoBoletin.toLowerCase()).toMatch(/mismo sexo/);
    expect(cacheo!.infraccion.textoBoletin.toLowerCase()).toMatch(/resoluci[oó]n judicial/);
    expect(cacheo!.infraccion.textoBoletin).toMatch(/18\.2 CE/);
    expect(cacheo!.infraccion.textoBoletin.toLowerCase()).toMatch(/flagrante/);
    // Lenguaje orientativo (no imperativo): "con carácter general", "procede".
    expect(cacheo!.infraccion.textoBoletin.toLowerCase()).toMatch(/con car[aá]cter general|procede/);
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
    for (const { infraccion, sinonimos, marcoImporte } of SEED_SEGURIDAD_CIUDADANA.infracciones) {
      const problemas = validarMinimosPublicacion(infraccion, sinonimos.length, marcoImporte);
      expect(problemas, `${infraccion.id}: ${JSON.stringify(problemas)}`).toEqual([]);
    }
  });

  it('las graves fijan el extremo inferior (601 €) y las leves (100 €); el pronto pago es el 50 %', () => {
    for (const { infraccion, marcoImporte } of SEED_SEGURIDAD_CIUDADANA.infracciones) {
      // Las entradas sin sanción (identificación, art. 16) no llevan importe: se excluyen.
      if (marcoImporte === 'no_sancionador') {
        expect(infraccion.importeEur, infraccion.id).toBeNull();
        continue;
      }
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

  it('"okupas" resuelve a ocupación de inmueble (admin 37.7 LOSC y penal 245.2 CP, ambas reachable)', () => {
    // FRONTERA 37.7 LOSC vs 245.2 CP: la ocupación pacífica de un inmueble ajeno que no es morada es,
    // en la práctica, el DELITO LEVE de usurpación (art. 245.2 CP); la infracción administrativa del
    // art. 37.7 LOSC es RESIDUAL ("cuando no sean constitutivas de infracción penal"). Por eso el
    // buscador surfacea primero la ficha PENAL, pero la administrativa sigue siendo alcanzable. Ambas
    // quedan pendientes de revisión para que el jurista decida el encaje.
    const sinExacto = buscarSinonimoExacto('okupas');
    expect(sinExacto).toContain('sc-ocupacion-inmueble');
    expect(sinExacto).toContain('del-usurpacion');
    const fts = buscarFts('okupas');
    expect(fts).toContain('sc-ocupacion-inmueble');
    expect(fts).toContain('del-usurpacion');
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

  it('"identificacion" resuelve al requerimiento de identificación (art. 16)', () => {
    expect(buscarSinonimoExacto('identificacion')).toContain('sc-identificacion-requerimiento');
    expect(buscarFts('identificacion')).toContain('sc-identificacion-requerimiento');
  });

  it('"botellon" resuelve al consumo de alcohol en la vía pública (art. 37.17)', () => {
    expect(buscarSinonimoExacto('botellon')).toContain('sc-consumo-alcohol-via-publica');
    expect(buscarFts('botellon')).toContain('sc-consumo-alcohol-via-publica');
  });

  it('"mena" resuelve a la entrada consultable de menor extranjero no acompañado', () => {
    expect(buscarSinonimoExacto('mena')).toContain('sc-mena-consulta');
    expect(buscarFts('mena')).toContain('sc-mena-consulta');
  });

  it('"derechos de la victima" resuelve a la entrada consultable de derechos de la víctima', () => {
    expect(buscarSinonimoExacto('derechos de la victima')).toContain('sc-derechos-victima');
    expect(buscarFts('derechos de la victima')).toContain('sc-derechos-victima');
  });

  it('"cacheo" y "entrada y registro" resuelven a la consulta de garantías de cacheo/registro', () => {
    expect(buscarSinonimoExacto('cacheo')).toContain('sc-cacheo-registro');
    expect(buscarSinonimoExacto('entrada y registro')).toContain('sc-cacheo-registro');
    expect(buscarFts('cacheo')).toContain('sc-cacheo-registro');
  });

  // Sinónimos de CALLE (validador-calle): que estas consultas salgan escribiendo como se habla en la
  // intervención, y que un futuro cambio no las tire en silencio.
  it('lenguaje de calle: "papeles" → requerimiento (art. 16), "se puso chulo" → negativa, "cachear" → cacheo', () => {
    expect(buscarSinonimoExacto('papeles')).toContain('sc-identificacion-requerimiento');
    expect(buscarSinonimoExacto('se puso chulo')).toContain('sc-negativa-identificarse');
    expect(buscarSinonimoExacto('cachear')).toContain('sc-cacheo-registro');
    expect(buscarSinonimoExacto('camper habitada')).toContain('sc-cacheo-registro');
  });

  // Ola de ARMAS: las consultas de calle de armas resuelven a su ficha nueva (paridad SPPLB).
  it('ola de armas: "pistola sin licencia", "licencia caducada", "pistola de fogueo" resuelven a su ficha', () => {
    expect(buscarSinonimoExacto('pistola sin licencia')).toContain('arma-sin-licencia-guia');
    expect(buscarSinonimoExacto('licencia caducada')).toContain('arma-licencia-guia-caducada');
    expect(buscarSinonimoExacto('pistola de fogueo')).toContain('arma-fogueo-aire-replica');
    expect(buscarSinonimoExacto('escopeta sin funda')).toContain('arma-transporte-indebido');
  });

  it('encuentra por número de artículo ("LOSC 36")', () => {
    // La consulta se tokeniza por el separador ".", así que "36" localiza los arts. 36.x de la
    // LO 4/2015 (la app debe pasar la consulta por normalizarBusqueda antes del MATCH).
    expect(buscarFts('losc 36')).toContain('sc-drogas-via-publica');
    expect(buscarFts('losc 37')).toContain('sc-falta-respeto-agente');
  });
});
