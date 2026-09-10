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

/**
 * MATERIA de una norma para la navegación POR MATERIA de la pestaña Normas (estilo SPPLB: "elijo
 * Tráfico y salen TODAS sus leyes"). Sustituye a la antigua agrupación temática por bloque. La
 * clasificación vive en la app (mapa interino) mientras el pipeline no la produce; NO toca el
 * modelo de datos de `@agente/shared`.
 */
export type Materia =
  | 'trafico'
  | 'seguridad'
  | 'penal'
  | 'extranjeria'
  | 'armas'
  | 'animales'
  | 'ocio'
  | 'victimaMenores'
  | 'organizacion'
  | 'otras';

/** Metadatos de una materia: etiqueta legible + nombre del icono lucide + orden de presentación. */
export interface MateriaInfo {
  /** Etiqueta legible (cabecera de tarjeta y título de la pantalla de detalle). */
  label: string;
  /**
   * Nombre del icono de `lucide-react-native` (p. ej. "Car"). Se guarda como STRING para que este
   * módulo siga siendo lógica PURA (sin importar componentes de React Native, que romperían los
   * tests en Node): la pantalla resuelve el nombre a su componente.
   */
  icono: string;
  /** Orden de presentación (los más consultados primero). */
  orden: number;
}

/** Tabla de materias (etiqueta, icono, orden). Fuente única de la taxonomía de Normas. */
export const MATERIA_INFO: Record<Materia, MateriaInfo> = {
  trafico: { label: 'Tráfico y seguridad vial', icono: 'Car', orden: 1 },
  // `Siren` (no `ShieldAlert`): un escudo roza la regla innegociable "nada de escudos" (§10).
  seguridad: { label: 'Seguridad ciudadana', icono: 'Siren', orden: 2 },
  penal: { label: 'Penal y procesal', icono: 'Gavel', orden: 3 },
  extranjeria: { label: 'Extranjería', icono: 'Globe', orden: 4 },
  // `Target` (no `Crosshair`, que evoca una mira de francotirador): más neutro para la materia Armas.
  armas: { label: 'Armas', icono: 'Target', orden: 5 },
  animales: { label: 'Animales', icono: 'PawPrint', orden: 6 },
  // `Music` (no `PartyPopper`, demasiado "fiesta") para espectáculos/ocio/convivencia.
  ocio: { label: 'Espectáculos, ocio y convivencia', icono: 'Music', orden: 7 },
  victimaMenores: { label: 'Víctima y menores', icono: 'HeartHandshake', orden: 8 },
  organizacion: { label: 'Organización policial', icono: 'Users', orden: 9 },
  otras: { label: 'Otras normas', icono: 'BookOpen', orden: 10 },
};

/** Materias ordenadas por `orden` (fuente única del orden de presentación). */
export const MATERIA_ORDEN: readonly Materia[] = (Object.keys(MATERIA_INFO) as Materia[]).sort(
  (a, b) => MATERIA_INFO[a].orden - MATERIA_INFO[b].orden,
);

/**
 * Mapa de código estatal EXACTO → materia. Cubre los 17 códigos estatales del catálogo actual.
 * AJUSTE respecto al spec: no hay materia "Transporte"; el transporte por carretera (LOTT) va a
 * `trafico`, que es el cajón completo de tráfico y seguridad vial.
 */
const MATERIA_POR_CODIGO: Record<string, Materia> = {
  RGC: 'trafico',
  LSV: 'trafico',
  RGV: 'trafico',
  LRCSCVM: 'trafico',
  LOTT: 'trafico',
  RGCond: 'trafico', // Reglamento General de Conductores (RD 818/2009)
  REPC: 'trafico', // Reglamento de escuelas particulares de conductores (RD 1295/2003)
  RSORC: 'trafico', // Reglamento del seguro obligatorio de RC (RD 1507/2008)
  LOSC: 'seguridad',
  CP: 'penal',
  LECrim: 'penal',
  LORPM: 'penal',
  LOEX: 'extranjeria',
  RA: 'armas',
  LPPP: 'animales',
  EVD: 'victimaMenores',
  LOPJM: 'victimaMenores',
};

