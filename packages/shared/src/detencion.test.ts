import { describe, expect, it } from 'vitest';
import {
  EntradaDetencion,
  PIE_DETENCION,
  evaluarDetencion,
  textoConsecuenciaDetencion,
  type GravedadPenal,
} from './index.js';

/**
 * Tests del MOTOR DE DETENCIÓN (LECrim), núcleo crítico → cobertura exhaustiva de todas las
 * ramas del árbol (art. 490 / 492 / 493 / 495 y gravedad de la pena, art. 33 CP) y garantía
 * de las reglas no negociables: lenguaje ORIENTATIVO (nunca imperativo), FUENTES siempre y PIE
 * de responsabilidad fijo en cada salida.
 */

/** Circunstancias todas a `false`/por defecto para una gravedad dada. */
const base = (gravedadCp: GravedadPenal): EntradaDetencion => ({ gravedadCp });

describe('evaluarDetencion — DELITO LEVE (art. 495 rige sobre el 490)', () => {
  it('sin domicilio conocido ni fianza → puede proceder (excepción del 495)', () => {
    const r = evaluarDetencion({
      gravedadCp: 'leve',
      domicilioConocido: false,
      prestariaFianza: false,
    });
    expect(r.orientacion).toBe('puede_proceder');
    expect(r.fuentes).toEqual(['CP art. 33', 'LECrim art. 495']);
  });

  it('con domicilio conocido → no procede salvo excepción (identificar y dar cuenta)', () => {
    const r = evaluarDetencion({ gravedadCp: 'leve', domicilioConocido: true });
    expect(r.orientacion).toBe('no_procede_salvo');
    expect(r.fuentes).toContain('LECrim art. 495');
    expect(r.fuentes).toContain('LECrim art. 493');
  });

  it('sin domicilio pero prestaría fianza → no procede (excepción incompleta)', () => {
    const r = evaluarDetencion({
      gravedadCp: 'leve',
      domicilioConocido: false,
      prestariaFianza: true,
    });
    expect(r.orientacion).toBe('no_procede_salvo');
  });

  it('la flagrancia NO abre la detención en delito leve (495 se impone al 490)', () => {
    const r = evaluarDetencion({
      gravedadCp: 'leve',
      flagrancia: true,
      domicilioConocido: true,
    });
    expect(r.orientacion).toBe('no_procede_salvo');
    // No debe citar el 490: en delito leve la vía es el 495.
    expect(r.fuentes).not.toContain('LECrim art. 490');
  });
});

describe('evaluarDetencion — MENOS GRAVE / GRAVE con causa del art. 490 → procede', () => {
  const gravedades: GravedadPenal[] = ['menos_grave', 'grave'];
  for (const g of gravedades) {
    it(`${g}: flagrancia → procede (deber de detener, 492.1)`, () => {
      const r = evaluarDetencion({ gravedadCp: g, flagrancia: true });
      expect(r.orientacion).toBe('procede');
      expect(r.fuentes).toEqual(['LECrim art. 490', 'LECrim art. 492.1']);
      expect(r.motivo).toMatch(/flagrante/);
    });

    it(`${g}: intento de cometer el delito → procede`, () => {
      const r = evaluarDetencion({ gravedadCp: g, intentoDelito: true });
      expect(r.orientacion).toBe('procede');
      expect(r.motivo).toMatch(/intento/);
    });

    it(`${g}: fuga o rebeldía → procede`, () => {
      const r = evaluarDetencion({ gravedadCp: g, fugaORebeldia: true });
      expect(r.orientacion).toBe('procede');
      expect(r.motivo).toMatch(/fuga|rebeld/);
    });
  }
});

