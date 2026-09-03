import type { Infraccion } from './content.js';

/**
 * Validadores de CALIDAD DE CONTENIDO (sección 8.3 de la especificación).
 *
 * Se ejecutan en el pipeline de contenido y en el panel de administración antes de
 * publicar una `ContentVersion`. Un importe fuera de rango o una infracción sin fuente
 * NO deben llegar nunca al dispositivo del agente: destruyen la confianza.
 */

export interface ProblemaValidacion {
  campo: string;
  mensaje: string;
}

/**
 * Rangos de importe por gravedad para infracciones de TRÁFICO (LSV art. 80).
 * Fuente: LSV art. 80. Marcar como "a verificar" ante cambios normativos.
 */
export const RANGOS_IMPORTE_TRAFICO = {
  leve: { min: 0, max: 100 },
  grave: { min: 200, max: 200 },
  muy_grave: { min: 500, max: 500 },
} as const;

/**
 * Rangos de importe por gravedad para SEGURIDAD CIUDADANA (LO 4/2015 art. 39).
 * Fuente: LO 4/2015 art. 39.
 */
export const RANGOS_IMPORTE_SEGURIDAD_CIUDADANA = {
  leve: { min: 100, max: 600 },
  grave: { min: 601, max: 30_000 },
  muy_grave: { min: 30_001, max: 600_000 },
} as const;

/**
 * Marco normativo con el que interpretar los rangos de importe.
 * `trafico` y `seguridad_ciudadana` tienen rangos legales fijos que se validan.
 * `municipal` y `autonomico` no tienen un rango único (varía por ordenanza/comunidad):
 * solo se valida coherencia (presencia y reducido ≤ base) y queda para revisión a dos ojos.
 */
export type MarcoImporte = 'trafico' | 'seguridad_ciudadana' | 'municipal' | 'autonomico';

function validarCoherenciaImporte(
  infraccion: Pick<Infraccion, 'importeEur' | 'importeReducidoEur'>,
): ProblemaValidacion[] {
  const problemas: ProblemaValidacion[] = [];
  if (infraccion.importeEur === null) {
    problemas.push({ campo: 'importeEur', mensaje: 'Falta el importe' });
    return problemas;
  }
  if (
    infraccion.importeReducidoEur !== null &&
    infraccion.importeReducidoEur > infraccion.importeEur
  ) {
    problemas.push({
      campo: 'importeReducidoEur',
      mensaje: 'El importe reducido no puede ser mayor que el importe base',
    });
  }
  return problemas;
}

/**
 * Valida el importe de una infracción administrativa contra los rangos legales.
 * Devuelve la lista de problemas (vacía si es correcta). No valida delitos (vía penal).
 */
export function validarImporte(
  infraccion: Pick<Infraccion, 'gravedad' | 'tipo' | 'importeEur' | 'importeReducidoEur'>,
  marco: MarcoImporte,
): ProblemaValidacion[] {
  if (infraccion.tipo === 'penal' || infraccion.gravedad === 'delito') {
    return []; // los delitos no llevan importe administrativo
  }

  // Sin rango legal único: solo coherencia (queda para revisión a dos ojos).
  if (marco === 'municipal' || marco === 'autonomico') {
    return validarCoherenciaImporte(infraccion);
  }

  const problemas = validarCoherenciaImporte(infraccion);
  if (infraccion.importeEur === null) return problemas;

  const tabla =
    marco === 'trafico' ? RANGOS_IMPORTE_TRAFICO : RANGOS_IMPORTE_SEGURIDAD_CIUDADANA;
  const rango = tabla[infraccion.gravedad];

  if (infraccion.importeEur < rango.min || infraccion.importeEur > rango.max) {
    problemas.push({
      campo: 'importeEur',
      mensaje: `Importe ${infraccion.importeEur} € fuera del rango legal [${rango.min}-${rango.max}] para gravedad "${infraccion.gravedad}" (${marco})`,
    });
  }

  return problemas;
}

/**
 * Comprueba los mínimos de publicación de una infracción (sección 8.3):
 * artículo enlazado, importe (si administrativa), gravedad, texto de boletín,
 * al menos dos sinónimos y fuente/consecuencia. `numSinonimos` se pasa aparte
 * porque los sinónimos viven en otra tabla.
 */
export function validarMinimosPublicacion(
  infraccion: Infraccion,
  numSinonimos: number,
): ProblemaValidacion[] {
  const problemas: ProblemaValidacion[] = [];

  if (!infraccion.articuloId) {
    problemas.push({ campo: 'articuloId', mensaje: 'Falta el artículo enlazado' });
  }
  if (!infraccion.textoBoletin.trim()) {
    problemas.push({ campo: 'textoBoletin', mensaje: 'Falta el texto del boletín' });
  }
  if (infraccion.tipo === 'administrativa' && infraccion.importeEur === null) {
    problemas.push({ campo: 'importeEur', mensaje: 'Falta el importe' });
  }
  if (numSinonimos < 2) {
    problemas.push({
      campo: 'sinonimos',
      mensaje: `Se requieren al menos 2 sinónimos (hay ${numSinonimos})`,
    });
  }

  return problemas;
}
