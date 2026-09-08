import { describe, expect, it } from 'vitest';
import { esHoy } from './fechas';

describe('esHoy', () => {
  it('es cierto cuando la fecha civil coincide con hoy', () => {
    expect(esHoy('2026-09-08', '2026-09-08')).toBe(true);
  });

  it('es falso cuando cambia el día', () => {
    expect(esHoy('2026-09-07', '2026-09-08')).toBe(false);
    expect(esHoy('2026-09-09', '2026-09-08')).toBe(false);
  });

  it('es falso cuando cambia el mes o el año aunque coincida el día', () => {
    expect(esHoy('2026-08-08', '2026-09-08')).toBe(false);
    expect(esHoy('2025-09-08', '2026-09-08')).toBe(false);
  });

  it('compara solo la parte de fecha, ignora hora/zona detrás', () => {
    expect(esHoy('2026-09-08T23:59:00Z', '2026-09-08')).toBe(true);
    expect(esHoy('2026-09-08', '2026-09-08T00:00:00+02:00')).toBe(true);
  });
});
