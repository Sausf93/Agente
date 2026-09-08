import {
  Articulo,
  Consecuencia,
  Infraccion,
  Norma,
  Sinonimo,
  CCAA_DE_AUTONOMICA,
  type Cuerpo,
  type CuerpoCompetente,
  type EstadoRevision,
  type MarcoImporte,
} from '@agente/shared';
import { hashTexto } from '../parsers/boe-xml/hash.js';
import type { InfraccionSeed, SeedContenido } from './traficoSeed.js';

/**
 * SEED de NORMATIVA AUTONÓMICA — PILOTO de CANARIAS (capa autonómica, ADR-006/008).
 *
 * Es la mayor carencia del cuerpo AUTONÓMICO: hasta ahora el paquete no traía NINGUNA norma
 * propia de comunidad. Este seed inaugura la capa autonómica igual que el piloto municipal de
 * Santa Cruz de Tenerife inauguró la municipal: liga el contenido a un `territorioId` = el id de
 * la CCAA de Canarias (`CCAA_DE_AUTONOMICA.policia_canaria`, el MISMO id que el onboarding fija
 * al elegir Policía Canaria y que comparte cualquier local canario en su cadena territorial). Así
 * el filtro territorial del cliente (`territorio_id IS NULL OR territorio_id IN (…)`) solo lo
 * muestra a quien tiene Canarias en su cadena (Policía Canaria y policías locales de Canarias),
 * nunca a un agente de otra comunidad.
 *
 * FUENTES OFICIALES (leyes autonómicas canarias, texto consolidado en el BOE/BOC):
 *  - Ley 7/2011, de 5 de abril, de actividades clasificadas y espectáculos públicos y otras
 *    medidas administrativas complementarias (BOE-A-2011-8022): horarios de ocio, cierre,
 *    licencias, aforo, menores — trabajo diario de la Policía Canaria y la Local.
 *  - Ley 8/1991, de 30 de abril, de protección de los animales (BOE-A-1991-16425): identificación
 *    y censo, correa. OJO: en buena parte desplazada/complementada por la ESTATAL Ley 7/2023 de
 *    bienestar animal; se siembra como norma NAVEGABLE con esa advertencia expresa.
 *  - Ley 6/1997, de 4 de julio, de Coordinación de Policías Locales de Canarias (BOE-A-1997-17140):
 *    marco competencial de las policías locales canarias (navegable).
 *  - Ley 2/2008, de 28 de mayo, del Cuerpo General de la Policía Canaria (BOE-A-2008-12494):
 *    funciones del cuerpo autonómico (navegable).
 *
 * Reglas aplicadas (CLAUDE.md y nota legal):
 *  - Textos de artículo y de boletín REDACTADOS POR NOSOTROS (resúmenes neutros, no copiados).
 *  - Toda infracción lleva su artículo fuente; la fecha visible la aporta el `ContentVersion`.
 *  - Lenguaje ORIENTATIVO ("procede/puede", nunca imperativo).
 *  - NADA se publica "verificado": TODO queda `pendiente_revision` para el panel (revisor
 *    jurídico + segundo revisor, §8.3). `notaRevision` detalla el dato concreto "a verificar".
 *  - Importes ORIENTATIVOS: solo se fija cifra cuando está VERIFICADA en el texto consolidado del
 *    BOE (Ley 7/2011 arts. 62-66, tramos por gravedad); se toma el MÍNIMO del tramo como
 *    referencia (mismo criterio que el seed de extranjería/PPP). Donde no hay cifra verificada, se
 *    deja la norma NAVEGABLE y el texto remite a "consúltese el artículo". El marco de validación
 *    es `autonomico` (sin rango legal único: solo coherencia).
 */

/** Fecha de curación de este seed (la que verá el agente como "Actualizado el…"). */
const FECHA_ACTUALIZACION = '2026-09-08';
const VALID_FROM = `${FECHA_ACTUALIZACION}T00:00:00.000Z`;

