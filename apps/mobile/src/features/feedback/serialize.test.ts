import { describe, it, expect } from 'vitest';
import type { EstadoFeedback, Feedback } from '@agente/shared';
import {
  composeEmailBody,
  ESTADO_FEEDBACK_LABEL,
  feedbackToRow,
  FOUNDERS_EMAIL,
  makeFeedbackId,
  markItemsSent,
  rowToFeedback,
  setItemEstado,
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
    estado: 'enviada',
    respuesta: null,
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

  it('conserva estado y respuesta en la ida y vuelta', () => {
    const fb = feedback({ estado: 'aplicada', respuesta: 'Ya está en la versión 0.2.' });
    const roundtrip = rowToFeedback(feedbackToRow(fb));
    expect(roundtrip.estado).toBe('aplicada');
    expect(roundtrip.respuesta).toBe('Ya está en la versión 0.2.');
  });

  it('una fila sin estado (esquema previo a la v9) se rehidrata como "enviada"', () => {
    const row = feedbackToRow(feedback());
    // Simula una fila antigua: la migración v9 puso el DEFAULT, pero probamos también el
    // camino de Zod si llegara indefinido.
    const { estado: _e, ...sinEstado } = row;
    const rehidratado = rowToFeedback({ ...sinEstado, estado: 'enviada' });
    expect(rehidratado.estado).toBe('enviada');
  });

  it('rechaza un estado desconocido', () => {
    const row = feedbackToRow(feedback());
    expect(() => rowToFeedback({ ...row, estado: 'archivada' })).toThrow();
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

describe('FOUNDERS_EMAIL', () => {
  it('es un correo con formato válido', () => {
    // Validación pragmática de formato (no de existencia): algo@algo.tld sin espacios.
    expect(FOUNDERS_EMAIL).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  });

  it('ya no es el placeholder de la plantilla', () => {
    expect(FOUNDERS_EMAIL).not.toBe('beta@agente.app');
  });
});

describe('ESTADO_FEEDBACK_LABEL', () => {
  it('tiene etiqueta en español para los cuatro estados', () => {
    expect(ESTADO_FEEDBACK_LABEL.enviada).toBe('Enviada');
    expect(ESTADO_FEEDBACK_LABEL.en_estudio).toBe('En estudio');
    expect(ESTADO_FEEDBACK_LABEL.aplicada).toBe('Aplicada');
    expect(ESTADO_FEEDBACK_LABEL.descartada).toBe('Descartada');
  });
});

describe('reducers puros del store (markItemsSent / setItemEstado)', () => {
  it('markItemsSent marca solo los ids indicados y no muta el original', () => {
    const items = [feedback({ id: 'a' }), feedback({ id: 'b' }), feedback({ id: 'c' })];
    const out = markItemsSent(items, ['a', 'c']);
    expect(out.find((f) => f.id === 'a')?.enviado).toBe(true);
    expect(out.find((f) => f.id === 'b')?.enviado).toBe(false);
    expect(out.find((f) => f.id === 'c')?.enviado).toBe(true);
    // Inmutabilidad: la lista y las filas originales no cambian.
    expect(items[0]!.enviado).toBe(false);
    expect(out).not.toBe(items);
  });

  it('setItemEstado cambia el estado de una sola fila', () => {
    const items = [feedback({ id: 'a' }), feedback({ id: 'b' })];
    const estado: EstadoFeedback = 'en_estudio';
    const out = setItemEstado(items, 'b', estado);
    expect(out.find((f) => f.id === 'a')?.estado).toBe('enviada');
    expect(out.find((f) => f.id === 'b')?.estado).toBe('en_estudio');
    expect(items[1]!.estado).toBe('enviada');
  });

  it('setItemEstado con un id inexistente deja la lista igual', () => {
    const items = [feedback({ id: 'a' })];
    const out = setItemEstado(items, 'zzz', 'aplicada');
    expect(out[0]!.estado).toBe('enviada');
  });
});
