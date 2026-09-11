import { describe, expect, it } from 'vitest';
import { PIE_DETENCION, validarImporte, validarMinimosPublicacion } from '@agente/shared';
import { SEED_PENAL } from './penalSeed.js';
import { SEED_TRAFICO } from './traficoSeed.js';
import { combinarSeeds } from '../paquete/combinar.js';

/**
 * Tests del SEED PENAL: garantizan que cada delito es coherente (vía penal, sin importe), que
 * cita un artículo del propio seed, que su consecuencia de detención sale del motor con lenguaje
 * ORIENTATIVO, fuente y pie fijo, y que la combinación con el seed de tráfico no duplica la
 * norma CP (misma clave primaria).
 */

const idsArticulos = new Set(SEED_PENAL.articulos.map((a) => a.id));
const porId = (id: string) => SEED_PENAL.infracciones.find((i) => i.infraccion.id === id);

describe('SEED_PENAL: integridad de los delitos', () => {
  it('siembra 41 delitos, todos por vía penal y sin importe administrativo', () => {
    expect(SEED_PENAL.infracciones).toHaveLength(41);
    for (const { infraccion } of SEED_PENAL.infracciones) {
      expect(infraccion.tipo, infraccion.id).toBe('penal');
      expect(infraccion.gravedad, infraccion.id).toBe('delito');
      expect(infraccion.importeEur, infraccion.id).toBeNull();
      expect(infraccion.puntos, infraccion.id).toBeNull();
    }
  });

  it('cada delito cita un artículo del CP existente en el seed y tiene ≥3 sinónimos', () => {
    for (const { infraccion, sinonimos } of SEED_PENAL.infracciones) {
      expect(idsArticulos.has(infraccion.articuloId), infraccion.id).toBe(true);
      expect(sinonimos.length, infraccion.id).toBeGreaterThanOrEqual(3);
    }
  });

  it('todos quedan pendientes de revisión con nota "a verificar"', () => {
    for (const item of SEED_PENAL.infracciones) {
      expect(item.revision, item.infraccion.id).toBe('pendiente_revision');
      expect(item.notaRevision.toUpperCase()).toContain('A VERIFICAR');
    }
  });

  it('cada delito supera los mínimos de publicación y valida el importe (marco penal)', () => {
    for (const { infraccion, sinonimos, marcoImporte } of SEED_PENAL.infracciones) {
      expect(marcoImporte).toBe('penal');
      expect(validarImporte(infraccion, marcoImporte)).toEqual([]);
      expect(validarMinimosPublicacion(infraccion, sinonimos.length)).toEqual([]);
    }
  });
});

describe('SEED_PENAL: consecuencia de detención (motor LECrim, §4.6)', () => {
  it('cada delito tiene exactamente una consecuencia de tipo detencion, orientativa y con pie', () => {
    for (const item of SEED_PENAL.infracciones) {
      const dets = item.consecuencias.filter((c) => c.tipo === 'detencion');
      expect(dets, item.infraccion.id).toHaveLength(1);
      const c = dets[0]!;
      // Lenguaje orientativo, NUNCA imperativo.
      expect(c.textoCorto.toLowerCase()).toMatch(/procede|puede/);
      expect(c.textoCorto.toLowerCase()).not.toMatch(/\bdetén\b|\bdetenga\b/);
      // Fuente con el artículo del CP y con la LECrim; pie de responsabilidad fijo.
      expect(c.fuente).toMatch(/CP art\./);
      expect(c.fuente).toMatch(/LECrim art\./);
      expect(c.textoCorto).toContain(PIE_DETENCION);
    }
  });

  it('hurto (delito leve) → la detención se rige por el art. 495 (no procede salvo excepción)', () => {
    const hurto = porId('del-hurto');
    expect(hurto).toBeDefined();
    const det = hurto!.consecuencias.find((c) => c.tipo === 'detencion')!;
    expect(det.regla.orientacionBase).toBe('no_procede_salvo');
    expect(det.fuente).toMatch(/LECrim art\. 495/);
    expect(det.textoCorto.toLowerCase()).toContain('no procede');
  });

  it('robo, lesiones y quebrantamiento (menos grave) flagrantes → procede (art. 490)', () => {
    for (const id of ['del-robo-violencia', 'del-lesiones', 'del-quebrantamiento']) {
      const item = porId(id);
      expect(item, id).toBeDefined();
      const det = item!.consecuencias.find((c) => c.tipo === 'detencion')!;
      expect(det.regla.orientacionBase, id).toBe('procede');
      expect(det.fuente, id).toMatch(/LECrim art\. 490/);
    }
  });
});

