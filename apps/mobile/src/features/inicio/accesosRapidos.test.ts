import { describe, expect, it } from 'vitest';
import {
  ACCESOS_AUTONOMICA,
  ACCESOS_LOCAL_EXTRA,
  ACCESOS_POLICIA_NACIONAL,
  ACCESOS_SEGURIDAD_CIUDADANA,
  ACCESOS_TRAFICO,
  accesosRapidosPara,
} from './accesosRapidos';

/**
 * Tests de los ACCESOS RÁPIDOS por cuerpo (rediseño 2026-09, feedback "validadores de calle"):
 * la app no debe oler a tráfico para quien no lo trabaja. Policía Nacional ve seguridad ciudadana
 * y vía penal; Guardia Civil y Local ven tráfico (Local suma convivencia urbana). Además cada
 * acceso lleva su DESTINO (buscar/ruta): "Leer derechos" abre la pantalla, no una búsqueda.
 */
const labels = (accesos: { label: string }[]): string[] => accesos.map((a) => a.label);

describe('accesosRapidosPara', () => {
  it('Guardia Civil usa el set de tráfico', () => {
    expect(accesosRapidosPara('guardia_civil')).toEqual([...ACCESOS_TRAFICO]);
  });

  it('Policía Nacional NO ve accesos de tráfico, sino seguridad ciudadana/penal', () => {
    const accesos = accesosRapidosPara('policia_nacional');
    expect(accesos).toEqual([...ACCESOS_POLICIA_NACIONAL]);
    expect(labels(accesos)).not.toContain('Alcoholemia');
    expect(labels(accesos)).toContain('Desobediencia');
    expect(labels(accesos)).toContain('Identificación');
  });

  it('Policía Local: tráfico + convivencia urbana (zona azul, patinete)', () => {
    const accesos = accesosRapidosPara('policia_local');
    expect(accesos).toEqual([...ACCESOS_TRAFICO, ...ACCESOS_LOCAL_EXTRA]);
    expect(labels(accesos)).toContain('Zona azul');
    expect(labels(accesos)).toContain('Patinete');
  });

  it('sin cuerpo (null) cae al set por defecto de tráfico', () => {
    expect(accesosRapidosPara(null)).toEqual([...ACCESOS_TRAFICO]);
  });

  // Task 5 (Auto I1): la POLICÍA AUTONÓMICA NO cae a tráfico. Sin contenido autonómico en su CCAA,
  // usa el set genérico de SEGURIDAD CIUDADANA; con contenido, el set de OCIO/actividades clasificadas.
  it('policía autonómica SIN contenido autonómico: seguridad ciudadana, NUNCA tráfico', () => {
    const accesos = accesosRapidosPara('policia_autonomica');
    expect(accesos).toEqual([...ACCESOS_SEGURIDAD_CIUDADANA]);
    expect(labels(accesos)).not.toContain('Alcoholemia');
    expect(labels(accesos)).not.toContain('Sin seguro');
    expect(labels(accesos)).toContain('Desobediencia');
  });

  it('policía autonómica CON contenido autonómico: set de ocio (nunca tráfico)', () => {
    const accesos = accesosRapidosPara('policia_autonomica', true);
    expect(accesos).toEqual([...ACCESOS_AUTONOMICA]);
    expect(labels(accesos)).toEqual([
      'Ocio nocturno',
      'Sin licencia',
      'Exceso de aforo',
      'Ruidos',
      'Alcohol a menores',
    ]);
    expect(labels(accesos)).not.toContain('Alcoholemia');
  });

  it('el flag de contenido autonómico solo afecta a la autonómica (GC sigue en tráfico)', () => {
    expect(accesosRapidosPara('guardia_civil', true)).toEqual([...ACCESOS_TRAFICO]);
  });
});

describe('destinos de los accesos rápidos', () => {
  it('"Leer derechos" es una RUTA a /derechos, no una búsqueda que daría "nada exacto"', () => {
    const leer = ACCESOS_POLICIA_NACIONAL.find((a) => a.label === 'Leer derechos');
    expect(leer?.destino).toEqual({ tipo: 'ruta', valor: '/derechos' });
  });

  it('"Identificación" lleva al requerimiento del art. 16 (término "identificacion", no la negativa)', () => {
    const ident = ACCESOS_POLICIA_NACIONAL.find((a) => a.label === 'Identificación');
    // 'identificacion' devuelve la ficha del requerimiento (art. 16 LOSC); 'no se identifica' abría
    // la NEGATIVA (art. 36.6), que es otra cosa. No debe volver a apuntar a la negativa.
    expect(ident?.destino).toEqual({ tipo: 'buscar', valor: 'identificacion' });
    expect(ident?.destino).not.toEqual({ tipo: 'buscar', valor: 'no se identifica' });
  });

  it('los accesos de tráfico buscan por su propia etiqueta', () => {
    const sinSeguro = ACCESOS_TRAFICO.find((a) => a.label === 'Sin seguro');
    expect(sinSeguro?.destino).toEqual({ tipo: 'buscar', valor: 'Sin seguro' });
  });
});
