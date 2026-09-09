import type { CampoPlantilla } from './campos';

/**
 * Resúmenes de UNA LÍNEA para las secciones plegables del formulario (§4.8, rediseño "ágil en la
 * calle"). Cuando el documento nace de la consulta, lo legal y la identidad ya vienen rellenos: no
 * hay que teclearlos, solo confirmarlos de un vistazo. Estas funciones son PURAS (sin React) para
 * poder testear que el resumen enseña lo crítico (un importe erróneo se ve sin abrir la sección).
 *
 * REGLA DE PRIVACIDAD: estas funciones solo resumen campos del AGENTE (legal e identidad). Nunca
 * tocan datos de terceros (matrícula, nombre, DNI…): esos ni se resumen ni salen del dispositivo.
 */

/** Valor recortado de un campo (cadena vacía si no existe). */
function valor(values: Record<string, string>, clave: string): string {
  return (values[clave] ?? '').trim();
}

/** ¿La plantilla tiene un campo con esa clave? */
function tieneCampo(campos: CampoPlantilla[], clave: string): boolean {
  return campos.some((c) => c.clave === clave);
}

/**
 * Resumen del bloque LEGAL: los valores críticos en el orden en que importan, separados por " · ":
 * norma · artículo · gravedad · importe · puntos, y "texto ✓" si el hecho/motivo viene relleno. Los
 * PUNTOS se etiquetan ("6 puntos") porque en Tráfico son tan determinantes como el importe y un "6"
 * suelto no se entiende. Devuelve cadena vacía si no hay nada que resumir (entrada en frío).
 */
export function resumenLegal(campos: CampoPlantilla[], values: Record<string, string>): string {
  const partes: string[] = [];
  // Campos "de un vistazo", en orden de importancia para revisar sin abrir.
  for (const clave of ['norma', 'articulo', 'gravedad', 'importe']) {
    if (tieneCampo(campos, clave)) {
      const v = valor(values, clave);
      if (v) partes.push(v);
    }
  }
  // Puntos: tras el importe y etiquetados para que se lean solos ("6 puntos").
  if (tieneCampo(campos, 'puntos')) {
    const p = valor(values, 'puntos');
    if (p) partes.push(`${p} puntos`);
  }
  // El texto largo (hecho denunciado / motivo) no cabe en una línea: se marca como presente.
  const tieneTexto = ['hecho', 'motivo'].some(
    (clave) => tieneCampo(campos, clave) && valor(values, clave).length > 0,
  );
  if (tieneTexto) partes.push('texto ✓');
  return partes.join(' · ');
}

/**
 * Resumen del bloque IDENTIDAD del agente: "Cuerpo · TIP 12345" (o la unidad si no hay cuerpo).
 * Devuelve cadena vacía si aún no se ha rellenado nada (primera vez, sin datos recordados).
 */
export function resumenIdentidad(campos: CampoPlantilla[], values: Record<string, string>): string {
  const partes: string[] = [];
  const cuerpo = tieneCampo(campos, 'cuerpo') ? valor(values, 'cuerpo') : '';
  const unidad = tieneCampo(campos, 'unidad') ? valor(values, 'unidad') : '';
  const tip = tieneCampo(campos, 'numeroTip') ? valor(values, 'numeroTip') : '';
  if (cuerpo) partes.push(cuerpo);
  else if (unidad) partes.push(unidad);
  if (tip) partes.push(`TIP ${tip}`);
  return partes.join(' · ');
}

/**
 * Origen del documento para la línea "Nace de:" bajo la cabecera. Prioriza el título corto de la
 * infracción (`origenTitulo`, un campo del AGENTE que pasa la ficha, nunca de tercero); si no llega,
 * lo deriva del prefill: norma · artículo (vía administrativa) o el amparo (vía penal). Devuelve
 * `null` cuando no hay origen (entrada en frío desde la pestaña Documentos).
 */
export function origenDesdePrefill(
  prefill: Record<string, string> | undefined,
  origenTitulo?: string | undefined,
): string | null {
  const titulo = (origenTitulo ?? '').trim();
  if (titulo) return titulo;
  if (!prefill) return null;
  const norma = (prefill.norma ?? '').trim();
  const articulo = (prefill.articulo ?? '').trim();
  const amparo = (prefill.amparo ?? '').trim();
  if (norma && articulo) return `${norma} · ${articulo}`;
  if (norma) return norma;
  if (articulo) return articulo;
  if (amparo) return amparo;
  return null;
}
