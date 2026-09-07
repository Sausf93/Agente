import { Sustancia } from '@agente/shared';

/**
 * SEED de la TABLA DE SUSTANCIAS (§4.7 de la especificación).
 *
 * Sustancias más frecuentes "en la calle": cannabis/marihuana, hachís, cocaína, heroína,
 * MDMA/éxtasis, anfetamina/speed y metanfetamina. Por cada una: umbral orientativo de consumo
 * diario y de acopio para consumo propio (≈ consumo diario × 5 días), notas de pureza,
 * indicadores de tráfico y su fuente.
 *
 * FUENTE de los umbrales:
 *  - Tablas del Instituto Nacional de Toxicología y Ciencias Forenses (INTCF): "dosis de
 *    consumo diario" por sustancia.
 *  - Acuerdo del Pleno no jurisdiccional de la Sala 2ª del Tribunal Supremo de 19/10/2001 y
 *    jurisprudencia posterior: el acopio para el consumo propio se estima como el consumo de
 *    5 días (consumo diario × 5). El límite de "notoria importancia" (agravante) se fija en el
 *    consumo de 500 días (consumo diario × 500) sobre sustancia REDUCIDA A PUREZA.
 *
 * Reglas NO NEGOCIABLES (CLAUDE.md, nota legal y §4.7):
 *  - Todo es ORIENTATIVO. La calificación consumo/tráfico es JUDICIAL (lo dice `PIE_SUSTANCIAS`).
 *  - NADA se publica "verificado" desde el pipeline: TODO queda `pendienteRevision = true` con
 *    `notaRevision` (qué confirmar). Pasa por revisor-juridico antes de salir al dispositivo.
 *  - Los umbrales son cifras SENSIBLES: no deben mostrarse "verificadas" hasta la revisión.
 */

/** Fuente común de los umbrales (INTCF + doctrina del TS). */
const FUENTE =
  'INTCF (dosis de consumo diario); Acuerdo del Pleno no jurisdiccional de la Sala 2ª del ' +
  'Tribunal Supremo de 19/10/2001 y jurisprudencia posterior (acopio para consumo propio ≈ ' +
  'consumo diario × 5 días).';

/** Indicadores de tráfico comunes a casi todas las sustancias (se pueden ampliar por sustancia). */
const INDICADORES_COMUNES = [
  'sustancia distribuida en dosis o papelinas fraccionadas listas para la venta',
  'útiles de pesaje o corte (balanza de precisión, recortes, tijeras)',
  'dinero en efectivo fraccionado en billetes pequeños',
  'múltiples envoltorios o bolsas de autocierre',
  'listados de deudas, "puntos" o anotaciones de venta',
  'ausencia de signos de consumo propio en la persona portadora',
];

/**
 * Aviso de pureza recurrente: para cocaína, heroína, MDMA, anfetamina y metanfetamina los
 * umbrales del INTCF se refieren a sustancia PURA, por lo que la cantidad aprehendida debe
 * reducirse a pureza (según análisis de laboratorio) antes de compararla.
 */
const PUREZA_REDUCIR =
  'Umbral referido a sustancia PURA: reducir la cantidad aprehendida a su riqueza real ' +
  '(porcentaje de pureza del análisis del laboratorio) antes de compararla con el acopio.';

interface SustanciaInput {
  id: string;
  nombre: string;
  aliases: string[];
  /** Consumo diario orientativo en miligramos de sustancia (INTCF). */
  umbralConsumoDiarioMg: number;
  /** Acopio orientativo en gramos (≈ consumo diario × 5 días). */
  umbralAcopioG: number;
  notasPureza: string;
  /** Indicadores propios de la sustancia; se suman a `INDICADORES_COMUNES`. */
  indicadoresExtra?: string[];
  notaRevision: string;
}

/** Construye una `Sustancia` validada, siempre `pendienteRevision` y con la fuente común. */
function construirSustancia(input: SustanciaInput): Sustancia {
  return Sustancia.parse({
    id: input.id,
    nombre: input.nombre,
    aliases: input.aliases,
    umbralConsumoDiarioMg: input.umbralConsumoDiarioMg,
    umbralAcopioG: input.umbralAcopioG,
    notasPureza: input.notasPureza,
    indicadoresTrafico: [...(input.indicadoresExtra ?? []), ...INDICADORES_COMUNES],
    fuente: FUENTE,
    pendienteRevision: true,
    notaRevision: input.notaRevision,
  });
}

/**
 * Tabla de sustancias del seed. Umbrales orientativos derivados de las dosis de consumo diario
 * del INTCF y del criterio del TS (acopio = consumo diario × 5).
 *
 * Relación consumo diario → acopio (× 5) usada:
 *  - Cannabis (marihuana): 20 g/día → 100 g   | notoria importancia ~10 kg (peso bruto).
 *  - Hachís:                5 g/día → 25 g     | notoria importancia ~2,5 kg (peso bruto).
 *  - Cocaína:               1,5 g/día → 7,5 g  | notoria importancia ~750 g (pura).
 *  - Heroína:               0,6 g/día → 3 g    | notoria importancia ~300 g (pura).
 *  - MDMA/éxtasis:          0,48 g/día → 2,4 g | notoria importancia ~240 g (pura).
 *  - Anfetamina/speed:      0,18 g/día → 0,9 g | notoria importancia ~90 g (pura).
 *  - Metanfetamina:         0,18 g/día → 0,9 g | notoria importancia ~90 g (pura).
 */
