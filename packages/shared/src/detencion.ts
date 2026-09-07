import { z } from 'zod';
import { GravedadPenal, TramoEdadAutor } from './enums.js';

/**
 * MOTOR DE REGLAS DE DETENCIÓN (LECrim) — sección 4.6 de la especificación.
 *
 * Núcleo crítico del producto. Dado el marco penal del delito (gravedad derivada de la pena,
 * art. 33 CP) y las circunstancias que el agente observa (flagrancia, fuga, indicios, riesgo de
 * incomparecencia, domicilio/fianza en delito leve), devuelve una ORIENTACIÓN —nunca una orden—
 * sobre si procede la detención, SIEMPRE con los artículos de la LECrim que la sustentan.
 *
 * Reglas no negociables (CLAUDE.md §4.6):
 *  - Lenguaje ORIENTATIVO, jamás imperativo: "procede valorar", "puede proceder", "no procede
 *    salvo…". Nunca "detén".
 *  - Toda salida lleva sus FUENTES (artículos LECrim / art. 33 CP) y el PIE fijo de
 *    responsabilidad (`PIE_DETENCION`).
 *  - La ENTRADA se modela como banderas claras (booleanos + enum), no como texto libre: es lo
 *    que la app convertirá en un árbol interactivo (mobile-dev) alimentando este mismo motor.
 *
 * Este módulo es PURO (sin red, disco ni estado): función total, apta para tests exhaustivos.
 */

/**
 * Pie de responsabilidad fijo que acompaña SIEMPRE a la orientación de detención (§4.6).
 * La app lo muestra al pie del resultado del árbol.
 */
export const PIE_DETENCION =
  'Orientación basada en LECrim; la valoración de los indicios y del riesgo corresponde al ' +
  'agente y, en su caso, a la autoridad judicial.';

/**
 * Pie de responsabilidad de la RAMA MENOR (LO 5/2000). Sustituye al `PIE_DETENCION` cuando la
 * edad del autor abre el régimen penal del menor (§6 de la spec jurídica).
 */
export const PIE_DETENCION_MENOR =
  'Orientación basada en la LECrim y en la LO 5/2000 (responsabilidad penal del menor); la ' +
  'valoración de los indicios, del riesgo y del régimen aplicable corresponde al agente y, en su ' +
  'caso, al Ministerio Fiscal de Menores y a la autoridad judicial.';

/**
 * Pie de responsabilidad de la RAMA EXTRANJERÍA (LO 4/2000). Sustituye al `PIE_DETENCION` cuando
 * el hecho es solo migratorio/administrativo (§6 de la spec jurídica).
 */
export const PIE_EXTRANJERIA =
  'Orientación basada en la LO 4/2000 (extranjería); la calificación del hecho, la sanción (multa ' +
  'o expulsión) y el eventual internamiento corresponden al procedimiento administrativo y a la ' +
  'autoridad judicial, no a una detención penal policial.';

// --- Citas de artículos (fuente única de las referencias que devuelve el motor) -------------
const ART_33_CP = 'CP art. 33'; // gravedad de la pena → leve / menos grave / grave
const ART_490 = 'LECrim art. 490'; // flagrancia, intento, fuga, rebeldía
const ART_492_1 = 'LECrim art. 492.1'; // obligación de detener a quien esté en un caso del 490
const ART_492_3 = 'LECrim art. 492.3'; // riesgo de incomparecencia
const ART_492_4 = 'LECrim art. 492.4'; // indicios racionales de delito + de participación
const ART_493 = 'LECrim art. 493'; // si no se detiene: identificar y dar cuenta al juzgado
const ART_495 = 'LECrim art. 495'; // delito leve: no cabe detención salvo sin domicilio ni fianza

