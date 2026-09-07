import * as Print from 'expo-print';
import { File, Paths } from 'expo-file-system';
import { nombreArchivoSeguro } from './html';

/**
 * Generación del PDF EN EL DISPOSITIVO (§4.8) con `expo-print` (HTML → PDF, disponible en
 * Expo Go). El PDF se escribe en el almacenamiento local del teléfono y NUNCA se sube a un
 * servidor: solo el propio agente decide compartirlo o enviarlo desde su dispositivo.
 *
 * Módulo con efectos (toca `expo-print`/sistema de ficheros): NO se cubre con Vitest. La lógica
 * pura (relleno de plantilla, HTML y nombre de archivo) sí está testeada.
 */

/**
 * Genera el PDF a partir del HTML y devuelve su URI local. Intenta renombrarlo a un nombre
 * legible (para que la hoja de compartir muestre "boletin-de-denuncia.pdf" y no un id aleatorio);
 * si el renombrado falla, devuelve la URI temporal original de `expo-print`.
 */
export async function generarPdf(html: string, nombreBase: string): Promise<string> {
  const { uri } = await Print.printToFileAsync({ html });
  try {
    const origen = new File(uri);
    const destino = new File(Paths.cache, `${nombreArchivoSeguro(nombreBase)}.pdf`);
    if (destino.exists) destino.delete();
    origen.moveSync(destino);
    return origen.uri;
  } catch {
    return uri;
  }
}
