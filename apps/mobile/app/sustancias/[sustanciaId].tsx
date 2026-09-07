import { useLocalSearchParams } from 'expo-router';
import { SustanciaDetalleScreen } from '@/features/sustancias/SustanciaDetalleScreen';

/** Ruta de la ficha de una sustancia (`/sustancias/<sustanciaId>`), §4.7. */
export default function SustanciaDetalleRoute() {
  const { sustanciaId } = useLocalSearchParams<{ sustanciaId: string }>();
  return <SustanciaDetalleScreen sustanciaId={sustanciaId} />;
}
