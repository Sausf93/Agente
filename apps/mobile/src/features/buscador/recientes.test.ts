import { describe, expect, it } from 'vitest';
import { MAX_RECIENTES, parseRecientes, siguienteRecientes } from './recientes';

/**
 * Lógica PURA de búsquedas recientes (01-ux §6.1: "Repetir última / Recientes"). Se prueba sin
 * SQLite: la persistencia (app_flag) es un detalle del store; aquí se fija el comportamiento.
 */
describe('parseRecientes', () => {
  it('devuelve [] ante null, JSON inválido o forma inesperada', () => {
    expect(parseRecientes(null)).toEqual([]);
    expect(parseRecientes('no es json')).toEqual([]);
    expect(parseRecientes('{"a":1}')).toEqual([]);
    expect(parseRecientes('42')).toEqual([]);
  });

  it('filtra elementos no-string y acota a MAX_RECIENTES', () => {
    expect(parseRecientes(JSON.stringify(['móvil', 3, 'faro', null, 'itv']))).toEqual([
      'móvil',
      'faro',
      'itv',
    ]);
    const muchos = Array.from({ length: MAX_RECIENTES + 4 }, (_, i) => `t${i}`);
    expect(parseRecientes(JSON.stringify(muchos))).toHaveLength(MAX_RECIENTES);
  });
});

describe('siguienteRecientes', () => {
  it('inserta el término más nuevo al frente', () => {
    expect(siguienteRecientes(['faro'], 'móvil')).toEqual(['móvil', 'faro']);
  });

  it('ignora términos vacíos o de solo espacios (misma referencia)', () => {
    const previos = ['faro'];
    expect(siguienteRecientes(previos, '   ')).toBe(previos);
    expect(siguienteRecientes(previos, '')).toBe(previos);
  });

  it('deduplica sin distinguir mayúsculas y reordena al frente', () => {
    expect(siguienteRecientes(['Faro', 'móvil'], 'faro')).toEqual(['faro', 'móvil']);
  });

  it('recorta la cola cuando supera el máximo', () => {
    const previos = Array.from({ length: MAX_RECIENTES }, (_, i) => `t${i}`);
    const res = siguienteRecientes(previos, 'nuevo');
    expect(res).toHaveLength(MAX_RECIENTES);
    expect(res[0]).toBe('nuevo');
    expect(res).not.toContain(`t${MAX_RECIENTES - 1}`);
  });

  it('recorta espacios del término guardado', () => {
    expect(siguienteRecientes([], '  faro roto  ')).toEqual(['faro roto']);
  });
});
