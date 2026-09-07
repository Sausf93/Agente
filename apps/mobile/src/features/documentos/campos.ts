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

/**
 * SECCIÓN visual del campo. La app agrupa los huecos por lo que significan para el agente, no por
 * el orden en que aparecen en el Markdown:
 *
 * - `legal`: lo rellena LA APP desde la infracción (norma, artículo, texto/hecho, importe, puntos,
 *   gravedad). El agente NO lo reescribe; se muestra arriba en el bloque "Ya rellenado por la app".
 * - `identidad`: datos del agente que se REPITEN (cuerpo, unidad, nº TIP, instructor). Se recuerdan
 *   (`recordar`) para no teclearlos cada vez. Nunca son datos de terceros.
 * - `servicio`: lo específico que el agente pone al momento (fecha, hora, lugar/PK y los campos
 *   propios de cada acta: causa, motivo…).
 *
 * Los campos con `esDatoTercero` van SIEMPRE a su sección aparte con el aviso de privacidad, al
 * margen de esta categoría.
 */
export type CampoSeccion = 'legal' | 'identidad' | 'servicio';

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
   * Sección visual del campo (ver `CampoSeccion`). Si se omite, se trata como `servicio`. Los
   * datos de terceros se agrupan aparte ignorando esta categoría.
   */
  seccion?: CampoSeccion;
  /**
   * Se RECUERDA entre documentos (solo campos del agente, no de terceros): p. ej. su unidad.
   * Ahorra reescribir lo mismo cada vez (pilar "ahorra trabajo de oficina").
   */
  recordar?: boolean;
  placeholder?: string;
  hint?: string;
}

/** Sección efectiva de un campo (los terceros se resuelven aparte en la UI). */
export function seccionDe(campo: CampoPlantilla): CampoSeccion {
  return campo.seccion ?? 'servicio';
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
