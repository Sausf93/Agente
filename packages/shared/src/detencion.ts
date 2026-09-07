import { z } from 'zod';
import { GravedadPenal } from './enums.js';

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

// --- Citas de artículos (fuente única de las referencias que devuelve el motor) -------------
const ART_33_CP = 'CP art. 33'; // gravedad de la pena → leve / menos grave / grave
const ART_490 = 'LECrim art. 490'; // flagrancia, intento, fuga, rebeldía
const ART_492_1 = 'LECrim art. 492.1'; // obligación de detener a quien esté en un caso del 490
const ART_492_3 = 'LECrim art. 492.3'; // riesgo de incomparecencia
const ART_492_4 = 'LECrim art. 492.4'; // indicios racionales de delito + de participación
const ART_493 = 'LECrim art. 493'; // si no se detiene: identificar y dar cuenta al juzgado
const ART_495 = 'LECrim art. 495'; // delito leve: no cabe detención salvo sin domicilio ni fianza

/**
 * Resultado orientativo del árbol de detención.
 *  - `procede`: concurre una causa del art. 490 (flagrancia, intento, fuga o rebeldía) → la
 *    autoridad tiene obligación de detener (art. 492.1).
 *  - `puede_proceder`: cabe la detención por concurrir los requisitos del art. 492.3/492.4
 *    (indicios + participación + riesgo de incomparecencia) o, en delito leve, la excepción del
 *    art. 495 (sin domicilio conocido ni fianza).
 *  - `no_procede_salvo`: por regla general no procede; procede identificar y dar cuenta al
 *    juzgado (art. 493). El `motivo` detalla qué requisito falta para que pudiera proceder.
 */
export const OrientacionDetencion = z.enum(['procede', 'puede_proceder', 'no_procede_salvo']);
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
  /** Pie de responsabilidad fijo (`PIE_DETENCION`). */
  pie: string;
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
 * Evalúa el árbol de detención (LECrim) para un delito y unas circunstancias dadas.
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
export function evaluarDetencion(entrada: EntradaDetencion): ResultadoDetencion {
  const v = EntradaDetencion.parse(entrada);

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