// --- Citas de la RAMA MENOR (LO 5/2000, responsabilidad penal del menor) --------------------
const ART_LORPM_1_1 = 'LO 5/2000 art. 1.1'; // ámbito 14-18: régimen penal del menor
const ART_LORPM_3 = 'LO 5/2000 art. 3'; // menor de 14: inimputable, protección de menores
const ART_LO_1_1996 = 'LO 1/1996'; // protección jurídica del menor
const ART_LORPM_17 = 'LO 5/2000 art. 17'; // detención del menor: especialidades y garantías

// --- Citas de la RAMA EXTRANJERÍA (LO 4/2000) -----------------------------------------------
const ART_LOEX_53_1_A = 'LO 4/2000 art. 53.1.a'; // estancia irregular: infracción grave (no delito)
const ART_LOEX_55_1 = 'LO 4/2000 art. 55.1'; // sanción de multa por tramos
const ART_LOEX_57 = 'LO 4/2000 art. 57'; // expulsión (con preferencia en la estancia irregular)
const ART_LOEX_58 = 'LO 4/2000 art. 58'; // efectos de la expulsión y prohibición de entrada
const ART_LOEX_61 = 'LO 4/2000 art. 61'; // detención cautelar / medidas cautelares del procedimiento
const ART_LOEX_62 = 'LO 4/2000 art. 62'; // internamiento CIE: medida cautelar judicial

/**
 * Resultado orientativo del árbol de detención.
 *  - `procede`: concurre una causa del art. 490 (flagrancia, intento, fuga o rebeldía) → la
 *    autoridad tiene obligación de detener (art. 492.1).
 *  - `puede_proceder`: cabe la detención por concurrir los requisitos del art. 492.3/492.4
 *    (indicios + participación + riesgo de incomparecencia) o, en delito leve, la excepción del
 *    art. 495 (sin domicilio conocido ni fianza).
 *  - `no_procede_salvo`: por regla general no procede; procede identificar y dar cuenta al
 *    juzgado (art. 493). El `motivo` detalla qué requisito falta para que pudiera proceder.
 *  - `no_detencion_penal`: el hecho NO encaja en el régimen penal de detención (autor menor de 14
 *    años, inimputable; o estancia irregular, infracción administrativa). No hay "salvo": la vía
 *    es la protección de menores (LO 5/2000) o el procedimiento de extranjería (LO 4/2000).
 */
export const OrientacionDetencion = z.enum([
  'procede',
  'puede_proceder',
  'no_procede_salvo',
  'no_detencion_penal',
]);
export type OrientacionDetencion = z.infer<typeof OrientacionDetencion>;

/**
 * ENTRADA del motor: banderas que el agente confirma en el árbol. Todas tienen un valor por
 * defecto conservador para que la app pueda construir el árbol incrementalmente.
 *
 * `domicilioConocido` por defecto `true` y `prestariaFianza` por defecto `false` reflejan el
 * escenario habitual y solo pesan en el delito leve (art. 495).
 */