describe('SEED_PENAL: fichas nuevas para la Policía Nacional (VG, orden público, estafa)', () => {
  it('cada ficha nueva tiene artículo del CP, pena legible, gravedad penal y detención flagrante', () => {
    for (const id of [
      'del-violencia-genero',
      'del-desordenes-publicos',
      'del-resistencia-desobediencia',
      'del-estafa',
    ]) {
      const item = porId(id);
      expect(item, id).toBeDefined();
      // Artículo fuente presente en el seed.
      expect(idsArticulos.has(item!.infraccion.articuloId), id).toBe(true);
      // Marco penal: pena legible + gravedad del art. 33 CP (no importe administrativo).
      expect(item!.infraccion.penaTexto, id).toBeTruthy();
      expect(item!.infraccion.gravedadPenal, id).toBe('menos_grave');
      expect(item!.infraccion.importeEur, id).toBeNull();
      // Detención flagrante (menos grave) → procede, con fuente LECrim 490, lenguaje orientativo.
      const det = item!.consecuencias.find((c) => c.tipo === 'detencion')!;
      expect(det.regla.orientacionBase, id).toBe('procede');
      expect(det.fuente, id).toMatch(/LECrim art\. 490/);
      expect(det.textoCorto.toLowerCase(), id).toMatch(/procede|puede/);
    }
  });

  it('violencia de género: mensaje operativo de protección de la víctima y distinción 153.1/173.2', () => {
    const vg = porId('del-violencia-genero');
    expect(vg).toBeDefined();
    const texto = vg!.infraccion.textoBoletin;
    // Medidas de protección de la víctima (orden de protección, arts. 544 bis/ter LECrim) y VioGén.
    expect(texto).toMatch(/544/);
    expect(texto.toLowerCase()).toMatch(/protecci/);
    expect(texto.toLowerCase()).toMatch(/viogen|vpr|riesgo/);
    // Las medidas/detención las acuerda o ratifica la autoridad judicial (no imperativo).
    expect(texto.toLowerCase()).toMatch(/autoridad judicial/);
    // Distingue el acto único (153.1) de la habitualidad (173.2).
    expect(vg!.notaRevision).toMatch(/153\.1/);
    expect(vg!.notaRevision).toMatch(/173\.2/);
  });

  it('violencia de género: consecuencia `proteccion` DESTACADA (orden de protección + valoración de riesgo)', () => {
    const vg = porId('del-violencia-genero');
    expect(vg).toBeDefined();
    const prot = vg!.consecuencias.find((c) => c.tipo === 'proteccion');
    expect(prot, 'debe existir una consecuencia proteccion').toBeDefined();
    // Fuente en la LECrim (arts. 544 bis/ter) y valoración de riesgo (VPR/VioGén).
    expect(prot!.fuente).toMatch(/544/);
    expect(prot!.textoCorto.toLowerCase()).toMatch(/protecci/);
    expect(prot!.textoCorto.toLowerCase()).toMatch(/viogen|vpr|riesgo/);
    // Orientativa: la acuerda o ratifica la autoridad judicial (no imperativo).
    expect(prot!.textoCorto.toLowerCase()).toMatch(/procede|puede/);
    expect(prot!.textoCorto.toLowerCase()).toMatch(/autoridad judicial/);
  });

  it('violencia de género: sinónimos de habitualidad (173.2) para el buscador', () => {
    const vg = porId('del-violencia-genero');
    const terminos = vg!.sinonimos.map((s) => s.termino);
    expect(terminos).toContain('violencia habitual');
    expect(terminos).toContain('173.2');
  });

  it('desórdenes públicos (art. 557): redacción vigente (LO 14/2022) con violencia o intimidación y agravado por multitud', () => {
    const des = porId('del-desordenes-publicos');
    expect(des).toBeDefined();
    const texto = des!.infraccion.textoBoletin.toLowerCase();
    // Redacción vigente: "actos de violencia o intimidación" (no la redacción pre-reforma).
    expect(texto).toMatch(/violencia o intimidaci[oó]n/);
    // Base menos grave (art. 557.1) y modalidad agravada por multitud (art. 557.2).
    expect(texto).toMatch(/557\.1/);
    expect(texto).toMatch(/557\.2/);
    expect(des!.infraccion.gravedadPenal).toBe('menos_grave');
    // El artículo del CP también refleja la redacción vigente.
    const art557 = SEED_PENAL.articulos.find((a) => a.numero === '557')!;
    expect(art557.texto.toLowerCase()).toMatch(/violencia o intimidaci[oó]n/);
    expect(art557.texto).toMatch(/tres a cinco años/);
  });
});

