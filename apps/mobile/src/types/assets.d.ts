/**
 * Declaración de módulos para assets binarios que Metro empaqueta (`require`/`import`).
 *
 * Metro convierte estos ficheros en un "asset id" numérico que `expo-asset`
 * (`Asset.fromModule`) resuelve en tiempo de ejecución. El paquete de contenido se
 * distribuye con extensión `.db` porque Metro ya la trata como asset por defecto
 * (`resolver.assetExts` incluye `db`), sin tocar la configuración.
 */
declare module '*.db' {
  const asset: number;
  export default asset;
}