/**
 * Territorio del piloto autonómico. Se deriva de `CCAA_DE_AUTONOMICA` (la MISMA tabla que usa el
 * onboarding para fijar la CCAA al elegir Policía Canaria) para garantizar que el id coincide
 * exactamente y el filtro territorial engancha. Canarias → `es-ccaa-05`.
 */
export const TERRITORIO_CANARIAS = CCAA_DE_AUTONOMICA.policia_canaria;

/**
 * Relevancia de la normativa autonómica canaria (columna `cuerpos` del paquete): la aplican en la
 * calle la Policía Canaria (autonómica) y las policías locales de Canarias. NO se etiqueta a la
 * Guardia Civil ni a la Policía Nacional (no es su competencia de oficio). NO restringe el acceso,
 * solo prioriza la lista de Normas.
 */
const CUERPOS_CANARIAS: Cuerpo[] = ['policia_autonomica', 'policia_local'];

/**
 * Competencia (aviso orientativo, ADR-007): la normativa autonómica canaria la denuncian la
 * Policía Canaria y la Policía Local. Vía `ambas` (no es materia de tráfico urbano/interurbano).
 */
const COMPETENCIA_CANARIAS: CuerpoCompetente[] = ['policia_autonomica', 'policia_local'];

// --- Identificadores de norma (BOE, legislación consolidada de leyes canarias) --------------
const ID_ESP = 'BOE-A-2011-8022'; // Ley 7/2011, actividades clasificadas y espectáculos públicos
const ID_ANIM = 'BOE-A-1991-16425'; // Ley 8/1991, protección de los animales (Canarias)
const ID_CPL = 'BOE-A-1997-17140'; // Ley 6/1997, coordinación de policías locales de Canarias
const ID_PCAN = 'BOE-A-2008-12494'; // Ley 2/2008, Cuerpo General de la Policía Canaria

const urlBoe = (id: string): string => `https://www.boe.es/buscar/act.php?id=${id}`;

/** Construye una `Norma` autonómica canaria ligada al territorio de la CCAA. */
function normaCanaria(input: { id: string; codigo: string; titulo: string }): Norma {
  return Norma.parse({
    id: input.id,
    codigo: input.codigo,
    titulo: input.titulo,
    tipo: 'ley',
    ambito: 'autonomico',
    territorioId: TERRITORIO_CANARIAS,
    origen: 'oficial',
    urlBoe: urlBoe(input.id),
    fechaConsolidacion: null,
    cuerpos: CUERPOS_CANARIAS,
  });
}

export const NORMAS_CANARIAS_SEED: Norma[] = [
  normaCanaria({
    id: ID_ESP,
    codigo: 'CAN-ESP',
    titulo:
      'Ley de actividades clasificadas y espectáculos públicos de Canarias (Ley 7/2011, de 5 de abril)',
  }),
  normaCanaria({
    id: ID_ANIM,
    codigo: 'CAN-ANIM',
    titulo: 'Ley de protección de los animales de Canarias (Ley 8/1991, de 30 de abril)',
  }),
  normaCanaria({
    id: ID_CPL,
    codigo: 'CAN-CPL',
    titulo: 'Ley de Coordinación de Policías Locales de Canarias (Ley 6/1997, de 4 de julio)',
  }),
  normaCanaria({
    id: ID_PCAN,
    codigo: 'CAN-PCAN',
    titulo: 'Ley del Cuerpo General de la Policía Canaria (Ley 2/2008, de 28 de mayo)',
  }),
];

// --- Artículos citados (resúmenes neutros propios) ------------------------------------------
interface ArticuloSeedInput {
  normaId: string;
  numero: string;
  titulo: string;
  texto: string;
}

function articuloSeed({ normaId, numero, titulo, texto }: ArticuloSeedInput): Articulo {
  return Articulo.parse({
    id: `${normaId}:seed-a${numero.replace(/\s+/g, '')}`,
    normaId,
    numero,
    titulo,
    texto,
    idioma: 'es',
    orden: 0,
    hash: hashTexto(texto),
    validFrom: VALID_FROM,
    validTo: null,
  });
}

