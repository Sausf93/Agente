import { z } from 'zod';
import {
  Ambito,
  Cuerpo,
  CuerpoCompetente,
  GravedadPenal,
  Gravedad,
  OrigenContenido,
  TipoConsecuencia,
  TipoInfraccion,
  TipoNorma,
  TipoPlantilla,
  AmbitoFestivo,
  TipoTerritorio,
} from './enums.js';

/**
 * Modelo de CONTENIDO NORMATIVO (sección 6.1 de la especificación).
 *
 * Este contenido viaja del servidor al dispositivo en un paquete SQLite firmado
 * y es de SOLO LECTURA en la app. Todo es versionado: nunca se borra, se marca
 * `validTo` para cerrar la vigencia. Los identificadores son ULIDs/UUIDs en texto.
 */

const Id = z.string().min(1);
const FechaISO = z.string().datetime({ offset: true });
/** Fecha civil sin hora, formato YYYY-MM-DD. */
const FechaCivil = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato esperado YYYY-MM-DD');

/** Rango de vigencia común a todo el contenido versionado. */
const Vigencia = z.object({
  validFrom: FechaISO,
  validTo: FechaISO.nullable().default(null),
});

// ---------------------------------------------------------------------------
// Territorio (catálogo INE): CCAA → provincia → municipio
// ---------------------------------------------------------------------------
export const Territorio = z.object({
  id: Id,
  tipo: TipoTerritorio,
  nombre: z.string().min(1),
  padreId: Id.nullable().default(null),
  codigoIne: z.string().min(1),
});
export type Territorio = z.infer<typeof Territorio>;

// ---------------------------------------------------------------------------
// Norma y artículo
// ---------------------------------------------------------------------------
/**
 * Invariante de capa↔territorio (ADR-006): el ámbito estatal no lleva territorio; el
 * autonómico y el municipal lo llevan siempre. Reutilizado por Norma e Infraccion.
 */
const capaTerritorioValida = (o: { ambito: string; territorioId: string | null }): boolean =>
  o.ambito === 'estatal' ? o.territorioId === null : o.territorioId !== null;

/**
 * Todos los cuerpos, en orden estable. Es el valor por defecto de `Norma.cuerpos`: una norma
 * sin etiquetar es RELEVANTE para todos (conservador, no oculta contenido a nadie).
 */
export const CUERPOS_TODOS: readonly Cuerpo[] = Cuerpo.options;

export const Norma = z
  .object({
    id: Id,
    codigo: z.string().min(1), // p. ej. "RGC", "LSV"
    titulo: z.string().min(1),
    tipo: TipoNorma,
    ambito: Ambito,
    territorioId: Id.nullable().default(null), // solo autonómico/municipal
    origen: OrigenContenido.default('oficial'),
    urlBoe: z.string().url().nullable().default(null),
    fechaConsolidacion: FechaCivil.nullable().default(null),
    /**
     * Cuerpos que consultan esta norma habitualmente (relevancia, para filtrar la lista de
     * Normas por cuerpo del agente). NO es una restricción de acceso: solo prioriza. Por
     * defecto, todos los cuerpos (una norma sin etiquetar la ve todo el mundo).
     */
    cuerpos: z.array(Cuerpo).default(() => [...CUERPOS_TODOS]),
  })
  .refine(capaTerritorioValida, {
    message: 'El ámbito estatal no lleva territorio; el autonómico/municipal es obligatorio',
    path: ['territorioId'],
  });
export type Norma = z.infer<typeof Norma>;

export const Articulo = z
  .object({
    id: Id,
    normaId: Id,
    numero: z.string().min(1), // "11.1"
    titulo: z.string().nullable().default(null),
    texto: z.string(), // markdown consolidado
    /** Idioma del texto (ISO 639-1): 'es' y, para autonómicas, la lengua cooficial. */
    idioma: z.string().min(2).default('es'),
    orden: z.number().int().nonnegative(),
    hash: z.string().min(1), // hash del texto, para detección de cambios
  })
  .merge(Vigencia);
export type Articulo = z.infer<typeof Articulo>;

// ---------------------------------------------------------------------------
// Infracción: la unidad de consulta del agente en la calle
// ---------------------------------------------------------------------------

