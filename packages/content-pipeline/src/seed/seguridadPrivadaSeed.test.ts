import { describe, expect, it } from 'vitest';
import { validarImporte, validarMinimosPublicacion } from '@agente/shared';
import { SEED_SEGURIDAD_PRIVADA } from './seguridadPrivadaSeed.js';

/**
 * Tests del SEED de SEGURIDAD PRIVADA (Ley 5/2014): norma estatal, competencia de GC y PN, importes
 * cotejados contra el BOE (arts. 61/62) y mínimos de publicación.
 */
const porId = (id: string) =>
  SEED_SEGURIDAD_PRIVADA.infracciones.find((i) => i.infraccion.id === id);
const idsArticulos = new Set(SEED_SEGURIDAD_PRIVADA.articulos.map((a) => a.id));

describe('SEED_SEGURIDAD_PRIVADA (Ley 5/2014)', () => {
  it('la norma es estatal y la controlan la Policía Nacional y la Guardia Civil', () => {
    expect(SEED_SEGURIDAD_PRIVADA.normas).toHaveLength(1);
    const lsp = SEED_SEGURIDAD_PRIVADA.normas[0]!;
    expect(lsp.codigo).toBe('LSP');
    expect(lsp.ambito).toBe('estatal');
    expect(lsp.territorioId).toBeNull();
    expect(lsp.cuerpos).toContain('policia_nacional');
    expect(lsp.cuerpos).toContain('guardia_civil');
    expect(lsp.cuerpos).not.toContain('policia_local');
  });

  it('siembra las fichas de calle clave (vigilante sin habilitación, empresa sin autorización…)', () => {
    for (const id of [
      'segpriv-sin-habilitacion',
      'segpriv-empresa-sin-autorizacion',
      'segpriv-negativa-auxilio-fcs',
      'segpriv-negativa-identificarse',
      'segpriv-exceso-funciones',
      'segpriv-sin-uniforme-tip',
    ]) {
      expect(porId(id), id).toBeDefined();
    }
  });

  it('cada infracción es estatal, administrativa, con competencia GC/PN, artículo y ≥2 sinónimos', () => {
    for (const { infraccion, sinonimos } of SEED_SEGURIDAD_PRIVADA.infracciones) {
      expect(infraccion.ambito, infraccion.id).toBe('estatal');
      expect(infraccion.tipo, infraccion.id).toBe('administrativa');
      expect(infraccion.competencia.cuerpos, infraccion.id).toContain('guardia_civil');
      expect(infraccion.competencia.cuerpos, infraccion.id).toContain('policia_nacional');
      expect(idsArticulos.has(infraccion.articuloId), infraccion.id).toBe(true);
      expect(sinonimos.length, infraccion.id).toBeGreaterThanOrEqual(2);
    }
  });

  it('los importes (arts. 61/62, euros) validan en el marco `seguridad_privada` y superan los mínimos', () => {
    for (const { infraccion, sinonimos, marcoImporte } of SEED_SEGURIDAD_PRIVADA.infracciones) {
      expect(marcoImporte, infraccion.id).toBe('seguridad_privada');
      expect(validarImporte(infraccion, marcoImporte), infraccion.id).toEqual([]);
      expect(
        validarMinimosPublicacion(infraccion, sinonimos.length, marcoImporte),
        infraccion.id,
      ).toEqual([]);
      // Horquilla coherente: máximo ≥ mínimo.
      expect(infraccion.importeMaxEur ?? 0, infraccion.id).toBeGreaterThanOrEqual(
        infraccion.importeEur ?? 0,
      );
    }
  });

  it('las cuantías cotejadas contra el BOE se publican verificado', () => {
    // Personal (art. 62): muy grave 6.001-30.000; grave 1.001-6.000; leve 300-1.000.
    // Empresa (art. 61): muy grave 30.001-600.000.
    expect(porId('segpriv-sin-habilitacion')!.infraccion.importeEur).toBe(6001);
    expect(porId('segpriv-empresa-sin-autorizacion')!.infraccion.importeEur).toBe(30001);
    expect(porId('segpriv-exceso-funciones')!.infraccion.importeEur).toBe(1001);
    expect(porId('segpriv-sin-uniforme-tip')!.infraccion.importeEur).toBe(300);
    for (const item of SEED_SEGURIDAD_PRIVADA.infracciones) {
      expect(item.revision, item.infraccion.id).toBe('verificado');
    }
  });
});
