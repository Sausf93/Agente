import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { SqlRunner } from '@/db/sqlRunner';
import {
  agruparPorAmbito,
  cargarArticulo,
  contarPorMateria,
  filtrarArticulos,
  listarArticulos,
  agruparPorSubtema,
  listarCcaaConContenido,
  listarInfraccionesDeMateria,
  listarMunicipiosConOrdenanza,
  listarNormas,
  materiaDeNorma,
  subtemaDeInfraccion,
} from './normas';

/** Cadena territorial de un Policía Local de Santa Cruz de Tenerife (Canarias). */
const CADENA_SCTF = ['es-ccaa-05', 'es-prov-38', 'mun-santa-cruz-de-tenerife'];
/** Cadena de un Local de otro municipio (para comprobar que NO ve la ordenanza ajena). */
const CADENA_OTRO_MUNICIPIO = ['es-ccaa-05', 'es-prov-38', 'mun-la-laguna'];
/** Cadena de un Policía Canaria (autonómico): solo la CCAA de Canarias, sin municipio. */
const CADENA_CANARIAS = ['es-ccaa-05'];
/** Cadena de un agente de OTRA CCAA (Madrid): no debe ver NADA de Canarias. */
const CADENA_MADRID = ['es-ccaa-13', 'es-prov-28', 'mun-madrid'];

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

  // La navegación por materia debe mostrar FICHAS, no solo leyes: "Seguridad ciudadana" tiene una
  // sola norma (LOSC) pero muchos tipos, y sin las fichas parecía vacía (feedback del fundador).
  it('listarInfraccionesDeMateria: Seguridad ciudadana trae varias fichas (no está vacía)', async () => {
    const fichas = await listarInfraccionesDeMateria(runner, 'seguridad', CADENA_CANARIAS);
    expect(fichas.length).toBeGreaterThan(3);
    for (const f of fichas) {
      expect(materiaDeNorma(f.normaCodigo)).toBe('seguridad');
      expect(f.tituloCorto.length).toBeGreaterThan(0);
    }
  });

  it('listarInfraccionesDeMateria: Tráfico también trae fichas y todas son de su materia', async () => {
    const fichas = await listarInfraccionesDeMateria(runner, 'trafico', CADENA_CANARIAS);
    expect(fichas.length).toBeGreaterThan(10);
    expect(fichas.every((f) => materiaDeNorma(f.normaCodigo) === 'trafico')).toBe(true);
  });

  // Submenús estilo SPPLB: toda ficha ESTATAL de las materias densas está clasificada en un sub-tema
  // (guarda anti-olvido al añadir fichas nuevas) y ningún grupo visible queda por debajo de 3 (regla
  // anti-vacío de docs/paridad-spplb.md). Se usa cadena vacía → solo lo estatal (lo mapeado a mano).
  it.each(['trafico', 'penal', 'seguridad'] as const)(
    'sub-temas de %s: cobertura completa y ningún grupo con <3 fichas',
    async (materia) => {
      const fichas = await listarInfraccionesDeMateria(runner, materia, []);
      expect(fichas.length, materia).toBeGreaterThan(0);
      const sinTema = fichas.filter((f) => subtemaDeInfraccion(f.id) === null).map((f) => f.id);
      expect(sinTema, `fichas sin sub-tema en ${materia}`).toEqual([]);
      const grupos = agruparPorSubtema(fichas, materia);
      expect(grupos.length, materia).toBeGreaterThan(1);
      for (const g of grupos) {
        expect(g.fichas.length, `${materia}/${g.key}`).toBeGreaterThanOrEqual(3);
      }
      const total = grupos.reduce((n, g) => n + g.fichas.length, 0);
      expect(total, `todas las fichas de ${materia} caen en un grupo`).toBe(fichas.length);
    },
  );

  it('listarNormas trae las normas de tráfico con recuento de artículos', async () => {
    const normas = await listarNormas(runner);
    const codigos = normas.map((n) => n.codigo);
    expect(codigos).toContain('RGC');
    expect(codigos).toContain('LSV');
    const rgc = normas.find((n) => n.codigo === 'RGC');
    expect(rgc?.numArticulos).toBeGreaterThan(200);
    expect(rgc?.urlBoe).toMatch(/boe\.es/);
    // El campo `cuerpos` viaja desde el paquete: el RGC (tráfico) NO incluye a la Policía Nacional,
    // pero sí a la Guardia Civil; el Código Penal (penal) es relevante para todos los cuerpos.
    expect(rgc?.cuerpos).toContain('guardia_civil');
    expect(rgc?.cuerpos).not.toContain('policia_nacional');
    const cp = normas.find((n) => n.codigo === 'CP');
    expect(cp?.cuerpos).toContain('policia_nacional');
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

  it('el filtro territorial NO fuga la ordenanza municipal a quien no es de ese municipio', async () => {
    // Sin cadena: solo estatal (ninguna municipal).
    const estatales = await listarNormas(runner);
    expect(estatales.every((n) => n.ambito !== 'municipal')).toBe(true);
    expect(estatales.some((n) => n.codigo === 'RGC')).toBe(true);

    // Local de OTRO municipio: sigue sin ver la ordenanza de Santa Cruz.
    const otro = await listarNormas(runner, CADENA_OTRO_MUNICIPIO);
    expect(otro.every((n) => n.ambito !== 'municipal')).toBe(true);
  });

  it('un Local de Santa Cruz de Tenerife SÍ ve su ordenanza municipal', async () => {
    const normas = await listarNormas(runner, CADENA_SCTF);
    const municipales = normas.filter((n) => n.ambito === 'municipal');
    expect(municipales.length).toBeGreaterThan(0);
    for (const m of municipales) {
      expect(m.tipo).toBe('ordenanza');
      expect(m.territorioId).toBe('mun-santa-cruz-de-tenerife');
    }
    // Y sigue viendo lo estatal (RGC) junto a la ordenanza.
    expect(normas.some((n) => n.codigo === 'RGC')).toBe(true);
  });

  it('listarMunicipiosConOrdenanza expone el municipio del piloto', async () => {
    const municipios = await listarMunicipiosConOrdenanza(runner);
    expect(municipios).toContain('mun-santa-cruz-de-tenerife');
  });

  // CAPA AUTONÓMICA (piloto Canarias, ADR-006/008): las leyes CAN-* solo las ve quien tiene Canarias
  // en su cadena; un agente de otra CCAA nunca. Mismo contrato territorial que la capa municipal.
  it('un perfil de Canarias (autonómico) VE las leyes autonómicas canarias (CAN-*)', async () => {
    const normas = await listarNormas(runner, CADENA_CANARIAS);
    const codigos = normas.map((n) => n.codigo);
    expect(codigos).toContain('CAN-ESP'); // Ley 7/2011 de espectáculos
    const autonomicasCan = normas.filter(
      (n) => n.ambito === 'autonomico' && n.territorioId === 'es-ccaa-05',
    );
    expect(autonomicasCan.length).toBeGreaterThan(0);
    // Sigue viendo lo estatal (RGC) junto a lo autonómico.
    expect(codigos).toContain('RGC');
  });

  it('un perfil de OTRA CCAA (Madrid) NO ve ninguna norma canaria', async () => {
    const normas = await listarNormas(runner, CADENA_MADRID);
    expect(normas.some((n) => n.codigo.startsWith('CAN-'))).toBe(false);
    expect(normas.every((n) => n.territorioId !== 'es-ccaa-05')).toBe(true);
    // Pero sí ve lo estatal.
    expect(normas.some((n) => n.codigo === 'RGC')).toBe(true);
  });

  // T-5: un LOCAL canario (CCAA + provincia + municipio) ve SIMULTÁNEAMENTE las TRES capas: lo
  // estatal (RGC), su ordenanza municipal (SCTF) y las leyes autonómicas canarias (CAN-*).
  it('T-5 · un Local de SCTF ve a la vez lo estatal (RGC), su ordenanza (SCTF) y lo autonómico (CAN-*)', async () => {
    const normas = await listarNormas(runner, CADENA_SCTF);
    // Estatal.
    expect(normas.some((n) => n.codigo === 'RGC' && n.ambito === 'estatal')).toBe(true);
    // Municipal (ordenanza del propio municipio).
    expect(
      normas.some(
        (n) => n.ambito === 'municipal' && n.territorioId === 'mun-santa-cruz-de-tenerife',
      ),
    ).toBe(true);
    // Autonómico (leyes canarias CAN-*).
    expect(
      normas.some(
        (n) =>
          n.codigo.startsWith('CAN-') && n.ambito === 'autonomico' && n.territorioId === 'es-ccaa-05',
      ),
    ).toBe(true);
  });

  // T-6: fuga cruzada. Autonómico y municipal son capas INDEPENDIENTES.
  it('T-6 · Madrid con municipio propio NO ve CAN-* ni la ordenanza de SCTF', async () => {
    const normas = await listarNormas(runner, CADENA_MADRID);
    expect(normas.some((n) => n.codigo.startsWith('CAN-'))).toBe(false);
    expect(normas.some((n) => n.territorioId === 'mun-santa-cruz-de-tenerife')).toBe(false);
    expect(normas.some((n) => n.codigo === 'RGC')).toBe(true);
  });

  it('T-6 · un canario SIN municipio ve CAN-* pero NO la ordenanza municipal de SCTF', async () => {
    const normas = await listarNormas(runner, CADENA_CANARIAS);
    // Ve lo autonómico canario.
    expect(normas.some((n) => n.codigo.startsWith('CAN-'))).toBe(true);
    // Pero NO la ordenanza municipal de SCTF (no tiene municipio en su cadena).
    expect(normas.some((n) => n.territorioId === 'mun-santa-cruz-de-tenerife')).toBe(false);
    expect(normas.every((n) => n.ambito !== 'municipal')).toBe(true);
  });

  // Honestidad de la capa AUTONÓMICA (Task 4): `listarCcaaConContenido` expone SOLO las CCAA con
  // normativa autonómica sembrada (piloto: Canarias). Una CCAA que no está en la lista es el estado
  // "no disponible → solicitar la normativa de mi comunidad" (banner honesto), no un vacío mudo.
  it('listarCcaaConContenido expone Canarias y NO otras CCAA sin contenido (estado "no disponible")', async () => {
    const ccaas = await listarCcaaConContenido(runner);
    expect(ccaas).toContain('es-ccaa-05'); // Canarias, con Ley 7/2011 cargada
    // Madrid (es-ccaa-13) no tiene normativa autonómica sembrada: cae al estado "no disponible".
    expect(ccaas).not.toContain('es-ccaa-13');
  });

  // NAVEGACIÓN POR MATERIA (rediseño estilo SPPLB): la clasificación por materia (mapa interino en
  // la app) debe cubrir TODAS las normas del paquete real, sin caer ninguna en "otras".
  it('ninguna norma del paquete real cae en la materia "otras"', async () => {
    const todas = await listarNormas(runner, CADENA_SCTF);
    const enOtras = todas.filter((n) => materiaDeNorma(n.codigo) === 'otras');
    expect(enOtras.map((n) => n.codigo)).toEqual([]);
  });

  it('un Local de SCTF ve las materias con sus normas territoriales dentro (CAN-* y OM-*)', async () => {
    const normas = await listarNormas(runner, CADENA_SCTF);
    const materias = contarPorMateria(normas);
    const porMateria = new Map(materias.map((m) => [m.materia, m.count]));

    // Tráfico contiene el codificado estatal Y la ordenanza municipal de circulación/ZBE.
    expect(porMateria.get('trafico') ?? 0).toBeGreaterThan(0);
    const trafico = normas.filter((n) => materiaDeNorma(n.codigo) === 'trafico');
    expect(trafico.some((n) => n.codigo === 'RGC' && n.ambito === 'estatal')).toBe(true);
    expect(trafico.some((n) => n.ambito === 'municipal')).toBe(true);

    // Ocio (espectáculos/convivencia) reúne la ley canaria de espectáculos y las ordenanzas de
    // ruidos/terrazas: al menos una autonómica y una municipal.
    const ocio = normas.filter((n) => materiaDeNorma(n.codigo) === 'ocio');
    expect(ocio.some((n) => n.codigo === 'CAN-ESP' && n.ambito === 'autonomico')).toBe(true);
    expect(ocio.some((n) => n.ambito === 'municipal')).toBe(true);

    // Organización policial es exclusivamente autonómica canaria (CAN-CPL / CAN-PCAN).
    const organizacion = normas.filter((n) => materiaDeNorma(n.codigo) === 'organizacion');
    expect(organizacion.length).toBeGreaterThan(0);
    expect(organizacion.every((n) => n.ambito === 'autonomico')).toBe(true);
  });

  it('agruparPorAmbito de una materia mixta ordena estatal → autonómico → municipal', async () => {
    const normas = await listarNormas(runner, CADENA_SCTF);
    const animales = normas.filter((n) => materiaDeNorma(n.codigo) === 'animales');
    const secciones = agruparPorAmbito(animales);
    const ambitos = secciones.map((s) => s.ambito);
    // El orden es el fijado; y no debe repetirse ni aparecer un ámbito vacío.
    expect(ambitos).toEqual([...ambitos].filter((a, i) => ambitos.indexOf(a) === i));
    const orden = ['estatal', 'autonomico', 'municipal'];
    const indices = ambitos.map((a) => orden.indexOf(a));
    expect(indices).toEqual([...indices].sort((a, b) => a - b));
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
