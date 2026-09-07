import {
  normalizarBusqueda,
  orientarSustancia,
  type ResultadoSustancia,
  type Sustancia,
} from '@agente/shared';
import type { SqlRunner } from '@/db/sqlRunner';

/**
 * NÚCLEO de la pantalla SUSTANCIAS (§4.7), agnóstico del motor SQLite.
 *
 * Lee la tabla `sustancia` del PAQUETE DE CONTENIDO (solo lectura) para orientar al agente entre
 * el "probable consumo propio" (posible infracción administrativa, LO 4/2015 art. 36.16) y los
 * "indicios de tráfico" (posible delito, art. 368 CP). Reutiliza el enfoque del buscador, la ficha
 * y Normas: la dependencia es SOLO `SqlRunner`, de modo que el MISMO SQL corre en el dispositivo
 * (`expo-sqlite`) y en los tests de integración (`node:sqlite`) contra el `.sqlite` REAL.
 *
 * El FILTRADO, la orientación y el aviso de pureza son funciones PURAS y deterministas (sin RN ni
 * SQLite), cubiertas por tests. La calificación consumo/tráfico es JUDICIAL y ORIENTATIVA: la UI
 * muestra SIEMPRE el pie de responsabilidad (`PIE_SUSTANCIAS`, de `@agente/shared`). Todo funciona
 * sin red (offline-first) y NO persiste ni envía ningún dato introducido por el agente.
 */

// ---------------------------------------------------------------------------
// Tipos de salida (lo que pintan las pantallas)
// ---------------------------------------------------------------------------

/** Sustancia para la lista (§4.7, nivel 1): nombre + jerga de calle, buscable. */
export interface SustanciaResumen {
  id: string;
  nombre: string;
  /** Jerga de calle ("coca", "farlopa", "maría"…), para mostrar y para el buscador. */
  aliases: string[];
  /** Estado editorial: la sustancia aún no ha pasado por el revisor jurídico. */
  pendienteRevision: boolean;
  /** Cadena normalizada (nombre + aliases) para el buscador de la lista. */
  textoBusqueda: string;
}

/** Sustancia completa (§4.7, nivel 2): el modelo `Sustancia` + la fecha y la base del peso. */
export interface SustanciaDetalle extends Sustancia {
  /** "Actualizado el…" — sale de `meta.fecha` (ISO 8601) del paquete. */
  actualizadoEn: string | null;
  /** Si el umbral está en peso PURO (hay que reducir a la riqueza) o en peso BRUTO. */
  basePeso: BasePeso;
}

// ---------------------------------------------------------------------------
// Fila cruda (nombres de columna del paquete)
// ---------------------------------------------------------------------------

interface FilaSustancia {
  id: string;
  nombre: string;
  /** JSON array de jerga de calle. */
  aliases: string;
  umbral_consumo_diario_mg: number;
  umbral_acopio_g: number;
  notas_pureza: string;
  /** JSON array de indicadores de tráfico. */
  indicadores_trafico: string;
  fuente: string;
  /** SQLite guarda el booleano como 0/1. */
  pendiente_revision: number;
  nota_revision: string;
}

// ---------------------------------------------------------------------------
// Lógica PURA (parseo defensivo, base del peso, filtrado y orientación)
// ---------------------------------------------------------------------------

/**
 * Parsea un JSON array de cadenas del paquete a `string[]`, de forma DEFENSIVA: tolera JSON roto,
 * nulo o con forma inesperada devolviendo `[]`. Nunca lanza, para que un dato raro no rompa la
 * pantalla. Descarta elementos que no sean cadena no vacía.
 */
export function parseArrayCadenas(raw: string | null | undefined): string[] {
  if (!raw) return [];
  let valor: unknown;
  try {
    valor = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(valor)) return [];
  return valor.filter((s): s is string => typeof s === 'string' && s.trim().length > 0);
}

/** Convierte una fila cruda del paquete en el modelo de dominio `Sustancia` (@agente/shared). */
export function filaASustancia(fila: FilaSustancia): Sustancia {
  return {
    id: fila.id,
    nombre: fila.nombre,
    aliases: parseArrayCadenas(fila.aliases),
    umbralConsumoDiarioMg: fila.umbral_consumo_diario_mg,
    umbralAcopioG: fila.umbral_acopio_g,
    notasPureza: fila.notas_pureza,
    indicadoresTrafico: parseArrayCadenas(fila.indicadores_trafico),
    fuente: fila.fuente,
    pendienteRevision: fila.pendiente_revision !== 0,
    notaRevision: fila.nota_revision,
  };
}

