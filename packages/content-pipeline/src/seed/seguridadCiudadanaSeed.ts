import {
  Articulo,
  Consecuencia,
  Infraccion,
  Norma,
  Sinonimo,
  RANGOS_IMPORTE_SEGURIDAD_CIUDADANA,
  type MarcoImporte,
} from '@agente/shared';
import { hashTexto } from '../parsers/boe-xml/hash.js';
import type { InfraccionSeed, SeedContenido } from './traficoSeed.js';

/**
 * SEED de infracciones de SEGURIDAD CIUDADANA (Fase 2 de contenido — LO 4/2015).
 *
 * Es el dominio de calle nº2 tras tráfico y aplica a los TRES cuerpos generalistas (Guardia
 * Civil, Policía Nacional y Policía Local). Da contenido REAL al buscador y a la ficha para las
 * conductas más frecuentes que un agente comprueba en la vía pública (desobediencia, negativa a
 * identificarse, drogas en la calle, falta de respeto, armas prohibidas, desórdenes, ocupación…).
 *
 * Reglas aplicadas (CLAUDE.md y nota legal):
 *  - Textos de artículo y de boletín REDACTADOS POR NOSOTROS (resúmenes neutros, no copiados).
 *  - Toda infracción lleva su artículo fuente (LO 4/2015); la fecha visible la aporta el
 *    `ContentVersion`.
 *  - Lenguaje ORIENTATIVO en las consecuencias ("procede/puede", nunca imperativo).
 *  - NADA se publica "verificado" desde el pipeline: TODO queda `pendiente_revision` para el
 *    panel (revisor jurídico + segundo revisor, §8.3). `notaRevision` detalla el dato concreto
 *    "a verificar".
 *
 * IMPORTANTE sobre los IMPORTES (art. 39 LO 4/2015): la sanción NO es un valor fijo, sino una
 * HORQUILLA muy amplia graduada en tres tramos (leves 100–600 €; graves 601–30.000 €, tramo
 * mínimo 601–10.400 €; muy graves 30.001–600.000 €). El seed fija como referencia el EXTREMO
 * INFERIOR de cada categoría (grave = 601 €, leve = 100 €), lo dice en la nota de revisión y deja
 * al revisor confirmar el importe efectivo según circunstancias. El pronto pago (procedimiento
 * abreviado, art. 54 LO 4/2015) reduce un 50 % la sanción de infracciones graves y leves.
 */

/** Fecha de curación de este seed (la que verá el agente como "Actualizado el…"). */
const FECHA_ACTUALIZACION = '2026-09-07';
const VALID_FROM = `${FECHA_ACTUALIZACION}T00:00:00.000Z`;

// --- Norma: LO 4/2015 de protección de la seguridad ciudadana -------------------------------
const ID_LOSC = 'BOE-A-2015-3442'; // LO 4/2015, de 30 de marzo (legislación consolidada)
// Norma de PROTECCIÓN DEL MENOR (para la entrada consultable MENA, no sancionadora).
const ID_LOPJM = 'BOE-A-1996-1069'; // LO 1/1996, de 15 de enero, de Protección Jurídica del Menor
// Estatuto de la VÍCTIMA del delito (para la entrada consultable de derechos de la víctima). OJO:
// es la Ley 4/2015, de 27 de abril (ley ORDINARIA), que NO debe confundirse con la LO 4/2015 de
// seguridad ciudadana pese a compartir el "4/2015" en el nombre.
const ID_EVD = 'BOE-A-2015-4606'; // Ley 4/2015, de 27 de abril, del Estatuto de la víctima del delito
const urlBoe = (id: string): string => `https://www.boe.es/buscar/act.php?id=${id}`;

export const NORMAS_SEGURIDAD_SEED: Norma[] = [
  Norma.parse({
    id: ID_LOSC,
    codigo: 'LOSC',
    titulo: 'Ley Orgánica de Protección de la Seguridad Ciudadana (LO 4/2015)',
    tipo: 'ley',
    ambito: 'estatal',
    urlBoe: urlBoe(ID_LOSC),
    fechaConsolidacion: null,
  }),
  Norma.parse({
    id: ID_LOPJM,
    codigo: 'LOPJM',
    titulo: 'Ley Orgánica de Protección Jurídica del Menor (LO 1/1996)',
    tipo: 'ley',
    ambito: 'estatal',
    urlBoe: urlBoe(ID_LOPJM),
    fechaConsolidacion: null,
  }),
  Norma.parse({
    id: ID_EVD,
    codigo: 'EVD',
    titulo: 'Estatuto de la Víctima del Delito (Ley 4/2015)',
    tipo: 'ley',
    ambito: 'estatal',
    urlBoe: urlBoe(ID_EVD),
    fechaConsolidacion: null,
  }),
];

// --- Artículos citados (resúmenes neutros propios) ------------------------------------------
interface ArticuloSeedInput {
  numero: string;
  titulo: string;
  texto: string;
}