export const EntradaDetencion = z.object({
  /** Gravedad de la pena del delito (art. 33 CP): leve / menos grave / grave. */
  gravedadCp: GravedadPenal,
  /** Delito flagrante: se sorprende en el momento de cometerlo (art. 490.2). */
  flagrancia: z.boolean().default(false),
  /** Se sorprende a la persona intentando cometer el delito (art. 490.1). */
  intentoDelito: z.boolean().default(false),
  /** Fuga de establecimiento/custodia o situación de rebeldía (art. 490.3-7). */
  fugaORebeldia: z.boolean().default(false),
  /** Motivos racionalmente bastantes para creer en la existencia del delito (art. 492.4.1). */
  indiciosRacionalesDelito: z.boolean().default(false),
  /** Motivos bastantes para creer que la persona participó en el delito (art. 492.4.2). */
  indiciosParticipacion: z.boolean().default(false),
  /** Antecedentes o circunstancias que hacen presumir que no comparecerá (art. 492.3). */
  riesgoIncomparecencia: z.boolean().default(false),
  /** La persona tiene domicilio conocido (solo pesa en delito leve, art. 495). */
  domicilioConocido: z.boolean().default(true),
  /** La persona prestaría fianza bastante (solo pesa en delito leve, art. 495). */
  prestariaFianza: z.boolean().default(false),
  /**
   * Tramo de edad del autor (LO 5/2000). Por defecto `adulto`: las fichas y los tests existentes
   * que no lo informan siguen el árbol penal ordinario sin cambios. `menor_14` y `menor_14_17`
   * activan las ramas del menor (§3-§4 de la spec jurídica).
   */
  edadAutor: TramoEdadAutor.default('adulto'),
  /**
   * Marca "solo hecho migratorio, sin ilícito penal" (LO 4/2000). Por defecto `false`. Es un
   * discriminador de RAMA, no un agravante: la estancia irregular es infracción administrativa,
   * no delito (art. 53.1.a). Si hay además un ilícito penal, NO se marca (se sigue el árbol penal).
   */
  soloHechoMigratorio: z.boolean().default(false),
});
export type EntradaDetencion = z.input<typeof EntradaDetencion>;
/** Entrada ya normalizada (con los valores por defecto aplicados). */
export type EntradaDetencionNormalizada = z.infer<typeof EntradaDetencion>;

/** SALIDA del motor: orientación + explicación + fuentes + pie fijo. */
export interface ResultadoDetencion {
  /** Orientación cerrada (para la UI: color, icono, etc.). */
  orientacion: OrientacionDetencion;
  /** Titular orientativo, NUNCA imperativo ("Procede valorar la detención", …). */
  titulo: string;
  /** Explicación del porqué, citando los artículos y qué requisito falta si no procede. */
  motivo: string;
  /** Artículos que sustentan la orientación (LECrim / art. 33 CP). Nunca vacío. */
  fuentes: string[];
  /** Pie de responsabilidad: `PIE_DETENCION`, `PIE_DETENCION_MENOR` o `PIE_EXTRANJERIA` por rama. */
  pie: string;
  /**
   * Aviso DESTACADO de especialidades cuando interviene un menor (14-17: garantías del art. 17
   * LO 5/2000; o menor en hecho migratorio: protección de menores / posible MENA). Ausente en el
   * régimen ordinario de adultos. La UI lo pinta en un bloque propio bajo el resultado.
   */
  avisosMenor?: string;
}

/** Describe, en lenguaje natural, cuál(es) de las causas del art. 490 concurren. */
function describirCausa490(v: EntradaDetencionNormalizada): string {
  const causas: string[] = [];
  if (v.flagrancia) causas.push('delito flagrante');
  if (v.intentoDelito) causas.push('intento de cometer el delito');
  if (v.fugaORebeldia) causas.push('fuga de la custodia o situación de rebeldía');
  return causas.join(' / ');
}

/**
 * Aviso DESTACADO de las especialidades del régimen del menor 14-17 (art. 17 LO 5/2000). Texto
 * literal de la spec jurídica (§4.2). Plazos «a verificar» por jurista antes de publicar.
 */
const AVISO_MENOR_14_17 =
  'Régimen del menor (14-17 años): si se detiene, la detención policial no puede exceder de 24 ' +
  'horas (art. 17.4 LO 5/2000, a verificar); custodia separada de los mayores (art. 17.3); ' +
  'información inmediata y notificación a representantes legales y al Ministerio Fiscal de Menores ' +
  '—no al juzgado de instrucción ordinario— (art. 17.1); puesta a disposición del Ministerio ' +
  'Fiscal (art. 17.4-17.5). Si es extranjero, aviso a autoridades consulares.';

/**
 * Aviso DESTACADO cuando el hecho es solo migratorio y el autor es (o puede ser) menor: activa la
 * protección de menores y el protocolo de menores extranjeros no acompañados (MENA). Orientativo.
 */
