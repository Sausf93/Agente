import type { Element, Node } from '@xmldom/xmldom';

/**
 * Conversión del cuerpo de un artículo del BOE (una `<version>` del XML consolidado)
 * a Markdown limpio y estable, que es lo que guarda `Articulo.texto` en `@agente/shared`.
 *
 * Criterios (sección 8.2):
 *  - Determinista: la misma entrada produce siempre el mismo Markdown (base del hash).
 *  - Solo texto legal: se descartan las notas editoriales del BOE (`nota_pie`, que dicen
 *    "Se modifica el apartado X por…"), porque no son parte de la norma y ensuciarían el
 *    diff. La procedencia de la modificación se conserva a nivel de versión, no de texto.
 *  - Se preservan tablas (velocidades, tasas) como tablas Markdown e imágenes (señales)
 *    como referencia, para no perder información aunque el render fino llegue después.
 */

const NODO_ELEMENTO = 1;
const NODO_TEXTO = 3;
const NODO_CDATA = 4;

/** Clases de párrafo del BOE que son notas editoriales, no texto normativo. */
const CLASES_EDITORIALES = new Set(['nota_pie', 'nota_pie_2']);

function esElemento(nodo: Node): nodo is Element {
  return nodo.nodeType === NODO_ELEMENTO;
}

function hijos(nodo: Node): Node[] {
  const lista = nodo.childNodes;
  const salida: Node[] = [];
  for (let i = 0; i < lista.length; i += 1) {
    const hijo = lista.item(i);
    if (hijo) salida.push(hijo);
  }
  return salida;
}

/** Colapsa espacios y saltos de línea del XML "bonito" del BOE a un espacio simple. */
function normalizarEspacios(texto: string): string {
  return texto.replace(/\s+/g, ' ').trim();
}

/** Texto de un nodo en línea, aplicando énfasis Markdown para `<em>`/`<strong>`. */
function textoEnLinea(nodo: Node): string {
  if (nodo.nodeType === NODO_TEXTO || nodo.nodeType === NODO_CDATA) {
    return nodo.nodeValue ?? '';
  }
  if (!esElemento(nodo)) return '';

  const interior = hijos(nodo).map(textoEnLinea).join('');
  const etiqueta = nodo.nodeName.toLowerCase();
  if (etiqueta === 'em' || etiqueta === 'i') return `*${interior.trim()}*`;
  if (etiqueta === 'strong' || etiqueta === 'b') return `**${interior.trim()}**`;
  // <a> (referencias internas del BOE), <span>, <data>, <code>… → solo su texto.
  return interior;
}

function claseDe(el: Element): string {
  return el.getAttribute('class') ?? '';
}

function escaparCeldaTabla(texto: string): string {
  return texto.replace(/\|/g, '\\|');
}

function celdasDeFila(fila: Element): string[] {
  return hijos(fila)
    .filter(esElemento)
    .filter((c) => {
      const t = c.nodeName.toLowerCase();
      return t === 'td' || t === 'th';
    })
    .map((c) => escaparCeldaTabla(normalizarEspacios(textoEnLinea(c))));
}

function filasDe(el: Element, etiqueta: string): Element[] {
  return hijos(el)
    .filter(esElemento)
    .filter((h) => h.nodeName.toLowerCase() === etiqueta);
}

/** Convierte una `<table>` del BOE en una tabla Markdown (GFM). */
function tablaAMarkdown(tabla: Element): string {
  const secciones = hijos(tabla).filter(esElemento);
  const thead = secciones.find((s) => s.nodeName.toLowerCase() === 'thead');
  const tbody = secciones.find((s) => s.nodeName.toLowerCase() === 'tbody');

  const filasCuerpo = tbody ? filasDe(tbody, 'tr') : filasDe(tabla, 'tr');
  const filasCabecera = thead ? filasDe(thead, 'tr') : [];

  const cabecera = filasCabecera[0]
    ? celdasDeFila(filasCabecera[0])
    : // Sin thead: se usa una cabecera vacía con tantas columnas como la primera fila.
      filasCuerpo[0]
      ? celdasDeFila(filasCuerpo[0]).map(() => ' ')
      : [];

  const cuerpo = (filasCabecera[0] ? filasCuerpo : filasCuerpo.slice(1)).map(celdasDeFila);

  if (cabecera.length === 0) return '';

  const separador = cabecera.map(() => '---');
  const lineas = [
    `| ${cabecera.join(' | ')} |`,
    `| ${separador.join(' | ')} |`,
    ...cuerpo.map((fila) => `| ${fila.join(' | ')} |`),
  ];
  return lineas.join('\n');
}

/** Convierte un párrafo `<p class="imagen">` (señales de tráfico) en referencia Markdown. */
function imagenAMarkdown(p: Element): string {
  const imgs = hijos(p)
    .filter(esElemento)
    .filter((h) => h.nodeName.toLowerCase() === 'img');
  const primera = imgs[0];
  if (!primera) return '';
  const src = primera.getAttribute('src') ?? '';
  return `![imagen](${src})`;
}

/** Convierte un bloque de nivel superior del cuerpo en un bloque Markdown (o vacío). */
function bloqueAMarkdown(nodo: Node): string {
  if (nodo.nodeType === NODO_TEXTO || nodo.nodeType === NODO_CDATA) {
    return normalizarEspacios(nodo.nodeValue ?? '');
  }
  if (!esElemento(nodo)) return '';

  const etiqueta = nodo.nodeName.toLowerCase();

  if (etiqueta === 'table') return tablaAMarkdown(nodo);

  if (etiqueta === 'blockquote') {
    const interno = hijos(nodo)
      .map(bloqueAMarkdown)
      .filter((s) => s.length > 0)
      .join('\n\n');
    if (!interno) return '';
    return interno
      .split('\n')
      .map((linea) => (linea.length ? `> ${linea}` : '>'))
      .join('\n');
  }

  if (etiqueta === 'p') {
    const clase = claseDe(nodo);
    if (clase === 'articulo') return ''; // el encabezado ya es `numero`/`titulo`
    if (CLASES_EDITORIALES.has(clase)) return ''; // nota editorial, no texto legal
    if (clase === 'imagen') return imagenAMarkdown(nodo);
    return normalizarEspacios(textoEnLinea(nodo));
  }

  // Cualquier otro elemento: se toma su texto en línea como párrafo.
  return normalizarEspacios(textoEnLinea(nodo));
}

/**
 * Convierte el elemento `<version>` de un artículo del BOE en Markdown.
 * Los bloques se separan por línea en blanco. El resultado no lleva el encabezado
 * "Artículo N" (se extrae aparte como `numero`/`titulo`).
 */
export function versionAMarkdown(version: Element): string {
  return hijos(version)
    .map(bloqueAMarkdown)
    .filter((s) => s.length > 0)
    .join('\n\n');
}

/** Texto normalizado del párrafo `<p class="articulo">` de una versión (o cadena vacía). */
export function lineaEncabezadoArticulo(version: Element): string {
  const p = hijos(version)
    .filter(esElemento)
    .find((h) => h.nodeName.toLowerCase() === 'p' && claseDe(h) === 'articulo');
  return p ? normalizarEspacios(textoEnLinea(p)) : '';
}
