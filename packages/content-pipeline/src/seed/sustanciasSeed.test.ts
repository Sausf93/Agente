import { describe, expect, it } from 'vitest';
import { Sustancia, orientarSustancia } from '@agente/shared';
import { SUSTANCIAS_SEED } from './sustanciasSeed.js';

/**
 * Tests del seed de la tabla de sustancias (§4.7): garantizan que TODAS las sustancias validan
 * el esquema, que quedan `pendienteRevision` (nada se autopublica), que el acopio guarda la
 * relación orientativa consumo diario × 5 días (doctrina TS 19/10/2001), y que la orientación
 * consumo/tráfico se comporta como se espera. Es la red que evita que una cifra sensible salga
 * "verificada" o incoherente al dispositivo.
 */

describe('SUSTANCIAS_SEED: integridad y esquema', () => {
  it('siembra las 7 sustancias de calle más frecuentes', () => {
    expect(SUSTANCIAS_SEED).toHaveLength(7);
    const ids = SUSTANCIAS_SEED.map((s) => s.id).sort();
    expect(ids).toEqual(
      [
        'anfetamina-speed',
        'cannabis-marihuana',
        'cocaina',
        'hachis',
        'heroina',
        'mdma-extasis',
        'metanfetamina',
      ].sort(),
    );
  });

  it('cada sustancia valida el esquema Zod de shared', () => {
    for (const s of SUSTANCIAS_SEED) {
      expect(() => Sustancia.parse(s), s.id).not.toThrow();
    }
  });

  it('todas quedan pendientes de revisión con nota (nada se autopublica)', () => {
    for (const s of SUSTANCIAS_SEED) {
      expect(s.pendienteRevision, s.id).toBe(true);
      expect(s.notaRevision.length, s.id).toBeGreaterThan(0);
    }
  });

  it('cada sustancia lleva fuente (INTCF + Acuerdo TS 19/10/2001)', () => {
    for (const s of SUSTANCIAS_SEED) {
      expect(s.fuente, s.id).toMatch(/INTCF/);
      expect(s.fuente, s.id).toMatch(/19\/10\/2001/);
    }
  });

  it('cada sustancia trae aliases de calle e indicadores de tráfico', () => {
    for (const s of SUSTANCIAS_SEED) {
      expect(s.aliases.length, s.id).toBeGreaterThanOrEqual(3);
      expect(s.indicadoresTrafico.length, s.id).toBeGreaterThanOrEqual(3);
    }
  });
});

describe('SUSTANCIAS_SEED: coherencia de umbrales (orientativo)', () => {
  it('el acopio (g) es ~ consumo diario (mg) × 5 días', () => {
    for (const s of SUSTANCIAS_SEED) {
      const esperadoG = (s.umbralConsumoDiarioMg * 5) / 1000;
      expect(s.umbralAcopioG, s.id).toBeCloseTo(esperadoG, 5);
    }
  });

  it('todos los umbrales son positivos', () => {
    for (const s of SUSTANCIAS_SEED) {
      expect(s.umbralConsumoDiarioMg, s.id).toBeGreaterThan(0);
      expect(s.umbralAcopioG, s.id).toBeGreaterThan(0);
    }
  });
});

describe('SUSTANCIAS_SEED: orientación consumo/tráfico', () => {
  it('cocaína: por debajo del acopio → consumo; por encima → tráfico', () => {
    const coca = SUSTANCIAS_SEED.find((s) => s.id === 'cocaina')!;
    expect(orientarSustancia(coca, 2).orientacion).toBe('probable_consumo');
    expect(orientarSustancia(coca, 50).orientacion).toBe('indicios_trafico');
  });

  it('la orientación arrastra siempre el pie de responsabilidad (calificación judicial)', () => {
    const s = SUSTANCIAS_SEED[0]!;
    const r = orientarSustancia(s, 1);
    expect(r.pie.toLowerCase()).toMatch(/judicial/);
  });
});
