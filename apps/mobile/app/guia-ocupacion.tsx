import { GuiaOcupacionScreen } from '@/features/guia/GuiaOcupacionScreen';

/**
 * Ruta de la GUÍA RÁPIDA DE OCUPACIÓN DE INMUEBLES (`/guia-ocupacion`). Se abre desde el hub "Más" y
 * desde los accesos rápidos. Contenido de referencia bundlado y offline, sin datos de terceros.
 */
export default function GuiaOcupacionRoute() {
  return <GuiaOcupacionScreen />;
}
