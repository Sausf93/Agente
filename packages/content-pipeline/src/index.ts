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

// Build del paquete SQLite + FTS5 (Fase 1).
export { DDL, SCHEMA_VERSION } from './paquete/schema.js';
export {
  construirPaquete,
  validarContenido,
} from './paquete/buildPackage.js';
export type {
  ContenidoParaEmpaquetar,
  OpcionesBuild,
  ResultadoBuild,
  ResumenBuild,
} from './paquete/buildPackage.js';
export { construirManifiesto, hashPaquete, firmarPaquete } from './paquete/manifest.js';
export type { ManifiestoPaquete } from './paquete/manifest.js';
export { enriquecerConNorma } from './paquete/combinar.js';

// Seed de infracciones de tráfico "de calle".
export { SEED_TRAFICO, NORMAS_SEED, ARTICULOS_SEED, INFRACCIONES_SEED } from './seed/traficoSeed.js';
export type { SeedContenido, InfraccionSeed } from './seed/traficoSeed.js';

// Seed de delitos penales (motor de detención LECrim).
export {
  SEED_PENAL,
  NORMAS_PENAL_SEED,
  ARTICULOS_PENAL_SEED,
  INFRACCIONES_PENAL_SEED,
} from './seed/penalSeed.js';

// Seed de infracciones de seguridad ciudadana (LO 4/2015).
export {
  SEED_SEGURIDAD_CIUDADANA,
  NORMAS_SEGURIDAD_SEED,
  ARTICULOS_SEGURIDAD_SEED,
  INFRACCIONES_SEGURIDAD_SEED,
} from './seed/seguridadCiudadanaSeed.js';

// Seed de ORDENANZAS MUNICIPALES (piloto Santa Cruz de Tenerife, capa municipal).
export {
  SEED_ORDENANZAS,
  NORMAS_ORDENANZAS_SEED,
  ARTICULOS_ORDENANZAS_SEED,
  INFRACCIONES_ORDENANZAS_SEED,
  MUNICIPIOS_CON_ORDENANZA,
  MUNICIPIO_SCTF_NOMBRE,
  TERRITORIO_SCTF,
} from './seed/ordenanzasSeed.js';

// Tabla de sustancias (§4.7): umbrales orientativos consumo/tráfico.
export { SUSTANCIAS_SEED } from './seed/sustanciasSeed.js';

// Combinación de seeds (dedupe de normas/artículos por id).
export { combinarSeeds } from './paquete/combinar.js';
