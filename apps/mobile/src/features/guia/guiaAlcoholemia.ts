/**
 * Datos de la GUÍA RÁPIDA DE ALCOHOLEMIA. Contenido de referencia ESTÁTICO en la app (mismo patrón
 * que los derechos): agrega, en una sola pantalla escaneable, las tasas y la frontera penal que hoy
 * viven en prosa en las fichas del paquete (`inf-alcoholemia`, `del-alcoholemia-penal`,
 * `inf-negativa-prueba`). Es ORIENTATIVO y "Borrador beta": la valoración final es del agente/juez.
 *
 * Los valores están PENDIENTES DE VERIFICACIÓN por el revisor jurídico (igual que las fichas fuente),
 * y la medición de campo es la de AIRE espirado (mg/l); el equivalente en sangre es aproximado.
 */

export interface FilaTasaAlcohol {
  /** Supuesto o tipo de conductor. */
  supuesto: string;
  /** Umbral en aire espirado (mg/l), la medición de campo. */
  aire: string;
  /** Consecuencia orientativa del tramo. */
  consecuencia: string;
  /** Marca el tramo que ya es vía penal (para pintarlo distinto). */
  penal?: boolean;
}

/** Tabla de tasas (fuente: art. 20 RGC / cuadro DGT y art. 379.2 CP; ver fichas vinculadas). */
export const TASAS_ALCOHOL: readonly FilaTasaAlcohol[] = [
  {
    supuesto: 'Conductor general',
    aire: '0,25 – 0,50 mg/l',
    consecuencia: '500 € y 4 puntos (administrativa)',
  },
  {
    supuesto: 'Tasa alta',
    aire: 'más de 0,50 mg/l',
    consecuencia: '1.000 € y 6 puntos (administrativa)',
  },
  {
    supuesto: 'Noveles y profesionales',
    aire: 'más de 0,15 mg/l',
    consecuencia: '1.000 € y 6 puntos (administrativa)',
  },
  {
    supuesto: 'Frontera PENAL (art. 379.2 CP)',
    aire: 'más de 0,60 mg/l',
    consecuencia: 'DELITO → procede instruir atestado (no boletín)',
    penal: true,
  },
];

/** Recordatorio de procedimiento (orientativo, a verificar por el revisor). */
export const PASOS_ALCOHOLEMIA: readonly string[] = [
  'La medición de campo es en AIRE espirado (mg/l); el equivalente en sangre (g/l) es orientativo (aproximadamente el doble).',
  'Procede una SEGUNDA prueba de contraste, tras un intervalo mínimo de 10 minutos (art. 23 RGC), para confirmar la primera.',
  'El interesado puede pedir un ANÁLISIS DE SANGRE como contraste (art. 23 RGC): corre a su cargo si el resultado CONFIRMA la infracción (positivo), y a cargo de la Administración si NO la confirma (negativo).',
  'La REINCIDENCIA (repetir la infracción en el plazo de un año) eleva la sanción a 1.000 € y 6 puntos, también en el tramo 0,25–0,50 mg/l.',
  'NEGARSE a la prueba, requerido legalmente, es un DELITO autónomo (art. 383 CP), con independencia de la tasa.',
  'Desde 0,60 mg/l en aire (o con influencia acreditada) el hecho es DELITO (art. 379.2 CP): atestado, no boletín.',
];

export interface FichaVinculadaAlcohol {
  id: string;
  label: string;
}

/** Fichas del paquete que amplían cada supuesto (se abren en la pantalla de ficha). */
export const FICHAS_ALCOHOL: readonly FichaVinculadaAlcohol[] = [
  { id: 'inf-alcoholemia', label: 'Alcoholemia administrativa (tasas y multas)' },
  { id: 'del-alcoholemia-penal', label: 'Alcoholemia penal · delito (art. 379.2 CP)' },
  { id: 'inf-negativa-prueba', label: 'Negativa a la prueba (delito, art. 383 CP)' },
];
