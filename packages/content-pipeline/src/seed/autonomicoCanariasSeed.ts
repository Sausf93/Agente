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
  numero: '11',
  titulo: 'Identificación y censo de los perros',
  texto:
    'Obliga a identificar a los perros del modo reglamentario y a inscribirlos en el censo del ' +
    'municipio donde reside habitualmente el animal; el animal debe llevar de forma permanente su ' +
    'identificación censal. Los PLAZOS que suelen citarse (unos tres meses desde el nacimiento o un ' +
    'mes desde la adquisición) están A VERIFICAR: probablemente los fija la vía REGLAMENTARIA y no la ' +
    'propia ley. IMPORTANTE: la Ley estatal 7/2023 de protección de los derechos y el bienestar de ' +
    'los animales ha modificado el marco general (identificación, registros), por lo que esta ' +
    'previsión autonómica debe leerse junto a la estatal. Resumen orientativo; consúltese el texto ' +
    'consolidado en el BOE.',
});

const ART_ANIM_CORREA = articuloSeed({
  normaId: ID_ANIM,
  numero: '6',
  titulo: 'Tenencia de animales: remisión a las ordenanzas municipales',
  texto:
    'El art. 6 de la Ley 8/1991 NO fija por sí mismo las medidas concretas de conducción del perro en ' +
    'la vía pública (tipo de correa o longitud): REMITE a las ORDENANZAS MUNICIPALES, que son las que ' +
    'las regulan. La exigencia habitual de correa no extensible ni rompible y de longitud reducida ' +
    '(en torno a dos metros), y en su caso el bozal, proviene de la ORDENANZA MUNICIPAL y, para ' +
    'animales POTENCIALMENTE PELIGROSOS, de la Ley estatal 50/1999 y su reglamento (consúltese también ' +
    'la Ley estatal 7/2023). Esa medida concreta NO debe atribuirse a la Ley 8/1991. Resumen ' +
    'orientativo; consúltese el texto consolidado en el BOE y la ordenanza aplicable.',
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

// --- Medida OPERATIVA del ocio: cese / desalojo / precinto (arts. 49 y 65.2 Ley 7/2011) ------
/**
 * En la calle, ante un local sin licencia, fuera de horario o que no desaloja, lo DETERMINANTE no
 * es la multa (la impone luego el órgano competente) sino la medida administrativa de CESE de la
 * actividad, DESALOJO o PRECINTO. La Ley 7/2011 la configura como medida NO sancionadora (art. 65.2)
 * ligada al régimen de cierre (art. 49). Se modela como consecuencia estructurada `cese_actividad`
 * para que la ficha la muestre DESTACADA por encima del importe (I-1/I-2). Lenguaje ORIENTATIVO.
 */
const FUENTE_CESE = 'Ley 7/2011 arts. 49 y 65.2';

function consecuenciaCese(infraccionId: string): Consecuencia {
  return Consecuencia.parse({
    id: `${infraccionId}:cons-cese`,
    tipo: 'cese_actividad',
    regla: {},
    textoCorto:
      'Procede valorar el cese de la actividad, el desalojo o el precinto (medida no sancionadora, ' +
      'arts. 49 y 65.2 Ley 7/2011); la sanción la impone el órgano competente.',
    fuente: FUENTE_CESE,
    infraccionId,
    articuloId: null,
  });
}

/**
 * Coletilla OBLIGATORIA (revisor, ronda validación): las CUANTÍAS del art. 66 de la Ley 7/2011 no
 * han podido confirmarse contra el literal del artículo (fuente primaria), así que TODA infracción
 * de esta ley debe dejar clarísimo el "a verificar" sobre el importe. Se añade a cada `notaRevision`.
 */
const CAVEAT_ART_66 =
  ' IMPORTANTE (revisor): las CUANTÍAS del art. 66 (tanto el MÍNIMO como el MÁXIMO del tramo que se ' +
  'muestra como rango) están SIN CONFIRMAR por fuente primaria (no se pudo leer el literal del ' +
  'artículo); tómense como ORIENTATIVAS y verifíquense con el texto consolidado del BOE antes de publicar.';

// --- Constructor de una infracción AUTONÓMICA con sus sinónimos y consecuencias -------------
interface InfraccionSeedInput {
  id: string;
  articulo: Articulo;
  tituloCorto: string;
  gravedad: Infraccion['gravedad'];
  importeEur: number;
  importeReducidoEur: number | null;
  /**
   * Extremo SUPERIOR del tramo del art. 66 (horquilla). La ficha lo usa para mostrar el RANGO en
   * vez de una cifra suelta (I-2). Igual que el mínimo, va "a verificar" (ver `CAVEAT_ART_66`).
   */
  importeMaxEur: number;
  textoBoletin: string;
  terminos: string[];
  notaRevision: string;
  /** Ocio (Ley 7/2011): añade la medida operativa `cese_actividad` (cese/desalojo/precinto). */
  conCese?: boolean;
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
    importeMaxEur: input.importeMaxEur,
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

  // Ocio (Ley 7/2011): la medida operativa `cese_actividad` sube DESTACADA en la ficha (I-1/I-2);
  // el resto refleja la sanción en importe + boletín.
  const consecuencias: Consecuencia[] = input.conCese ? [consecuenciaCese(input.id)] : [];

  return {
    infraccion,
    sinonimos,
    consecuencias,
    // Marco `autonomico`: sin rango legal único en el validador (varía por comunidad); solo se
    // valida la coherencia (importe presente y reducido ≤ base). El importe es ORIENTATIVO (mínimo
    // del tramo del art. 66, SIN confirmar por fuente primaria — ver `notaRevision`). §8.3.
    marcoImporte: 'autonomico' satisfies MarcoImporte,
    revision: 'pendiente_revision' satisfies EstadoRevision,
    notaRevision: input.notaRevision + CAVEAT_ART_66,
  };
}

// --- Infracciones sembradas (Ley 7/2011, verificadas en el BOE; mínimo del tramo) -----------
export const INFRACCIONES_CANARIAS_SEED: InfraccionSeed[] = [
  construirInfraccion({
    id: 'can-esp-horario-cierre',
    conCese: true,
    articulo: ART_ESP_63,
    tituloCorto: 'Incumplir el horario de cierre (ocio nocturno)',
    gravedad: 'grave',
    // Ley 7/2011 art. 63.4 (grave) → art. 66.2: multa de 3.001 a 15.000 €. Se fija el mínimo.
    importeEur: 3001,
    importeReducidoEur: null,
    importeMaxEur: 15000,
    textoBoletin:
      'Incumplir el horario de cierre establecido para el local de ocio, restauración o espectáculo ' +
      '(manteniendo la actividad o la emisión musical fuera del horario autorizado por el decreto de ' +
      'horarios de Canarias). Es infracción GRAVE del art. 63.4 de la Ley 7/2011. La valoración final ' +
      'y la cuantía dentro del tramo corresponden a la autoridad competente.',
    terminos: [
      'horario de cierre',
      'hora de cierre',
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
    conCese: true,
    articulo: ART_ESP_63,
    tituloCorto: 'Actividad o música tras la hora de cierre (durante el desalojo)',
    gravedad: 'grave',
    // Ley 7/2011 art. 63.16 (grave) → art. 66.2: multa de 3.001 a 15.000 €. Se fija el mínimo.
    importeEur: 3001,
    importeReducidoEur: null,
    importeMaxEur: 15000,
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
      'after',
      'afters',
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
    importeMaxEur: 15000,
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
      'musica alta',
      'ruido ocio nocturno',
      'sonometro',
    ],
    notaRevision:
      'A VERIFICAR importe y clasificación: la producción de ruidos y molestias es GRAVE (Ley 7/2011 ' +
      'art. 63.9), multa de 3.001 a 15.000 € (art. 66.2); el seed fija el mínimo del tramo. Puede ' +
      'concurrir con la ordenanza municipal de ruidos (evitar doble sanción) y requerir medición ' +
      'sonométrica. VALORAR si procede una medida de cese/precinto de la actividad (arts. 49/65.2) — ' +
      'a confirmar por revisor. Confirmar con el texto consolidado y el revisor jurídico.',
  }),
  construirInfraccion({
    id: 'can-esp-sin-licencia',
    conCese: true,
    articulo: ART_ESP_62,
    tituloCorto: 'Actividad o espectáculo sin licencia ni comunicación previa',
    gravedad: 'muy_grave',
    // Ley 7/2011 art. 62.1 (muy grave) → art. 66.1: multa de 15.001 a 30.000 €. Se fija el mínimo.
    importeEur: 15001,
    importeReducidoEur: null,
    importeMaxEur: 30000,
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
      'local ilegal',
      'rave',
    ],
    notaRevision:
      'A VERIFICAR importe y clasificación: abrir o desarrollar la actividad sin licencia ni ' +
      'comunicación previa/declaración responsable es MUY GRAVE (Ley 7/2011 art. 62.1), multa de ' +
      '15.001 a 30.000 € (art. 66.1); el seed fija el mínimo del tramo. Precisar qué actividades ' +
      'exigen licencia y cuáles comunicación/declaración (Decretos 52/2012 y 86/2013) y el régimen de ' +
      'cierre no sancionador del art. 65.2, con el texto consolidado y el revisor jurídico.',
  }),
  // NOTA (revisor): esta conducta y el exceso de aforo iban ANTES empaquetadas en una sola ficha
  // citando el mismo art. 62.6. Se SEPARAN en dos infracciones (son conductas distintas) y se cita
  // el art. 62 con el ORDINAL "a verificar": no está confirmado que ambas compartan el 62.6.
  construirInfraccion({
    id: 'can-esp-alcohol-menores',
    articulo: ART_ESP_62,
    tituloCorto: 'Dispensar alcohol o tabaco a menores en el local',
    gravedad: 'muy_grave',
    // Ley 7/2011 art. 62 (muy grave; ordinal a verificar) → art. 66.1: 15.001 a 30.000 €. Mínimo.
    importeEur: 15001,
    importeReducidoEur: null,
    importeMaxEur: 30000,
    textoBoletin:
      'Vender, suministrar o dispensar, de forma gratuita o no, bebidas alcohólicas o tabaco a menores ' +
      'en locales de espectáculos o de venta de bebidas alcohólicas. Es infracción MUY GRAVE del ' +
      'art. 62 de la Ley 7/2011 (ordinal a verificar; probablemente el 62.6). La valoración final ' +
      'corresponde a la autoridad competente.',
    terminos: [
      'alcohol a menores',
      'vender alcohol a menores',
      'tabaco a menores',
      'menores bebiendo local',
      'servir alcohol menor',
      'menor con copa',
      'shisha menores',
    ],
    notaRevision:
      'A VERIFICAR importe, clasificación y ORDINAL: dispensar alcohol o tabaco a menores es MUY GRAVE ' +
      '(Ley 7/2011 art. 62), multa de 15.001 a 30.000 € (art. 66.1); el seed fija el mínimo del tramo. ' +
      'Confirmar el ordinal EXACTO del art. 62 (probablemente 62.6) y delimitar respecto a la normativa ' +
      'estatal/autonómica de menores y de venta de alcohol y tabaco (posible concurrencia) con el texto ' +
      'consolidado y el revisor jurídico. VALORAR si procede una medida de cese/precinto de la actividad ' +
      '(arts. 49/65.2) — a confirmar por revisor.',
  }),
  construirInfraccion({
    id: 'can-esp-exceso-aforo',
    // Ante SOBREAFORO lo operativo NO es solo la multa: procede el DESALOJO parcial hasta el aforo
    // autorizado (medida no sancionadora, arts. 49/65.2). Sin cese, el chip salía "sin medida
    // cautelar", que era absurdo para un aforo desbordado (validación de calle Local I1 + Auto I2).
    conCese: true,
    articulo: ART_ESP_62,
    tituloCorto: 'Exceso de aforo superior al 10% del autorizado',
    gravedad: 'muy_grave',
    // Ley 7/2011 art. 62 (muy grave; ordinal a verificar) → art. 66.1: 15.001 a 30.000 €. Mínimo.
    // (El exceso de aforo que NO supera el 10% es GRAVE del art. 63; aquí se tipifica el >10%.)
    importeEur: 15001,
    importeReducidoEur: null,
    importeMaxEur: 30000,
    textoBoletin:
      'Tolerar o permitir un aforo que supere en más del diez por ciento el autorizado para el local ' +
      'o espectáculo. Es infracción MUY GRAVE del art. 62 de la Ley 7/2011 (ordinal a verificar). El ' +
      'exceso de aforo que NO supere el 10% es GRAVE (art. 63). La valoración final corresponde a la ' +
      'autoridad competente.',
    terminos: [
      'aforo superado',
      'exceso de aforo',
      'local lleno exceso aforo',
      'superar aforo',
      'demasiada gente local',
      'sobreaforo',
      'petado',
    ],
    notaRevision:
      'A VERIFICAR importe, clasificación y ORDINAL: superar en más del 10% el aforo es MUY GRAVE (Ley ' +
      '7/2011 art. 62), multa de 15.001 a 30.000 € (art. 66.1); el seed fija el mínimo del tramo. ' +
      'Confirmar el ordinal EXACTO del art. 62 (puede NO coincidir con el de la dispensación a menores) ' +
      'y el umbral del 10% frente al exceso GRAVE del art. 63, con el texto consolidado y el revisor.',
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
