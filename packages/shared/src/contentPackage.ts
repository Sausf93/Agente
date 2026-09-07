import { z } from 'zod';

/**
 * CONTRATO DEL PAQUETE DE CONTENIDO SQLite (sección 7.1 y 8 de la especificación).
 *
 * Fuente única compartida por:
 *   - `@agente/content-pipeline` (CONSTRUYE el paquete `.sqlite` con FTS5).
 *   - `apps/mobile` (CONSULTA el paquete, ya precompilado, sin indexar en el dispositivo).
 *
 * Aquí viven las constantes que AMBOS lados deben compartir para no divergir: nombres de
 * tablas, versión de esquema, columnas y pesos del índice FTS5, la normalización del texto
 * de búsqueda y el estado de revisión editorial. Si el pipeline y la app usaran normalizaciones
 * distintas, "faro roto" dejaría de encontrar "alumbrado deficiente": por eso es un contrato.
 *
 * El detalle del esquema (DDL, ejemplos de consulta y de carga de ficha) está en
 * `packages/content-pipeline/CONTENT-PACKAGE.md`.
 */

/**
 * Versión del ESQUEMA del paquete (no del contenido). La app declara el rango que soporta;
 * si un paquete exige un esquema mayor, la app conserva el contenido actual y sugiere
 * actualizar (ADR-010, punto 6). Subir SOLO ante cambios incompatibles de tablas/columnas.
 */
export const ESQUEMA_PAQUETE_VERSION = 1;

/** Nombres de tabla del paquete. Estables: renombrar exige subir `ESQUEMA_PAQUETE_VERSION`. */
export const TABLAS = {
  norma: 'norma',
  articulo: 'articulo',
  infraccion: 'infraccion',
  sinonimo: 'sinonimo',
  consecuencia: 'consecuencia',
  /** Tabla virtual FTS5 del buscador de INFRACCIONES (la joya: importe + consecuencia). */
  busqueda: 'busqueda',
  /**
   * Tabla virtual FTS5 del buscador de ARTÍCULOS de la ley (segundo nivel del buscador, §4.3).
   * Cubre términos legales sin infracción curada ("temeraria", "alejamiento") indexando el
   * articulado consolidado del BOE que ya viaja en el paquete.
   */
  busquedaArticulo: 'busqueda_articulo',
  /** Metadatos del paquete: 1 sola fila (schema_version, content_version, fecha, hash…). */
  meta: 'meta',
  novedad: 'novedad',
  /** Tabla de sustancias (§4.7): umbrales orientativos consumo/tráfico. */
  sustancia: 'sustancia',
} as const;

/**
 * Columnas indexadas del FTS5, EN ORDEN. El orden importa: `bm25()` recibe los pesos
 * posicionalmente en este mismo orden. `infraccion_id` va como columna UNINDEXED (no se
 * tokeniza) para recuperar la fila sin una segunda tabla.
 */
export const FTS_COLUMNAS = ['titulo_corto', 'texto_boletin', 'sinonimos', 'articulo_numero'] as const;
export type FtsColumna = (typeof FTS_COLUMNAS)[number];

/**
 * Tokenizador del FTS5. `unicode61` con `remove_diacritics 2` pliega mayúsculas y tildes
 * (y ñ→n) en el índice; la consulta debe pasar por `normalizarBusqueda` para plegar igual.
 */
export const FTS_TOKENIZER = "unicode61 remove_diacritics 2";

/**
 * Pesos de `bm25()` por columna (mismo orden que `FTS_COLUMNAS`). En SQLite un `bm25`
 * MÁS NEGATIVO es mejor; un peso mayor hace que la columna pese más en la relevancia.
 *
 * Modelo de ranking (sección 4.3): sinónimo exacto > título > texto > popularidad.
 *  - El nivel "sinónimo EXACTO" se resuelve APARTE (lookup directo en `sinonimo` por
 *    `termino_normalizado`) y se coloca SIEMPRE por encima de los resultados de FTS.
 *  - Dentro de FTS, el título pesa más que el texto de boletín; el nº de artículo permite
 *    encontrar "18.2 RGC"; los sinónimos (no exactos, por tokens) refuerzan.
 *  - La "popularidad en el cuerpo" es un desempate FINAL que aporta la app desde su tabla
 *    local de eventos de uso (`EventoUso`, sección 6.2): NO viaja en el paquete de contenido.
 */
export const FTS_PESOS_BM25 = {
  titulo_corto: 10,
  texto_boletin: 1,
  sinonimos: 6,
  articulo_numero: 4,
} as const;

/** Pesos en el orden posicional que exige `bm25(tabla, w0, w1, w2, w3)`. */
export const FTS_PESOS_BM25_ORDENADOS: readonly number[] = FTS_COLUMNAS.map(
  (c) => FTS_PESOS_BM25[c],
);

/**
 * Columnas indexadas del FTS5 de ARTÍCULOS, EN ORDEN (§4.3, segundo nivel del buscador).
 * `articulo_id` y `norma_codigo` van UNINDEXED (recuperar la fila y pintar el código de norma
 * sin una segunda consulta). `articulo_numero` se indexa como "<código> <número>" normalizado
 * para que "cp 380" case igual que en el buscador de infracciones.
 */
export const FTS_COLUMNAS_ARTICULO = ['articulo_numero', 'titulo', 'texto'] as const;
export type FtsColumnaArticulo = (typeof FTS_COLUMNAS_ARTICULO)[number];

/**
 * Pesos de `bm25()` del FTS de artículos (mismo orden que `FTS_COLUMNAS_ARTICULO`). El título
 * del artículo (p. ej. "Conducción temeraria") pesa más que el cuerpo del texto; el número
 * permite localizar "CP 380". Menos negativo = peor, igual que en el FTS de infracciones.
 */
export const FTS_PESOS_BM25_ARTICULO = {
  articulo_numero: 6,
  titulo: 10,
  texto: 1,
} as const;

/** Pesos del FTS de artículos en el orden posicional que exige `bm25(tabla, w0, w1, w2)`. */
export const FTS_PESOS_BM25_ARTICULO_ORDENADOS: readonly number[] = FTS_COLUMNAS_ARTICULO.map(
  (c) => FTS_PESOS_BM25_ARTICULO[c],
);

/**
 * Estado de revisión editorial de una infracción en el paquete (sección 8.2/8.3).
 *
 * El contenido legal NO se publica "verificado" por defecto: el pipeline lo marca
 * `pendiente_revision` y el cofundador agente (+ segundo revisor) lo aprueba en el panel.
 * La app puede mostrar un distintivo "pendiente de revisión / a verificar" en la ficha.
 */
export const EstadoRevision = z.enum(['verificado', 'pendiente_revision']);
export type EstadoRevision = z.infer<typeof EstadoRevision>;

/**
 * Normaliza un término para el buscador: minúsculas, sin tildes (ni ñ), espacios colapsados.
 *
 * DEBE ser idéntica en el pipeline (al construir la columna de sinónimos y las claves
 * `termino_normalizado`) y en la app (al normalizar lo que teclea el agente). Coincide con
 * el plegado del tokenizador FTS (`remove_diacritics 2`) para que MATCH y lookup concuerden.
 */
export function normalizarBusqueda(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // quita marcas diacríticas (tildes, diéresis)
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}