// Ley 7/2011 — actividades clasificadas y espectáculos públicos (verificado en BOE-A-2011-8022).
const ART_ESP_48 = articuloSeed({
  normaId: ID_ESP,
  numero: '48',
  titulo: 'Horario de actividades y espectáculos',
  texto:
    'El Gobierno de Canarias, mediante decreto, puede regular el horario de apertura y cierre de ' +
    'los locales de ocio, restauración, consumo de bebidas alcohólicas o con emisiones musicales, ' +
    'así como el de los espectáculos, ponderando el ejercicio de la actividad con el descanso de la ' +
    'población colindante y las peculiaridades de las zonas turísticas. La previsión se entiende sin ' +
    'perjuicio de las competencias estatales de seguridad ciudadana. Resumen orientativo; consúltese ' +
    'el texto consolidado en el BOE.',
});

const ART_ESP_49 = articuloSeed({
  normaId: ID_ESP,
  numero: '49',
  titulo: 'Régimen de cierre',
  texto:
    'La hora de cierre obliga al cese inmediato y absoluto de toda actividad comercial o recreativa y ' +
    'de cualquier emisión musical. A partir de esa hora se dispone de un plazo máximo de treinta ' +
    'minutos para el desalojo de los clientes, tras el cual debe cerrarse el establecimiento al ' +
    'público, pudiendo permanecer solo el personal de vigilancia o limpieza. Resumen orientativo; ' +
    'consúltese el texto consolidado en el BOE.',
});

const ART_ESP_62 = articuloSeed({
  normaId: ID_ESP,
  numero: '62',
  titulo: 'Infracciones muy graves',
  texto:
    'Enumera las infracciones muy graves en materia de actividades clasificadas y espectáculos: entre ' +
    'otras, desarrollar la actividad o abrir el establecimiento sin la licencia, comunicación previa ' +
    'o declaración responsable exigibles; superar en más del diez por ciento el aforo autorizado o ' +
    'dispensar alcohol o tabaco a menores; incumplir las medidas de seguridad, accesos y salidas de ' +
    'emergencia; o negar el acceso a los agentes de la autoridad. Resumen orientativo; consúltese el ' +
    'texto consolidado en el BOE.',
});

const ART_ESP_63 = articuloSeed({
  normaId: ID_ESP,
  numero: '63',
  titulo: 'Infracciones graves',
  texto:
    'Enumera las infracciones graves: entre otras, el incumplimiento del horario establecido; el ' +
    'mantenimiento de actividad o emisión musical dentro del local a partir de la hora de cierre y ' +
    'durante el desalojo; la producción de ruidos y molestias; el exceso de aforo que no supere el ' +
    'diez por ciento; o el ejercicio arbitrario o discriminatorio del derecho de admisión. Resumen ' +
    'orientativo; consúltese el texto consolidado en el BOE.',
});

const ART_ESP_64 = articuloSeed({
  normaId: ID_ESP,
  numero: '64',
  titulo: 'Infracciones leves',
  texto:
    'Enumera las infracciones leves: entre otras, la no exposición de la licencia o autorización en ' +
    'lugar visible al público, la falta de los carteles obligatorios (prohibición de entrada de ' +
    'menores u otros), el mal estado de locales o servicios que no constituya infracción grave, y en ' +
    'general cualquier vulneración de la ley o sus reglamentos no tipificada como grave o muy grave. ' +
    'Resumen orientativo; consúltese el texto consolidado en el BOE.',
});

const ART_ESP_66 = articuloSeed({
  normaId: ID_ESP,
  numero: '66',
  titulo: 'Aplicación de las sanciones (cuantías)',
  texto:
    'Fija las cuantías por tramos: las infracciones muy graves se sancionan con multa de 15.001 a ' +
    '30.000 euros; las graves, con multa de 3.001 a 15.000 euros; y las leves, con multa de hasta ' +
    '3.000 euros. Además pueden imponerse la clausura o revocación de la licencia, la suspensión ' +
    'temporal de la actividad o la reducción del horario (art. 65). Resumen orientativo; consúltese ' +
    'el texto consolidado en el BOE.',
});

