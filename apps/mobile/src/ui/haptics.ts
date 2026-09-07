import * as Haptics from 'expo-haptics';
import { useSettingsStore } from '@/store/settings';
import { getReduceMotion } from '@/ui/motion';

/**
 * Feedback HÁPTICO de la app (mejoras-usabilidad P0-1; mapa háptico de 01-ux §4.6).
 *
 * Reglas que este helper hace cumplir en un único sitio:
 *  - Respeta el toggle "Vibración" de Ajustes (`hapticsEnabled`): si está desactivado, NADA vibra.
 *  - La háptica NO esencial (selección de chips/pestañas/turnos) se silencia también con
 *    "reducir movimiento" activo. La háptica esencial (confirmar copia, alerta de gravedad,
 *    aviso de 0 resultados) SÍ se mantiene: es un refuerzo del feedback, nunca su sustituto.
 *  - Es tolerante: si la API falla (web, permisos), no rompe el flujo.
 *
 * Se lee el estado del store con `getState()` para poder llamarse desde cualquier sitio
 * (handlers, stores), no solo desde componentes.
 */

function habilitada(): boolean {
  return useSettingsStore.getState().hapticsEnabled;
}

function disparar(fn: () => Promise<void>): void {
  fn().catch(() => {});
}

/** Éxito (ESENCIAL): copiar boletín, guardar el día del cuadrante. */
export function hapticSuccess(): void {
  if (!habilitada()) return;
  disparar(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
}

/** Aviso (ESENCIAL): una búsqueda con texto termina en 0 resultados. */
export function hapticWarning(): void {
  if (!habilitada()) return;
  disparar(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
}

/** Alerta física (ESENCIAL): abrir una ficha muy grave / delito (impacto medio, una vez). */
export function hapticAlert(): void {
  if (!habilitada()) return;
  disparar(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
}

/** Selección (NO esencial): chips, pestañas, tipos de turno, elegir cuerpo. Se silencia con reduce-motion. */
export function hapticSelection(): void {
  if (!habilitada() || getReduceMotion()) return;
  disparar(() => Haptics.selectionAsync());
}

/** Toque ligero (NO esencial): fijar un favorito. Se silencia con reduce-motion. */
export function hapticLight(): void {
  if (!habilitada() || getReduceMotion()) return;
  disparar(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}
