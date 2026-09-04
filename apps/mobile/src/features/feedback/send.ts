import { Linking, Platform, Share } from 'react-native';
import type { Feedback } from '@agente/shared';
import { composeEmailBody } from './serialize';

/**
 * ENVÍO del feedback a los fundadores DESDE EL DISPOSITIVO (no hay backend).
 *
 * Estrategia (ver ADR-011): se compone el correo con el compositor nativo vía
 * `mailto:` (usando `expo-linking`/`Linking`, ya disponible en Expo Go, sin añadir
 * dependencias). Si el dispositivo no puede abrir un correo (no hay cuenta
 * configurada), se cae a la hoja de compartir nativa (`Share`) para que el socio elija
 * el canal (correo, mensajería...). Ambas rutas son compatibles con Expo Go.
 *
 * Cuando exista Supabase, este módulo podrá además encolar un envío en segundo plano;
 * de momento el "envío" es local y manual, como acordado para la beta.
 */

/**
 * Correo de los fundadores para recibir el feedback de la beta.
 * TODO(fundadores): confirmar la dirección definitiva antes de publicar la beta.
 */
export const FOUNDERS_EMAIL = 'beta@agente.app';

export type SendResult = 'email' | 'share' | 'cancelled';

/**
 * Abre el compositor de correo (o la hoja de compartir) con el feedback pendiente.
 * Devuelve por qué vía se resolvió. La capa superior marca los feedback como
 * enviados solo si esto NO fue cancelado.
 */
export async function sendFeedbackToFounders(pendientes: Feedback[]): Promise<SendResult> {
  const { subject, body } = composeEmailBody(pendientes);

  const mailto = `mailto:${FOUNDERS_EMAIL}?subject=${encodeURIComponent(
    subject,
  )}&body=${encodeURIComponent(body)}`;

  const canOpenMail = await Linking.canOpenURL(mailto).catch(() => false);
  if (canOpenMail) {
    await Linking.openURL(mailto);
    return 'email';
  }

  // Fallback: hoja de compartir nativa. En iOS el asunto va como título/opción;
  // en Android se antepone al cuerpo porque no hay campo de asunto.
  const result =
    Platform.OS === 'ios'
      ? await Share.share({ message: body, title: subject }, { subject })
      : await Share.share({ message: `${subject}\n\n${body}` });
  return result.action === Share.dismissedAction ? 'cancelled' : 'share';
}
