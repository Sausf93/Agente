import { useLocalSearchParams } from 'expo-router';
import { ArticuloScreen } from '@/features/normas/ArticuloScreen';

/** Ruta del texto de un artículo (`/normas/articulo/<id>`), §4.5 nivel 3. */
export default function ArticuloRoute() {
  const { articuloId } = useLocalSearchParams<{ articuloId: string }>();
  return <ArticuloScreen articuloId={articuloId} />;
}
