import { describe, expect, it } from 'vitest';
import {
  ACCESOS_LOCAL_EXTRA,
  ACCESOS_POLICIA_NACIONAL,
  ACCESOS_TRAFICO,
  accesosRapidosPara,
} from './accesosRapidos';

/**
 * Tests de los ACCESOS RÁPIDOS por cuerpo (rediseño 2026-09, feedback "validadores de calle"):
 * la app no debe oler a tráfico para quien no lo trabaja. Policía Nacional ve seguridad ciudadana
 * y vía penal; Guardia Civil y Local ven tráfico (Local suma convivencia urbana).
 */
describe('accesosRapidosPara', () => {
  it('Guardia Civil usa el set de tráfico', () => {
    expect(accesosRapidosPara('guardia_civil')).toEqual([...ACCESOS_TRAFICO]);
  });

  it('Policía Nacional NO ve accesos de tráfico, sino seguridad ciudadana/penal', () => {
    const accesos = accesosRapidosPara('policia_nacional');
    expect(accesos).toEqual([...ACCESOS_POLICIA_NACIONAL]);
    expect(accesos).not.toContain('Alcoholemia');
    expect(accesos).toContain('Desobediencia');
    expect(accesos).toContain('Identificación');
  });

  it('Policía Local: tráfico + convivencia urbana (zona azul, patinete)', () => {
    const accesos = accesosRapidosPara('policia_local');
    expect(accesos).toEqual([...ACCESOS_TRAFICO, ...ACCESOS_LOCAL_EXTRA]);
    expect(accesos).toContain('Zona azul');
    expect(accesos).toContain('Patinete');
  });

  it('sin cuerpo (null) cae al set por defecto de tráfico', () => {
    expect(accesosRapidosPara(null)).toEqual([...ACCESOS_TRAFICO]);
  });

  it('policía autonómica cae al set por defecto de tráfico', () => {
    expect(accesosRapidosPara('policia_autonomica')).toEqual([...ACCESOS_TRAFICO]);
  });
});
