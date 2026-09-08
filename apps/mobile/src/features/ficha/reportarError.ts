import type { TipoFeedback } from '@agente/shared';

/**
 * Gancho "reportar error de contenido" DESDE la ficha (§4.15, ADR-011). Construye —de forma pura y
 * testeable— la ruta de alta de feedback (`app/feedback.tsx`) con los parámetros que PRERRELLENAN
 * el formulario: el tipo `error_contenido` ya seleccionado y el contexto de qué infracción y desde
 * qué pantalla llega el aviso. Solo viaja el id de contenido OFICIAL (nunca datos de terceros): el
 * socio escribe el texto libre y la pantalla de feedback avisa de la privacidad.
 *
 * Los nombres de los parámetros (`tipo`, `infraccionId`, `pantalla`) coinciden EXACTAMENTE con los
 * que lee `app/feedback.tsx` vía `useLocalSearchParams`.
 */
export interface ReportarErrorLink {
  pathname: '/feedback';
  params: {
    tipo: TipoFeedback;
    infraccionId: string;
    /** Identificador de la pantalla de origen, p. ej. "ficha:seed-alcoholemia". */
    pantalla: string;
  };
}

export function reportarErrorFichaLink(infraccionId: string): ReportarErrorLink {
  return {
    pathname: '/feedback',
    params: {
      tipo: 'error_contenido',
      infraccionId,
      pantalla: `ficha:${infraccionId}`,
    },
  };
}
