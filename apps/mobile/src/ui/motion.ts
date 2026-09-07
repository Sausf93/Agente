import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Respeto GLOBAL a "reducir movimiento" (mejoras-usabilidad P2-14, usado ya por los P0).
 *
 * Centraliza la lectura de `AccessibilityInfo.isReduceMotionEnabled()` en un único sitio:
 *  - `getReduceMotion()` es un getter SÍNCRONO (con caché) para código fuera de React
 *    (p. ej. el helper de háptica), que no puede usar hooks.
 *  - `useReduceMotion()` es el hook para componentes: re-renderiza si el ajuste cambia.
 *
 * Regla del sistema visual: con "reducir movimiento" activo, las animaciones NO esenciales se
 * desactivan (cambios de estado sin desplazamiento) y la háptica no esencial no se dispara; la
 * app sigue siendo plenamente usable (el feedback nunca depende solo del movimiento).
 */

let cache = false;
let inicializado = false;
const oyentes = new Set<(valor: boolean) => void>();

function fijar(valor: boolean): void {
  cache = valor;
  for (const cb of oyentes) cb(valor);
}

/** Arranca la suscripción una sola vez (idempotente). Tolerante en web/entornos sin API. */
function inicializar(): void {
  if (inicializado) return;
  inicializado = true;
  try {
    void AccessibilityInfo.isReduceMotionEnabled().then(fijar).catch(() => {});
    AccessibilityInfo.addEventListener('reduceMotionChanged', fijar);
  } catch {
    // Entorno sin AccessibilityInfo (p. ej. algunos targets web): se queda en `false`.
  }
}

/** Getter síncrono con caché. Para uso fuera de React (háptica, animaciones imperativas). */
export function getReduceMotion(): boolean {
  inicializar();
  return cache;
}

/** Hook para componentes: devuelve `true` si el usuario pidió reducir el movimiento. */
export function useReduceMotion(): boolean {
  const [valor, setValor] = useState<boolean>(() => {
    inicializar();
    return cache;
  });
  useEffect(() => {
    oyentes.add(setValor);
    setValor(cache);
    return () => {
      oyentes.delete(setValor);
    };
  }, []);
  return valor;
}
