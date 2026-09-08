import { describe, expect, it } from 'vitest';
import {
  CCAA_DE_AUTONOMICA,
  validarImporte,
  validarMinimosPublicacion,
} from '@agente/shared';
import {
  CCAA_CON_CONTENIDO_AUTONOMICO,
  SEED_AUTONOMICO_CANARIAS,
  TERRITORIO_CANARIAS,
} from './autonomicoCanariasSeed.js';

/**
 * Tests del SEED AUTONÓMICO (piloto Canarias): enganche territorial (el `territorioId` coincide con
 * el que fija el onboarding al elegir Policía Canaria), ámbito autonómico, marco `autonomico`,
 * mínimos de publicación y estado editorial `pendiente_revision`.
 */

const porId = (id: string) =>
  SEED_AUTONOMICO_CANARIAS.infracciones.find((i) => i.infraccion.id === id);
const idsArticulos = new Set(SEED_AUTONOMICO_CANARIAS.articulos.map((a) => a.id));

describe('SEED_AUTONOMICO_CANARIAS: enganche territorial (capa autonómica)', () => {
  it('el territorio del piloto coincide con la CCAA que fija el onboarding para Policía Canaria', () => {
    // El onboarding fija `ccaaId = CCAA_DE_AUTONOMICA.policia_canaria` al elegir Policía Canaria:
    // el seed DEBE usar el mismo id o el filtro territorial nunca engancharía en Canarias.
    expect(TERRITORIO_CANARIAS).toBe(CCAA_DE_AUTONOMICA.policia_canaria);
    expect(TERRITORIO_CANARIAS).toBe('es-ccaa-05');
    expect(CCAA_CON_CONTENIDO_AUTONOMICO.map((c) => c.territorioId)).toContain(TERRITORIO_CANARIAS);
  });

  it('todas las normas son leyes AUTONÓMICAS ligadas al territorio de Canarias', () => {
    expect(SEED_AUTONOMICO_CANARIAS.normas.length).toBeGreaterThanOrEqual(4);
    for (const n of SEED_AUTONOMICO_CANARIAS.normas) {
      expect(n.ambito, n.codigo).toBe('autonomico');
      expect(n.territorioId, n.codigo).toBe(TERRITORIO_CANARIAS);
      // Relevancia: la lleva la Policía Canaria (autonómica) y la Local, no la GC/PN.
      expect(n.cuerpos, n.codigo).toContain('policia_autonomica');
      expect(n.cuerpos, n.codigo).toContain('policia_local');
      expect(n.cuerpos, n.codigo).not.toContain('policia_nacional');
      expect(n.cuerpos, n.codigo).not.toContain('guardia_civil');
    }
  });

  it('todas las infracciones son autonómicas y con el territorio de Canarias', () => {
    expect(SEED_AUTONOMICO_CANARIAS.infracciones.length).toBeGreaterThanOrEqual(4);
    for (const { infraccion } of SEED_AUTONOMICO_CANARIAS.infracciones) {
      expect(infraccion.ambito, infraccion.id).toBe('autonomico');
      expect(infraccion.territorioId, infraccion.id).toBe(TERRITORIO_CANARIAS);
      expect(infraccion.tipo, infraccion.id).toBe('administrativa');
      expect(infraccion.competencia.cuerpos, infraccion.id).toContain('policia_autonomica');
    }
  });
});

describe('SEED_AUTONOMICO_CANARIAS: calidad de contenido (§8.3)', () => {
  it('cada infracción cita un artículo del seed y tiene ≥2 sinónimos', () => {
    for (const { infraccion, sinonimos } of SEED_AUTONOMICO_CANARIAS.infracciones) {
      expect(idsArticulos.has(infraccion.articuloId), infraccion.id).toBe(true);
      expect(sinonimos.length, infraccion.id).toBeGreaterThanOrEqual(2);
    }
  });

  it('cada importe valida en el marco autonómico y supera los mínimos de publicación', () => {
    for (const { infraccion, sinonimos, marcoImporte } of SEED_AUTONOMICO_CANARIAS.infracciones) {
      expect(marcoImporte, infraccion.id).toBe('autonomico');
      expect(validarImporte(infraccion, marcoImporte), infraccion.id).toEqual([]);
      expect(validarMinimosPublicacion(infraccion, sinonimos.length), infraccion.id).toEqual([]);
    }
  });

  it('las cuantías verificadas se toman del mínimo del tramo (Ley 7/2011 art. 66)', () => {
    // Graves: 3.001–15.000 €; muy graves: 15.001–30.000 €. El seed fija el mínimo del tramo.
    for (const { infraccion } of SEED_AUTONOMICO_CANARIAS.infracciones) {
      if (infraccion.gravedad === 'grave') expect(infraccion.importeEur, infraccion.id).toBe(3001);
      if (infraccion.gravedad === 'muy_grave')
        expect(infraccion.importeEur, infraccion.id).toBe(15001);
    }
  });

  it('NADA se autopublica: todo queda pendiente_revision con su nota "a verificar"', () => {
    for (const item of SEED_AUTONOMICO_CANARIAS.infracciones) {
      expect(item.revision, item.infraccion.id).toBe('pendiente_revision');
      expect(item.notaRevision.length, item.infraccion.id).toBeGreaterThan(20);
      expect(item.notaRevision.toLowerCase(), item.infraccion.id).toContain('verificar');
    }
  });
});

describe('SEED_AUTONOMICO_CANARIAS: cobertura de lo más útil en Canarias', () => {
  it('siembra las leyes de espectáculos, animales y policía canaria', () => {
    const codigos = SEED_AUTONOMICO_CANARIAS.normas.map((n) => n.codigo);
    expect(codigos).toContain('CAN-ESP'); // Ley 7/2011 espectáculos
    expect(codigos).toContain('CAN-ANIM'); // Ley 8/1991 animales
    expect(codigos).toContain('CAN-CPL'); // Ley 6/1997 coordinación policías locales
    expect(codigos).toContain('CAN-PCAN'); // Ley 2/2008 Cuerpo General de la Policía Canaria
  });

  it('cubre horario de cierre / ocio nocturno y actividad sin licencia', () => {
    expect(porId('can-esp-horario-cierre')).toBeDefined();
    expect(porId('can-esp-sin-licencia')).toBeDefined();
    const terminos = SEED_AUTONOMICO_CANARIAS.infracciones.flatMap((i) =>
      i.sinonimos.map((s) => s.termino),
    );
    expect(terminos).toContain('ocio nocturno');
    expect(terminos).toContain('espectaculos canarias');
  });
});
