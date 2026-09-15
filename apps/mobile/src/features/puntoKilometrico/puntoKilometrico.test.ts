import { describe, expect, it } from 'vitest';
import {
  componerLocalizacion,
  formatearPk,
  localizacionValida,
  type DatosPuntoKilometrico,
} from './puntoKilometrico';

const base: DatosPuntoKilometrico = {
  carretera: '',
  pk: '',
  sentido: null,
  sentidoHacia: null,
  margen: null,
  referencia: null,
};

describe('formatearPk', () => {
  it('normaliza distintas grafías a "p.k. 12,300"', () => {
    expect(formatearPk('12,300')).toBe('p.k. 12,300');
    expect(formatearPk('12.3')).toBe('p.k. 12,3');
    expect(formatearPk('12+300')).toBe('p.k. 12,300');
    expect(formatearPk('  12,3 ')).toBe('p.k. 12,3');
  });

  it('cadena vacía → vacío', () => {
    expect(formatearPk('')).toBe('');
    expect(formatearPk('   ')).toBe('');
  });
});

describe('componerLocalizacion', () => {
  it('compone la línea completa para el atestado', () => {
    const texto = componerLocalizacion({
      ...base,
      carretera: 'TF-1',
      pk: '12,300',
      sentido: 'decreciente',
      sentidoHacia: 'Santa Cruz',
      margen: 'derecho',
      referencia: 'a la altura de la salida 12',
    });
    expect(texto).toBe(
      'Carretera TF-1, p.k. 12,300, sentido decreciente (hacia Santa Cruz), margen derecho, a la altura de la salida 12.',
    );
  });

  it('omite con elegancia lo que falta', () => {
    expect(componerLocalizacion({ ...base, carretera: 'A-7', pk: '5' })).toBe(
      'Carretera A-7, p.k. 5.',
    );
    expect(componerLocalizacion({ ...base, carretera: 'N-340', pk: '', sentido: 'creciente' })).toBe(
      'Carretera N-340, sentido creciente.',
    );
  });

  it('sin carretera ni p.k. → vacío', () => {
    expect(componerLocalizacion({ ...base, sentido: 'creciente', margen: 'derecho' })).toBe('');
  });
});

describe('localizacionValida', () => {
  it('exige al menos carretera o p.k.', () => {
    expect(localizacionValida({ ...base })).toBe(false);
    expect(localizacionValida({ ...base, carretera: 'TF-5' })).toBe(true);
    expect(localizacionValida({ ...base, pk: '3,2' })).toBe(true);
  });
});
