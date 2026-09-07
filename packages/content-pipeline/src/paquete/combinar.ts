import type { Articulo, Norma } from '@agente/shared';
import type { SeedContenido } from '../seed/traficoSeed.js';
import type { NormaParseada } from '../parsers/boe-xml/parse.js';

/**
 * Enriquece el seed con los artículos REALES parseados del BOE (RGC ya funciona), sin
 * duplicar. El seed aporta las infracciones y los artículos que citan (resúmenes propios,
 * provisionales); el parser del BOE aporta el texto consolidado literal. Al combinar:
 *
 *  - La `Norma` parseada (con su título, URL y fecha de consolidación oficiales) SUSTITUYE a
 *    la del seed que tenga el mismo `id`.
 *  - Se añaden los artículos parseados cuyo `(normaId, numero)` no exista ya en el seed, para
 *    no chocar con los artículos que citan las infracciones. Los del seed se conservan.
 *
 * Es una función PURA (no toca red ni disco): la descarga del BOE la hace el CLI aparte.
 */
/**
 * Combina varios seeds en uno solo, deduplicando por `id` (primero gana) las normas y los
 * artículos, y concatenando las infracciones. Sirve para unir el seed de tráfico y el penal, que
 * comparten la norma "CP" (Código Penal): sin dedupe, insertar dos filas con la misma clave
 * primaria rompería el build del SQLite. Función PURA.
 */
export function combinarSeeds(...seeds: SeedContenido[]): SeedContenido {
  const normas: Norma[] = [];
  const articulos: Articulo[] = [];
  const infracciones: SeedContenido['infracciones'] = [];
  const normaVista = new Set<string>();
  const articuloVisto = new Set<string>();

  for (const seed of seeds) {
    for (const n of seed.normas) {
      if (normaVista.has(n.id)) continue;
      normaVista.add(n.id);
      normas.push(n);
    }
    for (const a of seed.articulos) {
      if (articuloVisto.has(a.id)) continue;
      articuloVisto.add(a.id);
      articulos.push(a);
    }
    infracciones.push(...seed.infracciones);
  }

  return { normas, articulos, infracciones };
}

export function enriquecerConNorma(seed: SeedContenido, parseada: NormaParseada): SeedContenido {
  const normas: Norma[] = [
    ...seed.normas.filter((n) => n.id !== parseada.norma.id),
    parseada.norma,
  ];

  const clave = (a: Pick<Articulo, 'normaId' | 'numero'>): string => `${a.normaId}::${a.numero}`;
  const yaPresentes = new Set(seed.articulos.map(clave));
  const nuevos = parseada.articulos.filter((a) => !yaPresentes.has(clave(a)));

  return {
    normas,
    articulos: [...seed.articulos, ...nuevos],
    infracciones: seed.infracciones,
  };
}
