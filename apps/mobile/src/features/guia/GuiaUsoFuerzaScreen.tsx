import { GuiaAccionScreen } from './GuiaAccionScreen';
import { ACTUALIZACION_GUIA_USO_FUERZA, GUIA_USO_FUERZA } from './guiaUsoFuerza';

/**
 * GUÍA RÁPIDA ORIENTATIVA DE USO DE LA FUERZA (art. 5 LO 2/1986: congruencia, oportunidad y
 * proporcionalidad; art. 5.2.d para el arma de fuego; arts. 20.7/20.4 CP para la cobertura). Para uso
 * EN DIRECTO: recuerda el filtro de los tres principios, la escala orientativa, el listón del arma y qué
 * hacer después. ZONA SENSIBLE: todo es ORIENTATIVO, nunca ordena emplear la fuerza; la decisión y su
 * calificación son del agente y, en su caso, de la autoridad judicial. "Borrador beta": pendiente de
 * validar con el cofundador agente y revisor jurídico.
 */
export function GuiaUsoFuerzaScreen() {
  return (
    <GuiaAccionScreen
      bannerTitulo="Guía orientativa (Borrador beta) — zona sensible"
      bannerCuerpo={
        'Recordatorio de los principios y límites legales del uso de la fuerza (art. 5 LO 2/1986). NO ' +
        'ordena ni autoriza emplear la fuerza: la decisión, su intensidad y su cese son del agente en ' +
        'cada caso y quedan bajo control judicial.'
      }
      secciones={GUIA_USO_FUERZA}
      guiasRelacionadas={[
        { ruta: '/guia-identificacion', titulo: 'Identificación y cacheo' },
        { ruta: '/derechos', titulo: 'Leer derechos al detenido' },
      ]}
      pie={
        'Fuente: art. 5 LO 2/1986 (principios básicos de actuación), art. 104 CE, arts. 20.4, 20.7 y ' +
        '21.1 CP, arts. 15 CE y 174-175 CP. Actualizado: ' +
        `${ACTUALIZACION_GUIA_USO_FUERZA}. Orientativo, a verificar; pendiente de validación.`
      }
    />
  );
}
