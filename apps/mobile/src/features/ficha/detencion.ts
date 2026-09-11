import {
  EntradaDetencion,
  type EntradaDetencionNormalizada,
  type OrientacionDetencion,
  type TramoEdadAutor,
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

/**
 * Campos booleanos de la entrada que el árbol expone como toggles de circunstancia. Excluye
 * `gravedadCp` (selector propio), `edadAutor` (selector de 3 tramos), `soloHechoMigratorio`
 * (toggle propio con ayuda anti-error) y `penaSoloMulta` (propiedad del DELITO, no una
 * circunstancia que el agente marque: viene fijada en la ficha): esos no son toggles.
 */
export type CampoCircunstancia = Exclude<
  keyof EntradaDetencionNormalizada,
  'gravedadCp' | 'edadAutor' | 'soloHechoMigratorio' | 'penaSoloMulta'
>;

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

/**
 * Selector de EDAD del autor (3 tramos excluyentes, NO toggle), al inicio del bloque "Afinar el
 * caso": la edad puede cortocircuitar el árbol penal (§1.1 de la spec jurídica). Cada tramo trae
 * su ayuda orientativa en español.
 */
export interface TramoEdadOpcion {
  valor: TramoEdadAutor;
  etiqueta: string;
  ayuda: string;
}

export const TRAMOS_EDAD: readonly TramoEdadOpcion[] = [
  {
    valor: 'menor_14',
    etiqueta: 'Menor de 14',
    ayuda: 'Inimputable penalmente: no hay detención penal, sino protección de menores (art. 3 LO 5/2000).',
  },
  {
    valor: 'menor_14_17',
    etiqueta: '14 a 17',
    ayuda: 'Régimen penal del menor, con las especialidades del art. 17 LO 5/2000.',
  },
  {
    valor: 'adulto',
    etiqueta: '18 o más',
    ayuda: 'Régimen penal ordinario.',
  },
];

/**
 * Toggle "Solo estancia irregular (sin delito)" con AYUDA ANTI-ERROR (§1.2): la estancia irregular
 * NO es delito (art. 53.1.a LO 4/2000); si además hay un ilícito penal, NO se marca (se sigue el
 * árbol penal). Es un discriminador de rama, no un agravante.
 */
export const MIGRATORIO_ETIQUETA = 'Solo estancia irregular (sin delito)';
export const MIGRATORIO_AYUDA =
  'La estancia irregular es una infracción administrativa, no un delito (art. 53.1.a LO 4/2000). ' +
  'Si además hay un ilícito penal (resistencia, quebrantar prohibición de entrada, documentación ' +
  'falsa…), NO lo marques: se sigue el árbol penal.';

/**
 * Tono visual (color + texto) de cada orientación. Nunca solo color: cada tono lleva etiqueta.
 * `info` (azul informativo) es para "No es detención penal": de un vistazo se distingue de
 * `noProcede` (rojo, "delito leve, ojo") que sí es materia penal. No toca los colores de gravedad.
 */
export type TonoOrientacion = 'procede' | 'puede' | 'noProcede' | 'info';

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
  no_detencion_penal: { tono: 'info', etiqueta: 'No es detención penal', icono: 'shield-x' },
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
