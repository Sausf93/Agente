/**
 * Lógica PURA del cuadrante (sección 4.9 de la especificación).
 *
 * Este módulo NO toca React Native, SQLite ni el reloj: son funciones deterministas
 * que se prueban al 100 % con Vitest (es uno de los tres núcleos críticos del producto,
 * ver docs/DECISIONES.md ADR-010). Aquí viven:
 *
 *  1. La PROYECCIÓN del calendario a partir de un `PatronTurno` + fecha de inicio de
 *     ciclo. Los días se calculan al vuelo; solo se guardan las EXCEPCIONES manuales.
 *  2. La regla de oro del cuadrante fiable: las excepciones manuales son SAGRADAS y el
 *     patrón NUNCA las pisa (es el fallo que hunde a la competencia — perspectivas §8).
 *  3. El CÁLCULO DE HORAS: totales, nocturnas, festivas, fin de semana y exceso sobre
 *     una jornada de referencia CONFIGURABLE (no un 37,5 h fijo — la GC lo exige).
 *
 * Los esquemas Zod del dominio (`PatronTurno`, `Cuadrante`, `DiaCuadrante`…) viven en
 * `user.ts`; aquí solo se importan sus tipos y se opera sobre ellos.
 */

import type { ClaseServicio, Cuerpo, TipoServicio } from './enums.js';
import type { Cuadrante, DefinicionServicio, DiaCuadrante, FranjaNocturna, PatronTurno } from './user.js';

// ---------------------------------------------------------------------------
// Utilidades de fecha civil (YYYY-MM-DD) — SIEMPRE en UTC para evitar que la zona
// horaria o el horario de verano desplacen un día del cuadrante.
// ---------------------------------------------------------------------------

const RE_FECHA = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Convierte una fecha civil a milisegundos UTC de medianoche. Lanza si el formato falla. */
function fechaAMsUtc(fecha: string): number {
  const m = RE_FECHA.exec(fecha);
  if (!m) throw new Error(`Fecha civil inválida: ${fecha}`);
  const anio = Number(m[1]);
  const mes = Number(m[2]);
  const dia = Number(m[3]);
  return Date.UTC(anio, mes - 1, dia);
}

const MS_DIA = 86_400_000;

