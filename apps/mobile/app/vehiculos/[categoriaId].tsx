import { Stack, useLocalSearchParams } from 'expo-router';
import { CategoriaScreen } from '@/features/vehiculos/CategoriaScreen';
import { getCategoriaVehiculos } from '@/features/vehiculos/contenido';

/** Ruta del detalle de una categoría de "Vehículos" (`/vehiculos/<categoriaId>`), §4.12. */
export default function CategoriaVehiculosRoute() {
  const { categoriaId } = useLocalSearchParams<{ categoriaId: string }>();
  const categoria = getCategoriaVehiculos(categoriaId);
  return (
    <>
      <Stack.Screen options={{ title: categoria?.titulo ?? 'Vehículos' }} />
      <CategoriaScreen categoriaId={categoriaId} />
    </>
  );
}
