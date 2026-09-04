import { DOMParser } from '@xmldom/xmldom';
import type { Document, Element, Node } from '@xmldom/xmldom';
import { Articulo, Norma } from '@agente/shared';
import type { EntradaCatalogo } from '../../catalogo.js';
import { hashTexto } from './hash.js';
import { lineaEncabezadoArticulo, versionAMarkdown } from './markdown.js';

/**
 * Parser del XML de legislación consolidada del BOE → `Norma` + `Articulo[]`
 * de `@agente/shared` (sección 6.1). Fuente única de tipos: nada se publica sin pasar
 * por los esquemas Zod de shared, que se aplican al final de este módulo.
 *
 * Decisiones de mapeo (documentadas en el README y anotadas donde chocan con la spec):
 *  - Granularidad = un `Articulo` por bloque `tipo="precepto"` (un "Artículo N", una
 *    disposición…). El apartado ("11.1" del ejemplo de la spec) queda direccionable
 *    DENTRO del texto; partir por apartado desde texto libre no es fiable y se deja
 *    como refinamiento posterior. `numero` guarda "5", "único", "5 bis"…
 *  - De cada precepto con historial se elige la versión vigente: la de mayor
 *    `fecha_vigencia` que no sea futura respecto a la fecha de referencia.
 *  - Se ignoran `preambulo`, `encabezado` (títulos/capítulos) y notas: no son artículos.
 */

const NODO_ELEMENTO = 1;

function esElemento(nodo: Node): nodo is Element {
  return nodo.nodeType === NODO_ELEMENTO;
}

function hijosElemento(nodo: Node): Element[] {
  const lista = nodo.childNodes;
  const salida: Element[] = [];
  for (let i = 0; i < lista.length; i += 1) {
    const hijo = lista.item(i);
    if (hijo && esElemento(hijo)) salida.push(hijo);
  }
  return salida;
}

function parsearXml(xml: string): Document {
  const parser = new DOMParser({
    // El XML del BOE trae elementos vacíos (<img/>, <col/>): válidos como XML.
    // Silenciamos warnings y solo dejamos que un fatalError detenga el parseo.
    onError: (nivel: string, mensaje: string) => {
      if (nivel === 'fatalError') {
        throw new Error(`XML del BOE mal formado: ${mensaje}`);
      }
    },
  });
  return parser.parseFromString(xml, 'text/xml');
}

function textoDe(doc: Document | Element, etiqueta: string): string | null {
  const nodos = doc.getElementsByTagName(etiqueta);
  const primero = nodos.item(0);
  const valor = primero?.textContent ?? null;
  return valor ? valor.trim() : null;
}

/** Metadatos oficiales de una norma (subconjunto que usamos). */
export interface MetadatosNorma {
  idBoe: string;
  titulo: string;
  /** Fecha de consolidación (última actualización), formato civil YYYY-MM-DD. */
  fechaConsolidacion: string | null;
  urlBoe: string | null;
  /** `fecha_actualizacion` como YYYYMMDD, para elegir la versión vigente por defecto. */
  fechaReferenciaYmd: string | null;
}

/** BOE da fechas como YYYYMMDD (a veces con sufijo "THHMMSSZ"). Nos quedamos con YYYYMMDD. */
function aYmd(valor: string | null): string | null {
  if (!valor) return null;
  const m = valor.match(/^(\d{8})/);
  return m ? (m[1] ?? null) : null;
}

/** YYYYMMDD → fecha civil YYYY-MM-DD. */
function ymdACivil(ymd: string): string {
  return `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}`;
}

/** YYYYMMDD → datetime ISO con offset (medianoche UTC), que es lo que exige `validFrom`. */
function ymdAIso(ymd: string): string {
  return `${ymdACivil(ymd)}T00:00:00.000Z`;
}

export function parseMetadatos(xml: string): MetadatosNorma {
  const doc = parsearXml(xml);
  const idBoe = textoDe(doc, 'identificador');
  const titulo = textoDe(doc, 'titulo');
  if (!idBoe || !titulo) {
    throw new Error('Metadatos del BOE incompletos: faltan identificador o título');
  }
  const fechaActualizacion = aYmd(textoDe(doc, 'fecha_actualizacion'));
  const urlBoe = textoDe(doc, 'url_html_consolidada') ?? textoDe(doc, 'url_eli');
  return {
    idBoe,
    titulo,
    fechaConsolidacion: fechaActualizacion ? ymdACivil(fechaActualizacion) : null,
    urlBoe,
    fechaReferenciaYmd: fechaActualizacion,
  };
}

/**
 * De un precepto con una o varias `<version>`, elige la vigente respecto a `refYmd`:
 * la de mayor `fecha_vigencia` que no sea futura. Si todas son futuras, la más antigua.
 */
