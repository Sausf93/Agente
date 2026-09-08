import { Cuerpo, normalizarBusqueda, type Ambito, type TipoNorma } from '@agente/shared';
import type { SqlRunner } from '@/db/sqlRunner';
import { filtroTerritorialSql } from '@/db/territorio';

/**
 * NÚCLEO de la pestaña NORMAS (§4.5), agnóstico del motor SQLite.
 *
 * Consulta el PAQUETE DE CONTENIDO (solo lectura) para navegar el articulado consolidado:
 * lista de normas → artículos de una norma → texto de un artículo. Reutiliza el mismo enfoque
 * que el buscador y la ficha (dependencia SOLO de `SqlRunner`), de modo que el MISMO SQL corre
 * en el dispositivo (`expo-sqlite`) y en los tests de integración (`node:sqlite`).
 *
 * La ORDENACIÓN y el FILTRADO dentro de la norma son funciones PURAS y deterministas (sin RN ni
 * SQLite), cubiertas por tests unitarios. Todo funciona sin red (offline-first).
 */

// ---------------------------------------------------------------------------
// Tipos de salida (lo que pintan las pantallas)
// ---------------------------------------------------------------------------

/** Norma para la lista de normas (§4.5, nivel 1). */
export interface NormaResumen {
  id: string;
  codigo: string;
  titulo: string;
  tipo: TipoNorma;
  ambito: Ambito;
  /** Territorio al que pertenece (CCAA/provincia/municipio); `null` en lo estatal. */
  territorioId: string | null;
  urlBoe: string | null;
  numArticulos: number;
  /**
   * Cuerpos que consultan esta norma habitualmente (relevancia, NO restricción de acceso).
   * Sale del campo `cuerpos` del paquete; array VACÍO = norma sin etiquetar = relevante para
   * todos. Sirve para filtrar la lista de Normas por el cuerpo del agente.
   */
  cuerpos: Cuerpo[];
}

/** Artículo para la lista dentro de una norma (§4.5, nivel 2). */
export interface ArticuloResumen {
  id: string;
  numero: string;
  titulo: string | null;
  /** `true` si el texto es un resumen orientativo del seed (no el consolidado del BOE). */
  esResumen: boolean;
  /** Orden documental que fija el pipeline. */
  orden: number;
  /** Cadena normalizada (número + título + texto) para el buscador DENTRO de la norma. */
  textoBusqueda: string;
}

/** Artículo completo (§4.5, nivel 3): texto consolidado + fuente. */
export interface ArticuloDetalle {
  id: string;
  normaId: string;
  normaCodigo: string;
  normaTitulo: string;
  numero: string;
  titulo: string | null;
  /** Texto en Markdown (consolidado del BOE o resumen orientativo del seed). */
  texto: string;
  urlBoe: string | null;
  /** "Actualizado el…" — sale de `meta.fecha` (ISO 8601) del paquete. */
  actualizadoEn: string | null;
  /** Fecha de entrada en vigor de esta versión del artículo (ISO 8601). */
  validFrom: string | null;
  esResumen: boolean;
}

// ---------------------------------------------------------------------------
// Filas crudas (nombres de columna del paquete)
// ---------------------------------------------------------------------------

interface FilaNorma {
  id: string;
  codigo: string;
  titulo: string;
  tipo: TipoNorma;
  ambito: Ambito;
  territorio_id: string | null;
  url_boe: string | null;
  num_articulos: number;
  /** JSON array de `Cuerpo` (columna `cuerpos TEXT NOT NULL DEFAULT '[]'`). */
  cuerpos: string;
}

interface FilaArticuloLista {
  id: string;
  numero: string;
  titulo: string | null;
  texto: string;
  orden: number;
}

interface FilaArticuloDetalle {
  id: string;
  norma_id: string;
  numero: string;
  titulo: string | null;
  texto: string;
  valid_from: string | null;
  norma_codigo: string;
  norma_titulo: string;
  url_boe: string | null;
}

