import { describe, expect, it } from 'vitest';
import {
  esAlcoholemiaODrogas,
  esConduccionSinPermisoPenal,
  plantillaParaFicha,
  plantillasSecundariasParaFicha,
  type FichaParaPlantilla,
} from './plantillaDoc';

/**
 * Tests de la elección de plantilla desde la ficha (validación de calle, GC de Tráfico): que una
 * ALCOHOLEMIA penal NO abra la diligencia de identificación sino el ACTA DE LA PRUEBA, y que las
 * consecuencias operativas (inmoviliza/grúa) arrastren su acta secundaria.
 */
function fichaDe(over: Partial<FichaParaPlantilla>): FichaParaPlantilla {
  return {
    infraccionId: 'inf-x',
    fichaKind: 'trafico',
    tipo: 'administrativa',
    normaCodigo: 'LSV',
    articuloNumero: '76.c',
    consecuencias: [],
    ...over,
  };
}

describe('plantillaParaFicha', () => {
  it('alcoholemia penal (art. 379.2 CP) → acta de prueba de alcoholemia', () => {
    const f = fichaDe({
      infraccionId: 'del-alcoholemia-penal',
      fichaKind: 'penal',
      tipo: 'penal',
      normaCodigo: 'CP',
      articuloNumero: '379.2',
    });
    expect(plantillaParaFicha(f)).toBe('seed-acta-prueba-alcoholemia');
  });

  it('alcoholemia administrativa (art. 14 LSV) → acta de prueba de alcoholemia', () => {
    const f = fichaDe({ infraccionId: 'inf-alcoholemia', normaCodigo: 'LSV', articuloNumero: '14' });
    expect(plantillaParaFicha(f)).toBe('seed-acta-prueba-alcoholemia');
  });

  it('negativa a la prueba (art. 383 CP) → acta de prueba de alcoholemia', () => {
    const f = fichaDe({
      infraccionId: 'inf-negativa-prueba',
      fichaKind: 'penal',
      tipo: 'penal',
      normaCodigo: 'CP',
      articuloNumero: '383',
    });
    expect(plantillaParaFicha(f)).toBe('seed-acta-prueba-alcoholemia');
  });

  it('conducción sin permiso (384 CP) → diligencia (no hay acta específica)', () => {
    const f = fichaDe({
      infraccionId: 'del-conduccion-sin-permiso',
      fichaKind: 'penal',
      tipo: 'penal',
      normaCodigo: 'CP',
      articuloNumero: '384',
    });
    expect(esConduccionSinPermisoPenal(f)).toBe(true);
    expect(plantillaParaFicha(f)).toBe('seed-diligencia-identificacion');
  });

  it('hurto (penal) → diligencia de identificación', () => {
    const f = fichaDe({
      infraccionId: 'del-hurto',
      fichaKind: 'penal',
      tipo: 'penal',
      normaCodigo: 'CP',
      articuloNumero: '234',
    });
    expect(plantillaParaFicha(f)).toBe('seed-diligencia-identificacion');
  });

  it('exceso de velocidad (administrativa) → boletín de denuncia', () => {
    const f = fichaDe({
      infraccionId: 'inf-exceso-velocidad',
      fichaKind: 'trafico',
      tipo: 'administrativa',
      normaCodigo: 'RGC',
      articuloNumero: '48',
    });
    expect(plantillaParaFicha(f)).toBe('seed-boletin-denuncia');
  });

  it('velocidad penal (art. 379.1 CP) NO es alcoholemia → diligencia', () => {
    const f = fichaDe({
      infraccionId: 'del-velocidad-penal',
      fichaKind: 'penal',
      tipo: 'penal',
      normaCodigo: 'CP',
      articuloNumero: '379.1',
    });
    expect(esAlcoholemiaODrogas(f)).toBe(false);
    expect(plantillaParaFicha(f)).toBe('seed-diligencia-identificacion');
  });
});

describe('plantillasSecundariasParaFicha', () => {
  it('sin consecuencias operativas: ninguna acta secundaria', () => {
    expect(plantillasSecundariasParaFicha(fichaDe({}))).toEqual([]);
  });

  it('consecuencia inmovilización → acta de inmovilización', () => {
    const f = fichaDe({ consecuencias: [{ tipo: 'inmovilizacion' }] });
    expect(plantillasSecundariasParaFicha(f)).toEqual([
      { plantillaId: 'seed-acta-inmovilizacion', label: 'Acta de inmovilización' },
    ]);
  });

  it('consecuencia depósito → acta de grúa/depósito', () => {
    const f = fichaDe({ consecuencias: [{ tipo: 'deposito' }] });
    expect(plantillasSecundariasParaFicha(f)).toEqual([
      { plantillaId: 'seed-acta-deposito-grua', label: 'Acta de grúa/depósito' },
    ]);
  });

  it('inmovilización y depósito: ambas, en orden (inmovilización primero)', () => {
    const f = fichaDe({ consecuencias: [{ tipo: 'deposito' }, { tipo: 'inmovilizacion' }] });
    expect(plantillasSecundariasParaFicha(f).map((p) => p.plantillaId)).toEqual([
      'seed-acta-inmovilizacion',
      'seed-acta-deposito-grua',
    ]);
  });
});
