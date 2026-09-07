import type { Plantilla, TipoPlantilla } from '@agente/shared';

/**
 * Metadatos de FORMULARIO de una plantilla (§4.8). Viven en la app (no en el dominio) porque
 * describen cómo se PIDE cada hueco `{{clave}}` al agente, no el dato en sí.
 *
 * La distinción clave es `esDatoTercero`: los campos de vehículo/persona (matrícula, nombre,
 * DNI, domicilio…) son DATOS DE TERCEROS y viven SOLO en el dispositivo — nunca se envían a un
 * servidor ni se persisten como borrador (regla innegociable de `CLAUDE.md` y §10). La UI los
 * agrupa bajo un aviso fijo de privacidad.
 */

/** Cómo se edita un campo en el formulario. */
export type TipoCampo = 'texto' | 'multilinea' | 'fecha' | 'hora';

/** Descriptor de un hueco `{{clave}}` de la plantilla. */
export interface CampoPlantilla {
  /** Clave de la variable en el Markdown (`{{clave}}`). */
  clave: string;
  /** Etiqueta visible para el agente (español). */
  etiqueta: string;
  tipo: TipoCampo;
  /**
   * DATO DE TERCERO (matrícula, nombre, DNI, domicilio…): solo en el dispositivo, nunca sale ni
   * se guarda como borrador. La UI lo marca con el aviso de privacidad.
   */
  esDatoTercero: boolean;
  /**
   * Se RECUERDA entre documentos (solo campos del agente, no de terceros): p. ej. su unidad.
   * Ahorra reescribir lo mismo cada vez (pilar "ahorra trabajo de oficina").
   */
  recordar?: boolean;
  placeholder?: string;
  hint?: string;
}

/** Plantilla lista para usar en la app: el modelo de dominio + los descriptores de sus campos. */
export interface PlantillaDoc extends Plantilla {
  /** Frase corta para la lista de plantillas. */
  descripcion: string;
  /** Descriptor de cada `{{variable}}` del Markdown (1:1, verificado en test). */
  campos: CampoPlantilla[];
}

/** Etiqueta legible del tipo de plantilla (para cabeceras y nombres de archivo). */
export const TIPO_PLANTILLA_LABEL: Record<TipoPlantilla, string> = {
  boletin_denuncia: 'Boletín de denuncia administrativa',
  acta_inmovilizacion: 'Acta de inmovilización',
  acta_intervencion_sustancias: 'Acta de intervención de sustancias',
  diligencia_identificacion: 'Diligencia de identificación',
  acta_lectura_derechos: 'Acta de lectura de derechos',
  acta_informacion_victima: 'Acta de información a la víctima',
};