const AVISO_MENOR_MIGRATORIO =
  'El autor es o puede ser menor de edad: además de la vía administrativa de extranjería, procede ' +
  'activar la protección de menores y valorar el protocolo de menores extranjeros no acompañados ' +
  '(MENA), con comunicación al Ministerio Fiscal de Menores (art. 3 LO 5/2000, en relación con la ' +
  'LO 1/1996). La determinación de la minoría de edad corresponde a la autoridad.';

/**
 * Aviso DESTACADO de la ACCIÓN operativa cuando el autor es menor de 14 (§4.1). Espeja el bloque
 * destacado del 14-17: en vez de "salvo…", dice de un vistazo QUÉ PROCEDE con un inimputable.
 */
const AVISO_MENOR_14 =
  'Qué procede: identificar con cautelas de menor; entrega a representantes legales o Entidad ' +
  'Pública de protección de menores; comunicación al Ministerio Fiscal (art. 3 LO 5/2000).';

/**
 * Coletilla MENA que se AÑADE al aviso del menor de 14 cuando, además, el hecho es solo migratorio
 * (posible menor extranjero no acompañado). La minoría de edad la determina la autoridad.
 */
const AVISO_MENOR_14_MENA =
  ' Posible menor extranjero no acompañado (MENA): valorar el protocolo MENA; la determinación de ' +
  'la minoría de edad corresponde a la autoridad.';

/**
 * RAMA A1 · Autor menor de 14 años (inimputable, art. 1.1 y 3 LO 5/2000). No hay detención penal:
 * protección de menores. Texto literal de la spec jurídica (§4.1). Puebla `avisosMenor` con la
 * ACCIÓN operativa (mismo bloque destacado que el 14-17) y, si además el hecho es solo migratorio,
 * añade la mención MENA.
 */
function ramaMenor14(v: EntradaDetencionNormalizada): ResultadoDetencion {
  const avisosMenor = v.soloHechoMigratorio ? AVISO_MENOR_14 + AVISO_MENOR_14_MENA : AVISO_MENOR_14;
  return {
    orientacion: 'no_detencion_penal',
    titulo: 'No procede la detención penal: autor menor de 14 años',
    motivo:
      'El autor es menor de catorce años y es penalmente inimputable (art. 1.1 y 3 LO 5/2000): no ' +
      'se le aplica el régimen penal ni cabe detención penal. Procede su identificación con las ' +
      'cautelas propias de un menor, la entrega a sus representantes legales o, en su defecto, la ' +
      'puesta a disposición de la Entidad Pública de protección de menores, y la comunicación al ' +
      'Ministerio Fiscal (art. 3 LO 5/2000, en relación con la LO 1/1996).',
    fuentes: [ART_LORPM_1_1, ART_LORPM_3, ART_LO_1_1996],
    pie: PIE_DETENCION_MENOR,
    avisosMenor,
  };
}

/**
 * RAMA B1 · Solo hecho migratorio (estancia irregular, sin delito, LO 4/2000). No es detención
 * penal: procedimiento administrativo de extranjería. Texto literal de la spec jurídica (§5.1). Si
 * el autor es (o puede ser) menor, añade el aviso de protección de menores / posible MENA.
 */
