import { describe, expect, it } from 'vitest';
import { pistaConsecuencia, resaltarCoincidencia } from './resaltar';

/**
 * Tests de la lógica de "resultados vivos" (P0-4). Son piezas puras y deterministas: el resaltado
 * del match y la elección de la consecuencia determinante. La UI solo pinta lo que estas devuelven.
 */
describe('resaltarCoincidencia', () => {
  function unir(texto: string, consulta: string) {
    return resaltarCoincidencia(texto, consulta)
      .map((s) => (s.match ? `[${s.texto}]` : s.texto))
      .join('');
  }

  it('resalta la palabra completa que coincide, ignorando tildes y mayúsculas', () => {
    expect(unir('Circular sin seguro obligatorio', 'seguro')).toBe(
      'Circular sin [seguro] obligatorio',
    );
    expect(unir('Vehículo sin ITV', 'vehiculo')).toBe('[Vehículo] sin ITV');
  });

  it('coincide por prefijo, como el FTS ("segu" → "seguro")', () => {
    expect(unir('Circular sin seguro', 'segu')).toBe('Circular sin [seguro]');
  });

  it('resalta cada palabra que coincide cuando hay varios tokens', () => {
    expect(unir('Circular sin seguro obligatorio', 'sin seguro')).toBe(
      'Circular [sin] [seguro] obligatorio',
    );
  });

  it('sin consulta o sin match devuelve el texto intacto (un solo segmento sin resaltar)', () => {
    expect(resaltarCoincidencia('Faro roto', '')).toEqual([{ texto: 'Faro roto', match: false }]);
    expect(resaltarCoincidencia('Faro roto', 'zzz')).toEqual([
      { texto: 'Faro roto', match: false },
    ]);
  });

  it('ignora tokens de una sola letra (evita resaltar de más)', () => {
    expect(unir('Alumbrado deficiente', 'a')).toBe('Alumbrado deficiente');
  });

  it('el texto vacío no produce segmentos', () => {
    expect(resaltarCoincidencia('', 'faro')).toEqual([]);
  });
});

describe('pistaConsecuencia', () => {
  it('elige la de mayor prioridad (detención por encima de todo)', () => {
    expect(pistaConsecuencia(['identificacion', 'detencion'])).toEqual({
      tipo: 'detencion',
      peligro: true,
    });
  });

  it('inmovilización pesa más que depósito', () => {
    expect(pistaConsecuencia(['deposito', 'inmovilizacion'])).toEqual({
      tipo: 'inmovilizacion',
      peligro: false,
    });
  });

  it('identificación sola no genera chip', () => {
    expect(pistaConsecuencia(['identificacion'])).toBeNull();
  });

  it('sin consecuencias devuelve null', () => {
    expect(pistaConsecuencia([])).toBeNull();
  });
});
