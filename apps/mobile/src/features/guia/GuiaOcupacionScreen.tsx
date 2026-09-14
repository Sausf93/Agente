import { GuiaAccionScreen } from './GuiaAccionScreen';
import { ACTUALIZACION_GUIA_OCUPACION, GUIA_OCUPACION } from './guiaOcupacion';

/**
 * GUÍA RÁPIDA DE OCUPACIÓN DE INMUEBLES (OKUPAS) (arts. 202/203/245 CP; 37.7 LO 4/2015), para uso EN
 * DIRECTO: resuelve la duda de calle nº 1 con una ocupación —¿qué delito es y puedo actuar ya?— desde
 * la distinción clave ¿es MORADA o no? Cada sección abre con la ACCIÓN operativa. Orientativo y
 * "Borrador beta": la flagrancia y el desalojo quedan a verificar; la valoración final es del agente
 * y, en su caso, de la autoridad judicial.
 */
export function GuiaOcupacionScreen() {
  return (
    <GuiaAccionScreen
      bannerTitulo="Guía rápida orientativa (Borrador beta)"
      bannerCuerpo={
        'La distinción clave es si el inmueble es MORADA (alguien vive allí) o no: cambia el delito y ' +
        'la actuación. Orientativo: la calificación y el desalojo los decide la autoridad judicial.'
      }
      secciones={GUIA_OCUPACION}
      guiasRelacionadas={[
        { ruta: '/guia-identificacion', titulo: 'Identificación y cacheo' },
      ]}
      pie={
        'Fuente: arts. 202, 203, 245, 172, 255 y 455 CP, art. 37.7 LO 4/2015, art. 18.2 CE, arts. 553 ' +
        'y 795.1 LECrim e Instrucciones 6/2020 SES y 1/2020 FGE. Actualizado: ' +
        `${ACTUALIZACION_GUIA_OCUPACION}. Orientativo, a verificar.`
      }
    />
  );
}
