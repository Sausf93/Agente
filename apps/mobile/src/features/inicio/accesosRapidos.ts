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

/**
 * Accesos GENÉRICOS de SEGURIDAD CIUDADANA (LO 4/2015, estatal → siempre resuelven). Es el set al
 * que cae la POLICÍA AUTONÓMICA cuando su comunidad aún NO trae normativa autonómica cargada: nunca
 * a tráfico (no es la consulta de calle nº1 de una autonómica integral), sino a seguridad ciudadana.
 */
export const ACCESOS_SEGURIDAD_CIUDADANA: readonly AccesoRapido[] = [
  buscar('Desobediencia'),
  buscar('Drogas en vía pública'),
  buscar('Identificación', 'identificacion'),
  buscar('Falta de respeto', 'falta de respeto'),
  buscar('Armas prohibidas', 'arma prohibida'),
];

/**
 * Accesos de POLICÍA AUTONÓMICA con normativa autonómica cargada (ocio nocturno y actividades
 * clasificadas: el trabajo de calle de una autonómica integral). Los términos enganchan las fichas
 * autonómicas (p. ej. Ley 7/2011 de Canarias). Si su CCAA no tiene contenido, se usa el set de
 * seguridad ciudadana (ver `accesosRapidosPara`).
 */
export const ACCESOS_AUTONOMICA: readonly AccesoRapido[] = [
  buscar('Ocio nocturno', 'ocio nocturno'),
  buscar('Sin licencia', 'sin licencia'),
  buscar('Exceso de aforo', 'exceso de aforo'),
  buscar('Ruidos', 'ruidos del local'),
  buscar('Alcohol a menores', 'alcohol a menores'),
];

/** Accesos de POLICÍA NACIONAL: seguridad ciudadana y vía penal, NO tráfico. */
export const ACCESOS_POLICIA_NACIONAL: readonly AccesoRapido[] = [
  buscar('Desobediencia'),
  buscar('Drogas en vía pública'),
  buscar('Hurto'),
  buscar('Robo'),
  // "Leer derechos" abre la pantalla de derechos del detenido (no es una búsqueda).
  { label: 'Leer derechos', destino: { tipo: 'ruta', valor: '/derechos' } },
  // "Identificación" lleva a la ficha del REQUERIMIENTO de identificación (art. 16 LOSC), la
  // consulta diaria de PN/GC/Local: 'identificacion' es el sinónimo que la devuelve primero (antes
  // era 'no se identifica', que abría la NEGATIVA del art. 36.6, otra cosa distinta).
  buscar('Identificación', 'identificacion'),
];

/**
 * Devuelve los accesos rápidos para el cuerpo del perfil.
 *  - Policía Nacional: seguridad ciudadana y vía penal.
 *  - Policía Local: tráfico urbano + convivencia (zona azul, patinete).
 *  - Policía Autonómica: OCIO/actividades clasificadas si su CCAA trae normativa autonómica cargada
 *    (`tieneContenidoAutonomico`); si no, set genérico de seguridad ciudadana — NUNCA tráfico.
 *  - Guardia Civil / sin cuerpo: tráfico por defecto.
 */
export function accesosRapidosPara(
  cuerpo: Cuerpo | null,
  tieneContenidoAutonomico: boolean = false,
): AccesoRapido[] {
  switch (cuerpo) {
    case 'policia_nacional':
      return [...ACCESOS_POLICIA_NACIONAL];
    case 'policia_local':
      return [...ACCESOS_TRAFICO, ...ACCESOS_LOCAL_EXTRA];
    case 'policia_autonomica':
      return tieneContenidoAutonomico
        ? [...ACCESOS_AUTONOMICA]
        : [...ACCESOS_SEGURIDAD_CIUDADANA];
    case 'guardia_civil':
    default:
      return [...ACCESOS_TRAFICO];
  }
}
