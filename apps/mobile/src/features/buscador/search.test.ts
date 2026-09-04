import { describe, expect, it } from 'vitest';
import { combinarRanking, construirConsultaFts } from './search';

/**
 * Tests de LÓGICA PURA del buscador (sin SQLite): construcción de la expresión FTS y el
 * modelo de ranking (sinónimo exacto primero, luego FTS, sin duplicar). El SQL real se valida
 * aparte contra el `.sqlite` en `search.integration.test.ts`.
 */
describe('construirConsultaFts', () => {
  it('trocea en tokens y los convierte en prefijos con AND implícito', () => {
    expect(construirConsultaFts('faro roto')).toBe('faro* roto*');
  });

  it('parte por puntuación y descarta vacíos (nº de artículo)', () => {
    expect(construirConsultaFts('rgc 18')).toBe('rgc* 18*');
    expect(construirConsultaFts('11.1')).toBe('11* 1*');
  });

  it('devuelve cadena vacía si no queda ningún token válido', () => {
    expect(construirConsultaFts('  ')).toBe('');
    expect(construirConsultaFts('...')).toBe('');
  });
});

describe('combinarRanking', () => {
  it('coloca los sinónimos exactos primero y luego el FTS', () => {
    expect(combinarRanking(['a'], ['b', 'c'])).toEqual(['a', 'b', 'c']);
  });

  it('no duplica: un id exacto que también aparece en FTS se mantiene arriba una vez', () => {
    expect(combinarRanking(['a'], ['a', 'b'])).toEqual(['a', 'b']);
  });

  it('conserva el orden de relevancia del FTS', () => {
    expect(combinarRanking([], ['x', 'y', 'z'])).toEqual(['x', 'y', 'z']);
  });

  it('sin resultados devuelve lista vacía', () => {
    expect(combinarRanking([], [])).toEqual([]);
  });
});