function articuloDe(normaId: string, { numero, titulo, texto }: ArticuloSeedInput): Articulo {
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

function articuloLosc(input: ArticuloSeedInput): Articulo {
  return articuloDe(ID_LOSC, input);
}

const ART_LOSC_16 = articuloLosc({
  numero: '16',
  titulo: 'Identificación de personas (requerimiento y diligencia)',
  texto:
    'Regula la facultad de los agentes de requerir la IDENTIFICACIÓN de las personas en el ejercicio ' +
    'de sus funciones de indagación o prevención, cuando existan indicios de que han podido participar ' +
    'en una infracción, o cuando resulte necesario para prevenir la comisión de un delito. Los agentes ' +
    'pueden realizar las comprobaciones precisas en la vía pública o en el lugar donde se hubiera hecho ' +
    'el requerimiento. Si la identificación no se logra por cualquier medio y resulta necesaria, se ' +
    'puede requerir a la persona que ACOMPAÑE a los agentes a las dependencias más próximas que cuenten ' +
    'con medios para la identificación, por el TIEMPO IMPRESCINDIBLE, que en ningún caso podrá superar ' +
    'las 6 horas (art. 16.2 LO 4/2015) —no es una detención— y a los solos efectos de identificarla. ' +
    'De esta actuación se extiende un LIBRO-REGISTRO/diligencia con ' +
    'las causas, la identidad, el tiempo y las circunstancias. La negativa a identificarse o la ' +
    'alegación de datos falsos puede ser infracción del art. 36.6. Resumen orientativo; consúltese el ' +
    'texto consolidado en el BOE.',
});

const ART_LOSC_36_1 = articuloLosc({
  numero: '36.1',
  titulo: 'Perturbación de la seguridad en actos públicos y espectáculos (grave)',
  texto:
    'Tipifica como infracción grave la perturbación de la seguridad ciudadana en actos públicos, ' +
    'espectáculos deportivos o culturales, solemnidades o oficios religiosos u otras reuniones a ' +
    'las que asistan numerosas personas, cuando la conducta no sea constitutiva de delito. Resumen ' +
    'orientativo; consúltese el texto consolidado en el BOE.',
});

const ART_LOSC_36_3 = articuloLosc({
  numero: '36.3',
  titulo: 'Desórdenes y obstaculización de la vía pública (grave)',
  texto:
    'Tipifica como infracción grave causar desórdenes en las vías, espacios o establecimientos ' +
    'públicos, u obstaculizar la vía pública con mobiliario urbano, vehículos, contenedores, ' +
    'neumáticos u otros objetos, cuando en ambos casos se ocasione una alteración grave de la ' +
    'seguridad ciudadana. Resumen orientativo; consúltese el texto consolidado en el BOE.',
});

const ART_LOSC_36_6 = articuloLosc({
  numero: '36.6',
  titulo: 'Desobediencia o resistencia a la autoridad y negativa a identificarse (grave)',
  texto:
    'Tipifica como infracción grave la desobediencia o la resistencia a la autoridad o a sus ' +
    'agentes en el ejercicio de sus funciones, cuando no sean constitutivas de delito, así como la ' +
    'negativa a identificarse a requerimiento de la autoridad o de sus agentes o la alegación de ' +
    'datos falsos o inexactos en los procesos de identificación. Resumen orientativo.',
});

const ART_LOSC_36_10 = articuloLosc({
  numero: '36.10',
  titulo: 'Portar, exhibir o usar armas prohibidas (grave)',
  texto:
    'Tipifica como infracción grave portar, exhibir o usar armas prohibidas, así como portar, ' +
    'exhibir o usar armas de modo negligente, temerario o intimidatorio, o fuera de los lugares ' +
    'habilitados para su uso, cuando la conducta no sea constitutiva de delito. Resumen orientativo.',
});

const ART_LOSC_36_16 = articuloLosc({
  numero: '36.16',
  titulo: 'Consumo o tenencia de drogas en lugares públicos (grave)',
  texto:
    'Tipifica como infracción grave el consumo o la tenencia ilícitos de drogas tóxicas, ' +
    'estupefacientes o sustancias psicotrópicas, aunque no estuvieran destinados al tráfico, en ' +
    'lugares, vías, establecimientos públicos o transportes colectivos, así como el abandono de los ' +
    'instrumentos u otros efectos empleados para ello en esos lugares. Resumen orientativo.',
});

const ART_LOSC_36_23 = articuloLosc({
  numero: '36.23',
  titulo: 'Uso no autorizado de imágenes o datos de agentes de la autoridad (grave)',
  texto:
    'Tipifica como infracción grave el uso no autorizado de imágenes o datos personales o ' +
    'profesionales de autoridades o miembros de las Fuerzas y Cuerpos de Seguridad que pueda poner ' +
    'en peligro la seguridad personal o familiar de los agentes, de las instalaciones protegidas o ' +
    'en riesgo el éxito de una operación, con respeto al derecho a la información. Resumen orientativo.',
});

const ART_LOSC_37_1 = articuloLosc({
  numero: '37.1',
  titulo: 'Reuniones o manifestaciones no comunicadas (leve)',
  texto:
    'Tipifica como infracción leve la celebración de reuniones en lugares de tránsito público o de ' +
    'manifestaciones incumpliendo lo previsto en la Ley Orgánica 9/1983 reguladora del derecho de ' +
    'reunión. La responsabilidad recae en los organizadores o promotores. Resumen orientativo; ' +
    'consúltese el BOE.',
});

const ART_LOSC_37_4 = articuloLosc({
  numero: '37.4',
  titulo: 'Falta de respeto y consideración a un agente de la autoridad (leve)',
  texto:
    'Tipifica como infracción leve las faltas de respeto y consideración cuyo destinatario sea un ' +
    'miembro de las Fuerzas y Cuerpos de Seguridad en el ejercicio de sus funciones de protección ' +
    'de la seguridad, cuando estas conductas no sean constitutivas de infracción penal. Resumen ' +
    'orientativo; consúltese el texto consolidado en el BOE.',
});

const ART_LOSC_37_7 = articuloLosc({
  numero: '37.7',
  titulo: 'Ocupación de inmuebles o de la vía pública (leve)',
  texto:
    'Tipifica como infracción leve la ocupación de cualquier inmueble, vivienda o edificio ajenos, ' +
    'o la permanencia en ellos contra la voluntad de su propietario, arrendatario o titular de otro ' +
    'derecho, cuando no sean constitutivas de infracción penal, así como la ocupación de la vía ' +
    'pública con infracción de lo dispuesto en la ley o de la decisión de la autoridad. Resumen orientativo.',
});

const ART_LOSC_37_17 = articuloLosc({
  numero: '37.17',
  titulo: 'Consumo de bebidas alcohólicas en espacios públicos (leve)',
  texto:
    'Tipifica como infracción LEVE el consumo de bebidas alcohólicas en lugares, vías, ' +
    'establecimientos o transportes públicos CUANDO PERTURBE GRAVEMENTE la tranquilidad ciudadana. ' +
    'El tipo estatal exige, por tanto, esa perturbación grave: no basta el mero hecho de beber en la ' +
    'calle. El "botellón" como consumo colectivo en la vía pública lo suele regular y sancionar la ' +
    'ORDENANZA MUNICIPAL de convivencia; la LO 4/2015 solo entra cuando se produce la alteración grave ' +
    'de la tranquilidad. Resumen orientativo; consúltese el texto consolidado en el BOE.',
});

// Artículo de PROTECCIÓN (no sancionador) para la entrada consultable MENA. Resume el marco de
// protección del menor extranjero no acompañado citando LO 1/1996, LO 4/2000 (extranjería) y
// LO 5/2000 (responsabilidad penal del menor). No es un tipo infractor: orienta sobre la actuación.
const ART_LOPJM_MENA = articuloDe(ID_LOPJM, {
  numero: 'MENA',
  titulo: 'Menor extranjero no acompañado (MENA): marco de protección',
  texto:
    'El menor extranjero no acompañado (MENA) es, ante todo, un MENOR en situación de desamparo: su ' +
    'tratamiento NO es sancionador, sino de PROTECCIÓN. El interés superior del menor rige toda ' +
    'actuación (LO 1/1996, de Protección Jurídica del Menor). Cuando se localiza a un presunto menor ' +
    'extranjero solo, procede su identificación con cautelas propias de menor, la puesta a disposición ' +
    'de la Entidad Pública de protección de menores de la comunidad autónoma y la comunicación ' +
    'inmediata al Ministerio Fiscal (Fiscalía de Menores), conforme al art. 35 de la LO 4/2000 de ' +
    'extranjería y su desarrollo reglamentario. La determinación de la edad, cuando existan dudas, la ' +
    'acuerda la autoridad competente (Fiscalía) mediante el procedimiento previsto —NO la valora la ' +
    'app ni el agente—. El menor de 14 años es inimputable penalmente (queda fuera de la LO 5/2000, ' +
    'reguladora de la responsabilidad penal de los menores). En ningún caso procede el calabozo o el ' +
    'internamiento como adulto por su condición de menor o de extranjero. Resumen orientativo.',
});

// Artículo de GARANTÍAS (no sancionador) para la entrada consultable de cacheo/registro. Resume el
// art. 20 LO 4/2015 (registros corporales externos) y sirve de anclaje a la consulta; la entrada y
// registro en domicilio (art. 18.2 CE y arts. 545 y ss. LECrim) se cita en el boletín de la ficha.
const ART_LOSC_20 = articuloLosc({
  numero: '20',
  titulo: 'Registros corporales externos (garantías del cacheo)',
  texto:
    'El art. 20 LO 4/2015 regula el REGISTRO CORPORAL EXTERNO Y SUPERFICIAL (cacheo/palpación): con ' +
    'carácter general procede cuando existan indicios racionales de que puede conducir al hallazgo de ' +
    'instrumentos, efectos u otros objetos relevantes para el ejercicio de las funciones de indagación ' +
    'o prevención (art. 20.1). GARANTÍAS (art. 20.2): salvo situación de urgencia por riesgo grave e ' +
    'inminente, lo practica un agente del MISMO SEXO que la persona registrada; y cuando exija dejar a ' +
    'la vista partes del cuerpo normalmente cubiertas por ropa, se efectúa en un LUGAR RESERVADO y ' +
    'fuera de la vista de terceros, dejando CONSTANCIA ESCRITA de la diligencia, de sus causas y de la ' +
    'identidad del agente. El registro respeta los principios de proporcionalidad e injerencia mínima ' +
    '(art. 20.3, por remisión al art. 16.1), causando el menor perjuicio a la intimidad y dignidad, e ' +
    'informando de inmediato y de forma comprensible de las razones. El registro que implique DESNUDO ' +
    'INTEGRAL no lo regula el literal del art. 20: es excepcional y con garantías reforzadas conforme a ' +
    'la doctrina del Tribunal Constitucional sobre la intimidad corporal. Resumen orientativo; ' +
    'consúltese el texto consolidado en el BOE.',
});

// Artículo de DERECHOS (no sancionador) para la entrada consultable de información a la víctima.
// Resume el marco del Estatuto de la víctima (Ley 4/2015, de 27 de abril) y el ofrecimiento de
// acciones y la orden de protección de la LECrim. No es un tipo infractor: orienta al agente sobre
// qué debe informar y ofrecer a la víctima (distinto de los derechos del DETENIDO del art. 520 LECrim).
const ART_EVD_VICTIMA = articuloDe(ID_EVD, {
  numero: '5 y concordantes',
  titulo: 'Información de derechos a la víctima (Estatuto + ofrecimiento de acciones LECrim)',
  texto:
    'El Estatuto de la víctima del delito (Ley 4/2015, de 27 de abril) reconoce a toda víctima, con ' +
    'carácter general y desde el PRIMER CONTACTO con las autoridades, un conjunto de derechos que el ' +
    'agente procede a garantizar y a hacer efectivos: derecho a ENTENDER y a ser entendida, con ' +
    'lenguaje claro, sencillo y accesible (art. 4); derecho a la INFORMACIÓN desde el primer contacto ' +
    '(medidas de apoyo y protección disponibles, cómo denunciar, asesoramiento y asistencia jurídica, ' +
    'indemnizaciones, interpretación y traducción, y las resoluciones relevantes del proceso) (art. 5); ' +
    'derecho a la TRADUCCIÓN E INTERPRETACIÓN gratuitas cuando no hable o entienda el idioma (art. 9); y ' +
    'una EVALUACIÓN INDIVIDUAL de sus necesidades de protección para determinar las medidas que procedan ' +
    '(art. 23). Además, la LECrim prevé el OFRECIMIENTO DE ACCIONES: informar a la persona ofendida o ' +
    'perjudicada de su derecho a mostrarse parte en la causa y a la restitución, reparación e ' +
    'indemnización del daño (art. 109), pudiendo personarse y ejercitar las acciones civiles y penales ' +
    '(art. 110). En violencia de género o doméstica, la víctima tiene derecho a SOLICITAR una ORDEN DE ' +
    'PROTECCIÓN, que acuerda en su caso la autoridad judicial (art. 544 ter LECrim). Resumen orientativo; ' +
    'la valoración final corresponde a la autoridad competente.',
});

export const ARTICULOS_SEGURIDAD_SEED: Articulo[] = [
  ART_LOSC_16,
  ART_LOSC_20,
  ART_EVD_VICTIMA,
  ART_LOSC_36_1,
  ART_LOSC_36_3,
  ART_LOSC_36_6,
  ART_LOSC_36_10,
  ART_LOSC_36_16,
  ART_LOSC_36_23,
  ART_LOSC_37_1,
  ART_LOSC_37_4,
  ART_LOSC_37_7,
  ART_LOSC_37_17,
  ART_LOPJM_MENA,
];

// --- Constructor de una infracción de seguridad ciudadana -----------------------------------

/**
 * Competencia por defecto: los tres cuerpos generalistas pueden denunciar la LO 4/2015 en vía
 * urbana e interurbana. (Las autonómicas integrales también, pero se filtra por territorio en la
 * app; aquí se deja el vocabulario básico común a GC, Nacional y Local.)
 */
const COMPETENCIA_SEGURIDAD = {
  cuerpos: ['guardia_civil', 'policia_nacional', 'policia_local', 'policia_autonomica'] as const,
  via: 'ambas' as const,
};

interface InfraccionSeedInput {
  id: string;
  articulo: Articulo;
  tituloCorto: string;
  gravedad: Infraccion['gravedad'];
  /** Importe base. `null` SOLO para entradas `no_sancionador` (consultables sin sanción). */
  importeEur: number | null;
  /** Importe con pronto pago. `null` para las entradas sin sanción. */
  importeReducidoEur: number | null;
  textoBoletin: string;
  terminos: string[];
  consecuencias?: Array<{ tipo: Consecuencia['tipo']; textoCorto: string; fuente: string }>;
  notaRevision: string;
  /**
   * Marco de importe para la validación (§8.3). Por defecto `seguridad_ciudadana` (horquilla del
   * art. 39). Se pone `no_sancionador` en las ENTRADAS CONSULTABLES que no imponen sanción, como el
   * REQUERIMIENTO de identificación (art. 16 LO 4/2015): es una facultad/diligencia, no una
   * infracción, por lo que no lleva importe y los validadores no lo exigen.
   */
  marcoImporte?: MarcoImporte;
}

/**
 * Máximo del tramo (horquilla del art. 39) por gravedad, tomado del RANGO LEGAL de shared (fuente
 * única): leve 600 €, grave 30.000 €, muy grave 600.000 €. La ficha lo usa para pintar el RANGO
 * ("601–30.000 €") sin destacar la cifra: en seguridad ciudadana manda el TRAMO, no el número.
 */
function maximoTramoSeguridad(gravedad: Infraccion['gravedad']): number | null {
  if (gravedad === 'leve' || gravedad === 'grave' || gravedad === 'muy_grave') {
    return RANGOS_IMPORTE_SEGURIDAD_CIUDADANA[gravedad].max;
  }
  return null;
}

function construirInfraccion(input: InfraccionSeedInput): InfraccionSeed {
  const marco = input.marcoImporte ?? ('seguridad_ciudadana' satisfies MarcoImporte);
  const infraccion = Infraccion.parse({
    id: input.id,
    articuloId: input.articulo.id,
    codigoDgt: null,
    tituloCorto: input.tituloCorto,
    gravedad: input.gravedad,
    tipo: 'administrativa',
    importeEur: input.importeEur,
    importeReducidoEur: input.importeReducidoEur,
    // Máximo del tramo solo cuando hay sanción de seguridad ciudadana (no en `no_sancionador`).
    importeMaxEur:
      input.importeEur !== null && marco === 'seguridad_ciudadana'
        ? maximoTramoSeguridad(input.gravedad)
        : null,
    puntos: null, // la LO 4/2015 no detrae puntos (no es tráfico)
    textoBoletin: input.textoBoletin,
    variantesBoletin: [],
    competencia: COMPETENCIA_SEGURIDAD,
    ambito: 'estatal',
    territorioId: null,
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

  const consecuencias: Consecuencia[] = (input.consecuencias ?? []).map((c, i) =>
    Consecuencia.parse({
      id: `${input.id}:cons-${i}`,
      tipo: c.tipo,
      regla: {},
      textoCorto: c.textoCorto,
      fuente: c.fuente,
      infraccionId: input.id,
      articuloId: null,
    }),
  );

  return {
    infraccion,
    sinonimos,
    consecuencias,
    marcoImporte: marco,
    revision: 'pendiente_revision',
    notaRevision: input.notaRevision,
  };
}

/**
 * Nota común a las infracciones GRAVES: el importe es una horquilla amplísima (601–30.000 €) y
 * el seed fija el extremo inferior (601 €) como referencia conservadora, a confirmar por el
 * revisor. Se factoriza para no repetir el mismo párrafo en cada infracción.
 */
const NOTA_GRAVE_IMPORTE =
  'A VERIFICAR el importe: la LO 4/2015 sanciona las infracciones GRAVES con una horquilla de ' +
  '601 a 30.000 € (tramo mínimo 601–10.400 €, art. 39). El seed fija el extremo inferior (601 €) ' +
  'como referencia conservadora; el importe efectivo lo gradúa la autoridad según la reincidencia, ' +
  'el perjuicio y demás circunstancias del art. 33. El pronto pago (art. 54) reduce el 50 %.';

const NOTA_LEVE_IMPORTE =
  'A VERIFICAR el importe: la LO 4/2015 sanciona las infracciones LEVES con una horquilla de 100 ' +
  'a 600 € (art. 39). El seed fija el extremo inferior (100 €) como referencia conservadora; el ' +
  'importe efectivo lo gradúa la autoridad según las circunstancias del art. 33. El pronto pago ' +
  '(art. 54) reduce el 50 %.';

// --- Infracciones sembradas -----------------------------------------------------------------
export const INFRACCIONES_SEGURIDAD_SEED: InfraccionSeed[] = [
  // ENTRADA CONSULTABLE (no es una infracción): el REQUERIMIENTO de identificación (art. 16). Se
  // modela como entrada `no_sancionador` (sin importe) para que el buscador y el acceso rápido
  // "Identificación" (consulta diaria de PN/GC/Local) devuelvan algo útil. La NEGATIVA a
  // identificarse sí es infracción y vive aparte (`sc-negativa-identificarse`, art. 36.6).
  construirInfraccion({
    id: 'sc-identificacion-requerimiento',
    articulo: ART_LOSC_16,
    tituloCorto: 'Identificación de personas (requerimiento)',
    // No sanciona: es una facultad/diligencia. `gravedad: 'leve'` es un valor de relleno exigido
    // por el modelo (revisar la presentación de una entrada no sancionadora en la ficha con el
    // revisor y mobile-dev); lo determinante es que no lleva importe (marco `no_sancionador`).
    gravedad: 'leve',
    marcoImporte: 'no_sancionador',
    importeEur: null,
    importeReducidoEur: null,
    textoBoletin:
      'Requerimiento de identificación (art. 16 LO 4/2015): procede identificar a una persona cuando ' +
      'existan indicios de su participación en una infracción o cuando resulte necesario para prevenir ' +
      'un delito. REQUISITOS orientativos: motivo concreto, comprobaciones en el propio lugar y, solo ' +
      'si la identificación no se logra por otro medio y es necesaria, requerir que acompañe a las ' +
      'dependencias por el TIEMPO IMPRESCINDIBLE —que en ningún caso podrá superar las 6 horas ' +
      '(art. 16.2 LO 4/2015)— y a los solos efectos de identificar. Este traslado ' +
      'NO es una detención: la persona no queda privada de libertad por un delito, no se le leen los ' +
      'derechos del detenido (art. 520 LECrim) y debe quedar constancia en el libro-registro/diligencia ' +
      '(causa, identidad, tiempo y circunstancias). Si la persona se niega a identificarse o aporta ' +
      'datos falsos, puede incurrir en la infracción del art. 36.6. La valoración final corresponde al agente.',
    terminos: [
      'identificacion',
      'pedir la documentacion',
      'control de identidad',
      'filiar',
      'documentacion por favor',
      'identificar a alguien',
      'requerimiento de identificacion',
      'diligencia de identificacion',
      'pedir el dni',
      // Lenguaje de calle (validador): no llevar documentacion NO es infraccion; se identifica por
      // otros medios. Estos terminos caen aqui (art. 16), no en la negativa del 36.6.
      'papeles',
      'la documentacion',
      'pedir la filiacion',
      'indocumentado',
      'sin dni encima',
      'llevar a comisaria a identificar',
      'resenar',
    ],
    consecuencias: [
      {
        tipo: 'identificacion',
        textoCorto:
          'Procede requerir la identificación con un motivo concreto; el traslado a dependencias, ' +
          'cuando sea imprescindible para identificar, es por el TIEMPO MÍNIMO —que en ningún caso ' +
          'podrá superar las 6 horas (art. 16.2 LO 4/2015)— y NO constituye detención (no se leen los ' +
          'derechos del art. 520 LECrim). Levantar la diligencia/libro-registro.',
        fuente: 'LO 4/2015 art. 16',
      },
    ],
    notaRevision:
      'ENTRADA CONSULTABLE, no infracción: el art. 16 LO 4/2015 regula la FACULTAD de identificación, ' +
      'no una sanción (por eso el marco es `no_sancionador` y no lleva importe). A VERIFICAR con el ' +
      'revisor jurídico: (i) los requisitos y límites del traslado a dependencias (tiempo ' +
      'imprescindible, que en ningún caso podrá superar las 6 horas del art. 16.2 LO 4/2015, solo ' +
      'efectos de identificación, constancia en libro-registro), (ii) la ' +
      'DIFERENCIA con la detención (art. 520 LECrim: no privación de libertad por delito, no lectura ' +
      'de derechos) y (iii) la presentación en la ficha de una entrada sin sanción (evitar que se ' +
      'muestre como un "tramo" sancionador). Confirmar redacción orientativa antes de publicar.',
  }),
  construirInfraccion({
    id: 'sc-desobediencia-resistencia',
    articulo: ART_LOSC_36_6,
    tituloCorto: 'Desobediencia o resistencia a la autoridad',
    gravedad: 'grave',
    importeEur: 601,
    importeReducidoEur: 300.5,
    textoBoletin:
      'Desobedecer o resistirse a la autoridad o a sus agentes en el ejercicio de sus funciones, ' +
      'cuando la conducta no sea constitutiva de delito (art. 36.6 LO 4/2015). Si la resistencia es ' +
      'grave o media violencia sobre el agente, el hecho puede ser delito de atentado o resistencia ' +
      '(arts. 550 y 556 CP): la calificación final corresponde a la autoridad judicial.',
    terminos: [
      'desobediencia',
      'desobedecer a la policia',
      'resistencia a la autoridad',
      'no obedece',
      'no hace caso',
      'se resiste',
      'no colabora',
      'ignora al agente',
      'desacato',
      'no acata las ordenes',
    ],
    consecuencias: [
      {
        tipo: 'identificacion',
        textoCorto:
          'Procede identificar al infractor para la denuncia; la valoración de si la conducta ' +
          'supera el ámbito administrativo (delito de los arts. 550/556 CP) corresponde al agente ' +
          'y a la autoridad judicial.',
        fuente: 'LO 4/2015 art. 16',
      },
    ],
    notaRevision:
      NOTA_GRAVE_IMPORTE +
      ' A VERIFICAR además la frontera con el delito: la desobediencia/resistencia GRAVE o con ' +
      'violencia es delito (atentado art. 550 CP; resistencia/desobediencia grave art. 556 CP), no ' +
      'infracción administrativa. Confirmar el encaje del caso con el revisor jurídico.',
  }),
  construirInfraccion({
    id: 'sc-negativa-identificarse',
    articulo: ART_LOSC_36_6,
    tituloCorto: 'Negativa a identificarse ante el agente',
    gravedad: 'grave',
    importeEur: 601,
    importeReducidoEur: 300.5,
    textoBoletin:
      'Negarse a identificarse a requerimiento de la autoridad o de sus agentes, o alegar datos ' +
      'falsos o inexactos en el proceso de identificación (art. 36.6 LO 4/2015).',
    terminos: [
      'negarse a identificarse',
      'no se identifica',
      'no quiere dar el dni',
      'sin identificarse',
      'se niega a dar el dni',
      'no da sus datos',
      'datos falsos',
      'identidad falsa',
      'no lleva documentacion',
      // Lenguaje de calle (validador): la negativa/no colaboracion a identificarse (art. 36.6).
      'no se quiere identificar',
      'no colabora',
      'se puso chulo',
      'se encaro',
      'me planto cara',
    ],
    consecuencias: [
      {
        tipo: 'identificacion',
        textoCorto:
          'Procede requerir la identificación y, de no lograrse por otros medios y ser necesario ' +
          'para prevenir un delito o sancionar una infracción, valorar el traslado a dependencias ' +
          'policiales para la identificación (art. 16 LO 4/2015).',
        fuente: 'LO 4/2015 art. 16',
      },
    ],
    notaRevision:
      NOTA_GRAVE_IMPORTE +
      ' A VERIFICAR la relación con el art. 16 (identificación de personas): el traslado a ' +
      'dependencias tiene requisitos y plazo máximo estrictos; confirmar la redacción orientativa ' +
      'con el revisor jurídico.',
  }),
  construirInfraccion({
    id: 'sc-drogas-via-publica',
    articulo: ART_LOSC_36_16,
    tituloCorto: 'Consumo o tenencia de drogas en la vía pública',
    gravedad: 'grave',
    importeEur: 601,
    importeReducidoEur: 300.5,
    textoBoletin:
      'Consumir o tener ilícitamente drogas tóxicas, estupefacientes o sustancias psicotrópicas —' +
      'aunque no se destinen al tráfico— en vías, lugares o establecimientos públicos o transportes ' +
      'colectivos, así como abandonar en esos lugares los instrumentos empleados para ello ' +
      '(art. 36.16 LO 4/2015).',
    terminos: [
      'drogas en la calle',
      'fumando porros',
      'porro en la via publica',
      'consumo de drogas',
      'tenencia de drogas',
      'llevar droga encima',
      'costo',
      'maria',
      'hachis',
      'china',
      'cocaina en la calle',
      'esnifando',
      'droga para consumo propio',
    ],
    consecuencias: [
      {
        tipo: 'decomiso',
        textoCorto:
          'Procede la aprehensión (comiso) de la droga y de los instrumentos empleados para su ' +
          'consumo, que se ponen a disposición de la autoridad competente.',
        fuente: 'LO 4/2015 art. 39.2',
      },
    ],
    notaRevision:
      NOTA_GRAVE_IMPORTE +
      ' El comiso de la sustancia y de los instrumentos es sanción accesoria del art. 39.2 LO 4/2015. ' +
      'La suspensión de la sanción por sometimiento a tratamiento de deshabituación está prevista en ' +
      'la Disposición Adicional Quinta LO 4/2015 y SOLO para menores de edad (el art. 38 regula la ' +
      'prescripción, no la deshabituación). La tenencia para el consumo propio en lugar público es ' +
      'infracción administrativa, no delito; el tráfico sí es delito (art. 368 CP). Confirmar con el ' +
      'revisor jurídico.',
  }),
  construirInfraccion({
    id: 'sc-armas-prohibidas',
    articulo: ART_LOSC_36_10,
    tituloCorto: 'Portar armas prohibidas',
    gravedad: 'grave',
    importeEur: 601,
    importeReducidoEur: 300.5,
    textoBoletin:
      'Portar, exhibir o usar armas prohibidas, o portar, exhibir o usar cualquier arma de modo ' +
      'negligente, temerario o intimidatorio, o fuera de los lugares habilitados, cuando la conducta ' +
      'no sea constitutiva de delito (art. 36.10 LO 4/2015). La calificación de las armas prohibidas ' +
      'remite al Reglamento de Armas.',
    terminos: [
      'arma prohibida',
      'navaja automatica',
      'llevar una navaja',
      'arma blanca',
      'defensa electrica',
      'puños americanos',
      'porra extensible',
      'spray de defensa',
      'exhibir un arma',
      'nunchaku',
    ],
    consecuencias: [
      {
        tipo: 'decomiso',
        textoCorto:
          'Procede valorar la intervención (aprehensión) del arma y su puesta a disposición de la ' +
          'autoridad competente.',
        fuente: 'LO 4/2015 art. 36.10',
      },
    ],
    notaRevision:
      NOTA_GRAVE_IMPORTE +
      ' A VERIFICAR qué armas son "prohibidas" (remisión al Reglamento de Armas, RD 137/1993, art. ' +
      '4) y la frontera con el delito de tenencia ilícita de armas (arts. 563 y ss. CP). Confirmar ' +
      'el artículo del comiso del arma. Revisar con el revisor jurídico.',
  }),
  construirInfraccion({
    id: 'sc-desordenes-obstaculizar-via',
    articulo: ART_LOSC_36_3,
    tituloCorto: 'Desórdenes u obstaculización de la vía pública',
    gravedad: 'grave',
    importeEur: 601,
    importeReducidoEur: 300.5,
    textoBoletin:
      'Causar desórdenes en las vías, espacios o establecimientos públicos, u obstaculizar la vía ' +
      'pública con mobiliario urbano, vehículos, contenedores, neumáticos u otros objetos, cuando en ' +
      'ambos casos se ocasione una alteración grave de la seguridad ciudadana (art. 36.3 LO 4/2015).',
    terminos: [
      'desordenes publicos',
      'altercado',
      'jaleo en la calle',
      'cortar la calle',
      'obstaculizar la via',
      'barricada',
      'quemar contenedores',
      'pelea en la via publica',
      'disturbios',
      'alboroto',
    ],
    notaRevision:
      NOTA_GRAVE_IMPORTE +
      ' A VERIFICAR la frontera con el delito de desórdenes públicos (art. 557 CP) cuando actúan en ' +
      'grupo y con violencia/intimidación. La infracción administrativa exige "alteración grave" de ' +
      'la seguridad ciudadana sin llegar a delito. Confirmar el encaje con el revisor jurídico.',
  }),
  construirInfraccion({
    id: 'sc-perturbacion-actos-espectaculos',
    articulo: ART_LOSC_36_1,
    tituloCorto: 'Perturbación de la seguridad en actos y espectáculos',
    gravedad: 'grave',
    importeEur: 601,
    importeReducidoEur: 300.5,
    textoBoletin:
      'Perturbar la seguridad ciudadana en actos públicos, espectáculos deportivos o culturales, ' +
      'solemnidades u oficios religiosos u otras reuniones a las que asistan numerosas personas, ' +
      'cuando la conducta no sea constitutiva de delito (art. 36.1 LO 4/2015).',
    terminos: [
      'altercado en el futbol',
      'bengala en el estadio',
      'pelea en un concierto',
      'invadir el campo',
      'desorden en el partido',
      'lanzar objetos al campo',
      'perturbar un acto publico',
      'jaleo en el estadio',
    ],
    notaRevision:
      NOTA_GRAVE_IMPORTE +
      ' A VERIFICAR la posible aplicación preferente de la Ley 19/2007 contra la violencia en el ' +
      'deporte para los espectáculos deportivos (régimen sancionador propio). Confirmar el encaje ' +
      'con el revisor jurídico.',
  }),
  construirInfraccion({
    id: 'sc-uso-imagenes-agentes',
    articulo: ART_LOSC_36_23,
    tituloCorto: 'Uso no autorizado de imágenes de agentes',
    gravedad: 'grave',
    importeEur: 601,
    importeReducidoEur: 300.5,
    textoBoletin:
      'Usar sin autorización imágenes o datos personales o profesionales de autoridades o miembros ' +
      'de las Fuerzas y Cuerpos de Seguridad que pueda poner en peligro la seguridad personal o ' +
      'familiar de los agentes, de instalaciones protegidas, o en riesgo el éxito de una operación, ' +
      'con respeto al derecho fundamental a la información (art. 36.23 LO 4/2015).',
    terminos: [
      'grabar a la policia',
      'difundir imagenes de agentes',
      'foto del policia',
      'publicar la cara del agente',
      'grabar la actuacion policial',
      'uso de imagenes de agentes',
      'colgar el video del policia',
    ],
    notaRevision:
      NOTA_GRAVE_IMPORTE +
      ' A VERIFICAR con especial cuidado: la mera grabación NO es infracción; se exige un peligro ' +
      'concreto para la seguridad del agente/operación y respeto al derecho a la información ' +
      '(precedentes del TC y del TS). Redacción sensible: confirmar con el revisor jurídico antes ' +
      'de publicar.',
  }),
  construirInfraccion({
    id: 'sc-falta-respeto-agente',
    articulo: ART_LOSC_37_4,
    tituloCorto: 'Falta de respeto a un agente de la autoridad',
    gravedad: 'leve',
    importeEur: 100,
    importeReducidoEur: 50,
    textoBoletin:
      'Faltar al respeto y la consideración debidos a un miembro de las Fuerzas y Cuerpos de ' +
      'Seguridad en el ejercicio de sus funciones de protección de la seguridad, cuando la conducta ' +
      'no sea constitutiva de infracción penal (art. 37.4 LO 4/2015).',
    terminos: [
      'falta de respeto',
      'insultar a la policia',
      'insulto al agente',
      'me ha faltado al respeto',
      'desconsideracion al agente',
      'menosprecio a la policia',
      'palabras despectivas',
      'contestar mal al agente',
    ],
    notaRevision:
      NOTA_LEVE_IMPORTE +
      ' A VERIFICAR la frontera con el delito: los insultos graves o amenazas pueden ser atentado/' +
      'desobediencia (arts. 550/556 CP) o injurias; la LO 4/2015 cubre la falta de respeto que NO ' +
      'llega a delito. Punto sensible por la interpretación amplia: confirmar con el revisor jurídico.',
  }),
  construirInfraccion({
    id: 'sc-ocupacion-inmueble',
    articulo: ART_LOSC_37_7,
    tituloCorto: 'Ocupación de inmueble o de la vía pública',
    gravedad: 'leve',
    importeEur: 100,
    importeReducidoEur: 50,
    textoBoletin:
      'Ocupar un inmueble, vivienda o edificio ajenos, o permanecer en ellos contra la voluntad de ' +
      'su propietario, arrendatario o titular de un derecho, cuando no sea constitutivo de delito; ' +
      'así como ocupar la vía pública incumpliendo la ley o la decisión de la autoridad competente ' +
      '(art. 37.7 LO 4/2015).',
    terminos: [
      'okupas',
      'ocupacion de vivienda',
      'okupacion',
      'han okupado un piso',
      'ocupar la calle',
      'permanencia contra la voluntad del dueño',
    ],
    // NOTA (revisor): "top manta"/"venta ambulante sin permiso" NO cuelgan de la ocupación de
    // inmueble del art. 37.7: son materia de ORDENANZA municipal (venta ambulante) y, cuando hay
    // marca falsificada, del art. 274 CP (falsificación de marca). Se desligan de esta ficha para
    // no dar un encaje jurídico erróneo; su ficha propia queda para otra ronda.
    notaRevision:
      NOTA_LEVE_IMPORTE +
      ' A VERIFICAR la frontera con los delitos de allanamiento de morada (art. 202 CP) y usurpación ' +
      '(art. 245 CP): la infracción administrativa cubre la ocupación/permanencia que NO sea delito. ' +
      'Confirmar el encaje del caso con el revisor jurídico. Desligados los sinónimos "top manta"/' +
      '"venta ambulante sin permiso" (ordenanza municipal / art. 274 CP), que NO son ocupación de inmueble.',
  }),
  construirInfraccion({
    id: 'sc-reunion-no-comunicada',
    articulo: ART_LOSC_37_1,
    tituloCorto: 'Reunión o manifestación no comunicada',
    gravedad: 'leve',
    importeEur: 100,
    importeReducidoEur: 50,
    textoBoletin:
      'Celebrar reuniones en lugares de tránsito público o manifestaciones incumpliendo lo previsto ' +
      'en la Ley Orgánica 9/1983 reguladora del derecho de reunión (falta de comunicación previa). ' +
      'La responsabilidad recae en los organizadores o promotores (art. 37.1 LO 4/2015).',
    terminos: [
      'manifestacion no comunicada',
      'concentracion sin permiso',
      'protesta no autorizada',
      'reunion no comunicada',
      'manifestacion sin avisar',
      'concentracion no comunicada',
      'protesta espontanea',
      'mani',
      'concentracion',
    ],
    notaRevision:
      NOTA_LEVE_IMPORTE +
      ' A VERIFICAR: el derecho de reunión es un derecho fundamental (art. 21 CE); la falta de ' +
      'comunicación NO impide por sí sola el ejercicio del derecho y la sanción debe ponderarse. ' +
      'Distinguir de la infracción MUY GRAVE del art. 35.1 (reuniones o manifestaciones en ' +
      'infraestructuras críticas) y de la GRAVE del art. 36.8 (perturbación del desarrollo de una ' +
      'reunión o manifestación lícita). Punto sensible: confirmar con el revisor jurídico.',
  }),
  construirInfraccion({
    id: 'sc-consumo-alcohol-via-publica',
    articulo: ART_LOSC_37_17,
    tituloCorto: 'Consumo de alcohol en la vía pública (perturbación grave)',
    gravedad: 'leve',
    importeEur: 100,
    importeReducidoEur: 50,
    textoBoletin:
      'Consumir bebidas alcohólicas en lugares, vías, establecimientos o transportes públicos cuando ' +
      'ese consumo PERTURBE GRAVEMENTE la tranquilidad ciudadana (art. 37.17 LO 4/2015). FRONTERA con la ' +
      'ordenanza municipal: el "botellón" (consumo colectivo de alcohol en la calle) lo regula y sanciona ' +
      'normalmente la ORDENANZA MUNICIPAL de convivencia; el tipo estatal del art. 37.17 solo procede ' +
      'cuando se acredita la perturbación grave de la tranquilidad. Sin esa perturbación grave, el mero ' +
      'consumo en vía pública no encaja en la LO 4/2015 y habrá que estar a la ordenanza local. La ' +
      'valoración final corresponde al agente.',
    terminos: [
      'botellon',
      'beber en la calle',
      'litrona',
      'botellona',
      'consumo de alcohol via publica',
      'beber en via publica',
      'litros',
    ],
    notaRevision:
      NOTA_LEVE_IMPORTE +
      ' A VERIFICAR con especial cuidado la FRONTERA con la ordenanza municipal: el art. 37.17 LO 4/2015 ' +
      'EXIGE que el consumo perturbe GRAVEMENTE la tranquilidad ciudadana; el botellón simple lo suele ' +
      'sancionar la ordenanza de convivencia del municipio (comprobar qué ordenanza aplica en cada ' +
      'territorio). Confirmar que no se aplica el tipo estatal a un mero consumo sin perturbación grave. ' +
      'Punto sensible: revisar con el revisor jurídico antes de publicar.',
  }),
  // ENTRADA CONSULTABLE (no sancionadora): MENA. NO es cuestión de sanción sino de PROTECCIÓN del
  // menor. Se modela como `no_sancionador` (sin importe), igual que el requerimiento de
  // identificación (art. 16). Sirve para que un agente que teclea "mena" reciba la orientación
  // correcta (protección, Fiscalía, Entidad Pública) y el aviso de que NUNCA procede calabozo.
  construirInfraccion({
    id: 'sc-mena-consulta',
    articulo: ART_LOPJM_MENA,
    tituloCorto: 'Menor extranjero no acompañado (MENA): protección',
    gravedad: 'leve', // valor de relleno exigido por el modelo; lo determinante es que NO sanciona
    marcoImporte: 'no_sancionador',
    importeEur: null,
    importeReducidoEur: null,
    textoBoletin:
      'Menor extranjero no acompañado (MENA): NO es una cuestión sancionadora sino de PROTECCIÓN. Un ' +
      'presunto menor extranjero que se encuentra solo está, en principio, en situación de desamparo y ' +
      'rige el interés superior del menor (LO 1/1996). ORIENTACIÓN: procede identificarlo con las ' +
      'cautelas propias de un menor, ponerlo a disposición de la Entidad Pública de protección de ' +
      'menores de la comunidad autónoma y comunicar de inmediato al Ministerio Fiscal (Fiscalía de ' +
      'Menores), conforme al art. 35 LO 4/2000. La determinación de la edad, si hay dudas, la acuerda la ' +
      'autoridad competente (Fiscalía) por el procedimiento legal —NO la valora la app ni el agente—. El ' +
      'menor de 14 años es inimputable penalmente (fuera de la LO 5/2000). NUNCA procede el calabozo ni ' +
      'el trato como adulto por su condición de menor o de extranjero. IN DUBIO PRO MINORE: en caso de ' +
      'duda debe presumirse la minoría de edad y dispensarse el trato de menor mientras la autoridad no ' +
      'determine lo contrario; y al que porta un pasaporte o documento de identidad válido NO se le ' +
      'deben practicar pruebas de determinación de la edad salvo indicios claros de falsedad. La ' +
      'valoración final corresponde a la autoridad competente (Fiscalía/Entidad Pública).',
    terminos: [
      'mena',
      'menor extranjero no acompañado',
      'menor sin familia',
      'menor migrante solo',
      'cria solo',
    ],
    consecuencias: [
      {
        tipo: 'proteccion',
        textoCorto:
          'Procede identificar al menor con cautelas, ponerlo a disposición de la Entidad Pública de ' +
          'protección de menores y comunicar al Ministerio Fiscal (Fiscalía de Menores). NUNCA procede ' +
          'calabozo por su condición de menor/extranjero; la determinación de edad la acuerda la ' +
          'autoridad competente, no la app.',
        fuente: 'LO 1/1996 y LO 4/2000 art. 35',
      },
    ],
    notaRevision:
      'ENTRADA CONSULTABLE, no infracción: es materia de PROTECCIÓN del menor, no sancionadora (marco ' +
      '`no_sancionador`, sin importe). A VERIFICAR con el revisor jurídico: (i) el circuito exacto de ' +
      'puesta a disposición de la Entidad Pública de protección de menores y de comunicación a la ' +
      'Fiscalía (art. 35 LO 4/2000 y su desarrollo reglamentario, RD 557/2011; Protocolo Marco MENA ' +
      'de 2014), (ii) el procedimiento de determinación de la edad y sus garantías (competencia de la ' +
      'Fiscalía; jurisprudencia del TS y del Comité de Derechos del Niño), (iii) la inimputabilidad del ' +
      'menor de 14 años (fuera de la LO 5/2000) y (iv) la redacción del mensaje de que NUNCA procede ' +
      'calabozo. Punto jurídicamente muy sensible: confirmar toda la redacción antes de publicar.',
  }),
  // ENTRADA CONSULTABLE (no sancionadora): INFORMACIÓN DE DERECHOS A LA VÍCTIMA. La validación de
  // Policía Nacional la echó de menos: distinta de los derechos del DETENIDO (art. 520 LECrim, que
  // viven en otra pantalla). Orienta al agente sobre qué debe informar y ofrecer a la víctima
  // (Estatuto de la víctima + ofrecimiento de acciones y orden de protección de la LECrim). Se
  // modela `no_sancionador` (sin importe), igual que el requerimiento de identificación o el MENA.
  construirInfraccion({
    id: 'sc-derechos-victima',
    articulo: ART_EVD_VICTIMA,
    tituloCorto: 'Información de derechos a la víctima',
    gravedad: 'leve', // valor de relleno exigido por el modelo; lo determinante es que NO sanciona
    marcoImporte: 'no_sancionador',
    importeEur: null,
    importeReducidoEur: null,
    textoBoletin:
      'Información de derechos a la VÍCTIMA (Estatuto de la víctima del delito, Ley 4/2015; y LECrim). ' +
      'NO es una cuestión sancionadora: orienta sobre qué procede informar y ofrecer a la víctima desde ' +
      'el PRIMER CONTACTO (a diferencia de los derechos del DETENIDO del art. 520 LECrim, que se leen a la ' +
      'persona detenida y viven aparte). Con carácter general procede: (i) garantizar que ENTIENDE y es ' +
      'entendida, en lenguaje claro y accesible (art. 4); (ii) INFORMARLE de las medidas de apoyo y ' +
      'protección, de cómo denunciar, del asesoramiento y la asistencia jurídica, de las posibles ' +
      'indemnizaciones y de la interpretación/traducción (art. 5); (iii) ofrecer INTÉRPRETE/TRADUCCIÓN ' +
      'gratuitos si no habla o entiende el idioma (art. 9); (iv) tener en cuenta la EVALUACIÓN INDIVIDUAL ' +
      'de sus necesidades de protección (art. 23); (v) practicar el OFRECIMIENTO DE ACCIONES, informándola ' +
      'de su derecho a mostrarse parte en la causa y a la restitución, reparación e indemnización ' +
      '(arts. 109 y 110 LECrim); y (vi) en violencia de género o doméstica, informarle de su derecho a ' +
      'SOLICITAR una ORDEN DE PROTECCIÓN, que acuerda en su caso la autoridad judicial (juez de ' +
      'instrucción en funciones de guardia, art. 544 ter LECrim). La valoración final corresponde a la ' +
      'autoridad competente.',
    terminos: [
      'derechos de la victima',
      'victima',
      'estatuto de la victima',
      'ofrecimiento de acciones',
      'informar a la victima',
      'orden de proteccion',
      '109 lecrim',
    ],
    // SIN consecuencia coercitiva a propósito (revisor): es una consulta GENERAL de derechos de toda
    // víctima, no un caso activo de violencia de género; usar `proteccion` (que sale destacado en rojo)
    // sobre-señalaría que siempre hay orden de protección en juego. Al no llevar consecuencia, cae al
    // chip informativo "Consulta · orientación". La orden de protección queda acotada a VG en el texto.
    consecuencias: [],
    notaRevision:
      'ENTRADA CONSULTABLE, no infracción: es información de DERECHOS a la víctima, no sancionadora ' +
      '(marco `no_sancionador`, sin importe). Fuentes cotejadas en el BOE consolidado: Ley 4/2015, de 27 ' +
      'de abril, del Estatuto de la víctima del delito (arts. 4, 5, 9 y 23) y LECrim (arts. 109, 110 y ' +
      '544 ter). A VERIFICAR con el revisor jurídico: (i) que no se confunda con los derechos del DETENIDO ' +
      '(art. 520 LECrim), que ya viven en otra pantalla; (ii) el alcance y los requisitos de la ORDEN DE ' +
      'PROTECCIÓN del art. 544 ter (legitimación para solicitarla, competencia del juez de guardia); ' +
      '(iii) la redacción orientativa del ofrecimiento de acciones; y (iv) la presentación en la ficha de ' +
      'una entrada sin sanción (que no muestre tramo/importe). Confirmar toda la redacción antes de publicar.',
  }),
  // ENTRADA CONSULTABLE (no sancionadora): CACHEO / REGISTRO y ENTRADA Y REGISTRO — consulta de
  // GARANTÍAS. La validación de Policía Nacional la echó de menos. Orienta sobre qué requiere
  // autorización judicial y qué no; NO es un tipo infractor. Se modela `no_sancionador` (sin importe),
  // anclada al art. 20 LO 4/2015 (registros corporales externos); la entrada y registro en domicilio
  // se apoya en el art. 18.2 CE y en los arts. 545 y ss. LECrim, citados en el boletín.
  construirInfraccion({
    id: 'sc-cacheo-registro',
    articulo: ART_LOSC_20,
    tituloCorto: 'Cacheo, registro corporal y entrada y registro (garantías)',
    gravedad: 'leve', // valor de relleno exigido por el modelo; lo determinante es que NO sanciona
    marcoImporte: 'no_sancionador',
    importeEur: null,
    importeReducidoEur: null,
    textoBoletin:
      'Cacheo y registros: CONSULTA de GARANTÍAS (no es una sanción). Con carácter general: el REGISTRO ' +
      'CORPORAL EXTERNO Y SUPERFICIAL (cacheo/palpación) procede cuando haya indicios racionales de que ' +
      'puede llevar al hallazgo de objetos relevantes (art. 20.1 LO 4/2015); se practica respetando la ' +
      'dignidad, por agente del MISMO SEXO salvo urgencia por riesgo grave, con motivación e informando ' +
      'de las razones, y —si obliga a dejar a la vista partes del cuerpo cubiertas por ropa— en LUGAR ' +
      'RESERVADO y con constancia escrita (art. 20.2 y 20.3). El registro que implique DESNUDO INTEGRAL ' +
      'se considera EXCEPCIONAL y con garantías reforzadas (motivación cualificada, proporcionalidad ' +
      'estricta, nunca de forma rutinaria), conforme a la doctrina del Tribunal Constitucional sobre la ' +
      'intimidad corporal (no lo regula el literal del art. 20). El REGISTRO DEL VEHÍCULO, como registro ' +
      'superficial de un efecto, con carácter general no equivale a la entrada en domicilio, SALVO que el ' +
      'vehículo se use como VIVIENDA (autocaravana o furgoneta-camper habitada), en cuyo caso puede tener ' +
      'la protección del domicilio y requerir la misma cobertura. La ENTRADA Y REGISTRO en DOMICILIO es lo ' +
      'más garantista: salvo CONSENTIMIENTO del titular o DELITO FLAGRANTE, requiere RESOLUCIÓN JUDICIAL ' +
      '(art. 18.2 CE; arts. 545 y siguientes LECrim). REGLA ORIENTATIVA: el cacheo y el registro de un ' +
      'vehículo ordinario, con indicios y garantías, no requieren autorización judicial; la entrada en ' +
      'domicilio —o en un vehículo-vivienda— SÍ la requiere salvo consentimiento o flagrancia. La ' +
      'valoración final corresponde al agente y, en su caso, a la autoridad judicial.',
    terminos: [
      'cacheo',
      'le cacheo',
      'registro superficial',
      'registro por encima',
      'registro de vehiculo',
      'mirar el coche',
      'entrada y registro',
      'registrar el domicilio',
      'registrar un piso',
      '18.2',
      'cacheo con desnudo',
      // Lenguaje de calle (validador): como lo dice el agente al cachear o mirar el vehiculo.
      'cachear',
      'palpar',
      'cachear por encima de la ropa',
      'vaciar los bolsillos',
      'registrar el maletero',
      'camper habitada',
      'furgoneta vivienda',
    ],
    notaRevision:
      'ENTRADA CONSULTABLE, no infracción: es consulta de GARANTÍAS del cacheo/registro, no sancionadora ' +
      '(marco `no_sancionador`, sin importe). Fuentes cotejadas en el BOE consolidado: art. 20 LO 4/2015 ' +
      '(registros corporales externos: 20.1 indicios racionales; 20.2 mismo sexo salvo urgencia, lugar ' +
      'reservado y constancia escrita; 20.3 proporcionalidad, injerencia mínima e información) y art. 18.2 ' +
      'CE con los arts. 545 y ss. LECrim (entrada y registro en domicilio: consentimiento, resolución ' +
      'judicial o delito flagrante). A VERIFICAR con el revisor jurídico: (i) el encaje exacto del registro ' +
      'con DESNUDO INTEGRAL (art. 20.2/20.3 y jurisprudencia del TC sobre intimidad corporal) y de las ' +
      'medidas compulsivas (art. 20.4), a verificar; (ii) los matices del registro del VEHÍCULO frente al ' +
      'domicilio (auto-caravana/vivienda habitual); (iii) el concepto de delito FLAGRANTE y los supuestos ' +
      'del art. 553 LECrim; y (iv) la presentación en la ficha de una entrada sin sanción. Punto sensible ' +
      'por afectar a derechos fundamentales: mantener el lenguaje orientativo y confirmar toda la ' +
      'redacción antes de publicar.',
  }),
];

/** Estructura completa del seed lista para combinar con el resto de contenido. */
export const SEED_SEGURIDAD_CIUDADANA: SeedContenido = {
  normas: NORMAS_SEGURIDAD_SEED,
  articulos: ARTICULOS_SEGURIDAD_SEED,
  infracciones: INFRACCIONES_SEGURIDAD_SEED,
};
