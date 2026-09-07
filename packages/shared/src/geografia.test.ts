import { describe, expect, it } from 'vitest';
import {
  CCAA_DE_AUTONOMICA,
  COMUNIDADES,
  ccaaPorId,
  provinciaPorId,
  provinciasDeCcaa,
  slugMunicipio,
} from './geografia.js';

describe('catálogo geográfico', () => {
  it('cubre las 17 CCAA + Ceuta y Melilla (19 entradas)', () => {
    expect(COMUNIDADES).toHaveLength(19);
  });

  it('suma 52 provincias/ciudades autónomas (50 provincias + Ceuta + Melilla)', () => {
    const total = COMUNIDADES.reduce((n, c) => n + c.provincias.length, 0);
    expect(total).toBe(52);
  });

  it('cada provincia apunta a su CCAA y tiene id único', () => {
    const ids = new Set<string>();
    for (const c of COMUNIDADES) {
      for (const p of c.provincias) {
        expect(p.ccaaId).toBe(c.id);
        expect(ids.has(p.id)).toBe(false);
        ids.add(p.id);
      }
    }
    expect(ids.size).toBe(52);
  });

  it('resuelve provincias por CCAA y provincia/ccaa por id', () => {
    const cat = COMUNIDADES.find((c) => c.nombre === 'Cataluña')!;
    expect(provinciasDeCcaa(cat.id).map((p) => p.nombre)).toContain('Barcelona');
    const bcn = cat.provincias.find((p) => p.nombre === 'Barcelona')!;
    expect(provinciaPorId(bcn.id)?.ccaaId).toBe(cat.id);
    expect(ccaaPorId(cat.id)?.nombre).toBe('Cataluña');
  });

  it('ids desconocidos devuelven vacío/undefined sin lanzar', () => {
    expect(provinciasDeCcaa('no-existe')).toEqual([]);
    expect(provinciaPorId('no-existe')).toBeUndefined();
    expect(ccaaPorId('no-existe')).toBeUndefined();
  });
});

describe('policía autonómica → CCAA fijada', () => {
  it('cada autonómica apunta a una CCAA existente', () => {
    for (const ccaaId of Object.values(CCAA_DE_AUTONOMICA)) {
      expect(ccaaPorId(ccaaId)).toBeDefined();
    }
    expect(ccaaPorId(CCAA_DE_AUTONOMICA.ertzaintza)?.nombre).toBe('País Vasco');
    expect(ccaaPorId(CCAA_DE_AUTONOMICA.mossos)?.nombre).toBe('Cataluña');
    expect(ccaaPorId(CCAA_DE_AUTONOMICA.policia_foral)?.nombre).toBe('Comunidad Foral de Navarra');
    expect(ccaaPorId(CCAA_DE_AUTONOMICA.policia_canaria)?.nombre).toBe('Canarias');
  });
});

describe('slugMunicipio', () => {
  it('normaliza acentos, espacios y mayúsculas', () => {
    expect(slugMunicipio('Alcalá de Henares')).toBe('mun-alcala-de-henares');
    expect(slugMunicipio('  MÓSTOLES  ')).toBe('mun-mostoles');
    expect(slugMunicipio('Vitoria-Gasteiz')).toBe('mun-vitoria-gasteiz');
  });

  it('cadena vacía o sin letras devuelve vacío', () => {
    expect(slugMunicipio('   ')).toBe('');
    expect(slugMunicipio('')).toBe('');
  });
});
