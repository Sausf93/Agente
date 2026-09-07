import { describe, expect, it } from 'vitest';
import { rankMasUsadas, scoreUso, type UsoInfraccion } from './masUsadas';

/** Construye un `UsoInfraccion` de prueba con lo mínimo. */
function uso(p: Partial<UsoInfraccion> & { infraccionId: string }): UsoInfraccion {
  return {
    infraccionId: p.infraccionId,
    tituloCorto: p.tituloCorto ?? p.infraccionId,
    gravedad: p.gravedad ?? 'leve',
    normaCodigo: p.normaCodigo ?? 'RGC',
    articuloNumero: p.articuloNumero ?? '18',
    importeEur: p.importeEur ?? null,
    consultas: p.consultas ?? 0,
    copias: p.copias ?? 0,
    ultimaFecha: p.ultimaFecha ?? '2026-01-01T00:00:00.000Z',
  };
}

describe('scoreUso', () => {
  it('una copia pesa 3 consultas', () => {
    expect(scoreUso({ consultas: 0, copias: 1 })).toBe(3);
    expect(scoreUso({ consultas: 3, copias: 0 })).toBe(3);
    expect(scoreUso({ consultas: 2, copias: 2 })).toBe(8);
  });

  it('sin uso, score 0', () => {
    expect(scoreUso({ consultas: 0, copias: 0 })).toBe(0);
  });
});

describe('rankMasUsadas', () => {
  it('ordena por score descendente', () => {
    const r = rankMasUsadas(
      [
        uso({ infraccionId: 'a', consultas: 1 }), // score 1
        uso({ infraccionId: 'b', copias: 2 }), // score 6
        uso({ infraccionId: 'c', consultas: 4 }), // score 4
      ],
      10,
    );
    expect(r.map((u) => u.infraccionId)).toEqual(['b', 'c', 'a']);
  });

  it('descarta las que no tienen ningún uso efectivo (score 0)', () => {
    const r = rankMasUsadas(
      [uso({ infraccionId: 'a', consultas: 0, copias: 0 }), uso({ infraccionId: 'b', consultas: 1 })],
      10,
    );
    expect(r.map((u) => u.infraccionId)).toEqual(['b']);
  });

  it('a igualdad de score, gana la más reciente', () => {
    const r = rankMasUsadas(
      [
        uso({ infraccionId: 'vieja', consultas: 3, ultimaFecha: '2026-01-01T00:00:00.000Z' }),
        uso({ infraccionId: 'nueva', consultas: 3, ultimaFecha: '2026-05-01T00:00:00.000Z' }),
      ],
      10,
    );
    expect(r.map((u) => u.infraccionId)).toEqual(['nueva', 'vieja']);
  });

  it('a igualdad de score y fecha, desempata por id (estable)', () => {
    const misma = '2026-01-01T00:00:00.000Z';
    const r = rankMasUsadas(
      [
        uso({ infraccionId: 'z', consultas: 2, ultimaFecha: misma }),
        uso({ infraccionId: 'a', consultas: 2, ultimaFecha: misma }),
      ],
      10,
    );
    expect(r.map((u) => u.infraccionId)).toEqual(['a', 'z']);
  });

  it('respeta el límite (top N)', () => {
    const r = rankMasUsadas(
      [
        uso({ infraccionId: 'a', consultas: 5 }),
        uso({ infraccionId: 'b', consultas: 4 }),
        uso({ infraccionId: 'c', consultas: 3 }),
      ],
      2,
    );
    expect(r.map((u) => u.infraccionId)).toEqual(['a', 'b']);
  });

  it('límite 0 o negativo devuelve lista vacía', () => {
    const datos = [uso({ infraccionId: 'a', consultas: 5 })];
    expect(rankMasUsadas(datos, 0)).toEqual([]);
    expect(rankMasUsadas(datos, -3)).toEqual([]);
  });

  it('no muta el array de entrada', () => {
    const datos = [uso({ infraccionId: 'a', consultas: 1 }), uso({ infraccionId: 'b', copias: 1 })];
    const copia = [...datos];
    rankMasUsadas(datos, 10);
    expect(datos).toEqual(copia);
  });
});
