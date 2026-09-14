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

// Artículos del catálogo de ARMAS (LO 4/2015). Tras la derogación de la LO 1/1992 por la propia LO
// 4/2015, las infracciones administrativas de armas se tipifican y gradúan AQUÍ (arts. 36 y 37); el
// Reglamento de Armas (RD 137/1993) queda como la OBLIGACIÓN material incumplida (guía, licencia,
// categorías, transporte, custodia). La frontera con el delito (tenencia ilícita 563-564 CP;
// depósito/tráfico 566-568 CP) se orienta en cada ficha. Verificado por `ingesta-normativa`.
const ART_LOSC_36_12 = articuloLosc({
  numero: '36.12',
  titulo: 'Armas reglamentadas sin documentación o incumpliendo la normativa (grave)',
  texto:
    'Tipifica como infracción GRAVE la fabricación, reparación, almacenamiento, circulación, comercio, ' +
    'transporte, distribución, adquisición, certificación, enajenación o utilización de armas ' +
    'reglamentarias, explosivos catalogados, cartuchería o artículos pirotécnicos, incumpliendo la ' +
    'normativa de aplicación, careciendo de la documentación o autorización requeridas o excediendo los ' +
    'límites autorizados, cuando la conducta no sea constitutiva de delito, así como la omisión, ' +
    'insuficiencia o falta de eficacia de las medidas de seguridad o precauciones obligatorias. La ' +
    'obligación material (guía, licencia, transporte, custodia) la detalla el Reglamento de Armas (RD ' +
    '137/1993). Resumen orientativo; consúltese el BOE.',
});

