import { describe, expect, it } from 'vitest';
import {
  FTS_COLUMNAS,
  FTS_PESOS_BM25,
  FTS_PESOS_BM25_ORDENADOS,
  normalizarBusqueda,
} from './contentPackage.js';

/**
 * `normalizarBusqueda` es un CONTRATO: la misma normalización debe aplicarse al indexar en el
 * pipeline y al buscar en la app. Si divergen, "faro roto" deja de encontrar "alumbrado
 * deficiente". Estos tests fijan el plegado esperado (minúsculas, sin tildes, ñ→n, espacios
 * colapsados) que debe coincidir con el tokenizador FTS5 `unicode61 remove_diacritics 2`.
 */
describe('normalizarBusqueda (contrato pipeline ↔ app)', () => {
  it('pasa a minúsculas', () => {
    expect(normalizarBusqueda('FARO ROTO')).toBe('faro roto');
    expect(normalizarBusqueda('Móvil')).toBe('movil');
  });

  it('quita tildes y diéresis (plegado remove_diacritics)', () => {
    expect(normalizarBusqueda('móvil')).toBe('movil');
    expect(normalizarBusqueda('vehículo')).toBe('vehiculo');
    expect(normalizarBusqueda('desagüe')).toBe('desague');
    expect(normalizarBusqueda('ÁÉÍÓÚ')).toBe('aeiou');
  });

  it('pliega la ñ a n (como remove_diacritics 2)', () => {
    expect(normalizarBusqueda('niño')).toBe('nino');
    expect(normalizarBusqueda('SEÑAL')).toBe('senal');
  });

  it('colapsa espacios internos y recorta los extremos', () => {
    expect(normalizarBusqueda('  faro    roto  ')).toBe('faro roto');
    expect(normalizarBusqueda('sin\tseguro')).toBe('sin seguro');
    expect(normalizarBusqueda('\n uso  del   movil \n')).toBe('uso del movil');
  });

  it('es IDEMPOTENTE: normalizar dos veces da el mismo resultado', () => {
    const entradas = ['FÁRO Roto', '  Señal   Vertical ', 'Vehículo A-7'];
    for (const e of entradas) {
      const una = normalizarBusqueda(e);
      expect(normalizarBusqueda(una)).toBe(una);
    }
  });

  it('conserva dígitos y guiones (búsqueda por artículo/vía)', () => {
    expect(normalizarBusqueda('RGC 18.2')).toBe('rgc 18.2');
    expect(normalizarBusqueda('A-7')).toBe('a-7');
  });

  it('una errata NO se corrige (limitación conocida: solo pliega, no hay distancia de edición)', () => {
    // Documenta el comportamiento actual: "movdil" no se normaliza a "movil".
    expect(normalizarBusqueda('movdil')).toBe('movdil');
  });
});

describe('pesos FTS5 (orden posicional del bm25)', () => {
  it('los pesos ordenados siguen el orden de las columnas indexadas', () => {
    expect(FTS_PESOS_BM25_ORDENADOS).toEqual(FTS_COLUMNAS.map((c) => FTS_PESOS_BM25[c]));
  });

  it('el título pesa más que el texto de boletín (modelo de ranking §4.3)', () => {
    expect(FTS_PESOS_BM25.titulo_corto).toBeGreaterThan(FTS_PESOS_BM25.texto_boletin);
    expect(FTS_PESOS_BM25.sinonimos).toBeGreaterThan(FTS_PESOS_BM25.texto_boletin);
  });
});
