import {
  evaluarDetencion,
  type EntradaDetencion,
  type GravedadPenal,
  type OrientacionDetencion,
} from '@agente/shared';

/**
 * HELPER COMPARTIDO del motor de DETENCIÓN para los seeds (LECrim, §4.6).
 *
 * La consecuencia de tipo `detencion` guarda una `regla` estructurada que la ficha rehidrata para
 * pintar el ÁRBOL interactivo y el botón "Leer derechos" (`parseReglaDetencion` en la app). Esa
 * `regla` la GENERA el motor de `@agente/shared` (una sola fuente de verdad). Aquí vive el
 * constructor de la `regla` para que TODOS los seeds la produzcan igual (penal y tráfico), sin
 * duplicar la lógica: si un seed la olvidaba (`regla: {}`), la ficha no pintaba el árbol.
 */

/** Forma de la `regla` de una consecuencia de detención (la que rehidrata el árbol en la app). */
export interface ReglaDetencion {
  motor: 'detencion';
  gravedadCp: GravedadPenal;
  escenarioBase: EntradaDetencion;
  orientacionBase: OrientacionDetencion;
}

/**
 * Escenario BASE con el que se materializa la consecuencia estática de la ficha: el caso más
 * habitual en el que el agente se plantea la detención, el DELITO FLAGRANTE (art. 490), con
 * domicilio conocido (lo que solo cambia el resultado en el delito leve, art. 495). El árbol
 * interactivo parte de aquí y deja al agente activar/desactivar cada circunstancia.
 */
export function escenarioBaseDetencion(
  gravedadCp: GravedadPenal,
  opts: { penaSoloMulta?: boolean } = {},
): EntradaDetencion {
  return { gravedadCp, flagrancia: true, domicilioConocido: true, penaSoloMulta: opts.penaSoloMulta ?? false };
}

/**
 * Construye la `regla` de una consecuencia de detención a partir de la gravedad penal (art. 33 CP).
 * Determinista: la orientación base la calcula el motor sobre el `escenarioBase`. La usan el seed
 * penal y el de tráfico (temeraria art. 380, negativa art. 383) para que ambos pinten el árbol.
 */
export function reglaDetencion(
  gravedadCp: GravedadPenal,
  opts: { penaSoloMulta?: boolean } = {},
): ReglaDetencion {
  const escenarioBase = escenarioBaseDetencion(gravedadCp, opts);
  const resultado = evaluarDetencion(escenarioBase);
  return { motor: 'detencion', gravedadCp, escenarioBase, orientacionBase: resultado.orientacion };
}
