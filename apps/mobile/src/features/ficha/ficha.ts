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
export type FichaKind =
  | 'penal'
  | 'seguridad_ciudadana'
  | 'trafico'
  | 'administrativa'
  | 'extranjeria';

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
 *  2. Norma de EXTRANJERÍA (LO 4/2000, código `LOEX`) → `extranjeria`: la sanción real suele ser la
 *     EXPULSIÓN, no la multa; NO se destaca el importe (501 €) como dato principal (ADR-004, §4.4).
 *  3. Norma de seguridad ciudadana (LO 4/2015, código `LOSC`) → `seguridad_ciudadana` (sin puntos).
 *  4. Detrae puntos → `trafico` (solo el tráfico detrae puntos).
 *  5. Norma de tráfico por su código (LSV/RGC/RGV/LRCSCVM…) → `trafico`.
 *  6. Resto → `administrativa` (importe, sin puntos ni tramo).
 *
 * (El `marcoImporte` del pipeline —`extranjeria`, `penal`…— no viaja en el paquete; aquí se DERIVA
 * del código de norma, que sí viaja, para dar el mismo trato a la ficha jurídicamente delicada.)
 */
export function fichaKindFrom(f: {
  tipo: TipoInfraccion;
  gravedad: Gravedad;
  puntos: number | null;
  normaCodigo: string;
}): FichaKind {
  if (f.tipo === 'penal' || f.gravedad === 'delito') return 'penal';
  if (/\bLOEX\b|extranjer/i.test(f.normaCodigo)) return 'extranjeria';
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
 *  - `extranjeria`: "Sanción: multa o expulsión" (cualitativo, MANDA) + multa mínima DE-ENFATIZADA.
 *    La sanción real de la estancia irregular suele ser la expulsión, no la multa (§4.4, ADR-004);
 *    por eso el importe NO va como tile de acento.
 *  - `administrativa`: importe* + pronto pago?
 *
 * `formatEuros` se inyecta para no acoplar este módulo (puro, testeable) al formato de la UI.
 */
export function tilesFicha(
  ficha: FichaInfraccion,
  formatEuros: (n: number | null) => string,
): TileFicha[] {
  if (ficha.fichaKind === 'penal') return [];
  // Extranjería: el dato principal NO es el importe. Se muestra la naturaleza de la sanción (multa
  // o expulsión) como tile que manda, y la multa mínima solo como referencia de-enfatizada.
  if (ficha.fichaKind === 'extranjeria') {
    const tiles: TileFicha[] = [{ etiqueta: 'Sanción', valor: 'Multa o expulsión' }];
    if (ficha.importeEur !== null) {
      tiles.push({ etiqueta: 'Multa desde', valor: formatEuros(ficha.importeEur) });
    }
    return tiles;
  }
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

/**
 * ACCIÓN OPERATIVA (rediseño 2026-09, feedback "validadores de calle"): lo PRIMERO que decide un
 * agente en el arcén o la vía no es el importe, sino QUÉ HACE con el vehículo o la persona. Se
 * deriva del set de `consecuencias` de la ficha y se pinta ARRIBA DEL TODO como un chip grande.
 *
 * Reglas (de más a menos coercitiva; gana la primera que aparezca):
 *  detención → depósito/grúa → inmovilización → decomiso → retirada de permiso.
 * Si NO hay ninguna medida coercitiva:
 *  - ficha `penal`: `null` (manda el bloque penal; no forzamos un "sigue" que sería falso).
 *  - resto: estado POSITIVO explícito `sigue` ("el vehículo/persona sigue · solo denuncia"), tan
 *    visible como el rojo para que el agente no tenga que interpretar la ausencia de aviso.
 *
 * Colores del chip: SIEMPRE semánticos FIJOS (no el acento por cuerpo). `coercitivo` = rojo,
 * `positivo` = verde. Lenguaje ORIENTATIVO: la detención se enuncia como "atestado + detención",
 * nunca en imperativo ("detén"); la valoración final es del agente y, en su caso, del juez.
 */
export type AccionOperativaKind =
  | 'sigue'
  | 'inmovilizacion'
  | 'deposito'
  | 'decomiso'
  | 'retirada'
  | 'identificacion'
  | 'detencion';

export interface AccionOperativa {
  kind: AccionOperativaKind;
  /** Etiqueta corta y contundente para el chip grande (leer-primero). */
  titulo: string;
  /** Subtexto orientativo de una línea. */
  detalle: string;
  /** Fuente (artículo) de la consecuencia que la origina; `null` en el estado positivo. */
  fuente: string | null;
  /**
   * Tono semántico FIJO (nunca el acento por cuerpo): `coercitivo` (rojo), `positivo` (verde) o
   * `informativo` (azul) para la identificación por vía administrativa —ni "sigue" ni detención—.
   */
  tono: 'coercitivo' | 'positivo' | 'informativo';
}

/** Orden de prioridad: la medida más coercitiva manda sobre el resto si concurren varias. */
const PRIORIDAD_COERCITIVA: {
  tipo: TipoConsecuencia;
  kind: AccionOperativaKind;
  titulo: string;
  detalle: string;
}[] = [
  {
    tipo: 'detencion',
    kind: 'detencion',
    titulo: 'Atestado + detención',
    detalle: 'Procede instruir atestado; valora la detención según el precepto citado.',
  },
  {
    tipo: 'deposito',
    kind: 'deposito',
    titulo: 'Grúa y depósito',
    detalle: 'Procede la retirada del vehículo al depósito.',
  },
  {
    tipo: 'inmovilizacion',
    kind: 'inmovilizacion',
    titulo: 'Inmovilizo el vehículo',
    detalle: 'El vehículo no continúa hasta subsanar la causa.',
  },
  {
    tipo: 'decomiso',
    kind: 'decomiso',
    titulo: 'Intervengo · decomiso',
    detalle: 'Procede la intervención del objeto o la sustancia.',
  },
  {
    tipo: 'retirada_permiso',
    kind: 'retirada',
    titulo: 'Retirada de permiso',
    detalle: 'Procede la retirada del permiso o licencia según el precepto.',
  },
];

/**
 * Deriva la acción operativa de una ficha a partir de su `fichaKind` y del set de consecuencias.
 * Puro y testeable (no depende de React ni del tema).
 */
export function accionOperativaFrom(input: {
  fichaKind: FichaKind;
  consecuencias: { tipo: TipoConsecuencia; fuente: string }[];
}): AccionOperativa | null {
  for (const regla of PRIORIDAD_COERCITIVA) {
    const encontrada = input.consecuencias.find((c) => c.tipo === regla.tipo);
    if (encontrada) {
      return {
        kind: regla.kind,
        titulo: regla.titulo,
        detalle: regla.detalle,
        fuente: encontrada.fuente,
        tono: 'coercitivo',
      };
    }
  }

  // Sin medida coercitiva: en un delito no forzamos "sigue" (sería falso); manda el bloque penal.
  if (input.fichaKind === 'penal') return null;
  // El sujeto es PERSONA cuando no hay vehículo de por medio (seguridad ciudadana, extranjería).
  const sujetoPersona =
    input.fichaKind === 'seguridad_ciudadana' || input.fichaKind === 'extranjeria';

  // IDENTIFICACIÓN por vía administrativa (extranjería, art. 53.1.a / 61 LOEX): el mensaje CLAVE es
  // que NO procede la detención PENAL por la mera estancia irregular. Solo aplica al SUJETO PERSONA
  // (no a un caso de tráfico donde el sujeto es el vehículo, que sigue circulando).
  const identificacion = input.consecuencias.find((c) => c.tipo === 'identificacion');
  if (sujetoPersona && identificacion) {
    return {
      kind: 'identificacion',
      titulo: 'Identificar · vía administrativa · NO detención penal',
      detalle:
        'Procede identificar y comprobar la documentación; la situación se tramita por vía ' +
        'administrativa (multa o expulsión, art. 53.1.a LOEX). Cualquier internamiento cautelar lo ' +
        'acuerda la autoridad competente con los requisitos del art. 61 LOEX.',
      fuente: identificacion.fuente,
      tono: 'informativo',
    };
  }

  const sujeto = sujetoPersona ? 'La persona' : 'El vehículo';
  return {
    kind: 'sigue',
    titulo: `${sujeto} sigue · solo denuncia`,
    detalle: sujetoPersona
      ? 'Sin medida sobre la persona: únicamente se formula el boletín/denuncia.'
      : 'Sin medida sobre el vehículo: únicamente se formula el boletín.',
    fuente: null,
    tono: 'positivo',
  };
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