function ramaSoloMigratorio(v: EntradaDetencionNormalizada): ResultadoDetencion {
  const esMenor = v.edadAutor === 'menor_14' || v.edadAutor === 'menor_14_17';
  return {
    orientacion: 'no_detencion_penal',
    titulo: 'No es detención penal: la estancia irregular es infracción administrativa',
    motivo:
      'La estancia irregular en España es una infracción administrativa grave, no un delito (art. ' +
      '53.1.a LO 4/2000): no procede detención penal por ese motivo. Procede la identificación y, ' +
      'en su caso, la incoación del procedimiento administrativo sancionador de extranjería, cuya ' +
      'sanción puede ser multa (art. 55.1) o, con preferencia en la estancia irregular, la ' +
      'expulsión (art. 57), con prohibición de entrada (art. 58). Aunque no es una detención ' +
      'penal, cabe (a verificar) la DETENCIÓN CAUTELAR a efectos de incoar o ejecutar la ' +
      'expulsión (art. 61 LO 4/2000), con límites temporales y control judicial: no equivale a ' +
      '"no se puede retener". El internamiento en CIE es una medida cautelar DISTINTA, que acuerda ' +
      'la autoridad judicial a instancia de la Administración (art. 62 LO 4/2000), no una ' +
      'detención penal policial.',
    fuentes: [ART_LOEX_53_1_A, ART_LOEX_55_1, ART_LOEX_57, ART_LOEX_58, ART_LOEX_61, ART_LOEX_62],
    pie: PIE_EXTRANJERIA,
    ...(esMenor ? { avisosMenor: AVISO_MENOR_MIGRATORIO } : {}),
  };
}

/**
 * Evalúa el árbol de detención aplicando la PRECEDENCIA de la spec jurídica (§3): el primero que
 * coincide gana.
 *  1. `menor_14` → RAMA A1: no es detención penal (inimputable), protección de menores.
 *  2. `soloHechoMigratorio` → RAMA B1: no es detención penal (vía administrativa de extranjería).
 *  3. `menor_14_17` → árbol penal LECrim + OVERLAY de las especialidades del art. 17 LO 5/2000.
 *  4. `adulto` (defecto) → árbol penal LECrim ordinario, SIN cambios.
 */
export function evaluarDetencion(entrada: EntradaDetencion): ResultadoDetencion {
  const v = EntradaDetencion.parse(entrada);

  // Precedencia §3.1: menor de 14 → inimputable, no hay detención penal.
  if (v.edadAutor === 'menor_14') return ramaMenor14(v);

  // Precedencia §3.2: solo hecho migratorio → vía administrativa de extranjería.
  if (v.soloHechoMigratorio) return ramaSoloMigratorio(v);

  // Precedencia §3.3-3.4: árbol penal LECrim (adulto o menor 14-17). El resultado base NO cambia.
  const base = evaluarArbolPenal(v);

  // Overlay del menor 14-17 (§4.2): mismo título/motivo/orientación, se AÑADEN garantías y fuente.
  if (v.edadAutor === 'menor_14_17') {
    return {
      ...base,
      fuentes: [...base.fuentes, ART_LORPM_17],
      pie: PIE_DETENCION_MENOR,
      avisosMenor: AVISO_MENOR_14_17,
    };
  }

  return base;
}

/**
 * Árbol de detención penal (LECrim) para un delito y unas circunstancias dadas. Régimen ordinario;
 * las ramas de edad/extranjería se resuelven antes, en `evaluarDetencion`.
 *
 * Prioridad de las ramas:
 *  1. DELITO LEVE (art. 33 CP): el art. 495 rige POR ENCIMA del 490 → por regla general no cabe
 *     detención; solo la excepción "sin domicilio conocido ni fianza" abre la puerta.
 *  2. MENOS GRAVE / GRAVE con causa del art. 490 (flagrancia, intento, fuga/rebeldía) → procede.
 *  3. MENOS GRAVE / GRAVE sin causa del 490: art. 492.3/492.4 (indicios de delito + de
 *     participación + riesgo de incomparecencia) → puede proceder.
 *  4. En otro caso: no procede salvo que concurran esos requisitos; identificar y dar cuenta
 *     al juzgado (art. 493).
 */