/**
 * Mapa por TEMA para las normas territoriales, cuyo código lleva el tema embebido:
 *  - Autonómicas: `CAN-<TEMA>` (Canarias) → se clasifica por `<TEMA>`.
 *  - Municipales: `OM-<TEMA>-<MUN>` (ordenanza de un municipio) → se clasifica por `<TEMA>`.
 * Así, futuras CCAA/municipios heredan la clasificación sin tocar código (basta reutilizar el tema).
 */
const MATERIA_POR_TEMA: Record<string, Materia> = {
  // Temas autonómicos (Canarias): CAN-ESP, CAN-CPL, CAN-PCAN.
  ESP: 'ocio', // espectáculos públicos y actividades recreativas
  CPL: 'organizacion', // coordinación de policías locales
  PCAN: 'organizacion', // Cuerpo General de la Policía Canaria
  // Temas de ordenanza municipal: OM-CIRC-*, OM-ZBE-*, OM-RUIDO-*, OM-TERRAZAS-*.
  CIRC: 'trafico', // circulación
  ZBE: 'trafico', // zona de bajas emisiones
  RUIDO: 'ocio', // ruidos y vibraciones (convivencia)
  TERRAZAS: 'ocio', // terrazas / ocupación de vía pública (convivencia)
  // Tema compartido por CAN-ANIM y OM-ANIM-* (protección y tenencia de animales).
  ANIM: 'animales',
};

/**
 * Materia de una norma por su código. Estatales: coincidencia EXACTA. Territoriales: se extrae el
 * `<TEMA>` de `CAN-<TEMA>` o `OM-<TEMA>-<MUN>` y se clasifica por él. Fallback conservador: 'otras'
 * (con el catálogo actual NINGUNA norma cae aquí; lo verifica el test). Pura y determinista.
 */
export function materiaDeNorma(codigo: string): Materia {
  const exacta = MATERIA_POR_CODIGO[codigo];
  if (exacta) return exacta;
  const can = /^CAN-([A-Z]+)$/.exec(codigo);
  if (can?.[1]) return MATERIA_POR_TEMA[can[1]] ?? 'otras';
  const om = /^OM-([A-Z]+)-[A-Z]+$/.exec(codigo);
  if (om?.[1]) return MATERIA_POR_TEMA[om[1]] ?? 'otras';
  return 'otras';
}

/**
 * Override interino de MATERIA por infracción (mismo patrón que `SUBTEMA_POR_INFRACCION`): reasigna
 * una ficha a una materia distinta de la de su norma, solo para la NAVEGACIÓN por materia. Caso de
 * uso: las infracciones administrativas de ARMAS se sancionan hoy por la LOSC (LO 4/2015, arts. 36/37)
 * —esa es su fuente honesta, que se muestra en la ficha— pero pertenecen a la sección "Armas" (paridad
 * SPPLB), no a "Seguridad ciudadana". Sin este override caerían bajo la materia de su norma (LOSC =
 * seguridad). Se mantiene en el móvil (interino) para no tocar el content-pipeline ni el esquema Zod.
 * NOTA: `sc-armas-prohibidas` (armas prohibidas, orden público) se deja a propósito en Seguridad
 * ciudadana; aquí van solo las del RÉGIMEN de armas reglamentadas.
 */
export const MATERIA_OVERRIDE_POR_INFRACCION: Record<string, Materia> = {
  'arma-sin-licencia-guia': 'armas',
  'arma-licencia-guia-caducada': 'armas',
  'arma-portar-fuera-supuestos': 'armas',
  'arma-transporte-indebido': 'armas',
  'arma-fogueo-aire-replica': 'armas',
  'arma-custodia-deposito': 'armas',
  'arma-documentacion-perdida': 'armas',
};

/**
 * Materia de una INFRACCIÓN para la navegación: el override interino si lo hay; si no, la materia de
 * su norma. Pura y determinista (fuente única para `listar`/`contar` por materia).
 */
