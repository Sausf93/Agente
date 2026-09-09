import { describe, expect, it } from 'vitest';
import { validarImporte, validarMinimosPublicacion } from '@agente/shared';
import { SEED_EXTRANJERIA_LOCAL } from './extranjeriaLocalSeed.js';

/**
 * Tests del seed de EXTRANJERÍA + POLICÍA LOCAL: integridad, importes dentro de su marco legal,
 * mínimos de publicación y —lo más importante— que la ficha de estancia irregular conserva el
 * MENSAJE CLAVE (no es delito / no procede detención penal) y no la ofrece la vía penal.
 */

const idsArticulos = new Set(SEED_EXTRANJERIA_LOCAL.articulos.map((a) => a.id));
const porId = (id: string) =>
  SEED_EXTRANJERIA_LOCAL.infracciones.find((i) => i.infraccion.id === id);

describe('SEED_EXTRANJERIA_LOCAL: integridad', () => {
  it('siembra 4 infracciones administrativas (extranjería + PPP)', () => {
    expect(SEED_EXTRANJERIA_LOCAL.infracciones).toHaveLength(4);
    for (const { infraccion } of SEED_EXTRANJERIA_LOCAL.infracciones) {
      expect(infraccion.tipo, infraccion.id).toBe('administrativa');
    }
  });

  it('cada infracción cita un artículo del seed y tiene ≥3 sinónimos', () => {
    for (const { infraccion, sinonimos } of SEED_EXTRANJERIA_LOCAL.infracciones) {
      expect(idsArticulos.has(infraccion.articuloId), infraccion.id).toBe(true);
      expect(sinonimos.length, infraccion.id).toBeGreaterThanOrEqual(3);
    }
  });

  it('todas quedan pendientes de revisión con su nota', () => {
    for (const item of SEED_EXTRANJERIA_LOCAL.infracciones) {
      expect(item.revision, item.infraccion.id).toBe('pendiente_revision');
      expect(item.notaRevision.length).toBeGreaterThan(0);
    }
  });

  it('cada importe valida en su marco y supera los mínimos de publicación', () => {
    for (const { infraccion, sinonimos, marcoImporte } of SEED_EXTRANJERIA_LOCAL.infracciones) {
      expect(validarImporte(infraccion, marcoImporte), infraccion.id).toEqual([]);
      expect(validarMinimosPublicacion(infraccion, sinonimos.length), infraccion.id).toEqual([]);
    }
  });
});

describe('SEED_EXTRANJERIA_LOCAL: mensaje clave de la estancia irregular', () => {
  it('la estancia irregular es GRAVE ADMINISTRATIVA, nunca penal', () => {
    const est = porId('ext-estancia-irregular');
    expect(est).toBeDefined();
    expect(est!.infraccion.tipo).toBe('administrativa');
    expect(est!.infraccion.gravedad).toBe('grave');
    expect(est!.marcoImporte).toBe('extranjeria');
  });

  it('el texto deja claro que NO es delito y NO procede detención penal', () => {
    const est = porId('ext-estancia-irregular')!;
    const boletin = est.infraccion.textoBoletin.toLowerCase();
    expect(boletin).toContain('no es delito');
    expect(boletin).toMatch(/no procede detenci[oó]n penal|no procede.*detenci/);
    // Ninguna consecuencia de tipo detención en una infracción administrativa de extranjería.
    expect(est.consecuencias.some((c) => c.tipo === 'detencion')).toBe(false);
  });
});

describe('SEED_EXTRANJERIA_LOCAL: relevancia por cuerpo', () => {
  it('la Ley de animales peligrosos NO se etiqueta para la Policía Nacional', () => {
    const ppp = SEED_EXTRANJERIA_LOCAL.normas.find((n) => n.codigo === 'LPPP');
    expect(ppp).toBeDefined();
    expect(ppp!.cuerpos).not.toContain('policia_nacional');
  });

  it('la Ley de extranjería SÍ es relevante para todos los cuerpos', () => {
    const loex = SEED_EXTRANJERIA_LOCAL.normas.find((n) => n.codigo === 'LOEX');
    expect(loex!.cuerpos).toContain('policia_nacional');
  });
});
