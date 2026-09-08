import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { FTS_PESOS_BM25_ORDENADOS, normalizarBusqueda } from '@agente/shared';
import { DatabaseSync } from './sqlite.js';
import { construirPaquete } from './buildPackage.js';
import { combinarSeeds } from './combinar.js';
import { SEED_TRAFICO } from '../seed/traficoSeed.js';
import { SEED_PENAL } from '../seed/penalSeed.js';
import { SEED_SEGURIDAD_CIUDADANA } from '../seed/seguridadCiudadanaSeed.js';
import { SEED_EXTRANJERIA_LOCAL } from '../seed/extranjeriaLocalSeed.js';
import { SEED_ORDENANZAS } from '../seed/ordenanzasSeed.js';
import { SEED_AUTONOMICO_CANARIAS } from '../seed/autonomicoCanariasSeed.js';

/**
 * Test de INTEGRACIÓN del contenido "de calle": combina todos los seeds (sin red, sin BOE),
 * construye el paquete como lo hará el CLI y comprueba que las consultas típicas de los tres
 * cuerpos —que antes salían vacías— ahora devuelven una infracción. Es la red que garantiza que
 * la demo al cofundador no encuentre huecos en los términos priorizados por los validadores.
 */

let dir: string;
let db: DatabaseSync;

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), 'agente-calle-'));
  const ruta = join(dir, 'contenido-calle.sqlite');
  // Se combinan TODOS los seeds que empaqueta el CLI, incluidas las capas MUNICIPAL (ordenanzas) y
  // AUTONÓMICA (Canarias), para que el buscador del test cubra el ocio nocturno y las licencias (T-7).
  const contenido = combinarSeeds(
    SEED_TRAFICO,
    SEED_PENAL,
    SEED_SEGURIDAD_CIUDADANA,
    SEED_EXTRANJERIA_LOCAL,
    SEED_ORDENANZAS,
    SEED_AUTONOMICO_CANARIAS,
  );
  construirPaquete(contenido, {
    rutaSalida: ruta,
    version: '0.1.0',
    fecha: '2026-09-07T00:00:00.000Z',
    changelog: { resumen: 'test integración de contenido de calle' },
  });
  db = new DatabaseSync(ruta, { readOnly: true });
});

afterAll(() => {
  db?.close();
  rmSync(dir, { recursive: true, force: true });
});

/** Búsqueda FTS con ranking bm25 ponderado por columna (misma consulta que la app). */
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

describe('contenido de calle: los términos priorizados por los validadores no salen vacíos', () => {
  const casos: Array<[string, string]> = [
    ['tacografo', 'inf-tacografo'],
    ['atentado', 'del-atentado-agente'],
    ['sin papeles', 'ext-estancia-irregular'],
    ['temeraria', 'inf-conduccion-temeraria'],
    // "doble fila" es el supuesto REAL de estacionamiento indebido grave (200 € + grúa). La "zona
    // azul"/ORA se comprueba aparte: ya NO debe enganchar esta ficha (Task 1, validación de calle).
    ['doble fila', 'inf-estacionamiento-indebido'],
    ['perro sin bozal', 'ppp-sin-bozal'],
    ['trafico de drogas', 'del-trafico-drogas'],
    // Fichas penales / seguridad ciudadana añadidas para la Policía Nacional (ronda validadores).
    ['malos tratos', 'del-violencia-genero'],
    ['violencia machista', 'del-violencia-genero'],
    ['disturbios', 'del-desordenes-publicos'],
    ['se resiste', 'del-resistencia-desobediencia'],
    ['estafa', 'del-estafa'],
    ['identificacion', 'sc-identificacion-requerimiento'],
    // Figuras penales nuevas (Guardia Civil rural + Policía Nacional): antes salían vacías.
    ['pasaporte falso', 'del-falsedad-documental'],
    ['coche robado', 'del-sustraccion-vehiculo'],
    ['okupas', 'del-usurpacion'],
    ['allanamiento', 'del-allanamiento-morada'],
    ['omision de socorro', 'del-omision-socorro'],
    ['arma de fuego', 'del-tenencia-armas'],
    // T-7: capa AUTONÓMICA (Ley 7/2011 de Canarias) resuelta contra el `.db` construido en el test.
    ['ocio nocturno', 'can-esp-horario-cierre'],
    ['sin licencia', 'can-esp-sin-licencia'],
    // Seguridad ciudadana y convivencia (LOSC 37.17, protección del menor) y ordenanzas municipales
    // (SCTF): consultas de calle que antes salían vacías para los tres cuerpos.
    ['botellon', 'sc-consumo-alcohol-via-publica'],
    ['mena', 'sc-mena-consulta'],
    // Consultas de garantías/derechos que la validación de Policía Nacional echó de menos.
    ['derechos de la victima', 'sc-derechos-victima'],
    ['cacheo', 'sc-cacheo-registro'],
    ['entrada y registro', 'sc-cacheo-registro'],
    ['terraza sin licencia', 'ord-sctf-terrazas'],
    ['zbe', 'ord-sctf-zbe'],
  ];

  for (const [consulta, esperado] of casos) {
    it(`"${consulta}" devuelve la infracción ${esperado}`, () => {
      const resultados = buscarFts(consulta);
      expect(resultados, consulta).toContain(esperado);
    });
  }

  // BLOQUEANTE (Task 1, Local): la "zona azul"/ORA NO puede enganchar la ficha ESTATAL grave de
  // 200 € + grúa. Es un exceso de estacionamiento regulado que rige la ORDENANZA municipal; sin
  // ella cargada, mejor "sin resultado" que un dato falso.
  it('"zona azul"/"ora"/"sin ticket" NO devuelven la ficha estatal de 200 € + grúa', () => {
    for (const q of ['zona azul', 'ora', 'sin ticket', 'ticket caducado', 'zona verde']) {
      expect(buscarFts(q), q).not.toContain('inf-estacionamiento-indebido');
    }
  });
});
