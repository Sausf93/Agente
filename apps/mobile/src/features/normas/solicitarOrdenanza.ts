/**
 * "Solicitar mi ordenanza" (§4.5, capa municipal): cuando el municipio del Local aún NO tiene
 * ordenanza cargada, se registra una petición HONESTA a los creadores para priorizar ese
 * municipio. Reutiliza el mecanismo de feedback (ADR-011): se guarda en el dispositivo y el envío
 * abre el compositor de correo. Se manda SOLO municipio + CCAA (segmento no identificativo); NUNCA
 * datos de terceros (regla innegociable de CLAUDE.md).
 *
 * Este módulo es PURO (compone el texto y el contexto): así se testea sin el runtime de RN.
 */

export interface SolicitudOrdenanza {
  /** Texto de la sugerencia que se registra y se envía (petición del municipio). */
  texto: string;
  /** Territorio de segmento (no identificativo) que acompaña al feedback: "Municipio (CCAA)". */
  territorio: string;
}

/**
 * Compone la solicitud de ordenanza para un municipio. `ccaaNombre` es opcional (puede no estar
 * resuelto todavía). El texto es explícito para que los creadores sepan qué municipio priorizar.
 */
export function construirSolicitudOrdenanza(
  municipioNombre: string,
  ccaaNombre: string | null,
): SolicitudOrdenanza {
  const municipio = municipioNombre.trim();
  const ccaa = ccaaNombre?.trim() ? ccaaNombre.trim() : null;
  const ubicacion = ccaa ? `${municipio} (${ccaa})` : municipio;
  return {
    texto:
      `Solicito la ordenanza municipal de ${ubicacion}. ` +
      `Aún no está cargada en la app y me gustaría consultarla desde Normas/Buscar.`,
    territorio: ubicacion,
  };
}
