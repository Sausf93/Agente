import { useLocalSearchParams } from 'expo-router';
import { MateriaDetalleScreen } from '@/features/normas/MateriaDetalleScreen';
import { MATERIA_INFO, type Materia } from '@/features/normas/normas';

/** Ruta del detalle de una materia (`/normas/materia/<materia>`), §4.5 nivel 1b. */
export default function MateriaDetalleRoute() {
  const { materia, filtro } = useLocalSearchParams<{ materia: string; filtro?: string }>();
  // Valida el segmento contra la taxonomía: lo desconocido cae en 'otras' (nunca rompe la ruta).
  const materiaValida: Materia = materia in MATERIA_INFO ? (materia as Materia) : 'otras';
  return <MateriaDetalleScreen materia={materiaValida} filtro={filtro === 'todas' ? 'todas' : 'mio'} />;
}
