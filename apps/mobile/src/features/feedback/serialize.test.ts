import { describe, it, expect } from 'vitest';
import type { Feedback } from '@agente/shared';
import {
  composeEmailBody,
  feedbackToRow,
  makeFeedbackId,
  rowToFeedback,
  TIPO_FEEDBACK_LABEL,
} from './serialize';

function feedback(overrides: Partial<Feedback> = {}): Feedback {
  return {
    id: 'fb_1',
    createdAt: '2026-09-04T10:00:00+02:00',
    tipo: 'sugerencia',
    texto: 'Poder filtrar por cuerpo en el buscador.',
    contexto: { pantalla: 'mas', articuloId: null, infraccionId: null },
    appVersion: '0.1.0',
    platform: 'ios',
    cuerpo: 'guardia_civil',
    territorio: 'ES-MU',
    enviado: false,
    ...overrides,
  };
}

describe('mapeo fila SQLite ↔ Feedback', () => {
  it('ida y vuelta conserva los datos', () => {
    const fb = feedback();
    const roundtrip = rowToFeedback(feedbackToRow(fb));
    expect(roundtrip).toEqual(fb);
  });

  it('serializa enviado como 0/1', () => {
    expect(feedbackToRow(feedback({ enviado: false })).enviado).toBe(0);
    expect(feedbackToRow(feedback({ enviado: true })).enviado).toBe(1);
  });

  it('serializa el contexto como JSON y lo recupera', () => {
    const fb = feedback({
      contexto: { pantalla: 'ficha', articuloId: 'art_9', infraccionId: 'inf_2' },
    });
    const row = feedbackToRow(fb);
    expect(JSON.parse(row.contexto_json)).toEqual(fb.contexto);
    expect(rowToFeedback(row).contexto.articuloId).toBe('art_9');
  });

  it('rowToFeedback valida con Zod y rechaza filas corruptas', () => {
    const row = feedbackToRow(feedback());
    expect(() => rowToFeedback({ ...row, tipo: 'invalido' })).toThrow();
  });
});

describe('makeFeedbackId', () => {
  it('produce un id con prefijo fb_', () => {
    expect(makeFeedbackId(1_725_000_000_000, 0.5)).toMatch(/^fb_[0-9a-z]+_[0-9a-z]+$/);
  });

  it('ids distintos para tiempos o aleatorios distintos', () => {
    const a = makeFeedbackId(1000, 0.1);
    const b = makeFeedbackId(1000, 0.9);
    const c = makeFeedbackId(2000, 0.1);
    expect(a).not.toBe(b);
    expect(a).not.toBe(c);
  });
});

describe('composeEmailBody', () => {
  it('asunto singular con la etiqueta del tipo', () => {
    const { subject } = composeEmailBody([feedback({ tipo: 'error_tecnico' })]);
    expect(subject).toContain(TIPO_FEEDBACK_LABEL.error_tecnico);
  });

  it('asunto plural cuando hay varias aportaciones', () => {
    const { subject } = composeEmailBody([feedback(), feedback({ id: 'fb_2' })]);
    expect(subject).toContain('2 aportaciones');
  });

  it('incluye el texto del socio y el contexto no identificativo', () => {
    const { body } = composeEmailBody([
      feedback({ texto: 'Falta el 2.4 del RGV', cuerpo: 'policia_local', territorio: 'ES-MU' }),
    ]);
    expect(body).toContain('Falta el 2.4 del RGV');
    expect(body).toContain('policia_local');
    expect(body).toContain('ES-MU');
  });

  it('incluye el contexto de ficha cuando existe (gancho reportar error)', () => {
    const { body } = composeEmailBody([
      feedback({ contexto: { pantalla: 'ficha', articuloId: 'art_9', infraccionId: null } }),
    ]);
    expect(body).toContain('art_9');
    expect(body).toContain('Pantalla: ficha');
  });

  it('separa cada aportación con una línea divisoria', () => {
    const { body } = composeEmailBody([feedback(), feedback({ id: 'fb_2' })]);
    expect(body).toContain('#1');
    expect(body).toContain('#2');
    expect(body).toContain('----------');
  });
});
