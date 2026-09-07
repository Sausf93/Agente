import { describe, expect, it } from 'vitest';
import {
  PIE_SUSTANCIAS,
  RESULTADO_INDICIOS_TRAFICO,
  RESULTADO_PROBABLE_CONSUMO,
  Sustancia,
  orientarSustancia,
} from './sustancias.js';

/**
 * Tests del modelo `Sustancia` (§4.7): validación del esquema Zod y de la orientación
 * consumo/tráfico. Garantizan que los umbrales son números positivos, que la orientación es
 * ORIENTATIVA (arrastra siempre su pie de responsabilidad y sus fuentes) y que el corte se hace
 * en el umbral de acopio (≈ consumo diario × 5 días, doctrina TS 19/10/2001).
 */

/** Sustancia mínima válida para las pruebas. */
const base = {
  id: 'cocaina',
  nombre: 'Cocaína',
  aliases: ['coca', 'farlopa'],
  umbralConsumoDiarioMg: 1500,
  umbralAcopioG: 7.5,
  notasPureza: 'Los umbrales se refieren a sustancia pura; ajustar por riqueza del análisis.',
  indicadoresTrafico: ['dosis fraccionadas', 'balanza de precisión'],
  fuente: 'INTCF; Acuerdo Sala 2ª TS 19/10/2001',
  pendienteRevision: true,
  notaRevision: 'Verificar umbral con la última tabla del INTCF.',
};

describe('Sustancia: esquema', () => {
  it('valida una sustancia completa', () => {
    const s = Sustancia.parse(base);
    expect(s.id).toBe('cocaina');
    expect(s.aliases).toContain('farlopa');
    expect(s.pendienteRevision).toBe(true);
  });

  it('aplica el valor por defecto a aliases e indicadoresTrafico', () => {
    const { aliases, indicadoresTrafico, ...sinArrays } = base;
    void aliases;
    void indicadoresTrafico;
    const s = Sustancia.parse(sinArrays);
    expect(s.aliases).toEqual([]);
    expect(s.indicadoresTrafico).toEqual([]);
  });

  it('rechaza umbrales no positivos', () => {
    expect(() => Sustancia.parse({ ...base, umbralConsumoDiarioMg: 0 })).toThrow();
    expect(() => Sustancia.parse({ ...base, umbralAcopioG: -1 })).toThrow();
  });

  it('rechaza el nombre vacío', () => {
    expect(() => Sustancia.parse({ ...base, nombre: '' })).toThrow();
  });
});

describe('orientarSustancia: consumo vs tráfico (orientativo)', () => {
  const s = Sustancia.parse(base);

  it('por debajo del acopio → probable consumo, con pie e indicadores', () => {
    const r = orientarSustancia(s, 3);
    expect(r.orientacion).toBe('probable_consumo');
    expect(r.titulo).toBe(RESULTADO_PROBABLE_CONSUMO);
    expect(r.pie).toBe(PIE_SUSTANCIAS);
    expect(r.indicadoresTrafico).toEqual(s.indicadoresTrafico);
    expect(r.fuente).toBe(s.fuente);
  });

  it('por encima del acopio → indicios de tráfico', () => {
    const r = orientarSustancia(s, 20);
    expect(r.orientacion).toBe('indicios_trafico');
    expect(r.titulo).toBe(RESULTADO_INDICIOS_TRAFICO);
  });

  it('justo en el umbral se considera compatible con consumo (no supera)', () => {
    const r = orientarSustancia(s, s.umbralAcopioG);
    expect(r.orientacion).toBe('probable_consumo');
  });

  it('la orientación NUNCA es imperativa (no dice "detén" ni "decomisa")', () => {
    for (const cantidad of [1, 20]) {
      const texto = `${orientarSustancia(s, cantidad).titulo} ${orientarSustancia(s, cantidad).motivo}`.toLowerCase();
      expect(texto).not.toMatch(/\bdeten\b|\bdetén\b|\bdecomisa\b|\bincauta\b/);
    }
  });
});
