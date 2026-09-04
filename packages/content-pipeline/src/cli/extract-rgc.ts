/**
 * CLI: extrae el RGC (RD 1428/2003) del BOE y vuelca un resumen legible.
 *
 * Es la puerta de revisión ANTES de ampliar a LSV/RGV: descarga el texto consolidado
 * y los metadatos oficiales, los parsea a `Articulo` de `@agente/shared` y muestra
 * nº de artículos, fuente/fecha de consolidación y una muestra de los primeros.
 *
 * Uso:
 *   corepack pnpm -F @agente/content-pipeline exec tsx src/cli/extract-rgc.ts
 *   (o) node --import tsx src/cli/extract-rgc.ts
 *
 * Con `--offline` usa el fixture local en vez de la red (no descarga nada).
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { BoeClient } from '../sources/boe/client.js';
import { CATALOGO_TRAFICO } from '../catalogo.js';
import { parseNormaConsolidada } from '../parsers/boe-xml/parse.js';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(AQUI, '..', '..');

async function cargarFuentes(offline: boolean): Promise<{ textoXml: string; metaXml: string }> {
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

function extracto(texto: string, max = 200): string {
  const limpio = texto.replace(/\s+/g, ' ').trim();
  return limpio.length > max ? `${limpio.slice(0, max)}…` : limpio;
}

async function main(): Promise<void> {
  const offline = process.argv.includes('--offline');
  const rgc = CATALOGO_TRAFICO.RGC!;

  const { textoXml, metaXml } = await cargarFuentes(offline);
  const { norma, articulos } = parseNormaConsolidada(textoXml, metaXml, rgc);

  const lineas: string[] = [];
  lineas.push('══════════════════════════════════════════════════════════════');
  lineas.push(`  Extracción RGC ${offline ? '(fixture offline)' : '(BOE en vivo)'}`);
  lineas.push('══════════════════════════════════════════════════════════════');
  lineas.push(`  Norma:          ${norma.codigo} · ${norma.tipo} · ${norma.ambito}`);
  lineas.push(`  Título:         ${extracto(norma.titulo, 120)}`);
  lineas.push(`  Fuente (BOE):   ${norma.id}`);
  lineas.push(`  URL:            ${norma.urlBoe ?? '(sin URL)'}`);
  lineas.push(`  Consolidación:  ${norma.fechaConsolidacion ?? '(sin fecha)'}`);
  lineas.push(`  Artículos:      ${articulos.length}`);
  lineas.push('──────────────────────────────────────────────────────────────');
  lineas.push('  Primeros 3 artículos:');
  for (const a of articulos.slice(0, 3)) {
    // "5"/"único" → "Art. 5"; "Disposición…" ya es una etiqueta completa.
    const etiqueta = /^\d|^único/i.test(a.numero) ? `Art. ${a.numero}` : a.numero;
    lineas.push('');
    lineas.push(`  • ${etiqueta}${a.titulo ? ` — ${a.titulo}` : ''}`);
    lineas.push(`    vigente desde: ${a.validFrom.slice(0, 10)} · hash: ${a.hash.slice(0, 12)}…`);
    lineas.push(`    ${extracto(a.texto)}`);
  }
  lineas.push('══════════════════════════════════════════════════════════════');

  console.log(lineas.join('\n'));
}

main().catch((error: unknown) => {
  console.error('[extract-rgc] Error:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