export const SUSTANCIAS_SEED: Sustancia[] = [
  construirSustancia({
    id: 'cannabis-marihuana',
    nombre: 'Cannabis (marihuana)',
    aliases: ['maria', 'marihuana', 'hierba', 'cogollo', 'grifa', 'weed', 'porro', 'canuto'],
    umbralConsumoDiarioMg: 20000, // ~20 g/día de material vegetal
    umbralAcopioG: 100,
    notasPureza:
      'El umbral se refiere al PESO BRUTO del material vegetal (no se reduce a THC puro): la ' +
      'concentración de THC varía mucho. Distinguir de plantas en cultivo (nº de plantas, ' +
      'peso en verde) y del autocultivo compartido.',
    indicadoresExtra: [
      'material vegetal ya cogollado, secado y pesado en dosis',
      'gran número de plantas o plantación con medios de cultivo intensivo',
    ],
    notaRevision:
      'Verificar la dosis de consumo diario y el umbral de acopio de marihuana con la última ' +
      'tabla del INTCF y la jurisprudencia (peso bruto vs. THC). Confirmar tratamiento del ' +
      'autocultivo para consumo propio.',
  }),
  construirSustancia({
    id: 'hachis',
    nombre: 'Hachís',
    aliases: ['hachis', 'hash', 'costo', 'chocolate', 'goma', 'tate', 'polen'],
    umbralConsumoDiarioMg: 5000, // ~5 g/día
    umbralAcopioG: 25,
    notasPureza:
      'Umbral sobre PESO BRUTO de la resina (no se reduce a THC puro). La forma de presentación ' +
      '(tabletas, "bellotas") y el número de piezas son relevantes.',
    notaRevision:
      'Verificar dosis diaria y acopio de hachís con la tabla del INTCF vigente (peso bruto de ' +
      'resina) y la jurisprudencia de la Sala 2ª.',
  }),
  construirSustancia({
    id: 'cocaina',
    nombre: 'Cocaína',
    aliases: ['coca', 'farlopa', 'perico', 'nieve', 'blanca', 'papelina', 'tema'],
    umbralConsumoDiarioMg: 1500, // ~1,5 g/día de cocaína pura
    umbralAcopioG: 7.5,
    notasPureza: PUREZA_REDUCIR,
    notaRevision:
      'Verificar la dosis de consumo diario de cocaína (sustancia pura) con la tabla del INTCF y ' +
      'el criterio de reducción a pureza del laboratorio antes de comparar con el acopio.',
  }),
  construirSustancia({
    id: 'heroina',
    nombre: 'Heroína',
    aliases: ['caballo', 'jaco', 'heroina', 'potro', 'jamelgo'],
    umbralConsumoDiarioMg: 600, // ~0,6 g/día de heroína pura
    umbralAcopioG: 3,
    notasPureza: PUREZA_REDUCIR,
    indicadoresExtra: ['dosis preparadas para venta al menudeo ("chinos", papelinas)'],
    notaRevision:
      'Verificar la dosis de consumo diario de heroína (sustancia pura) con la tabla del INTCF y ' +
      'la reducción a pureza. Contrastar con jurisprudencia por la alta variabilidad de riqueza.',
  }),
  construirSustancia({
    id: 'mdma-extasis',
    nombre: 'MDMA (éxtasis)',
    aliases: ['mdma', 'extasis', 'pirula', 'pastis', 'eme', 'cristal de mdma', 'adam'],
    umbralConsumoDiarioMg: 480, // ~0,48 g/día de MDMA pura
    umbralAcopioG: 2.4,
    notasPureza:
      PUREZA_REDUCIR +
      ' En comprimidos, valorar el contenido real de MDMA por unidad y el número de pastillas.',
    indicadoresExtra: ['comprimidos con logotipo/troquel homogéneo en cantidad'],
    notaRevision:
      'Verificar la dosis diaria de MDMA (pura) con la tabla del INTCF y cómo computa el TS los ' +
      'comprimidos (contenido real por unidad) frente al peso total.',
  }),
  construirSustancia({
    id: 'anfetamina-speed',
    nombre: 'Anfetamina (speed)',
    aliases: ['speed', 'anfeta', 'anfetamina', 'sulfato', 'anfetas'],
    umbralConsumoDiarioMg: 180, // ~0,18 g/día de anfetamina pura
    umbralAcopioG: 0.9,
    notasPureza:
      PUREZA_REDUCIR +
      ' El "speed" callejero suele presentar riqueza baja (pasta): la reducción a pureza es clave.',
    notaRevision:
      'Verificar la dosis diaria de anfetamina (pura) con la tabla del INTCF y el umbral de ' +
      'notoria importancia (~90 g) para calibrar el acopio.',
  }),
  construirSustancia({
    id: 'metanfetamina',
    nombre: 'Metanfetamina',
    aliases: ['metanfetamina', 'cristal', 'meth', 'tiza', 'hielo', 'crystal'],
    umbralConsumoDiarioMg: 180, // ~0,18 g/día de metanfetamina pura
    umbralAcopioG: 0.9,
    notasPureza: PUREZA_REDUCIR,
    notaRevision:
      'Verificar la dosis diaria y el umbral de notoria importancia de metanfetamina con la ' +
      'tabla del INTCF y la jurisprudencia (a menudo asimilada a la anfetamina).',
  }),
];
