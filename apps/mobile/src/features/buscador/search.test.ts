import { describe, expect, it } from 'vitest';
import { combinarRanking, construirConsultaFts, extractoArticulo } from './search';

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

describe('extractoArticulo', () => {
  it('deja el texto corto tal cual (colapsa espacios y quita marcas markdown)', () => {
    expect(extractoArticulo('  Castiga  el **hurto** de cosas ajenas. ')).toBe(
      'Castiga el hurto de cosas ajenas.',
    );
  });

  it('recorta el texto largo sin partir la última palabra y añade elipsis', () => {
    const largo =
      'Conducir con temeridad manifiesta y poner en concreto peligro la vida o la integridad de las personas se castiga conforme al Código Penal.';
    const res = extractoArticulo(largo, 40);
    expect(res.length).toBeLessThanOrEqual(41); // 40 + elipsis
    expect(res.endsWith('…')).toBe(true);
    expect(res).not.toMatch(/\s…$/); // no corta dejando un espacio antes de la elipsis
  });
});
