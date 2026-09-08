import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Cierra la CADENA "reportar error desde la ficha" → alta de feedback: el enlace que compone
 * `reportarErrorFichaLink` (tipo `error_contenido` + contexto de la infracción) debe llegar,
 * a través de `add()`, hasta el `Feedback` que se PERSISTE en el dispositivo, conservando
 * `contexto.infraccionId` y `contexto.pantalla`. Solo viaja el id de contenido OFICIAL.
 */

// Módulos con dependencias nativas: dobles inertes para poder testear en Node.
vi.mock('expo-constants', () => ({ default: { expoConfig: { version: '0.1.0' } } }));
vi.mock('react-native', () => ({ Platform: { OS: 'ios' }, Linking: {}, Share: {} }));
vi.mock('@/db/userDb', () => ({
  insertFeedback: vi.fn(async () => {}),
  listFeedback: vi.fn(async () => []),
  markFeedbackSent: vi.fn(async () => {}),
  openUserDb: vi.fn(async () => ({})),
  updateFeedbackEstado: vi.fn(async () => {}),
  deleteFeedback: vi.fn(async () => {}),
}));

import { insertFeedback } from '@/db/userDb';
import { reportarErrorFichaLink } from '@/features/ficha/reportarError';
import { useFeedbackStore } from './store';

describe('feedback · contexto del enganche ficha → feedback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useFeedbackStore.setState({ items: [], loaded: false, loading: false });
  });

  it('add() con el contexto de reportarErrorFichaLink persiste infraccionId y pantalla', async () => {
    // El id se usa tal cual llega del enlace de la ficha (id de contenido OFICIAL, nunca de terceros).
    const link = reportarErrorFichaLink('seed-alcoholemia');

    await useFeedbackStore.getState().add({
      tipo: link.params.tipo,
      texto: 'El importe reducido no cuadra con la fuente citada.',
      contexto: { pantalla: link.params.pantalla, infraccionId: link.params.infraccionId },
    });

    expect(insertFeedback).toHaveBeenCalledTimes(1);
    const persisted = vi.mocked(insertFeedback).mock.calls[0]![0];
    expect(persisted.tipo).toBe('error_contenido');
    expect(persisted.contexto.infraccionId).toBe('seed-alcoholemia');
    expect(persisted.contexto.pantalla).toBe('ficha:seed-alcoholemia');
    // No hay articuloId en este enganche (es una infracción): nace en null, no undefined.
    expect(persisted.contexto.articuloId).toBeNull();

    // El store refleja en memoria lo persistido (misma entrada, contexto intacto).
    expect(useFeedbackStore.getState().items[0]?.contexto.infraccionId).toBe('seed-alcoholemia');
  });
});
