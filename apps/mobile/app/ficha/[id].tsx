import { useLocalSearchParams } from 'expo-router';
import { FichaScreen } from '@/features/ficha/FichaScreen';

/**
 * Ruta de la FICHA de infracción (`/ficha/<id>`), abierta desde un resultado de búsqueda.
 * El id de infracción llega como parámetro de ruta; la pantalla lo carga del paquete offline.
 */
export default function FichaRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <FichaScreen infraccionId={id} />;
}
