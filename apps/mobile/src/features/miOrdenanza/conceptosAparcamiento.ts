import { normalizarBusqueda } from '@agente/shared';

/**
 * "MI ORDENANZA" (§4.5): conceptos de APARCAMIENTO REGULADO cuya sanción depende de la ORDENANZA
 * de cada municipio y que, por tanto, NO viajan en el paquete de contenido (varían por ayuntamiento).
 * Son la búsqueda nº1 del Policía Local ("zona azul", "sin ticket", "carga y descarga"…) y hoy caen
 * en "Nada exacto". En vez de colgarles un dato estatal falso, la app deja que el agente teclee UNA
 * vez el importe + artículo de SU ordenanza (se guarda en su móvil, offline) y lo reutilice.
 *
 * Este módulo es PURO (sin estado ni I/O): define los conceptos, empareja la consulta del agente con
 * uno de ellos y compone la línea de boletín orientativa. Testeable con node.
 */

/** Parámetros con los que el agente rellena el boletín de su ordenanza. */
export interface DatosBoletinOrdenanza {
  importeEur: number;
  articulo: string | null;
  municipio: string | null;
}

/** Un concepto de aparcamiento regulado, con sus sinónimos de calle y su plantilla de boletín. */
export interface ConceptoAparcamiento {
  id: string;
  label: string;
  /** Descripción corta para la tarjeta y el formulario. */
  descripcion: string;
  /** Términos de calle (sin tildes) que apuntan a este concepto. */
  sinonimos: string[];
  /** Compone la línea de boletín orientativa con los datos de la ordenanza del agente. */
  boletin: (d: DatosBoletinOrdenanza) => string;
}

/** Referencia a la ordenanza en el boletín: "de {municipio}" si se conoce, o genérica. */
function refOrdenanza(municipio: string | null): string {
  const m = municipio?.trim();
  return m ? `la ordenanza municipal de ${m}` : 'la ordenanza municipal aplicable';
}

/** Cola común del boletín: artículo (si consta) + importe. */
function colaBoletin(d: DatosBoletinOrdenanza): string {
  const art = d.articulo?.trim() ? `, art. ${d.articulo.trim()}` : '';
  const importe = Number.isFinite(d.importeEur)
    ? `${d.importeEur.toLocaleString('es-ES')} €`
    : '';
  return `${art}. Importe orientativo según tu ordenanza: ${importe}.`;
}

export const CONCEPTOS_APARCAMIENTO: readonly ConceptoAparcamiento[] = [
  {
    id: 'zona-azul',
    label: 'Zona azul / ORA (estacionamiento regulado)',
    descripcion: 'Estacionar en zona regulada sin título habilitante o excediendo el tiempo abonado.',
    sinonimos: [
      'zona azul',
      'zona verde',
      'zona naranja',
      'ora',
      'estacionamiento regulado',
      'sin ticket',
      'sin tique',
      'ticket caducado',
      'tique caducado',
      'tiempo excedido',
      'parquimetro',
      'zona regulada',
      'sin comprobante de zona azul',
    ],
    boletin: (d) =>
      `Estacionar en zona de estacionamiento regulado (ORA/zona azul) sin título habilitante o ` +
      `excediendo el tiempo abonado, conforme a ${refOrdenanza(d.municipio)}${colaBoletin(d)}`,
  },
  {
    id: 'carga-descarga',
    label: 'Zona de carga y descarga',
    descripcion: 'Estacionar en zona reservada a carga y descarga fuera de sus condiciones.',
    sinonimos: [
      'carga y descarga',
      'zona de carga y descarga',
      'aparcar en carga y descarga',
      'zona c y d',
      'reparto',
    ],
    boletin: (d) =>
      `Estacionar en zona reservada a carga y descarga fuera de las horas o condiciones autorizadas, ` +
      `conforme a ${refOrdenanza(d.municipio)}${colaBoletin(d)}`,
  },
  {
    id: 'vado',
    label: 'Vado (salida de vehículos)',
    descripcion: 'Estacionar ante un vado señalizado o tapando la salida de vehículos.',
    sinonimos: [
      'vado',
      'vado permanente',
      'coche en el vado',
      'tapar el vado',
      'me tapan la salida',
      'coche delante del garaje',
    ],
    boletin: (d) =>
      `Estacionar ante un vado señalizado o tapando el acceso/salida de vehículos, conforme a ` +
      `${refOrdenanza(d.municipio)}${colaBoletin(d)}`,
  },
  {
    id: 'reservado-pmr',
    label: 'Reservado PMR (movilidad reducida)',
    descripcion: 'Estacionar en plaza reservada a personas con movilidad reducida sin tarjeta.',
    sinonimos: [
      'reservado minusvalidos',
      'plaza de minusvalidos',
      'aparcar en minusvalidos',
      'plaza pmr',
      'reservado pmr',
      'sin tarjeta de movilidad reducida',
      'plaza de discapacitados',
    ],
    boletin: (d) =>
      `Estacionar en plaza reservada a personas con movilidad reducida (PMR) sin la tarjeta que lo ` +
      `autorice, conforme a ${refOrdenanza(d.municipio)}${colaBoletin(d)}`,
  },
] as const;

/** Devuelve el concepto de aparcamiento al que apunta la consulta del agente, o `null`. */
export function conceptoDeConsulta(consulta: string): ConceptoAparcamiento | null {
  const q = normalizarBusqueda(consulta).trim();
  if (q.length < 3) return null;
  for (const concepto of CONCEPTOS_APARCAMIENTO) {
    for (const sinRaw of concepto.sinonimos) {
      const sin = normalizarBusqueda(sinRaw);
      // Coincide si la CONSULTA contiene el sinónimo completo ("aparcar en carga y descarga") o si
      // el sinónimo EMPIEZA por la consulta (tecleo parcial: "zona az" → "zona azul"). El prefijo
      // exige ≥4 caracteres para no emparejar palabras genéricas ("movil" NO debe caer en PMR por
      // "movilidad"; "sin" no debe arrastrar zona azul).
      if (q.includes(sin) || (q.length >= 4 && sin.startsWith(q))) return concepto;
    }
  }
  return null;
}

/** Busca un concepto por su id (para la pantalla de edición). */
export function conceptoPorId(id: string): ConceptoAparcamiento | null {
  return CONCEPTOS_APARCAMIENTO.find((c) => c.id === id) ?? null;
}
