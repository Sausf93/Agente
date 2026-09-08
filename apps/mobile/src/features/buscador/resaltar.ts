import { normalizarBusqueda, type TipoConsecuencia } from '@agente/shared';

/**
 * Lógica PURA de los "resultados vivos" del buscador (mejoras-usabilidad P0-4). Sin React Native,
 * para poder probarla con Vitest. Cubre dos cosas:
 *  1. Resaltado del tramo que hizo MATCH en el título (reduce el "¿por qué me sale esto?").
 *  2. Pista de la consecuencia DETERMINANTE (grúa / inmovilización / detención), que muchas veces
 *     es lo que el agente busca más que el importe.
 */

/** Un trozo del título para pintar: si `match` es `true`, va resaltado. */
export interface SegmentoResaltado {
  texto: string;
  match: boolean;
}

/** Longitud mínima de token para resaltar (evita resaltar preposiciones o una sola letra). */
const MIN_TOKEN = 2;

/**
 * Parte `texto` en segmentos, marcando como `match` las PALABRAS cuyo comienzo (plegado igual que
 * el buscador: sin tildes, minúsculas, ñ→n) coincide con alguno de los tokens de la consulta.
 *
 * Se resalta la palabra COMPLETA (no un tramo a medias) para no depender del mapeo de posiciones
 * entre el texto original con tildes y su forma normalizada: es robusto y visualmente claro. La
 * coincidencia es por PREFIJO, igual que el FTS ("segu" resalta "seguro").
 */
export function resaltarCoincidencia(texto: string, consulta: string): SegmentoResaltado[] {
  const tokens = normalizarBusqueda(consulta)
    .split(/[^a-z0-9]+/)
    .filter((tok) => tok.length >= MIN_TOKEN);
  if (tokens.length === 0 || texto.length === 0) {
    return texto.length > 0 ? [{ texto, match: false }] : [];
  }

  // Trocea en runs de letras/números vs. el resto (espacios, puntuación), conservándolo todo.
  const piezas = texto.match(/[\p{L}\p{N}]+|[^\p{L}\p{N}]+/gu) ?? [texto];
  const segmentos: SegmentoResaltado[] = [];
  for (const pieza of piezas) {
    const norm = normalizarBusqueda(pieza);
    const esPalabra = /[\p{L}\p{N}]/u.test(pieza);
    const hayMatch = esPalabra && tokens.some((tok) => norm.startsWith(tok));
    const ultimo = segmentos[segmentos.length - 1];
    if (ultimo && ultimo.match === hayMatch) {
      ultimo.texto += pieza; // fusiona segmentos contiguos del mismo tipo
    } else {
      segmentos.push({ texto: pieza, match: hayMatch });
    }
  }
  return segmentos;
}

/**
 * Prioridad de las consecuencias para elegir la DETERMINANTE (la que se muestra como chip inline).
 * Cuanto más arriba, más "pesa" en la decisión de calle. `identificacion` no genera chip: es el
 * caso por defecto y no aporta señal.
 */
const PRIORIDAD: TipoConsecuencia[] = [
  'detencion',
  'proteccion',
  'cese_actividad',
  'inmovilizacion',
  'deposito',
  'retirada_permiso',
  'decomiso',
];

/** Consecuencia que se pinta con tono de PELIGRO (vía penal). */
const PELIGRO = new Set<TipoConsecuencia>(['detencion']);

/** Pista de consecuencia para la fila del buscador. */
export interface PistaConsecuencia {
  tipo: TipoConsecuencia;
  /** `true` → chip en tono de peligro (detención). */
  peligro: boolean;
}

/**
 * Dado el conjunto de consecuencias de una infracción, devuelve la DETERMINANTE (la de mayor
 * prioridad) para el chip inline, o `null` si ninguna merece chip.
 */
export function pistaConsecuencia(tipos: TipoConsecuencia[]): PistaConsecuencia | null {
  for (const tipo of PRIORIDAD) {
    if (tipos.includes(tipo)) {
      return { tipo, peligro: PELIGRO.has(tipo) };
    }
  }
  return null;
}