export function materiaDeInfraccion(infId: string, normaCodigo: string): Materia {
  return MATERIA_OVERRIDE_POR_INFRACCION[infId] ?? materiaDeNorma(normaCodigo);
}

/**
 * Materias que PUEDEN tener contenido territorial (autonómico/municipal) y, por tanto, en las que
 * tiene sentido ofrecer la franja "solicítala" cuando el CCAA/municipio del perfil aún no lo trae.
 * Se DERIVA de `MATERIA_POR_TEMA` (los temas de las normas territoriales): hoy Tráfico (circulación,
 * ZBE), Ocio/convivencia (espectáculos, ruido, terrazas), Organización policial (coordinación de
 * PL, policía autonómica) y Animales. Materias puramente estatales (Penal, Extranjería, Seguridad
 * ciudadana, Armas, Víctima y menores) quedan fuera: allí la franja sería ruido. Fuente única, para
 * que una futura norma territorial de otra materia habilite la franja sin tocar la pantalla.
 */
const MATERIAS_TERRITORIALES: ReadonlySet<Materia> = new Set(Object.values(MATERIA_POR_TEMA));

/** `true` si la materia admite contenido autonómico/municipal (ver `MATERIAS_TERRITORIALES`). */
export function materiaAdmiteTerritorio(materia: Materia): boolean {
  return MATERIAS_TERRITORIALES.has(materia);
}

/** Recuento de una materia para el índice (grid de tarjetas de Normas). */
export interface ConteoMateria {
  materia: Materia;
  label: string;
  icono: string;
  count: number;
}

/**
 * Cuenta cuántas normas hay en cada materia, en el orden de `MATERIA_ORDEN`, OMITIENDO las materias
 * sin normas (count 0). Cuenta lo que se le pasa: el filtro por cuerpo/territorio se aplica ANTES
 * (la pantalla decide qué normas entran). Pura y determinista.
 */
export function contarPorMateria(normas: readonly NormaResumen[]): ConteoMateria[] {
  return MATERIA_ORDEN.map((materia) => {
    const info = MATERIA_INFO[materia];
    const count = normas.filter((n) => materiaDeNorma(n.codigo) === materia).length;
    return { materia, label: info.label, icono: info.icono, count };
  }).filter((c) => c.count > 0);
}

/** Sección de una materia agrupada por ámbito, para la pantalla de detalle de materia. */
export interface SeccionAmbito {
  ambito: Ambito;
  titulo: string;
  data: NormaResumen[];
}

/** Orden de los ámbitos en el detalle de materia: primero lo estatal, luego autonómico y municipal. */
const AMBITO_ORDEN: readonly Ambito[] = ['estatal', 'autonomico', 'municipal'];

/**
 * Agrupa las normas de UNA materia por ámbito (Estatal → Autonómico → Municipal), respetando dentro
 * de cada ámbito el orden de entrada (ya llega por código). Omite los ámbitos vacíos. El `titulo`
 * es la etiqueta base del ámbito; la pantalla puede enriquecerlo con el territorio ("En Canarias").
 * Pura y determinista.
 */
