import { GuiaAccionScreen } from './GuiaAccionScreen';
import { ACTUALIZACION_GUIA_MENORES, GUIA_MENORES } from './guiaMenores';

/**
 * GUÍA RÁPIDA DE MENORES (LO 5/2000 y LO 1/1996), para uso EN DIRECTO: la duda de calle "es menor,
 * ¿qué hago?" separando el inimputable (< 14) del régimen penal del menor (14-17) y sus garantías, la
 * vía administrativa (alcohol/tabaco/drogas), la entrega, la duda sobre la edad, el MENA y el menor
 * fugado. Cada sección abre con la ACCIÓN operativa. Orientativo y "Borrador beta": la valoración
 * final es del agente, del Ministerio Fiscal de Menores y, en su caso, de la autoridad judicial.
 */
export function GuiaMenoresScreen() {
  return (
    <GuiaAccionScreen
      bannerTitulo="Guía rápida orientativa (Borrador beta)"
      bannerCuerpo={
        'Menor de 14 años inimputable; de 14 a 17 responde por la LO 5/2000 con garantías del art. 17. ' +
        'La valoración final corresponde al agente, al Ministerio Fiscal de Menores y, en su caso, a la ' +
        'autoridad judicial.'
      }
      secciones={GUIA_MENORES}
      guiasRelacionadas={[
        { ruta: '/guia-extranjeria', titulo: 'Extranjería en la calle (MENA)' },
        { ruta: '/guia-identificacion', titulo: 'Identificación y cacheo' },
      ]}
      pie={
        'Fuente: LO 5/2000 (arts. 1.1, 3 y 17), LO 1/1996 de protección jurídica del menor y art. 35 ' +
        `LO 4/2000. Actualizado: ${ACTUALIZACION_GUIA_MENORES}. Orientativo, a verificar.`
      }
    />
  );
}
