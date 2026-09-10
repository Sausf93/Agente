import { ControlCarreteraScreen } from '@/features/guia/ControlCarreteraScreen';

/**
 * Ruta del CONTROL DE CARRETERA (`/control-carretera`): checklist interactivo de un control, para uso
 * en directo. Se abre desde el acceso rápido de Tráfico. Offline, sin datos de terceros ni persistencia.
 */
export default function ControlCarreteraRoute() {
  return <ControlCarreteraScreen />;
}
