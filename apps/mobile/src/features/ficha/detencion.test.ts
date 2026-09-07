import { describe, expect, it } from 'vitest';
import { evaluarDetencion, type OrientacionDetencion } from '@agente/shared';
import {
  CIRCUNSTANCIAS_DETENCION,
  ORIENTACION_VISUAL,
  parseReglaDetencion,
} from './detencion';

/**
 * Tests de las piezas de UI del árbol de detención (la lógica jurídica ya está cubierta en
 * `@agente/shared`). Aquí se fija: (1) que la `regla` de la consecuencia se rehidrata a una
 * entrada válida para el motor, y (2) que toda orientación del motor tiene presentación.
 */
describe('parseReglaDetencion', () => {
  it('rehidrata el escenario base y sirve de entrada válida al motor', () => {
    const regla = {
      motor: 'detencion',
      gravedadCp: 'grave',
      escenarioBase: { gravedadCp: 'grave', flagrancia: true, domicilioConocido: true },
      orientacionBase: 'procede',
    };
    const entrada = parseReglaDetencion(regla);
    expect(entrada).not.toBeNull();
    expect(entrada!.gravedadCp).toBe('grave');
    expect(entrada!.flagrancia).toBe(true);
    // La entrada rehidratada reproduce la orientación base guardada en el paquete.
    expect(evaluarDetencion(entrada!).orientacion).toBe('procede');
  });

  it('devuelve null si la regla no es de detención o falta', () => {
    expect(parseReglaDetencion(null)).toBeNull();
    expect(parseReglaDetencion({})).toBeNull();
    expect(parseReglaDetencion({ motor: 'otra_cosa' })).toBeNull();
  });

  it('devuelve null si el escenario base no valida', () => {
    expect(parseReglaDetencion({ motor: 'detencion', escenarioBase: { gravedadCp: 'inventada' } })).toBeNull();
  });
});

describe('ORIENTACION_VISUAL', () => {
  it('cubre las cuatro orientaciones del motor con etiqueta (nunca solo color)', () => {
    const orientaciones: OrientacionDetencion[] = [
      'procede',
      'puede_proceder',
      'no_procede_salvo',
      'no_detencion_penal',
    ];
    for (const o of orientaciones) {
      const v = ORIENTACION_VISUAL[o];
      expect(v).toBeTruthy();
      expect(v.etiqueta.length).toBeGreaterThan(0);
    }
  });

  it('"No es detención penal" usa el tono informativo (azul), distinto del rojo noProcede', () => {
    // Vía administrativa / protección de menores NO debe confundirse con "delito leve, ojo".
    expect(ORIENTACION_VISUAL.no_detencion_penal.tono).toBe('info');
    expect(ORIENTACION_VISUAL.no_procede_salvo.tono).toBe('noProcede');
    expect(ORIENTACION_VISUAL.no_detencion_penal.tono).not.toBe(
      ORIENTACION_VISUAL.no_procede_salvo.tono,
    );
  });
});

describe('CIRCUNSTANCIAS_DETENCION', () => {
  it('los campos son booleanos de la entrada del motor (todos distintos de gravedadCp)', () => {
    const campos = CIRCUNSTANCIAS_DETENCION.map((c) => c.campo);
    expect(new Set(campos).size).toBe(campos.length); // sin duplicados
    expect(campos).not.toContain('gravedadCp');
  });
});
