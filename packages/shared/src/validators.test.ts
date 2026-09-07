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
      validarImporte(
        infraccion({ tipo: 'penal', gravedad: 'delito', importeEur: null }),
        'trafico',
      ),
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

describe('validarImporte (seguro obligatorio, LRCSCVM art. 3)', () => {
  it('acepta un importe dentro del rango 601–3.005 €', () => {
    const problemas = validarImporte(
      infraccion({ gravedad: 'muy_grave', importeEur: 601, importeReducidoEur: null }),
      'seguro_obligatorio',
    );
    expect(problemas).toEqual([]);
  });

  it('rechaza un importe por debajo de 601 €', () => {
    const problemas = validarImporte(
      infraccion({ gravedad: 'muy_grave', importeEur: 500, importeReducidoEur: null }),
      'seguro_obligatorio',
    );
    expect(problemas).toHaveLength(1);
    expect(problemas[0]?.campo).toBe('importeEur');
  });

  it('rechaza un importe por encima de 3.005 €', () => {
    const problemas = validarImporte(
      infraccion({ gravedad: 'muy_grave', importeEur: 4000, importeReducidoEur: null }),
      'seguro_obligatorio',
    );
    expect(problemas).toHaveLength(1);
  });
});

describe('validarImporte (velocidad, cuadro graduado LSV)', () => {
  it('acepta un importe dentro del rango 100–600 € (p. ej. 300 €)', () => {
    const problemas = validarImporte(
      infraccion({ gravedad: 'grave', importeEur: 300, importeReducidoEur: 150 }),
      'velocidad',
    );
    expect(problemas).toEqual([]);
  });

  it('rechaza un importe por encima de 600 €', () => {
    const problemas = validarImporte(
      infraccion({ gravedad: 'grave', importeEur: 700, importeReducidoEur: null }),
      'velocidad',
    );
    expect(problemas).toHaveLength(1);
    expect(problemas[0]?.campo).toBe('importeEur');
  });
});

describe('validarImporte (alcohol y drogas, cuadro DGT)', () => {
  it('acepta 500 € (tramo bajo de alcohol)', () => {
    expect(
      validarImporte(
        infraccion({ gravedad: 'muy_grave', importeEur: 500, importeReducidoEur: 250 }),
        'alcohol_drogas',
      ),
    ).toEqual([]);
  });

  it('acepta 1.000 € (tramo alto / drogas)', () => {
    expect(
      validarImporte(
        infraccion({ gravedad: 'muy_grave', importeEur: 1000, importeReducidoEur: 500 }),
        'alcohol_drogas',
      ),
    ).toEqual([]);
  });

  it('rechaza un importe por encima de 1.000 €', () => {
    const problemas = validarImporte(
      infraccion({ gravedad: 'muy_grave', importeEur: 1500, importeReducidoEur: null }),
      'alcohol_drogas',
    );
    expect(problemas).toHaveLength(1);
    expect(problemas[0]?.campo).toBe('importeEur');
  });
});

describe('validarImporte: bordes EXACTOS de rango (tráfico, LSV art. 80)', () => {
  // El borde de rango es donde un error de contenido pasa desapercibido: se prueban los
  // extremos inclusivos y el primer valor fuera de rango de cada gravedad.
  it('leve: 0 y 100 € entran; 101 € queda fuera', () => {
    expect(validarImporte(infraccion({ gravedad: 'leve', importeEur: 0, importeReducidoEur: null }), 'trafico')).toEqual([]);
    expect(validarImporte(infraccion({ gravedad: 'leve', importeEur: 100, importeReducidoEur: null }), 'trafico')).toEqual([]);
    expect(validarImporte(infraccion({ gravedad: 'leve', importeEur: 101, importeReducidoEur: null }), 'trafico')).toHaveLength(1);
  });

  it('grave: solo 200 € es válido (valor fijo); 199 y 201 quedan fuera', () => {
    expect(validarImporte(infraccion({ gravedad: 'grave', importeEur: 200, importeReducidoEur: null }), 'trafico')).toEqual([]);
    expect(validarImporte(infraccion({ gravedad: 'grave', importeEur: 199, importeReducidoEur: null }), 'trafico')).toHaveLength(1);
    expect(validarImporte(infraccion({ gravedad: 'grave', importeEur: 201, importeReducidoEur: null }), 'trafico')).toHaveLength(1);
  });

  it('muy grave: solo 500 € es válido (valor fijo); 499 y 501 quedan fuera', () => {
    expect(validarImporte(infraccion({ gravedad: 'muy_grave', importeEur: 500, importeReducidoEur: null }), 'trafico')).toEqual([]);
    expect(validarImporte(infraccion({ gravedad: 'muy_grave', importeEur: 499, importeReducidoEur: null }), 'trafico')).toHaveLength(1);
    expect(validarImporte(infraccion({ gravedad: 'muy_grave', importeEur: 501, importeReducidoEur: null }), 'trafico')).toHaveLength(1);
  });
});

