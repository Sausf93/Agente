import { describe, expect, it } from 'vitest';
import { CUERPOS_TODOS, Norma } from './content.js';

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
