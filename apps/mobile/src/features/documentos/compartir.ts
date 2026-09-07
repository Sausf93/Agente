import { Linking } from 'react-native';
import * as Sharing from 'expo-sharing';

/**
 * COMPARTIR / ENVIAR el documento DESDE EL DISPOSITIVO (§4.8). No hay servidor de por medio: el
 * PDF viaja solo si el agente lo comparte, y siempre a través de las apps de su propio teléfono
 * (Mail, WhatsApp, Archivos/Guardar, AirDrop…). El PDF NUNCA se sube a un backend nuestro.
 */

export type CompartirResultado = 'compartido' | 'no-disponible';

/**
 * Abre la hoja de compartir nativa con el PDF adjunto. Es la vía recomendada para "enviar a mi
 * correo" (Mail aparece en la hoja con el PDF ya adjunto) y para guardarlo en Archivos.
 */
export async function compartirPdf(uri: string): Promise<CompartirResultado> {
  if (!(await Sharing.isAvailableAsync())) return 'no-disponible';
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
    dialogTitle: 'Compartir o enviar documento',
  });
  return 'compartido';
}

/**
 * Abre el compositor de correo (mailto) con el asunto y una copia en TEXTO del documento.
 *
 * Nota: `mailto` no permite adjuntar ficheros; para enviar el PDF adjunto se usa
 * `compartirPdf` (hoja de compartir → Mail). Este atajo sirve para mandarse a uno mismo el
 * texto del documento sin depender de la hoja de compartir. Todo ocurre en el dispositivo.
 */
export async function enviarPorCorreo(asunto: string, cuerpoTexto: string): Promise<boolean> {
  const url = `mailto:?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpoTexto)}`;
  const puede = await Linking.canOpenURL(url).catch(() => false);
  if (!puede) return false;
  await Linking.openURL(url);
  return true;
}
