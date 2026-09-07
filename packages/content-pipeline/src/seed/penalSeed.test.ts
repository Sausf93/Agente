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
  it('siembra 13 delitos, todos por vía penal y sin importe administrativo', () => {
    expect(SEED_PENAL.infracciones).toHaveLength(13);
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

  it('conserva los artículos penales del CP (tráfico 380/383 + penal, incluidos VG 153/173, desórdenes 557, resistencia 556 y estafa 249)', () => {
    const numerosCp = combinado.articulos
      .filter((a) => a.normaId === 'BOE-A-1995-25444')
      .map((a) => a.numero)
      .sort();
    expect(numerosCp).toEqual([
      '147',
      '153',
      '169',
      '173.2',
      '234',
      '241',
      '242',
      '249',
      '263',
      '368',
      '380',
      '383',
      '468',
      '550',
      '556',
      '557',
    ]);
  });

  it('suma las infracciones de ambos seeds', () => {
    expect(combinado.infracciones).toHaveLength(
      SEED_TRAFICO.infracciones.length + SEED_PENAL.infracciones.length,
    );
  });
});
