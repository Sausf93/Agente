import { GuiaAlcoholemiaScreen } from '@/features/guia/GuiaAlcoholemiaScreen';

/**
 * Ruta de la GUÍA RÁPIDA DE ALCOHOLEMIA (`/guia-alcoholemia`). Se abre desde el acceso rápido de
 * Tráfico. Contenido de referencia bundlado y offline, sin datos de terceros.
 */
export default function GuiaAlcoholemiaRoute() {
  return <GuiaAlcoholemiaScreen />;
}
