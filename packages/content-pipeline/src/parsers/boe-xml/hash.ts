import { createHash } from 'node:crypto';

/**
 * Hash del texto consolidado de un artículo (sección 8.2 de la especificación).
 *
 * Es la huella con la que el flujo incremental detecta cambios: si el hash de un
 * artículo cambia entre dos consolidaciones del BOE, ese artículo se ha modificado y
 * hay que cerrar la versión anterior (`validTo`) y abrir una nueva (`validFrom`).
 *
 * Requisitos: determinista y estable. Se normaliza el fin de línea a `\n` para que un
 * cambio de CRLF/LF en la fuente no se confunda con un cambio legal. NO se normaliza
 * el contenido (mayúsculas, acentos): un cambio real de redacción debe alterar el hash.
 */
export function hashTexto(texto: string): string {
  const normalizado = texto.replace(/\r\n/g, '\n');
  return createHash('sha256').update(normalizado, 'utf8').digest('hex');
}
