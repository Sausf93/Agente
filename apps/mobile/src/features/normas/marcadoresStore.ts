import { create } from 'zustand';
import {
  addMarcador,
  listMarcadores,
  removeMarcador,
  type Marcador,
} from '@/db/userDb';

/**
 * Estado de los MARCADORES de artículos (§4.5), compartido entre la lista de una norma, la ficha
 * del artículo y "mis marcadores". Local-first (ADR-001): se hidrata y persiste en `user.db`; nada
 * viaja a un servidor.
 *
 * `ids` es un `Set` para consultar en O(1) si un artículo está marcado (icono de estrella). La
 * lista `marcadores` (desnormalizada) alimenta la pantalla "mis marcadores" sin abrir el paquete.
 */
interface MarcadoresState {
  marcadores: Marcador[];
  ids: Set<string>;
  loaded: boolean;
  cargar: () => Promise<void>;
  /** Alterna el marcador de un artículo. Devuelve el nuevo estado (marcado sí/no). */
  alternar: (m: Omit<Marcador, 'createdAt'>) => Promise<boolean>;
  estaMarcado: (articuloId: string) => boolean;
}

export const useMarcadoresStore = create<MarcadoresState>((set, get) => ({
  marcadores: [],
  ids: new Set<string>(),
  loaded: false,

  cargar: async () => {
    const marcadores = await listMarcadores();
    set({ marcadores, ids: new Set(marcadores.map((m) => m.articuloId)), loaded: true });
  },

  alternar: async (m) => {
    const yaEsta = get().ids.has(m.articuloId);
    if (yaEsta) {
      await removeMarcador(m.articuloId);
    } else {
      await addMarcador(m, new Date().toISOString());
    }
    await get().cargar();
    return !yaEsta;
  },

  estaMarcado: (articuloId) => get().ids.has(articuloId),
}));
