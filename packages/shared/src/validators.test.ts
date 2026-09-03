import { describe, it, expect } from 'vitest';
import { validarImporte, validarMinimosPublicacion } from './validators.js';
import type { Infraccion } from './content.js';

/** Fábrica de infracción válida mínima para los tests. */
function infraccion(overrides: Partial<Infraccion> = {}): Infraccion {
  return {
    id: 'inf_1',
    articuloId: 'art_1',
    codigoDgt: null,
    tituloCorto: 'Alumbrado deficiente',
    gravedad: 'leve',
    tipo: 'administrativa',
    importeEur: 80,
    importeReducidoEur: 40,
    puntos: 0,
    textoBoletin: 'Circular con el alumbrado en deficientes condiciones...',
    variantesBoletin: [],
    competencia: { cuerpos: ['guardia_civil'], via: 'interurbana' },
    ambito: 'estatal',
    territorioId: null,
    desplazaId: null,
    origen: 'oficial',
    validFrom: '2026-01-01T00:00:00+01:00',
    validTo: null,
    ...overrides,
  };
}

describe('validarImporte (tráfico, LSV art. 80)', () => {
  it('acepta una leve dentro de rango', () => {
    expect(validarImporte(infraccion({ gravedad: 'leve', importeEur: 80 }), 'trafico')).toEqual([]);
  });

  it('rechaza una leve por encima de 100 €', () => {
    const problemas = validarImporte(infraccion({ gravedad: 'leve', importeEur: 150 }), 'trafico');
    expect(problemas).toHaveLength(1);
    expect(problemas[0]?.campo).toBe('importeEur');
  });

  it('rechaza importe reducido mayor que el base', () => {
    const problemas = validarImporte(
      infraccion({ importeEur: 80, importeReducidoEur: 90 }),
      'trafico',
    );
    expect(problemas.some((p) => p.campo === 'importeReducidoEur')).toBe(true);
  });

  it('no valida importe en delitos (vía penal)', () => {
    expect(
      validarImporte(infraccion({ tipo: 'penal', gravedad: 'delito', importeEur: null }), 'trafico'),
    ).toEqual([]);
  });
});

describe('validarImporte (seguridad ciudadana, LO 4/2015 art. 39)', () => {
  it('acepta una grave dentro de rango', () => {
    const problemas = validarImporte(
      infraccion({ gravedad: 'grave', importeEur: 1000 }),
      'seguridad_ciudadana',
    );
    expect(problemas).toEqual([]);
  });

  it('rechaza una leve por debajo de 100 €', () => {
    const problemas = validarImporte(
      infraccion({ gravedad: 'leve', importeEur: 50 }),
      'seguridad_ciudadana',
    );
    expect(problemas).toHaveLength(1);
  });
});

describe('validarMinimosPublicacion (sección 8.3)', () => {
  it('exige al menos 2 sinónimos', () => {
    const problemas = validarMinimosPublicacion(infraccion(), 1);
    expect(problemas.some((p) => p.campo === 'sinonimos')).toBe(true);
  });

  it('pasa con todo lo mínimo cumplido', () => {
    expect(validarMinimosPublicacion(infraccion(), 2)).toEqual([]);
  });

  it('detecta falta de importe en administrativa', () => {
    const problemas = validarMinimosPublicacion(infraccion({ importeEur: null }), 2);
    expect(problemas.some((p) => p.campo === 'importeEur')).toBe(true);
  });
});