export function agruparPorAmbito(normas: readonly NormaResumen[]): SeccionAmbito[] {
  return AMBITO_ORDEN.map((ambito) => ({
    ambito,
    titulo: NORMA_AMBITO_LABEL[ambito],
    data: normas.filter((n) => n.ambito === ambito),
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

/** Ficha (infracción) para el listado por materia: lo mínimo para pintar la fila y abrir la ficha. */
export interface InfraccionResumen {
  id: string;
  tituloCorto: string;
  /** Gravedad del paquete ('leve' | 'grave' | 'muy_grave' | 'delito' | ...). Se pinta como etiqueta. */
  gravedad: string;
  /** 'administrativa' | 'penal' (para distinguir la vía en la fila). */
  tipo: string;
  /** Código de la norma de la que cuelga (p. ej. `LOSC`, `CP`), para la pastilla y el subtítulo. */
  normaCodigo: string;
}

interface FilaInfraccionMateria {
  id: string;
  titulo_corto: string;
  gravedad: string;
  tipo: string;
  norma_codigo: string;
}

/**
 * Lista las INFRACCIONES (fichas de calle) cuya norma pertenece a `materia`, respetando la cadena
 * territorial del perfil (estatal siempre; territorial solo si está en la cadena). Sirve para que la
 * navegación por materia muestre TAMBIÉN las fichas, no solo el articulado: así una materia como
 * "Seguridad ciudadana" —una sola ley (LOSC) pero con muchos tipos— deja de PARECER vacía. La
 * clasificación por materia se hace con `materiaDeNorma` sobre el código (mismo mapa que las normas).
 */
export async function listarInfraccionesDeMateria(
  runner: SqlRunner,
  materia: Materia,
  cadena: readonly string[] = [],
): Promise<InfraccionResumen[]> {
  const filtro = filtroTerritorialSql(cadena, 'i.territorio_id');
  const filas = await runner.getAll<FilaInfraccionMateria>(
    `SELECT i.id, i.titulo_corto, i.gravedad, i.tipo, n.codigo AS norma_codigo
       FROM infraccion i
       JOIN articulo a ON a.id = i.articulo_id
       JOIN norma    n ON n.id = a.norma_id
      WHERE ${filtro.sql}
      ORDER BY i.titulo_corto`,
    filtro.params,
  );
  return filas
    .filter((f) => materiaDeInfraccion(f.id, f.norma_codigo) === materia)
    .map((f) => ({
      id: f.id,
      tituloCorto: f.titulo_corto,
      gravedad: f.gravedad,
      tipo: f.tipo,
      normaCodigo: f.norma_codigo,
    }));
}

/**
 * Cuenta las INFRACCIONES (fichas) por materia, respetando la cadena territorial del perfil. Sirve
 * para el subtítulo de la tarjeta del índice ("N normas · M fichas"): así una materia con pocas
 * leyes pero muchas fichas (Seguridad ciudadana) no aparenta estar vacía ya desde el índice.
 */
export async function contarInfraccionesPorMateria(
  runner: SqlRunner,
  cadena: readonly string[] = [],
): Promise<Map<Materia, number>> {
  const filtro = filtroTerritorialSql(cadena, 'i.territorio_id');
  const filas = await runner.getAll<{ id: string; norma_codigo: string }>(
    `SELECT i.id, n.codigo AS norma_codigo
       FROM infraccion i
       JOIN articulo a ON a.id = i.articulo_id
       JOIN norma    n ON n.id = a.norma_id
      WHERE ${filtro.sql}`,
    filtro.params,
  );
  const conteo = new Map<Materia, number>();
  for (const f of filas) {
    const materia = materiaDeInfraccion(f.id, f.norma_codigo);
    conteo.set(materia, (conteo.get(materia) ?? 0) + 1);
  }
  return conteo;
}

// ---------------------------------------------------------------------------
// Sub-temas (submenús estilo SPPLB): materia → sub-tema → fichas. Solo para las
// materias DENSAS (tráfico, penal, seguridad ciudadana); el resto se navegan
// planas. La taxonomía es un MAPA INTERINO en la app (igual que MATERIA_POR_CODIGO),
// por id de infracción, sin tocar el content-pipeline ni el esquema Zod. Regla
// anti-vacío (docs/paridad-spplb.md): ningún grupo VISIBLE con menos de 3 fichas.
// ---------------------------------------------------------------------------

export type SubTemaId = string;

export interface SubTemaInfo {
  materia: Materia;
  label: string;
  /** Nombre de icono lucide (mismo patrón que MATERIA_INFO.icono). */
  icono: string;
  orden: number;
  /** Cajón "Otras/General": recoge lo no clasificado y va siempre al final. */
  esCajon?: boolean;
}

/** Materias que se navegan con submenú de sub-temas; el resto, planas. */
export const MATERIA_CON_SUBTEMAS: ReadonlySet<Materia> = new Set<Materia>([
  'trafico',
  'penal',
  'seguridad',
]);

export function materiaTieneSubtemas(materia: Materia): boolean {
  return MATERIA_CON_SUBTEMAS.has(materia);
}

export const SUBTEMA_INFO: Record<SubTemaId, SubTemaInfo> = {
  // --- Tráfico ---
  'traf-alcohol-velocidad': { materia: 'trafico', label: 'Alcohol, drogas y velocidad', icono: 'Gauge', orden: 1 },
  'traf-maniobras-senales': { materia: 'trafico', label: 'Maniobras, señales y prioridad', icono: 'Signpost', orden: 2 },
  'traf-documentacion': { materia: 'trafico', label: 'Documentación y seguro', icono: 'FileText', orden: 3 },
  'traf-estado-vehiculo': { materia: 'trafico', label: 'Estado, equipamiento y carga', icono: 'Wrench', orden: 4 },
  'traf-seguridad-pasiva': { materia: 'trafico', label: 'Cinturón, casco y sillita', icono: 'LifeBuoy', orden: 5 },
  'traf-distracciones': { materia: 'trafico', label: 'Móvil y distracciones', icono: 'Smartphone', orden: 6 },
  'traf-estacionamiento': { materia: 'trafico', label: 'Parada, estacionamiento y VMP', icono: 'SquareParking', orden: 7 },
  'traf-transporte': { materia: 'trafico', label: 'Transporte (LOTT)', icono: 'Truck', orden: 8 },
  'traf-delitos': { materia: 'trafico', label: 'Delitos contra la seguridad vial', icono: 'Gavel', orden: 9 },
  'traf-otras': { materia: 'trafico', label: 'Otras de tráfico', icono: 'BookOpen', orden: 99, esCajon: true },
  // --- Penal ---
  'pen-patrimonio': { materia: 'penal', label: 'Patrimonio', icono: 'Package', orden: 1 },
  'pen-personas': { materia: 'penal', label: 'Personas, violencia y libertad', icono: 'HeartPulse', orden: 2 },
  'pen-autoridad': { materia: 'penal', label: 'Autoridad y orden público', icono: 'Siren', orden: 3 },
  'pen-otros': { materia: 'penal', label: 'Otros delitos', icono: 'BookOpen', orden: 4, esCajon: true },
  // --- Seguridad ciudadana (sub-temas provisionales: es la materia más justa en volumen) ---
  'seg-orden-identidad': { materia: 'seguridad', label: 'Orden público e identificación', icono: 'IdCard', orden: 1 },
  'seg-drogas-armas': { materia: 'seguridad', label: 'Drogas, alcohol y armas', icono: 'Pill', orden: 2 },
  'seg-reuniones': { materia: 'seguridad', label: 'Reuniones, espectáculos y ocupación', icono: 'Megaphone', orden: 3 },
  'seg-otras': { materia: 'seguridad', label: 'Otras de seguridad ciudadana', icono: 'BookOpen', orden: 99, esCajon: true },
};

/** Mapa interino id de infracción → sub-tema (fuente única de la taxonomía). */
export const SUBTEMA_POR_INFRACCION: Record<string, SubTemaId> = {
  // Tráfico
  'inf-alcoholemia': 'traf-alcohol-velocidad',
  'inf-drogas-volante': 'traf-alcohol-velocidad',
  'inf-exceso-velocidad': 'traf-alcohol-velocidad',
  'inf-semaforo-rojo': 'traf-maniobras-senales',
  'inf-adelantamiento-antirreglamentario': 'traf-maniobras-senales',
  'inf-sin-senalizar-maniobra': 'traf-maniobras-senales',
  'inf-carril-reservado': 'traf-maniobras-senales',
  'inf-distancia-seguridad': 'traf-maniobras-senales',
  'inf-circular-arcen': 'traf-maniobras-senales',
  'inf-marcha-atras-indebida': 'traf-maniobras-senales',
  'inf-marcha-atras-autopista': 'traf-maniobras-senales',
  'inf-stop-ceda-el-paso': 'traf-maniobras-senales',
  'inf-prioridad-peatones': 'traf-maniobras-senales',
  'inf-sin-seguro': 'traf-documentacion',
  'inf-sin-permiso': 'traf-documentacion',
  'inf-sin-documentacion': 'traf-documentacion',
  'inf-matricula-oculta': 'traf-documentacion',
  'inf-alumbrado-deficiente': 'traf-estado-vehiculo',
  'inf-itv-caducada': 'traf-estado-vehiculo',
  'inf-neumaticos-mal-estado': 'traf-estado-vehiculo',
  'inf-lunas-tintadas': 'traf-estado-vehiculo',
  'inf-escape-ruido': 'traf-estado-vehiculo',
  'inf-luces-no-homologadas': 'traf-estado-vehiculo',
  'inf-sujecion-carga': 'traf-estado-vehiculo',
  'inf-sin-cinturon': 'traf-seguridad-pasiva',
  'inf-sin-casco': 'traf-seguridad-pasiva',
  'inf-menor-sin-sri': 'traf-seguridad-pasiva',
  'inf-movil-conduciendo': 'traf-distracciones',
  'inf-auriculares-conduciendo': 'traf-distracciones',
  'inf-claxon-indebido': 'traf-distracciones',
  'inf-estacionamiento-indebido': 'traf-estacionamiento',
  'inf-parada-lugar-peligroso': 'traf-estacionamiento',
  'inf-vmp-patinete': 'traf-estacionamiento',
  'inf-tacografo': 'traf-transporte',
  'inf-exceso-mma': 'traf-transporte',
  'inf-adr-mercancias-peligrosas': 'traf-transporte',
  'inf-transporte-sin-titulo': 'traf-transporte',
  'inf-transporte-privado-excede': 'traf-transporte',
  'inf-viajeros-sin-autorizacion': 'traf-transporte',
  'inf-viajeros-exceso-plazas': 'traf-transporte',
  'inf-viajeros-sin-billete': 'traf-transporte',
  'inf-transporte-escolar': 'traf-transporte',
  'inf-adr-documentacion': 'traf-transporte',
  'inf-adr-conductor-formacion': 'traf-transporte',
  'inf-perecederas-atp': 'traf-transporte',
  'inf-documentacion-control': 'traf-transporte',
  'inf-visado-transporte': 'traf-transporte',
  'inf-tacografo-sin-registros': 'traf-transporte',
  'del-alcoholemia-penal': 'traf-delitos',
  'del-velocidad-penal': 'traf-delitos',
  'del-conduccion-sin-permiso': 'traf-delitos',
  'del-abandono-accidente': 'traf-delitos',
  'inf-negativa-prueba': 'traf-delitos',
  'inf-conduccion-temeraria': 'traf-delitos',
  // Penal
  'del-hurto': 'pen-patrimonio',
  'del-robo-violencia': 'pen-patrimonio',
  'del-robo-fuerza-casa-habitada': 'pen-patrimonio',
  'del-danos': 'pen-patrimonio',
  'del-estafa': 'pen-patrimonio',
  'del-sustraccion-vehiculo': 'pen-patrimonio',
  'del-usurpacion': 'pen-patrimonio',
  'del-receptacion': 'pen-patrimonio',
  'del-lesiones': 'pen-personas',
  'del-lesiones-agravadas': 'pen-personas',
  'del-amenazas': 'pen-personas',
  'del-coacciones': 'pen-personas',
  'del-detencion-ilegal': 'pen-personas',
  'del-allanamiento-morada': 'pen-personas',
  'del-omision-socorro': 'pen-personas',
  'del-violencia-genero': 'pen-personas',
  'del-quebrantamiento': 'pen-personas',
  'del-atentado-agente': 'pen-autoridad',
  'del-resistencia-desobediencia': 'pen-autoridad',
  'del-desordenes-publicos': 'pen-autoridad',
  'del-trafico-drogas': 'pen-otros',
  'del-tenencia-armas': 'pen-otros',
  'del-falsedad-documental': 'pen-otros',
  'del-maltrato-animal': 'pen-otros',
  // Seguridad ciudadana
  'sc-identificacion-requerimiento': 'seg-orden-identidad',
  'sc-cacheo-registro': 'seg-orden-identidad',
  'sc-desobediencia-resistencia': 'seg-orden-identidad',
  'sc-negativa-identificarse': 'seg-orden-identidad',
  'sc-falta-respeto-agente': 'seg-orden-identidad',
  'sc-desordenes-obstaculizar-via': 'seg-orden-identidad',
  'sc-uso-imagenes-agentes': 'seg-orden-identidad',
  'sc-drogas-via-publica': 'seg-drogas-armas',
  'sc-consumo-alcohol-via-publica': 'seg-drogas-armas',
  'sc-armas-prohibidas': 'seg-drogas-armas',
  'sc-perturbacion-actos-espectaculos': 'seg-reuniones',
  'sc-reunion-no-comunicada': 'seg-reuniones',
  'sc-ocupacion-inmueble': 'seg-reuniones',
};

/** Sub-tema de una infracción por su id (mapa interino); `null` si no está clasificada. */
export function subtemaDeInfraccion(infId: string): SubTemaId | null {
  return SUBTEMA_POR_INFRACCION[infId] ?? null;
}

/** Un grupo de fichas bajo un sub-tema, listo para pintar (fila del submenú o pantalla). */
export interface GrupoSubtema {
  key: SubTemaId;
  label: string;
  icono: string;
  fichas: InfraccionResumen[];
}

const MIN_FICHAS_SUBTEMA = 3;

/**
 * Agrupa las fichas de una materia por sub-tema, ORDENADAS por `orden`, aplicando la regla
 * ANTI-VACÍO sobre las fichas realmente presentes (así la variabilidad territorial se resuelve
 * sola): ningún grupo con <3 fichas se muestra; las fichas de grupos flacos y las no clasificadas
 * caen al cajón "Otras"; si el cajón tampoco llega a 3, se funden en el grupo temático mayor (nunca
 * se emite un grupo de <3). Función PURA → cubierta por tests, sin RN ni SQLite.
 */
export function agruparPorSubtema(
  fichas: readonly InfraccionResumen[],
  materia: Materia,
): GrupoSubtema[] {
  const porTema = new Map<SubTemaId, InfraccionResumen[]>();
  const cajon: InfraccionResumen[] = [];
  for (const f of fichas) {
    const st = subtemaDeInfraccion(f.id);
    const info = st ? SUBTEMA_INFO[st] : undefined;
    if (st && info && info.materia === materia && !info.esCajon) {
      const arr = porTema.get(st);
      if (arr) arr.push(f);
      else porTema.set(st, [f]);
    } else {
      cajon.push(f); // no clasificada o mapeada al cajón
    }
  }
  const grupos: GrupoSubtema[] = [];
  for (const [st, fs] of porTema) {
    const info = SUBTEMA_INFO[st];
    if (!info) continue;
    if (fs.length < MIN_FICHAS_SUBTEMA) {
      cajon.push(...fs); // anti-vacío: grupo flaco → cajón
      continue;
    }
    grupos.push({ key: st, label: info.label, icono: info.icono, fichas: fs });
  }
  grupos.sort((a, b) => (SUBTEMA_INFO[a.key]?.orden ?? 0) - (SUBTEMA_INFO[b.key]?.orden ?? 0));
  if (cajon.length > 0) {
    const cajonId = Object.keys(SUBTEMA_INFO).find((id) => {
      const s = SUBTEMA_INFO[id];
      return s !== undefined && s.materia === materia && s.esCajon === true;
    });
    const cajonInfo = cajonId ? SUBTEMA_INFO[cajonId] : undefined;
    if (cajon.length >= MIN_FICHAS_SUBTEMA && cajonId && cajonInfo) {
      grupos.push({ key: cajonId, label: cajonInfo.label, icono: cajonInfo.icono, fichas: cajon });
    } else if (grupos.length > 0) {
      const mayor = grupos.reduce((a, b) => (b.fichas.length > a.fichas.length ? b : a));
      mayor.fichas.push(...cajon);
    } else if (cajonId && cajonInfo) {
      grupos.push({ key: cajonId, label: cajonInfo.label, icono: cajonInfo.icono, fichas: cajon });
    }
  }
  return grupos;
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
