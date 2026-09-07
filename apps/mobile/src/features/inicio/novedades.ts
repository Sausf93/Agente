import type { SqlRunner } from '@/db/sqlRunner';

/**
 * NOVEDADES normativas (§4.13) — leídas del PAQUETE DE CONTENIDO (solo lectura).
 *
 * Cada `ContentVersion` publica una `Novedad` (qué norma, qué artículos, resumen y fecha). La app
 * las lista en la pantalla "Novedades" y muestra un AVISO (badge) si hay alguna con fecha posterior
 * a la última vez que el agente abrió esa pantalla (marca "visto" guardada en `user.db`, local).
 *
 * La CARGA usa `SqlRunner` (agnóstico del motor, igual que buscador/ficha/normas). La DETECCIÓN de
 * "nuevas" es LÓGICA PURA (sin RN ni SQLite) para poder testearla con Vitest.
 */

/** Una entrada de novedad, tal y como la pinta la pantalla "Novedades". */
export interface Novedad {
  id: string;
  contentVersion: string;
  normaId: string | null;
  /** Ids de artículos afectados (JSON `string[]` en el paquete; puede venir vacío). */
  articulos: string[];
  resumen: string;
  /** Fecha ISO 8601 de publicación de la novedad. */
  fecha: string;
}

interface FilaNovedad {
  id: string;
  content_version: string;
  norma_id: string | null;
  articulos: string;
  resumen: string;
  fecha: string;
}

/** Parseo tolerante del JSON de artículos (defensivo ante contenido inesperado). */
function parseArticulos(json: string): string[] {
  try {
    const arr: unknown = JSON.parse(json);
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

/** Carga todas las novedades del paquete, la más reciente primero. */
export async function cargarNovedades(runner: SqlRunner): Promise<Novedad[]> {
  const filas = await runner.getAll<FilaNovedad>(
    `SELECT id, content_version, norma_id, articulos, resumen, fecha
       FROM novedad
      ORDER BY fecha DESC`,
  );
  return filas.map((f) => ({
    id: f.id,
    contentVersion: f.content_version,
    normaId: f.norma_id,
    articulos: parseArticulos(f.articulos),
    resumen: f.resumen,
    fecha: f.fecha,
  }));
}

/**
 * ¿Es esta novedad NUEVA respecto a la última vista? Nueva = nunca se abrió la pantalla
 * (`vistasHasta === null`) o la novedad es posterior a esa marca. Comparación lexicográfica de
 * fechas ISO 8601 (válida porque el formato es ordenable como texto).
 */
export function esNovedadNueva(novedad: Pick<Novedad, 'fecha'>, vistasHasta: string | null): boolean {
  if (vistasHasta === null) return true;
  return novedad.fecha > vistasHasta;
}

/** Nº de novedades nuevas desde la última vez que se abrió la pantalla. */
export function contarNovedadesNuevas(
  novedades: readonly Pick<Novedad, 'fecha'>[],
  vistasHasta: string | null,
): number {
  return novedades.reduce((n, nov) => (esNovedadNueva(nov, vistasHasta) ? n + 1 : n), 0);
}

/** ¿Hay al menos una novedad nueva? (para el badge de aviso en Inicio). */
export function hayNovedadesNuevas(
  novedades: readonly Pick<Novedad, 'fecha'>[],
  vistasHasta: string | null,
): boolean {
  return novedades.some((nov) => esNovedadNueva(nov, vistasHasta));
}

/**
 * Fecha de la novedad más reciente (para marcar "visto hasta aquí" al abrir la pantalla).
 * `null` si no hay novedades. No asume orden de entrada: recorre y se queda con el máximo.
 */
export function ultimaFechaNovedad(novedades: readonly Pick<Novedad, 'fecha'>[]): string | null {
  let max: string | null = null;
  for (const nov of novedades) {
    if (max === null || nov.fecha > max) max = nov.fecha;
  }
  return max;
}
