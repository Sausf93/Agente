import {
  Competencia,
  VarianteBoletin,
  type EstadoRevision,
  type Gravedad,
  type GravedadPenal,
  type TipoConsecuencia,
  type TipoInfraccion,
} from '@agente/shared';
import type { SqlRunner } from '@/db/sqlRunner';

/**
 * Carga de la FICHA de infracción (§4.4), agnóstica del motor SQLite.
 *
 * Compone lo que la pantalla necesita EN EL ORDEN del §4.4: cabecera (título, norma+artículo,
 * gravedad/tipo), importes/puntos, texto de boletín, consecuencias con su fuente (§4.6,
 * lenguaje orientativo), competencia, artículo completo (desplegable) y el pie
 * "Actualizado el… · Fuente". Incluye `estadoRevision`/`notaRevision` para el distintivo
 * "pendiente de revisión / a verificar" que exige el contrato del pipeline.
 */

export interface ConsecuenciaFicha {
  tipo: TipoConsecuencia;
  textoCorto: string;
  fuente: string;
  /** Regla estructurada (JSON del paquete). En `detencion` alimenta el árbol interactivo (§4.6). */
  regla: Record<string, unknown> | null;
}

/**
 * Variante de la FICHA según el marco sancionador. Decide qué bloques de datos se pintan
 * (marco penal vs importe/puntos vs tramo) y el idioma de la copia (atestado vs boletín).
 *
 * Puente hasta que el modelo traiga un `marcoSancionador` explícito (ADR pendiente, ver el plan
 * de diseño): se DERIVA de datos que ya viajan en el paquete (tipo/gravedad, código de norma y
 * la presencia de puntos). La derivación vive aquí (carga), no en la pantalla, para que sea pura
 * y testeable.
 */
export type FichaKind = 'penal' | 'seguridad_ciudadana' | 'trafico' | 'administrativa';

/** Un tile de dato clave de la ficha (importe / pronto pago / puntos / tramo). */
export interface TileFicha {
  etiqueta: string;
  valor: string;
  /** El tile que "manda" (el importe): borde y fondo de acento sutiles. */
  enfasis?: boolean;
}

export interface FichaInfraccion {
  infraccionId: string;
  tituloCorto: string;
  gravedad: Gravedad;
  tipo: TipoInfraccion;
  /** Variante derivada (penal/tráfico/seguridad ciudadana/administrativa): decide la forma. */
  fichaKind: FichaKind;
  importeEur: number | null;
  importeReducidoEur: number | null;
  puntos: number | null;
  /** Marco penal (solo delitos): pena legible (art. del CP) y gravedad del art. 33 CP. */
  penaTexto: string | null;
  gravedadPenal: GravedadPenal | null;
  textoBoletin: string;
  variantesBoletin: VarianteBoletin[];
  competencia: Competencia;
  estadoRevision: EstadoRevision;
  notaRevision: string | null;
  /** Fuente visible (§4.4 pie): código de norma + nº de artículo + enlace al BOE. */
  normaCodigo: string;
  articuloNumero: string;
  urlBoe: string | null;
  /** Texto del artículo (desplegable) y su título. */
  articuloTitulo: string | null;
  articuloTexto: string;
  consecuencias: ConsecuenciaFicha[];
  /** "Actualizado el…" — sale de `meta.fecha` (ISO 8601). */
  actualizadoEn: string | null;
}

interface FilaFicha {
  infraccion_id: string;
  titulo_corto: string;
  gravedad: Gravedad;
  tipo: TipoInfraccion;
  importe_eur: number | null;
  importe_reducido_eur: number | null;
  puntos: number | null;
  pena_texto: string | null;
  gravedad_penal: GravedadPenal | null;
  texto_boletin: string;
  variantes_boletin: string;
  competencia: string;
  estado_revision: EstadoRevision;
  nota_revision: string | null;
  norma_codigo: string;
  url_boe: string | null;
  articulo_numero: string;
  articulo_titulo: string | null;
  articulo_texto: string;
}

interface FilaConsecuencia {
  tipo: TipoConsecuencia;
  texto_corto: string;
  fuente: string;
  regla: string;
}

/**
 * Deriva el `FichaKind` a partir de los datos que ya trae el paquete. Reglas, en orden:
 *  1. Vía penal (o gravedad `delito`) → `penal` (manda la pena y la detención, no importes).
 *  2. Norma de seguridad ciudadana (LO 4/2015, código `LOSC`) → `seguridad_ciudadana` (sin puntos).
 *  3. Detrae puntos → `trafico` (solo el tráfico detrae puntos).
 *  4. Norma de tráfico por su código (LSV/RGC/RGV/LRCSCVM…) → `trafico`.
 *  5. Resto → `administrativa` (importe, sin puntos ni tramo).
 */
export function fichaKindFrom(f: {
  tipo: TipoInfraccion;
  gravedad: Gravedad;
  puntos: number | null;
  normaCodigo: string;
}): FichaKind {
  if (f.tipo === 'penal' || f.gravedad === 'delito') return 'penal';
  if (/\bLOSC\b|seguridad ciudadana/i.test(f.normaCodigo)) return 'seguridad_ciudadana';
  if (f.puntos !== null) return 'trafico';
  if (/\bLSV\b|\bRGC\b|\bRGV\b|\bLRCSCVM\b|circulaci|tr[aá]fico/i.test(f.normaCodigo)) {
    return 'trafico';
  }
  return 'administrativa';
}

