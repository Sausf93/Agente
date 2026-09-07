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
 * Rango de importe del SEGURO OBLIGATORIO de circulación (LRCSCVM art. 3.1, RDL 8/2004).
 * Conducir sin seguro no se sanciona por la LSV art. 80, sino por su ley propia, con un
 * rango único (601–3.005 €) graduable. Se modela aparte para no forzarlo a los tramos de
 * tráfico. Fuente: RDL 8/2004 (BOE-A-2004-18911) art. 3. Marcar "a verificar" ante cambios.
 */
export const RANGO_IMPORTE_SEGURO_OBLIGATORIO = { min: 601, max: 3_005 } as const;

/**
 * Rango de importe del EXCESO DE VELOCIDAD (LSV, cuadro del Anexo IV / RDL 6/2015).
 * La sanción NO es un valor fijo por gravedad, sino un cuadro graduado por tramos de km/h de
 * exceso: 100 € (sin puntos), 300, 400, 500 y 600 € (con 2/4/6 puntos según el tramo). Por eso
 * no encaja en los tramos fijos de `trafico` (grave 200 / muy grave 500) y se modela aparte con
 * un rango único graduable. Fuente: LSV (BOE-A-2015-11722), cuadro de excesos de velocidad.
 * Marcar "a verificar" ante cambios del cuadro.
 */
export const RANGO_IMPORTE_VELOCIDAD = { min: 100, max: 600 } as const;

/**
 * Rango de importe de ALCOHOLEMIA y DROGAS por vía administrativa (LSV art. 77/80 y cuadro DGT).
 * Tampoco es un valor fijo: alcohol 500 € (tramo 0,25–0,50 mg/l, 4 puntos) o 1.000 € (tramo
 * superior, reincidencia o negativa parcial, 6 puntos); drogas 1.000 € (6 puntos) por mera
 * presencia. Al superar el tope de `muy_grave` de tráfico (500 €) se modela con rango propio.
 * Fuente: LSV (BOE-A-2015-11722) y cuadro sancionador DGT. Marcar "a verificar" ante cambios.
 */
export const RANGO_IMPORTE_ALCOHOL_DROGAS = { min: 500, max: 1_000 } as const;

/**
 * Rango de importe del TRANSPORTE por carretera (LOTT, Ley 16/1987, art. 143; y su Reglamento).
 * Cubre las infracciones de transporte que un agente de tráfico ve en la calle (manipulación o
 * mal uso del tacógrafo, exceso de tiempos de conducción del Rgto (CE) 561/2006, exceso de masa,
 * etc.). La sanción se gradúa en tramos amplios según la gravedad (leve/grave/muy grave), por lo
 * que se modela con un rango único graduable en lugar de un valor fijo. Fuente: LOTT
 * (BOE-A-1987-17803) art. 143. Marcar "a verificar" ante cambios (la Ley 13/2021 reformó el cuadro).
 */
export const RANGO_IMPORTE_TRANSPORTE = { min: 100, max: 6_000 } as const;

/**
 * Rangos de importe de EXTRANJERÍA (LO 4/2000, art. 55.1). La estancia irregular y demás
 * infracciones administrativas de extranjería se sancionan por tramos: leves hasta 500 €; graves
 * de 501 a 10.000 €; muy graves de 10.001 a 100.000 €. IMPORTANTE: en la estancia irregular la
 * sanción PRINCIPAL suele ser la expulsión (art. 57), no la multa; el importe es orientativo.
 * Fuente: LO 4/2000 (BOE-A-2000-544) art. 55.1. Marcar "a verificar" ante cambios.
 */
export const RANGOS_IMPORTE_EXTRANJERIA = {
  leve: { min: 0, max: 500 },
  grave: { min: 501, max: 10_000 },
  muy_grave: { min: 10_001, max: 100_000 },
} as const;

/**
 * Rangos de importe de ANIMALES POTENCIALMENTE PELIGROSOS (Ley 50/1999, art. 13.5): la tenencia
 * de un PPP sin licencia, sin seguro o sin bozal en la vía pública se sanciona por tramos: leves
 * de 60,10 a 150,25 €; graves de 150,25 a 1.502,53 €; muy graves de 1.502,54 a 15.025,30 €.
 * Fuente: Ley 50/1999 (BOE-A-1999-24419) art. 13.5. Las ordenanzas municipales pueden concretar
 * o endurecer; marcar "a verificar".
 */
export const RANGOS_IMPORTE_ANIMALES = {
  // Ley 50/1999 art. 13.5 (BOE-A-1999-24419): leve 150,25–300,51 · grave 300,52–2.404,05 ·
  // muy grave 2.404,06–15.025,30. (Los rangos anteriores estaban mal y dejaban pasar importes
  // por debajo del mínimo legal; corregido tras revisión jurídica.)
  leve: { min: 150.25, max: 300.51 },
  grave: { min: 300.52, max: 2_404.05 },
  muy_grave: { min: 2_404.06, max: 15_025.3 },
} as const;