// ---------------------------------------------------------------------------
// Lógica PURA (ordenación, filtrado, detección de resumen y de cambio reciente)
// ---------------------------------------------------------------------------

/** Frase fija que traen los textos de seed para avisar de que son orientativos (§4.5). */
const MARCA_RESUMEN = /resumen orientativo/i;

/** `true` si el texto es un resumen orientativo del seed (no el consolidado del BOE). */
export function esResumenOrientativo(texto: string): boolean {
  return MARCA_RESUMEN.test(texto);
}

/**
 * Clave de orden de un número de artículo: primero su parte NUMÉRICA (para que "18" vaya antes
 * que "118" y no se ordene como texto), luego el propio número normalizado como desempate. Los
 * números sin parte numérica al inicio (p. ej. "Disposición final primera", "único") reciben una
 * clave numérica `Infinity` para caer AL FINAL, como en el articulado consolidado.
 */
export function numeroSortKey(numero: string): [number, string] {
  const m = /^(\d+)/.exec(numero.trim());
  const num = m && m[1] ? Number.parseInt(m[1], 10) : Number.POSITIVE_INFINITY;
  return [num, normalizarBusqueda(numero)];
}

/**
 * Ordena los artículos de una norma para lectura: por `orden` documental (lo fija el pipeline) y,
 * a igualdad de orden, por número de artículo ascendente (numérico y luego textual). Estable y
 * pura. Devuelve un array NUEVO (no muta la entrada).
 */
export function ordenarArticulos<T extends { orden: number; numero: string }>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => {
    if (a.orden !== b.orden) return a.orden - b.orden;
    const [an, as] = numeroSortKey(a.numero);
    const [bn, bs] = numeroSortKey(b.numero);
    if (an !== bn) return an - bn;
    return as.localeCompare(bs);
  });
}

/**
 * Filtra los artículos por la consulta del agente (buscador DENTRO de la norma, §4.5). Si la
 * consulta empieza por dígito se trata como búsqueda por NÚMERO (prefijo exacto: "18" encuentra
 * "18" y "18 bis" pero no "118"); en otro caso, busca en el texto normalizado (número + título +
 * cuerpo, con tildes/ñ plegadas). Consulta vacía → todos. Pura y determinista.
 */
export function filtrarArticulos(
  items: readonly ArticuloResumen[],
  consulta: string,
): ArticuloResumen[] {
  const q = normalizarBusqueda(consulta);
  if (q.length === 0) return [...items];
  const porNumero = /^\d/.test(q);
  return items.filter((it) => {
    if (porNumero) return normalizarBusqueda(it.numero).startsWith(q);
    return it.textoBusqueda.includes(q);
  });
}

/** Resultado de evaluar si una versión del artículo es novedad (indicador "cambió el…", §4.5). */
export type EstadoCambio = 'reciente' | 'futuro' | null;

/** Ventana por defecto (en días) para considerar "cambio reciente": ~18 meses. */
export const VENTANA_CAMBIO_DIAS = 540;

/**
 * Decide si un artículo se marca como cambiado, comparando su entrada en vigor (`validFrom`) con
 * la fecha del paquete (`referencia`):
 *  - `'reciente'`: entró en vigor en los últimos `ventanaDias` (cambio normativo real reciente).
 *  - `'futuro'`: aún no está en vigor (entrada en vigor posterior a la referencia).
 *  - `null`: cambio antiguo, o entrada igual a la fecha del paquete (artefacto del seed → no es
 *    un cambio legislativo), o fechas inválidas.
 * Pura y testeable; evita el ruido de marcar TODOS los artículos del seed como "cambiados".
 */
