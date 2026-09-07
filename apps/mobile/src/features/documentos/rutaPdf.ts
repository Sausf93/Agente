/**
 * Lógica PURA de la ruta del PDF generado (§4.8), aislada de `generarPdf.ts` para poder testear
 * la semántica del arreglo sin cargar los módulos nativos (`expo-print`, `expo-file-system`).
 */

/**
 * Decide qué URI devolver tras intentar renombrar el PDF a un nombre legible.
 *
 * La API de `expo-file-system` (SDK 57) mueve el fichero a `destino` con `moveSync`, pero el `uri`
 * de la instancia ORIGEN no es fiable como ruta final: el bug de "no hace nada" venía de devolver
 * `origen.uri`, que apuntaba a la ruta temporal ya inexistente tras el move → al compartir, el
 * fichero no estaba ahí y fallaba en silencio. Por eso devolvemos SIEMPRE la ruta de `destino`
 * cuando el fichero existe allí, y solo si algo salió mal caemos a la URI temporal de `expo-print`,
 * que ya funciona.
 */
export function elegirUriPdf(destinoExiste: boolean, destinoUri: string, uriTemporal: string): string {
  return destinoExiste ? destinoUri : uriTemporal;
}
