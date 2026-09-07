import type { TipoServicio } from '@agente/shared';
import type { Theme } from '@/ui/theme';

/**
 * Presentación de cada tipo de servicio del cuadrante. La regla del sistema visual manda:
 * NUNCA solo color → cada turno lleva SIEMPRE su abreviatura de letra (02-ui.md §5.7). El
 * color es un refuerzo, no la única señal.
 *
 * Es lógica pura (mapas + una función que recibe el `Theme`): no toca React Native, así que
 * los colores salen siempre de los tokens del tema (cero colores sueltos).
 */

/** Abreviatura de una letra (o dos) para la celda del cuadrante. */
export const SERVICIO_ABREV: Record<TipoServicio, string> = {
  manana: 'M',
  tarde: 'T',
  noche: 'N',
  saliente: 'S',
  libre: 'L',
  disponibilidad: 'D',
  servicio_extra: 'E',
  vacaciones: 'V',
  asuntos_propios: 'AP',
  baja: 'B',
  curso: 'C',
  otros: 'O',
};

/** Nombre completo en español, para el selector y la accesibilidad. */
export const SERVICIO_LABEL: Record<TipoServicio, string> = {
  manana: 'Mañana',
  tarde: 'Tarde',
  noche: 'Noche',
  saliente: 'Saliente',
  libre: 'Libre',
  disponibilidad: 'Disponibilidad',
  servicio_extra: 'Servicio extra',
  vacaciones: 'Vacaciones',
  asuntos_propios: 'Asuntos propios',
  baja: 'Baja',
  curso: 'Curso',
  otros: 'Otros',
};

/** Orden de aparición en el selector de edición de un día. */
export const SERVICIOS_ORDEN: TipoServicio[] = [
  'manana',
  'tarde',
  'noche',
  'saliente',
  'libre',
  'servicio_extra',
  'disponibilidad',
  'vacaciones',
  'asuntos_propios',
  'curso',
  'baja',
  'otros',
];

export interface ColorServicio {
  bg: string;
  fg: string;
}

/**
 * Colores de la celda por tipo de servicio, tomados de los tokens semánticos del tema
 * (funciona igual en claro y oscuro). Los turnos de trabajo se distinguen entre sí por la
 * LETRA (M/T/N/E); el color agrupa por naturaleza: trabajo, descanso, ausencia, disponibilidad.
 */
export function colorServicio(t: Theme, servicio: TipoServicio): ColorServicio {
  switch (servicio) {
    case 'manana':
    case 'tarde':
    case 'noche':
    case 'servicio_extra':
      return { bg: t.color.infoBg, fg: t.color.info };
    case 'saliente':
      return { bg: t.color.surfaceAlt, fg: t.color.textSecondary };
    case 'libre':
      return { bg: t.color.surface, fg: t.color.textTertiary };
    case 'disponibilidad':
      return { bg: t.color.surfaceAlt, fg: t.color.textPrimary };
    case 'vacaciones':
    case 'asuntos_propios':
      return { bg: t.color.successBg, fg: t.color.success };
    case 'curso':
      return { bg: t.color.warningBg, fg: t.color.warning };
    case 'baja':
      return { bg: t.color.dangerBg, fg: t.color.danger };
    case 'otros':
    default:
      return { bg: t.color.surfaceAlt, fg: t.color.textSecondary };
  }
}

/** Etiquetas de cabecera de la semana (lunes primero, convención del cuadrante). */
export const DIAS_SEMANA_ABREV = ['L', 'M', 'X', 'J', 'V', 'S', 'D'] as const;

/** Nombres de mes en español para la cabecera de navegación. */
export const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
] as const;
