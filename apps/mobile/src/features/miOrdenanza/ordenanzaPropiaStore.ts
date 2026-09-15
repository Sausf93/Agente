import { create } from 'zustand';
import {
  deleteOrdenanzaPropia,
  listOrdenanzasPropias,
  upsertOrdenanzaPropia,
  type OrdenanzaPropia,
} from '@/db/userDb';

/**
 * Estado de "MI ORDENANZA" (§4.5): las tarifas de aparcamiento que el agente fija para SU municipio
 * (zona azul/ORA, carga y descarga, vado, PMR). Local-first (ADR-001): se hidrata y persiste en
 * `user.db`; nada viaja a un servidor. Compartido entre el buscador (tarjeta "tu ordenanza") y la
 * pantalla de edición.
 */
interface OrdenanzaPropiaState {
  registros: Record<string, OrdenanzaPropia>;
  loaded: boolean;
  cargar: () => Promise<void>;
  guardar: (o: OrdenanzaPropia) => Promise<void>;
  borrar: (concepto: string) => Promise<void>;
  obtener: (concepto: string) => OrdenanzaPropia | null;
}

export const useOrdenanzaPropiaStore = create<OrdenanzaPropiaState>((set, get) => ({
  registros: {},
  loaded: false,

  cargar: async () => {
    const lista = await listOrdenanzasPropias();
    const registros: Record<string, OrdenanzaPropia> = {};
    for (const o of lista) registros[o.concepto] = o;
    set({ registros, loaded: true });
  },

  guardar: async (o) => {
    await upsertOrdenanzaPropia(o);
    set((s) => ({ registros: { ...s.registros, [o.concepto]: o } }));
  },

  borrar: async (concepto) => {
    await deleteOrdenanzaPropia(concepto);
    set((s) => {
      const registros = { ...s.registros };
      delete registros[concepto];
      return { registros };
    });
  },

  obtener: (concepto) => get().registros[concepto] ?? null,
}));
