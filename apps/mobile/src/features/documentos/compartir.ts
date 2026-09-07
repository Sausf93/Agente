import { Linking } from 'react-native';
import * as Print from 'expo-print';
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
 * Muestra el PDF recién generado AL INSTANTE, para que el primer toque en "Generar PDF" produzca
 * algo visible (antes solo aparecían botones y el agente creía que "no hacía nada").
 *
 * Vía preferida: la hoja de compartir con el PDF, desde donde el agente lo ve, lo guarda en
 * Archivos o lo envía por Mail/WhatsApp. Si el dispositivo no permite compartir (p. ej. web),
 * cae a la vista de impresión nativa de `expo-print`, que también enseña el PDF y permite
 * imprimir/guardar. Todo ocurre en el dispositivo; el PDF solo sale si el agente lo comparte.
 */
export async function mostrarPdf(uri: string, html: string): Promise<void> {
  const resultado = await compartirPdf(uri);
  if (resultado === 'no-disponible') {
    await Print.printAsync({ html });
  }
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
