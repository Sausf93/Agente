import { DerechosScreen } from '@/features/derechos/DerechosScreen';

/**
 * Ruta de la LECTURA DE DERECHOS del detenido (`/derechos`, §4.11). Se abre desde el flujo de
 * detención de una ficha (cuando la orientación es que procede o puede proceder) y desde el hub
 * "Más". Contenido bundlado y offline, sin datos de terceros.
 */
export default function DerechosRoute() {
  return <DerechosScreen />;
}
