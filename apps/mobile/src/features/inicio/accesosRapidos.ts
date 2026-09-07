import type { Cuerpo } from '@agente/shared';

/**
 * ACCESOS RÁPIDOS de INICIO adaptados al CUERPO (rediseño 2026-09, feedback "validadores de
 * calle"): los accesos por defecto olían a tráfico y no encajaban con Policía Nacional. Aquí vive
 * SOLO la lógica pura (qué términos por cuerpo), sin iconos ni React Native, para poder probarla
 * con Vitest. Los iconos se enganchan en la UI (`HomeInicio`).
 *
 * Cada término es lenguaje de la calle que el buscador resuelve por sinónimo; si un término aún no
 * tiene contenido, la búsqueda simplemente no devuelve resultados (nunca rompe).
 */

/** Accesos de TRÁFICO (Guardia Civil y Policía Local): lo más consultado en carretera/vía. */
export const ACCESOS_TRAFICO = [
  'Sin seguro',
  'Móvil',
  'Faro roto',
  'Alcoholemia',
  'Sin ITV',
  'Semáforo rojo',
] as const;

/** Añadidos de POLICÍA LOCAL: convivencia y movilidad urbana (zona azul, patinete). */
export const ACCESOS_LOCAL_EXTRA = ['Zona azul', 'Patinete'] as const;

/** Accesos de POLICÍA NACIONAL: seguridad ciudadana y vía penal, NO tráfico. */
export const ACCESOS_POLICIA_NACIONAL = [
  'Desobediencia',
  'Drogas en vía pública',
  'Hurto',
  'Robo',
  'Leer derechos',
  'Identificación',
] as const;

/**
 * Devuelve los términos de acceso rápido para el cuerpo del perfil. Sin cuerpo (o autonómica, que
 * asume competencia mixta hasta afinar su set) cae al set de tráfico por defecto.
 */
export function accesosRapidosPara(cuerpo: Cuerpo | null): string[] {
  switch (cuerpo) {
    case 'policia_nacional':
      return [...ACCESOS_POLICIA_NACIONAL];
    case 'policia_local':
      return [...ACCESOS_TRAFICO, ...ACCESOS_LOCAL_EXTRA];
    case 'guardia_civil':
    case 'policia_autonomica':
    default:
      return [...ACCESOS_TRAFICO];
  }
}