/** Base sobre la que está expresado el umbral de acopio de una sustancia. */
export type BasePeso = 'puro' | 'bruto';

/**
 * Decide si el umbral de una sustancia está en peso PURO o en peso BRUTO a partir de sus notas de
 * pureza (dato del paquete). Para cocaína, heroína, MDMA, anfetamina y metanfetamina el umbral es
 * de sustancia PURA (hay que reducir la cantidad a la riqueza del laboratorio antes de comparar);
 * para cannabis y hachís es peso BRUTO del material.
 *
 * Pura y data-driven: si las notas mencionan "peso bruto" → `'bruto'`; si mencionan pureza →
 * `'puro'`. Ante la duda cae en `'bruto'` (no aplica reducción automática), pero la UI muestra
 * igualmente las notas de pureza para que el agente lo valore. Esto lo pidió el revisor jurídico:
 * no sobre-marcar "tráfico" con droga callejera de baja riqueza.
 */
export function basePesoUmbral(notasPureza: string): BasePeso {
  if (/peso\s+bruto/i.test(notasPureza)) return 'bruto';
  if (/pur[ao]/i.test(notasPureza)) return 'puro';
  return 'bruto';
}

/**
 * Aviso DESTACADO de pureza para las sustancias cuyo umbral está en peso PURO. Recuerda reducir la
 * cantidad aprehendida a la riqueza real del análisis de laboratorio antes de comparar con el
 * umbral, para no confundir peso bruto con principio activo.
 */
export const AVISO_PUREZA_PURO =
  'El umbral de esta sustancia está en peso PURO. Antes de comparar, conviene reducir la cantidad ' +
  'aprehendida a la riqueza real del análisis de laboratorio (su porcentaje de pureza). Con droga ' +
  'de baja riqueza, el peso bruto puede superar el umbral sin que corresponda a tráfico.';

/** Aviso para las sustancias cuyo umbral se mide sobre el peso bruto del material. */
export const AVISO_PUREZA_BRUTO =
  'El umbral de esta sustancia se refiere al peso BRUTO del material (no se reduce a principio ' +
  'activo puro).';

/**
 * Interpreta la cantidad tecleada por el agente (en gramos). Acepta coma o punto decimal (uso
 * español) y devuelve un número positivo, o `null` si el texto está vacío o no es un número válido.
 * Pura, para poder testear el parseo sin la UI.
 */
