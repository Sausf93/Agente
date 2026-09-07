import { describe, expect, it } from 'vitest';
import { construirSolicitudOrdenanza } from './solicitarOrdenanza';

describe('construirSolicitudOrdenanza', () => {
  it('incluye municipio y CCAA cuando ambos están', () => {
    const s = construirSolicitudOrdenanza('La Laguna', 'Canarias');
    expect(s.territorio).toBe('La Laguna (Canarias)');
    expect(s.texto).toContain('La Laguna (Canarias)');
    expect(s.texto.toLowerCase()).toContain('ordenanza');
  });

  it('funciona sin CCAA resuelta (solo municipio)', () => {
    const s = construirSolicitudOrdenanza('Arona', null);
    expect(s.territorio).toBe('Arona');
    expect(s.texto).toContain('Arona');
    expect(s.texto).not.toContain('(');
  });

  it('recorta espacios sobrantes del municipio y la CCAA', () => {
    const s = construirSolicitudOrdenanza('  Adeje  ', '  Canarias  ');
    expect(s.territorio).toBe('Adeje (Canarias)');
  });
});