export function estadoCambio(
  validFrom: string | null,
  referencia: string | null,
  ventanaDias: number = VENTANA_CAMBIO_DIAS,
): EstadoCambio {
  if (!validFrom || !referencia) return null;
  const vf = new Date(validFrom).getTime();
  const ref = new Date(referencia).getTime();
  if (Number.isNaN(vf) || Number.isNaN(ref)) return null;
  const deltaDias = (ref - vf) / (1000 * 60 * 60 * 24);
  if (deltaDias < 0) return 'futuro';
  if (deltaDias > 0 && deltaDias <= ventanaDias) return 'reciente';
  return null;
}

// ---------------------------------------------------------------------------
// Cuerpos y bloques (filtrado por cuerpo del agente + agrupación de la lista)
// ---------------------------------------------------------------------------

const CUERPOS_VALIDOS: ReadonlySet<string> = new Set(Cuerpo.options);

/**
 * Parsea el JSON de la columna `cuerpos` a un array de `Cuerpo` VÁLIDOS (descarta valores
 * desconocidos y tolera JSON roto o nulo devolviendo `[]`). Pura y defensiva: nunca lanza, de
 * modo que un paquete con datos inesperados no rompe la lista de Normas.
 */
export function parseCuerpos(raw: string | null | undefined): Cuerpo[] {
  if (!raw) return [];
  let valor: unknown;
  try {
    valor = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(valor)) return [];
  return valor.filter((c): c is Cuerpo => typeof c === 'string' && CUERPOS_VALIDOS.has(c));
}

/**
 * Decide si una norma es RELEVANTE para el cuerpo del agente (filtro "Solo mi cuerpo", §4.5):
 *  - Sin cuerpo en el perfil (`null`) → todas son relevantes (arranque neutro).
 *  - Norma sin etiquetar (`cuerpos` vacío) → relevante para todos (conservador, no oculta nada).
 *  - En otro caso, relevante si su lista de cuerpos incluye el del agente.
 * Pura y testeable.
 */
export function normaRelevantePara(cuerpos: readonly Cuerpo[], cuerpo: Cuerpo | null): boolean {
  if (!cuerpo) return true;
  if (cuerpos.length === 0) return true;
  return cuerpos.includes(cuerpo);
}

/** Bloque temático para agrupar la lista de Normas (mejora la lectura, §4.5). */
export type BloqueNorma = 'trafico' | 'penal' | 'seguridad' | 'otras';

/** Etiqueta legible de cada bloque (cabecera de sección). */
export const BLOQUE_LABEL: Record<BloqueNorma, string> = {
  trafico: 'Tráfico y seguridad vial',
  penal: 'Penal y procesal',
  seguridad: 'Seguridad ciudadana',
  otras: 'Otras normas',
};

/** Orden de presentación de los bloques (los más consultados primero). */
export const BLOQUE_ORDEN: readonly BloqueNorma[] = ['trafico', 'penal', 'seguridad', 'otras'];

/** Mapa código de norma → bloque. Lo desconocido cae en 'otras' (no se pierde ninguna norma). */
const BLOQUE_POR_CODIGO: Record<string, BloqueNorma> = {
  RGC: 'trafico',
  LSV: 'trafico',
  RGV: 'trafico',
  LRCSCVM: 'trafico',
  CP: 'penal',
  LECrim: 'penal',
  LOSC: 'seguridad',
};

/** Bloque temático de una norma por su código. Fallback conservador: 'otras'. */
export function bloqueDeNorma(codigo: string): BloqueNorma {
  return BLOQUE_POR_CODIGO[codigo] ?? 'otras';
}

/** Sección de normas de un mismo bloque, lista para pintar en `SectionList`. */
export interface SeccionNormas {
  bloque: BloqueNorma;
  titulo: string;
  data: NormaResumen[];
}

/**
 * Agrupa las normas por bloque temático respetando el orden de `BLOQUE_ORDEN` y, dentro de cada
 * bloque, el orden de entrada (que ya llega estatal→autonómico→municipal y por código). Omite los
 * bloques vacíos. Pura y determinista.
 */