describe('evaluarDetencion — MENOS GRAVE / GRAVE sin flagrancia (arts. 492.3/492.4)', () => {
  it('indicios de delito + participación + riesgo de incomparecencia → puede proceder', () => {
    const r = evaluarDetencion({
      gravedadCp: 'menos_grave',
      indiciosRacionalesDelito: true,
      indiciosParticipacion: true,
      riesgoIncomparecencia: true,
    });
    expect(r.orientacion).toBe('puede_proceder');
    expect(r.fuentes).toEqual(['LECrim art. 492.3', 'LECrim art. 492.4']);
  });

  it('indicios completos pero SIN riesgo de incomparecencia → no procede (falta el riesgo)', () => {
    const r = evaluarDetencion({
      gravedadCp: 'grave',
      indiciosRacionalesDelito: true,
      indiciosParticipacion: true,
      riesgoIncomparecencia: false,
    });
    expect(r.orientacion).toBe('no_procede_salvo');
    // La carencia concreta va en la cláusula "Falta:"; solo debe faltar el riesgo.
    expect(r.motivo).toMatch(/Falta: riesgo de incomparecencia\./);
  });

  it('sin indicios de delito → no procede y lo señala', () => {
    const r = evaluarDetencion({
      gravedadCp: 'menos_grave',
      indiciosRacionalesDelito: false,
      indiciosParticipacion: true,
      riesgoIncomparecencia: true,
    });
    expect(r.orientacion).toBe('no_procede_salvo');
    expect(r.motivo).toMatch(/existencia del delito/);
  });

  it('sin ninguna circunstancia (solo la gravedad) → no procede, con las tres carencias', () => {
    const r = evaluarDetencion(base('grave'));
    expect(r.orientacion).toBe('no_procede_salvo');
    expect(r.motivo).toMatch(/existencia del delito/);
    expect(r.motivo).toMatch(/participación/);
    expect(r.motivo).toMatch(/riesgo de incomparecencia/);
    expect(r.fuentes).toContain('LECrim art. 493');
  });
});

describe('evaluarDetencion — invariantes de TODAS las salidas', () => {
  // Matriz de combinaciones que recorre las ramas relevantes del árbol.
  const gravedades: GravedadPenal[] = ['leve', 'menos_grave', 'grave'];
  const bools = [false, true];
  const combinaciones: EntradaDetencion[] = [];
  for (const gravedadCp of gravedades) {
    for (const flagrancia of bools) {
      for (const indiciosRacionalesDelito of bools) {
        for (const indiciosParticipacion of bools) {
          for (const riesgoIncomparecencia of bools) {
            for (const domicilioConocido of bools) {
              combinaciones.push({
                gravedadCp,
                flagrancia,
                indiciosRacionalesDelito,
                indiciosParticipacion,
                riesgoIncomparecencia,
                domicilioConocido,
              });
            }
          }
        }
      }
    }
  }

  it('nunca usan lenguaje imperativo ("detén"/"detener" como orden)', () => {
    for (const c of combinaciones) {
      const r = evaluarDetencion(c);
      const texto = `${r.titulo} ${r.motivo}`.toLowerCase();
      // El titular debe ser orientativo ("procede"/"puede"/"no procede").
      expect(r.titulo.toLowerCase()).toMatch(/procede|puede/);
      // Nunca la orden imperativa "detén" ni "detenga".
      expect(texto).not.toMatch(/\bdetén\b|\bdetenga\b|\bdetenlo\b/);
    }
  });

  it('siempre devuelven al menos una fuente y el pie de responsabilidad fijo', () => {
    for (const c of combinaciones) {
      const r = evaluarDetencion(c);
      expect(r.fuentes.length).toBeGreaterThan(0);
      expect(r.pie).toBe(PIE_DETENCION);
    }
  });

  it('la orientación es uno de los tres valores cerrados', () => {
    for (const c of combinaciones) {
      const r = evaluarDetencion(c);
      expect(['procede', 'puede_proceder', 'no_procede_salvo']).toContain(r.orientacion);
    }
  });
});

describe('evaluarDetencion — valores por defecto de la entrada', () => {
  it('con solo la gravedad (resto por defecto) no lanza y da un resultado coherente', () => {
    const r = evaluarDetencion({ gravedadCp: 'menos_grave' });
    expect(r.orientacion).toBe('no_procede_salvo');
  });

  it('delito leve por defecto tiene domicilio conocido → no procede', () => {
    const r = evaluarDetencion({ gravedadCp: 'leve' });
    expect(r.orientacion).toBe('no_procede_salvo');
  });
});

describe('textoConsecuenciaDetencion', () => {
  it('compone título + motivo + pie de responsabilidad', () => {
    const r = evaluarDetencion({ gravedadCp: 'menos_grave', flagrancia: true });
    const texto = textoConsecuenciaDetencion(r);
    expect(texto).toContain(r.titulo);
    expect(texto).toContain(r.motivo);
    expect(texto).toContain(PIE_DETENCION);
    expect(texto.toLowerCase()).toMatch(/procede|puede/);
  });
});