const ART_LOSC_37_8 = articuloLosc({
  numero: '37.8',
  titulo: 'Documentación de armas: conservación y denuncia de pérdida o sustracción (leve)',
  texto:
    'Tipifica como infracción LEVE la omisión o la insuficiencia de las medidas para garantizar la ' +
    'conservación de la DOCUMENTACIÓN de armas y explosivos, así como la falta de denuncia de la ' +
    'pérdida o sustracción DE ESA DOCUMENTACIÓN (no del arma en sí). Resumen orientativo; consúltese ' +
    'el texto consolidado en el BOE.',
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

// Artículo de ORIENTACIÓN (no sancionador) para la entrada consultable del RÉGIMEN DEL MENOR. Resume
// la actuación con un menor infractor (inimputable < 14; régimen penal del menor 14-17 con las
// garantías del art. 17 LO 5/2000), para capturar la búsqueda de calle ("detener a un menor", "menor
// robando"...). Se ancla a LOPJM (LO 1/1996) igual que MENA y cita la LO 5/2000 en su texto. Plazos
// COTEJADOS por el revisor jurídico (2026-09) contra el BOE consolidado: 24 h = art. 17.4; resolución
// del Fiscal en 48 h = art. 17.5; custodia separada = art. 17.3; aviso consular = art. 520.2 LECrim.
const ART_LOPJM_REGIMEN_MENOR = articuloDe(ID_LOPJM, {
  numero: 'REGIMEN-MENOR',
  titulo: 'Actuación con un menor infractor: inimputabilidad (< 14) y régimen del menor (14-17)',
  texto:
    'Ante un menor que comete un hecho, lo primero es la EDAD. MENOR DE 14 AÑOS: es penalmente ' +
    'INIMPUTABLE (arts. 1.1 y 3 LO 5/2000, reguladora de la responsabilidad penal del menor); no cabe ' +
    'detención penal. Procede identificarlo con cautelas de menor, entregarlo a sus representantes ' +
    'legales o, en su defecto, ponerlo a disposición de la Entidad Pública de protección de menores de ' +
    'la comunidad autónoma, y comunicarlo al Ministerio Fiscal (art. 3 LO 5/2000, en relación con la ' +
    'LO 1/1996). DE 14 A 17 AÑOS: SÍ responde penalmente, pero por la LO 5/2000 (no por el régimen de ' +
    'adultos): interviene el Ministerio Fiscal de Menores, no el juzgado de instrucción ordinario. Si ' +
    'se detiene, la detención policial no puede exceder de 24 HORAS y, dentro de ese plazo, el menor se ' +
    'pone en libertad o a disposición del Ministerio Fiscal (art. 17.4); el Fiscal resuelve dentro de ' +
    'las 48 horas siguientes a la detención (art. 17.5). Custodia en dependencias ADECUADAS y SEPARADAS ' +
    'de las de los mayores (art. 17.3): no procede el calabozo común. Información inmediata de hechos y ' +
    'derechos y notificación a representantes legales y al Ministerio Fiscal de Menores (art. 17.1). Si ' +
    'el menor es extranjero, comunicación a las autoridades consulares (art. 520.2 LECrim, aplicable por ' +
    'el régimen de garantías del detenido que reconoce el art. 17 LO 5/2000). La entrega se cierra ' +
    'dejando constancia (acta de entrega); si los padres o tutores ' +
    'no se hacen cargo, puesta a disposición de la Entidad Pública de protección. Resumen orientativo; ' +
    'la valoración final corresponde al agente, al Ministerio Fiscal de Menores y, en su caso, a la ' +
    'autoridad judicial.',
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

// --- Artículos de la 3ª ola (paridad SPPLB): huecos de los arts. 35, 36 y 37 LO 4/2015 -------
// Numeración COTEJADA contra el BOE consolidado (BOE-A-2015-3442, 2026-09). Textos redactados por
// nosotros (resúmenes neutros, no copiados). Todo el contenido queda `pendiente_revision`.
const ART_LOSC_35_3 = articuloLosc({
  numero: '35.3',
  titulo: 'Celebración de espectáculos prohibidos o suspendidos por seguridad pública (muy grave)',
  texto:
    'Tipifica como infracción MUY GRAVE la celebración de espectáculos públicos o actividades ' +
    'recreativas quebrantando la prohibición o la suspensión ordenada por la autoridad competente ' +
    'por razones de seguridad pública. Resumen orientativo; consúltese el texto consolidado en el BOE.',
});

const ART_LOSC_35_4 = articuloLosc({
  numero: '35.4',
  titulo: 'Proyección de haces de luz o láser sobre conductores o pilotos (muy grave)',
  texto:
    'Tipifica como infracción MUY GRAVE la proyección de haces de luz, mediante cualquier tipo de ' +
    'dispositivo, sobre los pilotos o conductores de medios de transporte que pueda deslumbrarles o ' +
    'distraer su atención y provocar accidentes. Se distingue del art. 37.6 (haces de luz sobre ' +
    'agentes, leve). Resumen orientativo; consúltese el texto consolidado en el BOE.',
});

const ART_LOSC_36_5 = articuloLosc({
  numero: '36.5',
  titulo: 'Obstaculización del funcionamiento de los servicios de emergencia (grave)',
  texto:
    'Tipifica como infracción grave las acciones y omisiones que impidan u obstaculicen el ' +
    'funcionamiento de los servicios de emergencia, provocando o incrementando un riesgo para la vida ' +
    'o la integridad de las personas o daños en los bienes, o agravando las consecuencias del suceso ' +
    'que motive su actuación. Resumen orientativo; consúltese el texto consolidado en el BOE.',
});

const ART_LOSC_36_7 = articuloLosc({
  numero: '36.7',
  titulo: 'Negativa a la disolución de reuniones y manifestaciones (grave)',
  texto:
    'Tipifica como infracción grave la negativa a la disolución de reuniones y manifestaciones en ' +
    'lugares de tránsito público ordenada por la autoridad competente cuando concurran los supuestos ' +
    'del art. 5 de la Ley Orgánica 9/1983, de 15 de julio, reguladora del derecho de reunión. Resumen ' +
    'orientativo; consúltese el texto consolidado en el BOE.',
});

const ART_LOSC_36_8 = articuloLosc({
  numero: '36.8',
  titulo: 'Perturbación del desarrollo de una reunión o manifestación lícita (grave)',
  texto:
    'Tipifica como infracción grave la perturbación del desarrollo de una reunión o manifestación ' +
    'lícita, cuando no constituya infracción penal. Resumen orientativo; consúltese el texto ' +
    'consolidado en el BOE.',
});

const ART_LOSC_36_9 = articuloLosc({
  numero: '36.9',
  titulo: 'Intrusión en infraestructuras o instalaciones de servicios básicos (grave)',
  texto:
    'Tipifica como infracción grave la intrusión en infraestructuras o instalaciones en las que se ' +
    'prestan servicios básicos para la comunidad, incluyendo su sobrevuelo, cuando se haya producido ' +
    'una interferencia grave en su funcionamiento. Si se genera un riesgo para la vida o la integridad ' +
    'física puede ser MUY GRAVE (art. 35.1). Resumen orientativo; consúltese el texto consolidado en el BOE.',
});

const ART_LOSC_36_11 = articuloLosc({
  numero: '36.11',
  titulo: 'Demanda de servicios sexuales retribuidos en zonas de riesgo (grave)',
  texto:
    'Tipifica como infracción grave la solicitud o aceptación por el demandante de servicios sexuales ' +
    'retribuidos en zonas de tránsito público en las proximidades de lugares destinados a su uso por ' +
    'menores (centros educativos, parques infantiles o espacios de ocio accesibles a menores), o cuando ' +
    'estas conductas, por el lugar en que se realicen, puedan generar un riesgo para la seguridad vial. ' +
    'Resumen orientativo; consúltese el texto consolidado en el BOE.',
});

const ART_LOSC_36_14 = articuloLosc({
  numero: '36.14',
  titulo: 'Uso público e indebido de uniformes, insignias o equipamiento oficiales (grave)',
  texto:
    'Tipifica como infracción grave el uso público e indebido de uniformes, insignias o condecoraciones ' +
    'oficiales, o réplicas de los mismos, así como otros elementos del equipamiento de los cuerpos ' +
    'policiales o de los servicios de emergencia que puedan generar engaño acerca de la condición de ' +
    'quien los use, cuando no sea constitutivo de infracción penal (frontera con la usurpación de ' +
    'funciones/uso de uniforme del art. 402 y 402 bis CP). Resumen orientativo; consúltese el BOE.',
});

const ART_LOSC_36_19 = articuloLosc({
  numero: '36.19',
  titulo: 'Tolerancia del consumo o tráfico de drogas en locales o establecimientos (grave)',
  texto:
    'Tipifica como infracción grave la tolerancia del consumo ilegal o del tráfico de drogas tóxicas, ' +
    'estupefacientes o sustancias psicotrópicas en locales o establecimientos públicos, o la falta de ' +
    'diligencia en orden a impedirlos por parte de los propietarios, administradores o encargados. La ' +
    'responsabilidad recae en el titular del local. Resumen orientativo; consúltese el texto consolidado en el BOE.',
});

const ART_LOSC_37_6 = articuloLosc({
  numero: '37.6',
  titulo: 'Proyección de haces de luz sobre agentes (leve)',
  texto:
    'Tipifica como infracción leve la proyección de haces de luz, mediante cualquier tipo de ' +
    'dispositivo, sobre miembros de las Fuerzas y Cuerpos de Seguridad para impedir o dificultar el ' +
    'ejercicio de sus funciones. Se distingue del art. 35.4 (haces sobre conductores/pilotos con riesgo ' +
    'de accidente, muy grave). Resumen orientativo; consúltese el texto consolidado en el BOE.',
});

const ART_LOSC_37_13 = articuloLosc({
  numero: '37.13',
  titulo: 'Daños o deslucimiento de bienes de uso público o privados en la vía pública (leve)',
  texto:
    'Tipifica como infracción leve los daños o el deslucimiento de bienes muebles o inmuebles de uso o ' +
    'servicio público, así como de bienes muebles o inmuebles privados situados en la vía pública, ' +
    'cuando no sean constitutivos de infracción penal (frontera con el delito de daños del art. 263 CP ' +
    'y con la deslucimiento/graffiti del art. 323 CP en bienes protegidos). Resumen orientativo; ' +
    'consúltese el texto consolidado en el BOE.',
});

const ART_LOSC_37_14 = articuloLosc({
  numero: '37.14',
  titulo: 'Escalamiento de edificios o monumentos sin autorización (leve)',
  texto:
    'Tipifica como infracción leve el escalamiento de edificios o monumentos sin autorización cuando ' +
    'exista un riesgo cierto de que se ocasionen daños a las personas o a los bienes. Resumen ' +
    'orientativo; consúltese el texto consolidado en el BOE.',
});

// --- Artículos de la 4ª ola (paridad SPPLB): más huecos de los arts. 36 y 37 LO 4/2015 -------
// Numeración COTEJADA contra el BOE consolidado (BOE-A-2015-3442, 2026-09). Textos redactados por
// nosotros (resúmenes neutros, no copiados). Todo el contenido queda `pendiente_revision`.
const ART_LOSC_36_2 = articuloLosc({
  numero: '36.2',
  titulo: 'Perturbación grave de la seguridad frente a sedes parlamentarias (grave)',
  texto:
    'Tipifica como infracción grave la perturbación grave de la seguridad ciudadana que se produzca ' +
    'con ocasión de reuniones o manifestaciones frente a las sedes del Congreso de los Diputados, del ' +
    'Senado y de las asambleas legislativas de las comunidades autónomas, aunque no estuvieran ' +
    'reunidos, cuando no constituya infracción penal. Resumen orientativo; consúltese el texto ' +
    'consolidado en el BOE.',
});

const ART_LOSC_36_4 = articuloLosc({
  numero: '36.4',
  titulo: 'Obstrucción al ejercicio de funciones o a la ejecución de resoluciones (grave)',
  texto:
    'Tipifica como infracción grave los actos de obstrucción que pretendan impedir a cualquier ' +
    'autoridad, empleado público o corporación oficial el ejercicio legítimo de sus funciones, el ' +
    'cumplimiento o la ejecución de acuerdos o resoluciones administrativas o judiciales, siempre que ' +
    'se produzcan al margen de los procedimientos legalmente establecidos y no sean constitutivos de ' +
    'delito. Caso típico: impedir un lanzamiento o desahucio judicial, o un desalojo acordado. Resumen ' +
    'orientativo; consúltese el texto consolidado en el BOE.',
});

const ART_LOSC_36_13 = articuloLosc({
  numero: '36.13',
  titulo: 'Negativa u obstrucción a inspecciones y controles reglamentarios (grave)',
  texto:
    'Tipifica como infracción grave la negativa de acceso o la obstrucción deliberada de las ' +
    'inspecciones o controles reglamentarios establecidos por la autoridad competente en fábricas, ' +
    'locales, establecimientos, embarcaciones y aeronaves (por ejemplo, controles de armas, explosivos, ' +
    'pirotecnia o seguridad privada). Resumen orientativo; consúltese el texto consolidado en el BOE.',
});

const ART_LOSC_36_15 = articuloLosc({
  numero: '36.15',
  titulo: 'Falta de colaboración con las Fuerzas y Cuerpos de Seguridad (grave)',
  texto:
    'Tipifica como infracción grave la falta de colaboración con las Fuerzas y Cuerpos de Seguridad en ' +
    'la averiguación de delitos o en la prevención de acciones que puedan poner en riesgo la seguridad ' +
    'ciudadana en los supuestos previstos en el art. 7 (deber de colaboración) de la propia LO 4/2015. ' +
    'No obliga a declarar contra uno mismo ni sustituye el deber de denunciar. Resumen orientativo; ' +
    'consúltese el texto consolidado en el BOE.',
});

const ART_LOSC_36_17 = articuloLosc({
  numero: '36.17',
  titulo: 'Traslado de personas para facilitar el acceso al consumo de drogas (grave)',
  texto:
    'Tipifica como infracción grave el traslado de personas, con cualquier tipo de vehículo, con el ' +
    'objeto de facilitarles el acceso al consumo de drogas tóxicas, estupefacientes o sustancias ' +
    'psicotrópicas, siempre que la conducta no sea constitutiva de delito. Resumen orientativo; ' +
    'consúltese el texto consolidado en el BOE.',
});

const ART_LOSC_36_18 = articuloLosc({
  numero: '36.18',
  titulo: 'Plantación y cultivo de drogas en lugares visibles al público (grave)',
  texto:
    'Tipifica como infracción grave la ejecución de actos de plantación y cultivo ilícitos de drogas ' +
    'tóxicas, estupefacientes o sustancias psicotrópicas en lugares visibles al público, cuando no sean ' +
    'constitutivos de infracción penal. Caso típico: macetas de marihuana visibles en balcones, ' +
    'terrazas o ventanas. Resumen orientativo; consúltese el texto consolidado en el BOE.',
});

const ART_LOSC_36_21 = articuloLosc({
  numero: '36.21',
  titulo: 'Alegación de datos falsos para obtener documentación oficial (grave)',
  texto:
    'Tipifica como infracción grave la alegación de datos o circunstancias falsos para la obtención de ' +
    'las documentaciones previstas en la LO 4/2015 (por ejemplo, licencias, autorizaciones o permisos), ' +
    'siempre que la conducta no sea constitutiva de infracción penal. Se distingue del art. 36.6 (datos ' +
    'falsos en el proceso de IDENTIFICACIÓN). Resumen orientativo; consúltese el texto consolidado en el BOE.',
});

const ART_LOSC_37_2 = articuloLosc({
  numero: '37.2',
  titulo: 'Exhibición de objetos peligrosos con ánimo intimidatorio (leve)',
  texto:
    'Tipifica como infracción leve la exhibición de objetos peligrosos para la vida y la integridad ' +
    'física de las personas con ánimo intimidatorio, siempre que la conducta no sea constitutiva de ' +
    'delito ni de infracción grave (en particular, la de armas del art. 36.10). Resumen orientativo; ' +
    'consúltese el texto consolidado en el BOE.',
});

const ART_LOSC_37_3 = articuloLosc({
  numero: '37.3',
  titulo: 'Incumplimiento de restricciones de circulación en actos o manifestaciones (leve)',
  texto:
    'Tipifica como infracción leve el incumplimiento de las restricciones de circulación peatonal o ' +
    'itinerario con ocasión de un acto público, reunión o manifestación, cuando provoquen alteraciones ' +
    'menores en el normal desarrollo de los mismos. Resumen orientativo; consúltese el texto ' +
    'consolidado en el BOE.',
});

const ART_LOSC_37_5 = articuloLosc({
  numero: '37.5',
  titulo: 'Actos de exhibición obscena o contra la indemnidad sexual (leve)',
  texto:
    'Tipifica como infracción leve la realización o incitación a la realización de actos que atenten ' +
    'contra la libertad e indemnidad sexual, o la ejecución de actos de exhibición obscena, cuando no ' +
    'constituyan infracción penal (frontera con el delito de exhibicionismo del art. 185 CP). Resumen ' +
    'orientativo; consúltese el texto consolidado en el BOE.',
});

const ART_LOSC_37_15 = articuloLosc({
  numero: '37.15',
  titulo: 'Remoción de vallas o precintos de un perímetro de seguridad (leve)',
  texto:
    'Tipifica como infracción leve la remoción de vallas, encintados u otros elementos fijos o móviles ' +
    'colocados por las Fuerzas y Cuerpos de Seguridad para delimitar perímetros de seguridad, aun con ' +
    'carácter preventivo, cuando no sea constitutiva de infracción grave. Resumen orientativo; ' +
    'consúltese el texto consolidado en el BOE.',
});

const ART_LOSC_37_16 = articuloLosc({
  numero: '37.16',
  titulo: 'Dejar sueltos animales peligrosos o abandonar animales con peligro (leve)',
  texto:
    'Tipifica como infracción leve dejar sueltos o en disposición de causar daños a animales feroces o ' +
    'dañinos, así como el abandono de animales domésticos en condiciones en que pueda peligrar su vida. ' +
    'Es el tipo de SEGURIDAD CIUDADANA (LO 4/2015), distinto del régimen de bienestar animal (Ley ' +
    '7/2023), de los animales potencialmente peligrosos (Ley 50/1999) y de las ordenanzas municipales; ' +
    'pueden concurrir. Resumen orientativo; consúltese el texto consolidado en el BOE.',
});

// --- Artículos de la 5ª ola (paridad SPPLB): huecos firmes de los arts. 35, 36 y 37 LO 4/2015 --
// Numeración COTEJADA contra el BOE consolidado (BOE-A-2015-3442, 2026-09-14). Textos redactados por
// nosotros (resúmenes neutros, no copiados). Todo el contenido queda `pendiente_revision`.
const ART_LOSC_35_1 = articuloLosc({
  numero: '35.1',
  titulo:
    'Reuniones o manifestaciones no comunicadas en infraestructuras de servicios básicos con riesgo (muy grave)',
  texto:
    'Tipifica como infracción MUY GRAVE las reuniones o manifestaciones no comunicadas o prohibidas ' +
    'en infraestructuras o instalaciones en las que se prestan servicios básicos para la comunidad o ' +
    'en sus inmediaciones, así como la intrusión en sus recintos, incluyendo su sobrevuelo, cuando en ' +
    'cualquiera de estos casos se haya generado un RIESGO para la vida o la integridad física de las ' +
    'personas. Se distingue del art. 36.9 (intrusión con interferencia grave en el funcionamiento, ' +
    'pero sin ese riesgo para las personas, grave). Resumen orientativo; consúltese el texto ' +
    'consolidado en el BOE.',
});

const ART_LOSC_35_2 = articuloLosc({
  numero: '35.2',
  titulo: 'Armas, explosivos, cartuchería o pirotecnia sin autorización con perjuicios muy graves (muy grave)',
  texto:
    'Tipifica como infracción MUY GRAVE la fabricación, reparación, almacenamiento, circulación, ' +
    'comercio, transporte, distribución, adquisición, certificación, enajenación o utilización de ' +
    'armas reglamentadas o explosivos catalogados, cartuchería o artículos pirotécnicos, incumpliendo ' +
    'la normativa de aplicación, careciendo de la documentación o autorización requeridas o excediendo ' +
    'los límites autorizados, cuando se hayan generado PERJUICIOS MUY GRAVES, siempre que la conducta ' +
    'no sea constitutiva de delito. Es la versión MUY GRAVE de la misma conducta del art. 36.12 ' +
    '(grave). La obligación material la detallan el Reglamento de Armas (RD 137/1993) y la normativa ' +
    'de explosivos y pirotecnia. FRONTERA PENAL: depósito o tráfico de armas o explosivos (arts. 566 a ' +
    '568 CP). Resumen orientativo; consúltese el texto consolidado en el BOE.',
});

const ART_LOSC_36_20 = articuloLosc({
  numero: '36.20',
  titulo: 'Carencia de los registros obligatorios u omisión de comunicaciones (grave)',
  texto:
    'Tipifica como infracción GRAVE la carencia de los registros previstos en la LO 4/2015 para las ' +
    'actividades con trascendencia para la seguridad ciudadana (por ejemplo, el libro-registro de ' +
    'hospedaje, el de compraventa de objetos usados, joyería o metales preciosos, o los de armerías y ' +
    'otras actividades reglamentadas), o la omisión de las comunicaciones obligatorias a las ' +
    'autoridades. Se distingue del art. 37.9 (irregularidades en la cumplimentación de esos registros, ' +
    'leve). Resumen orientativo; consúltese el texto consolidado en el BOE.',
});

const ART_LOSC_37_9 = articuloLosc({
  numero: '37.9',
  titulo: 'Irregularidades en la cumplimentación de registros con trascendencia para la seguridad (leve)',
  texto:
    'Tipifica como infracción LEVE las irregularidades en la cumplimentación de los registros previstos ' +
    'en la LO 4/2015 con trascendencia para la seguridad ciudadana, incluyendo la alegación de datos o ' +
    'circunstancias falsos o la omisión de comunicaciones obligatorias dentro de los plazos ' +
    'establecidos, siempre que no constituya infracción penal. Es la versión LEVE (defecto formal) ' +
    'frente a la carencia total del registro del art. 36.20 (grave). Resumen orientativo; consúltese el BOE.',
});

const ART_LOSC_37_10 = articuloLosc({
  numero: '37.10',
  titulo: 'Incumplir la obligación de obtener la documentación personal exigida (leve)',
  texto:
    'Tipifica como infracción LEVE el incumplimiento de la obligación de obtener la documentación ' +
    'personal legalmente exigida (por ejemplo, el DNI, obligatorio a partir de los 14 años, RD 1553/2005 ' +
    'art. 1), así como la ' +
    'omisión negligente de la denuncia de su sustracción o extravío. OJO: no sanciona el mero hecho de ' +
    'NO LLEVAR ENCIMA el documento (eso se resuelve identificándose por otros medios, art. 16), sino no ' +
    'obtenerlo teniendo la obligación de tenerlo. Resumen orientativo; consúltese el texto consolidado en el BOE.',
});

const ART_LOSC_37_11 = articuloLosc({
  numero: '37.11',
  titulo: 'Negligencia en la custodia de la documentación personal (tercera pérdida en un año) (leve)',
  texto:
    'Tipifica como infracción LEVE la negligencia en la custodia y conservación de la documentación ' +
    'personal legalmente exigida, considerándose como tal la TERCERA y posteriores pérdidas o extravíos ' +
    'en el plazo de un año. Resumen orientativo; consúltese el texto consolidado en el BOE.',
});

const ART_LOSC_37_12 = articuloLosc({
  numero: '37.12',
  titulo: 'Negativa a entregar la documentación personal cuya retirada se ha acordado (leve)',
  texto:
    'Tipifica como infracción LEVE la negativa a entregar la documentación personal legalmente exigida ' +
    'cuando se hubiese acordado su retirada o retención por la autoridad competente. Resumen ' +
    'orientativo; consúltese el texto consolidado en el BOE.',
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
  ART_LOSC_37_8,
  ART_LOSC_37_17,
  ART_LOSC_36_12,
  ART_LOPJM_MENA,
  ART_LOPJM_REGIMEN_MENOR,
  // 3ª ola (paridad SPPLB)
  ART_LOSC_35_3,
  ART_LOSC_35_4,
  ART_LOSC_36_5,
  ART_LOSC_36_7,
  ART_LOSC_36_8,
  ART_LOSC_36_9,
  ART_LOSC_36_11,
  ART_LOSC_36_14,
  ART_LOSC_36_19,
  ART_LOSC_37_6,
  ART_LOSC_37_13,
  ART_LOSC_37_14,
  // 4ª ola (paridad SPPLB)
  ART_LOSC_36_2,
  ART_LOSC_36_4,
  ART_LOSC_36_13,
  ART_LOSC_36_15,
  ART_LOSC_36_17,
  ART_LOSC_36_18,
  ART_LOSC_36_21,
  ART_LOSC_37_2,
  ART_LOSC_37_3,
  ART_LOSC_37_5,
  ART_LOSC_37_15,
  ART_LOSC_37_16,
  // 5ª ola (paridad SPPLB)
  ART_LOSC_35_1,
  ART_LOSC_35_2,
  ART_LOSC_36_20,
  ART_LOSC_37_9,
  ART_LOSC_37_10,
  ART_LOSC_37_11,
  ART_LOSC_37_12,
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

const NOTA_MUY_GRAVE_IMPORTE =
  'A VERIFICAR el importe: la LO 4/2015 sanciona las infracciones MUY GRAVES con una horquilla de ' +
  '30.001 a 600.000 € (art. 39). El seed fija el extremo inferior (30.001 €) como referencia ' +
  'conservadora; el importe efectivo lo gradúa la autoridad según las circunstancias del art. 33. ' +
  'IMPORTANTE: el pronto pago del art. 54 NO se aplica a las MUY GRAVES (solo a graves y leves), por ' +
  'lo que la ficha no lleva importe reducido.';

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
      // Añadidos de calle (validador 2026-09).
      'identificar a un tio',
      'identificar a un sospechoso',
      'tomar los datos',
      'pedir papeles a alguien',
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
      // Añadidos de calle (validador 2026-09). Con violencia/intimidación → atentado (550 CP).
      'se pone chulo',
      'chulearse con la policia',
      'plantar cara',
      'hace lo que le da la gana',
      'se encara con el agente',
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
      // Añadidos de calle (validador 2026-09). Indicios de TRÁFICO (papelinas, balanza) → 368 CP.
      'fumando un peta',
      'un peta',
      'un canuto',
      'piti de maria',
      'chocolate',
      'colocandose en la calle',
      'lleva un par de porros',
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
      // Añadidos de calle (validador 2026-09). Navaja pequeña de uso común puede NO ser prohibida;
      // armas de fuego/simuladas → fichas de armas o penal (563/564 CP).
      'una navaja',
      'llevaba una navaja',
      'la defensa',
      'spray pimienta',
      'spray de pimienta',
      'navaja mariposa',
      'puñal',
      'machete',
      'kubotan',
      'estrella ninja',
      'shuriken',
      'taser',
    ],
    consecuencias: [
      {
        tipo: 'decomiso',
        textoCorto:
          'Procede valorar la intervención (aprehensión) del arma y su puesta a disposición de la ' +
          'autoridad competente.',
        fuente: 'LO 4/2015 art. 39.2 (comiso)',
      },
    ],
    notaRevision:
      NOTA_GRAVE_IMPORTE +
      ' A VERIFICAR qué armas son "prohibidas" (remisión al Reglamento de Armas, RD 137/1993, art. ' +
      '4) y la frontera con el delito de tenencia ilícita de armas (arts. 563 y ss. CP). Confirmar ' +
      'el artículo del comiso del arma. Revisar con el revisor jurídico.',
  }),
  // --- OLA DE ARMAS (RD 137/1993 como obligación material; sanción LO 4/2015 arts. 36/37) --------
  // Rellena la sección "Armas" (paridad SPPLB), hoy casi vacía. La sanción vive en la LOSC (la LO
  // 1/1992 quedó derogada); el RD 137/1993 detalla la obligación. Frontera penal orientada por ficha.
  construirInfraccion({
    id: 'arma-sin-licencia-guia',
    articulo: ART_LOSC_36_12,
    tituloCorto: 'Arma reglamentada sin licencia o guía',
    gravedad: 'grave',
    importeEur: 601,
    importeReducidoEur: 300.5,
    textoBoletin:
      'Tener o usar un arma reglamentada careciendo de la licencia (licencias A-F) o de la guía de ' +
      'pertenencia exigidas, incumpliendo la normativa de armas, cuando la conducta no sea constitutiva ' +
      'de delito (art. 36.12 LO 4/2015; obligación de los arts. 96 y ss. y 31 y ss. del Reglamento de ' +
      'Armas, RD 137/1993). FRONTERA PENAL: la tenencia de un ARMA DE FUEGO reglamentada sin licencia/guía ' +
      'es, con carácter general, DELITO de tenencia ilícita (art. 564 CP), no infracción administrativa; ' +
      'la vía del 36.12 queda para armas no de fuego, inutilizadas o excesos documentales sobre arma ' +
      'legalmente tenida. La calificación penal o administrativa la decide la autoridad judicial.',
    terminos: [
      'arma sin papeles',
      'pistola sin licencia',
      'escopeta sin guia',
      'escopeta del abuelo',
      'arma heredada sin papeles',
      'el arma no esta a su nombre',
      'no tiene licencia de armas',
      'arma sin documentacion',
      'revolver sin permiso',
      'llevar pistola sin licencia',
      'cazar sin licencia de armas',
    ],
    consecuencias: [
      {
        tipo: 'decomiso',
        textoCorto:
          'Procede valorar la intervención (aprehensión) del arma y su puesta a disposición de la ' +
          'autoridad competente (Intervención de Armas de la Guardia Civil).',
        fuente: 'LO 4/2015 art. 39.2 (comiso)',
      },
    ],
    notaRevision:
      NOTA_GRAVE_IMPORTE +
      ' Punto SENSIBLE a verificar: el deslinde entre el art. 36.12 LO 4/2015 (administrativo) y el ' +
      'delito de tenencia ilícita del art. 564 CP según el tipo de arma y su APTITUD para el disparo ' +
      '(un arma inservible puede no contar como arma de fuego a efectos del 564). El art. 565 CP es OTRA ' +
      'cosa: permite al tribunal rebajar la pena un grado cuando se evidencie la falta de INTENCIÓN de ' +
      'usar el arma con fines ilícitos. Confirmar los artículos de licencias (96 y ss.) y ' +
      'guía (31 y ss.) del RD 137/1993, que la reforma del reglamento pudo reordenar. Revisar con el ' +
      'revisor jurídico antes de publicar.',
  }),
  construirInfraccion({
    id: 'arma-licencia-guia-caducada',
    articulo: ART_LOSC_36_12,
    tituloCorto: 'Licencia o guía de armas caducada',
    gravedad: 'grave',
    importeEur: 601,
    importeReducidoEur: 300.5,
    textoBoletin:
      'Mantener un arma reglamentada con la licencia o la guía de pertenencia caducada o sin renovar, ' +
      'excediendo los límites autorizados o careciendo de la documentación en vigor (art. 36.12 LO ' +
      '4/2015; el deber de vigencia y renovación de la licencia y de la guía de pertenencia lo fija el ' +
      'RD 137/1993, artículo concreto a verificar). FRONTERA PENAL (materia controvertida): la mera caducidad reciente sobre un arma ' +
      'legalmente adquirida suele reconducirse a la vía administrativa; la falta total o la no ' +
      'renovación prolongada puede derivar en tenencia ilícita (art. 564 CP). Orientativo: valorar el ' +
      'tiempo de caducidad y las circunstancias; la calificación la fija la autoridad judicial.',
    terminos: [
      'licencia caducada',
      'guia caducada',
      'permiso de armas vencido',
      'no renovo la licencia',
      'licencia de armas sin renovar',
      'arma con licencia vencida',
      'caducado el permiso de la escopeta',
    ],
    consecuencias: [
      {
        tipo: 'decomiso',
        textoCorto:
          'Procede valorar la intervención cautelar del arma y su depósito a disposición de la ' +
          'autoridad competente hasta regularizar la documentación (Intervención de Armas de la GC).',
        fuente: 'LO 4/2015 art. 39.2 (comiso)',
      },
    ],
    notaRevision:
      NOTA_GRAVE_IMPORTE +
      ' Dato SENSIBLE: NO afirmar automáticamente que "caducada = delito". A verificar el criterio ' +
      'jurisprudencial (TS) sobre la caducidad de la licencia/guía (36.12 LO 4/2015 vs. 564 CP) y los ' +
      'plazos de vigencia y renovación por tipo de licencia del RD 137/1993. Revisar con el revisor.',
  }),
  construirInfraccion({
    id: 'arma-portar-fuera-supuestos',
    articulo: ART_LOSC_36_10,
    tituloCorto: 'Portar el arma fuera de los supuestos permitidos',
    gravedad: 'grave',
    importeEur: 601,
    importeReducidoEur: 300.5,
    textoBoletin:
      'Portar o usar un arma fuera de los lugares habilitados para su uso, aun teniendo licencia, o de ' +
      'modo negligente, temerario o intimidatorio, cuando la conducta no sea constitutiva de delito ' +
      '(art. 36.10 LO 4/2015; condiciones de uso y porte de los arts. 145 y ss. del RD 137/1993). ' +
      'FRONTERA PENAL: pasa a la vía penal si concurre uso con relevancia típica (amenazas, arts. 169 y ' +
      'ss. CP; atentado, art. 550 CP) o si se une a tenencia ilícita (art. 564 CP). Orientativo.',
    terminos: [
      'llevar la pistola por la calle',
      'sacar el arma sin motivo',
      'porta el arma fuera del coto',
      'arma fuera de casa',
      'llevar arma de caza por la ciudad',
      'exhibir la pistola',
      'ir armado por la calle',
      'portar arma sin razon',
    ],
    consecuencias: [
      {
        tipo: 'decomiso',
        textoCorto:
          'Procede valorar la intervención (aprehensión) del arma y su puesta a disposición de la ' +
          'autoridad competente.',
        fuente: 'LO 4/2015 art. 39.2 (comiso)',
      },
    ],
    notaRevision:
      NOTA_GRAVE_IMPORTE +
      ' Comparte artículo (36.10) con `sc-armas-prohibidas` pero es OTRA conducta (arma con licencia ' +
      'fuera de lugar habilitado, no arma prohibida). A verificar los arts. 145 y ss. del RD 137/1993 ' +
      '(lugares habilitados y supuestos de porte por tipo de licencia) y la frontera con amenazas/' +
      'atentado. Revisar con el revisor jurídico.',
  }),
  construirInfraccion({
    id: 'arma-transporte-indebido',
    articulo: ART_LOSC_36_12,
    tituloCorto: 'Transporte indebido de arma',
    gravedad: 'grave',
    importeEur: 601,
    importeReducidoEur: 300.5,
    textoBoletin:
      'Transportar un arma reglamentada incumpliendo la normativa de aplicación —sin ir descargada, ' +
      'enfundada y separada de la munición— cuando la conducta no sea constitutiva de delito (art. ' +
      '36.12 LO 4/2015; condiciones de transporte de los arts. 145 y ss. del RD 137/1993). FRONTERA ' +
      'PENAL: con carácter general es administrativa; la vía penal se reserva a la tenencia ilícita ' +
      '(art. 564 CP) o al depósito/tráfico (arts. 566-568 CP) si aparecen esos elementos. Orientativo.',
    terminos: [
      'arma cargada en el coche',
      'escopeta sin funda',
      'escopeta en el asiento',
      'volviendo de cazar',
      'arma junto a la municion',
      'llevar el arma cargada',
      'transportar el rifle mal',
      'arma en la guantera',
      'pistola cargada en el maletero',
    ],
    consecuencias: [
      {
        tipo: 'decomiso',
        textoCorto:
          'Procede valorar la intervención cautelar del arma y su puesta a disposición de la ' +
          'autoridad competente (Intervención de Armas de la Guardia Civil).',
        fuente: 'LO 4/2015 art. 39.2 (comiso)',
      },
    ],
    notaRevision:
      NOTA_GRAVE_IMPORTE +
      ' A verificar los arts. 145 y ss. del RD 137/1993 (requisitos exactos del transporte: descargada, ' +
      'enfundada y separada de la munición) y si algún supuesto menor encajaría como leve. Revisar con ' +
      'el revisor jurídico.',
  }),
  construirInfraccion({
    id: 'arma-fogueo-aire-replica',
    articulo: ART_LOSC_36_12,
    tituloCorto: 'Fogueo, aire comprimido o réplica sin requisitos',
    gravedad: 'grave',
    importeEur: 601,
    importeReducidoEur: 300.5,
    textoBoletin:
      'Tener o usar armas de aire comprimido, detonadoras o de fogueo reglamentadas sin la documentación ' +
      'o excediendo los límites autorizados, incumpliendo la normativa de armas (art. 36.12 LO 4/2015; ' +
      'categorías del art. 3 del RD 137/1993). FRONTERA PENAL: si la réplica, el fogueo o la detonadora ' +
      'se han MODIFICADO para disparar proyectil, dejan de ser réplica y pasan a arma prohibida/ilícita ' +
      '(art. 563 CP). El uso de un arma simulada en un robo o amenaza se valora en el delito principal ' +
      '(arts. 169, 237 y ss. CP), no aquí. Orientativo.',
    terminos: [
      'pistola de fogueo',
      'arma detonadora',
      'replica de pistola',
      'pistola de aire comprimido',
      'arma de balines',
      'airsoft',
      'pistola de juguete que parece real',
      'carabina de perdigones',
    ],
    consecuencias: [
      {
        tipo: 'decomiso',
        textoCorto:
          'Procede valorar la intervención del arma o réplica y su puesta a disposición de la ' +
          'autoridad competente para su examen.',
        fuente: 'LO 4/2015 art. 39.2 (comiso)',
      },
    ],
    notaRevision:
      NOTA_GRAVE_IMPORTE +
      ' Dato SENSIBLE: no calificar toda réplica como arma prohibida. A verificar las categorías del ' +
      'art. 3 del RD 137/1993 (4ª aire comprimido; detonadoras/fogueo), que las reformas del reglamento ' +
      'han reordenado, y el deslinde con el delito del art. 563 CP (arma modificada para disparar). ' +
      'Revisar con el revisor jurídico.',
  }),
  construirInfraccion({
    id: 'arma-custodia-deposito',
    articulo: ART_LOSC_36_12,
    tituloCorto: 'Omisión del deber de custodia del arma',
    gravedad: 'grave',
    importeEur: 601,
    importeReducidoEur: 300.5,
    textoBoletin:
      'Omitir, o aplicar de forma insuficiente, las medidas de seguridad obligatorias para la ' +
      'conservación y custodia de un arma reglamentada en el domicilio (art. 36.12 LO 4/2015; ' +
      'condiciones de conservación de los arts. 105 y ss. del RD 137/1993). Puede escalar a MUY GRAVE ' +
      '(art. 35.2 LO 4/2015) solo si se causan perjuicios muy graves. FRONTERA PENAL: normalmente ' +
      'administrativa; hay vía penal si de la falta de custodia deriva un resultado típico (homicidio o ' +
      'lesiones imprudentes, arts. 142/152 CP) o concurre depósito ilícito (arts. 566-568 CP). Orientativo.',
    terminos: [
      'arma sin guardar',
      'escopeta al alcance de los niños',
      'no tiene armero',
      'arma fuera de la caja fuerte',
      'pistola en el cajon',
      'no guarda bien el arma',
      'arma sin custodia',
      'dejar el arma cargada en casa',
    ],
    consecuencias: [
      {
        tipo: 'decomiso',
        textoCorto:
          'Procede valorar la intervención cautelar del arma cuando su custodia entrañe riesgo, ' +
          'poniéndola a disposición de la autoridad competente.',
        fuente: 'LO 4/2015 art. 39.2 (comiso)',
      },
    ],
    notaRevision:
      NOTA_GRAVE_IMPORTE +
      ' Dato SENSIBLE: por defecto GRAVE (36.12), no muy grave; el salto al art. 35.2 (muy grave) exige ' +
      '"perjuicios muy graves". A verificar los arts. 105 y ss. del RD 137/1993 (obligación de armero/' +
      'condiciones de seguridad). Revisar con el revisor jurídico.',
  }),
  construirInfraccion({
    id: 'arma-documentacion-perdida',
    articulo: ART_LOSC_37_8,
    tituloCorto: 'No conservar o no denunciar la pérdida de la documentación del arma',
    gravedad: 'leve',
    importeEur: 100,
    importeReducidoEur: 50,
    textoBoletin:
      'No conservar debidamente la DOCUMENTACIÓN de un arma (licencia, guía), o no denunciar su ' +
      'pérdida o sustracción (art. 37.8 LO 4/2015; el deber y la forma de comunicar el extravío de la ' +
      'documentación a la Intervención de Armas se desarrolla en el RD 137/1993, artículo concreto a ' +
      'verificar). Es infracción LEVE. IMPORTANTE: el 37.8 se refiere ' +
      'a la DOCUMENTACIÓN, no al arma en sí. Si lo perdido o sustraído es el ARMA, la conducta se ' +
      'valora por la vía de la custodia (art. 36.12) o, si hay indicios de destino ilícito a terceros, ' +
      'por los tipos penales de depósito/tráfico (arts. 566-568 CP). Orientativo.',
    terminos: [
      'perdio la licencia de armas',
      'extravio de la guia',
      'papeles del arma perdidos',
      'perdi la documentacion del arma',
      'no denuncio la perdida de la licencia',
      'licencia de armas extraviada',
      'perdida de la guia de pertenencia',
    ],
    notaRevision:
      NOTA_LEVE_IMPORTE +
      ' ACOTADO tras revisión: el literal del art. 37.8 LO 4/2015 cubre solo la DOCUMENTACIÓN de armas ' +
      'y explosivos (su conservación y la denuncia de su pérdida/sustracción), NO la pérdida/sustracción ' +
      'del arma —que va por el 36.12 (custodia) o la vía penal (566-568 CP)—. A verificar el precepto ' +
      'del RD 137/1993 que fija el plazo y la forma de comunicar el extravío. Revisar con el revisor.',
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
      // Añadidos de calle (validador 2026-09). Pelea con heridos → lesiones (147/148 CP).
      'una pelea',
      'se estan pegando',
      'una movida',
      'un follon en la calle',
      'tangana',
      'tanganas',
      'bronca',
      'gresca',
      'riña',
      'lio en la puerta del bar',
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
      // Añadidos de calle (validador 2026-09).
      'me insulto',
      'me falto',
      'me llamo de todo',
      'me vacilo',
      'vacilar al agente',
      'me llamo madero',
      'gestos despectivos',
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
      'menor no acompañado',
      'menor sin familia',
      'menor migrante solo',
      'menor solo',
      'menor sin papeles',
      'menor desaparecido',
      'menor fugado',
      'fuga de centro',
      'fugado del centro',
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
  // ENTRADA CONSULTABLE (no sancionadora): RÉGIMEN DEL MENOR INFRACTOR. NO es un tipo sancionador:
  // orienta la actuación con un menor que comete un hecho (inimputable < 14; régimen del menor 14-17
  // con garantías del art. 17 LO 5/2000). Existe sobre todo para CAPTURAR la búsqueda de calle:
  // "detener a un menor", "menor robando", "menor de 16", "es menor"... y llevar a la orientación
  // correcta y a la guía de menores. Se modela `no_sancionador` (sin importe), como MENA.
  construirInfraccion({
    id: 'sc-menor-regimen',
    articulo: ART_LOPJM_REGIMEN_MENOR,
    tituloCorto: 'Menor infractor: inimputable (< 14) y régimen del menor (14-17)',
    gravedad: 'leve', // valor de relleno exigido por el modelo; lo determinante es que NO sanciona
    marcoImporte: 'no_sancionador',
    importeEur: null,
    importeReducidoEur: null,
    textoBoletin:
      'Actuación con un MENOR que comete un hecho. Lo primero es la EDAD. MENOR DE 14 AÑOS: penalmente ' +
      'INIMPUTABLE (arts. 1.1 y 3 LO 5/2000); no cabe detención penal. ORIENTACIÓN: identificar con ' +
      'cautelas de menor, entregar a los representantes legales o, en su defecto, poner a disposición ' +
      'de la Entidad Pública de protección de menores, y comunicar al Ministerio Fiscal (art. 3 LO ' +
      '5/2000, en relación con la LO 1/1996). DE 14 A 17 AÑOS: responde penalmente por la LO 5/2000 (no ' +
      'por el régimen de adultos): interviene el Ministerio Fiscal de Menores, no el juzgado de ' +
      'instrucción ordinario. Si se detiene: la detención policial no puede exceder de 24 HORAS y, ' +
      'dentro de ese plazo, el menor se pone en libertad o a disposición del Ministerio Fiscal (art. ' +
      '17.4); el Fiscal resuelve dentro de las 48 horas siguientes a la detención (art. 17.5). Custodia ' +
      'en dependencias ADECUADAS y SEPARADAS de las de los mayores (art. 17.3): NO procede el calabozo ' +
      'común. Información inmediata de hechos y derechos y notificación a representantes legales y al ' +
      'Ministerio Fiscal de Menores (art. 17.1). Si es extranjero, comunicación a las autoridades ' +
      'consulares (art. 520.2 LECrim, aplicable por el régimen de garantías del art. 17 LO 5/2000). La ' +
      'entrega se cierra con acta de ' +
      'entrega; si los padres o tutores no se hacen cargo, puesta a disposición de la Entidad Pública ' +
      'de protección. La valoración final corresponde al agente, al Ministerio Fiscal de Menores y, en ' +
      'su caso, a la autoridad judicial.',
    terminos: [
      'menor',
      'es menor',
      'menor de edad',
      'menor infractor',
      'detener a un menor',
      'menor detenido',
      'calabozo menor',
      'custodia menor',
      'menor robando',
      'menor hurto',
      'menor mangando',
      'menor pelea',
      'menor vandalismo',
      'menor de 14',
      'menor de 16',
      'inimputable',
      'responsabilidad penal del menor',
      'regimen del menor',
      'entregar menor a los padres',
    ],
    consecuencias: [
      {
        tipo: 'proteccion',
        textoCorto:
          'Menor < 14: inimputable, entrega a representantes legales/Entidad de Protección y ' +
          'comunicación al Fiscal (art. 3 LO 5/2000). Menor 14-17: responde por la LO 5/2000; si se ' +
          'detiene, máx. 24 h y a disposición del Fiscal (art. 17.4), custodia separada (art. 17.3), ' +
          'nunca calabozo común. La valoración final es del agente y del Fiscal de Menores.',
        fuente: 'LO 5/2000 arts. 1.1, 3 y 17; LO 1/1996',
      },
    ],
    notaRevision:
      'ENTRADA CONSULTABLE, no infracción: orienta la actuación con un menor infractor (marco ' +
      '`no_sancionador`, sin importe). Contenido COTEJADO por el revisor jurídico (2026-09) contra el ' +
      'BOE consolidado de la LO 5/2000: inimputabilidad < 14 (arts. 1.1 y 3); régimen 14-17 con ' +
      'detención máx. 24 h (art. 17.4) y resolución del Fiscal en 48 h (art. 17.5), custodia separada ' +
      '(art. 17.3), información/notificación (art. 17.1) y aviso consular (art. 520.2 LECrim por ' +
      'remisión del 17.1). Reespejo de la guía de menores. Queda pendiente_revision: a verificar la ' +
      'redacción final con el cofundador agente antes de publicar (nada se autopublica).',
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
  // --- 3ª OLA (paridad SPPLB): huecos de los arts. 35, 36 y 37 LO 4/2015 -----------------------
  // Conductas de calle frecuentes que faltaban. Numeración de apartados COTEJADA contra el BOE
  // consolidado (2026-09). Todo `pendiente_revision`; nada se autopublica.
  construirInfraccion({
    id: 'sc-negativa-disolver-reunion',
    articulo: ART_LOSC_36_7,
    tituloCorto: 'Negativa a disolver una reunión o manifestación',
    gravedad: 'grave',
    importeEur: 601,
    importeReducidoEur: 300.5,
    textoBoletin:
      'Negarse a la disolución de una reunión o manifestación en lugar de tránsito público ordenada ' +
      'por la autoridad competente cuando concurran los supuestos del art. 5 de la LO 9/1983 (peligro ' +
      'para personas o bienes, uso de uniformes paramilitares, carácter ilícito conforme al Código ' +
      'Penal) (art. 36.7 LO 4/2015). La orden de disolución la da la autoridad; la mera asistencia no ' +
      'es infracción por sí sola.',
    terminos: [
      'no se disuelve la manifestacion',
      'negarse a disolver',
      'no desalojan la concentracion',
      'siguen manifestandose tras la orden',
      'no obedecen la orden de disolucion',
      'manifestacion que no se disuelve',
      'se niegan a marcharse',
    ],
    notaRevision:
      NOTA_GRAVE_IMPORTE +
      ' A VERIFICAR: la disolución exige que concurran los supuestos del art. 5 LO 9/1983 y una orden ' +
      'previa y clara de la autoridad; el derecho de reunión es fundamental (art. 21 CE). Distinguir ' +
      'de la perturbación de reunión lícita (36.8) y de la muy grave del art. 35.1 (infraestructuras ' +
      'críticas). Confirmar el encaje con el revisor jurídico.',
  }),
  construirInfraccion({
    id: 'sc-perturbar-reunion-licita',
    articulo: ART_LOSC_36_8,
    tituloCorto: 'Perturbar una reunión o manifestación lícita',
    gravedad: 'grave',
    importeEur: 601,
    importeReducidoEur: 300.5,
    textoBoletin:
      'Perturbar el desarrollo de una reunión o manifestación lícita, cuando la conducta no constituya ' +
      'infracción penal (art. 36.8 LO 4/2015). Protege el ejercicio pacífico del derecho de reunión ' +
      'frente a quien lo obstaculiza.',
    terminos: [
      'reventar una manifestacion',
      'boicotear una concentracion',
      'perturbar una manifestacion',
      'impedir una manifestacion legal',
      'grupo que ataca la manifestacion',
      'contramanifestacion violenta',
      'estropear un acto reivindicativo',
    ],
    notaRevision:
      NOTA_GRAVE_IMPORTE +
      ' A VERIFICAR la frontera con el delito (coacciones art. 172 CP; desórdenes art. 557 CP) y que ' +
      'la reunión perturbada sea LÍCITA. Confirmar el encaje con el revisor jurídico.',
  }),
  construirInfraccion({
    id: 'sc-obstruir-servicios-emergencia',
    articulo: ART_LOSC_36_5,
    tituloCorto: 'Obstaculizar a los servicios de emergencia',
    gravedad: 'grave',
    importeEur: 601,
    importeReducidoEur: 300.5,
    textoBoletin:
      'Impedir u obstaculizar, por acción u omisión, el funcionamiento de los servicios de emergencia ' +
      '(bomberos, sanitarios, protección civil, FCSE), provocando o incrementando un riesgo para la ' +
      'vida o la integridad de las personas o daños en los bienes, o agravando las consecuencias del ' +
      'suceso (art. 36.5 LO 4/2015).',
    terminos: [
      'impedir el paso a una ambulancia',
      'obstaculizar a los bomberos',
      'no dejar pasar a emergencias',
      'estorbar a los sanitarios',
      'bloquear el paso de una ambulancia',
      'molestar en un incendio',
      'entorpecer un rescate',
    ],
    notaRevision:
      NOTA_GRAVE_IMPORTE +
      ' A VERIFICAR la frontera con el delito (denegación de auxilio, atentado o desórdenes) y que ' +
      'concurra el riesgo o el agravamiento exigido por el tipo. Confirmar con el revisor jurídico.',
  }),
  construirInfraccion({
    id: 'sc-intrusion-infraestructuras',
    articulo: ART_LOSC_36_9,
    tituloCorto: 'Intrusión en infraestructuras de servicios básicos',
    gravedad: 'grave',
    importeEur: 601,
    importeReducidoEur: 300.5,
    textoBoletin:
      'Introducirse sin autorización en infraestructuras o instalaciones en las que se prestan ' +
      'servicios básicos para la comunidad (agua, energía, transporte, telecomunicaciones), incluido su ' +
      'sobrevuelo con drones, cuando se produzca una interferencia grave en su funcionamiento (art. ' +
      '36.9 LO 4/2015). Escala a MUY GRAVE (art. 35.1) si genera riesgo para la vida o la integridad.',
    terminos: [
      'colarse en una central electrica',
      'entrar en las vias del tren',
      'intrusion en una subestacion',
      'sobrevolar con dron una central',
      'meterse en una planta de agua',
      'acceso no autorizado a infraestructura critica',
      'dron sobre instalacion critica',
    ],
    notaRevision:
      NOTA_GRAVE_IMPORTE +
      ' A VERIFICAR el deslinde con la muy grave del art. 35.1 (riesgo para la vida/integridad) y con ' +
      'la normativa de drones (AESA) y de infraestructuras críticas (Ley 8/2011). Confirmar con el revisor.',
  }),
  construirInfraccion({
    id: 'sc-uso-indebido-uniforme',
    articulo: ART_LOSC_36_14,
    tituloCorto: 'Uso público indebido de uniforme o insignias oficiales',
    gravedad: 'grave',
    importeEur: 601,
    importeReducidoEur: 300.5,
    textoBoletin:
      'Usar en público e indebidamente uniformes, insignias o condecoraciones oficiales, o réplicas de ' +
      'los mismos, así como otros elementos del equipamiento de los cuerpos policiales o de los ' +
      'servicios de emergencia que puedan generar engaño acerca de la condición de quien los usa, ' +
      'cuando la conducta no sea constitutiva de delito (art. 36.14 LO 4/2015). FRONTERA PENAL: si se ' +
      'usa para atribuirse funciones públicas o cometer otro delito, puede ser usurpación de funciones ' +
      'o uso indebido de uniforme (arts. 402 y 402 bis CP). Orientativo.',
    terminos: [
      'hacerse pasar por policia',
      'uniforme de policia falso',
      'chaleco de policia sin serlo',
      'placa falsa de policia',
      'llevar equipacion policial sin ser agente',
      'disfraz de guardia civil para engañar',
      'insignias policiales falsas',
    ],
    consecuencias: [
      {
        tipo: 'decomiso',
        textoCorto:
          'Procede valorar la intervención (aprehensión) del uniforme, placa o equipamiento y su ' +
          'puesta a disposición de la autoridad competente.',
        fuente: 'LO 4/2015 art. 39.2 (comiso)',
      },
    ],
    notaRevision:
      NOTA_GRAVE_IMPORTE +
      ' A VERIFICAR la frontera con el delito de usurpación de funciones y uso público de uniforme ' +
      '(arts. 402 y 402 bis CP): si hay atribución de funciones o comisión de otro delito, es vía ' +
      'penal. Confirmar con el revisor jurídico.',
  }),
  construirInfraccion({
    id: 'sc-tolerancia-drogas-local',
    articulo: ART_LOSC_36_19,
    tituloCorto: 'Tolerar el consumo o tráfico de drogas en un local',
    gravedad: 'grave',
    importeEur: 601,
    importeReducidoEur: 300.5,
    textoBoletin:
      'Tolerar el consumo ilegal o el tráfico de drogas tóxicas, estupefacientes o sustancias ' +
      'psicotrópicas en locales o establecimientos públicos, o no actuar con la diligencia debida para ' +
      'impedirlo, siendo propietario, administrador o encargado del local (art. 36.19 LO 4/2015). La ' +
      'responsabilidad recae en el titular o responsable del establecimiento.',
    terminos: [
      'droga en la discoteca',
      'consienten drogas en el bar',
      'trapicheo en el local',
      'el dueño deja consumir droga',
      'droga en el after',
      'permiten drogas en el pub',
      'consumo de droga tolerado en el local',
    ],
    notaRevision:
      NOTA_GRAVE_IMPORTE +
      ' A VERIFICAR que el sujeto responsable sea el titular/encargado y la frontera con el delito ' +
      'contra la salud pública del art. 368 CP (favorecimiento del consumo). Confirmar con el revisor.',
  }),
  construirInfraccion({
    id: 'sc-servicios-sexuales-riesgo',
    articulo: ART_LOSC_36_11,
    tituloCorto: 'Demanda de servicios sexuales en zona de riesgo',
    gravedad: 'grave',
    importeEur: 601,
    importeReducidoEur: 300.5,
    textoBoletin:
      'Solicitar o aceptar, como demandante, servicios sexuales retribuidos en zonas de tránsito ' +
      'público próximas a lugares de uso por menores (centros educativos, parques infantiles o espacios ' +
      'de ocio para menores), o cuando la conducta, por el lugar en que se realice, pueda generar un ' +
      'riesgo para la seguridad vial (art. 36.11 LO 4/2015). Sanciona al DEMANDANTE.',
    terminos: [
      'prostitucion cerca de un colegio',
      'servicios sexuales junto a un parque infantil',
      'demanda de prostitucion en la via publica',
      'cliente de prostitucion con riesgo vial',
      'buscar prostitutas cerca de un colegio',
      'prostitucion en zona de menores',
      'pagar por sexo cerca de un parque infantil',
    ],
    notaRevision:
      NOTA_GRAVE_IMPORTE +
      ' A VERIFICAR: el tipo sanciona al DEMANDANTE y EXIGE proximidad a lugares de menores o riesgo ' +
      'para la seguridad vial; no cualquier demanda. Frontera con delitos relativos a la prostitución/' +
      'trata (arts. 187 y ss. CP) y con las ordenanzas municipales. Punto sensible: confirmar con el revisor.',
  }),
  construirInfraccion({
    id: 'sc-laser-conductores-pilotos',
    articulo: ART_LOSC_35_4,
    tituloCorto: 'Haz de luz o láser a conductores o pilotos',
    gravedad: 'muy_grave',
    importeEur: 30_001,
    importeReducidoEur: null,
    textoBoletin:
      'Proyectar haces de luz, con cualquier dispositivo (puntero láser incluido), sobre pilotos o ' +
      'conductores de medios de transporte de modo que pueda deslumbrarles o distraer su atención y ' +
      'provocar accidentes (art. 35.4 LO 4/2015). Es infracción MUY GRAVE. Se distingue del art. 37.6 ' +
      '(haces sobre agentes, leve). FRONTERA PENAL: si se pone en concreto peligro la vida (p. ej. láser ' +
      'a la cabina de un avión) puede ser delito contra la seguridad del tráfico o de estragos.',
    terminos: [
      'laser a un avion',
      'puntero laser a un piloto',
      'deslumbrar a un conductor con laser',
      'laser a la cabina del avion',
      'apuntar con laser a un tren',
      'laser a un helicoptero',
      'deslumbrar con laser al trafico',
    ],
    consecuencias: [
      {
        tipo: 'decomiso',
        textoCorto:
          'Procede valorar la intervención (aprehensión) del dispositivo láser y su puesta a ' +
          'disposición de la autoridad competente.',
        fuente: 'LO 4/2015 art. 39.2 (comiso)',
      },
    ],
    notaRevision:
      NOTA_MUY_GRAVE_IMPORTE +
      ' A VERIFICAR la frontera con el delito (peligro concreto para la aeronave/vehículo: arts. 385 ' +
      'bis y ss. CP y delitos contra la seguridad del tráfico) y el deslinde con el art. 37.6 (láser a ' +
      'agentes, leve). Confirmar con el revisor jurídico.',
  }),
  construirInfraccion({
    id: 'sc-espectaculo-prohibido',
    articulo: ART_LOSC_35_3,
    tituloCorto: 'Celebrar un espectáculo prohibido o suspendido',
    gravedad: 'muy_grave',
    importeEur: 30_001,
    importeReducidoEur: null,
    textoBoletin:
      'Celebrar espectáculos públicos o actividades recreativas quebrantando la prohibición o la ' +
      'suspensión ordenada por la autoridad competente por razones de seguridad pública (art. 35.3 LO ' +
      '4/2015). Es infracción MUY GRAVE. La responsabilidad recae en los organizadores o promotores. Se ' +
      'diferencia de los espectáculos deportivos, que tienen su régimen propio (Ley 19/2007).',
    terminos: [
      'fiesta ilegal prohibida',
      'rave prohibida',
      'concierto suspendido que sigue adelante',
      'evento prohibido por la autoridad',
      'macrofiesta clausurada que continua',
      'espectaculo prohibido por seguridad',
      'celebrar un evento suspendido',
    ],
    notaRevision:
      NOTA_MUY_GRAVE_IMPORTE +
      ' A VERIFICAR que exista una prohibición o suspensión previa y expresa de la autoridad por ' +
      'razones de SEGURIDAD PÚBLICA (no otro motivo) y el deslinde con las sanciones de espectáculos ' +
      'de la normativa autonómica. Confirmar con el revisor jurídico.',
  }),
  construirInfraccion({
    id: 'sc-danos-deslucimiento-bienes',
    articulo: ART_LOSC_37_13,
    tituloCorto: 'Daños o deslucimiento de bienes en la vía pública (pintadas)',
    gravedad: 'leve',
    importeEur: 100,
    importeReducidoEur: 50,
    textoBoletin:
      'Dañar o deslucir bienes muebles o inmuebles de uso o servicio público, o bienes privados ' +
      'situados en la vía pública (pintadas, grafitis, pegado de carteles, deterioro de mobiliario ' +
      'urbano), cuando la conducta no sea constitutiva de delito (art. 37.13 LO 4/2015). FRONTERA ' +
      'PENAL: los daños de cierta entidad son delito (art. 263 CP) y el deslucimiento de bienes de ' +
      'valor histórico/cultural es delito específico (art. 323 CP). Orientativo.',
    terminos: [
      'pintadas',
      'grafiti',
      'graffiti',
      'pintar una pared',
      'pegar carteles',
      'deslucir mobiliario urbano',
      'rayar un banco',
      'ensuciar la fachada',
      'vandalismo urbano leve',
    ],
    notaRevision:
      NOTA_LEVE_IMPORTE +
      ' A VERIFICAR la frontera con el delito de daños (art. 263 CP) y con el deslucimiento de bienes ' +
      'protegidos (art. 323 CP), según la entidad del daño y el tipo de bien. Muchas ordenanzas ' +
      'municipales sancionan también el grafiti/pintadas: comprobar concurrencia. Confirmar con el revisor.',
  }),
  construirInfraccion({
    id: 'sc-escalada-edificios',
    articulo: ART_LOSC_37_14,
    tituloCorto: 'Escalar edificios o monumentos sin autorización',
    gravedad: 'leve',
    importeEur: 100,
    importeReducidoEur: 50,
    textoBoletin:
      'Escalar o trepar a edificios o monumentos sin autorización cuando exista un riesgo cierto de que ' +
      'se ocasionen daños a las personas o a los bienes (art. 37.14 LO 4/2015). Típico del "urban ' +
      'climbing"/parkour en fachadas, grúas o monumentos.',
    terminos: [
      'trepar a un edificio',
      'escalar una fachada',
      'subirse a un monumento',
      'urban climbing',
      'trepar a una grua',
      'escalar sin permiso un edificio',
      'subirse a una estatua',
    ],
    notaRevision:
      NOTA_LEVE_IMPORTE +
      ' A VERIFICAR que concurra el "riesgo cierto" de daños a personas o bienes que exige el tipo (no ' +
      'basta la mera escalada). Frontera con daños o allanamiento según el caso. Confirmar con el revisor.',
  }),
  construirInfraccion({
    id: 'sc-laser-agentes',
    articulo: ART_LOSC_37_6,
    tituloCorto: 'Haz de luz o láser sobre agentes',
    gravedad: 'leve',
    importeEur: 100,
    importeReducidoEur: 50,
    textoBoletin:
      'Proyectar haces de luz, con cualquier dispositivo (puntero láser incluido), sobre miembros de ' +
      'las Fuerzas y Cuerpos de Seguridad para impedir o dificultar el ejercicio de sus funciones (art. ' +
      '37.6 LO 4/2015). Es infracción LEVE. Se distingue del art. 35.4 (haces sobre conductores/pilotos ' +
      'con riesgo de accidente, muy grave).',
    terminos: [
      'laser a la policia',
      'puntero laser a un agente',
      'deslumbrar al agente con laser',
      'apuntar con laser a la policia',
      'laser a los antidisturbios',
      'cegar al policia con laser',
      'laser a un guardia',
    ],
    consecuencias: [
      {
        tipo: 'decomiso',
        textoCorto:
          'Procede valorar la intervención (aprehensión) del dispositivo láser y su puesta a ' +
          'disposición de la autoridad competente.',
        fuente: 'LO 4/2015 art. 39.2 (comiso)',
      },
    ],
    notaRevision:
      NOTA_LEVE_IMPORTE +
      ' A VERIFICAR el deslinde con el art. 35.4 (láser a conductores/pilotos, muy grave) y con el ' +
      'delito de atentado (art. 550 CP) si el láser causa lesión o pone en peligro al agente. Confirmar con el revisor.',
  }),
  // --- Ola de ARMAS (ampliación RD 137/1993; sanción LO 4/2015 art. 36.12) ---------------------
  construirInfraccion({
    id: 'arma-coleccionismo-sin-autorizacion',
    articulo: ART_LOSC_36_12,
    tituloCorto: 'Coleccionismo de armas sin autorización',
    gravedad: 'grave',
    importeEur: 601,
    importeReducidoEur: 300.5,
    textoBoletin:
      'Poseer una colección de armas (o armas de museo/históricas) sin la autorización de ' +
      'coleccionismo exigida, o incumpliendo sus condiciones (inscripción, libro-registro, ' +
      'inutilización cuando proceda), cuando la conducta no sea constitutiva de delito (art. 36.12 LO ' +
      '4/2015; régimen de coleccionismo de los arts. 107 y ss. del RD 137/1993: autorización especial, ' +
      'libro-registro del coleccionista e inutilización cuando proceda). FRONTERA PENAL: si las armas son aptas para ' +
      'el disparo y carecen de toda documentación puede haber tenencia ilícita (art. 564 CP) o depósito ' +
      '(arts. 566-568 CP). Orientativo.',
    terminos: [
      'coleccion de armas sin permiso',
      'coleccionista de armas sin autorizacion',
      'armas de museo sin papeles',
      'coleccion de pistolas antiguas',
      'armas historicas sin inutilizar',
      'guardar una coleccion de armas ilegal',
      'coleccionismo de armas sin licencia',
    ],
    consecuencias: [
      {
        tipo: 'decomiso',
        textoCorto:
          'Procede valorar la intervención (aprehensión) de las armas y su puesta a disposición de la ' +
          'autoridad competente (Intervención de Armas de la Guardia Civil).',
        fuente: 'LO 4/2015 art. 39.2 (comiso)',
      },
    ],
    notaRevision:
      NOTA_GRAVE_IMPORTE +
      ' A VERIFICAR los artículos del RD 137/1993 sobre coleccionismo (autorización, inscripción, ' +
      'inutilización y libro-registro) y el deslinde con la tenencia ilícita/depósito (arts. 564 y ' +
      '566-568 CP) según la aptitud para el disparo. Confirmar con el revisor jurídico.',
  }),
  construirInfraccion({
    id: 'arma-no-comunicar-perdida-arma',
    articulo: ART_LOSC_36_12,
    tituloCorto: 'No comunicar la pérdida o sustracción del arma',
    gravedad: 'grave',
    importeEur: 601,
    importeReducidoEur: 300.5,
    textoBoletin:
      'No comunicar a la autoridad la pérdida, extravío o sustracción del ARMA reglamentada (no solo de ' +
      'su documentación), o no adoptar las medidas de custodia que lo habrían evitado, incumpliendo la ' +
      'normativa de armas (art. 36.12 LO 4/2015; deber de dar cuenta inmediata de la pérdida o ' +
      'sustracción del arma a la Intervención de Armas de la Guardia Civil, art. 149 RD 137/1993 ' +
      '—ordinal a verificar en el texto consolidado—, y deberes de custodia de los arts. 105 y ss.). ' +
      'Se diferencia del art. 37.8 (leve), que se refiere a la pérdida de la DOCUMENTACIÓN, no del arma. ' +
      'FRONTERA PENAL: si el arma acaba en manos de terceros con indicios de destino ilícito, puede ' +
      'haber depósito/tráfico (arts. 566-568 CP). Orientativo.',
    terminos: [
      'no denuncio el robo del arma',
      'le robaron la pistola y no lo comunico',
      'perdio la escopeta sin avisar',
      'arma sustraida no comunicada',
      'no comunico la perdida del arma',
      'le desaparecio el arma y no dijo nada',
      'no denuncia la sustraccion del arma',
    ],
    consecuencias: [
      {
        tipo: 'decomiso',
        textoCorto:
          'Procede valorar la intervención cautelar de las armas restantes y su puesta a disposición ' +
          'de la autoridad competente (Intervención de Armas de la Guardia Civil).',
        fuente: 'LO 4/2015 art. 39.2 (comiso)',
      },
    ],
    notaRevision:
      NOTA_GRAVE_IMPORTE +
      ' A VERIFICAR el precepto del RD 137/1993 que fija el plazo y la forma de comunicar la pérdida/' +
      'sustracción del arma y el deslinde con el art. 37.8 (documentación, leve) y con el depósito/' +
      'tráfico (arts. 566-568 CP). Confirmar con el revisor jurídico.',
  }),
  // --- 4ª ola (paridad SPPLB): huecos de los arts. 36 y 37 LO 4/2015 --------------------------
  construirInfraccion({
    id: 'sc-perturbacion-sedes-parlamentarias',
    articulo: ART_LOSC_36_2,
    tituloCorto: 'Perturbación grave frente a sedes parlamentarias',
    gravedad: 'grave',
    importeEur: 601,
    importeReducidoEur: 300.5,
    textoBoletin:
      'Perturbar gravemente la seguridad ciudadana con ocasión de una reunión o manifestación frente a ' +
      'las sedes del Congreso, del Senado o de una asamblea legislativa autonómica, aunque no estuvieran ' +
      'reunidos, cuando la conducta no sea constitutiva de delito (art. 36.2 LO 4/2015). Se distingue de ' +
      'la perturbación en actos/espectáculos (art. 36.1) por el lugar y de los desórdenes generales ' +
      '(art. 36.3).',
    terminos: [
      'manifestacion frente al congreso',
      'protesta frente al parlamento',
      'concentracion ante el senado',
      'rodear el congreso',
      'altercados frente a la asamblea',
      'disturbios ante el parlamento autonomico',
      'protesta frente a las cortes',
    ],
    consecuencias: [
      {
        tipo: 'identificacion',
        textoCorto:
          'Procede identificar a los responsables para la denuncia; la valoración de si la conducta ' +
          'supera el ámbito administrativo corresponde al agente y a la autoridad judicial.',
        fuente: 'LO 4/2015 art. 16',
      },
    ],
    notaRevision:
      NOTA_GRAVE_IMPORTE +
      ' A VERIFICAR el deslinde con los arts. 36.1 (actos/espectáculos) y 36.3 (desórdenes en vía ' +
      'pública) y con el delito de desórdenes públicos (arts. 557 y ss. CP), así como el respeto al ' +
      'derecho de reunión (art. 21 CE). Confirmar con el revisor jurídico.',
  }),
  construirInfraccion({
    id: 'sc-obstruccion-ejercicio-funciones',
    articulo: ART_LOSC_36_4,
    tituloCorto: 'Obstrucción al ejercicio de funciones o a resoluciones (desahucio)',
    gravedad: 'grave',
    importeEur: 601,
    importeReducidoEur: 300.5,
    textoBoletin:
      'Realizar actos de obstrucción que pretendan impedir a una autoridad, empleado público o ' +
      'corporación oficial el ejercicio legítimo de sus funciones o el cumplimiento o la ejecución de ' +
      'acuerdos o resoluciones administrativas o judiciales, al margen de los cauces legales y cuando la ' +
      'conducta no sea constitutiva de delito (art. 36.4 LO 4/2015). Caso típico: impedir físicamente un ' +
      'lanzamiento/desahucio o un desalojo ordenado. Se diferencia de la desobediencia/resistencia del ' +
      'art. 36.6.',
    terminos: [
      'impedir un desahucio',
      'bloquear un lanzamiento judicial',
      'impedir un desalojo',
      'obstruir a la autoridad',
      'impedir el trabajo de un funcionario',
      'parar un desahucio',
      'no dejar ejecutar una orden judicial',
    ],
    consecuencias: [
      {
        tipo: 'identificacion',
        textoCorto:
          'Procede identificar a quienes obstruyan para la denuncia; la valoración de si la conducta ' +
          'constituye delito (p. ej. desobediencia grave, art. 556 CP) corresponde a la autoridad judicial.',
        fuente: 'LO 4/2015 art. 16',
      },
    ],
    notaRevision:
      NOTA_GRAVE_IMPORTE +
      ' A VERIFICAR el deslinde con el art. 36.6 (desobediencia/resistencia) y con el delito de ' +
      'desobediencia grave (art. 556 CP). Confirmar con el revisor jurídico.',
  }),
  construirInfraccion({
    id: 'sc-obstruccion-inspecciones-controles',
    articulo: ART_LOSC_36_13,
    tituloCorto: 'Negativa u obstrucción a inspecciones y controles reglamentarios',
    gravedad: 'grave',
    importeEur: 601,
    importeReducidoEur: 300.5,
    textoBoletin:
      'Negar el acceso u obstruir deliberadamente las inspecciones o controles reglamentarios que ' +
      'realice la autoridad competente en fábricas, locales, establecimientos, embarcaciones o ' +
      'aeronaves (por ejemplo, controles de armas, explosivos, pirotecnia o seguridad privada), cuando ' +
      'la conducta no sea constitutiva de delito (art. 36.13 LO 4/2015).',
    terminos: [
      'no dejar entrar a inspeccionar',
      'impedir una inspeccion',
      'negar el acceso a un control',
      'obstruir una inspeccion de armas',
      'no permitir el control del local',
      'impedir la revision del establecimiento',
      'negativa a inspeccion reglamentaria',
    ],
    consecuencias: [
      {
        tipo: 'identificacion',
        textoCorto:
          'Procede identificar al responsable del establecimiento o actividad para la denuncia y dejar ' +
          'constancia de la negativa u obstrucción.',
        fuente: 'LO 4/2015 art. 16',
      },
    ],
    notaRevision:
      NOTA_GRAVE_IMPORTE +
      ' A VERIFICAR que exista una inspección o control REGLAMENTARIO habilitado por la autoridad ' +
      'competente y el deslinde con el art. 36.6 (desobediencia) y con la entrada en domicilio/lugares ' +
      'cerrados (autorización judicial cuando proceda). Confirmar con el revisor jurídico.',
  }),
  construirInfraccion({
    id: 'sc-falta-colaboracion-fcs',
    articulo: ART_LOSC_36_15,
    tituloCorto: 'Falta de colaboración con las Fuerzas y Cuerpos de Seguridad',
    gravedad: 'grave',
    importeEur: 601,
    importeReducidoEur: 300.5,
    textoBoletin:
      'No colaborar con las Fuerzas y Cuerpos de Seguridad en la averiguación de delitos o en la ' +
      'prevención de acciones que puedan poner en riesgo la seguridad ciudadana, en los supuestos del ' +
      'deber de colaboración del art. 7 LO 4/2015 (art. 36.15 LO 4/2015). No obliga a declarar contra ' +
      'uno mismo ni sustituye la denuncia; la valoración del alcance del deber corresponde al agente y a ' +
      'la autoridad.',
    terminos: [
      'no colaborar con la policia',
      'negarse a colaborar',
      'no ayudar en una investigacion',
      'falta de colaboracion',
      'no facilitar informacion a la policia',
      'negarse a colaborar con la guardia civil',
      'no prestar auxilio requerido',
    ],
    consecuencias: [
      {
        tipo: 'identificacion',
        textoCorto:
          'Procede identificar a la persona requerida y dejar constancia del requerimiento de ' +
          'colaboración y de su negativa; la valoración del alcance del deber corresponde a la autoridad.',
        fuente: 'LO 4/2015 art. 16',
      },
    ],
    notaRevision:
      NOTA_GRAVE_IMPORTE +
      ' A VERIFICAR el alcance del deber de colaboración (art. 7 LO 4/2015) y sus límites (no ' +
      'autoinculpación, derecho a no declarar), y el deslinde con la desobediencia del art. 36.6. ' +
      'Confirmar con el revisor jurídico.',
  }),
  construirInfraccion({
    id: 'sc-traslado-facilitar-drogas',
    articulo: ART_LOSC_36_17,
    tituloCorto: 'Trasladar personas para facilitar el acceso a drogas',
    gravedad: 'grave',
    importeEur: 601,
    importeReducidoEur: 300.5,
    textoBoletin:
      'Trasladar personas con cualquier vehículo con el objeto de facilitarles el acceso al consumo de ' +
      'drogas tóxicas, estupefacientes o sustancias psicotrópicas, cuando la conducta no sea ' +
      'constitutiva de delito (art. 36.17 LO 4/2015). Se distingue del consumo/tenencia en vía pública ' +
      '(art. 36.16) y de la tolerancia en locales (art. 36.19). FRONTERA PENAL: la promoción o ' +
      'facilitación del consumo puede ser delito contra la salud pública (art. 368 CP).',
    terminos: [
      'llevar gente a comprar droga',
      'transportar personas para consumir droga',
      'llevar en coche a pillar',
      'facilitar el acceso a la droga en coche',
      'trasladar consumidores de droga',
      'llevar gente al poblado a por droga',
      'hacer de chofer para comprar droga',
    ],
    consecuencias: [
      {
        tipo: 'identificacion',
        textoCorto:
          'Procede identificar al conductor y a los ocupantes para la denuncia; la valoración de si la ' +
          'conducta constituye delito contra la salud pública (art. 368 CP) corresponde a la autoridad judicial.',
        fuente: 'LO 4/2015 art. 16',
      },
    ],
    notaRevision:
      NOTA_GRAVE_IMPORTE +
      ' A VERIFICAR el deslinde con los arts. 36.16 (consumo/tenencia) y 36.19 (tolerancia en locales) y ' +
      'con el delito contra la salud pública (art. 368 CP). Confirmar con el revisor jurídico.',
  }),
  construirInfraccion({
    id: 'sc-cultivo-drogas-visible',
    articulo: ART_LOSC_36_18,
    tituloCorto: 'Plantación o cultivo de drogas visible al público',
    gravedad: 'grave',
    importeEur: 601,
    importeReducidoEur: 300.5,
    textoBoletin:
      'Ejecutar actos de plantación y cultivo ilícitos de drogas tóxicas, estupefacientes o sustancias ' +
      'psicotrópicas en lugares visibles al público, cuando la conducta no sea constitutiva de ' +
      'infracción penal (art. 36.18 LO 4/2015). Caso típico: macetas de marihuana visibles en balcones, ' +
      'terrazas o ventanas. FRONTERA PENAL: el cultivo destinado al tráfico es delito contra la salud ' +
      'pública (art. 368 CP); la vía administrativa queda para el autoconsumo visible sin destino al tráfico.',
    terminos: [
      'plantas de marihuana en el balcon',
      'cultivo de marihuana visible',
      'macetas de maria en la ventana',
      'plantacion de cannabis a la vista',
      'marihuana en la terraza',
      'cultivar maria en el balcon',
      'plantas de cannabis visibles desde la calle',
    ],
    consecuencias: [
      {
        tipo: 'decomiso',
        textoCorto:
          'Procede la aprehensión (comiso) de las plantas y de los útiles de cultivo, que se ponen a ' +
          'disposición de la autoridad competente.',
        fuente: 'LO 4/2015 art. 39.2 (comiso)',
      },
    ],
    notaRevision:
      NOTA_GRAVE_IMPORTE +
      ' A VERIFICAR el deslinde con el delito contra la salud pública (art. 368 CP): el cultivo con ' +
      'destino al tráfico es delito; la vía del 36.18 exige que sea VISIBLE al público y sin destino al ' +
      'tráfico. Confirmar el comiso y su encaje con el revisor jurídico.',
  }),
  construirInfraccion({
    id: 'sc-datos-falsos-documentacion',
    articulo: ART_LOSC_36_21,
    tituloCorto: 'Alegar datos falsos para obtener documentación oficial',
    gravedad: 'grave',
    importeEur: 601,
    importeReducidoEur: 300.5,
    textoBoletin:
      'Alegar datos o circunstancias falsos para obtener las documentaciones previstas en la LO 4/2015 ' +
      '(licencias, autorizaciones o permisos), cuando la conducta no sea constitutiva de delito (art. ' +
      '36.21 LO 4/2015). Se distingue del art. 36.6 (alegar datos falsos en el proceso de ' +
      'IDENTIFICACIÓN). FRONTERA PENAL: la falsedad documental es delito (arts. 390 y ss. CP).',
    terminos: [
      'datos falsos para una licencia',
      'mentir para conseguir un permiso',
      'falsear datos para una autorizacion',
      'aportar documentacion falsa para un permiso',
      'datos inexactos para obtener licencia',
      'enganar para conseguir una autorizacion',
      'declarar datos falsos a la administracion',
    ],
    consecuencias: [
      {
        tipo: 'identificacion',
        textoCorto:
          'Procede identificar al solicitante y dejar constancia de los datos falsos alegados; la ' +
          'valoración de si hay falsedad documental (arts. 390 y ss. CP) corresponde a la autoridad judicial.',
        fuente: 'LO 4/2015 art. 16',
      },
    ],
    notaRevision:
      NOTA_GRAVE_IMPORTE +
      ' A VERIFICAR el deslinde con el art. 36.6 (datos falsos en la identificación) y con el delito de ' +
      'falsedad documental (arts. 390 y ss. CP). Confirmar con el revisor jurídico.',
  }),
  construirInfraccion({
    id: 'sc-exhibicion-objetos-peligrosos',
    articulo: ART_LOSC_37_2,
    tituloCorto: 'Exhibir objetos peligrosos con ánimo intimidatorio',
    gravedad: 'leve',
    importeEur: 100,
    importeReducidoEur: 50,
    textoBoletin:
      'Exhibir objetos peligrosos para la vida y la integridad física de las personas con ánimo ' +
      'intimidatorio, cuando la conducta no sea constitutiva de delito ni de la infracción grave de ' +
      'armas del art. 36.10 (art. 37.2 LO 4/2015). Caso típico: enseñar una barra, un bate o una ' +
      'herramienta de forma amenazante sin llegar a la agresión.',
    terminos: [
      'exhibir un objeto peligroso',
      'ensenar un bate de forma amenazante',
      'blandir una barra',
      'amenazar con un objeto',
      'mostrar un objeto peligroso para intimidar',
      'sacar una herramienta para asustar',
      'exhibir objeto peligroso con animo intimidatorio',
    ],
    notaRevision:
      NOTA_LEVE_IMPORTE +
      ' A VERIFICAR el deslinde con el art. 36.10 (armas prohibidas/uso intimidatorio de armas, grave) ' +
      'y con el delito de amenazas (arts. 169 y ss. CP). Confirmar con el revisor jurídico.',
  }),
  construirInfraccion({
    id: 'sc-restriccion-circulacion-actos',
    articulo: ART_LOSC_37_3,
    tituloCorto: 'Incumplir restricciones de circulación en actos o manifestaciones',
    gravedad: 'leve',
    importeEur: 100,
    importeReducidoEur: 50,
    textoBoletin:
      'Incumplir las restricciones de circulación peatonal o de itinerario acordadas con ocasión de un ' +
      'acto público, reunión o manifestación, cuando provoquen alteraciones menores en su normal ' +
      'desarrollo (art. 37.3 LO 4/2015). Se diferencia de la desobediencia del art. 36.6 por la menor ' +
      'entidad de la conducta.',
    terminos: [
      'saltarse un corte de calle',
      'no respetar el itinerario de la manifestacion',
      'cruzar un perimetro de un acto publico',
      'incumplir una restriccion de paso',
      'colarse en una zona cortada por un evento',
      'saltarse el vallado de una manifestacion',
      'no respetar las restricciones de circulacion en un acto',
    ],
    notaRevision:
      NOTA_LEVE_IMPORTE +
      ' A VERIFICAR el deslinde con el art. 36.6 (desobediencia) y con el art. 37.15 (remoción de ' +
      'vallas/precintos): aquí basta la alteración MENOR. Confirmar con el revisor jurídico.',
  }),
  construirInfraccion({
    id: 'sc-exhibicion-obscena',
    articulo: ART_LOSC_37_5,
    tituloCorto: 'Actos de exhibición obscena en lugar público',
    gravedad: 'leve',
    importeEur: 100,
    importeReducidoEur: 50,
    textoBoletin:
      'Realizar o incitar a la realización de actos que atenten contra la libertad e indemnidad sexual, ' +
      'o ejecutar actos de exhibición obscena, cuando la conducta no sea constitutiva de delito (art. ' +
      '37.5 LO 4/2015). FRONTERA PENAL: el exhibicionismo ante menores o personas con discapacidad ' +
      'necesitada de especial protección es delito (art. 185 CP); la vía administrativa es residual.',
    terminos: [
      'ensenar los genitales en la calle',
      'exhibicionismo',
      'hacer sus necesidades exhibiendose',
      'acto obsceno en la via publica',
      'masturbarse en publico',
      'exhibicion obscena',
      'ensenarse desnudo de forma obscena',
    ],
    notaRevision:
      NOTA_LEVE_IMPORTE +
      ' A VERIFICAR la frontera con el delito de exhibicionismo (art. 185 CP), especialmente ante ' +
      'menores o personas necesitadas de especial protección, en cuyo caso es DELITO y no infracción. ' +
      'Confirmar con el revisor jurídico.',
  }),
  construirInfraccion({
    id: 'sc-remocion-precinto-perimetro',
    articulo: ART_LOSC_37_15,
    tituloCorto: 'Remover vallas o precintos de un perímetro de seguridad',
    gravedad: 'leve',
    importeEur: 100,
    importeReducidoEur: 50,
    textoBoletin:
      'Remover vallas, encintados u otros elementos, fijos o móviles, colocados por las Fuerzas y ' +
      'Cuerpos de Seguridad para delimitar un perímetro de seguridad, aun con carácter preventivo, ' +
      'cuando la conducta no sea constitutiva de infracción grave (art. 37.15 LO 4/2015). Caso típico: ' +
      'quitar el precinto policial de una zona acordonada.',
    terminos: [
      'quitar el precinto policial',
      'saltarse el cordon policial',
      'retirar una valla de la policia',
      'romper el precinto de una zona acordonada',
      'quitar el encintado policial',
      'cruzar la cinta policial',
      'remover el vallado de seguridad',
    ],
    notaRevision:
      NOTA_LEVE_IMPORTE +
      ' A VERIFICAR el deslinde con las infracciones graves (p. ej. desórdenes del art. 36.3) cuando la ' +
      'remoción del perímetro genere una alteración grave, y con la desobediencia del art. 36.6. ' +
      'Confirmar con el revisor jurídico.',
  }),
  construirInfraccion({
    id: 'sc-animales-sueltos-abandono',
    articulo: ART_LOSC_37_16,
    tituloCorto: 'Dejar sueltos animales peligrosos o abandonarlos con peligro',
    gravedad: 'leve',
    importeEur: 100,
    importeReducidoEur: 50,
    textoBoletin:
      'Dejar sueltos o en disposición de causar daños a animales feroces o dañinos, así como abandonar ' +
      'animales domésticos en condiciones en que pueda peligrar su vida (art. 37.16 LO 4/2015). Es el ' +
      'tipo de SEGURIDAD CIUDADANA, distinto del régimen de bienestar animal (Ley 7/2023), de los ' +
      'animales potencialmente peligrosos (Ley 50/1999) y de las ordenanzas municipales; pueden ' +
      'concurrir. FRONTERA PENAL: el maltrato o abandono con resultado puede ser delito (arts. 337 y ' +
      '337 bis CP).',
    terminos: [
      'perro suelto peligroso',
      'animal suelto que puede morder',
      'dejar un perro peligroso suelto',
      'abandonar un perro',
      'abandonar un animal en la calle',
      'soltar un animal peligroso',
      'perro sin atar que ataca',
    ],
    notaRevision:
      NOTA_LEVE_IMPORTE +
      ' A VERIFICAR la concurrencia con el régimen de PPP (Ley 50/1999), bienestar animal (Ley 7/2023) y ' +
      'ordenanzas municipales, y el deslinde con el delito de maltrato/abandono animal (arts. 337 y 337 ' +
      'bis CP). Confirmar con el revisor jurídico.',
  }),
  // --- 5ª ola (paridad SPPLB): huecos firmes de los arts. 35, 36 y 37 LO 4/2015 --------------
  construirInfraccion({
    id: 'sc-reunion-infraestructuras-riesgo',
    articulo: ART_LOSC_35_1,
    tituloCorto: 'Reunión o manifestación en infraestructura crítica con riesgo',
    gravedad: 'muy_grave',
    importeEur: 30_001,
    importeReducidoEur: null,
    textoBoletin:
      'Celebrar reuniones o manifestaciones no comunicadas o prohibidas en infraestructuras o ' +
      'instalaciones donde se prestan servicios básicos para la comunidad (centrales eléctricas, ' +
      'nucleares, presas, refinerías, aeropuertos, puertos…) o en sus inmediaciones, así como la ' +
      'intrusión en sus recintos (incluido el sobrevuelo con dron), cuando se haya generado un RIESGO ' +
      'para la vida o la integridad física de las personas (art. 35.1 LO 4/2015). Es infracción MUY ' +
      'GRAVE. Se distingue del art. 36.9 (intrusión con interferencia grave en el funcionamiento, pero ' +
      'sin ese riesgo para las personas, grave).',
    terminos: [
      'manifestacion en central nuclear',
      'protesta en un aeropuerto',
      'colarse en una central electrica',
      'reunion no autorizada en infraestructura critica',
      'invadir una refineria',
      'dron sobre una central',
      'ocupar una presa protestando',
      'intrusion en instalacion de servicios basicos con peligro',
    ],
    consecuencias: [
      {
        tipo: 'identificacion',
        textoCorto:
          'Procede identificar a los responsables y valorar la puesta a disposición de la autoridad ' +
          'competente; la calificación como muy grave exige constatar el riesgo generado para las ' +
          'personas. La valoración final corresponde al agente y a la autoridad.',
        fuente: 'LO 4/2015 art. 16',
      },
    ],
    notaRevision:
      NOTA_MUY_GRAVE_IMPORTE +
      ' A VERIFICAR que concurra el RIESGO para la vida o la integridad física que eleva la conducta a ' +
      'muy grave (sin él, encaje en el art. 36.9, grave) y la frontera con posibles delitos (desórdenes ' +
      'públicos, daños en infraestructuras críticas). Confirmar con el revisor jurídico.',
  }),
  construirInfraccion({
    id: 'sc-armas-explosivos-muy-grave',
    articulo: ART_LOSC_35_2,
    tituloCorto: 'Armas, explosivos o pirotecnia sin autorización con perjuicios muy graves',
    gravedad: 'muy_grave',
    importeEur: 30_001,
    importeReducidoEur: null,
    textoBoletin:
      'Fabricar, almacenar, transportar, comerciar o usar armas reglamentadas, explosivos catalogados, ' +
      'cartuchería o artículos pirotécnicos incumpliendo la normativa, sin la documentación o ' +
      'autorización requeridas o excediendo los límites autorizados, cuando se hayan generado ' +
      'PERJUICIOS MUY GRAVES y la conducta no sea constitutiva de delito (art. 35.2 LO 4/2015). Es ' +
      'infracción MUY GRAVE: la versión agravada de la misma conducta del art. 36.12 (grave). La ' +
      'obligación material la detallan el Reglamento de Armas (RD 137/1993) y la normativa de ' +
      'explosivos y pirotecnia. FRONTERA PENAL: depósito o tráfico de armas o explosivos (arts. 566 a ' +
      '568 CP): la calificación final corresponde a la autoridad judicial.',
    terminos: [
      'almacen ilegal de pirotecnia',
      'deposito de explosivos sin autorizacion',
      'guardar mucha cartuchería sin guia',
      'venta ilegal de petardos peligrosos',
      'fabrica clandestina de fuegos artificiales',
      'explosivos sin licencia con daños',
      'transportar explosivos sin autorizacion',
    ],
    consecuencias: [
      {
        tipo: 'decomiso',
        textoCorto:
          'Procede valorar la intervención (aprehensión) de las armas, explosivos, cartuchería o ' +
          'material pirotécnico y su puesta a disposición de la autoridad competente.',
        fuente: 'LO 4/2015 art. 39.2 (comiso)',
      },
    ],
    notaRevision:
      NOTA_MUY_GRAVE_IMPORTE +
      ' A VERIFICAR que concurran los PERJUICIOS MUY GRAVES que elevan la conducta desde el art. 36.12 ' +
      '(grave) y, sobre todo, la frontera con el delito (depósito/tráfico de armas o explosivos, arts. ' +
      '566 a 568 CP), que desplaza la vía administrativa. Confirmar con el revisor jurídico.',
  }),
  construirInfraccion({
    id: 'sc-carencia-registros-seguridad',
    articulo: ART_LOSC_36_20,
    tituloCorto: 'Carencia de registros obligatorios u omisión de comunicaciones',
    gravedad: 'grave',
    importeEur: 601,
    importeReducidoEur: 300.5,
    textoBoletin:
      'Carecer de los registros previstos en la LO 4/2015 para las actividades con trascendencia para ' +
      'la seguridad ciudadana (libro-registro de hospedaje en hoteles y pensiones, de compraventa de ' +
      'objetos usados, joyería o metales preciosos, de armerías u otras actividades reglamentadas), o ' +
      'no efectuar las comunicaciones obligatorias a las autoridades (art. 36.20 LO 4/2015). Se ' +
      'distingue del art. 37.9 (irregularidades en la cumplimentación de esos registros, leve).',
    terminos: [
      'hotel sin libro registro de viajeros',
      'no comunicar los huespedes a la policia',
      'compraventa sin libro registro',
      'joyeria sin registro de compras',
      'armeria sin libro registro',
      'no llevar el registro obligatorio',
      'falta de comunicacion obligatoria a la policia',
    ],
    notaRevision:
      NOTA_GRAVE_IMPORTE +
      ' A VERIFICAR el deslinde con el art. 37.9 (irregularidad formal en la cumplimentación, leve) ' +
      'frente a la CARENCIA total del registro o la omisión de la comunicación (grave), y qué actividad ' +
      'reglamentada concreta obliga al registro. Confirmar con el revisor jurídico.',
  }),
  construirInfraccion({
    id: 'sc-irregularidad-registros-seguridad',
    articulo: ART_LOSC_37_9,
    tituloCorto: 'Irregularidades en los registros con trascendencia para la seguridad',
    gravedad: 'leve',
    importeEur: 100,
    importeReducidoEur: 50,
    textoBoletin:
      'Cumplimentar con irregularidades los registros previstos en la LO 4/2015 con trascendencia para ' +
      'la seguridad ciudadana, incluyendo la alegación de datos o circunstancias falsos o la omisión de ' +
      'comunicaciones obligatorias dentro de los plazos establecidos, cuando la conducta no sea ' +
      'constitutiva de infracción penal (art. 37.9 LO 4/2015). Es la versión LEVE (defecto formal) ' +
      'frente a la carencia total del registro del art. 36.20 (grave).',
    terminos: [
      'libro registro mal cumplimentado',
      'datos incompletos en el registro de viajeros',
      'errores en el registro de compraventa',
      'comunicar los huespedes fuera de plazo',
      'registro de hospedaje con fallos',
      'irregularidad en el libro registro',
    ],
    notaRevision:
      NOTA_LEVE_IMPORTE +
      ' A VERIFICAR el deslinde con el art. 36.20 (carencia total del registro u omisión de la ' +
      'comunicación, grave): aquí el registro EXISTE pero se cumplimenta con defectos o fuera de plazo. ' +
      'Confirmar con el revisor jurídico.',
  }),
  construirInfraccion({
    id: 'sc-no-obtener-documentacion-personal',
    articulo: ART_LOSC_37_10,
    tituloCorto: 'No obtener el DNI u otra documentación personal exigida',
    gravedad: 'leve',
    importeEur: 100,
    importeReducidoEur: 50,
    textoBoletin:
      'Incumplir la obligación de obtener la documentación personal legalmente exigida (por ejemplo, el ' +
      'DNI, obligatorio a partir de los 14 años, RD 1553/2005 art. 1), así como omitir de forma negligente la denuncia de su ' +
      'sustracción o extravío (art. 37.10 LO 4/2015). IMPORTANTE: no sanciona el mero hecho de NO ' +
      'LLEVARLO ENCIMA —eso se resuelve identificándose por otros medios (art. 16)— sino no obtenerlo ' +
      'teniendo la obligación de tenerlo.',
    terminos: [
      'no tener dni con 14 años',
      'no sacarse el dni',
      'no renovar el dni obligatorio',
      'no denunciar el robo del dni',
      'sin dni obligatorio',
      'no obtener la documentacion obligatoria',
    ],
    notaRevision:
      NOTA_LEVE_IMPORTE +
      ' A VERIFICAR la DIFERENCIA clave con no llevar el documento encima (que NO es infracción: se ' +
      'identifica por otros medios, art. 16) y con la negativa a identificarse (art. 36.6, grave). Aquí ' +
      'se sanciona no OBTENER el documento pese a la obligación. Confirmar con el revisor jurídico.',
  }),
  construirInfraccion({
    id: 'sc-negligencia-custodia-documentacion',
    articulo: ART_LOSC_37_11,
    tituloCorto: 'Negligencia al custodiar el DNI (tercera pérdida en un año)',
    gravedad: 'leve',
    importeEur: 100,
    importeReducidoEur: 50,
    textoBoletin:
      'Ser negligente en la custodia y conservación de la documentación personal legalmente exigida, ' +
      'entendiéndose como tal la TERCERA y posteriores pérdidas o extravíos en el plazo de un año (art. ' +
      '37.11 LO 4/2015). No es la simple pérdida ocasional: exige la reiteración (tercera vez o más en ' +
      'doce meses).',
    terminos: [
      'perder el dni varias veces',
      'tercera perdida del dni en un año',
      'extraviar el dni muchas veces',
      'perder el dni por tercera vez',
      'negligencia con la documentacion personal',
      'perder el carnet reiteradamente',
    ],
    notaRevision:
      NOTA_LEVE_IMPORTE +
      ' A VERIFICAR el requisito de REITERACIÓN (tercera o posteriores pérdidas en un año) que exige el ' +
      'tipo: una pérdida aislada no es infracción. Confirmar el cómputo del plazo con el revisor jurídico.',
  }),
  construirInfraccion({
    id: 'sc-negativa-entregar-documentacion-retirada',
    articulo: ART_LOSC_37_12,
    tituloCorto: 'Negarse a entregar la documentación cuya retirada se ha acordado',
    gravedad: 'leve',
    importeEur: 100,
    importeReducidoEur: 50,
    textoBoletin:
      'Negarse a entregar la documentación personal legalmente exigida cuando se hubiese acordado su ' +
      'retirada o retención por la autoridad competente (art. 37.12 LO 4/2015). Es distinto de la ' +
      'negativa a IDENTIFICARSE (art. 36.6, grave): aquí existe una resolución previa de retirada o ' +
      'retención del documento que el interesado desatiende.',
    terminos: [
      'no entregar el dni retirado',
      'negarse a devolver la documentacion retenida',
      'no dar el documento cuya retirada se acordo',
      'no entregar el pasaporte retenido',
      'negativa a entregar documentacion retirada',
      'no devolver el documento requisado',
    ],
    notaRevision:
      NOTA_LEVE_IMPORTE +
      ' A VERIFICAR que exista una RESOLUCIÓN previa de retirada o retención del documento (sin ella no ' +
      'hay tipo) y el deslinde con la negativa a identificarse del art. 36.6 (grave). Confirmar con el ' +
      'revisor jurídico.',
  }),
];

/** Estructura completa del seed lista para combinar con el resto de contenido. */
export const SEED_SEGURIDAD_CIUDADANA: SeedContenido = {
  normas: NORMAS_SEGURIDAD_SEED,
  articulos: ARTICULOS_SEGURIDAD_SEED,
  infracciones: INFRACCIONES_SEGURIDAD_SEED,
};