export function agruparNormasPorBloque(normas: readonly NormaResumen[]): SeccionNormas[] {
  return BLOQUE_ORDEN.map((bloque) => ({
    bloque,
    titulo: BLOQUE_LABEL[bloque],
    data: normas.filter((n) => bloqueDeNorma(n.codigo) === bloque),
  })).filter((s) => s.data.length > 0);
}

// ---------------------------------------------------------------------------
// Filtro territorial (capa por territorio, ADR-006/008): estatal + cadena del perfil
// ---------------------------------------------------------------------------

// `filtroTerritorialSql` vive ahora en `@/db/territorio` (fuente única, reutilizada también por el
// Buscador §4.3). Se re-exporta aquí para no romper los imports existentes de la pestaña Normas.
export { cadenaTerritorialDe, filtroTerritorialSql } from '@/db/territorio';

// ---------------------------------------------------------------------------
// Consultas al paquete (usan SqlRunner; combinan SQL con las funciones puras)
// ---------------------------------------------------------------------------

/**
 * Lista las normas VISIBLES para la cadena territorial del perfil, con su recuento de artículos
 * vigentes. Lo estatal se ve siempre; lo autonómico/municipal solo si su territorio está en la
 * `cadena` (`[ccaaId, provinciaId, municipioId]`). Sin cadena, solo lo estatal (no se filtra por
 * municipio de otro). Orden: primero lo estatal, luego autonómico y municipal; por código dentro.
 */
export async function listarNormas(
  runner: SqlRunner,
  cadena: readonly string[] = [],
): Promise<NormaResumen[]> {
  const filtro = filtroTerritorialSql(cadena, 'n.territorio_id');
  const filas = await runner.getAll<FilaNorma>(
    `SELECT n.id, n.codigo, n.titulo, n.tipo, n.ambito, n.territorio_id, n.url_boe, n.cuerpos,
            (SELECT COUNT(*) FROM articulo a
              WHERE a.norma_id = n.id AND a.valid_to IS NULL) AS num_articulos
       FROM norma n
      WHERE ${filtro.sql}
      ORDER BY CASE n.ambito
                 WHEN 'estatal' THEN 0
                 WHEN 'autonomico' THEN 1
                 ELSE 2
               END,
               n.codigo`,
    filtro.params,
  );
  return filas.map((f) => ({
    id: f.id,
    codigo: f.codigo,
    titulo: f.titulo,
    tipo: f.tipo,
    ambito: f.ambito,
    territorioId: f.territorio_id,
    urlBoe: f.url_boe,
    numArticulos: f.num_articulos,
    cuerpos: parseCuerpos(f.cuerpos),
  }));
}

/**
 * Devuelve los `territorioId` de municipios que TIENEN ordenanza cargada en el paquete (distinct
 * de las normas municipales). Sirve para decidir, en el onboarding y en Normas, si el municipio
 * del perfil ya tiene contenido ("activa tu ordenanza") o aún no ("solicítala"). Sin red.
 */
export async function listarMunicipiosConOrdenanza(runner: SqlRunner): Promise<string[]> {
  const filas = await runner.getAll<{ territorio_id: string | null }>(
    `SELECT DISTINCT n.territorio_id
       FROM norma n
      WHERE n.ambito = 'municipal' AND n.territorio_id IS NOT NULL`,
  );
  return filas.map((f) => f.territorio_id).filter((id): id is string => id !== null);
}

/**
 * Devuelve los `territorioId` de CCAA que TIENEN normativa autonómica cargada en el paquete
 * (distinct de las normas de ámbito autonómico). Análogo a `listarMunicipiosConOrdenanza`: sirve
 * para decidir, en Normas, si la comunidad del perfil ya trae contenido autonómico o aún no
 * ("solicítala"). Honestidad de la capa autonómica igual que la municipal (ADR-006/008). Sin red.
 */
