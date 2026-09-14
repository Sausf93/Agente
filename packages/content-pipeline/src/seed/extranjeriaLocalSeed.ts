import {
  Articulo,
  Consecuencia,
  Infraccion,
  Norma,
  Sinonimo,
  CUERPOS_TODOS,
  type Cuerpo,
  type CuerpoCompetente,
  type EstadoRevision,
  type MarcoImporte,
} from '@agente/shared';
import { hashTexto } from '../parsers/boe-xml/hash.js';
import type { InfraccionSeed, SeedContenido } from './traficoSeed.js';

/**
 * SEED de EXTRANJERÍA (LO 4/2000) y de POLICÍA LOCAL (animales peligrosos, Ley 50/1999).
 *
 * Objetivo (ronda de "validadores de calle"): que las consultas típicas de la Policía Nacional
 * (extranjería) y de la Policía Local (perro peligroso) no salgan vacías. Se prioriza el MENSAJE
 * CLAVE de la estancia irregular: NO es delito y NO procede detención penal por ella.
 *
 * Reglas aplicadas (CLAUDE.md y nota legal):
 *  - Textos de artículo y de boletín REDACTADOS POR NOSOTROS (resúmenes neutros, no copiados).
 *  - Toda infracción lleva su artículo fuente; la fecha visible la aporta el `ContentVersion`.
 *  - Lenguaje ORIENTATIVO en las consecuencias ("procede/puede", nunca imperativo).
 *  - NADA se publica "verificado": TODO queda `pendiente_revision` para el panel (revisor
 *    jurídico + segundo revisor, §8.3). `notaRevision` detalla el dato concreto "a verificar".
 */

/** Fecha de curación de este seed (la que verá el agente como "Actualizado el…"). */
const FECHA_ACTUALIZACION = '2026-09-14';
const VALID_FROM = `${FECHA_ACTUALIZACION}T00:00:00.000Z`;

// --- Identificadores de norma (BOE, legislación consolidada) --------------------------------
const ID_LOEX = 'BOE-A-2000-544'; // LO 4/2000, derechos y libertades de los extranjeros en España
const ID_PPP = 'BOE-A-1999-24419'; // Ley 50/1999, tenencia de animales potencialmente peligrosos
const ID_LBA = 'BOE-A-2023-7936'; // Ley 7/2023, protección de los derechos y el bienestar de los animales

const urlBoe = (id: string): string => `https://www.boe.es/buscar/act.php?id=${id}`;

/**
 * Relevancia de la Ley de animales peligrosos: la aplican en la calle sobre todo la Policía Local
 * (ordenanzas de convivencia), la Guardia Civil (ámbito rural) y las autonómicas; la Policía
 * Nacional no la lleva de oficio. La extranjería, en cambio, la consultan todos los cuerpos.
 */
const CUERPOS_LOCAL: Cuerpo[] = ['guardia_civil', 'policia_local', 'policia_autonomica'];

