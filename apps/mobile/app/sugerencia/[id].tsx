import { useLocalSearchParams } from 'expo-router';
import { SugerenciaDetalleScreen } from '@/features/feedback/SugerenciaDetalleScreen';

/**
 * Detalle de una aportación de "Mis sugerencias" (§4.15). El id llega como parámetro de ruta;
 * la pantalla lo busca en el registro local del dispositivo.
 */
export default function SugerenciaDetalleRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <SugerenciaDetalleScreen id={id} />;
}
