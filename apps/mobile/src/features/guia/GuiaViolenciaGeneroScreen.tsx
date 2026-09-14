import { GuiaAccionScreen } from './GuiaAccionScreen';
import {
  ACTUALIZACION_GUIA_VIOLENCIA_GENERO,
  GUIA_VIOLENCIA_GENERO,
} from './guiaViolenciaGenero';

/**
 * GUÍA RÁPIDA DE VIOLENCIA DE GÉNERO Y DOMÉSTICA (arts. 153/173.2/147-148 CP; 544 bis/ter LECrim;
 * VPR/VioGén), para uso EN DIRECTO: la intervención más delicada de los tres cuerpos, con la
 * PROTECCIÓN de la víctima primero. Cada sección abre con la ACCIÓN operativa. CONTENIDO MUY SENSIBLE:
 * todo orientativo; la detención y las medidas las acuerda/ratifica la autoridad judicial y la
 * valoración final es del agente y, en su caso, del juez.
 */
export function GuiaViolenciaGeneroScreen() {
  return (
    <GuiaAccionScreen
      bannerTitulo="Guía rápida orientativa (Borrador beta)"
      bannerCuerpo={
        'Prioridad: proteger a la víctima y valorar el riesgo (VPR/VioGén). Todo es orientativo: la ' +
        'detención y las medidas cautelares las acuerda o ratifica la autoridad judicial y la ' +
        'valoración final corresponde al agente y, en su caso, al juez.'
      }
      secciones={GUIA_VIOLENCIA_GENERO}
      guiasRelacionadas={[
        { ruta: '/guia-identificacion', titulo: 'Identificación y cacheo' },
        { ruta: '/guia-menores', titulo: 'Menores (si hay menores implicados)' },
      ]}
      pie={
        'Fuente: arts. 153, 173.2 y 147/148 CP, arts. 468 CP, 544 bis y 544 ter y 490 LECrim, ' +
        'Ley 4/2015 (Estatuto de la víctima) y sistema VioGén (VPR). Actualizado: ' +
        `${ACTUALIZACION_GUIA_VIOLENCIA_GENERO}. Orientativo, a verificar.`
      }
    />
  );
}