export function parseCantidadG(texto: string): number | null {
  const limpio = texto.trim().replace(',', '.');
  if (limpio.length === 0) return null;
  if (!/^\d*\.?\d+$/.test(limpio)) return null;
  const n = Number.parseFloat(limpio);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

/**
 * Interpreta el porcentaje de pureza tecleado (0 < pureza ≤ 100). Acepta coma/punto y un `%`
 * final. Devuelve `null` si está vacío o fuera de rango. Pura.
 */
export function parsePurezaPct(texto: string): number | null {
  const limpio = texto.trim().replace('%', '').replace(',', '.');
  if (limpio.length === 0) return null;
  if (!/^\d*\.?\d+$/.test(limpio)) return null;
  const n = Number.parseFloat(limpio);
  if (!Number.isFinite(n) || n <= 0 || n > 100) return null;
  return n;
}

/** Reduce una cantidad bruta (g) a su equivalente de sustancia pura según la riqueza (%). Pura. */
export function reducirAPureza(cantidadG: number, purezaPct: number): number {
  const reducida = (cantidadG * purezaPct) / 100;
  // Redondeo a la milésima de gramo (precisión de miligramo): evita ruido de coma flotante.
  return Math.round(reducida * 1000) / 1000;
}

/** Orientación calculada: qué cantidad se comparó de verdad, si se aplicó pureza y el resultado. */
export interface OrientacionCalculada {
  /** Base del umbral de la sustancia (peso puro vs. bruto). */
  base: BasePeso;
  /** Pureza aplicada (%), o `null` si no se aplicó (peso bruto, o sin dato de pureza). */
  purezaAplicada: number | null;
  /** Cantidad realmente comparada con el umbral (reducida a pureza si procedía). */
  cantidadComparadaG: number;
  /** Resultado orientativo de `orientarSustancia` (@agente/shared): titular, motivo, pie… */
  resultado: ResultadoSustancia;
}

/**
 * Orienta consumo/tráfico a partir de la cantidad aprehendida y, cuando el umbral es de peso PURO
 * y el agente aporta la pureza, REDUCIENDO antes la cantidad a su riqueza real (lo que pidió el
 * revisor jurídico para no sobre-marcar tráfico). Delega el veredicto orientativo en
 * `orientarSustancia` de `@agente/shared` (fuente única del motor): esta función solo decide QUÉ
 * cantidad se compara. Pura y determinista.
 */
export function calcularOrientacion(
  sustancia: Sustancia,
  cantidadG: number,
  purezaPct: number | null,
): OrientacionCalculada {
  const base = basePesoUmbral(sustancia.notasPureza);
  const aplicaPureza = base === 'puro' && purezaPct !== null;
  const cantidadComparadaG = aplicaPureza ? reducirAPureza(cantidadG, purezaPct) : cantidadG;
  return {
    base,
    purezaAplicada: aplicaPureza ? purezaPct : null,
    cantidadComparadaG,
    resultado: orientarSustancia(sustancia, cantidadComparadaG),
  };
}

/**
 * Filtra la lista de sustancias por la consulta del agente (buscador de la pantalla). Busca en el
 * nombre y en la jerga de calle, con tildes/ñ plegadas. Consulta vacía → todas. Pura.
 */
export function filtrarSustancias(
  items: readonly SustanciaResumen[],
  consulta: string,
): SustanciaResumen[] {
  const q = normalizarBusqueda(consulta);
  if (q.length === 0) return [...items];
  return items.filter((it) => it.textoBusqueda.includes(q));
}

/** "también: coca · farlopa · perico" — resumen de la jerga de calle para la fila de la lista. */
export function aliasesLabel(aliases: readonly string[]): string | null {
  if (aliases.length === 0) return null;
  return `también: ${aliases.join(' · ')}`;
}

// ---------------------------------------------------------------------------
// Consultas al paquete (usan SqlRunner; combinan SQL con las funciones puras)
// ---------------------------------------------------------------------------

/** Lista todas las sustancias del paquete (nombre + aliases), ordenadas por nombre. Offline. */
export async function listarSustancias(runner: SqlRunner): Promise<SustanciaResumen[]> {
  const filas = await runner.getAll<Pick<FilaSustancia, 'id' | 'nombre' | 'aliases' | 'pendiente_revision'>>(
    `SELECT id, nombre, aliases, pendiente_revision
       FROM sustancia
      ORDER BY nombre COLLATE NOCASE`,
  );
  return filas.map<SustanciaResumen>((f) => {
    const aliases = parseArrayCadenas(f.aliases);
    return {
      id: f.id,
      nombre: f.nombre,
      aliases,
      pendienteRevision: f.pendiente_revision !== 0,
      textoBusqueda: normalizarBusqueda(`${f.nombre} ${aliases.join(' ')}`),
    };
  });
}

/** Carga una sustancia completa (umbrales, pureza, indicadores, fuente) + fecha. `null` si no existe. */
export async function cargarSustancia(
  runner: SqlRunner,
  sustanciaId: string,
): Promise<SustanciaDetalle | null> {
  const fila = await runner.getFirst<FilaSustancia>(
    `SELECT id, nombre, aliases, umbral_consumo_diario_mg, umbral_acopio_g,
            notas_pureza, indicadores_trafico, fuente, pendiente_revision, nota_revision
       FROM sustancia
      WHERE id = ?`,
    [sustanciaId],
  );
  if (!fila) return null;

  const meta = await runner.getFirst<{ valor: string }>(
    `SELECT valor FROM meta WHERE clave = 'fecha'`,
  );

  const sustancia = filaASustancia(fila);
  return {
    ...sustancia,
    actualizadoEn: meta?.valor ?? null,
    basePeso: basePesoUmbral(sustancia.notasPureza),
  };
}

// ---------------------------------------------------------------------------
// Etiquetas de dominio (UI en español)
// ---------------------------------------------------------------------------

/** "20.000 mg (20 g)" — dosis de consumo diario legible (mg y su equivalente en g). */
export function consumoDiarioLabel(umbralConsumoDiarioMg: number): string {
  const mg = umbralConsumoDiarioMg.toLocaleString('es-ES');
  const g = (umbralConsumoDiarioMg / 1000).toLocaleString('es-ES', { maximumFractionDigits: 3 });
  return `${mg} mg (${g} g)`;
}

/** "100 g" — umbral de acopio para consumo propio, con la unidad. */
export function acopioLabel(umbralAcopioG: number): string {
  return `${umbralAcopioG.toLocaleString('es-ES', { maximumFractionDigits: 3 })} g`;
}
