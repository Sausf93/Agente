import { create } from 'zustand';
import { getContentRunner } from '@/db/contentDb';
import {
  FLAG_NOVEDADES_VISTAS_HASTA,
  getAppFlag,
  listUsos,
  setAppFlag,
} from '@/db/userDb';
import { rankMasUsadas, type UsoInfraccion } from './masUsadas';
import {
  cargarNovedades,
  contarNovedadesNuevas,
  ultimaFechaNovedad,
  type Novedad,
} from './novedades';

/**
 * Estado de la pantalla de INICIO (§4.2): "tus más usadas" y el aviso de novedades. Todo local y
 * offline. Los favoritos viven en su propio store (`favoritosStore`) porque los comparte con la
 * ficha; aquí se agregan las otras dos secciones que solo consume Inicio.
 *
 * `masUsadas` sale del contador local (`uso_infraccion`) rankeado por la función pura
 * `rankMasUsadas`. `novedades` sale del paquete de contenido (solo lectura); `novedadesNuevas`
 * compara su fecha con la marca de "visto" guardada en `user.db`. Nada de esto usa red.
 */

/** Nº de "tus más usadas" que se muestran en Inicio (top del propio dispositivo). */
export const TOP_MAS_USADAS = 5;

interface InicioState {
  masUsadas: UsoInfraccion[];
  novedades: Novedad[];
  novedadesNuevas: number;
  loaded: boolean;
  /** Recarga las secciones locales. Se llama al enfocar Inicio (los contadores cambian al usar). */
  cargar: () => Promise<void>;
  /** Marca todas las novedades como vistas (al abrir la pantalla de Novedades). */
  marcarNovedadesVistas: () => Promise<void>;
}

export const useInicioStore = create<InicioState>((set, get) => ({
  masUsadas: [],
  novedades: [],
  novedadesNuevas: 0,
  loaded: false,

  cargar: async () => {
    // "Tus más usadas": contador local rankeado (puro).
    const usos = await listUsos();
    const masUsadas = rankMasUsadas(usos, TOP_MAS_USADAS);

    // Novedades del paquete (si hay paquete en esta plataforma) + aviso de nuevas.
    let novedades: Novedad[] = [];
    const runner = await getContentRunner();
    if (runner) {
      try {
        novedades = await cargarNovedades(runner);
      } catch {
        novedades = [];
      }
    }
    const vistasHasta = await getAppFlag(FLAG_NOVEDADES_VISTAS_HASTA);
    const novedadesNuevas = contarNovedadesNuevas(novedades, vistasHasta);

    set({ masUsadas, novedades, novedadesNuevas, loaded: true });
  },

  marcarNovedadesVistas: async () => {
    const marca = ultimaFechaNovedad(get().novedades);
    if (marca) await setAppFlag(FLAG_NOVEDADES_VISTAS_HASTA, marca);
    set({ novedadesNuevas: 0 });
  },
}));
