import { useLocalSearchParams } from 'expo-router';
import { SubTemaFichasScreen } from '@/features/normas/SubTemaFichasScreen';
import { MATERIA_INFO, type Materia } from '@/features/normas/normas';

/** Ruta de las fichas de un sub-tema (`/normas/subtema/<materia>/<subtema>`), §4.5 nivel 3. */
export default function SubTemaFichasRoute() {
  const { materia, subtema } = useLocalSearchParams<{ materia: string; subtema: string }>();
  // Valida el segmento contra la taxonomía: lo desconocido cae en 'otras' (nunca rompe la ruta).
  const materiaValida: Materia = materia in MATERIA_INFO ? (materia as Materia) : 'otras';
  return <SubTemaFichasScreen materia={materiaValida} subtema={subtema ?? ''} />;
}
