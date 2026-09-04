import type { CuerpoCompetente, TipoConsecuencia } from '@agente/shared';
import type { Competencia } from '@agente/shared';

/**
 * Formateadores PUROS de la ficha (sin React Native): euros, fecha, etiquetas de competencia y
 * de consecuencia. Se prueban con Vitest. La UI en español; los identificadores en inglés.
 */

/**
 * Formatea un importe en euros al estilo español ("200 €", "1.500 €", "1.234,50 €").
 * `null`/NaN → guion. Formateo MANUAL (no `Intl`) para ser determinista en cualquier
 * entorno y en el motor Hermes de React Native, cuyo soporte de `Intl` es limitado.
 */
export function formatEuros(importe: number | null): string {
  if (importe === null || Number.isNaN(importe)) return '—';
  const esEntero = Number.isInteger(importe);
  const fijo = esEntero ? importe.toFixed(0) : importe.toFixed(2);
  const [entera, decimal] = fijo.split('.');
  // Separador de miles con punto (es-ES).
  const conMiles = (entera ?? '0').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const cuerpo = decimal ? `${conMiles},${decimal}` : conMiles;
  return `${cuerpo} €`;
}

/** Convierte una fecha ISO 8601 a "dd/mm/aaaa". Entrada inválida → cadena vacía. */
export function formatFecha(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const dia = String(d.getUTCDate()).padStart(2, '0');
  const mes = String(d.getUTCMonth() + 1).padStart(2, '0');
  const anio = d.getUTCFullYear();
  return `${dia}/${mes}/${anio}`;
}

/** Etiqueta legible de cada cuerpo competente (§4.4 punto 7). Sin denominaciones oficiales. */
export const CUERPO_LABEL: Record<CuerpoCompetente, string> = {
  guardia_civil: 'Guardia Civil',
  policia_nacional: 'Policía Nacional',
  policia_local: 'Policía Local',
  policia_autonomica: 'Policía autonómica',
  trafico: 'Tráfico',
};

/** Etiqueta de la vía sobre la que aplica la competencia. */
const VIA_LABEL: Record<Competencia['via'], string> = {
  urbana: 'vía urbana',
  interurbana: 'vía interurbana',
  ambas: 'urbana e interurbana',
};

/** Texto de competencia: "Guardia Civil, Policía Local, Tráfico · urbana e interurbana". */
export function formatCompetencia(competencia: Competencia): string {
  const cuerpos = competencia.cuerpos.map((c) => CUERPO_LABEL[c]).join(', ');
  const via = VIA_LABEL[competencia.via];
  if (!cuerpos) return via;
  return `${cuerpos} · ${via}`;
}

/** Etiqueta corta del tipo de consecuencia (para el chip con fuente, §4.6). */
export const CONSECUENCIA_LABEL: Record<TipoConsecuencia, string> = {
  detencion: 'Detención',
  inmovilizacion: 'Inmovilización',
  deposito: 'Depósito / grúa',
  decomiso: 'Decomiso',
  retirada_permiso: 'Retirada de permiso',
  identificacion: 'Identificación',
};
