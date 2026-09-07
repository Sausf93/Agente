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
import { CATALOGO_TRAFICO } from '../catalogo.js';
import { BoeClient } from '../sources/boe/client.js';
import { parseNormaConsolidada } from '../parsers/boe-xml/parse.js';
import { SEED_TRAFICO } from '../seed/traficoSeed.js';
import { SEED_PENAL } from '../seed/penalSeed.js';
import { SEED_SEGURIDAD_CIUDADANA } from '../seed/seguridadCiudadanaSeed.js';
import { SUSTANCIAS_SEED } from '../seed/sustanciasSeed.js';
import { combinarSeeds, enriquecerConNorma } from '../paquete/combinar.js';
import { construirPaquete, type ContenidoParaEmpaquetar } from '../paquete/buildPackage.js';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(AQUI, '..', '..');

/** Versión de contenido de esta build (Fase 1, primera carga de tráfico). */
const VERSION = '0.1.0';

async function cargarRgc(offline: boolean): Promise<{ textoXml: string; metaXml: string }> {
  const rgc = CATALOGO_TRAFICO.RGC;
  if (!rgc) throw new Error('Falta la entrada RGC en el catálogo');
  if (offline) {
    const [textoXml, metaXml] = await Promise.all([
      readFile(resolve(RAIZ, 'fixtures', 'rgc-fragmento.xml'), 'utf8'),
      readFile(resolve(RAIZ, 'fixtures', 'rgc-meta.xml'), 'utf8'),
    ]);
    return { textoXml, metaXml };
  }
  const cliente = new BoeClient();
  const [textoXml, metaXml] = await Promise.all([
    cliente.fetchTextoConsolidado(rgc.idBoe),
    cliente.fetchMetadatos(rgc.idBoe),
  ]);
  return { textoXml, metaXml };
}

async function componerContenido(offline: boolean): Promise<ContenidoParaEmpaquetar> {
  const rgc = CATALOGO_TRAFICO.RGC!;
  // Seed base: tráfico + penal + seguridad ciudadana (LO 4/2015) + la tabla de sustancias (§4.7).
  // `combinarSeeds` deduplica las normas/artículos compartidos por `id` (tráfico y penal comparten
  // el CP); las sustancias viajan como un "seed" más que solo aporta `sustancias`.
  const seedSustancias = { normas: [], articulos: [], infracciones: [], sustancias: SUSTANCIAS_SEED };
  const seed = combinarSeeds(SEED_TRAFICO, SEED_PENAL, SEED_SEGURIDAD_CIUDADANA, seedSustancias);
  try {
    const { textoXml, metaXml } = await cargarRgc(offline);
    const parseada = parseNormaConsolidada(textoXml, metaXml, rgc);
    console.log(
      `[content:build] RGC enriquecido desde el BOE: ${parseada.articulos.length} artículos.`,
    );
    return enriquecerConNorma(seed, parseada);
  } catch (error) {
    console.warn(
      `[content:build] No se pudo enriquecer con el RGC (${
        error instanceof Error ? error.message : error
      }). Se construye solo con el seed.`,
    );
    return seed;
  }
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
        'Carga inicial: infracciones de tráfico (seed de calle + RGC), primeros delitos penales ' +
        '(hurto, robo con violencia, lesiones y quebrantamiento) con orientación de detención ' +
        'según LECrim, infracciones de seguridad ciudadana (LO 4/2015) y la tabla de sustancias ' +
        '(§4.7): umbrales orientativos consumo/tráfico (INTCF + Acuerdo Sala 2ª TS 19/10/2001), ' +
        'todo pendiente de revisión.',
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
    `  Sustancias:    ${resumen.sustancias} (tabla §4.7, pendientes de revisión)`,
    '══════════════════════════════════════════════════════════════',
  ];
  console.log(lineas.join('\n'));
}

main().catch((error: unknown) => {
  console.error('[content:build] Error:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
