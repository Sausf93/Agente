import {
  FTS_PESOS_BM25_ORDENADOS,
  normalizarBusqueda,
  type Gravedad,
} from '@agente/shared';
import type { SqlRunner } from '@/db/sqlRunner';

/**
 * NÚCLEO del buscador offline (§4.3), agnóstico del motor SQLite.
 *
 * Implementa el modelo de ranking del contrato (`CONTENT-PACKAGE.md`):
 *   1. Sinónimo EXACTO (lookup directo en `sinonimo.termino_normalizado`) → SIEMPRE arriba.
 *   2. FTS5 `bm25()` ponderado con `FTS_PESOS_BM25_ORDENADOS` (título 10 · sinónimos 6 ·
 *      artículo 4 · texto 1); en SQLite un bm25 más negativo es mejor → `ORDER BY score` asc.
 *   3. Popularidad: desempate final que aportaría la app desde su tabla local de uso; no viaja
 *      en el paquete y se deja como extensión (aún no se aplica en Fase 1).
 *
 * La consulta del agente se normaliza con `normalizarBusqueda` (misma función que usó el
 * pipeline al indexar), de modo que MATCH y lookup exacto pliegan tildes/ñ/mayúsculas igual.
 */

/** Una fila de resultado, lista para pintar en la lista (`ListRow`). */
export interface ResultadoBusqueda {
  infraccionId: string;
  tituloCorto: string;
  gravedad: Gravedad;
  importeEur: number | null;
  /** Código de norma + nº de artículo, p. ej. "RGC 18". */
  normaCodigo: string;
  articuloNumero: string;
  /** `true` si entró por coincidencia EXACTA de sinónimo (se muestra primero). */
  porSinonimoExacto: boolean;
}

/** Fila cruda de la hidratación (nombres de columna del paquete). */
interface FilaInfraccion {
  infraccion_id: string;
  titulo_corto: string;
  gravedad: Gravedad;
  importe_eur: number | null;
  norma_codigo: string;
  articulo_numero: string;
}

/**
 * Construye la expresión MATCH de FTS5 a partir de la consulta ya normalizada.
 *
 * Se trocea en tokens alfanuméricos (el tokenizador `unicode61` parte por puntuación) y cada
 * token se convierte en PREFIJO (`token*`) para búsqueda a medida que se teclea ("movi" →
 * encuentra "movil"). Los tokens van en AND implícito (todos deben aparecer). Devuelve `''`
 * si no queda ningún token válido (evita un MATCH inválido).
 */
export function construirConsultaFts(consultaNormalizada: string): string {
  const tokens = consultaNormalizada
    .split(/[^a-z0-9]+/)
    .filter((tok) => tok.length > 0);
  if (tokens.length === 0) return '';
  return tokens.map((tok) => `${tok}*`).join(' ');
}

/**
 * Combina los ids de sinónimo exacto (primero) con los del FTS (por relevancia), sin duplicar y
 * conservando el orden. Lógica pura y determinista → cubierta por tests unitarios.
 */
export function combinarRanking(idsExactos: string[], idsFts: string[]): string[] {
  const orden: string[] = [];
  const vistos = new Set<string>();
  for (const id of [...idsExactos, ...idsFts]) {
    if (!vistos.has(id)) {
      vistos.add(id);
      orden.push(id);
    }
  }
  return orden;
}

/** Nº máximo de resultados que devuelve una búsqueda (suficiente para la lista de calle). */
export const LIMITE_RESULTADOS = 25;

/**
 * Ejecuta la búsqueda completa contra el paquete y devuelve los resultados ya ordenados.
 * Consulta vacía → lista vacía. No lanza si el MATCH falla: cae a los resultados exactos.
 */
export async function buscarInfracciones(
  runner: SqlRunner,
  consulta: string,
): Promise<ResultadoBusqueda[]> {
  const consultaNorm = normalizarBusqueda(consulta);
  if (consultaNorm.length === 0) return [];

  // Paso 1: sinónimos EXACTOS (van siempre arriba).
  const exactos = await runner.getAll<{ infraccion_id: string }>(
    `SELECT DISTINCT infraccion_id
       FROM sinonimo
      WHERE termino_normalizado = ? AND infraccion_id IS NOT NULL`,
    [consultaNorm],
  );
  const idsExactos = exactos.map((r) => r.infraccion_id);

  // Paso 2: FTS5 ponderado (bm25 con los pesos del contrato).
  const pesos = FTS_PESOS_BM25_ORDENADOS.join(', ');
  const match = construirConsultaFts(consultaNorm);
  let idsFts: string[] = [];
  if (match.length > 0) {
    try {
      const filas = await runner.getAll<{ infraccion_id: string; score: number }>(
        `SELECT b.infraccion_id AS infraccion_id, bm25(busqueda, ${pesos}) AS score
           FROM busqueda b
          WHERE busqueda MATCH ?
          ORDER BY score
          LIMIT ?`,
        [match, LIMITE_RESULTADOS],
      );
      idsFts = filas.map((f) => f.infraccion_id);
    } catch {
      // MATCH inválido (entrada rara): nos quedamos con los exactos, sin romper la búsqueda.
      idsFts = [];
    }
  }

  const orden = combinarRanking(idsExactos, idsFts).slice(0, LIMITE_RESULTADOS);
  if (orden.length === 0) return [];

  // Hidratación: una sola consulta con IN (...); luego se reordena en JS según el ranking.
  const placeholders = orden.map(() => '?').join(', ');
  const filas = await runner.getAll<FilaInfraccion>(
    `SELECT i.id AS infraccion_id, i.titulo_corto, i.gravedad, i.importe_eur,
            a.numero AS articulo_numero, n.codigo AS norma_codigo
       FROM infraccion i
       JOIN articulo a ON a.id = i.articulo_id
       JOIN norma    n ON n.id = a.norma_id
      WHERE i.id IN (${placeholders})`,
    orden,
  );

  const porId = new Map(filas.map((f) => [f.infraccion_id, f]));
  const exactosSet = new Set(idsExactos);
  const resultados: ResultadoBusqueda[] = [];
  for (const id of orden) {
    const f = porId.get(id);
    if (!f) continue;
    resultados.push({
      infraccionId: f.infraccion_id,
      tituloCorto: f.titulo_corto,
      gravedad: f.gravedad,
      importeEur: f.importe_eur,
      normaCodigo: f.norma_codigo,
      articuloNumero: f.articulo_numero,
      porSinonimoExacto: exactosSet.has(id),
    });
  }
  return resultados;
}
