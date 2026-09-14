import { GuiaViolenciaGeneroScreen } from '@/features/guia/GuiaViolenciaGeneroScreen';

/**
 * Ruta de la GUÍA RÁPIDA DE VIOLENCIA DE GÉNERO Y DOMÉSTICA (`/guia-violencia-genero`). Se abre desde
 * el hub "Más" y desde los accesos rápidos. Contenido de referencia bundlado y offline, sin datos de
 * terceros.
 */
export default function GuiaViolenciaGeneroRoute() {
  return <GuiaViolenciaGeneroScreen />;
}
