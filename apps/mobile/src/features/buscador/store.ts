import { create } from 'zustand';
import { normalizarBusqueda } from '@agente/shared';
import { getContentRunner } from '@/db/contentDb';
import { recordSearchMiss } from '@/db/userDb';
import { hapticWarning } from '@/ui/haptics';
import { buscarTodo, type ResultadoArticulo, type ResultadoBusqueda } from './search';

/**
 * Estado de la pestaña BUSCAR (offline; el paquete de contenido vive en el dispositivo).
 *
 * El buscador consulta el `SqlRunner` del paquete de contenido. Es tolerante: si no hay
 * paquete (p. ej. web en Fase 1) marca `sinContenido` y la UI lo explica. Registra las
 * búsquedas SIN RESULTADO en la base local del usuario (materia prima para sinónimos, §4.3);
 * esa señal NUNCA sale del dispositivo.
 *
 * El `runToken` descarta respuestas de consultas viejas (evita parpadeos si una búsqueda lenta
 * termina después de otra más reciente).
 */
interface BuscadorState {
  consulta: string;
  /** Infracciones curadas (la joya): se muestran primero. */
  resultados: ResultadoBusqueda[];
  /** Artículos de la ley coincidentes (sección "En la ley", §4.3, segundo nivel). */
  articulos: ResultadoArticulo[];
  buscando: boolean;
  /** `true` cuando ya se ejecutó al menos una búsqueda con término no vacío. */
  buscado: boolean;
  /** `true` si el paquete de contenido no está disponible en esta plataforma. */
  sinContenido: boolean;
  setConsulta: (consulta: string) => void;
  buscar: (consulta: string) => Promise<void>;
  limpiar: () => void;
}

let runToken = 0;
/** Último término (normalizado) que terminó en 0 resultados: evita repetir el háptico de aviso. */
let ultimoTerminoSinResultado: string | null = null;

export const useBuscadorStore = create<BuscadorState>((set) => ({
  consulta: '',
  resultados: [],
  articulos: [],
  buscando: false,
  buscado: false,
  sinContenido: false,

  setConsulta: (consulta) => set({ consulta }),

  buscar: async (consulta) => {
    const termino = consulta.trim();
    if (termino.length === 0) {
      set({ resultados: [], articulos: [], buscando: false, buscado: false });
      return;
    }
    const token = ++runToken;
    set({ buscando: true });
    try {
      const runner = await getContentRunner();
      if (!runner) {
        if (token === runToken) set({ sinContenido: true, buscando: false, buscado: true });
        return;
      }
      const { infracciones, articulos } = await buscarTodo(runner, termino);
      if (token !== runToken) return; // llegó tarde: hay una búsqueda más nueva
      set({
        resultados: infracciones,
        articulos,
        buscando: false,
        buscado: true,
        sinContenido: false,
      });
      const norm = normalizarBusqueda(termino);
      // "Nada exacto" SOLO si no hay NI infracciones NI artículos (§4.3: con el articulado, raro).
      if (infracciones.length === 0 && articulos.length === 0) {
        void recordSearchMiss(norm);
        // Aviso háptico (esencial) de "nada exacto", UNA sola vez por término (P0-1).
        if (ultimoTerminoSinResultado !== norm) {
          ultimoTerminoSinResultado = norm;
          hapticWarning();
        }
      } else {
        ultimoTerminoSinResultado = null;
      }
    } catch {
      if (token === runToken) set({ resultados: [], articulos: [], buscando: false, buscado: true });
    }
  },

  limpiar: () =>
    set({ consulta: '', resultados: [], articulos: [], buscando: false, buscado: false }),
}));
