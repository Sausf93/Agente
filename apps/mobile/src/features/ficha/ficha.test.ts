import { describe, expect, it } from 'vitest';
import { fichaKindFrom, tilesFicha, type FichaInfraccion } from './ficha';
import { formatEuros } from './format';

/**
 * Tests de la FICHA ADAPTATIVA (rediseño 2026-09): la derivación de `fichaKind` y la regla de oro
 * "un tile solo si tiene valor" (nunca "—"). Cubre el bug del usuario: un DELITO no debe pintar los
 * tiles de tráfico (importe / pronto pago / puntos), sino su marco penal.
 */

/** Factoría de ficha con valores por defecto de una administrativa de tráfico. */
function fichaDe(over: Partial<FichaInfraccion>): FichaInfraccion {
  const base: FichaInfraccion = {
    infraccionId: 'inf-x',
    tituloCorto: 'Infracción de prueba',
    gravedad: 'grave',
    tipo: 'administrativa',
    fichaKind: 'trafico',
    importeEur: 200,
    importeReducidoEur: 100,
    puntos: 3,
    penaTexto: null,
    gravedadPenal: null,
    textoBoletin: 'Texto de boletín.',
    variantesBoletin: [],
    competencia: { cuerpos: [], via: 'ambas' },
    estadoRevision: 'pendiente_revision',
    notaRevision: null,
    normaCodigo: 'LSV',
    articuloNumero: '76.c',
    urlBoe: null,
    articuloTitulo: null,
    articuloTexto: 'Artículo.',
    consecuencias: [],
    actualizadoEn: null,
  };
  // `fichaKind` se recalcula salvo que el test lo fije explícitamente.
  const merged = { ...base, ...over };
  if (over.fichaKind === undefined) {
    merged.fichaKind = fichaKindFrom(merged);
  }
  return merged;
}

describe('fichaKindFrom', () => {
  it('un delito (tipo penal) es `penal`', () => {
    expect(
      fichaKindFrom({ tipo: 'penal', gravedad: 'delito', puntos: null, normaCodigo: 'CP' }),
    ).toBe('penal');
  });

  it('gravedad `delito` es `penal` aunque el tipo no lo diga', () => {
    expect(
      fichaKindFrom({ tipo: 'administrativa', gravedad: 'delito', puntos: null, normaCodigo: 'CP' }),
    ).toBe('penal');
  });

  it('la LO 4/2015 (código LOSC) es `seguridad_ciudadana` y nunca `trafico`', () => {
    expect(
      fichaKindFrom({ tipo: 'administrativa', gravedad: 'grave', puntos: null, normaCodigo: 'LOSC' }),
    ).toBe('seguridad_ciudadana');
  });

  it('detraer puntos implica `trafico`', () => {
    expect(
      fichaKindFrom({ tipo: 'administrativa', gravedad: 'grave', puntos: 6, normaCodigo: 'LSV' }),
    ).toBe('trafico');
  });

  it('una norma de tráfico sin puntos sigue siendo `trafico` (RGC/RGV)', () => {
    expect(
      fichaKindFrom({ tipo: 'administrativa', gravedad: 'leve', puntos: null, normaCodigo: 'RGC' }),
    ).toBe('trafico');
  });

  it('el resto de administrativas cae a `administrativa`', () => {
    expect(
      fichaKindFrom({ tipo: 'administrativa', gravedad: 'leve', puntos: null, normaCodigo: 'ORD-MUNI' }),
    ).toBe('administrativa');
  });
});

describe('tilesFicha — "solo con valor" y adaptación por tipo', () => {
  it('un DELITO no pinta NINGÚN tile de tráfico (importe/pronto pago/puntos)', () => {
    const ficha = fichaDe({
      tipo: 'penal',
      gravedad: 'delito',
      normaCodigo: 'CP',
      importeEur: null,
      importeReducidoEur: null,
      puntos: null,
      penaTexto: 'Prisión de 6 a 18 meses',
      gravedadPenal: 'menos_grave',
    });
    expect(ficha.fichaKind).toBe('penal');
    expect(tilesFicha(ficha, formatEuros)).toEqual([]);
  });

  it('tráfico completo: importe (énfasis) + pronto pago + puntos', () => {
    const ficha = fichaDe({ importeEur: 200, importeReducidoEur: 100, puntos: 6, normaCodigo: 'LSV' });
    const tiles = tilesFicha(ficha, formatEuros);
    expect(tiles.map((x) => x.etiqueta)).toEqual(['Importe', 'Pronto pago', 'Puntos']);
    expect(tiles[0]).toMatchObject({ valor: '200 €', enfasis: true });
    expect(tiles[2]).toMatchObject({ etiqueta: 'Puntos', valor: '6' });
  });

  it('sin pronto pago ni puntos, tráfico cae a un único tile (nunca "—")', () => {
    const ficha = fichaDe({ importeEur: 500, importeReducidoEur: null, puntos: null, normaCodigo: 'LSV' });
    const tiles = tilesFicha(ficha, formatEuros);
    expect(tiles).toHaveLength(1);
    expect(tiles[0]).toMatchObject({ etiqueta: 'Importe', valor: '500 €' });
    expect(tiles.some((x) => x.valor === '—')).toBe(false);
  });

  it('seguridad ciudadana: importe + pronto pago + TRAMO cualitativo, NUNCA puntos', () => {
    const ficha = fichaDe({
      tipo: 'administrativa',
      gravedad: 'grave',
      normaCodigo: 'LOSC',
      importeEur: 601,
      importeReducidoEur: 300,
      puntos: null,
    });
    expect(ficha.fichaKind).toBe('seguridad_ciudadana');
    const etiquetas = tilesFicha(ficha, formatEuros).map((x) => x.etiqueta);
    expect(etiquetas).toEqual(['Importe', 'Pronto pago', 'Tramo']);
    expect(etiquetas).not.toContain('Puntos');
    const tramo = tilesFicha(ficha, formatEuros).find((x) => x.etiqueta === 'Tramo');
    expect(tramo?.valor).toBe('Grave');
  });

  it('administrativa genérica: solo importe (+ pronto pago si aplica), sin puntos ni tramo', () => {
    const ficha = fichaDe({
      tipo: 'administrativa',
      gravedad: 'leve',
      normaCodigo: 'ORD-MUNI',
      importeEur: 80,
      importeReducidoEur: null,
      puntos: null,
    });
    expect(ficha.fichaKind).toBe('administrativa');
    expect(tilesFicha(ficha, formatEuros).map((x) => x.etiqueta)).toEqual(['Importe']);
  });
});