/** Formatea milisegundos UTC a fecha civil YYYY-MM-DD. */
function msUtcAFecha(ms: number): string {
  const d = new Date(ms);
  const anio = d.getUTCFullYear().toString().padStart(4, '0');
  const mes = (d.getUTCMonth() + 1).toString().padStart(2, '0');
  const dia = d.getUTCDate().toString().padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

/** Días naturales (con signo) entre dos fechas civiles: `hasta - desde`. */
export function diasEntre(desde: string, hasta: string): number {
  return Math.round((fechaAMsUtc(hasta) - fechaAMsUtc(desde)) / MS_DIA);
}

/** Suma `n` días (puede ser negativo) a una fecha civil. */
export function sumarDias(fecha: string, n: number): string {
  return msUtcAFecha(fechaAMsUtc(fecha) + n * MS_DIA);
}

/**
 * Día de la semana con lunes = 0 … domingo = 6 (convención europea, la del cuadrante).
 * `getUTCDay()` da domingo = 0, por eso se recoloca.
 */
export function diaSemanaLunes0(fecha: string): number {
  const dow = new Date(fechaAMsUtc(fecha)).getUTCDay(); // 0=domingo
  return (dow + 6) % 7;
}

/** ¿Cae en fin de semana (sábado o domingo)? */
export function esFinDeSemana(fecha: string): boolean {
  const d = diaSemanaLunes0(fecha);
  return d === 5 || d === 6;
}

// ---------------------------------------------------------------------------
// Utilidades de hora (HH:MM) y minutos del día
// ---------------------------------------------------------------------------

const RE_HORA = /^(\d{2}):(\d{2})$/;

/** "HH:MM" → minutos desde medianoche [0, 1440). */
export function horaAMinutos(hora: string): number {
  const m = RE_HORA.exec(hora);
  if (!m) throw new Error(`Hora inválida: ${hora}`);
  return Number(m[1]) * 60 + Number(m[2]);
}

/** Solape (en minutos) de dos intervalos lineales [aIni,aFin) y [bIni,bFin). */
function solape(aIni: number, aFin: number, bIni: number, bFin: number): number {
  return Math.max(0, Math.min(aFin, bFin) - Math.max(aIni, bIni));
}

/**
 * Duración en minutos de un turno [inicio, fin). Si `fin <= inicio` se asume que
 * cruza la medianoche y se añaden 24 h. Un turno de 24 h exactas (inicio === fin)
 * solo se interpreta como tal cuando `cruzaMedianoche` lo indica; si no, es 0.
 */
export function duracionMinutos(inicio: string, fin: string, cruzaMedianoche = false): number {
  const ini = horaAMinutos(inicio);
  const finM = horaAMinutos(fin);
  if (finM > ini) return finM - ini;
  if (finM < ini) return finM + 1440 - ini;
  return cruzaMedianoche ? 1440 : 0; // inicio === fin
}

/**
 * Minutos de un turno [inicio, inicio+duración) que caen en la franja nocturna.
 * La franja puede envolver la medianoche (p. ej. 22:00→06:00). Se evalúan las
 * ventanas nocturnas de los días adyacentes para cubrir turnos que cruzan la noche.
 */
export function minutosNocturnos(
  inicioMin: number,
  duracion: number,
  franja: { inicio: string; fin: string },
): number {
  const nIni = horaAMinutos(franja.inicio);
  const nFinRaw = horaAMinutos(franja.fin);
  const envuelve = nFinRaw <= nIni;
  const nFin = envuelve ? nFinRaw + 1440 : nFinRaw;
  const wIni = inicioMin;
  const wFin = inicioMin + duracion;
  let total = 0;
  // k=-1..2 cubre cualquier turno de hasta ~24 h que arranque dentro de un día.
  for (let k = -1; k <= 2; k++) {
    total += solape(wIni, wFin, nIni + k * 1440, nFin + k * 1440);
  }
  return total;
}

// ---------------------------------------------------------------------------
// Definiciones de servicio por defecto (cuando el patrón no las especifica)
// ---------------------------------------------------------------------------

interface DefDefecto {
  clase: ClaseServicio;
  computaPresencia: boolean;
  cruzaMedianoche: boolean;
  horaInicio: string | null;
  horaFin: string | null;
}

/**
 * Valores por defecto de cada tipo de servicio. Bloques limpios de 8 h que cubren
 * las 24 h (mañana 06–14, tarde 14–22, noche 22–06) para que el cómputo sea
 * inequívoco; el patrón o la excepción del usuario siempre pueden sobrescribirlos.
 */
export const DEFINICIONES_DEFECTO: Record<TipoServicio, DefDefecto> = {
  manana: { clase: 'trabajo', computaPresencia: true, cruzaMedianoche: false, horaInicio: '06:00', horaFin: '14:00' },
  tarde: { clase: 'trabajo', computaPresencia: true, cruzaMedianoche: false, horaInicio: '14:00', horaFin: '22:00' },
  noche: { clase: 'trabajo', computaPresencia: true, cruzaMedianoche: true, horaInicio: '22:00', horaFin: '06:00' },
  saliente: { clase: 'descanso', computaPresencia: false, cruzaMedianoche: false, horaInicio: null, horaFin: null },
  libre: { clase: 'descanso', computaPresencia: false, cruzaMedianoche: false, horaInicio: null, horaFin: null },
  disponibilidad: { clase: 'disponibilidad', computaPresencia: false, cruzaMedianoche: false, horaInicio: null, horaFin: null },
  servicio_extra: { clase: 'trabajo', computaPresencia: true, cruzaMedianoche: false, horaInicio: null, horaFin: null },
  vacaciones: { clase: 'ausencia', computaPresencia: false, cruzaMedianoche: false, horaInicio: null, horaFin: null },
  asuntos_propios: { clase: 'ausencia', computaPresencia: false, cruzaMedianoche: false, horaInicio: null, horaFin: null },
  baja: { clase: 'ausencia', computaPresencia: false, cruzaMedianoche: false, horaInicio: null, horaFin: null },
  curso: { clase: 'trabajo', computaPresencia: false, cruzaMedianoche: false, horaInicio: null, horaFin: null },
  otros: { clase: 'ausencia', computaPresencia: false, cruzaMedianoche: false, horaInicio: null, horaFin: null },
};

/**
 * Resuelve la definición efectiva de un tipo de servicio dentro de un patrón:
 * la del patrón si existe, si no la de defecto.
 */
export function resolverDefinicion(patron: PatronTurno, tipo: TipoServicio): DefDefecto {
  const explicita = patron.definiciones.find((d: DefinicionServicio) => d.tipo === tipo);
  const base = DEFINICIONES_DEFECTO[tipo];
  if (!explicita) return base;
  return {
    clase: explicita.clase,
    computaPresencia: explicita.computaPresencia,
    cruzaMedianoche: explicita.cruzaMedianoche,
    horaInicio: explicita.horaInicioDefecto ?? base.horaInicio,
    horaFin: explicita.horaFinDefecto ?? base.horaFin,
  };
}

// ---------------------------------------------------------------------------
// Proyección del calendario (patrón + excepciones sagradas)
// ---------------------------------------------------------------------------

/** Origen de un día proyectado: viene del patrón automático o es edición manual. */
export type OrigenDia = 'patron' | 'manual';

/** Un día ya RESUELTO del calendario, listo para pintar y para computar horas. */
export interface DiaProyectado {
  fecha: string;
  servicio: TipoServicio;
  horaInicio: string | null;
  horaFin: string | null;
  clase: ClaseServicio;
  computaPresencia: boolean;
  cruzaMedianoche: boolean;
  origen: OrigenDia;
  esFestivo: boolean;
  esFinDeSemana: boolean;
  nota: string | null;
  alarmaMinutosAntes: number | null;
}

/** Índice dentro de la secuencia del patrón para una fecha dada (módulo seguro con negativos). */
export function indicePatron(inicioCiclo: string, fecha: string, longitud: number): number {
  const diff = diasEntre(inicioCiclo, fecha);
  return ((diff % longitud) + longitud) % longitud;
}

// ---------------------------------------------------------------------------
// Anclaje por DÍAS SEGUIDOS — el INVERSO de la proyección (rediseño del cuadrante v3).
//
// El arranque no pregunta ya "¿qué día empezó tu ciclo?" (teoría que nadie sabe) ni
// "¿es tu 1.ª o 2.ª mañana?" (ordinal que nadie tiene en la cabeza). Solo pregunta "¿qué
// haces HOY? ¿y MAÑANA? ¿y PASADO?" y, tras CADA día, calcula cuántas posiciones del ciclo
// siguen encajando con esa secuencia de días CONSECUTIVOS. En cuanto queda UNA sola, el
// `inicioCiclo` queda fijado y la proyección cuadra con la realidad del agente.
// Ver docs/diseno/cuadrante-rediseno.md §1.
// ---------------------------------------------------------------------------

/**
 * Turnos DISTINTOS presentes en un patrón, en ORDEN DE APARICIÓN (sin duplicados).
 * Alimenta los botones "¿Qué haces hoy?": así nunca se ofrece un turno que el patrón
 * no contiene (p. ej. no ofrecer "noche" en un patrón de oficina L–V).
 */
export function turnosDelPatron(patron: PatronTurno): TipoServicio[] {
  const vistos = new Set<TipoServicio>();
  const orden: TipoServicio[] = [];
  for (const servicio of patron.secuencia) {
    if (!vistos.has(servicio)) {
      vistos.add(servicio);
      orden.push(servicio);
    }
  }
  return orden;
}

/**
 * Índices de la secuencia donde aparece `servicio`. Vacío si el turno no está en el patrón.
 *
 * @deprecated Rediseño v3: el arranque ya NO desambigua por ordinal ("1.ª/2.ª mañana"), sino
 * por días seguidos (`offsetsCompatibles`). Esta función se conserva solo para cálculos
 * internos (contar ocurrencias de un turno) y para no romper tests antiguos. No usarla en la UI.
 */
export function ocurrenciasEnPatron(
  secuencia: readonly TipoServicio[],
  servicio: TipoServicio,
): number[] {
  const indices: number[] = [];
  for (let i = 0; i < secuencia.length; i++) {
    if (secuencia[i] === servicio) indices.push(i);
  }
  return indices;
}

/**
 * Calcula el `inicioCiclo` que hace que en `fechaAncla` el patrón proyecte `servicioAncla`.
 * Es el INVERSO de `indicePatron`: si el turno cae en el índice `I[k]` de la secuencia,
 * entonces `inicioCiclo = fechaAncla − I[k] días` (comprobación:
 * `indicePatron(inicioCiclo, fechaAncla, L) === I[k]` porque `0 ≤ I[k] < L`).
 *
 * `ocurrencia` (0-based) elige la posición del ciclo cuando el turno se repite; se toma
 * MÓDULO el nº de ocurrencias (así ‹/› en la UI puede envolver sin salirse de rango, y
 * también admite valores negativos). Lanza si `servicioAncla` no está en el patrón (no
 * debería pasar: los botones salen de `turnosDelPatron`).
 *
 * @deprecated Rediseño v3: sustituido por `offsetsCompatibles` + `inicioCicloDesdeOffset`
 * (anclaje por días seguidos, sin ordinal). Se conserva marcado como obsoleto para no romper
 * a quien aún lo importe; la UI del arranque ya no lo usa.
 */
export function anclarInicioCiclo(
  secuencia: readonly TipoServicio[],
  fechaAncla: string,
  servicioAncla: TipoServicio,
  ocurrencia = 0,
): string {
  const indices = ocurrenciasEnPatron(secuencia, servicioAncla);
  if (indices.length === 0) {
    throw new Error(`El turno "${servicioAncla}" no está en el patrón, no se puede anclar el ciclo`);
  }
  const n = indices.length;
  const k = ((ocurrencia % n) + n) % n; // módulo seguro (envuelve y admite negativos)
  const idx = indices[k] as number;
  return sumarDias(fechaAncla, -idx);
}

/**
 * Desfases `d ∈ [0, L)` del ciclo compatibles con lo que el agente dice hacer en `n` días
 * CONSECUTIVOS desde `fechaBase`. Un desfase `d` es la hipótesis "hoy (`fechaBase`) cae en la
 * posición `d` del ciclo"; bajo ella, el turno del día `fechaBase + i` es `secuencia[(d+i) mod L]`.
 *
 * `d` es compatible ⟺ para todo `i ∈ [0, n)`: `secuencia[(d + i) mod L] === turnos[i]`.
 * (`secuencia` = `patron.secuencia`, `L = secuencia.length`; NO son los turnos distintos.)
 *
 *  - `length === 0` → esos días NO encajan con este patrón (excepción o patrón erróneo).
 *  - `length === 1` → el cuadrante YA está anclado (ver `inicioCicloDesdeOffset`).
 *  - `length  >  1` → aún ambiguo: pedir el siguiente día.
 *
 * Con `turnos` vacío devuelve los `L` desfases (todo es posible aún). Es pura y barata
 * (recorre `L` desfases × `n` días; `L ≤ ~21`, `n ≤ 3`): la UI la recalcula sobre el array
 * completo `turnos` tras cada toque, sin estado incremental. Sustituye por completo a la
 * desambiguación por ordinal ("1.ª/2.ª mañana"). Nunca lanza: el 0 es un estado válido de UI.
 *
 * `fechaBase` no interviene en el cálculo (los desfases son relativos al ciclo), pero forma
 * parte de la firma para emparejarse con `inicioCicloDesdeOffset(fechaBase, offset)`.
 */
export function offsetsCompatibles(
  patron: PatronTurno,
  fechaBase: string,
  turnos: readonly TipoServicio[],
): number[] {
  const { secuencia } = patron;
  const L = secuencia.length;
  const compatibles: number[] = [];
  for (let d = 0; d < L; d++) {
    let ok = true;
    for (let i = 0; i < turnos.length; i++) {
      if (secuencia[(d + i) % L] !== turnos[i]) {
        ok = false;
        break;
      }
    }
    if (ok) compatibles.push(d);
  }
  return compatibles;
}

/**
 * `inicioCiclo` a partir de `(fechaBase, desfase único)`. Se llama SOLO cuando
 * `offsetsCompatibles(...).length === 1`, con `offset = offsetsCompatibles(...)[0]`.
 *
 * Como el desfase `d` significa "hoy cae en la posición `d` del ciclo", el inicio del ciclo
 * es `fechaBase − d días`. Comprobación de coherencia (verificada en tests):
 * `indicePatron(inicioCicloDesdeOffset(fechaBase, d), fechaBase, L) === d`.
 */
export function inicioCicloDesdeOffset(fechaBase: string, offset: number): string {
  return sumarDias(fechaBase, -offset);
}

/** Construye el conjunto de festivos aplicables (nacionales sembrados + los extra del cuadrante). */
export function construirFestivos(cuadrante: Cuadrante, extra: readonly string[] = []): Set<string> {
  return new Set<string>([...cuadrante.festivosExtra, ...extra]);
}

/** Índice por fecha de las excepciones manuales, para resolución O(1). */
function indexarExcepciones(dias: readonly DiaCuadrante[]): Map<string, DiaCuadrante> {
  const map = new Map<string, DiaCuadrante>();
  for (const d of dias) map.set(d.fecha, d);
  return map;
}

interface ContextoProyeccion {
  excepciones: Map<string, DiaCuadrante>;
  festivos: Set<string>;
}

function proyectarConContexto(cuadrante: Cuadrante, fecha: string, ctx: ContextoProyeccion): DiaProyectado {
  const excepcion = ctx.excepciones.get(fecha);
  const esFestivo = ctx.festivos.has(fecha);
  const finde = esFinDeSemana(fecha);

  if (excepcion) {
    // EXCEPCIÓN SAGRADA: manda sobre el patrón. Las horas propias de la excepción
    // ganan; si no las trae, se usan las de la definición del tipo elegido.
    const def = resolverDefinicion(cuadrante.patron, excepcion.servicio);
    return {
      fecha,
      servicio: excepcion.servicio,
      horaInicio: excepcion.horaInicio ?? def.horaInicio,
      horaFin: excepcion.horaFin ?? def.horaFin,
      clase: def.clase,
      computaPresencia: def.computaPresencia,
      cruzaMedianoche: def.cruzaMedianoche,
      origen: 'manual',
      esFestivo,
      esFinDeSemana: finde,
      nota: excepcion.nota,
      alarmaMinutosAntes: excepcion.alarmaMinutosAntes,
    };
  }

  const { secuencia } = cuadrante.patron;
  const idx = indicePatron(cuadrante.inicioCiclo, fecha, secuencia.length);
  const servicio = secuencia[idx] as TipoServicio;
  const def = resolverDefinicion(cuadrante.patron, servicio);
  return {
    fecha,
    servicio,
    horaInicio: def.horaInicio,
    horaFin: def.horaFin,
    clase: def.clase,
    computaPresencia: def.computaPresencia,
    cruzaMedianoche: def.cruzaMedianoche,
    origen: 'patron',
    esFestivo,
    esFinDeSemana: finde,
    nota: null,
    alarmaMinutosAntes: null,
  };
}

/** Proyecta un único día del cuadrante. */
export function proyectarDia(cuadrante: Cuadrante, fecha: string): DiaProyectado {
  return proyectarConContexto(cuadrante, fecha, {
    excepciones: indexarExcepciones(cuadrante.dias),
    festivos: construirFestivos(cuadrante),
  });
}

/** Proyecta un rango de fechas civiles [desde, hasta] (ambas inclusive). */
export function proyectarRango(cuadrante: Cuadrante, desde: string, hasta: string): DiaProyectado[] {
  const ctx: ContextoProyeccion = {
    excepciones: indexarExcepciones(cuadrante.dias),
    festivos: construirFestivos(cuadrante),
  };
  const total = diasEntre(desde, hasta);
  const out: DiaProyectado[] = [];
  for (let i = 0; i <= total; i++) {
    out.push(proyectarConContexto(cuadrante, sumarDias(desde, i), ctx));
  }
  return out;
}

/** Nº de días de un mes (mes 1-12). */
export function diasDelMes(anio: number, mes: number): number {
  return new Date(Date.UTC(anio, mes, 0)).getUTCDate();
}

/** Proyecta un mes natural completo (mes 1-12). */
export function proyectarMes(cuadrante: Cuadrante, anio: number, mes: number): DiaProyectado[] {
  const mm = mes.toString().padStart(2, '0');
  const desde = `${anio}-${mm}-01`;
  const hasta = `${anio}-${mm}-${diasDelMes(anio, mes).toString().padStart(2, '0')}`;
  return proyectarRango(cuadrante, desde, hasta);
}

// ---------------------------------------------------------------------------
// Cálculo de horas
// ---------------------------------------------------------------------------

/** Reparto de minutos de un turno entre el día de inicio y el siguiente (por la medianoche). */
export interface TurnoComputado {
  minutosTotales: number;
  minutosNocturnos: number;
  /** Minutos que caen en una fecha festiva (repartidos por la medianoche). */
  minutosFestivos: number;
  /** Minutos que caen en sábado o domingo. */
  minutosFinDeSemana: number;
}

const CERO: TurnoComputado = {
  minutosTotales: 0,
  minutosNocturnos: 0,
  minutosFestivos: 0,
  minutosFinDeSemana: 0,
};

/**
 * Computa los minutos de UN día proyectado. Solo cuentan los servicios que computan
 * como presencia efectiva y tienen horas (la disponibilidad/retén y las ausencias no
 * suman presencia). Los minutos festivos y de fin de semana se reparten por la
 * medianoche: una noche 22:00→06:00 de un sábado aporta 2 h al sábado y 6 h al domingo.
 */
export function computarTurno(
  dia: DiaProyectado,
  franja: FranjaNocturna,
  esFestivo: (fecha: string) => boolean,
): TurnoComputado {
  if (!dia.computaPresencia || dia.horaInicio === null || dia.horaFin === null) return CERO;

  const inicioMin = horaAMinutos(dia.horaInicio);
  const duracion = duracionMinutos(dia.horaInicio, dia.horaFin, dia.cruzaMedianoche);
  if (duracion === 0) return CERO;

  const nocturnos = minutosNocturnos(inicioMin, duracion, franja);

  // Reparto por la medianoche entre la fecha de inicio y la siguiente.
  const enDiaInicio = Math.min(duracion, 1440 - inicioMin);
  const enDiaSiguiente = duracion - enDiaInicio;
  const fechaSiguiente = sumarDias(dia.fecha, 1);

  let minutosFestivos = 0;
  let minutosFinDeSemana = 0;
  if (esFestivo(dia.fecha)) minutosFestivos += enDiaInicio;
  if (esFinDeSemana(dia.fecha)) minutosFinDeSemana += enDiaInicio;
  if (enDiaSiguiente > 0) {
    if (esFestivo(fechaSiguiente)) minutosFestivos += enDiaSiguiente;
    if (esFinDeSemana(fechaSiguiente)) minutosFinDeSemana += enDiaSiguiente;
  }

  return {
    minutosTotales: duracion,
    minutosNocturnos: nocturnos,
    minutosFestivos,
    minutosFinDeSemana,
  };
}

/** Redondea horas a 2 decimales evitando el ruido del coma flotante. */
function aHoras(minutos: number): number {
  return Math.round((minutos / 60) * 100) / 100;
}

/** Resumen de horas de un periodo (mes, año o rango libre). */
export interface ResumenHoras {
  horasTotales: number;
  horasNocturnas: number;
  horasFestivas: number;
  horasFinDeSemana: number;
  /** Jornada de referencia prorrateada al periodo (configurable, NO un 37,5 fijo). */
  horasReferencia: number;
  /** Positivo = exceso sobre la referencia; negativo = por debajo. */
  exceso: number;
  /** Nº de días de trabajo efectivo (con presencia y horas). */
  diasTrabajados: number;
  /** Nº de días cuyo servicio es 'noche'. */
  noches: number;
  /** Nº de días festivos efectivamente trabajados. */
  festivosTrabajados: number;
}

/**
 * Horas de referencia de un periodo a partir de la jornada semanal y el nº de días
 * naturales del periodo. Prorrateo lineal: `jornadaSemana * diasNaturales / 7`.
 */
export function horasReferenciaPeriodo(jornadaRefHorasSemana: number, diasNaturales: number): number {
  return Math.round((jornadaRefHorasSemana * diasNaturales) / 7 * 100) / 100;
}

export interface OpcionesResumen {
  jornadaRefHorasSemana: number;
  franjaNocturna: FranjaNocturna;
  festivos: ReadonlySet<string>;
  /**
   * Nº de días naturales para prorratear la jornada de referencia. Por defecto,
   * el nº de días proyectados (correcto para un mes o un rango completo).
   */
  diasNaturales?: number;
}

/**
 * Agrega el cómputo de horas de una lista de días proyectados. Es el corazón del
 * contador del cuadrante: total, nocturnas, festivas, fin de semana y exceso sobre
 * la jornada de referencia prorrateada.
 */
export function resumenHoras(dias: readonly DiaProyectado[], opciones: OpcionesResumen): ResumenHoras {
  const festivos = opciones.festivos;
  const esFestivo = (fecha: string): boolean => festivos.has(fecha);

  let minTotales = 0;
  let minNocturnos = 0;
  let minFestivos = 0;
  let minFinde = 0;
  let diasTrabajados = 0;
  let noches = 0;
  let festivosTrabajados = 0;

  for (const dia of dias) {
    const c = computarTurno(dia, opciones.franjaNocturna, esFestivo);
    if (c.minutosTotales > 0) {
      diasTrabajados += 1;
      if (dia.servicio === 'noche') noches += 1;
      if (dia.esFestivo) festivosTrabajados += 1;
    }
    minTotales += c.minutosTotales;
    minNocturnos += c.minutosNocturnos;
    minFestivos += c.minutosFestivos;
    minFinde += c.minutosFinDeSemana;
  }

  const diasNaturales = opciones.diasNaturales ?? dias.length;
  const horasReferencia = horasReferenciaPeriodo(opciones.jornadaRefHorasSemana, diasNaturales);
  const horasTotales = aHoras(minTotales);

  return {
    horasTotales,
    horasNocturnas: aHoras(minNocturnos),
    horasFestivas: aHoras(minFestivos),
    horasFinDeSemana: aHoras(minFinde),
    horasReferencia,
    exceso: Math.round((horasTotales - horasReferencia) * 100) / 100,
    diasTrabajados,
    noches,
    festivosTrabajados,
  };
}

/** Atajo: resumen de un mes natural del cuadrante (mes 1-12). */
export function resumenHorasMes(cuadrante: Cuadrante, anio: number, mes: number): ResumenHoras {
  const dias = proyectarMes(cuadrante, anio, mes);
  return resumenHoras(dias, {
    jornadaRefHorasSemana: cuadrante.jornadaRefHorasSemana,
    franjaNocturna: cuadrante.franjaNocturna,
    festivos: construirFestivos(cuadrante),
  });
}

// ---------------------------------------------------------------------------
// Patrones predefinidos (starting points EDITABLES; el usuario elige de una lista)
// ---------------------------------------------------------------------------

/** Definiciones estándar de mañana/tarde/noche en bloques de 8 h que cubren las 24 h. */
const DEF_MTN: DefinicionServicio[] = [
  { tipo: 'manana', horaInicioDefecto: '06:00', horaFinDefecto: '14:00', cruzaMedianoche: false, computaPresencia: true, clase: 'trabajo' },
  { tipo: 'tarde', horaInicioDefecto: '14:00', horaFinDefecto: '22:00', cruzaMedianoche: false, computaPresencia: true, clase: 'trabajo' },
  { tipo: 'noche', horaInicioDefecto: '22:00', horaFinDefecto: '06:00', cruzaMedianoche: true, computaPresencia: true, clase: 'trabajo' },
];

/**
 * Catálogo de patrones predefinidos por cuerpo. Son PUNTOS DE PARTIDA editables: los
 * turnos reales varían por unidad/municipio (la Policía Local, sobre todo, no tiene un
 * patrón único — perspectivas §4). El usuario elige el más cercano y ajusta días sueltos.
 */
export const PATRONES_PREDEFINIDOS: PatronTurno[] = [
  {
    nombre: '6 servicios + saliente + 3 libres',
    cuerpo: 'guardia_civil' as Cuerpo,
    // M M T T N N · saliente · 3 libres (ciclo de 10 días).
    secuencia: ['manana', 'manana', 'tarde', 'tarde', 'noche', 'noche', 'saliente', 'libre', 'libre', 'libre'],
    definiciones: DEF_MTN,
    editable: true,
  },
  {
    nombre: 'Semana sí, semana no (7+7)',
    cuerpo: 'policia_nacional' as Cuerpo,
    // 6 servicios + saliente (una semana) y 7 libres (la otra): quincena de 14 días.
    secuencia: [
      'manana', 'manana', 'tarde', 'tarde', 'noche', 'noche', 'saliente',
      'libre', 'libre', 'libre', 'libre', 'libre', 'libre', 'libre',
    ],
    definiciones: DEF_MTN,
    editable: true,
  },
  {
    nombre: 'Rueda de mañana/tarde/noche (semanal)',
    cuerpo: 'policia_local' as Cuerpo,
    // Una semana de cada turno con dos libres al final de cada bloque.
    secuencia: [
      'manana', 'manana', 'manana', 'manana', 'manana', 'libre', 'libre',
      'tarde', 'tarde', 'tarde', 'tarde', 'tarde', 'libre', 'libre',
      'noche', 'noche', 'noche', 'noche', 'noche', 'libre', 'libre',
    ],
    definiciones: DEF_MTN,
    editable: true,
  },
  {
    nombre: 'Oficina: lunes a viernes de mañana',
    cuerpo: 'policia_local' as Cuerpo,
    secuencia: ['manana', 'manana', 'manana', 'manana', 'manana', 'libre', 'libre'],
    definiciones: DEF_MTN,
    editable: true,
  },
];

/**
 * Festivos nacionales de España sembrados para 2026 (comunes a todo el territorio; los
 * autonómicos y locales los añade el usuario en `festivosExtra`). No es una base de datos
 * completa: es la semilla que evita configurar a mano lo obvio (§4.9). Fechas civiles UTC.
 */
export const FESTIVOS_NACIONALES_2026: string[] = [
  '2026-01-01', // Año Nuevo
  '2026-01-06', // Epifanía del Señor
  '2026-04-03', // Viernes Santo
  '2026-05-01', // Fiesta del Trabajo
  '2026-08-15', // Asunción de la Virgen
  '2026-10-12', // Fiesta Nacional de España
  '2026-11-02', // Todos los Santos (trasladado; el 1 cae en domingo)
  '2026-12-07', // Día de la Constitución (trasladado; el 6 cae en domingo)
  '2026-12-08', // Inmaculada Concepción
  '2026-12-25', // Natividad del Señor
];
