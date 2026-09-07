import { z } from 'zod';

/**
 * TABLA DE SUSTANCIAS (sección 4.7 de la especificación) — modelo `Sustancia`.
 *
 * Ayuda al agente a distinguir, de forma ORIENTATIVA, entre el "probable consumo propio"
 * (posible infracción administrativa, LO 4/2015 art. 36.16) y los "indicios de tráfico"
 * (posible delito, art. 368 CP), a partir de:
 *  - un umbral orientativo de consumo diario (mg de sustancia),
 *  - un umbral orientativo de acopio para consumo propio (gramos; según el Acuerdo de la Sala 2ª
 *    del Tribunal Supremo de 19/10/2001 y jurisprudencia posterior, se estima como el consumo
 *    diario × 5 días),
 *  - las notas de pureza y los indicadores de tráfico observados (dosis fraccionadas, útiles de
 *    pesaje/balanza, dinero fraccionado, múltiples envoltorios…).
 *
 * Reglas NO NEGOCIABLES (CLAUDE.md, nota legal y §4.7):
 *  - Todo es ORIENTATIVO, jamás imperativo ni concluyente. La calificación consumo/tráfico es
 *    JUDICIAL: el texto lo dice siempre (`PIE_SUSTANCIAS`).
 *  - Cada sustancia lleva su FUENTE (INTCF, Acuerdo TS 19/10/2001 y jurisprudencia) y su estado
 *    editorial. Nada se publica "verificado" desde el pipeline: se marca `pendienteRevision`
 *    con `notaRevision` (qué falta confirmar) hasta que pase por revisor-juridico.
 *
 * Este módulo es PURO (sin red, disco ni estado): apto para tests exhaustivos.
 */

/**
 * Pie de responsabilidad fijo que acompaña SIEMPRE a la tabla de sustancias y a cualquier
 * orientación derivada de ella (§4.7). La app lo muestra al pie del resultado.
 */
export const PIE_SUSTANCIAS =
  'Umbrales orientativos (dosis de consumo/acopio para consumo propio). La calificación como ' +
  'consumo o tráfico corresponde a la autoridad judicial, valorando la cantidad, la pureza y ' +
  'las circunstancias del caso (indicadores de tráfico). No sustituye al informe de laboratorio.';

/** Resultado orientativo: infracción administrativa por consumo/tenencia. */
export const RESULTADO_PROBABLE_CONSUMO =
  'Probable consumo propio (posible infracción administrativa, LO 4/2015 art. 36.16)';

/** Resultado orientativo: indicios de un delito de tráfico de drogas. */
export const RESULTADO_INDICIOS_TRAFICO = 'Indicios de tráfico (posible delito, art. 368 CP)';

/**
 * Esquema Zod de una `Sustancia` (§4.7, fila "Sustancia" del modelo de datos, §6.1).
 *
 * Los umbrales son NÚMEROS orientativos:
 *  - `umbralConsumoDiarioMg`: miligramos de sustancia estimados de consumo en un día.
 *  - `umbralAcopioG`: gramos que se estiman de acopio para el consumo propio (≈ consumo diario
 *    × 5 días, doctrina TS 19/10/2001). Por encima, procede valorar indicios de tráfico.
 */
