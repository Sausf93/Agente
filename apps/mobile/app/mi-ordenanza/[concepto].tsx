import { useLocalSearchParams } from 'expo-router';
import { MiOrdenanzaScreen } from '@/features/miOrdenanza/MiOrdenanzaScreen';

/**
 * Ruta de "MI ORDENANZA" (`/mi-ordenanza/<concepto>`): el agente fija el importe y el artículo de
 * SU ordenanza para un concepto de aparcamiento (zona azul, carga y descarga, vado, PMR). Se abre
 * desde el estado vacío del buscador cuando su municipio no está cargado en el paquete.
 */
export default function MiOrdenanzaRoute() {
  const { concepto } = useLocalSearchParams<{ concepto: string }>();
  return <MiOrdenanzaScreen conceptoId={concepto} />;
}