/**
 * Marco normativo con el que interpretar los rangos de importe.
 * `trafico`, `seguridad_ciudadana`, `extranjeria` y `animales` tienen rangos legales POR
 * GRAVEDAD que se validan. `seguro_obligatorio`, `velocidad`, `alcohol_drogas` y `transporte`
 * tienen un rango único legal graduable (sin tramos por gravedad), modelados aparte porque no
 * encajan en los tramos fijos de tráfico. `municipal` y `autonomico` no tienen un rango único
 * (varía por ordenanza/comunidad): solo se valida coherencia (presencia y reducido ≤ base) y
 * queda para revisión a dos ojos. `penal` marca los DELITOS (vía penal): no llevan importe
 * administrativo, `validarImporte` corta de inmediato para ellos (la pena la fija el Código
 * Penal, no un rango de multa). `no_sancionador` marca las ENTRADAS CONSULTABLES que no imponen
 * sanción (p. ej. el REQUERIMIENTO de identificación del art. 16 LO 4/2015, una facultad/
 * diligencia, no una infracción): no llevan importe y `validarImporte`/`validarMinimosPublicacion`
 * no lo exigen.
 */
export type MarcoImporte =
  | 'trafico'
  | 'seguridad_ciudadana'
  | 'seguro_obligatorio'
  | 'velocidad'
  | 'alcohol_drogas'
  | 'transporte'
  | 'extranjeria'
  | 'animales'
  | 'municipal'
  | 'autonomico'
  | 'penal'
  | 'no_sancionador';

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
  if (marco === 'no_sancionador') {
    return []; // entrada consultable sin sanción (p. ej. requerimiento de identificación)
  }

  // Sin rango legal único: solo coherencia (queda para revisión a dos ojos).
  if (marco === 'municipal' || marco === 'autonomico') {
    return validarCoherenciaImporte(infraccion);
  }

  const problemas = validarCoherenciaImporte(infraccion);
  if (infraccion.importeEur === null) return problemas;

  // Marcos con rango único graduable (sin tramos por gravedad).
  const rangosUnicos: Partial<Record<MarcoImporte, { min: number; max: number }>> = {
    seguro_obligatorio: RANGO_IMPORTE_SEGURO_OBLIGATORIO,
    velocidad: RANGO_IMPORTE_VELOCIDAD,
    alcohol_drogas: RANGO_IMPORTE_ALCOHOL_DROGAS,
    transporte: RANGO_IMPORTE_TRANSPORTE,
  };
  const rangoUnico = rangosUnicos[marco];
  if (rangoUnico) {
    const { min, max } = rangoUnico;
    if (infraccion.importeEur < min || infraccion.importeEur > max) {
      problemas.push({
        campo: 'importeEur',
        mensaje: `Importe ${infraccion.importeEur} € fuera del rango legal [${min}-${max}] para el marco "${marco}"`,
      });
    }
    return problemas;
  }

  // Marcos con tabla de rangos POR GRAVEDAD (leve/grave/muy grave).
  const tablasPorGravedad: Partial<
    Record<MarcoImporte, Record<'leve' | 'grave' | 'muy_grave', { min: number; max: number }>>
  > = {
    trafico: RANGOS_IMPORTE_TRAFICO,
    seguridad_ciudadana: RANGOS_IMPORTE_SEGURIDAD_CIUDADANA,
    extranjeria: RANGOS_IMPORTE_EXTRANJERIA,
    animales: RANGOS_IMPORTE_ANIMALES,
  };
  const tabla = tablasPorGravedad[marco] ?? RANGOS_IMPORTE_TRAFICO;
  // Los delitos ya se cortaron arriba; aquí la gravedad es leve/grave/muy_grave.
  const rango = tabla[infraccion.gravedad as 'leve' | 'grave' | 'muy_grave'];

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
 * porque los sinónimos viven en otra tabla. `marco` es opcional y solo sirve para
 * eximir del importe a las entradas `no_sancionador` (consultables sin sanción, p. ej.
 * el requerimiento de identificación del art. 16 LO 4/2015).
 */
export function validarMinimosPublicacion(
  infraccion: Infraccion,
  numSinonimos: number,
  marco?: MarcoImporte,
): ProblemaValidacion[] {
  const problemas: ProblemaValidacion[] = [];
  const esNoSancionador = marco === 'no_sancionador';

  if (!infraccion.articuloId) {
    problemas.push({ campo: 'articuloId', mensaje: 'Falta el artículo enlazado' });
  }
  if (!infraccion.textoBoletin.trim()) {
    problemas.push({ campo: 'textoBoletin', mensaje: 'Falta el texto del boletín' });
  }
  if (infraccion.tipo === 'administrativa' && infraccion.importeEur === null && !esNoSancionador) {
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
