import { describe, expect, it } from 'vitest';
import { CUERPOS_TODOS, Infraccion, Norma } from './content.js';

/**
 * Tests del esquema `Norma`, en concreto del campo `cuerpos` (relevancia por cuerpo, para
 * filtrar la lista de Normas). Debe tener un default seguro (todos los cuerpos) y aceptar un
 * etiquetado explícito.
 */
describe('Norma.cuerpos', () => {
  const base = {
    id: 'BOE-A-2003-23514',
    codigo: 'RGC',
    titulo: 'Reglamento General de Circulación',
    tipo: 'reglamento' as const,
    ambito: 'estatal' as const,
  };

  it('por defecto, una norma sin etiquetar es relevante para TODOS los cuerpos', () => {
    const norma = Norma.parse(base);
    expect(norma.cuerpos).toEqual([...CUERPOS_TODOS]);
    expect(norma.cuerpos).toEqual([
      'guardia_civil',
      'policia_nacional',
      'policia_local',
      'policia_autonomica',
    ]);
  });

  it('acepta un etiquetado explícito (tráfico: sin Policía Nacional de oficio)', () => {
    const norma = Norma.parse({
      ...base,
      cuerpos: ['guardia_civil', 'policia_local', 'policia_autonomica'],
    });
    expect(norma.cuerpos).not.toContain('policia_nacional');
    expect(norma.cuerpos).toHaveLength(3);
  });

  it('rechaza un cuerpo que no está en el enum', () => {
    expect(() => Norma.parse({ ...base, cuerpos: ['militar'] })).toThrow();
  });

  it('el default es una copia nueva (no una referencia compartida mutable)', () => {
    const a = Norma.parse(base);
    const b = Norma.parse(base);
    expect(a.cuerpos).not.toBe(b.cuerpos);
  });
});

/**
 * Tests de los campos penales de `Infraccion` (`penaTexto` + `gravedadPenal`): son los que
 * alimentan el bloque "Marco penal" de la ficha adaptativa. Deben ser opcionales (una
 * administrativa no los lleva) y aceptar un delito con su pena y su gravedad del art. 33 CP.
 */
describe('Infraccion — marco penal (penaTexto + gravedadPenal)', () => {
  const base = {
    id: 'del-hurto',
    articuloId: 'art-234',
    tituloCorto: 'Hurto',
    tipo: 'penal' as const,
    gravedad: 'delito' as const,
    textoBoletin: 'Apoderamiento de cosas muebles ajenas…',
    competencia: { cuerpos: [], via: 'ambas' as const },
    ambito: 'estatal' as const,
    validFrom: '2026-09-07T00:00:00.000Z',
  };

  it('por defecto (administrativa) penaTexto y gravedadPenal son null', () => {
    const inf = Infraccion.parse({
      ...base,
      id: 'traf-movil',
      tipo: 'administrativa',
      gravedad: 'grave',
    });
    expect(inf.penaTexto).toBeNull();
    expect(inf.gravedadPenal).toBeNull();
  });

  it('acepta un delito con su pena legible y su gravedad del art. 33 CP', () => {
    const inf = Infraccion.parse({
      ...base,
      penaTexto: 'Prisión de 6 a 18 meses',
      gravedadPenal: 'menos_grave',
    });
    expect(inf.penaTexto).toBe('Prisión de 6 a 18 meses');
    expect(inf.gravedadPenal).toBe('menos_grave');
  });

  it('rechaza una gravedad penal fuera del art. 33 CP', () => {
    expect(() => Infraccion.parse({ ...base, gravedadPenal: 'muy_grave' })).toThrow();
  });
});
