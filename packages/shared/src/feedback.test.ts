import { describe, it, expect } from 'vitest';
import { Feedback, NuevoFeedback, ContextoFeedback } from './feedback.js';

/** Fábrica de feedback válido mínimo para los tests. */
function feedback(overrides: Record<string, unknown> = {}) {
  return {
    id: 'fb_1',
    createdAt: '2026-09-04T10:00:00+02:00',
    tipo: 'sugerencia',
    texto: 'Estaría bien poder filtrar por cuerpo en el buscador.',
    contexto: { pantalla: 'mas', articuloId: null, infraccionId: null },
    appVersion: '0.1.0',
    platform: 'ios',
    cuerpo: 'guardia_civil',
    territorio: 'ES-MU',
    enviado: false,
    ...overrides,
  };
}

describe('Feedback (esquema)', () => {
  it('acepta un feedback válido de sugerencia', () => {
    const parsed = Feedback.parse(feedback());
    expect(parsed.tipo).toBe('sugerencia');
    expect(parsed.enviado).toBe(false);
  });

  it('acepta los tres tipos de feedback', () => {
    for (const tipo of ['sugerencia', 'error_contenido', 'error_tecnico'] as const) {
      expect(() => Feedback.parse(feedback({ tipo }))).not.toThrow();
    }
  });

  it('rechaza un tipo desconocido', () => {
    expect(() => Feedback.parse(feedback({ tipo: 'queja' }))).toThrow();
  });

  it('rechaza texto demasiado corto (toque accidental)', () => {
    const res = Feedback.safeParse(feedback({ texto: 'a' }));
    expect(res.success).toBe(false);
  });

  it('recorta espacios del texto antes de validar', () => {
    const parsed = Feedback.parse(feedback({ texto: '   hola mundo   ' }));
    expect(parsed.texto).toBe('hola mundo');
  });

  it('rechaza texto por encima del máximo', () => {
    const res = Feedback.safeParse(feedback({ texto: 'x'.repeat(2001) }));
    expect(res.success).toBe(false);
  });

  it('rechaza una plataforma no soportada', () => {
    expect(() => Feedback.parse(feedback({ platform: 'web' }))).toThrow();
  });

  it('permite cuerpo y territorio nulos (feedback anónimo sin perfil)', () => {
    const parsed = Feedback.parse(feedback({ cuerpo: null, territorio: null }));
    expect(parsed.cuerpo).toBeNull();
    expect(parsed.territorio).toBeNull();
  });

  it('aplica valores por defecto de contexto y enviado', () => {
    const { contexto: _c, enviado: _e, ...sinDefaults } = feedback();
    const parsed = Feedback.parse(sinDefaults);
    expect(parsed.enviado).toBe(false);
    expect(parsed.contexto).toEqual({ pantalla: null, articuloId: null, infraccionId: null });
  });

  it('conserva el contexto de una ficha (gancho reportar error)', () => {
    const parsed = Feedback.parse(
      feedback({
        tipo: 'error_contenido',
        contexto: { pantalla: 'ficha', articuloId: 'art_123', infraccionId: 'inf_9' },
      }),
    );
    expect(parsed.contexto.articuloId).toBe('art_123');
    expect(parsed.contexto.infraccionId).toBe('inf_9');
  });
});

describe('ContextoFeedback', () => {
  it('se rellena entero al parsear un objeto vacío', () => {
    expect(ContextoFeedback.parse({})).toEqual({
      pantalla: null,
      articuloId: null,
      infraccionId: null,
    });
  });
});

describe('NuevoFeedback (formulario)', () => {
  it('no exige id, createdAt ni enviado', () => {
    const parsed = NuevoFeedback.parse({
      tipo: 'error_tecnico',
      texto: 'La app se cierra al abrir el cuadrante.',
      appVersion: '0.1.0',
      platform: 'android',
    });
    expect(parsed.tipo).toBe('error_tecnico');
    expect(parsed.cuerpo).toBeNull();
  });
});
