/**
 * Conversión PURA de Markdown → HTML para el PDF (§4.8), sin dependencias y Expo Go-safe.
 *
 * `expo-print` genera el PDF a partir de HTML. El texto ya relleno (`renderPlantilla`) es
 * Markdown sencillo: encabezados, párrafos, listas con viñeta, línea separadora y **negrita**.
 * No se reutiliza el parser de `ui/markdown` porque aquel produce nodos de React Native; aquí
 * hace falta HTML de imprenta.
 *
 * SEGURIDAD: todo el texto (incluidos los datos que teclea el agente) se ESCAPA antes de
 * inyectarse en el HTML, de modo que un valor con `<`, `&` o comillas no rompa el documento ni
 * inyecte marcado. La generación es 100 % en el dispositivo; nada viaja a un servidor.
 */

/** Marcas diacríticas combinantes (Unicode U+0300–U+036F), para poder quitar los acentos. */
const DIACRITICOS = new RegExp('[\\u0300-\\u036f]', 'g');

/**
 * Convierte un título en un nombre de archivo seguro (sin acentos ni caracteres raros), para que
 * la hoja de compartir muestre "boletin-de-denuncia.pdf" y no un id aleatorio. Pura y testeable.
 */
export function nombreArchivoSeguro(base: string): string {
  const sinAcentos = base.normalize('NFD').replace(DIACRITICOS, '');
  const limpio = sinAcentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return limpio.length > 0 ? limpio : 'documento';
}

/** Escapa los caracteres con significado en HTML. */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Escapa el texto y aplica el énfasis en línea admitido (**negrita**). */
export function inlineToHtml(text: string): string {
  return escapeHtml(text).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}

/**
 * Convierte el cuerpo Markdown a HTML. Soporta: `#`/`##`/`###`, párrafos (separados por línea en
 * blanco, con `<br/>` para saltos internos), listas `- `, y regla `---`.
 */
export function markdownToHtml(markdown: string): string {
  const lineas = markdown.replace(/\r\n/g, '\n').split('\n');
  const bloques: string[] = [];
  let parrafo: string[] = [];
  let lista: string[] = [];

  const cerrarParrafo = () => {
    if (parrafo.length > 0) {
      bloques.push(`<p>${parrafo.map(inlineToHtml).join('<br/>')}</p>`);
      parrafo = [];
    }
  };
  const cerrarLista = () => {
    if (lista.length > 0) {
      bloques.push(`<ul>${lista.map((li) => `<li>${inlineToHtml(li)}</li>`).join('')}</ul>`);
      lista = [];
    }
  };

  for (const cruda of lineas) {
    const linea = cruda.trimEnd();
    const trim = linea.trim();

    if (trim.length === 0) {
      cerrarParrafo();
      cerrarLista();
      continue;
    }
    if (/^---+$/.test(trim)) {
      cerrarParrafo();
      cerrarLista();
      bloques.push('<hr/>');
      continue;
    }
    const enc = /^(#{1,3})\s+(.*)$/.exec(trim);
    if (enc) {
      cerrarParrafo();
      cerrarLista();
      const nivel = enc[1]!.length;
      bloques.push(`<h${nivel}>${inlineToHtml(enc[2]!)}</h${nivel}>`);
      continue;
    }
    const item = /^[-*]\s+(.*)$/.exec(trim);
    if (item) {
      cerrarParrafo();
      lista.push(item[1]!);
      continue;
    }
    // Línea de párrafo normal.
    cerrarLista();
    parrafo.push(trim);
  }
  cerrarParrafo();
  cerrarLista();
  return bloques.join('\n');
}

/** Datos para envolver el documento en una página imprimible neutra. */
export interface DocumentoHtmlOptions {
  titulo: string;
  /** Cuerpo Markdown ya relleno (`renderPlantilla`). */
  markdown: string;
  /** Fecha de generación legible (dd/mm/aaaa hh:mm), para el pie. */
  generadoEn: string;
}

/**
 * Envuelve el documento en una página A4 con estilos SOBRIOS y NEUTROS (sin escudos, sin
 * apariencia oficial). Incluye un pie fijo que recuerda que el PDF se ha generado en el
 * dispositivo y que los datos de terceros no se han enviado a ningún servidor.
 */
export function buildDocumentHtml({ titulo, markdown, generadoEn }: DocumentoHtmlOptions): string {
  const body = markdownToHtml(markdown);
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(titulo)}</title>
<style>
  @page { margin: 24mm 18mm; }
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    color: #12151a; font-size: 12pt; line-height: 1.5; margin: 0;
  }
  h1 { font-size: 18pt; margin: 0 0 6pt; }
  h2 { font-size: 13pt; margin: 16pt 0 4pt; border-bottom: 1px solid #dbdfe6; padding-bottom: 2pt; }
  h3 { font-size: 12pt; margin: 12pt 0 2pt; }
  p { margin: 6pt 0; }
  ul { margin: 6pt 0; padding-left: 18pt; }
  li { margin: 2pt 0; }
  hr { border: none; border-top: 1px solid #c2c8d2; margin: 14pt 0; }
  strong { font-weight: 700; }
  .doc-footer {
    margin-top: 24pt; padding-top: 8pt; border-top: 1px solid #dbdfe6;
    font-size: 8.5pt; color: #6b7482;
  }
</style>
</head>
<body>
${body}
<div class="doc-footer">
  Documento generado en el dispositivo el ${escapeHtml(generadoEn)}. Los datos de terceros
  (matrículas, nombres, DNI) permanecen únicamente en este teléfono y no se han enviado a ningún
  servidor. Documento de apoyo, sin carácter oficial.
</div>
</body>
</html>`;
}
