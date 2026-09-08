import {
  FTS_PESOS_BM25_ARTICULO_ORDENADOS,
  FTS_PESOS_BM25_ORDENADOS,
  normalizarBusqueda,
  type Ambito,
  type Gravedad,
  type TipoConsecuencia,
} from '@agente/shared';
import type { SqlRunner } from '@/db/sqlRunner';
import { filtroTerritorialSql } from '@/db/territorio';
import { pistaConsecuencia, type PistaConsecuencia } from './resaltar';

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
  /** Ámbito de la infracción (estatal/autonómico/municipal): distingue una ordenanza de lo estatal. */
  ambito: Ambito;
  /** `true` si entró por coincidencia EXACTA de sinónimo (se muestra primero). */
  porSinonimoExacto: boolean;
  /** Consecuencia determinante (grúa / inmovilización / detención) para el chip inline, o `null`. */
  pista: PistaConsecuencia | null;
}

/** Fila cruda de la hidratación (nombres de columna del paquete). */
interface FilaInfraccion {
  infraccion_id: string;
  titulo_corto: string;
  gravedad: Gravedad;
  importe_eur: number | null;
  norma_codigo: string;
  articulo_numero: string;
  ambito: Ambito;
}

/**
 * Un artículo de la ley que coincide con la búsqueda (segundo nivel del buscador, §4.3). Se
 * muestra en la sección "En la ley", DEBAJO de las infracciones (que son la joya). Al tocarlo
 * se abre su pantalla de artículo en Normas.
 */
export interface ResultadoArticulo {
  articuloId: string;
  /** Código de la norma, p. ej. "CP", "RGC". */
  normaCodigo: string;
  numero: string;
  titulo: string | null;
  /** Primeras palabras del texto (o del título) para dar contexto en la fila. */
  extracto: string;
}

/** Resultado combinado del buscador: infracciones (joya) + artículos de la ley (cobertura). */
export interface ResultadosBusqueda {
  infracciones: ResultadoBusqueda[];
  articulos: ResultadoArticulo[];
}

/** Fila cruda del FTS de artículos (id + código de norma + relevancia). */
interface FilaArticuloFts {
  articulo_id: string;
  norma_codigo: string;
  score: number;
}