// Ley 8/1991 — protección de los animales de Canarias (norma navegable; ojo con la estatal 7/2023).
const ART_ANIM_IDENT = articuloSeed({
  normaId: ID_ANIM,
  numero: 'IDENT',
  titulo: 'Identificación y censo de los perros',
  texto:
    'Obliga a identificar a los perros del modo reglamentario y a inscribirlos en el censo del ' +
    'municipio donde reside habitualmente el animal, en un plazo máximo de tres meses desde su ' +
    'nacimiento o de un mes desde su adquisición; el animal debe llevar de forma permanente su ' +
    'identificación censal. IMPORTANTE: la Ley estatal 7/2023 de protección de los derechos y el ' +
    'bienestar de los animales ha modificado el marco general (identificación, registros), por lo que ' +
    'esta previsión autonómica debe leerse junto a la estatal. Resumen orientativo; consúltese el ' +
    'texto consolidado en el BOE.',
});

const ART_ANIM_CORREA = articuloSeed({
  normaId: ID_ANIM,
  numero: 'CORREA',
  titulo: 'Conducción del perro en la vía pública',
  texto:
    'Exige conducir y controlar a los perros con cadena o correa no extensible ni rompible, de ' +
    'longitud inferior a dos metros, adecuada para dominar al animal en todo momento. Las medidas ' +
    'concretas y su régimen sancionador se completan con la ordenanza municipal y con la normativa ' +
    'estatal (Ley 7/2023 y, para animales potencialmente peligrosos, Ley 50/1999). Resumen ' +
    'orientativo; consúltese el texto consolidado en el BOE.',
});

const ART_ANIM_26 = articuloSeed({
  normaId: ID_ANIM,
  numero: '26',
  titulo: 'Infracciones y sanciones',
  texto:
    'Clasifica las infracciones en leves, graves y muy graves, con multas graduadas por tramos (el ' +
    'texto original de 1991 las expresaba en pesetas y previó su actualización por decreto). Buena ' +
    'parte de este régimen ha quedado desplazado o completado por la Ley estatal 7/2023 de bienestar ' +
    'animal: la clasificación y las cuantías VIGENTES deben verificarse con ambas normas y con la ' +
    'ordenanza municipal. Resumen orientativo; consúltese el texto consolidado en el BOE.',
});

// Ley 6/1997 — coordinación de policías locales de Canarias (navegable, competencias).
const ART_CPL_COORD = articuloSeed({
  normaId: ID_CPL,
  numero: 'COORD',
  titulo: 'Objeto: coordinación de las policías locales de Canarias',
  texto:
    'Establece el marco de coordinación de las policías locales de los municipios canarios, ' +
    'respetando la autonomía municipal, y crea la Comisión de Coordinación de las Policías Locales ' +
    'como órgano consultivo, deliberante y de participación. Fija criterios comunes (formación, ' +
    'medios, uniformidad, actuación) para la cooperación entre los cuerpos de policía local y con las ' +
    'demás fuerzas y cuerpos de seguridad. Resumen orientativo; consúltese el texto consolidado en el ' +
    'BOE.',
});

// Ley 2/2008 — Cuerpo General de la Policía Canaria (navegable, funciones).
const ART_PCAN_FUNC = articuloSeed({
  normaId: ID_PCAN,
  numero: 'FUNC',
  titulo: 'El Cuerpo General de la Policía Canaria y sus funciones',
  texto:
    'Crea el Cuerpo General de la Policía Canaria como policía autonómica y, dentro del sistema de ' +
    'coordinación con las demás fuerzas y cuerpos de seguridad, le atribuye funciones como velar por ' +
    'el cumplimiento de la normativa de la Comunidad Autónoma, la vigilancia y protección de ' +
    'personas, órganos, edificios y dependencias de la Comunidad, la inspección de las actividades ' +
    'sometidas a la ordenación autonómica (entre ellas espectáculos y actividades clasificadas) y la ' +
    'colaboración con la Guardia Civil y la Policía Nacional. Resumen orientativo; consúltese el texto ' +
    'consolidado en el BOE.',
});