export const NORMAS_EXTRANJERIA_LOCAL_SEED: Norma[] = [
  Norma.parse({
    id: ID_LOEX,
    codigo: 'LOEX',
    titulo:
      'Ley Orgánica sobre derechos y libertades de los extranjeros en España y su integración social (LO 4/2000)',
    tipo: 'ley',
    ambito: 'estatal',
    urlBoe: urlBoe(ID_LOEX),
    fechaConsolidacion: null,
    cuerpos: [...CUERPOS_TODOS],
  }),
  Norma.parse({
    id: ID_PPP,
    codigo: 'LPPP',
    titulo: 'Ley sobre el régimen jurídico de la tenencia de animales potencialmente peligrosos (Ley 50/1999)',
    tipo: 'ley',
    ambito: 'estatal',
    urlBoe: urlBoe(ID_PPP),
    fechaConsolidacion: null,
    cuerpos: CUERPOS_LOCAL,
  }),
  Norma.parse({
    id: ID_LBA,
    codigo: 'LBA',
    titulo: 'Ley de protección de los derechos y el bienestar de los animales (Ley 7/2023)',
    tipo: 'ley',
    ambito: 'estatal',
    urlBoe: urlBoe(ID_LBA),
    fechaConsolidacion: null,
    cuerpos: CUERPOS_LOCAL,
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

const ART_LOEX_53 = articuloSeed({
  normaId: ID_LOEX,
  numero: '53.1.a',
  titulo: 'Infracciones graves: estancia irregular',
  texto:
    'Tipifica como infracción GRAVE (administrativa, no penal) encontrarse irregularmente en ' +
    'territorio español, por no haber obtenido la prórroga de estancia, carecer de autorización de ' +
    'residencia o tenerla caducada más de tres meses sin haber solicitado su renovación. La ' +
    'estancia irregular NO es delito y NO conlleva detención penal por sí sola: su tratamiento es ' +
    'administrativo (multa o, preferentemente, expulsión de los arts. 57 y 58). Resumen orientativo; ' +
    'consúltese el texto consolidado en el BOE.',
});

const ART_LOEX_53_TRABAJO = articuloSeed({
  normaId: ID_LOEX,
  numero: '53.1.b',
  titulo: 'Infracciones graves: trabajar sin autorización',
  texto:
    'Tipifica como infracción GRAVE (administrativa, no penal) encontrarse trabajando en España sin ' +
    'haber obtenido autorización de trabajo o autorización administrativa previa para trabajar, cuando ' +
    'además no se cuente con autorización de residencia válida. Es la infracción del TRABAJADOR ' +
    'extranjero, distinta de la del EMPLEADOR que le da ocupación (infracción muy grave del art. ' +
    '54.1.d). No es delito ni conlleva por sí sola detención penal: su tratamiento es administrativo ' +
    '(multa o expulsión). Resumen orientativo; consúltese el texto consolidado en el BOE.',
});

const ART_PPP_13 = articuloSeed({
  normaId: ID_PPP,
  numero: '13',
  titulo: 'Infracciones y sanciones en la tenencia de animales potencialmente peligrosos',
  texto:
    'Clasifica las infracciones en materia de animales potencialmente peligrosos (PPP). Es MUY ' +
    'GRAVE tener el animal sin la licencia preceptiva o sin haberlo inscrito en el registro. Es ' +
    'GRAVE, entre otras, dejar suelto al animal o no adoptar las medidas de seguridad, como llevarlo ' +
    'sin bozal o sin correa no extensible en lugares públicos. Las sanciones se gradúan por tramos ' +
    '(art. 13.5) y pueden incluir el comiso o el sacrificio del animal. Resumen orientativo.',
});

// --- Artículos de BIENESTAR ANIMAL (Ley 7/2023), OLA DE ANIMALES 2026-09-11 -------------------
const ART_LBA_ABANDONO = articuloSeed({
  normaId: ID_LBA,
  numero: '74.k',
  titulo: 'Bienestar animal: abandono (infracción grave)',
  texto:
    'La Ley 7/2023 tipifica como infracción GRAVE el abandono de un animal de compañía (art. 74.k), con la ' +
    'sanción por tramos del art. 76 (grave 10.001-50.000 €). DESLINDE PENAL: si del abandono se deriva un ' +
    'riesgo para la vida o integridad del animal, el hecho puede ser DELITO del art. 340 ter CP. Resumen ' +
    'orientativo; consúltese el BOE.',
});

const ART_LBA_IDENTIFICACION = articuloSeed({
  normaId: ID_LBA,
  numero: '74.b',
  titulo: 'Bienestar animal: identificación y registro (infracción grave)',
  texto:
    'La Ley 7/2023 tipifica como infracción GRAVE (art. 74.b) mantener sin identificar (microchip) o sin ' +
    'registrar a un animal de compañía sujeto a ello, con la sanción del art. 76. Es el deber ESTATAL de ' +
    'identificación, distinto del censo municipal que fije la ordenanza. Resumen orientativo; consúltese el ' +
    'texto consolidado.',
});

const ART_LBA_MALTRATO = articuloSeed({
  normaId: ID_LBA,
  numero: '74',
  titulo: 'Bienestar animal: condiciones de mantenimiento y maltrato sin lesión (grave)',
  texto:
    'La Ley 7/2023 obliga a mantener a los animales en condiciones adecuadas (alojamiento, alimentación, ' +
    'atención veterinaria) y tipifica como GRAVES (art. 74, p. ej. 74.o) los tratos que les causen ' +
    'sufrimiento sin llegar a la lesión que requiera tratamiento (sanción del art. 76). Las infracciones muy ' +
    'graves están en el art. 75. DESLINDE PENAL: el maltrato con lesión que requiera tratamiento veterinario ' +
    'o menoscabo grave es DELITO del art. 340 bis.1 CP; el maltrato grave o cruel SIN esa lesión también ' +
    'puede ser delito (art. 340 bis.4 CP). Resumen orientativo.',
});

// --- Artículos de la OLA DE EXTRANJERÍA (2026-09-11) ----------------------------------------
const ART_LOEX_54_1_D = articuloSeed({
  normaId: ID_LOEX,
  numero: '54.1.d',
  titulo: 'Infracción muy grave: dar trabajo a un extranjero sin autorización (empleador)',
  texto:
    'Tipifica como infracción MUY GRAVE contratar o dar ocupación a un trabajador extranjero que carece ' +
    'de la autorización de residencia y trabajo, cometiéndose una infracción por cada trabajador. Es la ' +
    'infracción del EMPLEADOR, distinta de la del trabajador (grave, art. 53.1.b). El expediente lo inicia ' +
    'la Inspección de Trabajo (art. 55.2). Resumen orientativo; consúltese el texto consolidado en el BOE.',
});

const ART_LOEX_52_B = articuloSeed({
  normaId: ID_LOEX,
  numero: '52.b',
  titulo: 'Infracción leve: retraso de hasta tres meses en solicitar la renovación',
  texto:
    'Tipifica como infracción LEVE el encontrarse trabajando o residiendo con la autorización caducada ' +
    'habiéndose retrasado hasta tres meses en solicitar su renovación, siempre que ese retraso no derive ' +
    'de causa imputable a la Administración. Se distingue de la estancia irregular GRAVE (art. 53.1.a), que ' +
    'exige carecer de autorización o tenerla caducada más de tres meses sin haber pedido renovación. Resumen orientativo.',
});

const ART_LOEX_52_A = articuloSeed({
  normaId: ID_LOEX,
  numero: '52.a',
  titulo: 'Infracción leve: no comunicar los cambios que determina el art. 31',
  texto:
    'Tipifica como infracción LEVE la omisión o el retraso en comunicar a las autoridades los cambios de ' +
    'nacionalidad, estado civil o domicilio, así como las demás circunstancias determinantes de la ' +
    'situación laboral que exige el art. 31. Si hay ocultación dolosa o falsedad grave, la conducta pasa a ' +
    'grave (art. 53.1.c). Resumen orientativo; consúltese el texto consolidado.',
});

const ART_LOEX_4 = articuloSeed({
  normaId: ID_LOEX,
  numero: '4',
  titulo: 'Derecho y deber de documentación',
  texto:
    'Los extranjeros tienen el derecho y el deber de conservar la documentación que acredita su identidad y ' +
    'su situación en España, y de exhibirla cuando sean requeridos. NO portar la documentación ENCIMA no ' +
    'equivale a estar en situación irregular: quien está en situación regular puede acreditarla por otros ' +
    'medios y aportarla después (cuestión de diligencia/subsanación), a diferencia de CARECER de ' +
    'autorización, que es la estancia irregular grave (art. 53.1.a). Resumen orientativo.',
});

const ART_LOEX_58_3_A = articuloSeed({
  normaId: ID_LOEX,
  numero: '58.3.a',
  titulo: 'Devolución: contravenir la prohibición de entrada tras una expulsión',
  texto:
    'Procede acordar la DEVOLUCIÓN, sin necesidad de un nuevo expediente de expulsión, de quien habiendo ' +
    'sido expulsado contraviene la prohibición de entrada en España (art. 58.3.a), reactivándose el cómputo ' +
    'del plazo de prohibición fijado en la resolución quebrantada (art. 58.7). NO es un delito por sí solo: ' +
    'la respuesta es administrativa. El internamiento cautelar, en su caso, lo acuerda la autoridad con los ' +
    'requisitos de los arts. 61-62. (La entrada ilegal por puesto no habilitado del que pretende entrar es ' +
    'la letra b del 58.3.) Resumen orientativo.',
});

const ART_LOEX_53_1_G = articuloSeed({
  normaId: ID_LOEX,
  numero: '53.1.g',
  titulo: 'Infracción grave: salir por puesto no habilitado',
  texto:
    'Tipifica como infracción GRAVE las salidas del territorio español por puestos no habilitados, sin ' +
    'exhibir la documentación prevista o contraviniendo las prohibiciones legalmente impuestas (art. ' +
    '53.1.g). Es la SALIDA: la ENTRADA ilegal del propio extranjero se resuelve por la vía de la devolución ' +
    '(art. 58.3.b), no por esta sanción grave. AYUDAR a terceros a entrar o transitar sí puede ser delito ' +
    '(art. 318 bis CP). Resumen orientativo; consúltese el texto consolidado.',
});

// --- Artículos de la OLA DE PARIDAD SPPLB (2026-09-14): más catálogo de calle ----------------
const ART_LOEX_53_1_C = articuloSeed({
  normaId: ID_LOEX,
  numero: '53.1.c',
  titulo: 'Infracción grave: ocultación dolosa o falsedad en la comunicación de cambios',
  texto:
    'Tipifica como infracción GRAVE la ocultación DOLOSA o la falsedad grave en el cumplimiento del deber ' +
    'de comunicar a las autoridades los cambios de nacionalidad, estado civil o domicilio, así como las ' +
    'demás circunstancias determinantes de la situación laboral (art. 31). Se distingue de la mera omisión o ' +
    'retraso, que es LEVE (art. 52.a): aquí lo que agrava es el DOLO/la falsedad. No es delito por sí sola ni ' +
    'conlleva detención penal; su tratamiento es administrativo. Resumen orientativo; consúltese el BOE.',
});

const ART_LOEX_53_1_D = articuloSeed({
  normaId: ID_LOEX,
  numero: '53.1.d',
  titulo: 'Infracción grave: incumplir las medidas de seguridad impuestas',
  texto:
    'Tipifica como infracción GRAVE el incumplimiento de las medidas de seguridad pública impuestas de ' +
    'presentación periódica o de alejamiento de fronteras o de núcleos de población concretados ' +
    'singularmente, cuando el extranjero esté sujeto a ellas (art. 53.1.d). Es la desatención de una medida ' +
    'YA acordada por la autoridad, no una situación irregular. Su tratamiento es administrativo. Resumen ' +
    'orientativo; consúltese el texto consolidado en el BOE.',
});

const ART_LOEX_53_1_F = articuloSeed({
  normaId: ID_LOEX,
  numero: '53.1.f',
  titulo: 'Infracción grave: actividades contrarias al orden público (graves)',
  texto:
    'Tipifica como infracción GRAVE la participación del extranjero en la realización de actividades ' +
    'contrarias al orden público previstas como graves en la Ley Orgánica de protección de la seguridad ' +
    'ciudadana (art. 53.1.f). Se distingue de la modalidad MUY GRAVE del art. 54.1.a (seguridad nacional o ' +
    'actividades contrarias al orden público muy graves). La conducta administrativa que aquí se sanciona no ' +
    'prejuzga la posible responsabilidad penal separada de los hechos. Resumen orientativo; consúltese el BOE.',
});

const ART_LOEX_54_1_A = articuloSeed({
  normaId: ID_LOEX,
  numero: '54.1.a',
  titulo: 'Infracción muy grave: seguridad nacional u orden público (muy graves)',
  texto:
    'Tipifica como infracción MUY GRAVE participar en actividades contrarias a la seguridad nacional o que ' +
    'puedan perjudicar las relaciones de España con otros países, o estar implicado en actividades contrarias ' +
    'al orden público previstas como muy graves en la Ley Orgánica de protección de la seguridad ciudadana ' +
    '(art. 54.1.a). Es la modalidad agravada frente a la del art. 53.1.f (grave). Su tratamiento es ' +
    'administrativo (multa o expulsión), sin perjuicio de la responsabilidad penal separada que puedan tener ' +
    'los hechos. Resumen orientativo; consúltese el texto consolidado en el BOE.',
});

const ART_LOEX_54_1_B = articuloSeed({
  normaId: ID_LOEX,
  numero: '54.1.b',
  titulo: 'Infracción muy grave: favorecer con ánimo de lucro la inmigración clandestina',
  texto:
    'Tipifica como infracción MUY GRAVE inducir, promover, favorecer o facilitar con ánimo de lucro, ' +
    'individualmente o formando parte de una organización, la inmigración clandestina de personas en tránsito ' +
    'o con destino a España, siempre que el hecho no constituya delito (art. 54.1.b). FRONTERA PENAL: cuando ' +
    'concurren los elementos del tipo, la ayuda a la entrada, tránsito o permanencia irregular es DELITO del ' +
    'art. 318 bis CP, cuya calificación corresponde a la autoridad judicial. Resumen orientativo; consúltese el BOE.',
});

const ART_LOEX_54_1_F = articuloSeed({
  normaId: ID_LOEX,
  numero: '54.1.f',
  titulo: 'Infracción muy grave: simular relación laboral o matrimonio de conveniencia',
  texto:
    'Tipifica como infracción MUY GRAVE simular con ánimo de lucro una relación laboral con un extranjero, ' +
    'cuando dicha conducta se lleve a cabo para facilitarle la obtención de una autorización (art. 54.1.f). En ' +
    'la práctica se conecta con los "matrimonios de conveniencia" y demás simulaciones para obtener papeles; el ' +
    'apartado exacto y su deslinde con las modalidades del art. 53 debe verificarse en el texto consolidado. Su ' +
    'tratamiento es administrativo, sin perjuicio de la posible responsabilidad penal. Resumen orientativo.',
});

// --- Artículos de PARIDAD de ANIMALES (Ley 7/2023) --------------------------------------------
const ART_LBA_COMERCIO = articuloSeed({
  normaId: ID_LBA,
  numero: '74 (venta y comercio)',
  titulo: 'Bienestar animal: venta y comercio no autorizados',
  texto:
    'La Ley 7/2023 restringe el comercio de animales de compañía: prohíbe su venta ambulante y su venta en ' +
    'establecimientos no autorizados o por criadores no registrados, y sujeta la cría con fines comerciales a ' +
    'registro. Su incumplimiento se tipifica como infracción (grave, art. 74; muy grave, art. 75, según el ' +
    'caso), con la sanción por tramos del art. 76. El apartado y la clasificación exactos deben verificarse en ' +
    'el texto consolidado. Resumen orientativo; consúltese el BOE.',
});

const ART_LBA_ESPECTACULOS = articuloSeed({
  normaId: ID_LBA,
  numero: '75 (espectáculos y peleas)',
  titulo: 'Bienestar animal: uso en espectáculos o peleas',
  texto:
    'La Ley 7/2023 prohíbe el uso de animales en peleas y en espectáculos u otras actividades que les causen ' +
    'sufrimiento o que sean contrarias a su bienestar. Su incumplimiento se tipifica como infracción (muy ' +
    'grave, art. 75), con la sanción por tramos del art. 76. DESLINDE PENAL: la organización o participación en ' +
    'peleas de animales puede ser DELITO del art. 340 bis CP, cuya calificación corresponde a la autoridad ' +
    'judicial. El apartado exacto debe verificarse. Resumen orientativo; consúltese el BOE.',
});

const ART_LBA_LISTADO = articuloSeed({
  normaId: ID_LBA,
  numero: '74 (listado positivo)',
  titulo: 'Bienestar animal: tenencia fuera del listado positivo',
  texto:
    'La Ley 7/2023 establece un "listado positivo" de especies que pueden tenerse como animales de compañía; ' +
    'la tenencia de una especie NO incluida (fauna silvestre o exótica no permitida) sin amparo legal se ' +
    'tipifica como infracción (grave, art. 74; muy grave si es especie de especial protección), con la sanción ' +
    'del art. 76 y, en su caso, el comiso del animal. El régimen transitorio y el apartado exacto deben ' +
    'verificarse en el texto consolidado. Resumen orientativo; consúltese el BOE.',
});

// --- Artículos de la 2.ª OLEADA de ANIMALES (paridad SPPLB, 2026-09-14) -----------------------
const ART_LBA_SANIDAD = articuloSeed({
  normaId: ID_LBA,
  numero: '74 (sanidad y desparasitación)',
  titulo: 'Bienestar animal: sanidad, vacunación y desparasitación obligatorias',
  texto:
    'La Ley 7/2023 impone obligaciones de sanidad animal (vacunaciones y tratamientos ' +
    'antiparasitarios obligatorios, revisiones veterinarias) para prevenir zoonosis y proteger la ' +
    'salud del animal. Su incumplimiento se tipifica como infracción (leve, art. 73; o grave, art. ' +
    '74, según el caso), con la sanción por tramos del art. 76. El apartado exacto y la frontera ' +
    'leve/grave deben verificarse en el texto consolidado, ya que gran parte del calendario sanitario ' +
    'la concretan la CCAA y el reglamento. Resumen orientativo; consúltese el BOE.',
});

const ART_LBA_MENDICIDAD = articuloSeed({
  normaId: ID_LBA,
  numero: '74 (mendicidad)',
  titulo: 'Bienestar animal: uso de animales en mendicidad',
  texto:
    'La Ley 7/2023 prohíbe utilizar animales en la mendicidad, o como reclamo con esa finalidad, y ' +
    'usarlos de forma que se comprometa su bienestar. Su incumplimiento se tipifica como infracción ' +
    '(grave, art. 74; muy grave, art. 75, si concurre sufrimiento relevante), con la sanción por ' +
    'tramos del art. 76. El apartado exacto debe verificarse en el texto consolidado. Resumen ' +
    'orientativo; consúltese el BOE.',
});

const ART_LBA_SACRIFICIO = articuloSeed({
  normaId: ID_LBA,
  numero: '75 (sacrificio)',
  titulo: 'Bienestar animal: sacrificio no justificado',
  texto:
    'La Ley 7/2023 prohíbe el sacrificio de animales de compañía salvo por motivos de seguridad de ' +
    'las personas o de los animales, o por razones sanitarias o de sufrimiento irreversible, y siempre ' +
    'bajo control veterinario. El sacrificio injustificado se tipifica como infracción MUY GRAVE (art. ' +
    '75), con la sanción por tramos del art. 76. DESLINDE PENAL: matar a un animal causándole ' +
    'sufrimiento, o cuando concurran los elementos del tipo, puede ser DELITO del art. 340 bis CP, cuya ' +
    'calificación corresponde a la autoridad judicial. El apartado exacto debe verificarse. Resumen orientativo.',
});

const ART_LBA_FORMACION = articuloSeed({
  normaId: ID_LBA,
  numero: '73/74 (tenencia responsable y formación)',
  titulo: 'Bienestar animal: curso de formación y tenencia responsable',
  texto:
    'La Ley 7/2023 introduce obligaciones de tenencia responsable, entre ellas la realización de un ' +
    'curso de formación (gratuito) para la tenencia de perros y la contratación de un seguro de ' +
    'responsabilidad civil. Su incumplimiento se tipifica como infracción (leve, art. 73; o grave, art. ' +
    '74, según el caso), con la sanción por tramos del art. 76. El desarrollo de estas obligaciones ' +
    'quedó pendiente de reglamento y su exigibilidad y clasificación deben verificarse en el texto ' +
    'consolidado. Resumen orientativo; consúltese el BOE.',
});

const ART_LBA_INHABILITACION = articuloSeed({
  normaId: ID_LBA,
  numero: '75 (tenencia tras inhabilitación)',
  titulo: 'Bienestar animal: tenencia estando inhabilitado',
  texto:
    'La Ley 7/2023 prevé como sanción accesoria la inhabilitación para la tenencia de animales y para ' +
    'actividades relacionadas. Tener o adquirir animales estando inhabilitado por resolución ' +
    'administrativa firme o por sentencia se tipifica como infracción MUY GRAVE (art. 75), con la ' +
    'sanción por tramos del art. 76. DESLINDE PENAL: la inhabilitación puede provenir también de una ' +
    'condena penal (art. 340 bis CP), cuyo quebrantamiento valora la autoridad judicial. El apartado ' +
    'exacto debe verificarse. Resumen orientativo; consúltese el BOE.',
});

const ART_LBA_CONTROL = articuloSeed({
  normaId: ID_LBA,
  numero: '74 (control en la vía pública)',
  titulo: 'Bienestar animal: control del animal en lugares públicos',
  texto:
    'La Ley 7/2023 impone el deber de mantener al animal bajo control (correa, supervisión) en la vía ' +
    'y los espacios públicos, para su seguridad y la de terceros; a diferencia de los animales ' +
    'potencialmente peligrosos (Ley 50/1999), aquí el marco es el de bienestar/tenencia responsable. ' +
    'Su incumplimiento se tipifica como infracción (leve, art. 73; o grave, art. 74) con la sanción del ' +
    'art. 76, sin perjuicio de lo que concrete la ORDENANZA municipal. El apartado exacto y la ' +
    'clasificación deben verificarse en el texto consolidado. Resumen orientativo; consúltese el BOE.',
});

export const ARTICULOS_EXTRANJERIA_LOCAL_SEED: Articulo[] = [
  ART_LOEX_53,
  ART_LOEX_53_TRABAJO,
  ART_LOEX_54_1_D,
  ART_LOEX_52_B,
  ART_LOEX_52_A,
  ART_LOEX_4,
  ART_LOEX_58_3_A,
  ART_LOEX_53_1_G,
  ART_LOEX_53_1_C,
  ART_LOEX_53_1_D,
  ART_LOEX_53_1_F,
  ART_LOEX_54_1_A,
  ART_LOEX_54_1_B,
  ART_LOEX_54_1_F,
  ART_PPP_13,
  ART_LBA_ABANDONO,
  ART_LBA_IDENTIFICACION,
  ART_LBA_MALTRATO,
  ART_LBA_COMERCIO,
  ART_LBA_ESPECTACULOS,
  ART_LBA_LISTADO,
  ART_LBA_SANIDAD,
  ART_LBA_MENDICIDAD,
  ART_LBA_SACRIFICIO,
  ART_LBA_FORMACION,
  ART_LBA_INHABILITACION,
  ART_LBA_CONTROL,
];

// --- Constructor de una infracción administrativa con sus sinónimos y consecuencias ---------
interface InfraccionSeedInput {
  id: string;
  articulo: Articulo;
  tituloCorto: string;
  gravedad: Infraccion['gravedad'];
  /** Importe base. `null` SOLO en entradas CONSULTABLES (`marcoImporte: 'no_sancionador'`). */
  importeEur: number | null;
  importeReducidoEur: number | null;
  textoBoletin: string;
  terminos: string[];
  cuerposCompetentes: CuerpoCompetente[];
  consecuencias?: Array<{ tipo: Consecuencia['tipo']; textoCorto: string; fuente: string }>;
  marcoImporte: MarcoImporte;
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
    competencia: { cuerpos: input.cuerposCompetentes, via: 'ambas' },
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
    marcoImporte: input.marcoImporte,
    revision: 'pendiente_revision' satisfies EstadoRevision,
    notaRevision: input.notaRevision,
  };
}

// --- Infracciones sembradas -----------------------------------------------------------------
export const INFRACCIONES_EXTRANJERIA_LOCAL_SEED: InfraccionSeed[] = [
  construirInfraccion({
    id: 'ext-estancia-irregular',
    articulo: ART_LOEX_53,
    tituloCorto: 'Estancia irregular (extranjería)',
    gravedad: 'grave',
    // LO 4/2000 art. 55.1.b: infracciones graves, multa de 501 a 10.000 €. Se fija el mínimo como
    // referencia. Cotejado (revisor 2026-09): en la MERA estancia irregular la sanción PREFERENTE es
    // la MULTA (doctrina TS Sala 3.ª 2023); la expulsión (art. 57) exige agravantes y motivación.
    importeEur: 501,
    importeReducidoEur: null,
    textoBoletin:
      'Encontrarse irregularmente en territorio español (sin autorización de estancia o residencia, ' +
      'o con ella caducada más de tres meses sin solicitar renovación). Es una infracción GRAVE ' +
      'ADMINISTRATIVA del art. 53.1.a LO 4/2000. MENSAJE CLAVE: la estancia irregular NO es delito y ' +
      'NO procede detención penal por ella; su tratamiento es administrativo. En la MERA estancia ' +
      'irregular la sanción PREFERENTE es la MULTA (art. 55.1); la expulsión (arts. 57 y 58) exige ' +
      'circunstancias agravantes añadidas y resolución motivada (doctrina del Tribunal Supremo, Sala ' +
      '3.ª, 2023). La detención cautelar gubernativa del expediente de expulsión tiene un máximo de 72 ' +
      'horas (art. 61) y el internamiento en CIE lo autoriza el Juez de Instrucción (art. 62). La ' +
      'valoración final corresponde a la autoridad administrativa/judicial.',
    terminos: [
      'estancia irregular',
      'sin papeles',
      'no tiene papeles',
      'no lleva papeles',
      'situacion irregular',
      'irregular en españa',
      'extranjero sin papeles',
      'extranjero sin documentacion',
      'indocumentado',
      'ilegal',
      'sin permiso de residencia',
      'residencia caducada',
      'se le caduco el permiso',
      'sin autorizacion de residencia',
      'sin residencia',
      'inmigrante irregular',
      'sin documentacion de extranjero',
    ],
    cuerposCompetentes: ['guardia_civil', 'policia_nacional', 'policia_local'],
    consecuencias: [
      {
        tipo: 'identificacion',
        textoCorto:
          'Procede la identificación y la comprobación documental; la estancia irregular se tramita ' +
          'por vía administrativa. En la mera estancia irregular la sanción preferente es la MULTA ' +
          '(art. 55.1); la expulsión (arts. 57/58) exige agravantes y motivación (TS 2023). NO procede ' +
          'detención penal por la mera situación irregular; la detención cautelar gubernativa es de ' +
          'máx. 72 h (art. 61) y el internamiento en CIE lo autoriza el Juez de Instrucción (art. 62).',
        fuente: 'LO 4/2000 arts. 53, 55, 57, 58, 61 y 62; TS Sala 3.ª 2023',
      },
    ],
    marcoImporte: 'extranjeria',
    notaRevision:
      'MENSAJE CLAVE a preservar en revisión: la estancia irregular es infracción GRAVE ' +
      'ADMINISTRATIVA (art. 53.1.a LO 4/2000), NO delito; NO procede detención penal por ella. A ' +
      'VERIFICAR: el importe (multa de 501 a 10.000 €, art. 55.1.b) es orientativo porque la sanción ' +
      'principal suele ser la EXPULSIÓN (art. 57), que además puede sustituir a la multa; y el ' +
      'régimen del internamiento cautelar (art. 61-62, autorización judicial, plazo máximo). Punto ' +
      'jurídicamente sensible: confirmar toda la redacción con el revisor jurídico antes de publicar.',
  }),
  construirInfraccion({
    id: 'ext-trabajo-sin-autorizacion',
    articulo: ART_LOEX_53_TRABAJO,
    tituloCorto: 'Trabajar sin autorización (extranjería)',
    gravedad: 'grave',
    // LO 4/2000 art. 55.1.b: infracciones graves, multa de 501 a 10.000 €. Se fija el mínimo como
    // referencia; la sanción puede sustituirse por expulsión (art. 57).
    importeEur: 501,
    importeReducidoEur: null,
    textoBoletin:
      'Encontrarse un extranjero trabajando en España sin haber obtenido autorización de trabajo o ' +
      'autorización administrativa previa para trabajar, cuando además no cuenta con autorización de ' +
      'residencia válida (art. 53.1.b LO 4/2000). Es infracción GRAVE ADMINISTRATIVA del TRABAJADOR, ' +
      'distinta de la del empleador que le da ocupación (infracción muy grave del art. 54.1.d). ' +
      'MENSAJE CLAVE: no es delito y NO procede detención penal por ella; su tratamiento es ' +
      'administrativo (multa o, en su caso, expulsión de los arts. 57 y 58). La valoración final ' +
      'corresponde a la autoridad administrativa (y judicial en su caso).',
    terminos: [
      'trabajando sin papeles',
      'trabajar sin autorizacion',
      'sin permiso de trabajo',
      'currando sin papeles',
      'extranjero trabajando sin permiso',
      'sin autorizacion de trabajo',
      'trabajar sin residencia',
      'trabajador irregular',
      'trabajando en negro',
      'vendedor sin papeles',
    ],
    cuerposCompetentes: ['guardia_civil', 'policia_nacional', 'policia_local'],
    consecuencias: [
      {
        tipo: 'identificacion',
        textoCorto:
          'Procede la identificación y la comprobación documental; el agente identifica y da parte. La ' +
          'sanción por trabajar sin autorización se tramita por vía administrativa mediante acta de la ' +
          'Inspección de Trabajo (art. 55.2 LO 4/2000), y la carga sancionadora principal recae en el ' +
          'EMPLEADOR (art. 54.1.d). NO procede detención penal por la mera situación; cualquier medida ' +
          'cautelar la acuerda la autoridad competente.',
        fuente: 'LO 4/2000 arts. 53.1.b, 54.1.d, 55 y 57',
      },
    ],
    marcoImporte: 'extranjeria',
    notaRevision:
      'A VERIFICAR: (i) el apartado exacto —art. 53.1.b LO 4/2000 (trabajar sin autorización) frente a ' +
      'la infracción del EMPLEADOR del art. 54.1.d (MUY GRAVE)—; (ii) el importe (grave, multa de 501 a ' +
      '10.000 €, art. 55.1.b) como orientativo, sabiendo que puede sustituirse por expulsión (art. 57). ' +
      'El expediente por 53.1.b se inicia por acta de la INSPECCIÓN DE TRABAJO (art. 55.2 LO 4/2000), no ' +
      'por el agente; y la carga sancionadora fuerte recae en el EMPLEADOR (art. 54.1.d, hasta 100.000 € ' +
      'y cierre; posible delito del art. 311 bis (empleo reiterado sin permiso), del 311 (condiciones ' +
      'ilegales) o, en explotación grave, del 177 bis CP —a verificar el estado del 311 bis tras la LO ' +
      '14/2022). ' +
      'MENSAJE CLAVE a preservar: es infracción ADMINISTRATIVA, NO delito; NO procede detención penal ' +
      'por ella. Punto jurídicamente sensible: confirmar toda la redacción con el revisor jurídico antes ' +
      'de publicar.',
  }),
  // --- OLA DE EXTRANJERÍA (2026-09-11): más catálogo administrativo (uso diario de PN) ----------
  construirInfraccion({
    id: 'ext-empleador-sin-autorizacion',
    articulo: ART_LOEX_54_1_D,
    tituloCorto: 'Dar trabajo a un extranjero sin autorización (empleador)',
    gravedad: 'muy_grave',
    // LO 4/2000 art. 55.1.c: muy graves, multa de 10.001 a 100.000 €. Mínimo del tramo como referencia.
    importeEur: 10001,
    importeReducidoEur: null,
    textoBoletin:
      'Contratar o dar ocupación a un trabajador extranjero que carece de autorización de residencia y ' +
      'trabajo. Es infracción MUY GRAVE ADMINISTRATIVA del EMPLEADOR (art. 54.1.d LO 4/2000), y se comete ' +
      'una por cada trabajador. Es la cara del empleador, distinta de la del trabajador (grave, art. ' +
      '53.1.b). MENSAJE CLAVE: la vía es administrativa (acta de la Inspección de Trabajo, art. 55.2); la ' +
      'mera situación no es delito. FRONTERA PENAL: si se imponen condiciones laborales ilegales puede ' +
      'entrar el art. 311 CP y, en explotación grave con captación/traslado, la trata del art. 177 bis CP. ' +
      'La valoración final corresponde a la autoridad competente.',
    terminos: [
      'contratar sin papeles',
      'dar trabajo a sin papeles',
      'empresa contrata ilegales',
      'empleador extranjeros sin permiso',
      'trabajador sin contrato extranjero',
      'contratar irregulares',
      'explotacion laboral inmigrantes',
      'ocupar extranjero sin autorizacion',
    ],
    cuerposCompetentes: ['guardia_civil', 'policia_nacional', 'policia_local'],
    consecuencias: [
      {
        tipo: 'identificacion',
        textoCorto:
          'Procede identificar y dar parte; el expediente sancionador lo inicia la Inspección de Trabajo ' +
          '(art. 55.2 LO 4/2000). Valorar indicios de explotación laboral (frontera con arts. 311 y 177 bis CP).',
        fuente: 'LO 4/2000 arts. 54.1.d y 55.2',
      },
    ],
    marcoImporte: 'extranjeria',
    notaRevision:
      'A VERIFICAR: art. 54.1.d (muy grave), una infracción por cada trabajador; tramo muy grave ' +
      '10.001-100.000 € (art. 55.1.c), el seed fija el mínimo. FRONTERA PENAL del empleador (a verificar el ' +
      'estado exacto tras la LO 14/2022): art. 311 bis (empleo reiterado sin permiso), art. 311 ' +
      '(imposición de condiciones ilegales) y, en explotación grave, art. 177 bis. Confirmar con el revisor.',
  }),
  construirInfraccion({
    id: 'ext-autorizacion-caducada-retraso',
    articulo: ART_LOEX_52_B,
    tituloCorto: 'Autorización caducada: retraso de hasta 3 meses en renovar',
    gravedad: 'leve',
    // LO 4/2000 art. 55.1.a: leves, multa de hasta 500 €. Referencia el techo del tramo.
    importeEur: 500,
    importeReducidoEur: null,
    textoBoletin:
      'Permanecer en España con la autorización caducada habiéndose retrasado HASTA TRES MESES en solicitar ' +
      'su renovación. Es infracción LEVE ADMINISTRATIVA (art. 52.b LO 4/2000), no la estancia irregular ' +
      'grave. DESLINDE CLAVE: si la autorización lleva caducada MÁS de tres meses SIN haber solicitado la ' +
      'renovación, el hecho pasa a estancia irregular GRAVE (art. 53.1.a). MENSAJE CLAVE: no es delito ni ' +
      'procede detención penal; suele ser subsanable presentando la renovación. La valoración final ' +
      'corresponde a la autoridad competente.',
    terminos: [
      'tarjeta caducada',
      'residencia caducada',
      'renovar fuera de plazo',
      'no renove la tarjeta',
      'permiso caducado extranjero',
      'tie caducada',
      'nie caducado',
      'prorroga no solicitada',
    ],
    cuerposCompetentes: ['guardia_civil', 'policia_nacional', 'policia_local'],
    consecuencias: [
      {
        tipo: 'identificacion',
        textoCorto:
          'Procede identificar y comprobar la fecha de caducidad y si hay solicitud de renovación ' +
          'presentada; orientar hacia la subsanación. Vía administrativa, nunca penal por la mera caducidad.',
        fuente: 'LO 4/2000 arts. 52.b y 53.1.a',
      },
    ],
    marcoImporte: 'extranjeria',
    notaRevision:
      'A VERIFICAR: art. 52.b (retraso hasta 3 meses = leve) y la frontera de los 3 meses con la estancia ' +
      'irregular del 53.1.a. Importe leve (hasta 500 €, art. 55.1.a), el seed fija el techo. Deslinde muy ' +
      'sensible en calle. Revisor jurídico.',
  }),
  construirInfraccion({
    id: 'ext-no-portar-documentacion',
    articulo: ART_LOEX_4,
    tituloCorto: 'No llevar encima la documentación (no es estancia irregular)',
    gravedad: 'leve', // valor de relleno; es entrada CONSULTABLE de deslinde, no sancionadora
    marcoImporte: 'no_sancionador',
    importeEur: null,
    importeReducidoEur: null,
    textoBoletin:
      'No portar encima la documentación que acredita la situación (pasaporte, TIE/NIE). MENSAJE CLAVE: no ' +
      'llevar la documentación ENCIMA no equivale a estar en situación irregular. Un extranjero en ' +
      'situación regular puede acreditarla por otros medios y aportarla después; es una cuestión de ' +
      'diligencia/subsanación (art. 4 LO 4/2000). Cosa distinta es CARECER de autorización, que es la ' +
      'estancia irregular GRAVE (art. 53.1.a). Nunca procede detención penal por no llevar los papeles ' +
      'encima. La valoración final corresponde al agente y a la autoridad competente.',
    terminos: [
      'no lleva papeles encima',
      'no lleva la documentacion',
      'no me da los papeles',
      'sin documentacion encima',
      'no lleva el nie',
      'olvido la tarjeta',
      'sin pasaporte encima',
      'no lleva la tie',
      'tarjeta de residencia',
      'indocumentado extranjero',
      'acreditar identidad extranjero',
    ],
    cuerposCompetentes: ['guardia_civil', 'policia_nacional', 'policia_local'],
    consecuencias: [
      {
        tipo: 'identificacion',
        textoCorto:
          'Procede identificar y dar oportunidad de acreditar la situación por otros medios; distinguir "no ' +
          'la lleva encima" (subsanable) de "no la tiene" (posible estancia irregular, 53.1.a). Se coordina ' +
          'con la diligencia de identificación del art. 16 LO 4/2015.',
        fuente: 'LO 4/2000 art. 4; LO 4/2015 art. 16',
      },
    ],
    notaRevision:
      'ENTRADA CONSULTABLE (deslinde): la obligación de portar la documentación es del art. 4.1 LO 4/2000, ' +
      'pero NO llevarla encima no es sin más infracción grave (no equivale a la estancia irregular del 53.1.a). ' +
      'Modelada como no_sancionador (sin importe) por ser deslinde, no tipo sancionador autónomo. MENSAJE CLAVE ' +
      'a preservar. Segundo revisor humano para el cierre.',
  }),
  construirInfraccion({
    id: 'ext-quebrantar-prohibicion-entrada',
    articulo: ART_LOEX_58_3_A,
    tituloCorto: 'Regresar tras una expulsión (prohibición de entrada vigente)',
    gravedad: 'leve', // relleno; el peso está en la consecuencia (devolución), sin cuantía fija
    marcoImporte: 'no_sancionador',
    importeEur: null,
    importeReducidoEur: null,
    textoBoletin:
      'Regresar a España habiendo sido expulsado y estando vigente la prohibición de entrada, o entrar ' +
      'contraviniéndola. MENSAJE CLAVE: por sí solo NO es delito (no encaja en el art. 197 ni 197 bis CP). ' +
      'La respuesta es ADMINISTRATIVA: procede la DEVOLUCIÓN sin necesidad de nuevo expediente de expulsión ' +
      '(art. 58.3.a LO 4/2000), reiniciándose el cómputo del plazo de prohibición de entrada (art. 58.7). La ' +
      'detención cautelar o el internamiento, si proceden, los acuerda la autoridad con los requisitos de ' +
      'los arts. 61-62. La valoración final corresponde a la autoridad competente.',
    terminos: [
      'volvio tras ser expulsado',
      'quebrantar expulsion',
      'prohibicion de entrada',
      'regreso tras expulsion',
      'reentrada ilegal',
      'expulsado que vuelve',
      'incumplir orden de expulsion',
      'veto de entrada',
    ],
    cuerposCompetentes: ['guardia_civil', 'policia_nacional', 'policia_local'],
    consecuencias: [
      {
        tipo: 'identificacion',
        textoCorto:
          'Procede identificar y comprobar en bases si consta una expulsión con prohibición de entrada ' +
          'vigente; la vía es la devolución (art. 58.3.a), no la detención penal. El internamiento cautelar ' +
          'lo acuerda la autoridad (arts. 61-62).',
        fuente: 'LO 4/2000 arts. 58.3.a, 58.7, 61 y 62',
      },
    ],
    notaRevision:
      'CONFIRMADO por el revisor: el regreso tras expulsión contraviniendo la prohibición de entrada es el ' +
      'art. 58.3.a (no el 58.3.b, que es la entrada ilegal del que pretende entrar); NO es delito autónomo ' +
      '(no es 197 ni 197 bis CP). Es DEVOLUCIÓN administrativa con reactivación del plazo (art. 58.7). ' +
      'Modelada como no_sancionador.',
  }),
  construirInfraccion({
    id: 'ext-salida-puesto-no-habilitado',
    articulo: ART_LOEX_53_1_G,
    tituloCorto: 'Salir por puesto no habilitado / eludir el control fronterizo',
    gravedad: 'grave',
    // LO 4/2000 art. 55.1.b: graves, multa de 501 a 10.000 €. Mínimo del tramo como referencia.
    importeEur: 501,
    importeReducidoEur: null,
    textoBoletin:
      'SALIR de España por un puesto no habilitado, sin exhibir la documentación exigida, o contraviniendo ' +
      'las prohibiciones legalmente impuestas: infracción GRAVE (art. 53.1.g LO 4/2000). OJO al deslinde: la ' +
      'ENTRADA ilegal del propio extranjero (p. ej. llegar en patera) NO es esta sanción grave, sino que se ' +
      'resuelve por la vía de la DEVOLUCIÓN (art. 58.3.b), sin multa; y AYUDAR a terceros a entrar o ' +
      'transitar sí puede ser DELITO (art. 318 bis CP). La valoración final corresponde a la autoridad competente.',
    terminos: [
      'salir por puesto no habilitado',
      'eludir control fronterizo',
      'salir sin pasar control',
      'cruzar la frontera sin control',
      'salida por sitio no autorizado',
      'saltarse el control de salida',
      'abandonar el pais sin documentacion',
      'puesto fronterizo no habilitado',
    ],
    cuerposCompetentes: ['guardia_civil', 'policia_nacional', 'policia_local'],
    consecuencias: [
      {
        tipo: 'identificacion',
        textoCorto:
          'Procede identificar y valorar la sanción grave por la SALIDA (53.1.g). La ENTRADA ilegal se ' +
          'resuelve por devolución (58.3.b), no por esta multa. Si alguien facilitó el paso, valorar la ' +
          'frontera penal del art. 318 bis CP.',
        fuente: 'LO 4/2000 arts. 53.1.g y 58.3.b',
      },
    ],
    marcoImporte: 'extranjeria',
    notaRevision:
      'CONFIRMADO por el revisor: la salida por puesto no habilitado es el art. 53.1.g LO 4/2000 (grave). ' +
      'Tramo grave 501-10.000 € (55.1.b), el seed fija el mínimo. Deslinde: entrada ilegal → devolución ' +
      '(58.3.b), no esta multa; ayudar a terceros → delito (318 bis CP). Sinónimos acotados a la SALIDA para ' +
      'no sugerir multa de 501 € por llegar en patera.',
  }),
  construirInfraccion({
    id: 'ext-no-comunicar-cambios',
    articulo: ART_LOEX_52_A,
    tituloCorto: 'No comunicar cambios de domicilio, estado civil o nacionalidad',
    gravedad: 'leve',
    importeEur: 500,
    importeReducidoEur: null,
    textoBoletin:
      'No comunicar, o comunicar con retraso, los cambios de domicilio, estado civil o nacionalidad a los ' +
      'que obliga el art. 31 LO 4/2000. Es infracción LEVE ADMINISTRATIVA (art. 52.a). DESLINDE: si hay ' +
      'ocultación DOLOSA o falsedad grave, el hecho pasa a GRAVE (art. 53.1.c). MENSAJE CLAVE: no es delito ' +
      'ni procede detención penal; suele ser subsanable. La valoración final corresponde a la autoridad ' +
      'competente.',
    terminos: [
      'no comunicar cambio de domicilio',
      'no actualizar el domicilio extranjeria',
      'cambio de domicilio nie',
      'no notificar cambio estado civil',
      'no comunicar cambios extranjeria',
      'empadronamiento extranjero',
      'cambio de nacionalidad no comunicado',
    ],
    cuerposCompetentes: ['guardia_civil', 'policia_nacional', 'policia_local'],
    consecuencias: [
      {
        tipo: 'identificacion',
        textoCorto:
          'Procede identificar y orientar a la subsanación (comunicación del cambio); distinguir el olvido ' +
          'leve (52.a) de la ocultación dolosa (grave, 53.1.c). Vía administrativa.',
        fuente: 'LO 4/2000 arts. 52.a y 31',
      },
    ],
    marcoImporte: 'extranjeria',
    notaRevision:
      'A VERIFICAR: art. 52.a (leve) y la frontera con el 53.1.c (ocultación dolosa/falsedad = grave). ' +
      'Importe leve hasta 500 € (55.1.a), el seed fija el techo. Revisor jurídico.',
  }),
  construirInfraccion({
    id: 'ppp-sin-licencia',
    articulo: ART_PPP_13,
    tituloCorto: 'Perro peligroso (PPP) sin licencia administrativa',
    gravedad: 'muy_grave',
    // Ley 50/1999 art. 13.5: muy graves, de 2.404,06 a 15.025,30 €. Se fija el mínimo del tramo.
    importeEur: 2404.06,
    importeReducidoEur: null,
    textoBoletin:
      'Tener un animal potencialmente peligroso (perro de raza o características de PPP) careciendo ' +
      'de la licencia administrativa preceptiva. Es infracción MUY GRAVE de la Ley 50/1999 ' +
      '(art. 13.1.b), sancionable con multa y, en su caso, comiso del animal. OJO: la mera falta de ' +
      'inscripción en el Registro (teniendo licencia) es infracción GRAVE distinta (art. 13.2.c), no ' +
      'muy grave. La valoración final corresponde a la autoridad competente.',
    terminos: [
      'perro peligroso',
      'ppp',
      'perro sin licencia',
      'pitbull sin licencia',
      'perro potencialmente peligroso',
      'sin licencia de perro peligroso',
      'perro peligroso sin registro',
      'raza peligrosa',
    ],
    cuerposCompetentes: ['guardia_civil', 'policia_local', 'policia_autonomica'],
    consecuencias: [
      {
        tipo: 'decomiso',
        textoCorto:
          'Procede valorar la intervención (comiso) cautelar del animal cuando su tenencia entrañe ' +
          'riesgo, poniéndolo a disposición de la autoridad competente (Ley 50/1999 y RD 287/2002).',
        fuente: 'Ley 50/1999 art. 13',
      },
    ],
    marcoImporte: 'animales',
    notaRevision:
      'CONFIRMADO contra el BOE (Ley 50/1999 art. 13, leído 2026-09-14): carecer de LICENCIA es MUY ' +
      'GRAVE (art. 13.1.b), multa de 2.404,06 a 15.025,30 € (art. 13.5); el seed fija el mínimo del ' +
      'tramo. NO confundir con la mera falta de INSCRIPCIÓN en el Registro (art. 13.2.c), que es GRAVE ' +
      '(300,52-2.404,05 €) — por eso esta ficha se limita a la falta de licencia. La lista de razas y el ' +
      'desarrollo están en el RD 287/2002. Ordenanza municipal y normativa autonómica (incl. Ley 7/2023) ' +
      'pueden matizar competencias. Segundo revisor humano para el cierre.',
  }),
  construirInfraccion({
    id: 'ppp-sin-bozal',
    articulo: ART_PPP_13,
    tituloCorto: 'Perro peligroso (PPP) sin bozal o suelto en vía pública',
    gravedad: 'grave',
    // Ley 50/1999 art. 13.5: graves, de 300,52 a 2.404,05 €. Se fija el mínimo del tramo.
    importeEur: 300.52,
    importeReducidoEur: null,
    textoBoletin:
      'Llevar un animal potencialmente peligroso por lugares públicos sin bozal, sin correa no ' +
      'extensible y resistente, o dejarlo suelto, incumpliendo las medidas de seguridad exigidas. Es ' +
      'infracción GRAVE de la Ley 50/1999 (art. 13.2). La valoración final corresponde a la autoridad competente.',
    terminos: [
      'perro sin bozal',
      'perro peligroso sin bozal',
      'ppp sin bozal',
      'perro suelto',
      'perro peligroso suelto',
      'sin correa',
      'perro sin correa',
      'pitbull sin bozal',
      'perro sin correa en la calle',
    ],
    cuerposCompetentes: ['guardia_civil', 'policia_local', 'policia_autonomica'],
    consecuencias: [
      {
        tipo: 'decomiso',
        textoCorto:
          'Procede valorar el aseguramiento (intervención cautelar) del animal cuando se encuentre ' +
          'suelto o sin bozal y su tenencia entrañe riesgo, poniéndolo a disposición de la autoridad ' +
          'competente hasta que se subsanen las medidas de seguridad (Ley 50/1999 y RD 287/2002).',
        fuente: 'Ley 50/1999 art. 13',
      },
    ],
    marcoImporte: 'animales',
    notaRevision:
      'CONFIRMADO contra el BOE (Ley 50/1999 art. 13, leído 2026-09-14): llevar el PPP en lugar público sin ' +
      'bozal o no sujeto con cadena es GRAVE (art. 13.2.d), multa de 300,52 a 2.404,05 € (art. 13.5); el seed ' +
      'fija el mínimo del tramo. Las medidas concretas (bozal, correa ≤ 2 m no extensible, un animal por ' +
      'persona) las detalla el RD 287/2002 y puede completarlas la ORDENANZA MUNICIPAL. El aseguramiento/ ' +
      'intervención cautelar es orientativo (art. 13 y RD 287/2002). Segundo revisor humano para el cierre.',
  }),
  // --- OLA DE ANIMALES (2026-09-11): bienestar animal (Ley 7/2023) + PPP (Ley 50/1999) ----------
  construirInfraccion({
    id: 'animal-abandono',
    articulo: ART_LBA_ABANDONO,
    tituloCorto: 'Abandono de un animal de compañía',
    gravedad: 'grave',
    // Ley 7/2023 art. 76: graves 10.001-50.000 €. Mínimo del tramo como referencia.
    importeEur: 10001,
    importeReducidoEur: null,
    textoBoletin:
      'Abandonar a un animal de compañía, o dejarlo sin la atención necesaria, cuando de ello NO se derive ' +
      'un riesgo para su vida o integridad: infracción administrativa de la Ley 7/2023. DESLINDE PENAL: si ' +
      'el animal queda en condiciones en que pueda peligrar su vida o integridad, el hecho puede ser DELITO ' +
      'del art. 340 ter CP, cuya calificación corresponde a la autoridad judicial. La valoración final ' +
      'corresponde a la autoridad competente.',
    terminos: [
      'abandono de animal',
      'abandonar perro',
      'perro abandonado',
      'tirar un animal',
      'dejar el perro atado',
      'gato abandonado',
      'camada abandonada',
      'animal abandonado en la carretera',
    ],
    cuerposCompetentes: ['guardia_civil', 'policia_local', 'policia_autonomica'],
    consecuencias: [
      {
        tipo: 'decomiso',
        textoCorto:
          'Procede valorar la recogida e intervención cautelar del animal y su puesta a disposición del ' +
          'servicio o autoridad competente (Ley 7/2023).',
        fuente: 'Ley 7/2023 art. 76',
      },
    ],
    marcoImporte: 'bienestar_animal',
    notaRevision:
      'A VERIFICAR clasificación (leve/grave/muy grave, arts. 74-76) e importe del art. 76 (grave ' +
      '10.001-50.000 €, el seed fija el mínimo). Punto SENSIBLE: deslinde con el art. 340 ter CP (abandono ' +
      'con riesgo para la vida/integridad = delito). Revisor jurídico obligatorio.',
  }),
  construirInfraccion({
    id: 'animal-no-identificacion',
    articulo: ART_LBA_IDENTIFICACION,
    tituloCorto: 'Animal sin identificar (microchip)',
    gravedad: 'grave',
    importeEur: 10001,
    importeReducidoEur: null,
    textoBoletin:
      'Tener un animal de compañía sujeto a identificación obligatoria sin el microchip o sin registrarlo ' +
      'cuando la norma lo exige (Ley 7/2023). Es el deber ESTATAL de identificación, sin perjuicio del censo ' +
      'municipal que fije la ordenanza. La valoración final corresponde a la autoridad competente.',
    terminos: [
      'perro sin chip',
      'sin microchip',
      'animal sin identificar',
      'mascota sin chip',
      'gato sin chip',
      'perro sin microchip',
      'sin chip obligatorio',
      'implantar el microchip',
    ],
    cuerposCompetentes: ['guardia_civil', 'policia_local', 'policia_autonomica'],
    consecuencias: [
      {
        tipo: 'identificacion',
        textoCorto:
          'Procede requerir la documentación e identificación del animal y de la persona responsable; la ' +
          'subsanación (implantar el microchip/registrar) no siempre excluye la sanción.',
        fuente: 'Ley 7/2023 arts. 74.b y 76',
      },
    ],
    marcoImporte: 'bienestar_animal',
    notaRevision:
      'CONFIRMADO contra el BOE (Ley 7/2023 arts. 74-76, leído 2026-09-14): "No cumplir las obligaciones de ' +
      'identificación del animal" es GRAVE (art. 74.b), tramo 10.001-50.000 € (art. 76.1.b, el seed fija el ' +
      'mínimo) —no es leve, aunque sea subsanable—. Deslindar del CENSO municipal (`ord-sctf-perro-sin-censar`): ' +
      'esta es la identificación ESTATAL. La Ley 7/2023 amplía la identificación a más especies. Segundo revisor ' +
      'humano para el cierre.',
  }),
  construirInfraccion({
    id: 'animal-maltrato-sin-lesion',
    articulo: ART_LBA_MALTRATO,
    tituloCorto: 'Maltrato animal sin lesión (administrativo)',
    gravedad: 'grave',
    importeEur: 10001,
    importeReducidoEur: null,
    textoBoletin:
      'Someter a un animal a condiciones o tratos que le causen sufrimiento o daño SIN llegar a producir una ' +
      'lesión que requiera tratamiento veterinario ni menoscabo grave de su salud: infracción administrativa ' +
      'GRAVE de la Ley 7/2023 (art. 74). DESLINDE PENAL: si el maltrato causa lesión que requiera tratamiento ' +
      'veterinario o menoscabo grave, es DELITO del art. 340 bis.1 CP; y el maltrato GRAVE o CRUEL, aun SIN ' +
      'esa lesión, también puede ser delito (art. 340 bis.4 CP). Esa frontera la fija la autoridad judicial ' +
      '(ficha `del-maltrato-animal`).',
    terminos: [
      'maltrato animal',
      'maltratar un perro',
      'pegar a un animal',
      'animal maltratado',
      'crueldad animal',
      'dar patadas a un perro',
      'tener mal a un animal',
      'maltrato sin lesiones',
    ],
    cuerposCompetentes: ['guardia_civil', 'policia_local', 'policia_autonomica'],
    consecuencias: [
      {
        tipo: 'decomiso',
        textoCorto:
          'Procede valorar la intervención cautelar del animal cuando su permanencia con el responsable ' +
          'entrañe riesgo (Ley 7/2023).',
        fuente: 'Ley 7/2023 arts. 74 y 76',
      },
    ],
    marcoImporte: 'bienestar_animal',
    notaRevision:
      'VERIFICADO contra el BOE (Ley 7/2023 arts. 73-76, leído 2026-09-14): la conducta que causa daño o ' +
      'sufrimiento SIN muerte ni secuelas graves es GRAVE (art. 74, chapeau; 10.001-50.000 €, art. 76.1.b, el ' +
      'seed fija el mínimo). Solo sería LEVE (art. 73) si NO provoca daño físico ni alteración del comportamiento. ' +
      'Punto SENSIBLE: la frontera PENAL del art. 340 bis CP es "lesión que requiere tratamiento veterinario / ' +
      'menoscabo grave"; no solaparse con la ficha penal `del-maltrato-animal`. Segundo revisor humano para el cierre.',
  }),
  construirInfraccion({
    id: 'animal-vehiculo-terraza-riesgo',
    articulo: ART_LBA_MALTRATO,
    tituloCorto: 'Animal en vehículo o terraza con riesgo (calor)',
    gravedad: 'grave',
    importeEur: 10001,
    importeReducidoEur: null,
    textoBoletin:
      'Mantener a un animal en un vehículo, terraza, azotea, balcón o espacio cerrado en condiciones (calor, ' +
      'frío, falta de ventilación, agua o espacio) que comprometan su bienestar: infracción de la Ley 7/2023. ' +
      'SITUACIÓN DE POSIBLE URGENCIA: la protección inmediata del animal prima. DESLINDE PENAL: si hay riesgo ' +
      'para la vida/integridad (p. ej. golpe de calor) puede procederse por el art. 340 ter CP; si se causa ' +
      'lesión/muerte, por el art. 340 bis.1 CP; y el maltrato grave aun sin lesión, por el 340 bis.4. La ' +
      'calificación final corresponde a la autoridad judicial.',
    terminos: [
      'perro en el coche',
      'perro encerrado en el coche al sol',
      'animal en el coche con calor',
      'perro en la terraza sin agua',
      'perro en el balcon',
      'golpe de calor perro',
      'gato encerrado en un coche',
      'animal encerrado con calor',
    ],
    cuerposCompetentes: ['guardia_civil', 'policia_local', 'policia_autonomica'],
    consecuencias: [
      {
        tipo: 'decomiso',
        textoCorto:
          'Ante riesgo inminente, procede valorar el rescate e intervención cautelar del animal y su puesta ' +
          'a disposición de la autoridad o servicios competentes; actuación según la urgencia.',
        fuente: 'Ley 7/2023 arts. 74.o y 76',
      },
    ],
    marcoImporte: 'bienestar_animal',
    notaRevision:
      'CONFIRMADO contra el BOE (Ley 7/2023 arts. 74-76, leído 2026-09-14): "Mantener de forma permanente ' +
      'perros o gatos en terrazas, balcones, azoteas, trasteros, sótanos, patios y similares o vehículos" es ' +
      'GRAVE (art. 74.o), tramo 10.001-50.000 € (art. 76.1.b, el seed fija el mínimo). Ficha SENSIBLE por el ' +
      'componente de URGENCIA: si hay riesgo para la vida (golpe de calor) el escalón PENAL es el art. 340 ter ' +
      'CP y, si hay lesión/muerte, el 340 bis CP. Segundo revisor humano para el cierre.',
  }),
  construirInfraccion({
    id: 'animal-condiciones-inadecuadas',
    articulo: ART_LBA_MALTRATO,
    tituloCorto: 'Condiciones inadecuadas / sin atención veterinaria',
    gravedad: 'grave',
    importeEur: 10001,
    importeReducidoEur: null,
    textoBoletin:
      'Mantener a un animal sin las condiciones higiénico-sanitarias, de alojamiento, alimentación o cuidado ' +
      'adecuadas, o sin procurarle la asistencia veterinaria necesaria, sin llegar al maltrato con lesión: ' +
      'infracción de la Ley 7/2023. La valoración final corresponde a la autoridad competente.',
    terminos: [
      'perro sin comida',
      'animal desnutrido',
      'sin agua el animal',
      'perro enfermo sin tratar',
      'condiciones insalubres animal',
      'animal sin cuidados',
      'perro en malas condiciones',
      'animal sin veterinario',
    ],
    cuerposCompetentes: ['guardia_civil', 'policia_local', 'policia_autonomica'],
    consecuencias: [
      {
        tipo: 'decomiso',
        textoCorto:
          'Procede valorar la intervención cautelar del animal cuando las condiciones entrañen riesgo para ' +
          'su salud (Ley 7/2023).',
        fuente: 'Ley 7/2023 arts. 74 y 76',
      },
    ],
    marcoImporte: 'bienestar_animal',
    notaRevision:
      'VERIFICADO contra el BOE (Ley 7/2023 arts. 73-76, leído 2026-09-14): mantener al animal sin las ' +
      'condiciones/cuidados/asistencia veterinaria adecuadas, cuando genera daño o sufrimiento sin muerte ni ' +
      'secuelas graves, es GRAVE (art. 74, chapeau; 10.001-50.000 €, art. 76.1.b, el seed fija el mínimo); sería ' +
      'LEVE (art. 73) solo si no provoca daño físico. Deslinde con `animal-maltrato-sin-lesion` y con el delito ' +
      '340 bis CP si hay menoscabo grave. Segundo revisor humano para el cierre.',
  }),
  construirInfraccion({
    id: 'ppp-sin-seguro',
    articulo: ART_PPP_13,
    tituloCorto: 'Perro peligroso (PPP) sin seguro de responsabilidad civil',
    gravedad: 'leve',
    // Ley 50/1999 art. 13.5: leves 150,25-300,51 €. Mínimo del tramo. Reclasificada a LEVE tras leer el
    // art. 13 en el BOE: la falta de seguro NO figura en las muy graves (13.1) ni graves (13.2), luego cae
    // en el residual del art. 13.4 (leve). El seguro es requisito de la licencia (RD 287/2002 art. 3).
    importeEur: 150.25,
    importeReducidoEur: null,
    textoBoletin:
      'Tener un animal potencialmente peligroso careciendo del seguro de responsabilidad civil por daños a ' +
      'terceros exigido para su tenencia (Ley 50/1999 y RD 287/2002). El seguro es requisito de la licencia; ' +
      'su falta, al no estar entre las infracciones graves ni muy graves del art. 13, es LEVE (art. 13.4), ' +
      'sin perjuicio de que carecer de licencia sí sea muy grave. La valoración final corresponde a la autoridad competente.',
    terminos: [
      'perro peligroso sin seguro',
      'ppp sin seguro',
      'sin seguro de responsabilidad civil',
      'pitbull sin seguro',
      'seguro del perro peligroso caducado',
      'sin poliza del perro',
      'seguro perro peligroso',
    ],
    cuerposCompetentes: ['guardia_civil', 'policia_local', 'policia_autonomica'],
    consecuencias: [
      {
        tipo: 'decomiso',
        textoCorto:
          'Procede valorar la intervención cautelar del animal cuando la tenencia incumpla los requisitos de ' +
          'seguridad; el aseguramiento y la sanción los fija la autoridad competente.',
        fuente: 'Ley 50/1999 art. 13',
      },
    ],
    marcoImporte: 'animales',
    notaRevision:
      'CONFIRMADO contra el BOE (Ley 50/1999 art. 13, leído 2026-09-14): la falta de seguro NO está entre ' +
      'las muy graves (13.1) ni las graves (13.2), por lo que es LEVE por el residual del art. 13.4 (tramo ' +
      '150,25-300,51 €, el seed fija el mínimo). El seguro es requisito de la licencia (RD 287/2002 art. 3). ' +
      'Una ordenanza municipal podría matizar. Segundo revisor humano para el cierre.',
  }),
  construirInfraccion({
    id: 'ppp-menor-conduciendo',
    articulo: ART_PPP_13,
    tituloCorto: 'PPP conducido por un menor de edad',
    gravedad: 'leve',
    // Ley 50/1999 art. 13.4 (residual: no figura en 13.1 ni 13.2) → LEVE, 150,25-300,51 € (art. 13.5). Mínimo del tramo.
    importeEur: 150.25,
    importeReducidoEur: null,
    textoBoletin:
      'Permitir que un animal potencialmente peligroso sea conducido o manejado en lugares públicos por una ' +
      'persona menor de edad. La tenencia y conducción de PPP exige licencia, reservada a mayores de edad ' +
      '(RD 287/2002 art. 3). Al no figurar en las muy graves ni graves del art. 13, es infracción LEVE ' +
      '(art. 13.4, residual); una ordenanza municipal podría graduarla distinto. La valoración final ' +
      'corresponde a la autoridad competente.',
    terminos: [
      'niño paseando perro peligroso',
      'menor con perro peligroso',
      'adolescente con pitbull',
      'ppp llevado por un menor',
      'perro peligroso con un niño',
      'menor paseando un ppp',
      'chaval con perro peligroso',
    ],
    cuerposCompetentes: ['guardia_civil', 'policia_local', 'policia_autonomica'],
    consecuencias: [
      {
        tipo: 'identificacion',
        textoCorto:
          'Procede requerir a un adulto con licencia el control del animal y valorar la intervención ' +
          'cautelar si persiste el riesgo.',
        fuente: 'Ley 50/1999 art. 13; RD 287/2002 art. 3',
      },
    ],
    marcoImporte: 'animales',
    notaRevision:
      'CONFIRMADO contra el BOE (Ley 50/1999 art. 13, leído 2026-09-14): conducir un PPP siendo menor NO figura ' +
      'entre las muy graves (13.1) ni las graves (13.2); la exigencia de mayoría de edad es del RD 287/2002 art. 3. ' +
      'Por tanto es LEVE por el residual del art. 13.4 (150,25-300,51 €, el seed fija el mínimo). Si el menor va SIN ' +
      'ningún adulto con licencia podría leerse como tenencia "sin licencia" (muy grave 13.1.b): ese matiz lo cierra ' +
      'el revisor. Una ordenanza municipal puede graduar. Segundo revisor humano para el cierre.',
  }),
  construirInfraccion({
    id: 'ppp-mas-de-uno',
    articulo: ART_PPP_13,
    tituloCorto: 'Más de un PPP por persona en la vía pública',
    gravedad: 'leve',
    // Ley 50/1999 art. 13.4 (residual: no figura en 13.1 ni 13.2) → LEVE, 150,25-300,51 € (art. 13.5). Mínimo del tramo.
    importeEur: 150.25,
    importeReducidoEur: null,
    textoBoletin:
      'Llevar a más de un animal potencialmente peligroso por persona simultáneamente en lugares públicos, ' +
      'incumpliendo la regla de "un perro por persona" (RD 287/2002 art. 8). Al no figurar en las muy graves ' +
      'ni graves del art. 13, es infracción LEVE (art. 13.4, residual); una ordenanza municipal podría graduarla ' +
      'distinto. La valoración final corresponde a la autoridad competente.',
    terminos: [
      'dos perros peligrosos a la vez',
      'varios ppp una persona',
      'pasear dos pitbull',
      'mas de un perro peligroso',
      'llevar dos perros peligrosos',
      'dos ppp una correa',
      'varios perros peligrosos juntos',
    ],
    cuerposCompetentes: ['guardia_civil', 'policia_local', 'policia_autonomica'],
    consecuencias: [
      {
        tipo: 'decomiso',
        textoCorto:
          'Procede valorar el aseguramiento del o los animales cuando el manejo simultáneo entrañe riesgo.',
        fuente: 'Ley 50/1999 art. 13; RD 287/2002 art. 8',
      },
    ],
    marcoImporte: 'animales',
    notaRevision:
      'CONFIRMADO contra el BOE (Ley 50/1999 art. 13, leído 2026-09-14): la regla "un perro por persona" ' +
      '(RD 287/2002 art. 8) NO figura en las muy graves (13.1) ni las graves (13.2); es LEVE por el residual ' +
      'del art. 13.4 (150,25-300,51 €, el seed fija el mínimo). Una ordenanza municipal puede graduar. ' +
      'Segundo revisor humano para el cierre.',
  }),
  construirInfraccion({
    id: 'ppp-transporte',
    articulo: ART_PPP_13,
    tituloCorto: 'Transporte de PPP sin medidas de seguridad',
    gravedad: 'grave',
    importeEur: 300.52,
    importeReducidoEur: null,
    textoBoletin:
      'Transportar a un animal potencialmente peligroso sin las condiciones y medidas de seguridad ' +
      'reglamentarias que eviten riesgos a personas o a otros animales (RD 287/2002). La valoración final ' +
      'corresponde a la autoridad competente.',
    terminos: [
      'transportar perro peligroso',
      'ppp en el coche sin medidas',
      'llevar pitbull en la furgoneta',
      'transporte de perro peligroso',
      'perro peligroso sin sujetar en el coche',
      'ppp mal transportado',
    ],
    cuerposCompetentes: ['guardia_civil', 'policia_local', 'policia_autonomica'],
    consecuencias: [
      {
        tipo: 'decomiso',
        textoCorto: 'Procede valorar el aseguramiento del animal cuando el transporte entrañe riesgo.',
        fuente: 'Ley 50/1999 art. 13; RD 287/2002 art. 8',
      },
    ],
    marcoImporte: 'animales',
    notaRevision:
      'CONFIRMADO contra el BOE (Ley 50/1999 art. 13, leído 2026-09-14): el transporte de PPP incumpliendo el ' +
      'art. 10 es infracción GRAVE (art. 13.2.e), multa de 300,52 a 2.404,05 € (art. 13.5); el seed fija el ' +
      'mínimo del tramo. Las condiciones concretas de transporte se desarrollan en el RD 287/2002. Segundo ' +
      'revisor humano para el cierre.',
  }),
  // --- OLA DE PARIDAD SPPLB (2026-09-14): EXTRANJERÍA (arts. 53/54) ------------------------------
  construirInfraccion({
    id: 'ext-ocultacion-dolosa-cambios',
    articulo: ART_LOEX_53_1_C,
    tituloCorto: 'Ocultación dolosa o falsedad en la comunicación de cambios',
    gravedad: 'grave',
    // LO 4/2000 art. 55.1.b: graves, multa de 501 a 10.000 €. Mínimo del tramo como referencia.
    importeEur: 501,
    importeReducidoEur: null,
    textoBoletin:
      'Ocultar de forma DOLOSA o falsear los cambios de nacionalidad, estado civil o domicilio, o las demás ' +
      'circunstancias determinantes de la situación laboral que obliga a comunicar el art. 31: infracción GRAVE ' +
      'ADMINISTRATIVA (art. 53.1.c LO 4/2000). DESLINDE: la mera omisión o el retraso, sin dolo, es LEVE (art. ' +
      '52.a). MENSAJE CLAVE: no es delito por sí sola ni procede detención penal; su tratamiento es ' +
      'administrativo. La valoración final corresponde a la autoridad competente.',
    terminos: [
      'ocultar datos extranjeria',
      'falsear datos extranjeria',
      'mentir en los datos de extranjeria',
      'ocultacion dolosa cambios',
      'falsedad estado civil extranjero',
      'ocultar domicilio real extranjeria',
      'datos falsos residencia',
    ],
    cuerposCompetentes: ['guardia_civil', 'policia_nacional', 'policia_local'],
    consecuencias: [
      {
        tipo: 'identificacion',
        textoCorto:
          'Procede identificar y documentar el hecho; distinguir el olvido leve (52.a) de la ocultación DOLOSA ' +
          'o falsedad (grave, 53.1.c). Vía administrativa; si hay falsedad documental valorar la frontera penal.',
        fuente: 'LO 4/2000 arts. 53.1.c, 52.a y 31',
      },
    ],
    marcoImporte: 'extranjeria',
    notaRevision:
      'A VERIFICAR: art. 53.1.c (ocultación dolosa/falsedad = grave) frente al 52.a (omisión/retraso = leve). ' +
      'Tramo grave 501-10.000 € (55.1.b), el seed fija el mínimo. Deslinde con la falsedad documental penal ' +
      '(arts. 390 y ss. CP) cuando se aporten documentos falsos. Revisor jurídico.',
  }),
  construirInfraccion({
    id: 'ext-incumplir-medidas-seguridad',
    articulo: ART_LOEX_53_1_D,
    tituloCorto: 'Incumplir las medidas de seguridad impuestas (presentación/alejamiento)',
    gravedad: 'grave',
    importeEur: 501,
    importeReducidoEur: null,
    textoBoletin:
      'Incumplir las medidas de seguridad pública impuestas de presentación periódica o de alejamiento de ' +
      'fronteras o de núcleos de población concretados singularmente, cuando el extranjero esté sujeto a ellas: ' +
      'infracción GRAVE ADMINISTRATIVA (art. 53.1.d LO 4/2000). Es la desatención de una medida YA acordada por ' +
      'la autoridad, no una situación irregular. MENSAJE CLAVE: no es delito por sí sola ni procede detención ' +
      'penal. La valoración final corresponde a la autoridad competente.',
    terminos: [
      'no se presenta en comisaria',
      'incumplir presentacion periodica',
      'no cumple la medida de alejamiento extranjeria',
      'salta la medida de seguridad extranjero',
      'no acude a firmar extranjeria',
      'incumplir medida cautelar extranjeria',
      'medida de presentacion incumplida',
    ],
    cuerposCompetentes: ['guardia_civil', 'policia_nacional', 'policia_local'],
    consecuencias: [
      {
        tipo: 'identificacion',
        textoCorto:
          'Procede identificar y comprobar en bases si el extranjero tiene medidas de presentación o ' +
          'alejamiento en vigor y su incumplimiento; dar parte a la autoridad que las acordó. Vía administrativa.',
        fuente: 'LO 4/2000 art. 53.1.d',
      },
    ],
    marcoImporte: 'extranjeria',
    notaRevision:
      'A VERIFICAR: art. 53.1.d (incumplir medidas de presentación periódica/alejamiento por seguridad pública). ' +
      'Tramo grave 501-10.000 € (55.1.b), el seed fija el mínimo. Confirmar el alcance de las medidas y su ' +
      'relación con los arts. 61-62 (medidas cautelares). Revisor jurídico.',
  }),
  construirInfraccion({
    id: 'ext-actividades-orden-publico',
    articulo: ART_LOEX_53_1_F,
    tituloCorto: 'Actividades contrarias al orden público (grave)',
    gravedad: 'grave',
    importeEur: 501,
    importeReducidoEur: null,
    textoBoletin:
      'Participar en la realización de actividades contrarias al orden público previstas como GRAVES en la ' +
      'normativa de protección de la seguridad ciudadana: infracción GRAVE ADMINISTRATIVA de extranjería (art. ' +
      '53.1.f LO 4/2000). DESLINDE: si son actividades contrarias a la seguridad nacional o al orden público ' +
      'calificadas como MUY GRAVES, la conducta pasa al art. 54.1.a. MENSAJE CLAVE: la sanción de extranjería es ' +
      'administrativa y no prejuzga la responsabilidad penal separada que puedan tener los hechos. La ' +
      'valoración final corresponde a la autoridad competente.',
    terminos: [
      'extranjero altera el orden publico',
      'actividades contra el orden publico extranjero',
      'extranjero en disturbios',
      'orden publico extranjeria',
      'participar en desordenes extranjero',
      'actividad contraria orden publico',
    ],
    cuerposCompetentes: ['guardia_civil', 'policia_nacional', 'policia_local'],
    consecuencias: [
      {
        tipo: 'identificacion',
        textoCorto:
          'Procede identificar y documentar los hechos; la sanción de extranjería (grave, 53.1.f) es ' +
          'administrativa y se acumula, en su caso, a la responsabilidad por la LO 4/2015 o penal de los hechos.',
        fuente: 'LO 4/2000 arts. 53.1.f y 54.1.a',
      },
    ],
    marcoImporte: 'extranjeria',
    notaRevision:
      'A VERIFICAR: art. 53.1.f (orden público GRAVE) frente al 54.1.a (seguridad nacional / orden público MUY ' +
      'GRAVE). Tramo grave 501-10.000 € (55.1.b), el seed fija el mínimo. Punto SENSIBLE: no confundir la ' +
      'sanción de extranjería con la de la LO 4/2015 ni con el delito. Revisor jurídico obligatorio.',
  }),
  construirInfraccion({
    id: 'ext-actividades-seguridad-nacional',
    articulo: ART_LOEX_54_1_A,
    tituloCorto: 'Actividades contra la seguridad nacional u orden público (muy grave)',
    gravedad: 'muy_grave',
    // LO 4/2000 art. 55.1.c: muy graves, multa de 10.001 a 100.000 €. Mínimo del tramo como referencia.
    importeEur: 10001,
    importeReducidoEur: null,
    textoBoletin:
      'Participar en actividades contrarias a la seguridad nacional o que puedan perjudicar las relaciones de ' +
      'España con otros países, o estar implicado en actividades contrarias al orden público previstas como MUY ' +
      'GRAVES: infracción MUY GRAVE ADMINISTRATIVA de extranjería (art. 54.1.a LO 4/2000). Es la modalidad ' +
      'agravada del art. 53.1.f. MENSAJE CLAVE: la sanción de extranjería es administrativa (multa o expulsión) ' +
      'y no prejuzga la responsabilidad penal separada que puedan tener los hechos. La valoración final ' +
      'corresponde a la autoridad competente.',
    terminos: [
      'extranjero seguridad nacional',
      'actividad contra la seguridad del estado extranjero',
      'extranjero orden publico muy grave',
      'amenaza a la seguridad nacional extranjeria',
      'implicado en actividades peligrosas extranjero',
      'seguridad nacional extranjeria',
    ],
    cuerposCompetentes: ['guardia_civil', 'policia_nacional', 'policia_local'],
    consecuencias: [
      {
        tipo: 'identificacion',
        textoCorto:
          'Procede identificar y dar parte a la autoridad competente; la sanción de extranjería (muy grave, ' +
          '54.1.a) es administrativa y concurre, en su caso, con la responsabilidad penal separada de los hechos.',
        fuente: 'LO 4/2000 art. 54.1.a',
      },
    ],
    marcoImporte: 'extranjeria',
    notaRevision:
      'A VERIFICAR: art. 54.1.a (muy grave) y su deslinde con el 53.1.f (grave). Tramo muy grave 10.001-100.000 € ' +
      '(55.1.c), el seed fija el mínimo. Punto SENSIBLE por su relación con el terrorismo y la seguridad del ' +
      'Estado (posible vía penal). Revisor jurídico obligatorio.',
  }),
  construirInfraccion({
    id: 'ext-favorecer-inmigracion-clandestina',
    articulo: ART_LOEX_54_1_B,
    tituloCorto: 'Favorecer con ánimo de lucro la inmigración clandestina (muy grave)',
    gravedad: 'muy_grave',
    importeEur: 10001,
    importeReducidoEur: null,
    textoBoletin:
      'Inducir, promover, favorecer o facilitar CON ÁNIMO DE LUCRO, individualmente o dentro de una ' +
      'organización, la inmigración clandestina de personas en tránsito o con destino a España, siempre que el ' +
      'hecho no constituya delito: infracción MUY GRAVE ADMINISTRATIVA (art. 54.1.b LO 4/2000). FRONTERA PENAL ' +
      'CLAVE: cuando concurren los elementos del tipo, la ayuda a la entrada, tránsito o permanencia irregular ' +
      'es DELITO del art. 318 bis CP (y, si hay explotación, trata del art. 177 bis CP), cuya calificación ' +
      'corresponde a la autoridad judicial. La valoración final corresponde a la autoridad competente.',
    terminos: [
      'favorecer inmigracion ilegal',
      'ayudar a entrar sin papeles',
      'trafico de personas administrativo',
      'promover inmigracion clandestina',
      'facilitar entrada ilegal',
      'patera con animo de lucro',
      'red de inmigracion ilegal',
    ],
    cuerposCompetentes: ['guardia_civil', 'policia_nacional', 'policia_local'],
    consecuencias: [
      {
        tipo: 'identificacion',
        textoCorto:
          'Procede identificar y valorar los indicios: si hay ánimo de lucro y elementos del tipo, la vía es ' +
          'PENAL (art. 318 bis CP; trata, 177 bis CP), no la mera sanción administrativa. Dar parte y coordinar.',
        fuente: 'LO 4/2000 art. 54.1.b; arts. 318 bis y 177 bis CP',
      },
    ],
    marcoImporte: 'extranjeria',
    notaRevision:
      'A VERIFICAR: art. 54.1.b (muy grave), tramo 10.001-100.000 € (55.1.c), el seed fija el mínimo. Punto MUY ' +
      'SENSIBLE: la cláusula "siempre que no constituya delito" hace que en la práctica lo habitual sea la vía ' +
      'PENAL del art. 318 bis CP (y trata, 177 bis CP). Confirmar el deslinde con el revisor jurídico.',
  }),
  construirInfraccion({
    id: 'ext-matrimonio-conveniencia',
    articulo: ART_LOEX_54_1_F,
    tituloCorto: 'Simular relación laboral con extranjero para papeles (muy grave)',
    gravedad: 'muy_grave',
    importeEur: 10001,
    importeReducidoEur: null,
    textoBoletin:
      'Simular con ánimo de lucro una relación laboral con un extranjero para facilitarle la obtención de ' +
      'una autorización de residencia o trabajo: infracción MUY GRAVE ADMINISTRATIVA (art. 54.1.f LO ' +
      '4/2000). DESLINDE IMPORTANTE: el "matrimonio de conveniencia" NO es esta infracción; se combate por ' +
      'la vía de la nulidad / fraude de ley y, en su caso, por falsedad documental (arts. 390 y ss. CP) o ' +
      'favorecimiento de la inmigración clandestina (art. 318 bis CP), no por el art. 54.1.f. MENSAJE ' +
      'CLAVE: su tratamiento es administrativo, sin perjuicio de la posible vía penal. La valoración final ' +
      'corresponde a la autoridad competente.',
    terminos: [
      'matrimonio de conveniencia',
      'boda por papeles',
      'casarse por los papeles',
      'matrimonio fraudulento extranjeria',
      'simular relacion laboral extranjero',
      'contrato falso para papeles',
      'matrimonio blanco',
    ],
    cuerposCompetentes: ['guardia_civil', 'policia_nacional', 'policia_local'],
    consecuencias: [
      {
        tipo: 'identificacion',
        textoCorto:
          'Procede identificar y documentar los indicios de simulación de la relación laboral ficticia ' +
          'para el expediente; vía administrativa, con posible frontera penal por falsedad documental o 318 bis.',
        fuente: 'LO 4/2000 art. 54.1.f',
      },
    ],
    marcoImporte: 'extranjeria',
    notaRevision:
      'VERIFICADO contra el BOE (LO 4/2000 art. 54.1.f, leído 2026-09-14): el tipo es "promover, favorecer o ' +
      'facilitar con ánimo de lucro la inmigración clandestina / SIMULAR una relación laboral con un extranjero" ' +
      '(muy grave). CLAVE: el "matrimonio de conveniencia" NO encaja en este apartado —se combate por nulidad/ ' +
      'fraude de ley y, en su caso, falsedad documental (arts. 390 y ss. CP) o 318 bis CP—, por eso la ficha lo ' +
      'deslinda. Tramo muy grave 10.001-100.000 € (55.1.c), el seed fija el mínimo. Segundo revisor humano para ' +
      'el cierre por lo SENSIBLE del deslinde.',
  }),
  // --- OLA DE PARIDAD SPPLB (2026-09-14): ANIMALES (Ley 50/1999 y Ley 7/2023) --------------------
  construirInfraccion({
    id: 'ppp-adiestramiento-ataque',
    articulo: ART_PPP_13,
    tituloCorto: 'Adiestrar un PPP para el ataque o las peleas',
    gravedad: 'muy_grave',
    // Ley 50/1999 art. 13.5: muy graves, de 2.404,06 a 15.025,30 €. Mínimo del tramo.
    importeEur: 2404.06,
    importeReducidoEur: null,
    textoBoletin:
      'Adiestrar a un animal potencialmente peligroso para activar su agresividad, para el ataque o para ' +
      'finalidades prohibidas, así como adiestrarlo sin la habilitación oficial exigida: infracción MUY GRAVE de ' +
      'la Ley 50/1999 (art. 13.1). DESLINDE PENAL: organizar o participar en PELEAS de perros puede ser DELITO ' +
      'del art. 340 bis CP, cuya calificación corresponde a la autoridad judicial. La valoración final ' +
      'corresponde a la autoridad competente.',
    terminos: [
      'adiestrar perro para atacar',
      'entrenar perro para pelea',
      'perro adiestrado para el ataque',
      'adiestramiento de ataque ppp',
      'perro de pelea',
      'entrenar pitbull para pelear',
      'adiestrar para agresividad',
    ],
    cuerposCompetentes: ['guardia_civil', 'policia_local', 'policia_autonomica'],
    consecuencias: [
      {
        tipo: 'decomiso',
        textoCorto:
          'Procede valorar la intervención cautelar del animal y dar parte; si hay peleas organizadas, valorar ' +
          'la frontera penal (art. 340 bis CP).',
        fuente: 'Ley 50/1999 art. 13; art. 340 bis CP',
      },
    ],
    marcoImporte: 'animales',
    notaRevision:
      'CONFIRMADO contra el BOE (Ley 50/1999 art. 13, leído 2026-09-14): adiestrar un PPP para activar la ' +
      'agresividad (art. 13.1.d) y adiestrarlo sin la habilitación/certificado oficial (art. 13.1.e) son MUY ' +
      'GRAVES, tramo 2.404,06-15.025,30 € (art. 13.5), el seed fija el mínimo. Deslinde PENAL con el art. 340 bis ' +
      'CP (peleas de animales) para no solaparse con la ficha penal. Segundo revisor humano para el cierre.',
  }),
  construirInfraccion({
    id: 'animal-venta-ilegal',
    articulo: ART_LBA_COMERCIO,
    tituloCorto: 'Venta o comercio ilegal de animales',
    gravedad: 'muy_grave',
    // Ley 7/2023 art. 76.1.c: muy graves 50.001-200.000 €. Mínimo del tramo como referencia.
    importeEur: 50001,
    importeReducidoEur: null,
    textoBoletin:
      'Criar, comerciar o exponer animales con fines comerciales sin estar autorizado, o vender perros, gatos ' +
      'y hurones en tiendas de animales: infracción MUY GRAVE de la Ley 7/2023 (art. 75.f). Incluye la venta ' +
      'ambulante, en establecimientos no autorizados o por criadores no registrados. La valoración final ' +
      'corresponde a la autoridad competente.',
    terminos: [
      'venta ilegal de animales',
      'vender cachorros en la calle',
      'venta ambulante de perros',
      'criadero ilegal',
      'vender mascotas sin licencia',
      'venta de animales por internet',
      'comprar perro sin papeles',
    ],
    cuerposCompetentes: ['guardia_civil', 'policia_local', 'policia_autonomica'],
    consecuencias: [
      {
        tipo: 'decomiso',
        textoCorto:
          'Procede identificar al vendedor, requerir la documentación y valorar la intervención cautelar de los ' +
          'animales ofrecidos ilegalmente, poniéndolos a disposición de la autoridad competente (Ley 7/2023).',
        fuente: 'Ley 7/2023 arts. 75 y 76',
      },
    ],
    marcoImporte: 'bienestar_animal',
    notaRevision:
      'CORREGIDO y CONFIRMADO contra el BOE (Ley 7/2023 arts. 75-76, leído 2026-09-14): la cría/comercio/ ' +
      'exposición con fines comerciales por NO autorizados y la venta de perros, gatos y hurones en tiendas ' +
      'es MUY GRAVE (art. 75.f), no grave —se reclasifica de grave/10.001 € a muy grave/50.001 € (tramo ' +
      '50.001-200.000 €, art. 76.1.c; el seed fija el mínimo)—. Concurre normativa AUTONÓMICA y de núcleos ' +
      'zoológicos. Segundo revisor humano para el cierre.',
  }),
  construirInfraccion({
    id: 'animal-uso-espectaculos',
    articulo: ART_LBA_ESPECTACULOS,
    tituloCorto: 'Uso de animales en peleas o espectáculos que causan sufrimiento',
    gravedad: 'muy_grave',
    // Ley 7/2023 art. 76: muy graves 50.001-200.000 €. Mínimo del tramo como referencia.
    importeEur: 50001,
    importeReducidoEur: null,
    textoBoletin:
      'Utilizar animales en peleas o en espectáculos, atracciones u otras actividades que les causen sufrimiento ' +
      'o sean contrarias a su bienestar, cuando estén prohibidos por la Ley 7/2023: infracción MUY GRAVE (art. ' +
      '75). DESLINDE PENAL: organizar o participar en PELEAS de animales puede ser DELITO del art. 340 bis CP, ' +
      'cuya calificación corresponde a la autoridad judicial. La valoración final corresponde a la autoridad ' +
      'competente.',
    terminos: [
      'peleas de perros',
      'peleas de gallos',
      'animales en espectaculos',
      'usar animales en atracciones',
      'espectaculo con animales prohibido',
      'exhibicion de animales con sufrimiento',
      'pelea de animales',
    ],
    cuerposCompetentes: ['guardia_civil', 'policia_local', 'policia_autonomica'],
    consecuencias: [
      {
        tipo: 'decomiso',
        textoCorto:
          'Procede valorar la intervención cautelar de los animales y dar parte; si hay peleas organizadas, la ' +
          'vía puede ser PENAL (art. 340 bis CP). Coordinar con la autoridad competente.',
        fuente: 'Ley 7/2023 arts. 75 y 76; art. 340 bis CP',
      },
    ],
    marcoImporte: 'bienestar_animal',
    notaRevision:
      'CONFIRMADO contra el BOE (Ley 7/2023 arts. 75-76, leído 2026-09-14): adiestrar/usar animales para PELEAS ' +
      'o riñas (art. 75.c) y el uso de animales en ACTIVIDADES PROHIBIDAS —culturales/festivas, atracciones, ' +
      'carruseles, fauna silvestre en circo— (art. 75.g) son MUY GRAVES, tramo 50.001-200.000 € (art. 76.1.c, ' +
      'el seed fija el mínimo). Deslinde PENAL con el art. 340 bis CP (peleas de animales) para no solaparse con ' +
      'la ficha penal. Las excepciones (festejos tradicionales autorizados) las fija el desarrollo normativo. ' +
      'Segundo revisor humano para el cierre.',
  }),
  construirInfraccion({
    id: 'animal-metodos-crueles',
    articulo: ART_LBA_MALTRATO,
    tituloCorto: 'Uso de collar eléctrico u otros métodos que causan daño',
    gravedad: 'grave',
    importeEur: 10001,
    importeReducidoEur: null,
    textoBoletin:
      'Emplear con un animal collares eléctricos, de ahogo, de púas u otros instrumentos o métodos que le ' +
      'causen daño, dolor o sufrimiento innecesario, prohibidos por la Ley 7/2023: infracción de la citada ley ' +
      '(condiciones de mantenimiento y trato, art. 74). DESLINDE PENAL: si el método causa lesión que requiera ' +
      'tratamiento veterinario o menoscabo grave, el hecho puede ser DELITO del art. 340 bis CP. La valoración ' +
      'final corresponde a la autoridad competente.',
    terminos: [
      'collar electrico perro',
      'collar de pinchos',
      'collar de ahogo',
      'metodos crueles con animales',
      'castigar al perro con descargas',
      'collar de castigo',
      'instrumento que hace dano al animal',
    ],
    cuerposCompetentes: ['guardia_civil', 'policia_local', 'policia_autonomica'],
    consecuencias: [
      {
        tipo: 'decomiso',
        textoCorto:
          'Procede requerir la retirada del instrumento prohibido y valorar la intervención cautelar del animal ' +
          'si su permanencia con el responsable entrañe riesgo (Ley 7/2023).',
        fuente: 'Ley 7/2023 arts. 74 y 76',
      },
    ],
    marcoImporte: 'bienestar_animal',
    notaRevision:
      'VERIFICADO contra el BOE (Ley 7/2023 arts. 74-76, leído 2026-09-14): el uso de métodos AGRESIVOS o ' +
      'VIOLENTOS en la educación del animal (collar eléctrico/de ahogo/de púas usados como castigo) es GRAVE ' +
      '(art. 74.c), tramo 10.001-50.000 € (art. 76.1.b, el seed fija el mínimo). Si el método causa daño con ' +
      'secuelas permanentes graves sube a 74.a (grave) y, si hay muerte, a 75.a (muy grave); si la lesión ' +
      'requiere tratamiento veterinario puede ser DELITO del art. 340 bis CP. Segundo revisor humano para el cierre.',
  }),
  construirInfraccion({
    id: 'animal-dejar-sin-atencion',
    articulo: ART_LBA_MALTRATO,
    tituloCorto: 'Dejar al animal solo o atado sin la atención necesaria',
    gravedad: 'grave',
    importeEur: 10001,
    importeReducidoEur: null,
    textoBoletin:
      'Dejar a un animal de compañía sin la supervisión y atención necesarias durante un tiempo prolongado, o ' +
      'mantenerlo atado de forma permanente o limitando gravemente su movimiento, incumpliendo la Ley 7/2023 ' +
      '(que, por ejemplo, prohíbe dejar a los perros solos más del tiempo reglamentado). DESLINDE: si el animal ' +
      'queda en situación de desamparo estable es ABANDONO (ficha `animal-abandono`) y, con riesgo para su vida, ' +
      'puede ser DELITO del art. 340 ter CP. La valoración final corresponde a la autoridad competente.',
    terminos: [
      'perro solo mucho tiempo',
      'perro atado todo el dia',
      'dejar al perro solo en casa',
      'animal atado permanentemente',
      'perro encadenado',
      'dejar al perro sin atencion',
      'perro atado sin moverse',
    ],
    cuerposCompetentes: ['guardia_civil', 'policia_local', 'policia_autonomica'],
    consecuencias: [
      {
        tipo: 'decomiso',
        textoCorto:
          'Procede valorar la intervención cautelar del animal cuando la falta de atención entrañe riesgo para ' +
          'su bienestar; distinguir de la recogida por abandono. (Ley 7/2023).',
        fuente: 'Ley 7/2023 arts. 74 y 76',
      },
    ],
    marcoImporte: 'bienestar_animal',
    notaRevision:
      'CONTRASTADO con el BOE (Ley 7/2023 arts. 73-76, leído 2026-09-14): NO hay una letra específica de ' +
      '"dejar sin atención" en el art. 74; la clasificación GRAVE se apoya en el CHAPEAU del art. 74 (conducta ' +
      'que implica daño o sufrimiento sin muerte ni secuelas graves) —si NO hay daño ni alteración de conducta ' +
      'sería LEVE (art. 73)—. Tramo grave 10.001-50.000 € (art. 76.1.b, el seed fija el mínimo). El límite ' +
      'temporal concreto (tiempo máximo de perros solos) lo fija el DESARROLLO REGLAMENTARIO, aún pendiente. ' +
      'Deslinde con el ABANDONO (`animal-abandono`, 74.k) y con el delito del art. 340 ter CP. El 2.º revisor ' +
      'humano fija la letra/graduación definitiva por ser un supuesto de intensidad variable.',
  }),
  construirInfraccion({
    id: 'animal-especie-no-permitida',
    articulo: ART_LBA_LISTADO,
    tituloCorto: 'Tener una especie no incluida en el listado positivo',
    gravedad: 'grave',
    importeEur: 10001,
    importeReducidoEur: null,
    textoBoletin:
      'Tener como animal de compañía una especie NO incluida en el "listado positivo" de la Ley 7/2023 (fauna ' +
      'silvestre o exótica no permitida) sin amparo legal ni el régimen transitorio aplicable: infracción de la ' +
      'citada ley (grave, art. 74; puede ser muy grave si es especie de especial protección o del catálogo de ' +
      'invasoras). Puede proceder el comiso del animal. La valoración final corresponde a la autoridad competente.',
    terminos: [
      'tener un animal exotico',
      'mascota exotica prohibida',
      'animal silvestre en casa',
      'especie no permitida como mascota',
      'tener un reptil peligroso',
      'animal fuera del listado positivo',
      'mascota ilegal exotica',
    ],
    cuerposCompetentes: ['guardia_civil', 'policia_local', 'policia_autonomica'],
    consecuencias: [
      {
        tipo: 'decomiso',
        textoCorto:
          'Procede identificar al tenedor, comprobar si la especie está permitida o amparada por el régimen ' +
          'transitorio y valorar el comiso y traslado del animal a un centro autorizado (Ley 7/2023).',
        fuente: 'Ley 7/2023 arts. 74 y 76',
      },
    ],
    marcoImporte: 'bienestar_animal',
    notaRevision:
      'CONTRASTADO con el BOE (Ley 7/2023 arts. 74-76, leído 2026-09-14): el art. 74 NO tipifica de forma ' +
      'expresa la MERA tenencia de una especie fuera del listado positivo; la letra más próxima es 74.h (criar ' +
      'silvestres alóctonos o comerciar con ellos, grave). Además, el LISTADO POSITIVO y su régimen transitorio ' +
      'están pendientes de DESARROLLO REGLAMENTARIO, por lo que la tenencia queda como grave orientativa (art. 74; ' +
      '10.001-50.000 €, art. 76.1.b, el seed fija el mínimo), pudiendo ser MUY GRAVE si es especie protegida o ' +
      'invasora. Concurren la Ley 42/2007 y el catálogo de invasoras (RD 630/2013). El 2.º revisor humano cierra ' +
      'la clasificación cuando el reglamento esté publicado.',
  }),
  // --- 2.ª OLEADA de ANIMALES (paridad SPPLB, 2026-09-14): PPP (Ley 50/1999) ---------------------
  construirInfraccion({
    id: 'ppp-abandono',
    articulo: ART_PPP_13,
    tituloCorto: 'Abandono de un animal potencialmente peligroso (PPP)',
    gravedad: 'muy_grave',
    // Ley 50/1999 art. 13.5: muy graves, de 2.404,06 a 15.025,30 €. Mínimo del tramo.
    importeEur: 2404.06,
    importeReducidoEur: null,
    textoBoletin:
      'Abandonar a un animal potencialmente peligroso (perro de raza o características de PPP): la propia ' +
      'Ley 50/1999 lo tipifica como infracción MUY GRAVE específica (art. 13.1), distinta y más severa que ' +
      'el abandono ordinario de la Ley 7/2023. DESLINDE PENAL: si del abandono se deriva riesgo para la ' +
      'vida/integridad del animal puede ser DELITO del art. 340 ter CP; y por su peligrosidad puede haber ' +
      'riesgo para terceros. La valoración final corresponde a la autoridad competente.',
    terminos: [
      'abandonar perro peligroso',
      'ppp abandonado',
      'perro peligroso abandonado',
      'soltar un pitbull',
      'abandono de ppp',
      'dejar tirado un perro peligroso',
      'pitbull abandonado',
    ],
    cuerposCompetentes: ['guardia_civil', 'policia_local', 'policia_autonomica'],
    consecuencias: [
      {
        tipo: 'decomiso',
        textoCorto:
          'Procede la recogida e intervención cautelar del animal (con las cautelas por su peligrosidad) y su ' +
          'puesta a disposición de la autoridad o servicio competente (Ley 50/1999 y RD 287/2002).',
        fuente: 'Ley 50/1999 art. 13',
      },
    ],
    marcoImporte: 'animales',
    notaRevision:
      'CONFIRMADO contra el BOE (Ley 50/1999 art. 13, leído 2026-09-14): el abandono de un PPP es MUY GRAVE ' +
      '(art. 13.1.a), tramo 2.404,06-15.025,30 € (art. 13.5), el seed fija el mínimo. Deslinde con el abandono ' +
      'ordinario de la Ley 7/2023 (`animal-abandono`) y con el delito del art. 340 ter CP. Segundo revisor humano ' +
      'para el cierre.',
  }),
  construirInfraccion({
    id: 'ppp-suelto-sin-bozal-ni-correa',
    articulo: ART_PPP_13,
    tituloCorto: 'PPP suelto y a la vez sin bozal ni correa en la vía pública',
    gravedad: 'grave',
    // Ley 50/1999 art. 13.5: graves, de 300,52 a 2.404,05 €. Mínimo del tramo.
    importeEur: 300.52,
    importeReducidoEur: null,
    textoBoletin:
      'Dejar suelto en un lugar público a un animal potencialmente peligroso careciendo AL MISMO TIEMPO de ' +
      'bozal y de correa no extensible, con incumplimiento acumulado de las medidas de seguridad exigidas: ' +
      'infracción GRAVE de la Ley 50/1999 (art. 13.2). Es la modalidad AGRAVADA de campo/calle frente a la ' +
      'simple falta de bozal, por la mayor peligrosidad de la situación. La valoración final corresponde a la ' +
      'autoridad competente.',
    terminos: [
      'perro peligroso suelto sin bozal ni correa',
      'ppp suelto sin bozal y sin correa',
      'pitbull suelto sin nada',
      'perro peligroso corriendo suelto',
      'ppp sin control en la calle',
      'perro peligroso sin bozal y suelto',
      'perro peligroso sin correa ni bozal',
    ],
    cuerposCompetentes: ['guardia_civil', 'policia_local', 'policia_autonomica'],
    consecuencias: [
      {
        tipo: 'decomiso',
        textoCorto:
          'Procede valorar el aseguramiento (intervención cautelar) inmediato del animal por el riesgo que ' +
          'entraña estar suelto y sin bozal ni correa, poniéndolo a disposición de la autoridad competente ' +
          '(Ley 50/1999 y RD 287/2002).',
        fuente: 'Ley 50/1999 art. 13',
      },
    ],
    marcoImporte: 'animales',
    notaRevision:
      'CONFIRMADO contra el BOE (Ley 50/1999 art. 13, leído 2026-09-14): llevar un PPP en lugar público sin ' +
      'bozal o no sujeto con cadena es GRAVE (art. 13.2.d), tramo 300,52-2.404,05 € (art. 13.5); el seed fija ' +
      'el mínimo, pero el cúmulo de incumplimientos (suelto + sin bozal + sin correa) justificaría subir en la ' +
      'horquilla. No duplicar con `ppp-sin-bozal`: aquí concurren varias faltas a la vez. Segundo revisor humano ' +
      'para el cierre.',
  }),
  construirInfraccion({
    id: 'ppp-no-comunicar-incidencias',
    articulo: ART_PPP_13,
    tituloCorto: 'No comunicar venta, traspaso, robo, pérdida o muerte del PPP',
    gravedad: 'leve',
    importeEur: 150.25,
    importeReducidoEur: null,
    textoBoletin:
      'No comunicar al Registro de Animales Potencialmente Peligrosos, en el plazo reglamentario, la venta, ' +
      'traspaso, donación, robo, muerte o pérdida del animal, o el cambio de domicilio del titular: ' +
      'incumplimiento de los deberes registrales de la Ley 50/1999 y del RD 287/2002. La valoración final ' +
      'corresponde a la autoridad competente.',
    terminos: [
      'no comunicar venta del perro peligroso',
      'no dar de baja al ppp',
      'no comunicar muerte del perro peligroso',
      'no notificar robo del ppp',
      'perro peligroso vendido sin avisar',
      'traspaso de perro peligroso sin comunicar',
      'no actualizar el registro de ppp',
    ],
    cuerposCompetentes: ['guardia_civil', 'policia_local', 'policia_autonomica'],
    consecuencias: [
      {
        tipo: 'identificacion',
        textoCorto:
          'Procede identificar al titular, comprobar la inscripción registral y requerir la comunicación ' +
          'pendiente; la subsanación no siempre excluye la sanción.',
        fuente: 'Ley 50/1999 art. 13; RD 287/2002 art. 5',
      },
    ],
    marcoImporte: 'animales',
    notaRevision:
      'A VERIFICAR (revisor de animales): la obligación de comunicar al Registro la venta/traspaso/robo/muerte/ ' +
      'pérdida y el cambio de domicilio está en el RD 287/2002 (art. 5). RECLASIFICADA a LEVE (revisor 2ª ' +
      'oleada): el art. 13.2 grave tipifica OMITIR la inscripción inicial, no las actualizaciones posteriores; ' +
      'estas encajan mejor en el residual LEVE del art. 13.4 (tramo 150,25-300,51 €, el seed fija el mínimo). ' +
      'A verificar la letra exacta.',
  }),
  construirInfraccion({
    id: 'ppp-criar-comerciar-sin-autorizacion',
    articulo: ART_PPP_13,
    tituloCorto: 'Criar o comerciar con PPP sin autorización',
    gravedad: 'muy_grave',
    // Ley 50/1999 art. 13.5: muy graves, de 2.404,06 a 15.025,30 €. Mínimo del tramo.
    importeEur: 2404.06,
    importeReducidoEur: null,
    textoBoletin:
      'Criar, adiestrar o comercializar animales potencialmente peligrosos incumpliendo la obligación de ' +
      'estar en posesión de la licencia y de la inscripción correspondientes, o al margen de las condiciones ' +
      'legalmente exigidas (Ley 50/1999, art. 4). Se tipifica como infracción MUY GRAVE (art. 13.1). La ' +
      'valoración final corresponde a la autoridad competente.',
    terminos: [
      'criar perros peligrosos sin licencia',
      'vender pitbulls sin autorizacion',
      'criadero de perros peligrosos ilegal',
      'comerciar con ppp',
      'venta de perros peligrosos sin permiso',
      'criar ppp para vender',
      'negocio de perros peligrosos ilegal',
    ],
    cuerposCompetentes: ['guardia_civil', 'policia_local', 'policia_autonomica'],
    consecuencias: [
      {
        tipo: 'decomiso',
        textoCorto:
          'Procede identificar al responsable, requerir licencias e inscripciones y valorar la intervención ' +
          'cautelar de los animales criados o comercializados sin autorización (Ley 50/1999 y RD 287/2002).',
        fuente: 'Ley 50/1999 arts. 4 y 13',
      },
    ],
    marcoImporte: 'animales',
    notaRevision:
      'VERIFICADO PARCIAL contra el BOE (Ley 50/1999 art. 13, leído 2026-09-14): la cría/comercio de PPP se ' +
      'somete a licencia (art. 4). El anclaje MUY GRAVE es sólido: quien cría/comercia sin licencia incurre en ' +
      'la "tenencia sin licencia" (art. 13.1.b) y, al vender/transmitir a quien carece de licencia, en el art. ' +
      '13.1.c. Tramo muy grave 2.404,06-15.025,30 € (art. 13.5), el seed fija el mínimo. Deslinde: la LETRA exacta ' +
      '(13.1.b vs 13.1.c según se impute tenencia o transmisión) la fija el segundo revisor humano. Concurre la ' +
      'normativa de NÚCLEOS ZOOLÓGICOS (autonómica) y la Ley 7/2023 (`animal-venta-ilegal`).',
  }),
  construirInfraccion({
    id: 'ppp-sin-cartel-advertencia',
    articulo: ART_PPP_13,
    tituloCorto: 'Instalación con PPP sin cartel de advertencia',
    gravedad: 'leve',
    // Ley 50/1999 art. 13.5: leves, de 150,25 a 300,51 €. Mínimo del tramo.
    importeEur: 150.25,
    importeReducidoEur: null,
    textoBoletin:
      'Mantener un animal potencialmente peligroso en una vivienda, finca o instalación sin colocar en lugar ' +
      'visible el cartel de advertencia de su presencia que exige la normativa de desarrollo (RD 287/2002). Es ' +
      'una medida de seguridad de tipo formal cuyo incumplimiento suele encuadrarse como infracción LEVE. La ' +
      'valoración final corresponde a la autoridad competente.',
    terminos: [
      'sin cartel de perro peligroso',
      'finca con perro peligroso sin aviso',
      'falta cartel peligro perro',
      'casa con ppp sin señalizar',
      'no avisa que hay perro peligroso',
      'sin señal de perro peligroso',
      'perro peligroso sin cartel de advertencia',
    ],
    cuerposCompetentes: ['guardia_civil', 'policia_local', 'policia_autonomica'],
    consecuencias: [
      {
        tipo: 'identificacion',
        textoCorto:
          'Procede identificar al responsable y requerir la colocación del cartel de advertencia; se trata de ' +
          'una medida de seguridad formal, normalmente subsanable.',
        fuente: 'Ley 50/1999 art. 13; RD 287/2002',
      },
    ],
    marcoImporte: 'animales',
    notaRevision:
      'A VERIFICAR (revisor de animales): la obligación de señalizar con cartel la presencia de un PPP es del ' +
      'RD 287/2002 (desarrollo); su clasificación como LEVE debe anclarse a la LETRA del art. 13.4 Ley 50/1999 ' +
      '(o remitirse a la ORDENANZA municipal). Tramo leve 150,25-300,51 € (art. 13.5), el seed fija el mínimo. ' +
      'Reclasificar tras el visto bueno del revisor.',
  }),
  // --- 2.ª OLEADA de ANIMALES (paridad SPPLB, 2026-09-14): BIENESTAR (Ley 7/2023) ----------------
  construirInfraccion({
    id: 'animal-no-vacunar-desparasitar',
    articulo: ART_LBA_SANIDAD,
    tituloCorto: 'No vacunar o desparasitar al animal cuando es obligatorio',
    gravedad: 'leve',
    // Reclasificada a LEVE (revisor 2ª oleada): sin daño físico encaja en el art. 73 (leve, 500-10.000 €);
    // el seed fija el mínimo del tramo leve. Gran parte del calendario sanitario está pendiente de reglamento/CCAA.
    importeEur: 500,
    importeReducidoEur: null,
    textoBoletin:
      'No someter al animal a las vacunaciones y tratamientos antiparasitarios obligatorios, o a las revisiones ' +
      'veterinarias exigidas para prevenir enfermedades y zoonosis, incumpliendo la Ley 7/2023 y la normativa ' +
      'sanitaria. La valoración final corresponde a la autoridad competente.',
    terminos: [
      'perro sin vacunar',
      'animal sin vacunas',
      'sin la rabia el perro',
      'perro sin desparasitar',
      'no vacunar al gato',
      'mascota sin vacunas obligatorias',
      'animal sin cartilla veterinaria',
    ],
    cuerposCompetentes: ['guardia_civil', 'policia_local', 'policia_autonomica'],
    consecuencias: [
      {
        tipo: 'identificacion',
        textoCorto:
          'Procede identificar al responsable y requerir la cartilla/documentación sanitaria; orientar a la ' +
          'regularización del calendario vacunal, sin que ello excluya siempre la sanción.',
        fuente: 'Ley 7/2023 arts. 74 y 76',
      },
    ],
    marcoImporte: 'bienestar_animal',
    notaRevision:
      'VERIFICADO contra el BOE (Ley 7/2023 arts. 73-76, leído 2026-09-14): no vacunar/desparasitar, al no ' +
      'provocar daño físico, NO figura en las graves del art. 74; encaja en el residual LEVE del art. 73 (tramo ' +
      '500-10.000 €, art. 76.1.a, el seed fija el mínimo). Gran parte del calendario sanitario lo fijan la CCAA y ' +
      'el reglamento (rabia obligatoria según comunidad), por lo que su exigibilidad general está pendiente de ' +
      'desarrollo. Segundo revisor humano para el cierre.',
  }),
  construirInfraccion({
    id: 'animal-mendicidad',
    articulo: ART_LBA_MENDICIDAD,
    tituloCorto: 'Uso de animales en la mendicidad (consulta)',
    gravedad: 'leve', // valor de relleno; entrada CONSULTABLE sin importe (no tipificada de forma autónoma)
    importeEur: null,
    importeReducidoEur: null,
    textoBoletin:
      'ENTRADA DE CONSULTA (no sancionadora por sí sola). El uso de animales en la mendicidad NO está ' +
      'tipificado como infracción autónoma con letra propia en la Ley 7/2023 (a verificar). Según el caso, ' +
      'la vía puede ser: ordenanza municipal de mendicidad; protección del menor si hay menores implicados; ' +
      'o, si hay trato cruel o sufrimiento del animal, el DELITO del art. 340 bis CP. La valoración final ' +
      'corresponde a la autoridad competente.',
    terminos: [
      'mendigo con perro',
      'usar perro para pedir dinero',
      'animal para mendigar',
      'pedir limosna con un animal',
      'perro utilizado en la mendicidad',
      'cachorro para dar pena y pedir',
      'mendicidad con animales',
    ],
    cuerposCompetentes: ['guardia_civil', 'policia_local', 'policia_autonomica'],
    consecuencias: [
      {
        tipo: 'decomiso',
        textoCorto:
          'Procede identificar al responsable y valorar la intervención cautelar del animal cuando su uso en la ' +
          'mendicidad comprometa su bienestar, poniéndolo a disposición de la autoridad o servicio competente.',
        fuente: 'Ley 7/2023 arts. 74 y 76',
      },
    ],
    marcoImporte: 'no_sancionador',
    notaRevision:
      'CONFIRMADO contra el BOE (Ley 7/2023 arts. 73-75, leídos 2026-09-14): NINGUNA letra de los arts. 74/75 ' +
      'tipifica la mendicidad con animales como infracción autónoma. Se mantiene como CONSULTABLE (importe null, ' +
      'no_sancionador); la orientación remite a la ordenanza municipal de mendicidad, a la protección del menor ' +
      'si hay menores implicados, y al DELITO del art. 340 bis CP si hay trato cruel. Si una CCAA la tipifica, ' +
      'reintroducir con su marco e importe. Segundo revisor humano para el cierre.',
  }),
  construirInfraccion({
    id: 'animal-sacrificio-injustificado',
    articulo: ART_LBA_SACRIFICIO,
    tituloCorto: 'Sacrificar a un animal de compañía sin causa justificada',
    gravedad: 'muy_grave',
    // Ley 7/2023 art. 76: muy graves 50.001-200.000 €. Mínimo del tramo como referencia.
    importeEur: 50001,
    importeReducidoEur: null,
    textoBoletin:
      'Sacrificar a un animal de compañía sin las causas legalmente admitidas (seguridad de personas o ' +
      'animales, razones sanitarias o sufrimiento irreversible) o sin control veterinario, en contra de la Ley ' +
      '7/2023 (sacrificio cero): infracción MUY GRAVE (art. 75). DESLINDE PENAL: matar a un animal causándole ' +
      'sufrimiento, o cuando concurran los elementos del tipo, es DELITO del art. 340 bis CP, cuya calificación ' +
      'corresponde a la autoridad judicial. La valoración final corresponde a la autoridad competente.',
    terminos: [
      'sacrificar un perro sano',
      'matar un animal sin motivo',
      'sacrificio de animal injustificado',
      'sacrificar gatos',
      'eutanasia de perro sin causa',
      'matar mascota sin razon',
      'sacrificio cero animales',
    ],
    cuerposCompetentes: ['guardia_civil', 'policia_local', 'policia_autonomica'],
    consecuencias: [
      {
        tipo: 'decomiso',
        textoCorto:
          'Procede documentar los hechos y dar parte; si el sacrificio causó sufrimiento o muerte, valorar la ' +
          'frontera penal (art. 340 bis CP) y coordinar con la autoridad judicial.',
        fuente: 'Ley 7/2023 arts. 75 y 76; art. 340 bis CP',
      },
    ],
    marcoImporte: 'bienestar_animal',
    notaRevision:
      'CONFIRMADO contra el BOE (Ley 7/2023 arts. 75-76, leído 2026-09-14): el sacrificio de animales no ' +
      'autorizado y la muerte del animal por incumplimiento (no delito) son MUY GRAVES (art. 75.a), y la ' +
      'eutanasia con medios inadecuados o por personal no cualificado también (art. 75.b); tramo 50.001-200.000 € ' +
      '(art. 76.1.c, el seed fija el mínimo). Las EXCEPCIONES (seguridad, sanidad, sufrimiento irreversible, ' +
      'control veterinario) se leen del propio régimen de la ley. Deslinde PENAL con el art. 340 bis CP (matar ' +
      'con sufrimiento) para no solaparse con la ficha penal. Segundo revisor humano para el cierre.',
  }),
  construirInfraccion({
    id: 'animal-tenencia-tras-inhabilitacion',
    articulo: ART_LBA_INHABILITACION,
    tituloCorto: 'Tener animales estando inhabilitado (consulta)',
    gravedad: 'leve', // valor de relleno; entrada CONSULTABLE sin importe (no es infracción autónoma del art. 75)
    importeEur: null,
    importeReducidoEur: null,
    textoBoletin:
      'ENTRADA DE CONSULTA (no sancionadora por sí sola). La inhabilitación para la tenencia de animales es una ' +
      'MEDIDA ACCESORIA (art. 77 Ley 7/2023), NO una infracción autónoma de los arts. 73-75 (a verificar). ' +
      'Tener animales pese a ella se gestiona por la vía que impuso la inhabilitación: si es ADMINISTRATIVA, por ' +
      'la ejecución de ese expediente; si es PENAL (art. 340 bis CP), su quebrantamiento es el art. 468 CP, que ' +
      'valora la autoridad judicial. La valoración final corresponde a la autoridad competente.',
    terminos: [
      'tener animales estando inhabilitado',
      'prohibido tener animales y tiene uno',
      'condenado por maltrato con perro',
      'inhabilitacion tenencia de animales',
      'tiene perro pese a la prohibicion',
      'adquirir animales estando inhabilitado',
      'sancionado que vuelve a tener animales',
    ],
    cuerposCompetentes: ['guardia_civil', 'policia_local', 'policia_autonomica'],
    consecuencias: [
      {
        tipo: 'decomiso',
        textoCorto:
          'Procede identificar al responsable, comprobar en bases/registros la inhabilitación vigente y valorar ' +
          'la intervención cautelar del animal, dando parte a la autoridad que la impuso.',
        fuente: 'Ley 7/2023 arts. 75 y 76',
      },
    ],
    marcoImporte: 'no_sancionador',
    notaRevision:
      'RECLASIFICADA a CONSULTABLE (revisor 2ª oleada): ninguna letra del art. 75 tipifica "tener animales ' +
      'estando inhabilitado"; la inhabilitación es medida accesoria del art. 77, no infracción autónoma. Se ' +
      'retira la sanción (importe null); la orientación remite a la ejecución del expediente sancionador o, si ' +
      'la inhabilitación es penal, al art. 468 CP (vía judicial). A verificar.',
  }),
  construirInfraccion({
    id: 'animal-transporte-inadecuado',
    articulo: ART_LBA_MALTRATO,
    tituloCorto: 'Transporte de un animal en condiciones inadecuadas',
    gravedad: 'grave',
    importeEur: 10001,
    importeReducidoEur: null,
    textoBoletin:
      'Transportar a un animal en condiciones que comprometan su bienestar o seguridad (en el maletero cerrado, ' +
      'suelto en la caja de un vehículo, sin ventilación, sin sujeción o hacinado), incumpliendo la Ley 7/2023. ' +
      'Es distinto del transporte de un PPP sin medidas (Ley 50/1999). DESLINDE PENAL: si el transporte causa ' +
      'lesión/menoscabo grave o riesgo para la vida, puede procederse por los arts. 340 bis/340 ter CP. La ' +
      'valoración final corresponde a la autoridad competente.',
    terminos: [
      'perro en el maletero',
      'animal mal transportado',
      'perro suelto en la caja del pickup',
      'transportar animal sin ventilacion',
      'perro sin sujetar en el coche',
      'animales hacinados en un vehiculo',
      'gato transportado sin condiciones',
    ],
    cuerposCompetentes: ['guardia_civil', 'policia_local', 'policia_autonomica'],
    consecuencias: [
      {
        tipo: 'decomiso',
        textoCorto:
          'Procede requerir la corrección de las condiciones de transporte y, ante riesgo para el animal, ' +
          'valorar su intervención cautelar (Ley 7/2023).',
        fuente: 'Ley 7/2023 arts. 74 y 76',
      },
    ],
    marcoImporte: 'bienestar_animal',
    notaRevision:
      'CONTRASTADO con el BOE (Ley 7/2023 arts. 73-76, leído 2026-09-14): el art. 74 NO tiene una letra ' +
      'específica de transporte; la clasificación GRAVE se apoya en el CHAPEAU del art. 74 (conducta que implica ' +
      'daño o sufrimiento sin muerte ni secuelas graves; 10.001-50.000 €, art. 76.1.b, el seed fija el mínimo). ' +
      'Sería LEVE (art. 73) si no causa daño. No duplicar con `ppp-transporte` (Ley 50/1999) ni con ' +
      '`animal-vehiculo-terraza-riesgo` (encierro con calor). Concurre el Rgto (CE) 1/2005 en transporte ' +
      'comercial. El 2.º revisor humano fija la graduación por ser de intensidad variable.',
  }),
  construirInfraccion({
    id: 'animal-perro-suelto-sin-control',
    articulo: ART_LBA_CONTROL,
    tituloCorto: 'Perro suelto o sin control en la vía pública (no PPP)',
    gravedad: 'leve',
    // Ley 7/2023 art. 76: leves 500-10.000 €. Mínimo del tramo como referencia.
    importeEur: 500,
    importeReducidoEur: null,
    textoBoletin:
      'Llevar a un perro suelto o sin el control necesario (sin correa donde es exigible, sin supervisión) en la ' +
      'vía y espacios públicos, incumpliendo el deber de tenencia responsable de la Ley 7/2023. NO es un animal ' +
      'potencialmente peligroso (para el PPP rige la Ley 50/1999, más severa). Lo concreto de la correa y las ' +
      'zonas lo suele detallar la ORDENANZA municipal. La valoración final corresponde a la autoridad competente.',
    terminos: [
      'perro suelto en la calle',
      'perro sin correa',
      'perro sin control en el parque',
      'dueño con el perro suelto',
      'perro sin atar en la via publica',
      'perro corriendo sin correa',
      'llevar el perro suelto',
    ],
    cuerposCompetentes: ['guardia_civil', 'policia_local', 'policia_autonomica'],
    consecuencias: [
      {
        tipo: 'identificacion',
        textoCorto:
          'Procede identificar al responsable y requerir que ponga al animal bajo control (correa/supervisión); ' +
          'valorar la ordenanza municipal aplicable.',
        fuente: 'Ley 7/2023 arts. 73/74 y 76',
      },
    ],
    marcoImporte: 'bienestar_animal',
    notaRevision:
      'CONTRASTADO con el BOE (Ley 7/2023 arts. 73-76, leído 2026-09-14): el deber de control en vía pública no ' +
      'tiene letra sancionadora específica en el art. 74; sin daño encaja en el residual LEVE del art. 73 (500- ' +
      '10.000 €, art. 76.1.a, el seed fija el mínimo). Lo concreto de la correa y las zonas lo fija sobre todo la ' +
      'ORDENANZA municipal. Deslindar de PPP (`ppp-sin-bozal`, Ley 50/1999, más severa). El 2.º revisor humano ' +
      'cierra la clasificación (subiría a grave si genera daño/sufrimiento, art. 74).',
  }),
  construirInfraccion({
    id: 'animal-sin-curso-ni-seguro',
    articulo: ART_LBA_FORMACION,
    tituloCorto: 'Tenencia de perro sin el curso de formación o sin seguro (consulta)',
    gravedad: 'leve', // valor de relleno; entrada CONSULTABLE sin importe (exigibilidad pendiente de reglamento)
    importeEur: null,
    importeReducidoEur: null,
    textoBoletin:
      'ENTRADA DE CONSULTA (no sancionadora por ahora). La Ley 7/2023 introdujo el curso de formación para la ' +
      'tenencia responsable de perros y el seguro de responsabilidad civil, pero su desarrollo reglamentario ' +
      'quedó PENDIENTE: mientras no se apruebe, su exigibilidad general y su régimen sancionador NO están ' +
      'operativos (salvo que tu CCAA u ordenanza ya lo exijan). Consulta orientativa; a verificar antes de ' +
      'sancionar. La valoración final corresponde a la autoridad competente.',
    terminos: [
      'perro sin curso de formacion',
      'sin el cursillo obligatorio del perro',
      'perro sin seguro ley 7 2023',
      'tenencia de perro sin seguro',
      'curso obligatorio para tener perro',
      'sin seguro de responsabilidad civil del perro',
      'formacion obligatoria dueño de perro',
    ],
    cuerposCompetentes: ['guardia_civil', 'policia_local', 'policia_autonomica'],
    consecuencias: [
      {
        tipo: 'identificacion',
        textoCorto:
          'Procede identificar al responsable e informar de las obligaciones de tenencia responsable; comprobar ' +
          'antes su exigibilidad efectiva (desarrollo reglamentario pendiente).',
        fuente: 'Ley 7/2023 (desarrollo reglamentario pendiente)',
      },
    ],
    marcoImporte: 'no_sancionador',
    notaRevision:
      'RECLASIFICADA a CONSULTABLE (revisor 2ª oleada): el curso de formación y el seguro de RC de la Ley 7/2023 ' +
      'quedaron pendientes de reglamento; NO son sancionables con carácter general aún, así que se retira el ' +
      'importe (null). Reintroducir con marco e importe cuando se apruebe el reglamento. Punto SENSIBLE por el estado ' +
      'del desarrollo normativo: puede requerir marcar la ficha como no publicable hasta el reglamento. Revisor de animales.',
  }),
];

/** Estructura completa del seed lista para combinar con el resto de contenido. */
export const SEED_EXTRANJERIA_LOCAL: SeedContenido = {
  normas: NORMAS_EXTRANJERIA_LOCAL_SEED,
  articulos: ARTICULOS_EXTRANJERIA_LOCAL_SEED,
  infracciones: INFRACCIONES_EXTRANJERIA_LOCAL_SEED,
};
