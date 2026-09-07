import { AnclaCuadrante, Cuadrante, DiaCuadrante, PatronTurno, type FranjaNocturna } from '@agente/shared';

/**
 * Lógica PURA de persistencia del cuadrante (sin runtime de React Native ni SQLite).
 *
 * El cuadrante se guarda en DOS capas separadas, igual que el modelo de dominio y como
 * exige la regla de oro anti-pérdida de datos (perspectivas §8):
 *
 *  - CONFIG (una única fila): patrón, inicio de ciclo, jornada de referencia, franja
 *    nocturna y festivos extra. Cambiarla REGENERA el patrón proyectado.
 *  - EXCEPCIONES (una fila por fecha): las ediciones manuales del agente. Son SAGRADAS:
 *    editar un día toca solo su fila, y cambiar el patrón NUNCA las borra.
 *
 * Aquí vive el mapeo determinista fila SQLite ↔ dominio, testeable con Vitest. La capa
 * `db/userDb.ts` solo orquesta estas funciones con las APIs de `expo-sqlite`.
 */

/** Fila única de configuración del cuadrante (tabla `cuadrante_config`, id = 1). */
export interface CuadranteConfigRow {
  id: number;
  patron_json: string;
  inicio_ciclo: string;
  jornada_ref_h: number;
  computo_anual_ref_h: number | null;
  franja_inicio: string;
  franja_fin: string;
  festivos_extra_json: string;
  /** Ancla (día + turno) del que se derivó `inicio_ciclo`. NULL en cuadrantes previos al rediseño. */
  ancla_json: string | null;
  updated_at: string;
}

/** Fila de una excepción manual (tabla `cuadrante_excepcion`, clave = fecha). */
export interface CuadranteExcepcionRow {
  fecha: string;
  servicio: string;
  hora_inicio: string | null;
  hora_fin: string | null;
  nota: string | null;
  alarma_min: number | null;
  editado_el: string;
}

/** Serializa la configuración de un `Cuadrante` (sin sus excepciones) a la fila única. */
export function configToRow(cuadrante: Cuadrante, updatedAt: string): CuadranteConfigRow {
  return {
    id: 1,
    patron_json: JSON.stringify(cuadrante.patron),
    inicio_ciclo: cuadrante.inicioCiclo,
    jornada_ref_h: cuadrante.jornadaRefHorasSemana,
    computo_anual_ref_h: cuadrante.computoAnualRefHoras,
    franja_inicio: cuadrante.franjaNocturna.inicio,
    franja_fin: cuadrante.franjaNocturna.fin,
    festivos_extra_json: JSON.stringify(cuadrante.festivosExtra),
    ancla_json: cuadrante.ancla ? JSON.stringify(cuadrante.ancla) : null,
    updated_at: updatedAt,
  };
}

/** Serializa una excepción manual (`DiaCuadrante`) a su fila. */
export function excepcionToRow(dia: DiaCuadrante): CuadranteExcepcionRow {
  return {
    fecha: dia.fecha,
    servicio: dia.servicio,
    hora_inicio: dia.horaInicio,
    hora_fin: dia.horaFin,
    nota: dia.nota,
    alarma_min: dia.alarmaMinutosAntes,
    editado_el: dia.editadoEl,
  };
}

/** Deserializa una fila de excepción a `DiaCuadrante`, VALIDANDO con Zod (fuente única). */
export function rowToExcepcion(row: CuadranteExcepcionRow): DiaCuadrante {
  return DiaCuadrante.parse({
    fecha: row.fecha,
    servicio: row.servicio,
    horaInicio: row.hora_inicio,
    horaFin: row.hora_fin,
    nota: row.nota,
    alarmaMinutosAntes: row.alarma_min,
    origen: 'manual',
    editadoEl: row.editado_el,
  });
}

/**
 * Reensambla un `Cuadrante` completo a partir de su fila de configuración y sus filas
 * de excepciones, VALIDANDO con Zod. Las excepciones corruptas se descartan una a una
 * (nunca tumban el cuadrante entero: proteger el activo de retención).
 */
export function ensamblarCuadrante(
  config: CuadranteConfigRow,
  excepciones: readonly CuadranteExcepcionRow[],
): Cuadrante {
  const patron = PatronTurno.parse(JSON.parse(config.patron_json));
  const festivosExtra = JSON.parse(config.festivos_extra_json) as unknown;
  const franja: FranjaNocturna = { inicio: config.franja_inicio, fin: config.franja_fin };
  // Ancla opcional: solo desde el rediseño del arranque. Una fila previa (o un JSON corrupto)
  // deja `ancla = null` sin tumbar el cuadrante (el `inicio_ciclo` ya basta para proyectar).
  let ancla: AnclaCuadrante | null = null;
  if (config.ancla_json) {
    try {
      ancla = AnclaCuadrante.parse(JSON.parse(config.ancla_json));
    } catch {
      ancla = null;
    }
  }

  const dias: DiaCuadrante[] = [];
  for (const row of excepciones) {
    try {
      dias.push(rowToExcepcion(row));
    } catch {
      // Fila de excepción corrupta: se ignora, el resto del cuadrante se conserva.
    }
  }

  return Cuadrante.parse({
    patron,
    inicioCiclo: config.inicio_ciclo,
    ancla,
    jornadaRefHorasSemana: config.jornada_ref_h,
    computoAnualRefHoras: config.computo_anual_ref_h,
    franjaNocturna: franja,
    dias,
    festivosExtra,
  });
}