/** Etiqueta cualitativa del TRAMO de seguridad ciudadana (art. 33/39 LO 4/2015), desde la gravedad. */
const TRAMO_LABEL: Partial<Record<Gravedad, string>> = {
  leve: 'Leve',
  grave: 'Grave',
  muy_grave: 'Muy grave',
};

/**
 * Tiles de datos que se pintan en la ficha SEGÚN EL TIPO y con la regla de oro "solo con valor"
 * (nunca un tile con "—"):
 *  - `penal`: NINGUNO (usa el bloque "Marco penal", no tiles de tráfico).
 *  - `trafico`: importe* + pronto pago? + puntos?
 *  - `seguridad_ciudadana`: importe* + pronto pago? + tramo (cualitativo; NUNCA puntos).
 *  - `administrativa`: importe* + pronto pago?
 *
 * `formatEuros` se inyecta para no acoplar este módulo (puro, testeable) al formato de la UI.
 */
export function tilesFicha(
  ficha: FichaInfraccion,
  formatEuros: (n: number | null) => string,
): TileFicha[] {
  if (ficha.fichaKind === 'penal') return [];
  const tiles: TileFicha[] = [];
  if (ficha.importeEur !== null) {
    tiles.push({ etiqueta: 'Importe', valor: formatEuros(ficha.importeEur), enfasis: true });
  }
  if (ficha.importeReducidoEur !== null) {
    tiles.push({ etiqueta: 'Pronto pago', valor: formatEuros(ficha.importeReducidoEur) });
  }
  if (ficha.fichaKind === 'seguridad_ciudadana') {
    const tramo = TRAMO_LABEL[ficha.gravedad];
    if (tramo) tiles.push({ etiqueta: 'Tramo', valor: tramo });
  } else if (ficha.puntos !== null) {
    tiles.push({ etiqueta: 'Puntos', valor: String(ficha.puntos) });
  }
  return tiles;
}

/** Parseo tolerante del JSON de `regla` de una consecuencia (defensivo ante contenido inesperado). */
function parseRegla(json: string): Record<string, unknown> | null {
  try {
    const obj = JSON.parse(json);
    return obj && typeof obj === 'object' ? (obj as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** Parseo tolerante del JSON de competencia (defensivo ante contenido inesperado). */
function parseCompetencia(json: string): Competencia {
  try {
    return Competencia.parse(JSON.parse(json));
  } catch {
    return Competencia.parse({ cuerpos: [], via: 'ambas' });
  }
}

/** Parseo tolerante del JSON de variantes de boletín. */
function parseVariantes(json: string): VarianteBoletin[] {
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr.map((v) => VarianteBoletin.parse(v)) : [];
  } catch {
    return [];
  }
}

/**
 * Carga la ficha completa de una infracción. Devuelve `null` si el id no existe en el paquete.
 */
export async function cargarFicha(
  runner: SqlRunner,
  infraccionId: string,
): Promise<FichaInfraccion | null> {
  const fila = await runner.getFirst<FilaFicha>(
    `SELECT i.id AS infraccion_id, i.titulo_corto, i.gravedad, i.tipo, i.importe_eur,
            i.importe_reducido_eur, i.puntos, i.pena_texto, i.gravedad_penal,
            i.texto_boletin, i.variantes_boletin,
            i.competencia, i.estado_revision, i.nota_revision,
            n.codigo AS norma_codigo, n.url_boe,
            a.numero AS articulo_numero, a.titulo AS articulo_titulo, a.texto AS articulo_texto
       FROM infraccion i
       JOIN articulo a ON a.id = i.articulo_id
       JOIN norma    n ON n.id = a.norma_id
      WHERE i.id = ?`,
    [infraccionId],
  );
  if (!fila) return null;

  const consecuencias = await runner.getAll<FilaConsecuencia>(
    `SELECT tipo, texto_corto, fuente, regla
       FROM consecuencia
      WHERE infraccion_id = ?`,
    [infraccionId],
  );

  const meta = await runner.getFirst<{ valor: string }>(
    `SELECT valor FROM meta WHERE clave = 'fecha'`,
  );

  return {
    infraccionId: fila.infraccion_id,
    tituloCorto: fila.titulo_corto,
    gravedad: fila.gravedad,
    tipo: fila.tipo,
    fichaKind: fichaKindFrom({
      tipo: fila.tipo,
      gravedad: fila.gravedad,
      puntos: fila.puntos,
      normaCodigo: fila.norma_codigo,
    }),
    importeEur: fila.importe_eur,
    importeReducidoEur: fila.importe_reducido_eur,
    puntos: fila.puntos,
    penaTexto: fila.pena_texto,
    gravedadPenal: fila.gravedad_penal,
    textoBoletin: fila.texto_boletin,
    variantesBoletin: parseVariantes(fila.variantes_boletin),
    competencia: parseCompetencia(fila.competencia),
    estadoRevision: fila.estado_revision,
    notaRevision: fila.nota_revision,
    normaCodigo: fila.norma_codigo,
    articuloNumero: fila.articulo_numero,
    urlBoe: fila.url_boe,
    articuloTitulo: fila.articulo_titulo,
    articuloTexto: fila.articulo_texto,
    consecuencias: consecuencias.map((c) => ({
      tipo: c.tipo,
      textoCorto: c.texto_corto,
      fuente: c.fuente,
      regla: parseRegla(c.regla),
    })),
    actualizadoEn: meta?.valor ?? null,
  };
}
