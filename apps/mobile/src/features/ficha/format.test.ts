import { describe, expect, it } from 'vitest';
import { Competencia } from '@agente/shared';
import { formatCompetencia, formatEuros, formatFecha } from './format';

describe('formatEuros', () => {
  it('formatea enteros sin decimales y con símbolo', () => {
    expect(formatEuros(200)).toBe('200 €');
    expect(formatEuros(601)).toBe('601 €');
  });

  it('usa separador de miles español', () => {
    expect(formatEuros(1500)).toBe('1.500 €');
  });

  it('null o NaN → guion', () => {
    expect(formatEuros(null)).toBe('—');
    expect(formatEuros(Number.NaN)).toBe('—');
  });
});

describe('formatFecha', () => {
  it('convierte ISO 8601 a dd/mm/aaaa', () => {
    expect(formatFecha('2026-09-04T00:00:00.000Z')).toBe('04/09/2026');
  });

  it('entrada inválida o vacía → cadena vacía', () => {
    expect(formatFecha(null)).toBe('');
    expect(formatFecha('no-es-fecha')).toBe('');
  });
});

describe('formatCompetencia', () => {
  it('lista cuerpos legibles + vía', () => {
    const c = Competencia.parse({
      cuerpos: ['guardia_civil', 'policia_local', 'trafico'],
      via: 'ambas',
    });
    expect(formatCompetencia(c)).toBe('Guardia Civil, Policía Local, Tráfico · urbana e interurbana');
  });

  it('sin cuerpos muestra solo la vía', () => {
    const c = Competencia.parse({ cuerpos: [], via: 'urbana' });
    expect(formatCompetencia(c)).toBe('vía urbana');
  });
});
