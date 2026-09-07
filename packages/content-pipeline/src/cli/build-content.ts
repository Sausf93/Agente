/**
 * CLI: construye el paquete de contenido SQLite + FTS5 firmado (`content:build`).
 *
 * Encadena: seed de infracciones de tráfico + artículos del RGC parseados del BOE →
 * validación (`@agente/shared`) → build SQLite/FTS5 → manifiesto (ContentVersion) con hash y
 * hueco de firma. Genera `output/contenido-<version>.sqlite` + `.manifest.json`.
 *
 * Uso:
 *   corepack pnpm -F @agente/content-pipeline build:content            (RGC en vivo del BOE)
 *   corepack pnpm -F @agente/content-pipeline build:content --offline  (fixture local, sin red)
 *
 * El RGC solo enriquece el paquete con texto consolidado real; si su descarga/parseo falla,
 * el paquete se genera igualmente con el seed (que es autosuficiente).
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { ENTRADAS_A_ENRIQUECER, type EntradaCatalogo } from '../catalogo.js';
import { BoeClient } from '../sources/boe/client.js';
import { parseNormaConsolidada } from '../parsers/boe-xml/parse.js';
import { SEED_TRAFICO } from '../seed/traficoSeed.js';
import { SEED_PENAL } from '../seed/penalSeed.js';
import { combinarSeeds, enriquecerConNorma } from '../paquete/combinar.js';
import { construirPaquete, type ContenidoParaEmpaquetar } from '../paquete/buildPackage.js';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(AQUI, '..', '..');

/** Versión de contenido de esta build (Fase 1, primera carga de tráfico). */
const VERSION = '0.1.0';

/**
 * Descarga (o lee del fixture, en `--offline`) el texto consolidado + metadatos de una norma.
 * En modo offline SOLO el RGC tiene fixture local; el resto se salta (devuelve `null`) para no
 * romper el build sin red. En vivo, cada norma se descarga del BOE por su identificador.
 */
async function cargarNorma(
  entrada: EntradaCatalogo,
  offline: boolean,
  cliente: BoeClient,
): Promise<{ textoXml: string; metaXml: string } | null> {
  if (offline) {
    if (entrada.codigo !== 'RGC') return null;
    const [textoXml, metaXml] = await Promise.all([
      readFile(resolve(RAIZ, 'fixtures', 'rgc-fragmento.xml'), 'utf8'),
      readFile(resolve(RAIZ, 'fixtures', 'rgc-meta.xml'), 'utf8'),
    ]);
    return { textoXml, metaXml };
  }
  const [textoXml, metaXml] = await Promise.all([
    cliente.fetchTextoConsolidado(entrada.idBoe),
    cliente.fetchMetadatos(entrada.idBoe),
  ]);
  return { textoXml, metaXml };
}

async function componerContenido(offline: boolean): Promise<ContenidoParaEmpaquetar> {
  // Seed base: tráfico + penal (comparten la norma CP; `combinarSeeds` la deduplica).
  let contenido = combinarSeeds(SEED_TRAFICO, SEED_PENAL);

  const cliente = new BoeClient();
  // Enriquecemos con el TEXTO CONSOLIDADO REAL de cada norma del catálogo, con fallback POR NORMA:
  // si una falla (descarga o parseo), se avisa y se sigue con las demás (el seed es autosuficiente).
  for (const entrada of ENTRADAS_A_ENRIQUECER) {
    try {
      const fuente = await cargarNorma(entrada, offline, cliente);
      if (!fuente) {
        console.warn(
          `[content:build] ${entrada.codigo}: sin fixture offline; se omite (modo --offline).`,
        );
        continue;
      }
      const parseada = parseNormaConsolidada(fuente.textoXml, fuente.metaXml, entrada);
      console.log(
        `[content:build] ${entrada.codigo} enriquecido desde el BOE: ${parseada.articulos.length} artículos.`,
      );
      contenido = enriquecerConNorma(contenido, parseada);
    } catch (error) {
      console.warn(
        `[content:build] No se pudo enriquecer con ${entrada.codigo} (${
          error instanceof Error ? error.message : error
        }). Se sigue con el resto.`,
      );
    }
  }
  return contenido;
}

async function main(): Promise<void> {
  const offline = process.argv.includes('--offline');
  const rutaSalida = resolve(RAIZ, 'output', `contenido-${VERSION}.sqlite`);

  const contenido = await componerContenido(offline);
  const resultado = construirPaquete(contenido, {
    rutaSalida,
    version: VERSION,
    changelog: {
      resumen:
        'Carga inicial: infracciones de tráfico (seed de calle + RGC) y primeros delitos ' +
        'penales (hurto, robo con violencia, lesiones y quebrantamiento) con orientación de ' +
        'detención según LECrim.',
    },
  });

  const { resumen, manifiesto } = resultado;
  const lineas = [
    '══════════════════════════════════════════════════════════════',
    `  Paquete de contenido v${manifiesto.version} (esquema v${manifiesto.schemaVersion})`,
    '══════════════════════════════════════════════════════════════',
    `  SQLite:        ${resultado.rutaSqlite}`,
    `  Manifiesto:    ${resultado.rutaManifiesto}`,
    `  Hash SHA-256:  ${manifiesto.hash}`,
    `  Firma:         ${manifiesto.firma ?? '(sin firmar — stub, Fase 1)'}`,
    `  Tamaño:        ${(manifiesto.tamanoBytes / 1024).toFixed(1)} KiB`,
    '──────────────────────────────────────────────────────────────',
    `  Normas:        ${resumen.normas}`,
    `  Artículos:     ${resumen.articulos}`,
    `  Infracciones:  ${resumen.infracciones} (${resumen.pendientesRevision} pendientes de revisión)`,
    `  Sinónimos:     ${resumen.sinonimos}`,
    `  Consecuencias: ${resumen.consecuencias}`,
    '══════════════════════════════════════════════════════════════',
  ];
  console.log(lineas.join('\n'));
}

main().catch((error: unknown) => {
  console.error('[content:build] Error:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
