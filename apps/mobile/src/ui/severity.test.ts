import { describe, expect, it } from 'vitest';
import { severity, severityFromGravedad, severityMeta } from './theme';

/**
 * Test smoke del terreno de pruebas (Fase 0). Verifica el único punto de
 * conversión entre el enum de dominio `Gravedad` y la clave visual `Severity`,
 * y que todas las gravedades tienen tokens de color y metadatos (color+texto+icono).
 */
describe('severity (puente dominio ↔ tema)', () => {
  it('mapea las cuatro gravedades del dominio a claves visuales', () => {
    expect(severityFromGravedad('leve')).toBe('leve');
    expect(severityFromGravedad('grave')).toBe('grave');
    expect(severityFromGravedad('muy_grave')).toBe('muyGrave');
    expect(severityFromGravedad('delito')).toBe('delito');
  });

  it('cada gravedad tiene color + etiqueta + icono (nunca solo color)', () => {
    for (const key of Object.keys(severity) as (keyof typeof severity)[]) {
      expect(severity[key].light.bg).toMatch(/^#/);
      expect(severityMeta[key].label.length).toBeGreaterThan(0);
      expect(severityMeta[key].icon.length).toBeGreaterThan(0);
    }
  });
});
