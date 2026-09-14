import { GuiaAccionScreen } from './GuiaAccionScreen';
import { ACTUALIZACION_GUIA_EXTRANJERIA, GUIA_EXTRANJERIA } from './guiaExtranjeria';

/**
 * GUÍA RÁPIDA DE EXTRANJERÍA EN LA CALLE (LO 4/2000), para uso EN DIRECTO: la duda nº 1 de PN/GC con
 * un extranjero —"es irregular, ¿lo detengo?"—, dejando claro que la estancia irregular es vía
 * ADMINISTRATIVA (no penal), el margen de retención/detención cautelar, cuándo SÍ es delito y el
 * enlace con el menor extranjero (MENA). Cada sección abre con la ACCIÓN operativa. Orientativo y
 * "Borrador beta": la valoración final es del agente y, en su caso, de la autoridad administrativa o
 * judicial.
 */
export function GuiaExtranjeriaScreen() {
  return (
    <GuiaAccionScreen
      bannerTitulo="Guía rápida orientativa (Borrador beta)"
      bannerCuerpo={
        'La estancia irregular es infracción ADMINISTRATIVA, no delito: no hay detención penal por ese ' +
        'motivo. La valoración final corresponde al agente y, en su caso, a la autoridad administrativa ' +
        'o judicial.'
      }
      secciones={GUIA_EXTRANJERIA}
      guiasRelacionadas={[
        { ruta: '/guia-menores', titulo: 'Menores (MENA e inimputabilidad)' },
        { ruta: '/guia-identificacion', titulo: 'Identificación y cacheo' },
      ]}
      pie={
        'Fuente: LO 4/2000 (arts. 4, 53.1.a, 55, 57, 58, 61, 62, 64 y 35), Ley 12/2009 de asilo, ' +
        'art. 16 LO 4/2015, arts. 318 bis y 177 bis CP y LO 1/1996. Actualizado: ' +
        `${ACTUALIZACION_GUIA_EXTRANJERIA}. Orientativo, a verificar.`
      }
    />
  );
}