function elegirVersionVigente(versiones: Element[], refYmd: string): Element | null {
  if (versiones.length === 0) return null;
  const conFecha = versiones.map((v) => ({
    el: v,
    fecha: aYmd(v.getAttribute('fecha_vigencia')) ?? '00000000',
  }));
  const vigentes = conFecha.filter((v) => v.fecha <= refYmd);
  const candidatas = vigentes.length > 0 ? vigentes : conFecha;
  return candidatas.reduce((mejor, actual) => (actual.fecha >= mejor.fecha ? actual : mejor)).el;
}

/** Extrae `numero` y `titulo` a partir del encabezado del artículo. */
export function extraerNumeroTitulo(
  lineaArticulo: string,
  tituloAtributo: string,
): { numero: string; titulo: string | null } {
  const fuente = lineaArticulo || tituloAtributo;
  const idx = fuente.indexOf('. ');
  const etiqueta = (idx >= 0 ? fuente.slice(0, idx) : fuente).trim();
  const rubricaBruta = idx >= 0 ? fuente.slice(idx + 2).trim() : '';
  const rubrica = rubricaBruta.replace(/\.\s*$/, '').trim();

  const m = etiqueta.match(/^Art[íi]culo\s+(.+)$/i);
  const numero = (m?.[1] ?? etiqueta).trim();
  return { numero, titulo: rubrica.length > 0 ? rubrica : null };
}

/** Resultado del parseo de una norma consolidada. */
export interface NormaParseada {
  norma: Norma;
  articulos: Articulo[];
}

export interface OpcionesParseo {
  /**
   * Fecha de referencia (YYYYMMDD) para elegir la versión vigente de cada artículo.
   * Por defecto, la `fecha_actualizacion` de los metadatos (la consolidación oficial).
   */
  fechaReferenciaYmd?: string;
}

/**
 * Convierte el XML de texto consolidado + metadatos en una `Norma` y sus `Articulo[]`,
 * validados contra los esquemas de `@agente/shared`.
 */
export function parseNormaConsolidada(
  textoXml: string,
  metaXml: string,
  entrada: EntradaCatalogo,
  opciones: OpcionesParseo = {},
): NormaParseada {
  const meta = parseMetadatos(metaXml);
  if (meta.idBoe !== entrada.idBoe) {
    throw new Error(
      `El identificador de los metadatos (${meta.idBoe}) no coincide con el del catálogo (${entrada.idBoe})`,
    );
  }

  const refYmd =
    opciones.fechaReferenciaYmd ??
    meta.fechaReferenciaYmd ??
    new Date().toISOString().slice(0, 10).replace(/-/g, '');

  const norma: Norma = Norma.parse({
    id: entrada.idBoe,
    codigo: entrada.codigo,
    titulo: meta.titulo,
    tipo: entrada.tipo,
    ambito: entrada.ambito,
    territorioId: null,
    origen: 'oficial',
    urlBoe: meta.urlBoe,
    fechaConsolidacion: meta.fechaConsolidacion,
  });

  const doc = parsearXml(textoXml);
  const bloques = Array.from(doc.getElementsByTagName('bloque') as unknown as Iterable<Element>);

  const articulos: Articulo[] = [];
  let orden = 0;

  for (const bloque of bloques) {
    if (bloque.getAttribute('tipo') !== 'precepto') continue;

    const bloqueId = bloque.getAttribute('id') ?? `precepto-${orden}`;
    const tituloAtributo = bloque.getAttribute('titulo') ?? '';

    const versiones = hijosElemento(bloque).filter((h) => h.nodeName.toLowerCase() === 'version');
    const versionVigente = elegirVersionVigente(versiones, refYmd);
    if (!versionVigente) continue;

    const texto = versionAMarkdown(versionVigente);
    if (texto.trim().length === 0) continue; // precepto sin contenido útil

    const { numero, titulo } = extraerNumeroTitulo(
      lineaEncabezadoArticulo(versionVigente),
      tituloAtributo,
    );

    const fechaVigenciaYmd = aYmd(versionVigente.getAttribute('fecha_vigencia'));
    const validFrom = fechaVigenciaYmd
      ? ymdAIso(fechaVigenciaYmd)
      : meta.fechaConsolidacion
        ? `${meta.fechaConsolidacion}T00:00:00.000Z`
        : new Date().toISOString();

    const articulo: Articulo = Articulo.parse({
      id: `${entrada.idBoe}:${bloqueId}`,
      normaId: norma.id,
      numero,
      titulo,
      texto,
      idioma: 'es',
      orden,
      hash: hashTexto(texto),
      validFrom,
      validTo: null,
    });

    articulos.push(articulo);
    orden += 1;
  }

  return { norma, articulos };
}