/** Competencia: qué cuerpos pueden denunciar y en qué vía (solo aviso orientativo, ADR-007). */
export const Competencia = z.object({
  cuerpos: z.array(CuerpoCompetente).default([]),
  via: z.enum(['urbana', 'interurbana', 'ambas']).default('ambas'),
});
export type Competencia = z.infer<typeof Competencia>;

/**
 * Variante de texto de boletín (p. ej. faro delantero/trasero, izquierdo/derecho).
 * `etiqueta` es la que ve el agente para elegir; `texto` es el párrafo copiable.
 */
export const VarianteBoletin = z.object({
  etiqueta: z.string().min(1),
  texto: z.string().min(1),
});
export type VarianteBoletin = z.infer<typeof VarianteBoletin>;

export const Infraccion = z
  .object({
    id: Id,
    articuloId: Id,
    codigoDgt: z.string().nullable().default(null),
    tituloCorto: z.string().min(1), // el que buscará el agente
    gravedad: Gravedad,
    tipo: TipoInfraccion,
    importeEur: z.number().nonnegative().nullable().default(null),
    importeReducidoEur: z.number().nonnegative().nullable().default(null),
    puntos: z.number().int().nonnegative().nullable().default(null),
    /**
     * Pena legible del delito (art. del CP), p. ej. "Prisión de 6 a 18 meses". Solo tiene
     * sentido en la vía penal; `null` en administrativas. La ficha la muestra en el bloque
     * "Marco penal" en vez de importe/pronto pago/puntos, que no existen en un delito.
     */
    penaTexto: z.string().min(1).nullable().default(null),
    /**
     * Gravedad penal según el art. 33 CP (leve/menos_grave/grave). Se expone aquí para pintar el
     * chip del marco penal en la ficha sin abrir el árbol de detención. `null` en administrativas.
     * NO es la misma escala que `gravedad` (leve/grave/muy_grave/delito), que es la administrativa.
     */
    gravedadPenal: GravedadPenal.nullable().default(null),
    /** Texto principal del boletín + variantes opcionales. */
    textoBoletin: z.string().min(1),
    variantesBoletin: z.array(VarianteBoletin).default([]),
    competencia: Competencia,
    ambito: Ambito,
    territorioId: Id.nullable().default(null),
    /**
     * Solapamiento de capas (ADR-006): id de la infracción de capa inferior que ESTA oculta.
     * `null` = solo añade (por defecto, conservador); relleno = sustituye/oculta a la inferior.
     * Solo una infracción autonómica o municipal puede desplazar; una estatal nunca.
     */
    desplazaId: Id.nullable().default(null),
    origen: OrigenContenido.default('oficial'),
  })
  .merge(Vigencia)
  .refine(capaTerritorioValida, {
    message: 'El ámbito estatal no lleva territorio; el autonómico/municipal es obligatorio',
    path: ['territorioId'],
  })
  .refine((i) => i.desplazaId === null || i.ambito !== 'estatal', {
    message: 'Una infracción estatal no puede desplazar a otra (evita bucles)',
    path: ['desplazaId'],
  });
export type Infraccion = z.infer<typeof Infraccion>;

// ---------------------------------------------------------------------------
// Buscador semántico: sinónimos "de calle"
// ---------------------------------------------------------------------------
export const Sinonimo = z
  .object({
    id: Id,
    termino: z.string().min(1), // "faro roto"
    peso: z.number().min(0).max(1).default(1),
    // Un sinónimo apunta a una infracción o a un artículo (exactamente uno).
    infraccionId: Id.nullable().default(null),
    articuloId: Id.nullable().default(null),
  })
  .refine((s) => Boolean(s.infraccionId) !== Boolean(s.articuloId), {
    message: 'Un sinónimo debe referenciar una infracción O un artículo, no ambos ni ninguno',
  });
export type Sinonimo = z.infer<typeof Sinonimo>;

// ---------------------------------------------------------------------------
// Capa de consecuencias (sección 4.6): reglas con fuente, no texto libre
// ---------------------------------------------------------------------------
export const Consecuencia = z
  .object({
    id: Id,
    tipo: TipoConsecuencia,
    regla: z.record(z.unknown()).default({}), // condiciones estructuradas
    textoCorto: z.string().min(1), // "Inmovilización (art. 104 LSV)"
    fuente: z.string().min(1), // artículo que la sustenta
    infraccionId: Id.nullable().default(null),
    articuloId: Id.nullable().default(null),
  })
  .refine((c) => Boolean(c.infraccionId) !== Boolean(c.articuloId), {
    message: 'Una consecuencia debe referenciar una infracción O un artículo',
  });