/** Fila cruda de la hidratación de un artículo (para pintar con acentos/mayúsculas reales). */
interface FilaArticuloHidratado {
  id: string;
  numero: string;
  titulo: string | null;
  texto: string;
  norma_codigo: string;
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

/** Nº máximo de INFRACCIONES que devuelve una búsqueda (suficiente para la lista de calle). */
export const LIMITE_RESULTADOS = 25;

/** Nº máximo de ARTÍCULOS de la ley en la sección secundaria (no debe tapar las infracciones). */
export const LIMITE_ARTICULOS = 15;

/** Longitud máxima del extracto de un artículo en la fila de resultados (§4.3). */
const EXTRACTO_MAX = 120;

/**
 * Extracto legible de un artículo para la fila de resultados: recorta el texto a `EXTRACTO_MAX`
 * caracteres sin partir la última palabra y añade elipsis. Lógica PURA (test unitario). El
 * markdown ligero del cuerpo (encabezados, listas) se limpia a un párrafo plano de contexto.
 */
export function extractoArticulo(texto: string, max: number = EXTRACTO_MAX): string {
  const plano = texto
    .replace(/[#*_`>-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (plano.length <= max) return plano;
  const corte = plano.slice(0, max);
  const ultimoEspacio = corte.lastIndexOf(' ');
  const base = ultimoEspacio > max * 0.6 ? corte.slice(0, ultimoEspacio) : corte;
  return `${base.trim()}…`;
}

/**
 * Ejecuta la búsqueda completa contra el paquete y devuelve los resultados ya ordenados.
 * Consulta vacía → lista vacía. No lanza si el MATCH falla: cae a los resultados exactos.
 */
export async function buscarInfracciones(
  runner: SqlRunner,
  consulta: string,
  cadena: readonly string[] = [],
): Promise<ResultadoBusqueda[]> {
  const consultaNorm = normalizarBusqueda(consulta);
  if (consultaNorm.length === 0) return [];

  // Filtro territorial (ADR-006/008): lo estatal (territorio_id NULL) siempre; lo municipal solo
  // si su territorio está en la cadena del perfil. Evita que la ordenanza de un municipio salga a
  // un agente de otro. Se compone sobre `i.territorio_id` en el lookup exacto Y en el FTS.
  const filtroExacto = filtroTerritorialSql(cadena, 'i.territorio_id');

  // Paso 1: sinónimos EXACTOS (van siempre arriba). Se une a `infraccion` para poder filtrar por
  // territorio (el sinónimo no lleva territorio; lo lleva su infracción).
  //
  // DESEMPATE DETERMINISTA (QA MEDIA-3): un mismo término de calle puede tener varias fichas con
  // sinónimo EXACTO en la frontera penal/administrativa ("okupas" → usurpación 245.2 CP y ocupación
  // 37.7 LOSC). Sin `ORDER BY` el primer resultado dependía del rowid. Dictamen del revisor: prima
  // la PENAL sobre la administrativa (`i.tipo = 'penal'` primero) y, dentro del mismo tipo, orden
  // estable por `id`. No altera los términos con un único match exacto (la inmensa mayoría).
  const exactos = await runner.getAll<{ infraccion_id: string }>(
    `SELECT DISTINCT s.infraccion_id AS infraccion_id, i.tipo AS tipo, i.id AS id
       FROM sinonimo s
       JOIN infraccion i ON i.id = s.infraccion_id
      WHERE s.termino_normalizado = ? AND s.infraccion_id IS NOT NULL
        AND ${filtroExacto.sql}
      ORDER BY (i.tipo = 'penal') DESC, i.id ASC`,
    [consultaNorm, ...filtroExacto.params],
  );
  const idsExactos = exactos.map((r) => r.infraccion_id);

  // Paso 2: FTS5 ponderado (bm25 con los pesos del contrato), unido a `infraccion` para el filtro
  // territorial (el FTS externo no guarda el territorio; lo aporta la fila de infracción).
  const pesos = FTS_PESOS_BM25_ORDENADOS.join(', ');
  const match = construirConsultaFts(consultaNorm);
  let idsFts: string[] = [];
  if (match.length > 0) {
    try {
      const filas = await runner.getAll<{ infraccion_id: string; score: number }>(
        `SELECT b.infraccion_id AS infraccion_id, bm25(busqueda, ${pesos}) AS score
           FROM busqueda b
           JOIN infraccion i ON i.id = b.infraccion_id
          WHERE busqueda MATCH ?
            AND ${filtroExacto.sql}
          ORDER BY score
          LIMIT ?`,
        [match, ...filtroExacto.params, LIMITE_RESULTADOS],
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
    `SELECT i.id AS infraccion_id, i.titulo_corto, i.gravedad, i.importe_eur, i.ambito,
            a.numero AS articulo_numero, n.codigo AS norma_codigo
       FROM infraccion i
       JOIN articulo a ON a.id = i.articulo_id
       JOIN norma    n ON n.id = a.norma_id
      WHERE i.id IN (${placeholders})`,
    orden,
  );

  // Consecuencias determinantes: una consulta agrupada por infracción para el chip inline (§6.2).
  const consecuencias = await runner.getAll<{ infraccion_id: string; tipo: TipoConsecuencia }>(
    `SELECT infraccion_id, tipo
       FROM consecuencia
      WHERE infraccion_id IN (${placeholders})`,
    orden,
  );
  const tiposPorId = new Map<string, TipoConsecuencia[]>();
  for (const c of consecuencias) {
    const lista = tiposPorId.get(c.infraccion_id) ?? [];
    lista.push(c.tipo);
    tiposPorId.set(c.infraccion_id, lista);
  }

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
      ambito: f.ambito,
      porSinonimoExacto: exactosSet.has(id),
      pista: pistaConsecuencia(tiposPorId.get(id) ?? []),
    });
  }
  return resultados;
}

/**
 * Segundo nivel del buscador (§4.3): busca en el ARTICULADO de la ley (tabla FTS
 * `busqueda_articulo`) para cubrir los términos legales SIN infracción curada ("temeraria",
 * "alejamiento", "agresión"). Devuelve los artículos coincidentes ordenados por relevancia
 * (bm25). `excluir` descarta artículos que ya aparecen como fuente de una infracción mostrada,
 * para no repetir la misma norma dos veces. No lanza si el MATCH falla (cae a lista vacía).
 */
export async function buscarArticulos(
  runner: SqlRunner,
  consulta: string,
  excluir: ReadonlySet<string> = new Set(),
  cadena: readonly string[] = [],
): Promise<ResultadoArticulo[]> {
  const consultaNorm = normalizarBusqueda(consulta);
  const match = construirConsultaFts(consultaNorm);
  if (match.length === 0) return [];

  // Filtro territorial (ADR-006/008): el articulado municipal (p. ej. la ordenanza de un municipio)
  // solo se ve si su territorio está en la cadena. El artículo no lleva territorio propio; lo hereda
  // de su norma, así que se filtra sobre `n.territorio_id` uniendo articulo→norma.
  const filtro = filtroTerritorialSql(cadena, 'n.territorio_id');
  const pesos = FTS_PESOS_BM25_ARTICULO_ORDENADOS.join(', ');
  let filasFts: FilaArticuloFts[] = [];
  try {
    filasFts = await runner.getAll<FilaArticuloFts>(
      `SELECT b.articulo_id AS articulo_id, b.norma_codigo AS norma_codigo,
              bm25(busqueda_articulo, ${pesos}) AS score
         FROM busqueda_articulo b
         JOIN articulo a ON a.id = b.articulo_id
         JOIN norma    n ON n.id = a.norma_id
        WHERE busqueda_articulo MATCH ?
          AND ${filtro.sql}
        ORDER BY score
        LIMIT ?`,
      // Pedimos margen (excluidos + límite) para poder descartar y aun así llenar la sección.
      [match, ...filtro.params, LIMITE_ARTICULOS + excluir.size],
    );
  } catch {
    return []; // MATCH inválido: la búsqueda de infracciones sigue funcionando aparte.
  }

  const orden = filasFts
    .map((f) => f.articulo_id)
    .filter((id) => !excluir.has(id))
    .slice(0, LIMITE_ARTICULOS);
  if (orden.length === 0) return [];

  const placeholders = orden.map(() => '?').join(', ');
  const filas = await runner.getAll<FilaArticuloHidratado>(
    `SELECT a.id, a.numero, a.titulo, a.texto, n.codigo AS norma_codigo
       FROM articulo a
       JOIN norma n ON n.id = a.norma_id
      WHERE a.id IN (${placeholders})`,
    orden,
  );
  const porId = new Map(filas.map((f) => [f.id, f]));

  const resultados: ResultadoArticulo[] = [];
  for (const id of orden) {
    const f = porId.get(id);
    if (!f) continue;
    resultados.push({
      articuloId: f.id,
      normaCodigo: f.norma_codigo,
      numero: f.numero,
      titulo: f.titulo,
      extracto: extractoArticulo(f.titulo ? `${f.titulo}. ${f.texto}` : f.texto),
    });
  }
  return resultados;
}

/**
 * Búsqueda COMPLETA en dos niveles (§4.3): primero las INFRACCIONES curadas (la joya: importe +
 * consecuencia + boletín) y, debajo, los ARTÍCULOS de la ley coincidentes (cobertura del resto de
 * términos). Los artículos que ya son fuente de una infracción mostrada se excluyen para no
 * duplicar la misma norma. Ambos niveles corren contra el paquete offline.
 */
export async function buscarTodo(
  runner: SqlRunner,
  consulta: string,
  cadena: readonly string[] = [],
): Promise<ResultadosBusqueda> {
  const infracciones = await buscarInfracciones(runner, consulta, cadena);
  const excluir = new Set(
    infracciones.map((r) => `${r.normaCodigo}::${r.articuloNumero}`),
  );
  const articulos = await buscarArticulos(runner, consulta, new Set(), cadena);
  // Descarta artículos que ya se muestran como fuente de una infracción (misma norma+número).
  const filtrados = articulos.filter(
    (a) => !excluir.has(`${a.normaCodigo}::${a.numero}`),
  );
  return { infracciones, articulos: filtrados };
}
