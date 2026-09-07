import { create } from 'zustand';
import { getAppFlag, setAppFlag } from '@/db/userDb';
import { parseRecientes, siguienteRecientes } from './recientes';

/**
 * Búsquedas RECIENTES del agente (01-ux §2.3/§6.1: "Repetir última / Recientes"). En una jornada
 * se consulta lo mismo una y otra vez; recordar los últimos términos ahorra reescribirlos.
 *
 * Persistencia LOCAL y sin esquema nuevo: se guarda como JSON en la tabla clave-valor `app_flag`
 * (misma vía que el toggle de háptica). Nunca sale del dispositivo (ADR-001). La lógica pura
 * (dedupe/cap/parse) vive en `./recientes` para poder testearla sin SQLite.
 */
const FLAG_RECIENTES = 'busquedas_recientes';

interface RecientesState {
  recientes: string[];
  loaded: boolean;
  cargar: () => Promise<void>;
  registrar: (termino: string) => void;
  limpiar: () => void;
}

export const useRecientesStore = create<RecientesState>((set, get) => ({
  recientes: [],
  loaded: false,

  cargar: async () => {
    const raw = await getAppFlag(FLAG_RECIENTES);
    set({ recientes: parseRecientes(raw), loaded: true });
  },

  registrar: (termino) => {
    const previos = get().recientes;
    const siguiente = siguienteRecientes(previos, termino);
    if (siguiente === previos) return; // término vacío: nada que guardar
    set({ recientes: siguiente });
    void setAppFlag(FLAG_RECIENTES, JSON.stringify(siguiente));
  },

  limpiar: () => {
    set({ recientes: [] });
    void setAppFlag(FLAG_RECIENTES, JSON.stringify([]));
  },
}));