export type Consecuencia = z.infer<typeof Consecuencia>;

/**
 * Regla de detención para delitos (árbol LECrim + gravedad penal art. 33 CP).
 * Devuelve un texto ORIENTATIVO, nunca imperativo, y siempre con las fuentes.
 */
export const ReglaDetencion = z.object({
  id: Id,
  delitoArticuloId: Id,
  gravedadCp: GravedadPenal,
  flagranciaAplica: z.boolean(),
  textoResultado: z.string().min(1),
  fuentes: z.array(z.string()).min(1), // p. ej. ["LECrim 490", "LECrim 495"]
});
export type ReglaDetencion = z.infer<typeof ReglaDetencion>;

// ---------------------------------------------------------------------------
// Tabla de sustancias (sección 4.7)
// ---------------------------------------------------------------------------
// El modelo `Sustancia` vive en su propio módulo `./sustancias.ts` (esquema Zod + orientación
// consumo/tráfico y su pie de responsabilidad). Se re-exporta desde `index.ts`.

// ---------------------------------------------------------------------------
// Plantillas de documentos (sección 4.8)
// ---------------------------------------------------------------------------
export const Plantilla = z.object({
  id: Id,
  tipo: TipoPlantilla,
  titulo: z.string().min(1),
  cuerpoAplicable: z.array(z.string()).default([]), // cuerpos a los que aplica
  markdownConVariables: z.string().min(1), // usa {{fecha}}, {{lugar}}, {{articulo}}...
  version: z.number().int().positive().default(1),
});
export type Plantilla = z.infer<typeof Plantilla>;

// ---------------------------------------------------------------------------
// Textos de derechos multilingües (art. 520/771 LECrim, sección 4.11)
// ---------------------------------------------------------------------------
export const TextoDerechos = z.object({
  id: Id,
  articulo: z.enum(['520', '771']),
  idioma: z.string().min(2), // ISO 639-1
  texto: z.string().min(1),
  audioUrl: z.string().url().nullable().default(null),
});
export type TextoDerechos = z.infer<typeof TextoDerechos>;

// ---------------------------------------------------------------------------
// Festivos (para el cómputo del cuadrante)
// ---------------------------------------------------------------------------
export const Festivo = z.object({
  id: Id,
  fecha: FechaCivil,
  ambito: AmbitoFestivo,
  territorioId: Id.nullable().default(null),
  nombre: z.string().min(1),
});
export type Festivo = z.infer<typeof Festivo>;

// ---------------------------------------------------------------------------
// Tramos de carretera para el punto kilométrico (PostGIS, sección 4.10)
// ---------------------------------------------------------------------------
export const TramoCarretera = z.object({
  id: Id,
  via: z.string().min(1), // "A-7"
  territorioId: Id,
  /** Geometría GeoJSON LineString (lng,lat). Se procesa con PostGIS. */
  geometria: z.object({
    type: z.literal('LineString'),
    coordinates: z.array(z.tuple([z.number(), z.number()])).min(2),
  }),
  pkInicio: z.number(),
  pkFin: z.number(),
  sentidoRef: z.string().min(1),
});
export type TramoCarretera = z.infer<typeof TramoCarretera>;

// ---------------------------------------------------------------------------
// Versionado y publicación de contenido (sección 8)
// ---------------------------------------------------------------------------
export const ContentVersion = z.object({
  id: Id,
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Semver esperado X.Y.Z'),
  fecha: FechaISO,
  changelog: z.record(z.unknown()).default({}),
  urlPaquete: z.string().url(),
  hash: z.string().min(1), // firma/integridad del paquete SQLite
});
export type ContentVersion = z.infer<typeof ContentVersion>;

export const Novedad = z.object({
  id: Id,
  contentVersionId: Id,
  normaId: Id,
  articulos: z.array(z.string()).default([]),
  resumen: z.string().min(1),
  fecha: FechaISO,
});
export type Novedad = z.infer<typeof Novedad>;