export const ARTICULOS_CANARIAS_SEED: Articulo[] = [
  ART_ESP_48,
  ART_ESP_49,
  ART_ESP_62,
  ART_ESP_63,
  ART_ESP_64,
  ART_ESP_66,
  ART_ANIM_IDENT,
  ART_ANIM_CORREA,
  ART_ANIM_26,
  ART_CPL_COORD,
  ART_PCAN_FUNC,
];

// --- Constructor de una infracción AUTONÓMICA con sus sinónimos y consecuencias -------------
interface InfraccionSeedInput {
  id: string;
  articulo: Articulo;
  tituloCorto: string;
  gravedad: Infraccion['gravedad'];
  importeEur: number;
  importeReducidoEur: number | null;
  textoBoletin: string;
  terminos: string[];
  notaRevision: string;
}

function construirInfraccion(input: InfraccionSeedInput): InfraccionSeed {
  const infraccion = Infraccion.parse({
    id: input.id,
    articuloId: input.articulo.id,
    codigoDgt: null,
    tituloCorto: input.tituloCorto,
    gravedad: input.gravedad,
    tipo: 'administrativa',
    importeEur: input.importeEur,
    importeReducidoEur: input.importeReducidoEur,
    puntos: null,
    textoBoletin: input.textoBoletin,
    variantesBoletin: [],
    competencia: { cuerpos: COMPETENCIA_CANARIAS, via: 'ambas' },
    ambito: 'autonomico',
    territorioId: TERRITORIO_CANARIAS,
    desplazaId: null,
    origen: 'oficial',
    validFrom: VALID_FROM,
    validTo: null,
  });

  const sinonimos: Sinonimo[] = input.terminos.map((termino, i) =>
    Sinonimo.parse({
      id: `${input.id}:sin-${i}`,
      termino,
      peso: 1,
      infraccionId: input.id,
      articuloId: null,
    }),
  );

  // Sin consecuencias estructuradas en este piloto (la sanción se refleja en importe + boletín).
  const consecuencias: Consecuencia[] = [];

  return {
    infraccion,
    sinonimos,
    consecuencias,
    // Marco `autonomico`: sin rango legal único en el validador (varía por comunidad); solo se
    // valida la coherencia (importe presente y reducido ≤ base). Las cuantías van VERIFICADAS del
    // texto consolidado (Ley 7/2011 art. 66) y se toma el mínimo del tramo. §8.3.
    marcoImporte: 'autonomico' satisfies MarcoImporte,
    revision: 'pendiente_revision' satisfies EstadoRevision,
    notaRevision: input.notaRevision,
  };
}

