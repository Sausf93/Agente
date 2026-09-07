import { create } from 'zustand';
import {
  Cuadrante,
  DiaCuadrante,
  FESTIVOS_NACIONALES_2026,
  inicioCicloDesdeOffset,
  offsetsCompatibles,
  type AnclaCuadrante,
  type FranjaNocturna,
  type PatronTurno,
  type TipoServicio,
} from '@agente/shared';
import {
  deleteExcepcion,
  loadCuadrante,
  openUserDb,
  saveCuadranteConfig,
  upsertExcepcion,
} from '@/db/userDb';

/**
 * Estado de la feature CUADRANTE (ADR-001/010: todo local en el dispositivo, sin red).
 *
 * El store mantiene el `Cuadrante` en memoria y delega la persistencia en `db/userDb.ts`
 * (SQLite, dos capas). La lógica de proyección y cálculo de horas NO vive aquí: es pura y
 * está en `@agente/shared` (`proyectarMes`, `resumenHorasMes`), probada al 100 %.
 */

/**
 * Datos para dar de alta el cuadrante por primera vez (arranque del rediseño v3).
 *
 * Ya NO se pide "primer día del ciclo" ni "¿1.ª/2.ª mañana?": el agente dice qué hace en unos
 * pocos días SEGUIDOS (`ancla.turnos` desde `ancla.fechaBase`) y el motor DERIVA `inicioCiclo`
 * con `offsetsCompatibles` + `inicioCicloDesdeOffset`. La UI solo habilita el alta cuando queda
 * un único desfase compatible, así que aquí está garantizado `length === 1`. La jornada de
 * referencia es opcional (default 37,5): no bloquea el alta (docs/diseno/cuadrante-rediseno.md §2).
 */
export interface AltaCuadrante {
  patron: PatronTurno;
  ancla: AnclaCuadrante;
  jornadaRefHorasSemana?: number;
  /** Franja nocturna afinada en "ajustes finos"; si se omite, el default 22:00–06:00. */
  franjaNocturna?: FranjaNocturna;
}

/**
 * Deriva `inicioCiclo` desde el ancla por días seguidos. Solo tiene sentido cuando los días
 * dichos dejan UN único desfase compatible con el patrón; si no, lanza (la UI evita llegar aquí
 * sin cuadrar: el botón "Empezar a usarlo" se habilita solo con `length === 1`).
 */
function derivarInicioCiclo(patron: PatronTurno, ancla: AnclaCuadrante): string {
  const compatibles = offsetsCompatibles(patron, ancla.fechaBase, ancla.turnos);
  const offset = compatibles[0];
  if (compatibles.length !== 1 || offset === undefined) {
    throw new Error(
      `El ancla no fija un único ciclo (${compatibles.length} desfases compatibles); faltan días o no encaja con el patrón`,
    );
  }
  return inicioCicloDesdeOffset(ancla.fechaBase, offset);
}

/** Jornada de referencia por defecto si el agente no la afina en "ajustes finos" (§3). */
const JORNADA_REF_DEFECTO = 37.5;

/** Edición manual de un día (excepción sagrada). */
export interface EdicionDia {
  fecha: string;
  servicio: TipoServicio;
  horaInicio?: string | null;
  horaFin?: string | null;
  nota?: string | null;
  alarmaMinutosAntes?: number | null;
}

interface CuadranteState {
  cuadrante: Cuadrante | null;
  loaded: boolean;
  loading: boolean;
  load: () => Promise<void>;
  crear: (alta: AltaCuadrante) => Promise<void>;
  cambiarPatron: (patron: PatronTurno) => Promise<void>;
  /** Re-ancla el ciclo desde un (día, turno) real (p. ej. tras cambiar a un patrón sin ese turno). */
  reanclar: (ancla: AnclaCuadrante) => Promise<void>;
  cambiarInicioCiclo: (inicioCiclo: string) => Promise<void>;
  cambiarJornada: (jornadaRefHorasSemana: number) => Promise<void>;
  cambiarFranjaNocturna: (franja: FranjaNocturna) => Promise<void>;
  alternarFestivo: (fecha: string) => Promise<void>;
  editarDia: (edicion: EdicionDia) => Promise<void>;
  borrarExcepcion: (fecha: string) => Promise<void>;
}

/** Persiste la config y refresca el estado de forma atómica (una sola fuente de verdad). */
async function persistirConfig(cuadrante: Cuadrante): Promise<Cuadrante> {
  const validado = Cuadrante.parse(cuadrante);
  await saveCuadranteConfig(validado, new Date().toISOString());
  return validado;
}

