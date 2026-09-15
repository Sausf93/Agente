/**
 * PUNTO KILOMÉTRICO (§4.11, "razón nº1 de la GC de Tráfico"): ayudante para componer la LOCALIZACIÓN
 * exacta de una intervención en carretera, lista para copiar al atestado/boletín. Versión manual
 * (sin mapa ni datos de carreteras, que llegarán después): el agente teclea la carretera, el p.k. y
 * el sentido/margen y obtiene una línea normalizada. Módulo PURO (sin estado ni I/O), testeable.
 *
 * No guarda datos de terceros: solo la localización geográfica de un punto de la vía (dato público).
 */

export type Sentido = 'creciente' | 'decreciente';
export type Margen = 'derecho' | 'izquierdo' | 'ambos';

/** Datos que el agente introduce para localizar el punto de la intervención. */
export interface DatosPuntoKilometrico {
  /** Denominación de la vía, p. ej. "TF-1", "A-7", "N-340". */
  carretera: string;
  /** Punto kilométrico, tal como lo teclea el agente: "12,300", "12.3", "12+300". */
  pk: string;
  sentido: Sentido | null;
  /** Destino del sentido, p. ej. "Santa Cruz" → "sentido decreciente (hacia Santa Cruz)". */
  sentidoHacia: string | null;
  margen: Margen | null;
  /** Referencia complementaria, p. ej. "a la altura de la salida 12" o "junto a la gasolinera". */
  referencia: string | null;
}

const SENTIDO_LABEL: Record<Sentido, string> = {
  creciente: 'sentido creciente',
  decreciente: 'sentido decreciente',
};

const MARGEN_LABEL: Record<Margen, string> = {
  derecho: 'margen derecho',
  izquierdo: 'margen izquierdo',
  ambos: 'ambos márgenes',
};

/** Normaliza el p.k. tecleado a la forma "p.k. 12,300" (admite "12.3", "12+300", "12,3"). */
export function formatearPk(pk: string): string {
  const limpio = pk.trim().replace(/\s+/g, '');
  if (limpio.length === 0) return '';
  // "12+300" (nomenclatura de obra) → "12,300"; el punto decimal → coma (formato español).
  const conComa = limpio.replace('+', ',').replace('.', ',');
  return `p.k. ${conComa}`;
}

/**
 * Compone la línea de LOCALIZACIÓN para el atestado a partir de los datos. Omite con elegancia lo
 * que falte; devuelve `''` si no hay ni carretera ni p.k. (nada que localizar).
 */
export function componerLocalizacion(d: DatosPuntoKilometrico): string {
  const carretera = d.carretera.trim();
  const pk = formatearPk(d.pk);
  if (carretera.length === 0 && pk.length === 0) return '';

  const partes: string[] = [];
  if (carretera.length > 0) partes.push(`Carretera ${carretera}`);
  if (pk.length > 0) partes.push(pk);
  if (d.sentido) {
    const hacia = d.sentidoHacia?.trim();
    partes.push(hacia ? `${SENTIDO_LABEL[d.sentido]} (hacia ${hacia})` : SENTIDO_LABEL[d.sentido]);
  }
  if (d.margen) partes.push(MARGEN_LABEL[d.margen]);

  let texto = partes.join(', ');
  const ref = d.referencia?.trim();
  if (ref) texto += `, ${ref}`;
  return `${texto}.`;
}

/** ¿Hay datos mínimos para componer algo útil (al menos carretera o p.k.)? */
export function localizacionValida(d: DatosPuntoKilometrico): boolean {
  return d.carretera.trim().length > 0 || formatearPk(d.pk).length > 0;
}