export async function listarCcaaConContenido(runner: SqlRunner): Promise<string[]> {
  const filas = await runner.getAll<{ territorio_id: string | null }>(
    `SELECT DISTINCT n.territorio_id
       FROM norma n
      WHERE n.ambito = 'autonomico' AND n.territorio_id IS NOT NULL`,
  );
  return filas.map((f) => f.territorio_id).filter((id): id is string => id !== null);
}

/**
 * Carga los artículos vigentes de una norma, ya ORDENADOS para lectura. Cada uno trae la cadena
 * `textoBusqueda` (normalizada) para que el buscador dentro de la norma funcione en memoria, sin
 * más consultas y sin red.
 */
export async function listarArticulos(
  runner: SqlRunner,
  normaId: string,
): Promise<ArticuloResumen[]> {
  const filas = await runner.getAll<FilaArticuloLista>(
    `SELECT a.id, a.numero, a.titulo, a.texto, a.orden
       FROM articulo a
      WHERE a.norma_id = ? AND a.valid_to IS NULL`,
    [normaId],
  );
  const items = filas.map<ArticuloResumen>((f) => ({
    id: f.id,
    numero: f.numero,
    titulo: f.titulo,
    esResumen: esResumenOrientativo(f.texto),
    orden: f.orden,
    textoBusqueda: normalizarBusqueda(`${f.numero} ${f.titulo ?? ''} ${f.texto}`),
  }));
  return ordenarArticulos(items);
}

/** Carga un artículo completo (texto + fuente). Devuelve `null` si el id no existe. */
export async function cargarArticulo(
  runner: SqlRunner,
  articuloId: string,
): Promise<ArticuloDetalle | null> {
  const fila = await runner.getFirst<FilaArticuloDetalle>(
    `SELECT a.id, a.norma_id, a.numero, a.titulo, a.texto, a.valid_from,
            n.codigo AS norma_codigo, n.titulo AS norma_titulo, n.url_boe
       FROM articulo a
       JOIN norma n ON n.id = a.norma_id
      WHERE a.id = ?`,
    [articuloId],
  );
  if (!fila) return null;

  const meta = await runner.getFirst<{ valor: string }>(
    `SELECT valor FROM meta WHERE clave = 'fecha'`,
  );

  return {
    id: fila.id,
    normaId: fila.norma_id,
    normaCodigo: fila.norma_codigo,
    normaTitulo: fila.norma_titulo,
    numero: fila.numero,
    titulo: fila.titulo,
    texto: fila.texto,
    urlBoe: fila.url_boe,
    actualizadoEn: meta?.valor ?? null,
    validFrom: fila.valid_from,
    esResumen: esResumenOrientativo(fila.texto),
  };
}

// ---------------------------------------------------------------------------
// Etiquetas de dominio (UI en español)
// ---------------------------------------------------------------------------

/** Etiqueta legible del tipo de norma. */
export const NORMA_TIPO_LABEL: Record<TipoNorma, string> = {
  ley: 'Ley',
  reglamento: 'Reglamento',
  ordenanza: 'Ordenanza',
  codificado: 'Codificado',
};

/** Etiqueta legible del ámbito. */
export const NORMA_AMBITO_LABEL: Record<Ambito, string> = {
  estatal: 'Estatal',
  autonomico: 'Autonómico',
  municipal: 'Municipal',
};

/** "784 artículos" / "1 artículo" — recuento con plural correcto para la fila de norma. */
export function articulosLabel(n: number): string {
  return `${n.toLocaleString('es-ES')} ${n === 1 ? 'artículo' : 'artículos'}`;
}

/** "3 normas más" / "1 norma más" — texto del pie que revela lo oculto por el filtro de cuerpo. */
export function normasOcultasLabel(n: number): string {
  return `${n} ${n === 1 ? 'norma más' : 'normas más'} de otros cuerpos`;
}
