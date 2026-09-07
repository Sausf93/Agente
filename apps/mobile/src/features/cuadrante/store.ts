import { create } from 'zustand';
import {
  Cuadrante,
  DiaCuadrante,
  FESTIVOS_NACIONALES_2026,
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

/** Datos para dar de alta el cuadrante por primera vez (onboarding del patrón). */
export interface AltaCuadrante {
  patron: PatronTurno;
  inicioCiclo: string;
  jornadaRefHorasSemana: number;
}

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
    // Los festivos nacionales de 2026 se siembran de serie (§4.9): el agente solo añade
    // los autonómicos y locales de su municipio (las fiestas del pueblo, dinero real).
    const cuadrante = Cuadrante.parse({
      patron: alta.patron,
      inicioCiclo: alta.inicioCiclo,
      jornadaRefHorasSemana: alta.jornadaRefHorasSemana,
      festivosExtra: FESTIVOS_NACIONALES_2026,
    });
    const validado = await persistirConfig(cuadrante);
    set({ cuadrante: validado, loaded: true });
  },

  cambiarPatron: async (patron) => {
    const actual = get().cuadrante;
    if (!actual) return;
    // Cambiar el patrón NO borra las excepciones: son sagradas (se conservan en su tabla).
    const validado = await persistirConfig({ ...actual, patron });
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
