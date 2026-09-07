import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { create } from 'zustand';
import {
  Feedback,
  type ContextoFeedback,
  type EstadoFeedback,
  type TipoFeedback,
} from '@agente/shared';
import {
  deleteFeedback,
  insertFeedback,
  listFeedback,
  markFeedbackSent,
  openUserDb,
  updateFeedbackEstado,
} from '@/db/userDb';
import { makeFeedbackId, markItemsSent, setItemEstado } from './serialize';
import { sendFeedbackToFounders, type SendResult } from './send';

/**
 * Estado de la feature de FEEDBACK (ADR-001/010: todo local en el dispositivo).
 *
 * El store mantiene la lista en memoria y delega la persistencia en `db/userDb.ts`
 * (SQLite). No hay red: "enviar a los fundadores" abre el compositor nativo del
 * dispositivo. La lógica pura (mapeo, id, texto del correo) vive en `serialize.ts`.
 */

/** Datos que aporta el formulario para crear un feedback. */
export interface EntradaFeedback {
  tipo: TipoFeedback;
  texto: string;
  contexto?: Partial<ContextoFeedback> | undefined;
  /** Contexto de segmento NO identificativo del perfil (cuando exista el perfil). */
  cuerpo?: Feedback['cuerpo'] | undefined;
  territorio?: string | null | undefined;
}

interface FeedbackState {
  items: Feedback[];
  loaded: boolean;
  loading: boolean;
  load: () => Promise<void>;
  add: (entrada: EntradaFeedback) => Promise<void>;
  sendPending: () => Promise<SendResult>;
  /** Cambia el estado de una aportación (gestión LOCAL; sin backend todavía). */
  updateEstado: (id: string, estado: EstadoFeedback) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

/** Plataforma acotada al enum del dominio (Expo Go solo corre en ios/android). */
function currentPlatform(): Feedback['platform'] {
  return Platform.OS === 'ios' ? 'ios' : 'android';
}

function currentAppVersion(): string {
  return Constants.expoConfig?.version ?? '0.0.0';
}

export const useFeedbackStore = create<FeedbackState>((set, get) => ({
  items: [],
  loaded: false,
  loading: false,

  load: async () => {
    if (get().loading) return;
    set({ loading: true });
    try {
      await openUserDb();
      const items = await listFeedback();
      set({ items, loaded: true });
    } finally {
      set({ loading: false });
    }
  },

  add: async (entrada) => {
    const fb = Feedback.parse({
      id: makeFeedbackId(Date.now(), Math.random()),
      createdAt: new Date().toISOString(),
      tipo: entrada.tipo,
      texto: entrada.texto,
      contexto: {
        pantalla: entrada.contexto?.pantalla ?? null,
        articuloId: entrada.contexto?.articuloId ?? null,
        infraccionId: entrada.contexto?.infraccionId ?? null,
      },
      appVersion: currentAppVersion(),
      platform: currentPlatform(),
      cuerpo: entrada.cuerpo ?? null,
      territorio: entrada.territorio ?? null,
      enviado: false,
      estado: 'enviada',
      respuesta: null,
    });
    // PRIMERO se REGISTRA en el dispositivo (petición del socio: nada se pierde). El envío a los
    // fundadores es un paso APARTE y opcional (`sendPending`), nunca bloquea este registro.
    await insertFeedback(fb);
    set({ items: [fb, ...get().items] });
  },

  sendPending: async () => {
    const pendientes = get().items.filter((fb) => !fb.enviado);
    if (pendientes.length === 0) return 'cancelled';
    const result = await sendFeedbackToFounders(pendientes);
    if (result !== 'cancelled') {
      const ids = pendientes.map((fb) => fb.id);
      await markFeedbackSent(ids);
      set({ items: markItemsSent(get().items, ids) });
    }
    return result;
  },

  updateEstado: async (id, estado) => {
    await updateFeedbackEstado(id, estado);
    set({ items: setItemEstado(get().items, id, estado) });
  },

  remove: async (id) => {
    await deleteFeedback(id);
    set({ items: get().items.filter((fb) => fb.id !== id) });
  },
}));
