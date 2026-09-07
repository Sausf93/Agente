import { create } from 'zustand';
import {
  addFavorito,
  listFavoritos,
  removeFavorito,
  type Favorito,
} from '@/db/userDb';
import type { InfraccionSnapshot } from './masUsadas';

/**
 * Estado de los FAVORITOS de infracciones (§4.4), compartido entre la ficha (botón de favorito),
 * la sección "Tus favoritas" de Inicio y la lista completa. Local-first (ADR-001): se hidrata y
 * persiste en `user.db`; nada viaja a un servidor.
 *
 * `ids` es un `Set` para consultar en O(1) si una infracción está en favoritos (icono de estrella).
 * La lista `favoritos` (desnormalizada) alimenta las pantallas sin abrir el paquete de contenido.
 */
interface FavoritosState {
  favoritos: Favorito[];
  ids: Set<string>;
  loaded: boolean;
  cargar: () => Promise<void>;
  /** Alterna el favorito de una infracción. Devuelve el nuevo estado (favorita sí/no). */
  alternar: (snap: InfraccionSnapshot) => Promise<boolean>;
}

export const useFavoritosStore = create<FavoritosState>((set, get) => ({
  favoritos: [],
  ids: new Set<string>(),
  loaded: false,

  cargar: async () => {
    const favoritos = await listFavoritos();
    set({ favoritos, ids: new Set(favoritos.map((f) => f.infraccionId)), loaded: true });
  },

  alternar: async (snap) => {
    const yaEsta = get().ids.has(snap.infraccionId);
    if (yaEsta) {
      await removeFavorito(snap.infraccionId);
    } else {
      await addFavorito(snap, new Date().toISOString());
    }
    await get().cargar();
    return !yaEsta;
  },
}));
