import type { Gravedad } from '@agente/shared';

/**
 * "TUS MÁS USADAS" (§4.2, §6.2) — ranking PURO y local del propio dispositivo.
 *
 * La spec habla de dos cosas distintas:
 *  - "Más usadas EN TU CUERPO": agregado ANÓNIMO entre usuarios → es de SERVIDOR (`EventoUso`,
 *    §6.2) y queda para cuando exista backend.
 *  - "TUS MÁS USADAS": el top del propio dispositivo. Es lo que se implementa aquí, todo local.
 *
 * El contador vive en `user.db` (una fila por infracción, sin datos de terceros): cuántas veces
 * se ha CONSULTADO la ficha y cuántas se ha COPIADO su boletín. La copia es una señal más fuerte
 * de "esto lo uso de verdad en la calle", así que pesa más en el ranking. Todo es anónimo: no hay
 * `usuario_id` ni identificador de dispositivo; nunca sale del teléfono (ADR-001).
 *
 * Este módulo es LÓGICA PURA (sin React Native ni SQLite) para poder testearlo con Vitest.
 */

/** Datos DESNORMALIZADOS de una infracción, para pintar la fila sin abrir el paquete de contenido. */
export interface InfraccionSnapshot {
  infraccionId: string;
  tituloCorto: string;
  gravedad: Gravedad;
  normaCodigo: string;
  articuloNumero: string;
  importeEur: number | null;
}

/** Contador de uso local de una infracción (anónimo, solo en el dispositivo). */
export interface UsoInfraccion extends InfraccionSnapshot {
  /** Nº de veces que se abrió la ficha. */
  consultas: number;
  /** Nº de veces que se copió el boletín (señal más fuerte de uso real). */
  copias: number;
  /** Fecha ISO de la última vez que se usó (desempate del ranking). */
  ultimaFecha: string;
}

/** Peso de una copia de boletín frente a una consulta en el ranking de "más usadas". */
export const PESO_COPIA = 3;

/**
 * Puntúa el uso de una infracción. Una copia de boletín pesa `PESO_COPIA` consultas: abrir la
 * ficha es curiosidad; copiar el boletín es haberla usado de verdad en un servicio.
 */
export function scoreUso(u: Pick<UsoInfraccion, 'consultas' | 'copias'>): number {
  return u.copias * PESO_COPIA + u.consultas;
}

/**
 * Ordena las infracciones por uso (score descendente; a igualdad, la más reciente primero) y
 * devuelve el top `limite`. Descarta las que no tienen ningún uso efectivo (score 0). Determinista:
 * a igualdad de score y fecha, desempata por id para que el orden sea estable entre renders.
 */
export function rankMasUsadas(usos: readonly UsoInfraccion[], limite: number): UsoInfraccion[] {
  return usos
    .filter((u) => scoreUso(u) > 0)
    .slice()
    .sort((a, b) => {
      const sa = scoreUso(a);
      const sb = scoreUso(b);
      if (sb !== sa) return sb - sa;
      if (a.ultimaFecha !== b.ultimaFecha) return a.ultimaFecha < b.ultimaFecha ? 1 : -1;
      return a.infraccionId < b.infraccionId ? -1 : 1;
    })
    .slice(0, Math.max(0, limite));
}
