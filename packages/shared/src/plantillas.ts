/**
 * Motor de PLANTILLAS con variables `{{campo}}` (sección 4.8).
 *
 * Función PURA y sin dependencias (corre igual en la app, en el panel de administración
 * y en los tests). Rellena el Markdown de una `Plantilla` con los valores que aporta el
 * agente y devuelve el texto listo para convertir a PDF EN EL DISPOSITIVO.
 *
 * Reglas de diseño:
 *  - Sustitución en UNA sola pasada: el valor inyectado NUNCA se vuelve a escanear, de modo
 *    que un valor que contenga `{{otra}}` se imprime literal (no hay reentrada ni bucles).
 *  - Tolera espacios dentro de las llaves: `{{ fecha }}` == `{{fecha}}`.
 *  - Un hueco sin valor (ausente o cadena vacía) se sustituye por un `marcadorVacio`
 *    imprimible (línea para rellenar a mano) y su clave se devuelve en `camposFaltantes`.
 *  - No interpreta HTML ni Markdown de los valores: eso lo hace, con su escape, la capa que
 *    genera el HTML del PDF. Aquí solo se compone texto.
 */

/** Valores que aporta el agente, indexados por la clave de la variable (`{{clave}}`). */
export type ValoresPlantilla = Record<string, string | number | null | undefined>;

/** Resultado del relleno: el texto final y las claves que quedaron sin valor. */
export interface ResultadoPlantilla {
  /** Markdown ya relleno, listo para `markdownToHtml` + `expo-print`. */
  texto: string;
  /** Claves de variable que no tenían valor (para avisar al agente de qué falta). */
  camposFaltantes: string[];
}

/** Expresión de una variable `{{clave}}` con espacios opcionales alrededor de la clave. */
const VARIABLE = /\{\{\s*([\p{L}\p{N}_.-]+)\s*\}\}/gu;

/**
 * Extrae, EN ORDEN de aparición y sin repetir, las claves de variable presentes en el
 * Markdown de una plantilla. Sirve para validar que cada plantilla tiene descrito cada campo
 * y para construir el formulario a partir del texto.
 */
export function extraerVariables(markdown: string): string[] {
  const vistas = new Set<string>();
  const orden: string[] = [];
  for (const m of markdown.matchAll(VARIABLE)) {
    const clave = m[1];
    if (clave !== undefined && !vistas.has(clave)) {
      vistas.add(clave);
      orden.push(clave);
    }
  }
  return orden;
}

/** Normaliza un valor de entrada a la cadena que se imprime (o `null` si está "vacío"). */
function valorImprimible(valor: string | number | null | undefined): string | null {
  if (valor === null || valor === undefined) return null;
  const texto = typeof valor === 'number' ? String(valor) : valor;
  return texto.trim().length === 0 ? null : texto;
}

/**
 * Rellena el Markdown de una plantilla con los `valores` del agente.
 *
 * @param markdown Texto de la plantilla con huecos `{{clave}}`.
 * @param valores  Valores por clave (los que faltan se marcan como hueco a rellenar).
 * @param marcadorVacio Texto que ocupa un hueco sin valor. Por defecto, una línea para firmar
 *   a mano; el llamante puede pasar `''` si prefiere dejarlo en blanco.
 */
export function renderPlantilla(
  markdown: string,
  valores: ValoresPlantilla,
  marcadorVacio = '__________',
): ResultadoPlantilla {
  const faltantes: string[] = [];
  const vistasFaltantes = new Set<string>();

  const texto = markdown.replace(VARIABLE, (_coincidencia, claveRaw: string) => {
    const clave = claveRaw;
    const imprimible = valorImprimible(valores[clave]);
    if (imprimible === null) {
      if (!vistasFaltantes.has(clave)) {
        vistasFaltantes.add(clave);
        faltantes.push(clave);
      }
      return marcadorVacio;
    }
    return imprimible;
  });

  return { texto, camposFaltantes: faltantes };
}