describe('SEED_PENAL: fichas penales nuevas (falsedad, vehículo, usurpación, allanamiento, socorro, armas)', () => {
  const NUEVAS = [
    'del-falsedad-documental',
    'del-sustraccion-vehiculo',
    'del-usurpacion',
    'del-allanamiento-morada',
    'del-omision-socorro',
    'del-tenencia-armas',
  ];

  it('cada ficha nueva es penal, cita su artículo del CP, tiene marco penal y dispara detención', () => {
    for (const id of NUEVAS) {
      const item = porId(id);
      expect(item, id).toBeDefined();
      // Vía penal, delito, sin importe administrativo.
      expect(item!.infraccion.tipo, id).toBe('penal');
      expect(item!.infraccion.gravedad, id).toBe('delito');
      expect(item!.infraccion.importeEur, id).toBeNull();
      expect(item!.marcoImporte, id).toBe('penal');
      // Artículo fuente presente en el seed y pena legible + gravedad penal (art. 33 CP).
      expect(idsArticulos.has(item!.infraccion.articuloId), id).toBe(true);
      expect(item!.infraccion.penaTexto, id).toBeTruthy();
      expect(item!.infraccion.gravedadPenal, id).toBeTruthy();
      // Detención generada por el motor: gravedadPenal presente en la regla + lenguaje orientativo.
      const det = item!.consecuencias.find((c) => c.tipo === 'detencion')!;
      expect(det, id).toBeDefined();
      expect(det.regla.gravedadCp, id).toBe(item!.infraccion.gravedadPenal);
      expect(det.textoCorto.toLowerCase(), id).toMatch(/procede|puede/);
      expect(det.textoCorto.toLowerCase(), id).not.toMatch(/\bdetén\b|\bdetenga\b/);
      expect(det.fuente, id).toMatch(/LECrim art\./);
      // Pendiente de revisión con nota "a verificar".
      expect(item!.revision, id).toBe('pendiente_revision');
      expect(item!.notaRevision.toUpperCase(), id).toContain('A VERIFICAR');
    }
  });

  it('las figuras menos graves flagrantes orientan a que PROCEDE (art. 490); la usurpación pacífica es LEVE (art. 495)', () => {
    for (const id of [
      'del-falsedad-documental',
      'del-sustraccion-vehiculo',
      'del-allanamiento-morada',
      'del-omision-socorro',
      'del-tenencia-armas',
    ]) {
      const det = porId(id)!.consecuencias.find((c) => c.tipo === 'detencion')!;
      expect(det.regla.orientacionBase, id).toBe('procede');
      expect(det.fuente, id).toMatch(/LECrim art\. 490/);
    }
    // Ocupación pacífica del art. 245.2 CP → delito leve → detención regida por el art. 495 LECrim.
    const usurp = porId('del-usurpacion')!.consecuencias.find((c) => c.tipo === 'detencion')!;
    expect(usurp.regla.orientacionBase).toBe('no_procede_salvo');
    expect(usurp.fuente).toMatch(/LECrim art\. 495/);
  });

  it('falsedad y tenencia de armas intervienen el efecto (decomiso, art. 127 CP); el vehículo recuperado va a depósito', () => {
    for (const id of ['del-falsedad-documental', 'del-tenencia-armas']) {
      const dec = porId(id)!.consecuencias.find((c) => c.tipo === 'decomiso');
      expect(dec, id).toBeDefined();
      expect(dec!.fuente, id).toMatch(/127/);
      expect(dec!.textoCorto.toLowerCase(), id).toMatch(/procede/);
    }
    const dep = porId('del-sustraccion-vehiculo')!.consecuencias.find((c) => c.tipo === 'deposito');
    expect(dep, 'vehículo recuperado → depósito').toBeDefined();
    expect(dep!.textoCorto.toLowerCase()).toMatch(/requisitor|sustra/);
  });

  it('el textoBoletin explica la frontera con las figuras vecinas', () => {
    // Usurpación 245 vs allanamiento 202 vs leve 37.7 LOSC.
    const usurp = porId('del-usurpacion')!.infraccion.textoBoletin;
    expect(usurp).toMatch(/202/);
    expect(usurp).toMatch(/37\.7/);
    // Allanamiento 202 (morada) vs usurpación 245 (no morada).
    expect(porId('del-allanamiento-morada')!.infraccion.textoBoletin).toMatch(/245/);
    // Tenencia penal 563/564 vs administrativa 36.10 LOSC.
    const armas = porId('del-tenencia-armas')!.infraccion.textoBoletin;
    expect(armas).toMatch(/36\.10/);
    expect(armas).toMatch(/563/);
  });

  it('los sinónimos clave de calle resuelven a su ficha', () => {
    const casos: Array<[string, string]> = [
      ['pasaporte falso', 'del-falsedad-documental'],
      ['coche robado', 'del-sustraccion-vehiculo'],
      ['okupas', 'del-usurpacion'],
      ['allanamiento', 'del-allanamiento-morada'],
      ['omision de socorro', 'del-omision-socorro'],
      ['arma de fuego', 'del-tenencia-armas'],
    ];
    for (const [termino, id] of casos) {
      const terminos = porId(id)!.sinonimos.map((s) => s.termino);
      expect(terminos, `${termino} → ${id}`).toContain(termino);
    }
  });
});