describe('validarImporte: bordes EXACTOS de rango (seguridad ciudadana, LO 4/2015 art. 39)', () => {
  it('leve: 100 y 600 € entran; 99 y 601 salen del tramo leve', () => {
    expect(validarImporte(infraccion({ gravedad: 'leve', importeEur: 100, importeReducidoEur: null }), 'seguridad_ciudadana')).toEqual([]);
    expect(validarImporte(infraccion({ gravedad: 'leve', importeEur: 600, importeReducidoEur: null }), 'seguridad_ciudadana')).toEqual([]);
    expect(validarImporte(infraccion({ gravedad: 'leve', importeEur: 99, importeReducidoEur: null }), 'seguridad_ciudadana')).toHaveLength(1);
    expect(validarImporte(infraccion({ gravedad: 'leve', importeEur: 601, importeReducidoEur: null }), 'seguridad_ciudadana')).toHaveLength(1);
  });

  it('grave: 601 y 30.000 € entran; 30.001 sale', () => {
    expect(validarImporte(infraccion({ gravedad: 'grave', importeEur: 601, importeReducidoEur: null }), 'seguridad_ciudadana')).toEqual([]);
    expect(validarImporte(infraccion({ gravedad: 'grave', importeEur: 30_000, importeReducidoEur: null }), 'seguridad_ciudadana')).toEqual([]);
    expect(validarImporte(infraccion({ gravedad: 'grave', importeEur: 30_001, importeReducidoEur: null }), 'seguridad_ciudadana')).toHaveLength(1);
  });

  it('muy grave: 30.001 y 600.000 € entran; 600.001 sale', () => {
    expect(validarImporte(infraccion({ gravedad: 'muy_grave', importeEur: 30_001, importeReducidoEur: null }), 'seguridad_ciudadana')).toEqual([]);
    expect(validarImporte(infraccion({ gravedad: 'muy_grave', importeEur: 600_000, importeReducidoEur: null }), 'seguridad_ciudadana')).toEqual([]);
    expect(validarImporte(infraccion({ gravedad: 'muy_grave', importeEur: 600_001, importeReducidoEur: null }), 'seguridad_ciudadana')).toHaveLength(1);
  });
});

describe('validarImporte: marcos SIN rango legal único (municipal / autonomico)', () => {
  it('municipal: no valida rango, pero sí coherencia (falta importe)', () => {
    const problemas = validarImporte(infraccion({ importeEur: null }), 'municipal');
    expect(problemas).toHaveLength(1);
    expect(problemas[0]?.campo).toBe('importeEur');
  });

  it('municipal: acepta cualquier importe positivo con reducido coherente', () => {
    expect(validarImporte(infraccion({ importeEur: 750, importeReducidoEur: 375 }), 'municipal')).toEqual([]);
  });

  it('autonomico: detecta reducido mayor que el base (única comprobación posible)', () => {
    const problemas = validarImporte(infraccion({ importeEur: 300, importeReducidoEur: 400 }), 'autonomico');
    expect(problemas.some((p) => p.campo === 'importeReducidoEur')).toBe(true);
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
