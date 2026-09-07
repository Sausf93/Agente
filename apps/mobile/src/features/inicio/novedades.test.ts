import { describe, expect, it } from 'vitest';
import {
  contarNovedadesNuevas,
  esNovedadNueva,
  hayNovedadesNuevas,
  ultimaFechaNovedad,
} from './novedades';

const N = (fecha: string) => ({ fecha });

describe('esNovedadNueva', () => {
  it('todo es nuevo si nunca se abrió la pantalla (vistasHasta null)', () => {
    expect(esNovedadNueva(N('2026-01-01T00:00:00.000Z'), null)).toBe(true);
  });

  it('nueva si su fecha es posterior a la marca de visto', () => {
    expect(esNovedadNueva(N('2026-05-01T00:00:00.000Z'), '2026-04-01T00:00:00.000Z')).toBe(true);
  });

  it('no es nueva si su fecha es igual o anterior a la marca', () => {
    expect(esNovedadNueva(N('2026-04-01T00:00:00.000Z'), '2026-04-01T00:00:00.000Z')).toBe(false);
    expect(esNovedadNueva(N('2026-03-01T00:00:00.000Z'), '2026-04-01T00:00:00.000Z')).toBe(false);
  });
});

describe('contarNovedadesNuevas', () => {
  const novedades = [
    N('2026-06-01T00:00:00.000Z'),
    N('2026-05-01T00:00:00.000Z'),
    N('2026-01-01T00:00:00.000Z'),
  ];

  it('cuenta todas si nunca se vieron', () => {
    expect(contarNovedadesNuevas(novedades, null)).toBe(3);
  });

  it('cuenta solo las posteriores a la marca', () => {
    expect(contarNovedadesNuevas(novedades, '2026-05-01T00:00:00.000Z')).toBe(1);
  });

  it('cero si todas ya se vieron', () => {
    expect(contarNovedadesNuevas(novedades, '2026-06-01T00:00:00.000Z')).toBe(0);
  });

  it('lista vacía → cero', () => {
    expect(contarNovedadesNuevas([], null)).toBe(0);
  });
});

describe('hayNovedadesNuevas', () => {
  it('true si hay al menos una nueva', () => {
    expect(hayNovedadesNuevas([N('2026-06-01T00:00:00.000Z')], '2026-05-01T00:00:00.000Z')).toBe(true);
  });
  it('false si no hay ninguna nueva', () => {
    expect(hayNovedadesNuevas([N('2026-04-01T00:00:00.000Z')], '2026-05-01T00:00:00.000Z')).toBe(false);
  });
  it('false con lista vacía', () => {
    expect(hayNovedadesNuevas([], null)).toBe(false);
  });
});

describe('ultimaFechaNovedad', () => {
  it('devuelve la fecha máxima aunque el orden de entrada no lo esté', () => {
    expect(
      ultimaFechaNovedad([
        N('2026-01-01T00:00:00.000Z'),
        N('2026-06-01T00:00:00.000Z'),
        N('2026-03-01T00:00:00.000Z'),
      ]),
    ).toBe('2026-06-01T00:00:00.000Z');
  });

  it('null si no hay novedades', () => {
    expect(ultimaFechaNovedad([])).toBe(null);
  });
});