export const Sustancia = z.object({
  /** Identificador estable (slug en español, p. ej. "cocaina"). */
  id: z.string().min(1),
  /** Nombre de la sustancia ("Cocaína", "Cannabis (marihuana)"…). */
  nombre: z.string().min(1),
  /** Jerga de calle para el buscador ("coca", "farlopa", "maría", "caballo"…). */
  aliases: z.array(z.string().min(1)).default([]),
  /** Umbral ORIENTATIVO de consumo diario, en miligramos de sustancia. */
  umbralConsumoDiarioMg: z.number().positive(),
  /** Umbral ORIENTATIVO de acopio para consumo propio, en gramos (≈ consumo diario × 5 días). */
  umbralAcopioG: z.number().positive(),
  /** Notas de pureza que matizan los umbrales (los datos suelen referirse a sustancia pura). */
  notasPureza: z.string(),
  /** Indicadores que apuntan a tráfico (dosis fraccionadas, balanza, dinero fraccionado…). */
  indicadoresTrafico: z.array(z.string().min(1)).default([]),
  /** Fuente de los umbrales (INTCF, Acuerdo TS 19/10/2001 y jurisprudencia posterior). */
  fuente: z.string().min(1),
  /** Estado editorial: en el seed SIEMPRE `true` (nada se autopublica como verificado). */
  pendienteRevision: z.boolean(),
  /** Qué dato concreto debe confirmar el revisor jurídico ("a verificar"). */
  notaRevision: z.string(),
});
export type Sustancia = z.infer<typeof Sustancia>;

/** Orientación cerrada consumo/tráfico (para la UI: color, icono, texto). */
export const OrientacionSustancia = z.enum(['probable_consumo', 'indicios_trafico']);
export type OrientacionSustancia = z.infer<typeof OrientacionSustancia>;

/** Resultado orientativo de comparar una cantidad con el umbral de acopio de una sustancia. */
export interface ResultadoSustancia {
  /** Orientación cerrada (probable consumo / indicios de tráfico). */
  orientacion: OrientacionSustancia;
  /** Titular orientativo con su encaje legal (RESULTADO_PROBABLE_CONSUMO / _INDICIOS_TRAFICO). */
  titulo: string;
  /** Explicación del porqué (cantidad frente al umbral de acopio, con la salvedad de la pureza). */
  motivo: string;
  /** Indicadores de tráfico de la sustancia a valorar (nunca deciden por sí solos). */
  indicadoresTrafico: string[];
  /** Fuente de los umbrales de la sustancia. */
  fuente: string;
  /** Pie de responsabilidad fijo (`PIE_SUSTANCIAS`): la calificación es judicial. */
  pie: string;
}

/**
 * Orientación consumo/tráfico a partir de una cantidad aprehendida (en gramos), ORIENTATIVA.
 *
 * Compara la cantidad con el `umbralAcopioG` de la sustancia (acopio para consumo propio ≈
 * consumo diario × 5, doctrina TS 19/10/2001):
 *  - `cantidadG <= umbralAcopioG` → orientación "probable consumo propio".
 *  - `cantidadG >  umbralAcopioG` → orientación "indicios de tráfico".
 *
 * En AMBOS casos la valoración final es judicial y depende de la pureza y de los indicadores de
 * tráfico observados: por eso el resultado incluye SIEMPRE esos indicadores y el pie fijo. NO es
 * un veredicto; es una ayuda para el agente en la calle.
 */
export function orientarSustancia(sustancia: Sustancia, cantidadG: number): ResultadoSustancia {
  const base = {
    indicadoresTrafico: sustancia.indicadoresTrafico,
    fuente: sustancia.fuente,
    pie: PIE_SUSTANCIAS,
  };
  if (cantidadG > sustancia.umbralAcopioG) {
    return {
      ...base,
      orientacion: 'indicios_trafico',
      titulo: RESULTADO_INDICIOS_TRAFICO,
      motivo:
        `La cantidad orientativa (${cantidadG} g) supera el acopio estimado para consumo propio ` +
        `(${sustancia.umbralAcopioG} g ≈ consumo diario × 5 días). Procede valorar indicios de ` +
        'tráfico, atendiendo a la pureza y a los indicadores observados.',
    };
  }
  return {
    ...base,
    orientacion: 'probable_consumo',
    titulo: RESULTADO_PROBABLE_CONSUMO,
    motivo:
      `La cantidad orientativa (${cantidadG} g) no supera el acopio estimado para consumo propio ` +
      `(${sustancia.umbralAcopioG} g ≈ consumo diario × 5 días). Es compatible con el consumo ` +
      'propio, salvo que la pureza o los indicadores observados apunten a tráfico.',
  };
}
