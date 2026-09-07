import type { Cuerpo } from '@agente/shared';

/**
 * ACCESOS RÁPIDOS de INICIO adaptados al CUERPO (rediseño 2026-09, feedback "validadores de
 * calle"): los accesos por defecto olían a tráfico y no encajaban con Policía Nacional. Aquí vive
 * SOLO la lógica pura (qué accesos por cuerpo y su DESTINO), sin iconos ni React Native, para poder
 * probarla con Vitest. Los iconos se enganchan en la UI (`HomeInicio`).
 *
 * Cada acceso lleva un DESTINO explícito: `buscar` teclea un término en el buscador (el caso
 * habitual; el buscador lo resuelve por sinónimo), y `ruta` abre una pantalla directa. Así "Leer
 * derechos" ABRE la pantalla de derechos (no una búsqueda que daría "nada exacto") e
 * "Identificación" lleva a una búsqueda que SÍ devuelve resultado.
 */

/** Destino de un acceso rápido: una búsqueda (término) o una ruta de navegación. */
export type AccesoDestino =
  | { tipo: 'buscar'; valor: string }
  | { tipo: 'ruta'; valor: string };

/** Un acceso rápido: la etiqueta que se pinta (y con la que se elige el icono) y su destino. */
export interface AccesoRapido {
  label: string;
  destino: AccesoDestino;
}

/** Atajo: un acceso que teclea un término en el buscador (por defecto, la propia etiqueta). */
const buscar = (label: string, termino: string = label): AccesoRapido => ({
  label,
  destino: { tipo: 'buscar', valor: termino },
});

/** Accesos de TRÁFICO (Guardia Civil y Policía Local): lo más consultado en carretera/vía. */
export const ACCESOS_TRAFICO: readonly AccesoRapido[] = [
  buscar('Sin seguro'),
  buscar('Móvil'),
  buscar('Faro roto'),
  buscar('Alcoholemia'),
  buscar('Sin ITV'),
  buscar('Semáforo rojo'),
];

/** Añadidos de POLICÍA LOCAL: convivencia y movilidad urbana (zona azul, patinete). */
export const ACCESOS_LOCAL_EXTRA: readonly AccesoRapido[] = [buscar('Zona azul'), buscar('Patinete')];

/** Accesos de POLICÍA NACIONAL: seguridad ciudadana y vía penal, NO tráfico. */
export const ACCESOS_POLICIA_NACIONAL: readonly AccesoRapido[] = [
  buscar('Desobediencia'),
  buscar('Drogas en vía pública'),
  buscar('Hurto'),
  buscar('Robo'),
  // "Leer derechos" abre la pantalla de derechos del detenido (no es una búsqueda).
  { label: 'Leer derechos', destino: { tipo: 'ruta', valor: '/derechos' } },
  // "Identificación" busca un término que SÍ devuelve ficha (negativa a identificarse, art. 36.6 LOSC).
  buscar('Identificación', 'no se identifica'),
];

/**
 * Devuelve los accesos rápidos para el cuerpo del perfil. Sin cuerpo (o autonómica, que asume
 * competencia mixta hasta afinar su set) cae al set de tráfico por defecto.
 */
export function accesosRapidosPara(cuerpo: Cuerpo | null): AccesoRapido[] {
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