function evaluarArbolPenal(v: EntradaDetencionNormalizada): ResultadoDetencion {
  // --- Rama 1: DELITO LEVE (art. 495 rige por encima del 490) --------------------------------
  if (v.gravedadCp === 'leve') {
    const excepcion495 = !v.domicilioConocido && !v.prestariaFianza;
    if (excepcion495) {
      return {
        orientacion: 'puede_proceder',
        titulo: 'Puede proceder la detención',
        motivo:
          'Delito leve: por regla general no cabe la detención (art. 495 LECrim), pero aquí ' +
          'concurre la excepción, ya que la persona no tiene domicilio conocido ni prestaría ' +
          'fianza bastante a juicio del agente.',
        fuentes: [ART_33_CP, ART_495],
        pie: PIE_DETENCION,
      };
    }
    return {
      orientacion: 'no_procede_salvo',
      titulo: 'No procede la detención salvo la excepción del art. 495',
      motivo:
        'Delito leve: no cabe la detención salvo que la persona carezca de domicilio conocido ' +
        'y no preste fianza bastante (art. 495 LECrim). Procede identificarla y dar cuenta al ' +
        'juzgado (art. 493 LECrim).',
      fuentes: [ART_33_CP, ART_495, ART_493],
      pie: PIE_DETENCION,
    };
  }

  // --- Rama 2: MENOS GRAVE / GRAVE con causa del art. 490 -------------------------------------
  const causa490 = v.flagrancia || v.intentoDelito || v.fugaORebeldia;
  if (causa490) {
    return {
      orientacion: 'procede',
      titulo: 'Procede valorar la detención',
      motivo:
        `Concurre una causa del art. 490 LECrim (${describirCausa490(v)}); en tal caso la ` +
        'autoridad y sus agentes tienen el deber de detener (art. 492.1 LECrim).',
      fuentes: [ART_490, ART_492_1],
      pie: PIE_DETENCION,
    };
  }

  // --- Rama 3: MENOS GRAVE / GRAVE sin causa del 490 → art. 492.3/492.4 -----------------------
  const indiciosCompletos = v.indiciosRacionalesDelito && v.indiciosParticipacion;
  if (indiciosCompletos && v.riesgoIncomparecencia) {
    return {
      orientacion: 'puede_proceder',
      titulo: 'Puede proceder la detención',
      motivo:
        'Sin flagrancia, concurren motivos racionalmente bastantes para creer en la existencia ' +
        'del delito y en la participación de la persona (art. 492.4 LECrim) junto con riesgo de ' +
        'incomparecencia (art. 492.3 LECrim).',
      fuentes: [ART_492_3, ART_492_4],
      pie: PIE_DETENCION,
    };
  }

  // --- Rama 4: no procede salvo que concurran los requisitos (identificar y dar cuenta) -------
  const faltan: string[] = [];
  if (!v.indiciosRacionalesDelito) faltan.push('indicios racionales de la existencia del delito');
  if (!v.indiciosParticipacion) faltan.push('indicios de la participación de la persona');
  if (!v.riesgoIncomparecencia) faltan.push('riesgo de incomparecencia');

  return {
    orientacion: 'no_procede_salvo',
    titulo: 'No procede la detención salvo que concurran los requisitos del art. 492',
    motivo:
      'Sin flagrancia, intento ni fuga/rebeldía (art. 490 LECrim), la detención exige motivos ' +
      'racionalmente bastantes sobre la existencia del delito y la participación de la persona ' +
      'y, además, riesgo de incomparecencia (arts. 492.3 y 492.4 LECrim). ' +
      `Falta: ${faltan.join('; ')}. Procede identificar a la persona y dar cuenta al juzgado ` +
      '(art. 493 LECrim).',
    fuentes: [ART_492_3, ART_492_4, ART_493],
    pie: PIE_DETENCION,
  };
}

/**
 * Compone el texto ORIENTATIVO de una `Consecuencia` de tipo `detencion` a partir del resultado
 * del motor. Lo usa el seed penal para materializar la consecuencia en el paquete y garantizar
 * que el texto de la ficha y el árbol interactivo salen de la MISMA fuente de verdad.
 */
export function textoConsecuenciaDetencion(resultado: ResultadoDetencion): string {
  return `${resultado.titulo}. ${resultado.motivo} ${resultado.pie}`;
}