describe('combinarSeeds: tráfico + penal sin duplicar la norma CP', () => {
  const combinado = combinarSeeds(SEED_TRAFICO, SEED_PENAL);

  it('la norma CP aparece una sola vez', () => {
    const cp = combinado.normas.filter((n) => n.codigo === 'CP');
    expect(cp).toHaveLength(1);
  });

  it('no hay ids de norma ni de artículo duplicados', () => {
    const normaIds = combinado.normas.map((n) => n.id);
    const artIds = combinado.articulos.map((a) => a.id);
    expect(new Set(normaIds).size).toBe(normaIds.length);
    expect(new Set(artIds).size).toBe(artIds.length);
  });

  it('conserva los artículos penales del CP (tráfico + penal, incluidas las figuras nuevas 195/202/244/245/392/564)', () => {
    const numerosCp = combinado.articulos
      .filter((a) => a.normaId === 'BOE-A-1995-25444')
      .map((a) => a.numero)
      .sort();
    expect(numerosCp).toEqual([
      '138',
      '139',
      '147',
      '148',
      '153',
      '163',
      '169',
      '172',
      '172 ter',
      '173.1',
      '173.2',
      '174',
      '178',
      '181',
      '183',
      '185',
      '189',
      '195',
      '197',
      '202',
      '203',
      '225 bis',
      '234',
      '241',
      '242',
      '244',
      '245',
      '249',
      '263',
      '298',
      '340 bis',
      '368',
      '379.1',
      '379.2',
      '380',
      '381',
      '382 bis',
      '383',
      '384',
      '392',
      '402',
      '457',
      '468',
      '510',
      '550',
      '556',
      '557',
      '564',
    ]);
  });

  it('suma las infracciones de ambos seeds', () => {
    expect(combinado.infracciones).toHaveLength(
      SEED_TRAFICO.infracciones.length + SEED_PENAL.infracciones.length,
    );
  });
});
