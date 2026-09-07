import { useLocalSearchParams } from 'expo-router';
import { RellenarScreen } from '@/features/documentos/RellenarScreen';

/**
 * Ruta del formulario de un documento (`/documento/<plantillaId>`), abierta desde la pestaña
 * Documentos o desde la ficha ("Generar documento"). Los parámetros de consulta que coincidan
 * con un campo del agente (norma, articulo, importe, gravedad, hecho, puntos para el boletín;
 * motivo y amparo para la diligencia penal) prerrellenan el formulario; los datos de terceros
 * nunca llegan por aquí.
 */

/** Claves de prefill admitidas desde la ficha (solo campos del agente, nunca de terceros). */
const CLAVES_PREFILL = [
  'norma',
  'articulo',
  'importe',
  'gravedad',
  'hecho',
  'puntos',
  'motivo',
  'amparo',
] as const;

export default function DocumentoRoute() {
  const params = useLocalSearchParams<Record<string, string | string[]>>();
  const plantillaId = typeof params.plantillaId === 'string' ? params.plantillaId : '';

  const prefill: Record<string, string> = {};
  for (const clave of CLAVES_PREFILL) {
    const v = params[clave];
    if (typeof v === 'string' && v.length > 0) prefill[clave] = v;
  }

  return <RellenarScreen plantillaId={plantillaId} prefill={prefill} />;
}
