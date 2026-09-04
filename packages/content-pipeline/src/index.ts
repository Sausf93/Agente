/**
 * @agente/content-pipeline — ingesta de fuentes oficiales → paquete de contenido.
 *
 * Fase 1 (en curso): cliente del BOE + parser XML consolidado → `Articulo` de shared,
 * con detección de cambios por hash. Pendiente: codificado DGT y empaquetado SQLite.
 */
export * from './catalogo.js';
export { BoeClient, BoeClientError } from './sources/boe/client.js';
export type { BoeClientOptions, FetchImpl } from './sources/boe/client.js';
export { hashTexto } from './parsers/boe-xml/hash.js';
export {
  parseNormaConsolidada,
  parseMetadatos,
  extraerNumeroTitulo,
} from './parsers/boe-xml/parse.js';
export type { NormaParseada, MetadatosNorma, OpcionesParseo } from './parsers/boe-xml/parse.js';
export { diffArticulos } from './parsers/boe-xml/diff.js';
export type { CambioArticulo, ResumenDiff, TipoCambio } from './parsers/boe-xml/diff.js';
