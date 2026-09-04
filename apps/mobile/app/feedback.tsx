import { useLocalSearchParams } from 'expo-router';
import { TipoFeedback } from '@agente/shared';
import { FeedbackScreen } from '@/features/feedback/FeedbackScreen';

/**
 * Ruta de "Sugerencias / reportar problema" (fuera de las pestañas, se abre desde
 * "Más" y, en el futuro, desde el botón "reportar error" de una ficha).
 *
 * Parámetros opcionales (gancho reportar error): `tipo`, `articuloId`, `infraccionId`,
 * `pantalla`. Prerrellenan el formulario cuando se llega desde una ficha.
 */
export default function FeedbackRoute() {
  const params = useLocalSearchParams<{
    tipo?: string;
    articuloId?: string;
    infraccionId?: string;
    pantalla?: string;
  }>();

  const tipoParsed = TipoFeedback.safeParse(params.tipo);

  return (
    <FeedbackScreen
      tipoInicial={tipoParsed.success ? tipoParsed.data : undefined}
      contextoInicial={{
        pantalla: params.pantalla ?? null,
        articuloId: params.articuloId ?? null,
        infraccionId: params.infraccionId ?? null,
      }}
    />
  );
}
