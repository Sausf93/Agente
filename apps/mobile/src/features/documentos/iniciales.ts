import type { PlantillaDoc } from './campos';

/**
 * Cálculo PURO de los valores INICIALES del formulario de un documento. Separado de la pantalla
 * para poder testearlo (precedencia y tratamiento de datos de terceros son fáciles de romper).
 *
 * Precedencia por campo:
 *   1. `prefill` (viene de la ficha: norma, artículo, importe…) — SOLO para campos del agente.
 *   2. `recordado` (valores del agente memorizados entre documentos, p. ej. su unidad).
 *   3. Valor por defecto de fecha/hora = ahora.
 *   4. Cadena vacía.
 *
 * REGLA DE PRIVACIDAD: los campos de terceros (`esDatoTercero`) NUNCA se prerrellenan desde
 * `prefill` ni desde `recordado`; siempre empiezan vacíos (el agente los teclea en el momento).
 */

/** Fecha civil dd/mm/aaaa (para el campo `fecha`). */
export function formatearFecha(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

/** Hora hh:mm (para el campo `hora`). */
export function formatearHora(d: Date): string {
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${min}`;
}

export function valoresIniciales(
  plantilla: PlantillaDoc,
  recordado: Record<string, string>,
  prefill: Record<string, string>,
  ahora: Date,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const campo of plantilla.campos) {
    let valor = '';
    if (campo.tipo === 'fecha') valor = formatearFecha(ahora);
    else if (campo.tipo === 'hora') valor = formatearHora(ahora);

    // Datos del agente: se pueden memorizar y prerrellenar. Datos de terceros: jamás.
    if (!campo.esDatoTercero) {
      if (campo.recordar && recordado[campo.clave]) valor = recordado[campo.clave]!;
      if (prefill[campo.clave]) valor = prefill[campo.clave]!;
    }
    out[campo.clave] = valor;
  }
  return out;
}

/** Subconjunto de valores que se pueden MEMORIZAR (solo campos del agente marcados `recordar`). */
export function valoresRecordables(
  plantilla: PlantillaDoc,
  values: Record<string, string>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const campo of plantilla.campos) {
    if (campo.recordar && !campo.esDatoTercero) {
      const v = values[campo.clave];
      if (v !== undefined) out[campo.clave] = v;
    }
  }
  return out;
}
