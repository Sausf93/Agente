import { SustanciasListScreen } from '@/features/sustancias/SustanciasListScreen';

/**
 * Ruta de la lista de SUSTANCIAS (`/sustancias`, §4.7), fuera de las pestañas. Se abre desde "Más".
 * Lista buscable de la tabla de sustancias del paquete de contenido (offline).
 */
export default function SustanciasRoute() {
  return <SustanciasListScreen />;
}
