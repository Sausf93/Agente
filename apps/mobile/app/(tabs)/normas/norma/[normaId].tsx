import { useLocalSearchParams } from 'expo-router';
import { NormaDetalleScreen } from '@/features/normas/NormaDetalleScreen';

/** Ruta del articulado de una norma (`/normas/norma/<id>`), §4.5 nivel 2. */
export default function NormaDetalleRoute() {
  const { normaId } = useLocalSearchParams<{ normaId: string }>();
  return <NormaDetalleScreen normaId={normaId} />;
}
