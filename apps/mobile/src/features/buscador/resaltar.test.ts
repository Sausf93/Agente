import { describe, expect, it } from 'vitest';
import type { TipoConsecuencia } from '@agente/shared';
import { pistaConsecuencia, resaltarCoincidencia } from './resaltar';
import { accionOperativaFrom } from '../ficha/ficha';

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

  // ORDEN_COERCION (QA B-1): grúa/depósito pesa POR ENCIMA de la inmovilización (antes al revés).
  it('depósito (grúa) pesa más que inmovilización', () => {
    expect(pistaConsecuencia(['deposito', 'inmovilizacion'])).toEqual({
      tipo: 'deposito',
      peligro: false,
    });
  });

  // ORDEN_COERCION (QA B-1): el decomiso pesa por encima de la retirada de permiso.
  it('decomiso pesa más que retirada de permiso', () => {
    expect(pistaConsecuencia(['retirada_permiso', 'decomiso'])).toEqual({
      tipo: 'decomiso',
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

/**
 * T-1 (QA B-1): la LISTA (`pistaConsecuencia`) y la FICHA (`accionOperativaFrom`) eligen el MISMO
 * tipo determinante para el mismo conjunto de consecuencias. Antes divergían (dos tablas locales).
 */
describe('T-1 · lista y ficha coinciden en el tipo determinante', () => {
  const casos: TipoConsecuencia[][] = [
    ['deposito', 'inmovilizacion'],
    ['decomiso', 'retirada_permiso'],
  ];
  it.each(casos)('mismo determinante para %j', (...tipos) => {
    const lista = pistaConsecuencia(tipos)?.tipo;
    const ficha = accionOperativaFrom({
      fichaKind: 'trafico',
      consecuencias: tipos.map((tipo) => ({ tipo, fuente: `art. X (${tipo})` })),
    });
    // El `kind` de la ficha normaliza `retirada_permiso`→`retirada`; el resto coincide con el tipo.
    const kindEsperado = lista === 'retirada_permiso' ? 'retirada' : lista;
    expect(ficha?.kind).toBe(kindEsperado);
  });

  it("depósito gana en AMBOS para ['deposito','inmovilizacion']", () => {
    expect(pistaConsecuencia(['deposito', 'inmovilizacion'])?.tipo).toBe('deposito');
    expect(
      accionOperativaFrom({
        fichaKind: 'trafico',
        consecuencias: [
          { tipo: 'deposito', fuente: 'a' },
          { tipo: 'inmovilizacion', fuente: 'b' },
        ],
      })?.kind,
    ).toBe('deposito');
  });

  it("decomiso gana en AMBOS para ['decomiso','retirada_permiso']", () => {
    expect(pistaConsecuencia(['decomiso', 'retirada_permiso'])?.tipo).toBe('decomiso');
    expect(
      accionOperativaFrom({
        fichaKind: 'trafico',
        consecuencias: [
          { tipo: 'decomiso', fuente: 'a' },
          { tipo: 'retirada_permiso', fuente: 'b' },
        ],
      })?.kind,
    ).toBe('decomiso');
  });
});
