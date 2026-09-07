import {
  EntradaDetencion,
  type EntradaDetencionNormalizada,
  type OrientacionDetencion,
} from '@agente/shared';

/**
 * Piezas PURAS del árbol de detención interactivo de la ficha (LECrim, §4.6). La lógica jurídica
 * vive y se prueba en `@agente/shared` (`evaluarDetencion`); aquí solo va lo que necesita la UI:
 *  - rehidratar la ENTRADA inicial desde la `regla` que trae la consecuencia de tipo `detencion`;
 *  - la lista de CIRCUNSTANCIAS que el agente activa con toggles (etiqueta + ayuda en español);
 *  - el mapa de cada ORIENTACIÓN a su presentación (tono + etiqueta + icono), SIEMPRE color+texto.
 *
 * Regla innegociable: contenido orientativo, nunca imperativo; el pie de responsabilidad y las
 * fuentes los aporta el motor y se muestran tal cual.
 */

/** Campos booleanos de la entrada que el árbol expone como toggles. */
export type CampoCircunstancia = Exclude<keyof EntradaDetencionNormalizada, 'gravedadCp'>;

/** Definición de un toggle del árbol: campo del motor + textos en español. */
export interface Circunstancia {
  campo: CampoCircunstancia;
  etiqueta: string;
  ayuda: string;
}

/**
 * Circunstancias en el ORDEN en que se presentan (de las que "abren" la detención a las que solo
 * pesan en el delito leve). Cada una alimenta `evaluarDetencion` en vivo.
 */
export const CIRCUNSTANCIAS_DETENCION: Circunstancia[] = [
  {
    campo: 'flagrancia',
    etiqueta: 'Delito flagrante',
    ayuda: 'Se sorprende a la persona en el momento de cometerlo (art. 490.2 LECrim).',
  },
  {
    campo: 'intentoDelito',
    etiqueta: 'Intento de delito',
    ayuda: 'Se la sorprende intentando cometerlo (art. 490.1 LECrim).',
  },
  {
    campo: 'fugaORebeldia',
    etiqueta: 'Fuga o rebeldía',
    ayuda: 'Fuga de la custodia o situación de rebeldía (art. 490.3-7 LECrim).',
  },
  {
    campo: 'indiciosRacionalesDelito',
    etiqueta: 'Indicios racionales del delito',
    ayuda: 'Motivos racionalmente bastantes para creer que el delito existe (art. 492.4.1).',
  },
  {
    campo: 'indiciosParticipacion',
    etiqueta: 'Indicios de participación',
    ayuda: 'Motivos bastantes para creer que la persona participó (art. 492.4.2).',
  },
  {
    campo: 'riesgoIncomparecencia',
    etiqueta: 'Riesgo de incomparecencia',
    ayuda: 'Circunstancias que hacen presumir que no comparecerá (art. 492.3).',
  },
  {
    campo: 'domicilioConocido',
    etiqueta: 'Domicilio conocido',
    ayuda: 'Solo pesa en el delito leve (art. 495 LECrim).',
  },
  {
    campo: 'prestariaFianza',
    etiqueta: 'Prestaría fianza',
    ayuda: 'Prestaría fianza bastante a juicio del agente; solo pesa en el delito leve (art. 495).',
  },
];

/** Tono visual (color + texto) de cada orientación. Nunca solo color: cada tono lleva etiqueta. */
export type TonoOrientacion = 'procede' | 'puede' | 'noProcede';

export interface OrientacionVisual {
  tono: TonoOrientacion;
  /** Etiqueta corta para el encabezado del resultado. */
  etiqueta: string;
  /** Nombre del icono Lucide que refuerza el estado (nunca sustituye al texto). */
  icono: 'shield-check' | 'shield-alert' | 'shield-x';
}

export const ORIENTACION_VISUAL: Record<OrientacionDetencion, OrientacionVisual> = {
  procede: { tono: 'procede', etiqueta: 'Procede', icono: 'shield-check' },
  puede_proceder: { tono: 'puede', etiqueta: 'Puede proceder', icono: 'shield-alert' },
  no_procede_salvo: { tono: 'noProcede', etiqueta: 'No procede salvo…', icono: 'shield-x' },
};

/**
 * Rehidrata la ENTRADA inicial del árbol desde la `regla` de la consecuencia `detencion`
 * (`{ motor, gravedadCp, escenarioBase, orientacionBase }`). Devuelve `null` si la regla no es de
 * detención o no valida, para que la ficha no pinte el árbol sobre datos corruptos.
 */
export function parseReglaDetencion(
  regla: Record<string, unknown> | null | undefined,
): EntradaDetencionNormalizada | null {
  if (!regla || regla.motor !== 'detencion') return null;
  const parsed = EntradaDetencion.safeParse(regla.escenarioBase);
  return parsed.success ? parsed.data : null;
}