// --- Infracciones sembradas (Ley 7/2011, verificadas en el BOE; mínimo del tramo) -----------
export const INFRACCIONES_CANARIAS_SEED: InfraccionSeed[] = [
  construirInfraccion({
    id: 'can-esp-horario-cierre',
    articulo: ART_ESP_63,
    tituloCorto: 'Incumplir el horario de cierre (ocio nocturno)',
    gravedad: 'grave',
    // Ley 7/2011 art. 63.4 (grave) → art. 66.2: multa de 3.001 a 15.000 €. Se fija el mínimo.
    importeEur: 3001,
    importeReducidoEur: null,
    textoBoletin:
      'Incumplir el horario de cierre establecido para el local de ocio, restauración o espectáculo ' +
      '(manteniendo la actividad o la emisión musical fuera del horario autorizado por el decreto de ' +
      'horarios de Canarias). Es infracción GRAVE del art. 63.4 de la Ley 7/2011. La valoración final ' +
      'y la cuantía dentro del tramo corresponden a la autoridad competente.',
    terminos: [
      'horario de cierre',
      'exceso de horario',
      'cierre local',
      'ocio nocturno',
      'local abierto fuera de horario',
      'discoteca cerrada tarde',
      'espectaculos canarias',
      'horario espectaculos',
    ],
    notaRevision:
      'A VERIFICAR importe y clasificación: incumplir el horario de cierre es GRAVE (Ley 7/2011 ' +
      'art. 63.4), multa de 3.001 a 15.000 € (art. 66.2); el seed fija el mínimo del tramo. Confirmar ' +
      'el DECRETO de horarios vigente en Canarias (el texto consolidado remite al Decreto Territorial ' +
      '193/1998 y disposiciones posteriores) y las eventuales ampliaciones autorizadas por el ' +
      'ayuntamiento, con el texto consolidado y el revisor jurídico antes de publicar.',
  }),
  construirInfraccion({
    id: 'can-esp-tras-cierre',
    articulo: ART_ESP_63,
    tituloCorto: 'Actividad o música tras la hora de cierre (durante el desalojo)',
    gravedad: 'grave',
    // Ley 7/2011 art. 63.16 (grave) → art. 66.2: multa de 3.001 a 15.000 €. Se fija el mínimo.
    importeEur: 3001,
    importeReducidoEur: null,
    textoBoletin:
      'Mantener actividad comercial o recreativa o emisión musical dentro del local a partir de la ' +
      'hora de cierre y durante el plazo de desalojo (máximo treinta minutos), incumpliendo el régimen ' +
      'de cierre del art. 49. Es infracción GRAVE del art. 63.16 de la Ley 7/2011. La valoración final ' +
      'corresponde a la autoridad competente.',
    terminos: [
      'musica despues del cierre',
      'sigue la fiesta tras el cierre',
      'no desaloja',
      'desalojo local',
      'actividad tras el cierre',
      'local no cierra',
    ],
    notaRevision:
      'A VERIFICAR importe y clasificación: mantener actividad o música tras la hora de cierre durante ' +
      'el desalojo es GRAVE (Ley 7/2011 art. 63.16), multa de 3.001 a 15.000 € (art. 66.2); el seed ' +
      'fija el mínimo del tramo. Delimitar respecto al art. 63.4 (horario) y confirmar el plazo de ' +
      'desalojo aplicable con el texto consolidado y el revisor jurídico.',
  }),
  construirInfraccion({
    id: 'can-esp-ruidos',
    articulo: ART_ESP_63,
    tituloCorto: 'Ruidos y molestias del local o espectáculo',
    gravedad: 'grave',
    // Ley 7/2011 art. 63.9 (grave) → art. 66.2: multa de 3.001 a 15.000 €. Se fija el mínimo.
    importeEur: 3001,
    importeReducidoEur: null,
    textoBoletin:
      'La producción de ruidos y molestias por el local de ocio, restauración o espectáculo. Es ' +
      'infracción GRAVE del art. 63.9 de la Ley 7/2011. La valoración final y la eventual necesidad de ' +
      'medición corresponden a la autoridad competente; consúltese también la ordenanza municipal de ' +
      'ruidos.',
    terminos: [
      'ruidos del local',
      'molestias vecinos local',
      'ruido discoteca',
      'ruido bar',
      'musica alta local',
      'ruido ocio nocturno',
    ],
    notaRevision:
      'A VERIFICAR importe y clasificación: la producción de ruidos y molestias es GRAVE (Ley 7/2011 ' +
      'art. 63.9), multa de 3.001 a 15.000 € (art. 66.2); el seed fija el mínimo del tramo. Puede ' +
      'concurrir con la ordenanza municipal de ruidos (evitar doble sanción) y requerir medición ' +
      'sonométrica. Confirmar con el texto consolidado y el revisor jurídico.',
  }),
  construirInfraccion({
    id: 'can-esp-sin-licencia',
    articulo: ART_ESP_62,
    tituloCorto: 'Actividad o espectáculo sin licencia ni comunicación previa',
    gravedad: 'muy_grave',
    // Ley 7/2011 art. 62.1 (muy grave) → art. 66.1: multa de 15.001 a 30.000 €. Se fija el mínimo.
    importeEur: 15001,
    importeReducidoEur: null,
    textoBoletin:
      'Desarrollar una actividad o abrir un establecimiento sujeto a la Ley 7/2011 sin la previa ' +
      'licencia correspondiente ni haber cursado la comunicación previa o declaración responsable ' +
      'exigibles. Es infracción MUY GRAVE del art. 62.1. Nota: el cierre del establecimiento sin ' +
      'licencia no tiene carácter de sanción, sino de medida a adoptar por el órgano competente ' +
      '(art. 65.2). La valoración final corresponde a la autoridad competente.',
    terminos: [
      'sin licencia',
      'local sin licencia',
      'actividad sin licencia',
      'espectaculo sin autorizacion',
      'sin comunicacion previa',
      'establecimiento clandestino',
      'fiesta sin autorizacion',
    ],
    notaRevision:
      'A VERIFICAR importe y clasificación: abrir o desarrollar la actividad sin licencia ni ' +
      'comunicación previa/declaración responsable es MUY GRAVE (Ley 7/2011 art. 62.1), multa de ' +
      '15.001 a 30.000 € (art. 66.1); el seed fija el mínimo del tramo. Precisar qué actividades ' +
      'exigen licencia y cuáles comunicación/declaración (Decretos 52/2012 y 86/2013) y el régimen de ' +
      'cierre no sancionador del art. 65.2, con el texto consolidado y el revisor jurídico.',
  }),
  construirInfraccion({
    id: 'can-esp-alcohol-menores',
    articulo: ART_ESP_62,
    tituloCorto: 'Dispensar alcohol o tabaco a menores en el local',
    gravedad: 'muy_grave',
    // Ley 7/2011 art. 62.6 (muy grave) → art. 66.1: multa de 15.001 a 30.000 €. Se fija el mínimo.
    importeEur: 15001,
    importeReducidoEur: null,
    textoBoletin:
      'Vender, suministrar o dispensar, de forma gratuita o no, bebidas alcohólicas o tabaco a menores ' +
      'en locales de espectáculos o de venta de bebidas alcohólicas, o tolerar un aforo que supere en ' +
      'más del diez por ciento el autorizado. Es infracción MUY GRAVE del art. 62.6 de la Ley 7/2011. ' +
      'La valoración final corresponde a la autoridad competente.',
    terminos: [
      'alcohol a menores',
      'vender alcohol a menores',
      'tabaco a menores',
      'menores bebiendo local',
      'servir alcohol menor',
      'aforo superado',
      'exceso de aforo',
    ],
    notaRevision:
      'A VERIFICAR importe y clasificación: dispensar alcohol o tabaco a menores, o superar en más del ' +
      '10% el aforo, es MUY GRAVE (Ley 7/2011 art. 62.6), multa de 15.001 a 30.000 € (art. 66.1); el ' +
      'seed fija el mínimo del tramo. Delimitar respecto a la normativa estatal/autonómica de menores y ' +
      'de venta de alcohol y tabaco (posible concurrencia) con el texto consolidado y el revisor jurídico.',
  }),
];

/** Estructura completa del seed lista para combinar con el resto de contenido. */
export const SEED_AUTONOMICO_CANARIAS: SeedContenido = {
  normas: NORMAS_CANARIAS_SEED,
  articulos: ARTICULOS_CANARIAS_SEED,
  infracciones: INFRACCIONES_CANARIAS_SEED,
};

/** CCAA con contenido autonómico sembrado en el paquete (por su `territorioId`). Fuente única. */
export const CCAA_CON_CONTENIDO_AUTONOMICO: readonly { territorioId: string; nombre: string }[] = [
  { territorioId: TERRITORIO_CANARIAS, nombre: 'Canarias' },
];