export const useCuadranteStore = create<CuadranteState>((set, get) => ({
  cuadrante: null,
  loaded: false,
  loading: false,

  load: async () => {
    if (get().loading) return;
    set({ loading: true });
    try {
      await openUserDb();
      const cuadrante = await loadCuadrante();
      set({ cuadrante, loaded: true });
    } finally {
      set({ loading: false });
    }
  },

  crear: async (alta) => {
    // El `inicioCiclo` se DERIVA del ancla (qué hace el agente en días seguidos desde una fecha
    // real, normalmente HOY): así el calendario cuadra con su realidad sin pedirle una fecha
    // teórica de inicio de ciclo ni un ordinal ("1.ª/2.ª mañana").
    const inicioCiclo = derivarInicioCiclo(alta.patron, alta.ancla);
    // Los festivos nacionales de 2026 se siembran de serie (§4.9): el agente solo añade
    // los autonómicos y locales de su municipio (las fiestas del pueblo, dinero real).
    const cuadrante = Cuadrante.parse({
      patron: alta.patron,
      inicioCiclo,
      ancla: alta.ancla,
      jornadaRefHorasSemana: alta.jornadaRefHorasSemana ?? JORNADA_REF_DEFECTO,
      ...(alta.franjaNocturna ? { franjaNocturna: alta.franjaNocturna } : {}),
      festivosExtra: FESTIVOS_NACIONALES_2026,
    });
    const validado = await persistirConfig(cuadrante);
    set({ cuadrante: validado, loaded: true });
  },

  cambiarPatron: async (patron) => {
    const actual = get().cuadrante;
    if (!actual) return;
    // Cambiar el patrón NO borra las excepciones: son sagradas (se conservan en su tabla).
    // Si hay ancla y los días guardados dejan UN único desfase compatible con el patrón nuevo,
    // recomputamos `inicioCiclo` desde el ancla → el cuadrante sigue cuadrando SIN volver a
    // preguntar (§1.3). Si los días guardados ya no bastan (o no encajan) con el patrón nuevo,
    // se conserva el `inicioCiclo` actual: la UI re-pide el mini-flujo de días con `reanclar`
    // (no todo el alta).
    let inicioCiclo = actual.inicioCiclo;
    if (actual.ancla) {
      const compatibles = offsetsCompatibles(patron, actual.ancla.fechaBase, actual.ancla.turnos);
      const offset = compatibles[0];
      if (compatibles.length === 1 && offset !== undefined) {
        inicioCiclo = inicioCicloDesdeOffset(actual.ancla.fechaBase, offset);
      }
    }
    const validado = await persistirConfig({ ...actual, patron, inicioCiclo });
    set({ cuadrante: validado });
  },

  reanclar: async (ancla) => {
    const actual = get().cuadrante;
    if (!actual) return;
    // Re-ancla el ciclo a partir de unos días seguidos reales. Recomputa `inicioCiclo` y guarda
    // el ancla para futuros cambios de patrón. Las excepciones manuales siguen intactas (sagradas).
    const inicioCiclo = derivarInicioCiclo(actual.patron, ancla);
    const validado = await persistirConfig({ ...actual, inicioCiclo, ancla });
    set({ cuadrante: validado });
  },

  cambiarInicioCiclo: async (inicioCiclo) => {
    const actual = get().cuadrante;
    if (!actual) return;
    const validado = await persistirConfig({ ...actual, inicioCiclo });
    set({ cuadrante: validado });
  },

  cambiarJornada: async (jornadaRefHorasSemana) => {
    const actual = get().cuadrante;
    if (!actual) return;
    const validado = await persistirConfig({ ...actual, jornadaRefHorasSemana });
    set({ cuadrante: validado });
  },

  cambiarFranjaNocturna: async (franjaNocturna) => {
    const actual = get().cuadrante;
    if (!actual) return;
    const validado = await persistirConfig({ ...actual, franjaNocturna });
    set({ cuadrante: validado });
  },

  alternarFestivo: async (fecha) => {
    const actual = get().cuadrante;
    if (!actual) return;
    const yaEs = actual.festivosExtra.includes(fecha);
    const festivosExtra = yaEs
      ? actual.festivosExtra.filter((f) => f !== fecha)
      : [...actual.festivosExtra, fecha].sort();
    const validado = await persistirConfig({ ...actual, festivosExtra });
    set({ cuadrante: validado });
  },

  editarDia: async (edicion) => {
    const actual = get().cuadrante;
    if (!actual) return;
    const dia = DiaCuadrante.parse({
      fecha: edicion.fecha,
      servicio: edicion.servicio,
      horaInicio: edicion.horaInicio ?? null,
      horaFin: edicion.horaFin ?? null,
      nota: edicion.nota ?? null,
      alarmaMinutosAntes: edicion.alarmaMinutosAntes ?? null,
      origen: 'manual',
      editadoEl: new Date().toISOString(),
    });
    // Persistencia puntual y atómica: solo se toca la fila de esta fecha.
    await upsertExcepcion(dia);
    const dias = [...actual.dias.filter((d) => d.fecha !== dia.fecha), dia].sort((a, b) =>
      a.fecha < b.fecha ? -1 : 1,
    );
    set({ cuadrante: { ...actual, dias } });
  },

  borrarExcepcion: async (fecha) => {
    const actual = get().cuadrante;
    if (!actual) return;
    await deleteExcepcion(fecha);
    set({ cuadrante: { ...actual, dias: actual.dias.filter((d) => d.fecha !== fecha) } });
  },
}));
