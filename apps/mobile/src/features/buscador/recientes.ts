/**
 * Lógica PURA de búsquedas recientes (01-ux §6.1: "Repetir última / Recientes"). Sin dependencias
 * de React Native/SQLite para poder testearla; el store (`recientesStore`) la usa y le añade la
 * persistencia local (app_flag). Nada de esto sale del dispositivo (ADR-001).
 */

/** Máximo de términos recientes que se guardan/muestran. */
export const MAX_RECIENTES = 6;

/** Parseo tolerante: si el JSON está corrupto o no es un array de strings, se ignora. */
export function parseRecientes(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data.filter((x): x is string => typeof x === 'string').slice(0, MAX_RECIENTES);
  } catch {
    return [];
  }
}

/**
 * Inserta un término al frente, deduplicando sin distinguir mayúsculas y acotando a `MAX_RECIENTES`.
 * Un término vacío/espacios deja la lista intacta (devuelve la MISMA referencia).
 */
export function siguienteRecientes(previos: string[], termino: string): string[] {
  const limpio = termino.trim();
  if (limpio.length === 0) return previos;
  const sinDuplicado = previos.filter((r) => r.toLowerCase() !== limpio.toLowerCase());
  return [limpio, ...sinDuplicado].slice(0, MAX_RECIENTES);
}
