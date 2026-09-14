import { GuiaExtranjeriaScreen } from '@/features/guia/GuiaExtranjeriaScreen';

/**
 * Ruta de la GUÍA RÁPIDA DE EXTRANJERÍA EN LA CALLE (`/guia-extranjeria`). Se abre desde el hub "Más"
 * y desde los accesos rápidos de PN/GC. Contenido de referencia bundlado y offline, sin datos de terceros.
 */
export default function GuiaExtranjeriaRoute() {
  return <GuiaExtranjeriaScreen />;
}
