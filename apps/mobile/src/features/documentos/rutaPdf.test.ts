import { describe, expect, it } from 'vitest';
import { elegirUriPdf } from './rutaPdf';

/**
 * Semántica del arreglo del PDF (§4.8): tras renombrar el fichero, se devuelve la URI del DESTINO
 * (no la del origen temporal, que era el bug de "no hace nada"), con fallback a la temporal.
 */
describe('elegirUriPdf', () => {
  const DESTINO = 'file:///cache/boletin-de-denuncia.pdf';
  const TEMPORAL = 'file:///cache/Print/abc123.pdf';

  it('devuelve la URI del destino cuando el fichero renombrado existe', () => {
    expect(elegirUriPdf(true, DESTINO, TEMPORAL)).toBe(DESTINO);
  });

  it('NO devuelve la ruta temporal cuando el renombrado ha funcionado', () => {
    expect(elegirUriPdf(true, DESTINO, TEMPORAL)).not.toBe(TEMPORAL);
  });

  it('cae a la URI temporal de expo-print si el destino no existe', () => {
    expect(elegirUriPdf(false, DESTINO, TEMPORAL)).toBe(TEMPORAL);
  });
});
