/**
 * Parser de Markdown MÍNIMO y PURO (sin dependencias, compatible con Expo Go).
 *
 * El articulado consolidado y los resúmenes del seed llegan como Markdown (§4.5, ADR-010). En vez
 * de añadir una librería nativa que pueda romper Expo Go, se parsea a un modelo de bloques simple
 * que el renderer (`Markdown.tsx`) pinta con las primitivas de React Native y los tokens del tema.
 *
 * Cubre lo que aparece en textos legales: encabezados (#..###), listas (con viñeta y numeradas),
 * tablas de tubería (`| a | b |`), citas (`>`) y párrafos, con énfasis en línea **negrita**,
 * *cursiva*, _cursiva_ y `código`. No pretende ser CommonMark completo: pretende ser LEGIBLE,
 * predecible y testeable. La lógica es pura → cubierta por tests unitarios.
 */

/** Fragmento de texto en línea con su énfasis. */
export interface InlineSpan {
  text: string;
  bold?: boolean;
  italic?: boolean;
  code?: boolean;
}

/** Bloque de Markdown ya parseado, listo para el renderer. */
export type MarkdownBlock =
  | { type: 'heading'; level: 1 | 2 | 3; spans: InlineSpan[] }
  | { type: 'paragraph'; spans: InlineSpan[] }
  | { type: 'list'; ordered: boolean; items: InlineSpan[][] }
  | { type: 'table'; header: InlineSpan[][]; rows: InlineSpan[][][] }
  | { type: 'quote'; spans: InlineSpan[] };

/** Detecta la línea separadora de cabecera de una tabla: `|---|:--:|`. */
function esSeparadorTabla(linea: string): boolean {
  return /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(linea);
}

/** Trocea una fila de tabla `| a | b |` en sus celdas (sin los tubos de los extremos). */
function celdasDeFila(linea: string): string[] {
  const recortada = linea.trim().replace(/^\|/, '').replace(/\|$/, '');
  return recortada.split('|').map((c) => c.trim());
}

/**
 * Parsea el énfasis EN LÍNEA (negrita, cursiva, código) de un fragmento de texto. No anida: el
 * primer marcador que abre gana. Determinista y pura.
 */
export function parseInline(text: string): InlineSpan[] {
  const spans: InlineSpan[] = [];
  const re = /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(_([^_]+)_)|(`([^`]+)`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) spans.push({ text: text.slice(last, m.index) });
    if (m[2] !== undefined) spans.push({ text: m[2], bold: true });
    else if (m[4] !== undefined) spans.push({ text: m[4], italic: true });
    else if (m[6] !== undefined) spans.push({ text: m[6], italic: true });
    else if (m[8] !== undefined) spans.push({ text: m[8], code: true });
    last = re.lastIndex;
  }
  if (last < text.length) spans.push({ text: text.slice(last) });
  if (spans.length === 0) spans.push({ text: '' });
  return spans;
}

/** Parsea un texto Markdown completo a una lista de bloques. Pura. */
export function parseMarkdown(md: string): MarkdownBlock[] {
  const lineas = md.replace(/\r\n/g, '\n').split('\n');
  const bloques: MarkdownBlock[] = [];
  /** Lectura segura de una línea (fuera de rango → cadena vacía). */
  const lineaEn = (idx: number): string => lineas[idx] ?? '';
  let i = 0;

  while (i < lineas.length) {
    const trim = lineaEn(i).trim();

    // Línea en blanco: separa bloques.
    if (trim.length === 0) {
      i += 1;
      continue;
    }

    // Encabezado (#, ##, ###).
    const enc = /^(#{1,3})\s+(.*)$/.exec(trim);
    if (enc) {
      const almohadillas = enc[1] ?? '#';
      bloques.push({
        type: 'heading',
        level: almohadillas.length as 1 | 2 | 3,
        spans: parseInline((enc[2] ?? '').trim()),
      });
      i += 1;
      continue;
    }

    // Tabla: fila con tubos seguida de una línea separadora.
    if (trim.includes('|') && esSeparadorTabla(lineaEn(i + 1))) {
      const header = celdasDeFila(trim).map(parseInline);
      i += 2; // saltar cabecera + separador
      const rows: InlineSpan[][][] = [];
      while (i < lineas.length && lineaEn(i).trim().includes('|') && lineaEn(i).trim().length > 0) {
        rows.push(celdasDeFila(lineaEn(i)).map(parseInline));
        i += 1;
      }
      bloques.push({ type: 'table', header, rows });
      continue;
    }

    // Cita en bloque (>). Se agrupan líneas consecutivas.
    if (/^>\s?/.test(trim)) {
      const partes: string[] = [];
      while (i < lineas.length && /^>\s?/.test(lineaEn(i).trim())) {
        partes.push(lineaEn(i).trim().replace(/^>\s?/, ''));
        i += 1;
      }
      bloques.push({ type: 'quote', spans: parseInline(partes.join(' ')) });
      continue;
    }

    // Lista con viñeta (-, *, +) o numerada (1.).
    const esViñeta = /^[-*+]\s+/.test(trim);
    const esNumerada = /^\d+\.\s+/.test(trim);
    if (esViñeta || esNumerada) {
      const ordered = esNumerada;
      const items: InlineSpan[][] = [];
      while (i < lineas.length) {
        const t = lineaEn(i).trim();
        const mv = /^[-*+]\s+(.*)$/.exec(t);
        const mn = /^\d+\.\s+(.*)$/.exec(t);
        if (ordered && mn) items.push(parseInline(mn[1] ?? ''));
        else if (!ordered && mv) items.push(parseInline(mv[1] ?? ''));
        else break;
        i += 1;
      }
      bloques.push({ type: 'list', ordered, items });
      continue;
    }

    // Párrafo: agrupa líneas consecutivas que no son un bloque especial.
    const parrafo: string[] = [];
    while (i < lineas.length) {
      const t = lineaEn(i).trim();
      if (
        t.length === 0 ||
        /^(#{1,3})\s+/.test(t) ||
        /^>\s?/.test(t) ||
        /^[-*+]\s+/.test(t) ||
        /^\d+\.\s+/.test(t) ||
        (t.includes('|') && esSeparadorTabla(lineaEn(i + 1)))
      ) {
        break;
      }
      parrafo.push(t);
      i += 1;
    }
    bloques.push({ type: 'paragraph', spans: parseInline(parrafo.join(' ')) });
  }

  return bloques;
}
