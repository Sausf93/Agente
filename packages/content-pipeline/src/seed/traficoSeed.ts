import {
  Articulo,
  Consecuencia,
  Infraccion,
  Norma,
  Sinonimo,
  CUERPOS_TODOS,
  type Cuerpo,
  type EstadoRevision,
  type GravedadPenal,
  type MarcoImporte,
  type Sustancia,
} from '@agente/shared';
import { hashTexto } from '../parsers/boe-xml/hash.js';
import { reglaDetencion } from './detencion.js';

/**
 * SEED de infracciones de tráfico "de calle" (Fase 1, sección 8 de la especificación).
 *
 * Objetivo: dar contenido REAL y demostrable al buscador y a la ficha antes de que el
 * codificado DGT esté parseado, para que mobile-dev pueda construir el buscador sobre datos
 * de verdad. Incluye una infracción con consecuencia potente (conducir sin seguro →
 * inmovilización + depósito/grúa).
 *
 * Reglas aplicadas (CLAUDE.md y nota legal):
 *  - Textos de boletín y sinónimos REDACTADOS POR NOSOTROS (no copiados de nadie).
 *  - Toda infracción lleva su artículo fuente; la fecha visible la aporta el `ContentVersion`.
 *  - Lenguaje ORIENTATIVO en consecuencias ("procede/ puede", nunca imperativo).
 *  - NADA se publica como "verificado" desde el pipeline: TODO queda `pendiente_revision`
 *    para el panel (revisor jurídico + segundo revisor, §8.3). `notaRevision` detalla qué
 *    dato concreto hay que confirmar ("a verificar").
 *
 * Importes verificados en fuentes públicas (DGT / BOE) en septiembre de 2026; los puntos
 * afectados por la reforma del RGC de octubre de 2026 se marcan explícitamente "a verificar".
 */

/** Fecha de curación de este seed (la que verá el agente como "Actualizado el…"). */
const FECHA_ACTUALIZACION = '2026-09-07';
const VALID_FROM = `${FECHA_ACTUALIZACION}T00:00:00.000Z`;

// --- Identificadores de norma (BOE, legislación consolidada) --------------------------------
const ID_RGC = 'BOE-A-2003-23514'; // RD 1428/2003, Reglamento General de Circulación
const ID_LSV = 'BOE-A-2015-11722'; // RDL 6/2015, texto refundido de la Ley de Tráfico (LSV)
const ID_RGV = 'BOE-A-1999-1826'; // RD 2822/1998, Reglamento General de Vehículos
const ID_LRCSCVM = 'BOE-A-2004-18911'; // RDL 8/2004, seguro obligatorio (LRCSCVM)
const ID_LOTT = 'BOE-A-1987-17803'; // Ley 16/1987, de Ordenación de los Transportes Terrestres (LOTT)
const ID_CP = 'BOE-A-1995-25444'; // LO 10/1995, Código Penal (delitos contra la seguridad vial)

const urlBoe = (id: string): string => `https://www.boe.es/buscar/act.php?id=${id}`;

/**
 * Relevancia de las normas de TRÁFICO (columna `cuerpos` del paquete, §8.2). La consultan la
 * Guardia Civil (Agrupación de Tráfico), las policías locales (tráfico urbano) y las autonómicas
 * con competencia; la Policía Nacional NO la lleva de oficio. Debe COINCIDIR con `CUERPOS_TRAFICO`
 * del catálogo (`catalogo.ts`): si el seed no etiqueta, `Norma` cae al default `CUERPOS_TODOS`
 * (incluye policia_nacional) y un PN vería tráfico por error en la lista de Normas (bug E-03).
 */
const CUERPOS_TRAFICO: Cuerpo[] = ['guardia_civil', 'policia_local', 'policia_autonomica'];

/**
 * Normas citadas por el seed. Se declaran aquí con su identidad BOE y URL oficial; la
 * `fechaConsolidacion` real la rellenará el pipeline del BOE cuando parsee cada norma
 * (RGC ya se parsea; LSV/RGV/LRCSCVM quedan pendientes), por eso va `null` de momento.
 */
export const NORMAS_SEED: Norma[] = [
  Norma.parse({
    id: ID_RGC,
    codigo: 'RGC',
    titulo: 'Reglamento General de Circulación (RD 1428/2003)',
    tipo: 'reglamento',
    ambito: 'estatal',
    urlBoe: urlBoe(ID_RGC),
    fechaConsolidacion: null,
    cuerpos: CUERPOS_TRAFICO,
  }),
  Norma.parse({
    id: ID_LSV,
    codigo: 'LSV',
    titulo: 'Texto refundido de la Ley sobre Tráfico, Circulación y Seguridad Vial (RDL 6/2015)',
    tipo: 'ley',
    ambito: 'estatal',
    urlBoe: urlBoe(ID_LSV),
    fechaConsolidacion: null,
    cuerpos: CUERPOS_TRAFICO,
  }),
  Norma.parse({
    id: ID_RGV,
    codigo: 'RGV',
    titulo: 'Reglamento General de Vehículos (RD 2822/1998)',
    tipo: 'reglamento',
    ambito: 'estatal',
    urlBoe: urlBoe(ID_RGV),
    fechaConsolidacion: null,
    cuerpos: CUERPOS_TRAFICO,
  }),
  Norma.parse({
    id: ID_LRCSCVM,
    codigo: 'LRCSCVM',
    titulo:
      'Texto refundido de la Ley sobre responsabilidad civil y seguro en la circulación de vehículos a motor (RDL 8/2004)',
    tipo: 'ley',
    ambito: 'estatal',
    urlBoe: urlBoe(ID_LRCSCVM),
    fechaConsolidacion: null,
    cuerpos: CUERPOS_TRAFICO,
  }),
  Norma.parse({
    id: ID_LOTT,
    codigo: 'LOTT',
    titulo: 'Ley de Ordenación de los Transportes Terrestres (Ley 16/1987)',
    tipo: 'ley',
    ambito: 'estatal',
    urlBoe: urlBoe(ID_LOTT),
    fechaConsolidacion: null,
    cuerpos: CUERPOS_TRAFICO,
  }),
  Norma.parse({
    id: ID_CP,
    codigo: 'CP',
    titulo: 'Código Penal (Ley Orgánica 10/1995)',
    tipo: 'ley',
    ambito: 'estatal',
    urlBoe: urlBoe(ID_CP),
    fechaConsolidacion: null,
    // El Código Penal lo consultan TODOS los cuerpos (delitos contra la seguridad vial incluidos).
    cuerpos: [...CUERPOS_TODOS],
  }),
];

// --- Artículos citados ----------------------------------------------------------------------
/**
 * Artículos que citan las infracciones y consecuencias del seed. El `texto` es un RESUMEN
 * NEUTRO REDACTADO POR NOSOTROS (no el texto consolidado literal): sirve de referencia hasta
 * que el pipeline del BOE aporte el texto oficial completo de cada norma (LSV/RGV/LRCSCVM
 * aún no se parsean). La fuente literal siempre está a un toque vía `Norma.urlBoe`.
 */
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

const ART_RGC_99 = articuloSeed({
  normaId: ID_RGC,
  numero: '99',
  titulo: 'Utilización del alumbrado',
  texto:
    'Regula cuándo y cómo debe emplearse el alumbrado del vehículo (posición, cruce, carretera, ' +
    'niebla) y la obligación de circular con las luces reglamentarias en condiciones de escasa ' +
    'visibilidad o de noche. Resumen orientativo; consúltese el texto consolidado en el BOE.',
});

const ART_RGC_18 = articuloSeed({
  normaId: ID_RGC,
  numero: '18',
  titulo: 'Obligaciones del conductor: atención a la conducción y uso de dispositivos',
  texto:
    'El conductor debe mantener su propia libertad de movimientos y la atención permanente a la ' +
    'conducción. Se prohíbe conducir utilizando manualmente dispositivos de telefonía móvil, ' +
    'navegadores o cualquier sistema que exija sujetarlos con la mano. Resumen orientativo.',
});

const ART_RGC_117 = articuloSeed({
  normaId: ID_RGC,
  numero: '117',
  titulo: 'Cinturón de seguridad y sistemas de retención',
  texto:
    'Obliga al uso del cinturón de seguridad y demás sistemas de retención homologados por ' +
    'conductor y ocupantes en los vehículos que los tengan instalados. Resumen orientativo.',
});

const ART_RGC_118 = articuloSeed({
  normaId: ID_RGC,
  numero: '118',
  titulo: 'Cascos y elementos de protección',
  texto:
    'Obliga al uso del casco de protección homologado y correctamente abrochado a conductores y ' +
    'pasajeros de motocicletas y ciclomotores. Resumen orientativo.',
});

const ART_RGC_146 = articuloSeed({
  normaId: ID_RGC,
  numero: '146',
  titulo: 'Significado de las luces de los semáforos',
  texto:
    'Define el significado de las luces del semáforo. La luz roja prohíbe el paso; el conductor ' +
    'debe detenerse antes de la línea de detención o del propio semáforo. Resumen orientativo.',
});

const ART_RGV_10 = articuloSeed({
  normaId: ID_RGV,
  numero: '10',
  titulo: 'Inspección técnica de vehículos (ITV)',
  texto:
    'Regula la obligación de someter los vehículos a la inspección técnica periódica y de ' +
    'circular con la ITV en vigor y favorable. Resumen orientativo.',
});

const ART_LRCSCVM_3 = articuloSeed({
  normaId: ID_LRCSCVM,
  numero: '3',
  titulo: 'Obligación de asegurarse y consecuencias de circular sin seguro',
  texto:
    'Impone al propietario la obligación de suscribir el seguro obligatorio de responsabilidad ' +
    'civil. Circular sin él conlleva sanción y la posibilidad de inmovilizar y depositar el ' +
    'vehículo hasta que se acredite la cobertura. Resumen orientativo.',
});

const ART_LSV_104 = articuloSeed({
  normaId: ID_LSV,
  numero: '104',
  titulo: 'Inmovilización del vehículo',
  texto:
    'Enumera los supuestos en que los agentes pueden inmovilizar el vehículo (entre ellos, ' +
    'carecer del seguro obligatorio) hasta que cese la causa que la motivó. Resumen orientativo.',
});

const ART_LSV_105 = articuloSeed({
  normaId: ID_LSV,
  numero: '105',
  titulo: 'Retirada y depósito del vehículo',
  texto:
    'Regula la retirada del vehículo de la vía y su traslado al depósito (grúa) cuando procede, ' +
    'por ejemplo si tras la inmovilización no se subsana la causa. Resumen orientativo.',
});

const ART_RGC_48 = articuloSeed({
  normaId: ID_RGC,
  numero: '48',
  titulo: 'Límites de velocidad',
  texto:
    'Fija los límites máximos de velocidad según el tipo de vía y de vehículo (vías urbanas y ' +
    'travesías, carreteras convencionales, autovías y autopistas). Superar el límite se sanciona ' +
    'con un cuadro graduado por tramos de km/h de exceso. Resumen orientativo; consúltese el BOE.',
});

const ART_RGC_94 = articuloSeed({
  normaId: ID_RGC,
  numero: '94',
  titulo: 'Lugares prohibidos para la parada y el estacionamiento',
  texto:
    'Enumera los lugares donde se prohíbe parar o estacionar: pasos de peatones, aceras y zonas ' +
    'peatonales, vados señalizados, carriles reservados (bus, bici), dobles filas que obstaculizan ' +
    'la circulación, intersecciones y curvas de visibilidad reducida, etc. Resumen orientativo.',
});

const ART_RGC_121 = articuloSeed({
  normaId: ID_RGC,
  numero: '121',
  titulo: 'Circulación de peatones y de vehículos de movilidad personal (VMP)',
  texto:
    'Regula por dónde pueden circular peatones y vehículos de movilidad personal (patinetes ' +
    'eléctricos). Los VMP tienen prohibido circular por aceras y zonas peatonales, y deben ' +
    'ajustarse a lo que fije la ordenanza municipal (alumbrado, casco, chaleco). Resumen orientativo.',
});

const ART_LSV_14 = articuloSeed({
  normaId: ID_LSV,
  numero: '14',
  titulo: 'Bebidas alcohólicas y drogas',
  texto:
    'Prohíbe conducir con tasas de alcohol superiores a las reglamentarias o con presencia de ' +
    'drogas en el organismo, y obliga al conductor a someterse a las pruebas de detección de ' +
    'alcohol y drogas practicadas por los agentes de tráfico. Resumen orientativo.',
});

const ART_LSV_77 = articuloSeed({
  normaId: ID_LSV,
  numero: '77',
  titulo: 'Infracciones muy graves',
  texto:
    'Cataloga como muy graves determinadas conductas, entre ellas conducir careciendo del permiso ' +
    'o licencia de conducción correspondiente cuando el hecho no sea constitutivo de delito. ' +
    'Resumen orientativo; consúltese el texto consolidado en el BOE.',
});

const ART_CP_383 = articuloSeed({
  normaId: ID_CP,
  numero: '383',
  titulo: 'Negativa a someterse a las pruebas de alcohol o drogas',
  texto:
    'Castiga como delito al conductor que, requerido por un agente de la autoridad, se niegue a ' +
    'someterse a las pruebas legalmente establecidas para la comprobación de las tasas de alcohol ' +
    'o de la presencia de drogas. La valoración final corresponde a la autoridad judicial. Resumen orientativo.',
});

const ART_CP_379 = articuloSeed({
  normaId: ID_CP,
  numero: '379.2',
  titulo: 'Conducción bajo los efectos del alcohol o de drogas (delito contra la seguridad vial)',
  texto:
    'Castiga como delito conducir un vehículo a motor o ciclomotor bajo la influencia de drogas ' +
    'tóxicas, estupefacientes, sustancias psicotrópicas o de bebidas alcohólicas. EN TODO CASO se ' +
    'considera delito conducir con una tasa de alcohol superior a 0,60 miligramos por litro en aire ' +
    'espirado o superior a 1,2 gramos por litro en sangre. Por debajo de ese umbral, la conducción ' +
    'con exceso de alcohol es sanción administrativa (art. 14 LSV), salvo que se acredite la ' +
    'influencia en la conducción. Es la FRONTERA entre el boletín (administrativo) y el atestado ' +
    '(penal). Resumen orientativo; consúltese el texto consolidado en el BOE.',
});

const ART_CP_380 = articuloSeed({
  normaId: ID_CP,
  numero: '380',
  titulo: 'Conducción temeraria (delito contra la seguridad vial)',
  texto:
    'Castiga como delito conducir un vehículo a motor o ciclomotor con temeridad manifiesta ' +
    'poniendo en concreto peligro la vida o la integridad de las personas. Se presume la temeridad ' +
    'manifiesta cuando concurren un exceso de velocidad y una tasa de alcohol constitutivos de ' +
    'delito (arts. 379.1 y 379.2 CP). Si además se condujera con manifiesto desprecio por la vida ' +
    'de los demás, se aplica el art. 381. Resumen orientativo; consúltese el texto consolidado.',
});

const ART_CP_379_1 = articuloSeed({
  normaId: ID_CP,
  numero: '379.1',
  titulo: 'Exceso de velocidad penalmente relevante (delito contra la seguridad vial)',
  texto:
    'Castiga como delito conducir un vehículo a motor o ciclomotor a una velocidad superior en 60 ' +
    'km/h en vía urbana o en 80 km/h en vía interurbana a la permitida reglamentariamente. La pena ' +
    'es prisión de 3 a 6 meses o multa de 6 a 12 meses o trabajos en beneficio de la comunidad de ' +
    '31 a 90 días, y EN CUALQUIER CASO privación del derecho a conducir por tiempo superior a 1 y ' +
    'hasta 4 años. Por debajo de esos umbrales, el exceso de velocidad es sanción administrativa ' +
    '(cuadro del art. 48 RGC / LSV): es la FRONTERA entre el boletín (administrativo) y el atestado ' +
    '(penal). Resumen orientativo; consúltese el texto consolidado en el BOE.',
});

const ART_CP_384 = articuloSeed({
  normaId: ID_CP,
  numero: '384',
  titulo: 'Conducción sin permiso (delito contra la seguridad vial)',
  texto:
    'Castiga como delito conducir un vehículo a motor o ciclomotor en tres supuestos: (a) tras la ' +
    'pérdida de vigencia del permiso o licencia por la pérdida total de los puntos legalmente ' +
    'asignados; (b) tras haber sido privado cautelar o definitivamente del permiso o licencia por ' +
    'decisión judicial; y (c) sin haber obtenido nunca permiso o licencia de conducción. La pena es ' +
    'prisión de 3 a 6 meses o multa de 12 a 24 meses o trabajos en beneficio de la comunidad de 31 ' +
    'a 90 días. Distinto de la conducción sin permiso NO delictiva (p. ej. permiso caducado sin ' +
    'renovar), que es sanción administrativa (art. 77 LSV). Resumen orientativo; consúltese el BOE.',
});

const ART_RGC_14 = articuloSeed({
  normaId: ID_RGC,
  numero: '14',
  titulo: 'Disposición de la carga',
  texto:
    'Exige que la carga transportada en un vehículo, así como los accesorios para su ' +
    'acondicionamiento o protección, se dispongan y, en su caso, se sujeten de forma que no puedan ' +
    'arrastrar, caer total o parcialmente, desplazarse de manera peligrosa, comprometer la ' +
    'estabilidad del vehículo, ni producir ruido, polvo u otras molestias evitables. La carga mal ' +
    'estibada o sin sujeción es infracción de circulación y puede motivar la inmovilización hasta su ' +
    'correcta reestiba. Resumen orientativo; consúltese el texto consolidado y la normativa de estiba.',
});

const ART_LOTT_141 = articuloSeed({
  normaId: ID_LOTT,
  numero: '141',
  titulo: 'Infracciones graves en el transporte (exceso de masa y acondicionamiento de la carga)',
  texto:
    'Tipifica como infracciones de la ordenación del transporte, entre otras, el exceso sobre la masa ' +
    'máxima autorizada (MMA) del vehículo y el transporte de mercancías con la carga mal acondicionada ' +
    'o sin la debida sujeción. El exceso de masa se gradúa por el porcentaje de sobrepeso (leve, grave ' +
    'o muy grave según el tramo) y la responsabilidad puede alcanzar al transportista, cargador y ' +
    'expedidor. Los límites de masa los fija el Reglamento General de Vehículos (RD 2822/1998) y sus ' +
    'anexos. La sanción y el régimen de inmovilización los concretan el art. 143 LOTT y su reglamento ' +
    '(RD 1211/1990). Resumen orientativo; consúltese el texto consolidado en el BOE.',
});

const ART_LOTT_MMPP = articuloSeed({
  normaId: ID_LOTT,
  numero: '140 (mercancías peligrosas)',
  titulo: 'Transporte de mercancías peligrosas incumpliendo el ADR (infracción muy grave)',
  texto:
    'Tipifica como infracción muy grave de la ordenación del transporte el incumplimiento de las ' +
    'condiciones del ADR (Acuerdo europeo sobre transporte internacional de mercancías peligrosas por ' +
    'carretera) exigibles para el transporte de mercancías peligrosas: ausencia o incorrección de los ' +
    'paneles naranjas y las etiquetas de peligro, falta de la carta de porte con los datos de la ' +
    'mercancía (número ONU), y ausencia de la autorización, la formación del conductor (certificado ' +
    'ADR) o los equipos de seguridad obligatorios. En España el régimen se desarrolla por el RD ' +
    '97/2014. La sanción y el precinto/inmovilización los concretan los arts. 140, 143 LOTT y su ' +
    'reglamento. Resumen orientativo; consúltese el texto consolidado y el ADR vigente.',
});

const ART_LOTT_140 = articuloSeed({
  normaId: ID_LOTT,
  numero: '140',
  titulo: 'Infracciones muy graves en el transporte (tacógrafo y tiempos de conducción)',
  texto:
    'Tipifica como infracciones muy graves de la ordenación del transporte, entre otras, la ' +
    'manipulación o el falseamiento del tacógrafo o del limitador de velocidad y de sus elementos, ' +
    'la instalación de mecanismos para alterar su funcionamiento, y el incumplimiento de los tiempos ' +
    'de conducción y descanso del Reglamento (CE) 561/2006. La sanción y el régimen de precinto los ' +
    'fija el art. 143 y su reglamento. Resumen orientativo; consúltese el texto consolidado.',
});

// --- Artículos de la LOTT/ROTT para la OLA 2 del catálogo (submenú Transporte) --------------
// El submenú Transporte de la app cubre: título habilitante, viajeros, escolar, ADR, perecederas
// (ATP), documentación/visado, dimensiones y tacógrafo. Cada bloque cita su artículo de la LOTT
// (Ley 16/1987, arts. 140-143, ya ingerida del BOE) con un RESUMEN NEUTRO redactado por nosotros;
// el subapartado/letra concreto y la cuantía quedan "a verificar" en la nota de cada infracción.
const ART_LOTT_140_TITULO = articuloSeed({
  normaId: ID_LOTT,
  numero: '140 (título habilitante)',
  titulo: 'Infracciones muy graves: transporte público sin título habilitante',
  texto:
    'Tipifica como infracción muy grave de la ordenación del transporte la realización de ' +
    'transporte público de mercancías o de viajeros, o de actividades auxiliares, careciendo de ' +
    'la preceptiva autorización, título habilitante o tarjeta de transporte, así como seguir ' +
    'prestándolo tras su caducidad, revocación o suspensión. Alcanza al transporte de viajeros en ' +
    'autobús, al de mercancías y a los vehículos de arrendamiento con conductor (VTC) y al taxi ' +
    'cuando operan sin la autorización exigible. La cuantía y el régimen de precinto/inmovilización ' +
    'los concretan el art. 143 LOTT y su reglamento (ROTT, RD 1211/1990). Resumen orientativo; ' +
    'consúltese el texto consolidado en el BOE.',
});

const ART_LOTT_141_PRIVADO = articuloSeed({
  normaId: ID_LOTT,
  numero: '141 (transporte privado)',
  titulo: 'Infracciones graves: transporte privado excediendo sus límites',
  texto:
    'Tipifica como infracción de la ordenación del transporte la realización de transporte privado ' +
    'complementario excediendo los límites que lo definen (por ejemplo, transportando mercancías o ' +
    'personas ajenas a la propia actividad de la empresa, o mediante precio como si fuera transporte ' +
    'público) sin disponer del título habilitante que correspondería al transporte público. La ' +
    'cuantía la concreta el art. 143 LOTT y su reglamento (ROTT). Resumen orientativo; consúltese el ' +
    'texto consolidado en el BOE.',
});

const ART_LOTT_141_VIAJEROS = articuloSeed({
  normaId: ID_LOTT,
  numero: '141 (viajeros: plazas)',
  titulo: 'Infracciones graves: exceso de viajeros sobre las plazas autorizadas',
  texto:
    'Tipifica como infracción de la ordenación del transporte de viajeros el transportar un número de ' +
    'viajeros superior al de plazas autorizadas del vehículo. El número de plazas es el que figura en ' +
    'la ficha técnica y la tarjeta de transporte. La cuantía la concreta el art. 143 LOTT y su ' +
    'reglamento (ROTT). Resumen orientativo; consúltese el texto consolidado en el BOE.',
});

const ART_LOTT_142_VIAJEROS = articuloSeed({
  normaId: ID_LOTT,
  numero: '142 (viajeros: billetes)',
  titulo: 'Infracciones leves: billetes y hojas de reclamación en el transporte de viajeros',
  texto:
    'Tipifica como infracción leve de la ordenación del transporte de viajeros el incumplimiento de ' +
    'las obligaciones formales de documentación del servicio, entre ellas carecer de billetes u otro ' +
    'título de transporte de los viajeros o de las hojas de reclamación a disposición de los usuarios, ' +
    'o no expedirlos. La cuantía la concreta el art. 143 LOTT y su reglamento (ROTT). Resumen ' +
    'orientativo; consúltese el texto consolidado en el BOE.',
});

const ART_LOTT_ESCOLAR = articuloSeed({
  normaId: ID_LOTT,
  numero: '140 (transporte escolar y de menores)',
  titulo: 'Infracciones muy graves: transporte escolar y de menores incumpliendo sus condiciones',
  texto:
    'Tipifica como infracción de la ordenación del transporte el incumplimiento de las condiciones de ' +
    'seguridad exigibles al transporte escolar y de menores: presencia del acompañante o monitor ' +
    'cuando es obligatorio, antigüedad e inspección técnica (ITV) del vehículo, señalización ' +
    'específica del transporte escolar y número de plazas. En España estas condiciones las desarrolla ' +
    'el RD 443/2001, de condiciones de seguridad en el transporte escolar y de menores. La cuantía y ' +
    'el régimen de inmovilización los concretan el art. 143 LOTT y su reglamento (ROTT). Resumen ' +
    'orientativo; consúltese el texto consolidado y el RD 443/2001.',
});

const ART_LOTT_ADR_DOC = articuloSeed({
  normaId: ID_LOTT,
  numero: '141 (documentación ADR)',
  titulo: 'Infracciones graves: documentación del transporte de mercancías peligrosas (ADR)',
  texto:
    'Tipifica como infracción de la ordenación del transporte el transporte de mercancías peligrosas ' +
    'con deficiencias documentales del ADR distintas de las que constituyen infracción muy grave: por ' +
    'ejemplo, transportar sin las instrucciones escritas de seguridad o con ellas incompletas, o con ' +
    'la documentación de la mercancía deficiente cuando el hecho no comprometa gravemente la ' +
    'seguridad. Se distingue de la ausencia total de paneles, etiquetado, autorización o formación ' +
    '(muy grave, ver `inf-adr-mercancias-peligrosas`). La cuantía la concreta el art. 143 LOTT y su ' +
    'reglamento; el régimen técnico, el RD 97/2014 y el ADR vigente. Resumen orientativo.',
});

const ART_LOTT_ADR_FORMACION = articuloSeed({
  normaId: ID_LOTT,
  numero: '140 (formación ADR del conductor)',
  titulo: 'Infracciones muy graves: conductor sin la formación ADR exigible',
  texto:
    'Tipifica como infracción muy grave de la ordenación del transporte el transporte de mercancías ' +
    'peligrosas por un conductor que carece del certificado de formación ADR en vigor exigible para ' +
    'la clase de mercancía y vehículo, o llevándolo caducado. La formación del conductor es un ' +
    'requisito esencial de seguridad del ADR. La cuantía y el precinto/inmovilización los concretan el ' +
    'art. 143 LOTT y su reglamento; el régimen técnico, el RD 97/2014 y el ADR vigente. Resumen ' +
    'orientativo; consúltese el texto consolidado en el BOE.',
});

const ART_LOTT_ATP = articuloSeed({
  normaId: ID_LOTT,
  numero: '141 (perecederas ATP)',
  titulo: 'Infracciones graves: transporte de perecederas sin certificado ATP o con frío deficiente',
  texto:
    'Tipifica como infracción de la ordenación del transporte el transporte de mercancías perecederas ' +
    '(alimentos que requieren temperatura controlada) sin el certificado ATP en vigor del vehículo o ' +
    'contenedor, o con el equipo de frío (refrigeración/conservación) averiado o incumpliendo las ' +
    'temperaturas exigidas. El régimen técnico lo fija el Acuerdo ATP (transporte internacional de ' +
    'productos alimenticios perecederos). La cuantía la concreta el art. 143 LOTT y su reglamento ' +
    '(ROTT). Resumen orientativo; consúltese el texto consolidado y el Acuerdo ATP.',
});

const ART_LOTT_142_DOCS = articuloSeed({
  normaId: ID_LOTT,
  numero: '142 (documentación de control)',
  titulo: 'Infracciones leves: no llevar o no exhibir la documentación de control',
  texto:
    'Tipifica como infracción de la ordenación del transporte el no llevar a bordo o no exhibir a los ' +
    'servicios de inspección la documentación de control del transporte: la tarjeta de transporte o ' +
    'autorización, y los demás documentos de control exigibles. Se distingue de CARECER del título ' +
    'habilitante (muy grave, ver `inf-transporte-sin-titulo`): aquí el transportista sí dispone del ' +
    'título pero no lo lleva o no lo exhibe, supuesto por lo general leve y subsanable. La cuantía la ' +
    'concreta el art. 143 LOTT y su reglamento (ROTT). Resumen orientativo; consúltese el BOE.',
});

const ART_LOTT_141_VISADO = articuloSeed({
  normaId: ID_LOTT,
  numero: '141 (visado de la autorización)',
  titulo: 'Infracciones graves: incumplimiento del visado de la autorización de transporte',
  texto:
    'Tipifica como infracción de la ordenación del transporte el mantener en explotación un vehículo o ' +
    'una autorización sin haber realizado el visado periódico exigible, o incumpliendo las condiciones ' +
    'a las que se sujeta la vigencia de la autorización de transporte. La cuantía la concreta el ' +
    'art. 143 LOTT y su reglamento (ROTT). Resumen orientativo; consúltese el texto consolidado en el BOE.',
});

const ART_LOTT_141_DIMENSIONES = articuloSeed({
  normaId: ID_LOTT,
  numero: '141 (exceso de dimensiones)',
  titulo: 'Infracciones graves: exceso de dimensiones del vehículo o del conjunto',
  texto:
    'Tipifica como infracción de la ordenación del transporte el circular excediendo las dimensiones ' +
    'máximas reglamentarias (longitud, anchura o altura) del vehículo o del conjunto, o el transporte ' +
    'que requiere autorización especial de circulación por sus dimensiones sin disponer de ella. Se ' +
    'distingue del exceso de MASA máxima autorizada (ver `inf-exceso-mma`). Los límites los fija el ' +
    'Reglamento General de Vehículos (RD 2822/1998); la cuantía, el art. 143 LOTT y su reglamento. ' +
    'Resumen orientativo; consúltese el texto consolidado en el BOE.',
});

const ART_LOTT_141_TACOGRAFO = articuloSeed({
  normaId: ID_LOTT,
  numero: '141 (hojas y registros del tacógrafo)',
  titulo: 'Infracciones graves: no llevar o no conservar las hojas, la tarjeta o los registros del tacógrafo',
  texto:
    'Tipifica como infracción de la ordenación del transporte el no llevar a bordo las hojas de ' +
    'registro o la tarjeta de conductor del tacógrafo, o el no conservar y presentar los registros de ' +
    'los tiempos de conducción y descanso durante el periodo exigido. Se distingue de la MANIPULACIÓN ' +
    'o el falseamiento del tacógrafo y del exceso de tiempos (muy grave, ver `inf-tacografo`): aquí se ' +
    'trata del incumplimiento documental de conservación/porte. El régimen técnico lo fija el ' +
    'Reglamento (UE) 165/2014 (tacógrafo) y el Rgto (CE) 561/2006; la cuantía, el art. 143 LOTT y su ' +
    'reglamento. Resumen orientativo; consúltese el texto consolidado en el BOE.',
});

const ART_RGC_33 = articuloSeed({
  normaId: ID_RGC,
  numero: '33',
  titulo: 'Adelantamiento: ejecución y prohibiciones',
  texto:
    'Regula la forma de efectuar el adelantamiento y los casos en que está prohibido (cambios de ' +
    'rasante, curvas de visibilidad reducida, pasos para peatones, y allí donde la señalización lo ' +
    'prohíba). Rebasar una marca longitudinal continua para adelantar, o adelantar sin visibilidad ' +
    'o sin espacio suficiente, es una infracción de circulación. Resumen orientativo.',
});

const ART_RGV_12 = articuloSeed({
  normaId: ID_RGV,
  numero: '12',
  titulo: 'Condiciones técnicas del vehículo (neumáticos y demás elementos)',
  texto:
    'Exige que los vehículos que circulan por las vías públicas reúnan las condiciones técnicas ' +
    'reglamentarias, incluidas las de sus neumáticos (dibujo, estado y presión). Circular con ' +
    'neumáticos en mal estado —desgaste por debajo del mínimo legal, cortes o deformaciones que ' +
    'comprometan la seguridad— es una deficiencia que puede motivar denuncia e inmovilización. ' +
    'Resumen orientativo; consúltese el texto consolidado y el Manual de Procedimiento de ITV.',
});

const ART_RGV_25 = articuloSeed({
  normaId: ID_RGV,
  numero: '25',
  titulo: 'Placas de matrícula',
  texto:
    'Regula las placas de matrícula del vehículo: su obligatoriedad, características y colocación de ' +
    'forma que sean legibles y no estén ocultas, dobladas ni manipuladas. Circular con la matrícula ' +
    'oculta, ilegible o alterada dificulta la identificación del vehículo y constituye infracción. ' +
    'Resumen orientativo; consúltese el texto consolidado en el BOE.',
});

// --- Artículos añadidos en la AMPLIACIÓN del catálogo de calle (conducta, estado, señales) ----
const ART_RGC_109 = articuloSeed({
  normaId: ID_RGC,
  numero: '109',
  titulo: 'Advertencias ópticas: señalización de las maniobras (intermitentes)',
  texto:
    'Obliga al conductor a advertir con suficiente antelación, mediante las luces indicadoras de ' +
    'dirección (intermitentes) o, en su defecto, con el brazo, cualquier maniobra lateral: cambio de ' +
    'carril, giro, incorporación, adelantamiento, cambio de sentido o salida de una rotonda; y a ' +
    'mantener la señal hasta terminar la maniobra. No señalizar la maniobra dificulta la previsión del ' +
    'resto de usuarios y es infracción de circulación (concordante con el art. 44 LSV). Resumen orientativo.',
});

const ART_RGC_110 = articuloSeed({
  normaId: ID_RGC,
  numero: '110',
  titulo: 'Advertencias acústicas: uso del claxon',
  texto:
    'Regula el empleo de las señales acústicas (claxon): solo pueden utilizarse para evitar un ' +
    'posible accidente, en vías interurbanas para advertir un adelantamiento cuando sea necesario, o ' +
    'para reclamar auxilio urgente. Se prohíbe su uso inmotivado, excesivo o molesto, así como emplear ' +
    'aparatos de sonido estridentes o no homologados. Su uso indebido es infracción de circulación. ' +
    'Resumen orientativo; consúltese el texto consolidado en el BOE.',
});

const ART_RGC_54 = articuloSeed({
  normaId: ID_RGC,
  numero: '54',
  titulo: 'Distancia de seguridad entre vehículos',
  texto:
    'Exige al conductor dejar entre su vehículo y el que le precede una distancia que le permita ' +
    'detenerse, sin colisionar, ante un frenazo brusco, atendiendo a la velocidad, las condiciones de ' +
    'adherencia y frenado y demás circunstancias. Circular sin mantener la distancia de seguridad ' +
    '(«pegado») es una de las causas más frecuentes de alcance y es infracción grave de circulación. ' +
    'Resumen orientativo; consúltese el texto consolidado en el BOE.',
});

const ART_RGC_56 = articuloSeed({
  normaId: ID_RGC,
  numero: '56',
  titulo: 'Prioridad de paso y señales de STOP y ceda el paso',
  texto:
    'Establece las normas de prioridad de paso en intersecciones y la obligación de respetar las ' +
    'señales que la regulan: ante una señal de STOP (R-2) el conductor debe detener por completo el ' +
    'vehículo en el lugar previsto y ceder el paso; ante un ceda el paso (R-1) debe ceder el paso sin ' +
    'necesidad de detenerse si no hay riesgo. No respetar la prioridad de paso es infracción grave de ' +
    'circulación. Resumen orientativo; consúltese el texto consolidado y la señalización aplicable.',
});

const ART_RGC_65 = articuloSeed({
  normaId: ID_RGC,
  numero: '65',
  titulo: 'Pasos para peatones y prioridad de paso de los peatones',
  texto:
    'Regula la prioridad de paso de los peatones: el conductor debe cederles el paso cuando cruzan por ' +
    'un paso de peatones debidamente señalizado, cuando vayan a cruzar una calzada por la que el ' +
    'vehículo va a girar para entrar en otra vía, y en las demás situaciones que fija el reglamento. No ' +
    'respetar la prioridad del peatón es infracción grave de circulación. Resumen orientativo; ' +
    'consúltese el texto consolidado en el BOE.',
});

const ART_RGC_80 = articuloSeed({
  normaId: ID_RGC,
  numero: '80',
  titulo: 'Marcha atrás y cambio de sentido',
  texto:
    'Regula la maniobra de marcha atrás: solo se admite como maniobra complementaria y auxiliar de ' +
    'otra que la exija, o en un lugar donde no sea posible el cambio de sentido, efectuándola lentamente, ' +
    'durante el menor recorrido posible, con las señales preceptivas y tras cerciorarse de que no hay ' +
    'peligro. Se prohíbe recorrer largos tramos marcha atrás o hacerla en autopistas y autovías. La ' +
    'marcha atrás o el cambio de sentido antirreglamentarios son infracción de circulación; cuando ' +
    'equivalgan a circular en sentido contrario, pueden ser muy graves. Resumen orientativo (concordante ' +
    'con el art. 31 LSV).',
});

const ART_RGC_36 = articuloSeed({
  normaId: ID_RGC,
  numero: '36',
  titulo: 'Utilización del arcén',
  texto:
    'Regula la utilización del arcén: como norma general, los vehículos de motor no deben circular por ' +
    'el arcén, reservado a peatones, ciclos y a los vehículos obligados a ello. Circular indebidamente ' +
    'por el arcén es infracción de circulación. Existen excepciones tasadas (p. ej. vehículos que por su ' +
    'lentitud deban hacerlo, o supuestos habilitados y señalizados). Resumen orientativo; consúltese el ' +
    'texto consolidado en el BOE.',
});

const ART_RGC_41 = articuloSeed({
  normaId: ID_RGC,
  numero: '41',
  titulo: 'Carriles reservados (bus, VAO, bici)',
  texto:
    'Regula la utilización de los carriles especialmente reservados a determinados vehículos o usos: ' +
    'carril bus, carril para vehículos de alta ocupación (VAO) y carril bici. Circular por un carril ' +
    'reservado sin tener derecho a ello (p. ej. entrar en el VAO sin el número mínimo de ocupantes, o ' +
    'invadir el carril bus o el carril bici) es infracción de circulación. Resumen orientativo; ' +
    'consúltese el texto consolidado y la señalización aplicable.',
});

const ART_RGC_5 = articuloSeed({
  normaId: ID_RGC,
  numero: '5',
  titulo: 'Documentación que debe llevarse y exhibirse',
  texto:
    'El conductor debe llevar consigo y exhibir a requerimiento de los agentes la documentación del ' +
    'vehículo y la del propio conductor: permiso o licencia de conducción en vigor, permiso de ' +
    'circulación del vehículo y tarjeta de inspección técnica (ficha técnica), además del justificante ' +
    'del seguro obligatorio. No llevarla o no exhibirla dificulta la identificación y el control, y es ' +
    'infracción leve, sin perjuicio de la comprobación de los datos por otros medios. Resumen orientativo; ' +
    'consúltese el texto consolidado y el Reglamento General de Conductores.',
});

const ART_RGV_7 = articuloSeed({
  normaId: ID_RGV,
  numero: '7',
  titulo: 'Condiciones técnicas, reformas y homologación de los elementos del vehículo',
  texto:
    'Exige que los vehículos y sus elementos reúnan las condiciones técnicas reglamentarias y estén ' +
    'debidamente homologados, y que las reformas de importancia (cambios que alteren las características ' +
    'del vehículo) se aprueben y anoten en la documentación. Entran aquí los cristales/lunas con láminas ' +
    'o tintados no homologados que reduzcan la visibilidad o la transparencia reglamentaria, el sistema ' +
    'de escape no homologado o que supere los niveles de ruido, y las luces adicionales o de un color/uso ' +
    'no permitido. Circular con elementos no homologados es infracción y puede motivar la inmovilización ' +
    'hasta subsanar. Resumen orientativo; consúltese el texto consolidado, el RD 866/2010 de reformas y ' +
    'el Manual de Procedimiento de ITV.',
});

export const ARTICULOS_SEED: Articulo[] = [
  ART_RGC_99,
  ART_RGC_18,
  ART_RGC_117,
  ART_RGC_118,
  ART_RGC_146,
  ART_RGC_48,
  ART_RGC_94,
  ART_RGC_121,
  ART_RGC_33,
  ART_RGC_109,
  ART_RGC_110,
  ART_RGC_54,
  ART_RGC_56,
  ART_RGC_65,
  ART_RGC_80,
  ART_RGC_36,
  ART_RGC_41,
  ART_RGC_5,
  ART_RGV_10,
  ART_RGV_12,
  ART_RGV_25,
  ART_RGV_7,
  ART_RGC_14,
  ART_LRCSCVM_3,
  ART_LSV_104,
  ART_LSV_105,
  ART_LSV_14,
  ART_LSV_77,
  ART_LOTT_140,
  ART_LOTT_141,
  ART_LOTT_MMPP,
  ART_LOTT_140_TITULO,
  ART_LOTT_141_PRIVADO,
  ART_LOTT_141_VIAJEROS,
  ART_LOTT_142_VIAJEROS,
  ART_LOTT_ESCOLAR,
  ART_LOTT_ADR_DOC,
  ART_LOTT_ADR_FORMACION,
  ART_LOTT_ATP,
  ART_LOTT_142_DOCS,
  ART_LOTT_141_VISADO,
  ART_LOTT_141_DIMENSIONES,
  ART_LOTT_141_TACOGRAFO,
  ART_CP_379,
  ART_CP_379_1,
  ART_CP_384,
  ART_CP_383,
  ART_CP_380,
];

// --- Infracciones ---------------------------------------------------------------------------

/**
 * Una infracción del seed con todo lo que necesita el paquete: la `Infraccion` (validada
 * contra el esquema de shared), sus sinónimos y consecuencias, el marco con el que validar el
 * importe y su estado de revisión editorial + nota de qué confirmar.
 */
export interface InfraccionSeed {
  infraccion: Infraccion;
  sinonimos: Sinonimo[];
  consecuencias: Consecuencia[];
  /** Marco para `validarImporte` (LSV art. 80, LRCSCVM art. 3…). */
  marcoImporte: MarcoImporte;
  /** Estado editorial. En el seed SIEMPRE `pendiente_revision` (nada se autopublica). */
  revision: EstadoRevision;
  /** Qué dato concreto debe confirmar el revisor ("a verificar"). */
  notaRevision: string;
}

interface InfraccionSeedInput {
  id: string;
  articulo: Articulo;
  codigoDgt?: string | null;
  tituloCorto: string;
  gravedad: Infraccion['gravedad'];
  /** Vía sancionadora. Por defecto administrativa; `penal` para delitos (art. 383/384 CP…). */
  tipo?: Infraccion['tipo'];
  importeEur: number | null;
  importeReducidoEur: number | null;
  /**
   * Extremo superior del tramo cuando el importe NO es cifra cerrada sino horquilla o cuadro
   * graduado (seguro obligatorio, transporte/tacógrafo, alcohol/drogas, cuadro de velocidad). La
   * ficha lo usa para pintar la multa como RANGO y SIN énfasis (GC I1). `null` en la multa fija.
   */
  importeMaxEur?: number | null;
  puntos: number | null;
  /** Pena legible del delito para el bloque "Marco penal" de la ficha (solo vía penal). */
  penaTexto?: string | null;
  /** Gravedad penal (art. 33 CP) para el chip del marco penal (solo vía penal). */
  gravedadPenal?: GravedadPenal | null;
  textoBoletin: string;
  terminos: string[];
  consecuencias?: Array<{ tipo: Consecuencia['tipo']; textoCorto: string; fuente: string }>;
  marcoImporte: MarcoImporte;
  notaRevision: string;
}

/** Competencia por defecto para tráfico: Guardia Civil (interurbano), Local (urbano) y Tráfico. */
const COMPETENCIA_TRAFICO = {
  // Incluye policia_autonomica: las integrales (Mossos, Ertzaintza, Foral) tienen tráfico
  // transferido en su territorio. El aviso de competencia es orientativo; no debe echar al
  // autonómico de su propio trabajo.
  cuerpos: ['guardia_civil', 'policia_local', 'policia_autonomica', 'trafico'] as const,
  via: 'ambas' as const,
};

function construirInfraccion(input: InfraccionSeedInput): InfraccionSeed {
  const infraccion = Infraccion.parse({
    id: input.id,
    articuloId: input.articulo.id,
    codigoDgt: input.codigoDgt ?? null,
    tituloCorto: input.tituloCorto,
    gravedad: input.gravedad,
    tipo: input.tipo ?? 'administrativa',
    importeEur: input.importeEur,
    importeReducidoEur: input.importeReducidoEur,
    importeMaxEur: input.importeMaxEur ?? null,
    puntos: input.puntos,
    penaTexto: input.penaTexto ?? null,
    gravedadPenal: input.gravedadPenal ?? null,
    textoBoletin: input.textoBoletin,
    variantesBoletin: [],
    competencia: COMPETENCIA_TRAFICO,
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
      // La consecuencia de DETENCIÓN lleva la `regla` del motor (mismo helper que el seed penal),
      // para que la ficha pinte el árbol interactivo y el botón "Leer derechos". Sin gravedad penal
      // no se puede modelar el árbol → cae a `{}` (no debería ocurrir en un delito bien sembrado).
      regla:
        c.tipo === 'detencion' && input.gravedadPenal
          ? reglaDetencion(input.gravedadPenal)
          : {},
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
    revision: 'pendiente_revision',
    notaRevision: input.notaRevision,
  };
}

export const INFRACCIONES_SEED: InfraccionSeed[] = [
  construirInfraccion({
    id: 'inf-alumbrado-deficiente',
    articulo: ART_RGC_99,
    tituloCorto: 'Alumbrado deficiente',
    gravedad: 'leve',
    importeEur: 100,
    importeReducidoEur: 50,
    puntos: 0,
    textoBoletin:
      'Circular con el sistema de alumbrado en deficientes condiciones (luz fundida, faro roto o ' +
      'mal reglado) que impide alumbrar la vía o ser visto por el resto de usuarios.',
    terminos: [
      'faro roto',
      'luz fundida',
      'faro fundido',
      'sin luces',
      'luces fundidas',
      'piloto roto',
      'piloto fundido',
      'luz trasera',
      'sin luz',
      'bombilla fundida',
      'luz de posicion',
      'antiniebla',
      'circular sin luces',
    ],
    marcoImporte: 'trafico',
    notaRevision:
      'Clasificada como LEVE (100 €) para el caso común (faro/piloto fundido o mal reglado). ' +
      'A VERIFICAR: puede agravarse a GRAVE (200 €) si se circula prácticamente sin alumbrado de ' +
      'noche o con visibilidad reducida (peligro real, posible inmovilización). Contrastar con el ' +
      'codificado DGT antes de publicar.',
  }),
  construirInfraccion({
    id: 'inf-sin-seguro',
    articulo: ART_LRCSCVM_3,
    tituloCorto: 'Conducir sin seguro obligatorio',
    gravedad: 'muy_grave',
    importeEur: 601,
    importeReducidoEur: null,
    // Horquilla 601–3.005 € (LRCSCVM art. 3): NO es cifra fija. La ficha la pinta como rango, sin
    // énfasis (GC I1).
    importeMaxEur: 3005,
    puntos: 0,
    textoBoletin:
      'Circular con un vehículo a motor careciendo del seguro obligatorio de responsabilidad ' +
      'civil en vigor que cubra la circulación.',
    terminos: [
      'sin seguro',
      'sin poliza',
      'seguro caducado',
      'conducir sin seguro',
      'soa',
      'sin soa',
      'no tiene seguro',
      'sin seguro obligatorio',
      'grua',
      'inmoviliza',
      'deposito',
    ],
    consecuencias: [
      {
        tipo: 'inmovilizacion',
        textoCorto: 'Procede inmovilizar el vehículo hasta acreditar el seguro (art. 104 LSV).',
        fuente: 'LSV art. 104',
      },
      {
        tipo: 'deposito',
        textoCorto: 'Puede retirarse al depósito (grúa) si no se subsana la falta (art. 105 LSV).',
        fuente: 'LSV art. 105',
      },
    ],
    marcoImporte: 'seguro_obligatorio',
    notaRevision:
      'A VERIFICAR importe: la sanción se gradúa entre 601 y 3.005 € según circule o no, categoría ' +
      'del vehículo, duración y reiteración (LRCSCVM art. 3). Se fija el mínimo (601 €) como ' +
      'referencia; la reducción por pronto pago no aplica igual que en tráfico. Revisar gestión.',
  }),
  construirInfraccion({
    id: 'inf-movil-conduciendo',
    articulo: ART_RGC_18,
    tituloCorto: 'Uso del móvil conduciendo',
    gravedad: 'grave',
    importeEur: 200,
    importeReducidoEur: 100,
    puntos: 6,
    textoBoletin:
      'Conducir sujetando con la mano y utilizando el teléfono móvil (u otro dispositivo que ' +
      'requiera sujeción) mientras el vehículo se encuentra en movimiento.',
    terminos: [
      'movil',
      'telefono al volante',
      'mirando el movil',
      'hablando por telefono',
      'wasap conduciendo',
      'whatsapp',
      'movil en la mano',
      'con el movil en la mano',
      'usando el movil',
      'telefono en la mano',
    ],
    marcoImporte: 'trafico',
    notaRevision:
      'Importe 200 € (grave) y 6 puntos verificados (RGC art. 18; la reforma de 2022 elevó de 3 a ' +
      '6 puntos). Pendiente de visto bueno del revisor.',
  }),
  construirInfraccion({
    id: 'inf-itv-caducada',
    articulo: ART_RGV_10,
    tituloCorto: 'ITV caducada',
    gravedad: 'grave',
    importeEur: 200,
    importeReducidoEur: 100,
    puntos: 0,
    textoBoletin:
      'Circular con un vehículo cuya inspección técnica (ITV) está caducada o cuyo resultado no ' +
      'es favorable.',
    terminos: [
      'sin itv',
      'itv caducada',
      'itv pasada',
      'sin pasar la itv',
      'itv',
      'itv vencida',
      'itv fuera de plazo',
      'no ha pasado la itv',
      // Argot de calle (validación GC): resultado DESFAVORABLE de la ITV, no solo la caducada.
      'itv en rojo',
      'itv desfavorable',
      'paso la itv mal',
    ],
    marcoImporte: 'trafico',
    notaRevision:
      'Importe 200 € (grave) verificado; no detrae puntos. A VERIFICAR: si el retraso supera un ' +
      'año la infracción pasa a muy grave (500 €). Considerar modelarlo como variante. ' +
      'A VALORAR ficha propia para la ITV con resultado DESFAVORABLE (distinta de la caducada): ' +
      'por ahora los términos «itv en rojo/desfavorable/paso la itv mal» resuelven a esta ficha.',
  }),
  construirInfraccion({
    id: 'inf-sin-cinturon',
    articulo: ART_RGC_117,
    tituloCorto: 'No usar el cinturón de seguridad',
    gravedad: 'grave',
    importeEur: 200,
    importeReducidoEur: 100,
    puntos: 4,
    textoBoletin:
      'Circular sin hacer uso del cinturón de seguridad o de los sistemas de retención ' +
      'homologados estando el vehículo dotado de ellos.',
    terminos: [
      'sin cinturon',
      'sin cinto',
      'no llevar cinturon',
      'cinturon',
      'sin cinturon de seguridad',
      'sin abrochar',
      'sin abrocharse',
    ],
    marcoImporte: 'trafico',
    notaRevision:
      'Importe 200 € (grave) y 4 puntos verificados (RGC art. 117; Ley 18/2021, en vigor desde ' +
      'el 21/03/2022, elevó de 3 a 4 puntos). Pendiente de visto bueno del revisor.',
  }),
  construirInfraccion({
    id: 'inf-sin-casco',
    articulo: ART_RGC_118,
    tituloCorto: 'Circular sin casco homologado',
    gravedad: 'grave',
    importeEur: 200,
    importeReducidoEur: 100,
    puntos: 4,
    textoBoletin:
      'Conducir o viajar en motocicleta o ciclomotor sin el casco de protección homologado y ' +
      'correctamente abrochado.',
    terminos: [
      'sin casco',
      'moto sin casco',
      'circular sin casco',
      'casco',
      'sin casco homologado',
      'en moto sin casco',
    ],
    marcoImporte: 'trafico',
    notaRevision:
      'Importe 200 € (grave) y 4 puntos verificados (RGC art. 118; Ley 18/2021, en vigor desde ' +
      'el 21/03/2022, elevó de 3 a 4 puntos). Pendiente de visto bueno del revisor.',
  }),
  construirInfraccion({
    id: 'inf-semaforo-rojo',
    articulo: ART_RGC_146,
    tituloCorto: 'No respetar la luz roja del semáforo',
    gravedad: 'grave',
    importeEur: 200,
    importeReducidoEur: 100,
    puntos: 4,
    textoBoletin:
      'No detener el vehículo ante la luz roja de un semáforo, rebasando la línea de detención o ' +
      'el propio semáforo.',
    terminos: [
      'saltarse el semaforo',
      'semaforo en rojo',
      'pasarse el rojo',
      'saltarse un rojo',
      'semaforo',
      'se salto el rojo',
      'se salto el semaforo',
      'saltarse el rojo',
      'no respetar el semaforo',
      'semaforo rojo',
    ],
    marcoImporte: 'trafico',
    notaRevision:
      'Importe 200 € (grave) y 4 puntos verificados (RGC art. 146). Pendiente de visto bueno del ' +
      'revisor.',
  }),
  // --- Infracciones "reina" de calle añadidas en la ampliación del seed ---------------------
  construirInfraccion({
    id: 'inf-exceso-velocidad',
    articulo: ART_RGC_48,
    tituloCorto: 'Exceso de velocidad',
    gravedad: 'grave',
    // CUADRO graduado por exceso (LSV, cuadro de velocidad): 100 € sin puntos → 300/400/500/600 €
    // con 2/4/6 puntos según los km/h de exceso. NO es cifra cerrada (GC I1): se ancla en el suelo
    // del cuadro (100 €, sin puntos) y se marca el extremo (600 €) para que la ficha lo pinte como
    // rango "según exceso, desde 100 €", SIN énfasis. Los puntos varían por tramo (0–6), por lo que
    // NO se fija un valor único (un tile mostraría un número engañoso): el desglose vive en el
    // boletín y la nota de revisión.
    importeEur: 100,
    importeReducidoEur: 50,
    importeMaxEur: 600,
    puntos: null,
    textoBoletin:
      'Circular a velocidad superior a la permitida en la vía. La sanción es un CUADRO que se gradúa ' +
      'según el exceso sobre el límite (desde 100 €): 100 € (sin puntos), 300 € (2 puntos), 400 € ' +
      '(4 puntos), 500 € (6 puntos) y 600 € (6 puntos) en el tramo más alto. Superar el límite en ' +
      'más de 60 km/h en vía urbana o en más de 80 km/h en vía interurbana puede ser delito ' +
      '(art. 379.1 CP).',
    terminos: [
      'exceso de velocidad',
      'iba muy rapido',
      'corriendo',
      'a toda pastilla',
      'iba volando',
      'a tope',
      'echando leches',
      'radar',
      'me pillo el radar',
      'velocidad',
      'demasiado rapido',
      'sobrepasar el limite',
      'iba a 150',
    ],
    marcoImporte: 'velocidad',
    notaRevision:
      'A VERIFICAR el cuadro completo de tramos (importe y puntos por km/h de exceso, distinto ' +
      'según el límite de la vía) contra el cuadro de la LSV y el codificado DGT: la ficha lo pinta ' +
      'como rango "según exceso, desde 100 €" (100–600 €), SIN cifra fija enfatizada, y los puntos ' +
      '(0–6) se detallan en el boletín porque varían por tramo. Confirmar también la frontera penal ' +
      'del art. 379.1 CP (60 km/h urbana / 80 km/h interurbana sobre el límite). No publicar sin ' +
      'desglose por tramos.',
  }),
  construirInfraccion({
    id: 'inf-alcoholemia',
    articulo: ART_LSV_14,
    tituloCorto: 'Conducir bajo los efectos del alcohol',
    gravedad: 'muy_grave',
    // Cuadro DGT: 500 € (0,25–0,50 mg/l, 4 puntos) o 1.000 € (>0,50 mg/l, reincidencia o
    // conductor profesional/novel, 6 puntos). Se toma el tramo bajo como ancla y se marca el
    // extremo (1.000 €): NO es cifra fija, la ficha lo pinta como rango 500–1.000 € sin énfasis (GC I1).
    importeEur: 500,
    importeReducidoEur: 250,
    importeMaxEur: 1000,
    puntos: 4,
    textoBoletin:
      'Conducir con una tasa de alcohol superior a la permitida. En vía administrativa: 500 € y 4 ' +
      'puntos con tasa entre 0,25 y 0,50 mg/l en aire espirado; 1.000 € y 6 puntos con tasa superior ' +
      'a 0,50 mg/l, en caso de reincidencia o para conductores profesionales y noveles (límite 0,15 ' +
      'mg/l). Una tasa superior a 0,60 mg/l en aire espirado (1,2 g/l en sangre) puede ser delito ' +
      '(art. 379.2 CP).',
    terminos: [
      'alcoholemia',
      'dio positivo',
      'positivo en alcohol',
      'borracho',
      'bebido',
      'ha bebido',
      'control de alcohol',
      'soplar',
      'test de alcohol',
      'conducir bebido',
      'tasa de alcohol',
    ],
    consecuencias: [
      {
        tipo: 'inmovilizacion',
        textoCorto:
          'Procede valorar la inmovilización del vehículo mientras persista la causa, salvo que ' +
          'se haga cargo otro conductor habilitado (art. 104 LSV).',
        fuente: 'LSV art. 104',
      },
    ],
    marcoImporte: 'alcohol_drogas',
    notaRevision:
      'A VERIFICAR los dos tramos (500 €/4 puntos y 1.000 €/6 puntos), sus umbrales exactos y el ' +
      'límite reducido de 0,15 mg/l para noveles y profesionales, contra el cuadro DGT. Confirmar ' +
      'la frontera penal del art. 379.2 CP (0,60 mg/l aire / 1,2 g/l sangre). La ficha muestra el ' +
      'tramo bajo como referencia. No publicar sin el desglose por tramos.',
  }),
  construirInfraccion({
    id: 'inf-drogas-volante',
    articulo: ART_LSV_14,
    tituloCorto: 'Conducir con presencia de drogas',
    gravedad: 'muy_grave',
    importeEur: 1000,
    importeReducidoEur: 500,
    puntos: 6,
    textoBoletin:
      'Conducir con presencia de drogas en el organismo, detectada mediante prueba salival. La mera ' +
      'presencia se sanciona con 1.000 € y 6 puntos, sin que exista una tasa mínima tolerada (se ' +
      'excluyen las sustancias bajo prescripción y con finalidad terapéutica). Si se acredita que la ' +
      'droga influía en la conducción, el hecho puede ser delito (art. 379.2 CP).',
    terminos: [
      'drogas al volante',
      'positivo en drogas',
      'dio positivo en drogas',
      'test salival',
      'test de saliva',
      'porros',
      'cocaina al volante',
      'conducir drogado',
      'iba puesto',
      'colocado',
      'ciego',
      'control de drogas',
      'droga',
    ],
    consecuencias: [
      {
        tipo: 'inmovilizacion',
        textoCorto:
          'Procede valorar la inmovilización del vehículo mientras persista la causa, salvo que ' +
          'se haga cargo otro conductor habilitado (art. 104 LSV).',
        fuente: 'LSV art. 104',
      },
    ],
    marcoImporte: 'alcohol_drogas',
    notaRevision:
      'A VERIFICAR importe (1.000 €) y puntos (6) por mera presencia contra el cuadro DGT, y la ' +
      'frontera con el delito del art. 379.2 CP (exige acreditar la influencia en la conducción, ' +
      'según jurisprudencia reciente del TS). Revisar antes de publicar.',
  }),
  // --- Alcoholemia PENAL (art. 379.2 CP): la decisión "¿boletín o atestado?" -----------------
  // Delito HERMANO de la infracción administrativa `inf-alcoholemia` (art. 14 LSV). Lo que los
  // separa es la FRONTERA de 0,60 mg/l en aire (o la influencia acreditada): por encima es DELITO
  // (atestado + posible detención), por debajo es sanción administrativa (boletín). Reutiliza el
  // motor de detención (mismo helper `reglaDetencion`) igual que la negativa (art. 383) y la
  // temeraria (art. 380), para que la ficha pinte el árbol interactivo y "Leer derechos".
  construirInfraccion({
    id: 'del-alcoholemia-penal',
    articulo: ART_CP_379,
    tituloCorto: 'Alcoholemia penal (delito)',
    gravedad: 'delito',
    tipo: 'penal',
    importeEur: null,
    importeReducidoEur: null,
    puntos: null,
    // Art. 379.2 CP: prisión de 3 a 6 meses → MENOS GRAVE (art. 33.3 CP). Alimenta el motor de
    // detención (mismo escenario flagrante que la negativa del art. 383): orientación "procede".
    penaTexto:
      'Prisión de 3 a 6 meses o multa de 6 a 12 meses o trabajos en beneficio de la comunidad de ' +
      '31 a 90 días, y EN TODO CASO privación del derecho a conducir de más de 1 a 4 años (art. 379.2 CP)',
    gravedadPenal: 'menos_grave',
    textoBoletin:
      'FRONTERA administrativo ↔ penal. Conducir con una tasa de alcohol superior a 0,60 mg/l en ' +
      'aire espirado (o 1,2 g/l en sangre), o bajo la influencia acreditada de drogas o alcohol, es ' +
      'DELITO contra la seguridad vial (art. 379.2 CP) → procede instruir ATESTADO. POR DEBAJO de ' +
      '0,60 mg/l en aire (o 1,2 g/l en sangre), la conducción con exceso de alcohol es SANCIÓN ' +
      'ADMINISTRATIVA (art. 14 LSV) → boletín (ver ficha "Conducir bajo los efectos del alcohol"), ' +
      'SALVO que se acredite la influencia en la conducción, en cuyo caso también es delito ' +
      '(art. 379.2 CP, primer inciso). La calificación final corresponde a la autoridad judicial.',
    terminos: [
      'alcoholemia penal',
      'delito de alcoholemia',
      '0.60',
      '0,60',
      'penal por alcohol',
      'muy borracho al volante',
      'conducir bajo los efectos de las drogas',
      'delito contra la seguridad vial',
      'atestado por alcohol',
      'superar 0.60',
      'delito por drogas al volante',
    ],
    consecuencias: [
      {
        tipo: 'detencion',
        textoCorto:
          'Ante un delito flagrante procede valorar la detención conforme a los arts. 490 y 492 ' +
          'LECrim; la valoración de los indicios, del riesgo y del aseguramiento de la prueba de ' +
          'alcohol/drogas corresponde al agente y, en su caso, a la autoridad judicial.',
        fuente: 'CP art. 379.2; LECrim arts. 490 y 492',
      },
      {
        tipo: 'inmovilizacion',
        textoCorto:
          'Procede valorar la inmovilización del vehículo mientras persista la causa (art. 104 LSV), ' +
          'salvo que se haga cargo otro conductor habilitado, y la intervención del permiso de conducción.',
        fuente: 'LSV art. 104',
      },
    ],
    marcoImporte: 'penal',
    notaRevision:
      'A VERIFICAR la pena y la FRONTERA administrativo↔penal contra el texto consolidado del CP: ' +
      'delito del art. 379.2 CP → prisión de 3 a 6 meses o multa de 6 a 12 meses o trabajos en ' +
      'beneficio de la comunidad de 31 a 90 días, y en todo caso privación del derecho a conducir de ' +
      'más de 1 a 4 años → MENOS GRAVE (art. 33.3 CP). El umbral OBJETIVO es 0,60 mg/l en aire ' +
      'espirado (1,2 g/l en sangre); por debajo, la conducción bajo la influencia de bebidas ' +
      'alcohólicas también puede ser delito SI se acredita la influencia (indicios de la conducción). ' +
      'Distinguir con claridad de la sanción administrativa del art. 14 LSV (`inf-alcoholemia`) y de ' +
      'la NEGATIVA a la prueba (art. 383 CP, `inf-negativa-prueba`). Redacción de la detención a ' +
      'validar por el revisor jurídico (§4.6, lenguaje NUNCA imperativo). No lleva importe (vía penal).',
  }),
  // --- Velocidad PENAL (art. 379.1 CP): gemela de la alcoholemia penal ----------------------
  // Delito HERMANO de la sanción administrativa por velocidad (`inf-exceso-velocidad`, cuadro del
  // art. 48 RGC / LSV). Lo que los separa es la FRONTERA objetiva: superar el límite en más de 60
  // km/h en vía urbana o en más de 80 km/h en interurbana es DELITO (atestado + posible detención);
  // por debajo, es el CUADRO administrativo graduado (boletín). Reutiliza el mismo helper
  // `reglaDetencion` que la alcoholemia penal para pintar el árbol interactivo y "Leer derechos".
  construirInfraccion({
    id: 'del-velocidad-penal',
    articulo: ART_CP_379_1,
    tituloCorto: 'Exceso de velocidad penal (delito)',
    gravedad: 'delito',
    tipo: 'penal',
    importeEur: null,
    importeReducidoEur: null,
    puntos: null,
    // Art. 379.1 CP: prisión de 3 a 6 meses → MENOS GRAVE (art. 33.3 CP). Mismo marco penal que la
    // alcoholemia penal (art. 379.2): alimenta el árbol de detención (escenario flagrante → "procede").
    penaTexto:
      'Prisión de 3 a 6 meses o multa de 6 a 12 meses o trabajos en beneficio de la comunidad de ' +
      '31 a 90 días, y EN TODO CASO privación del derecho a conducir de más de 1 a 4 años (art. 379.1 CP)',
    gravedadPenal: 'menos_grave',
    textoBoletin:
      'FRONTERA administrativo ↔ penal. Conducir superando el límite reglamentario en MÁS DE 60 km/h ' +
      'en vía urbana o en MÁS DE 80 km/h en vía interurbana es DELITO contra la seguridad vial ' +
      '(art. 379.1 CP) → procede instruir ATESTADO. POR DEBAJO de esos umbrales, el exceso de ' +
      'velocidad es SANCIÓN ADMINISTRATIVA graduada por un CUADRO de tramos (ver ficha "Exceso de ' +
      'velocidad", desde 100 € y hasta 6 puntos según el exceso) → boletín. Ejemplos: en una vía ' +
      'urbana limitada a 50 km/h, el delito empieza al superar los 110 km/h; en una interurbana ' +
      'limitada a 90 km/h, al superar los 170 km/h. La calificación final corresponde a la autoridad judicial.',
    terminos: [
      'delito de velocidad',
      'iba a 200',
      '379.1',
      'mas de 80 de exceso',
      'mas de 60 en ciudad',
      'velocidad penal',
      'atestado por velocidad',
    ],
    consecuencias: [
      {
        tipo: 'detencion',
        textoCorto:
          'Ante un delito flagrante procede valorar la detención conforme a los arts. 490 y 492 ' +
          'LECrim; la valoración de los indicios, del riesgo y del aseguramiento de la prueba de la ' +
          'velocidad (cinemómetro/vídeo) corresponde al agente y, en su caso, a la autoridad judicial.',
        fuente: 'CP art. 379.1; LECrim arts. 490 y 492',
      },
      {
        tipo: 'inmovilizacion',
        textoCorto:
          'Procede valorar la inmovilización del vehículo mientras persista la causa (art. 104 LSV), ' +
          'salvo que se haga cargo otro conductor habilitado, y la intervención del permiso de conducción.',
        fuente: 'LSV art. 104',
      },
    ],
    marcoImporte: 'penal',
    notaRevision:
      'A VERIFICAR la pena y la FRONTERA administrativo↔penal contra el texto consolidado del CP: ' +
      'delito del art. 379.1 CP → prisión de 3 a 6 meses o multa de 6 a 12 meses o trabajos en ' +
      'beneficio de la comunidad de 31 a 90 días, y en todo caso privación del derecho a conducir de ' +
      'más de 1 a 4 años → MENOS GRAVE (art. 33.3 CP). Umbrales OBJETIVOS: +60 km/h sobre el límite ' +
      'en vía urbana y +80 km/h en interurbana. Distinguir con claridad de la sanción administrativa ' +
      'por velocidad (`inf-exceso-velocidad`, cuadro graduado) y del delito de conducción temeraria ' +
      '(art. 380 CP), que puede concurrir. Redacción de la detención a validar por el revisor ' +
      'jurídico (§4.6, lenguaje NUNCA imperativo). No lleva importe (vía penal). CONFIRMADO por ' +
      'fuente oficial el texto del art. 379.1 CP; revisar antes de publicar.',
  }),
  // --- Conducción sin permiso PENAL (art. 384 CP): gemela de la alcoholemia penal ------------
  // Delito HERMANO de la sanción administrativa `inf-sin-permiso` (art. 77 LSV). Lo que los separa
  // son los TRES supuestos del art. 384 CP: (a) tras perder TODOS los puntos, (b) tras privación
  // JUDICIAL del permiso, (c) sin haberlo obtenido NUNCA. Fuera de esos casos (p. ej. permiso
  // caducado sin renovar), es sanción administrativa. Mismo helper `reglaDetencion` (árbol + derechos).
  construirInfraccion({
    id: 'del-conduccion-sin-permiso',
    articulo: ART_CP_384,
    tituloCorto: 'Conducción sin permiso penal (delito)',
    gravedad: 'delito',
    tipo: 'penal',
    importeEur: null,
    importeReducidoEur: null,
    puntos: null,
    // Art. 384 CP: prisión de 3 a 6 meses → MENOS GRAVE (art. 33.3 CP). NO lleva privación del
    // derecho a conducir (a diferencia del 379): en los tres supuestos el reo carece ya de permiso
    // vigente. Alimenta el árbol de detención (escenario flagrante → "procede").
    penaTexto:
      'Prisión de 3 a 6 meses o multa de 12 a 24 meses o trabajos en beneficio de la comunidad de ' +
      '31 a 90 días (art. 384 CP)',
    gravedadPenal: 'menos_grave',
    textoBoletin:
      'FRONTERA administrativo ↔ penal. Es DELITO (art. 384 CP) conducir un vehículo a motor o ' +
      'ciclomotor en TRES supuestos: (a) tras la pérdida de vigencia del permiso por haber perdido ' +
      'TODOS los puntos; (b) tras haber sido privado cautelar o definitivamente del permiso por ' +
      'DECISIÓN JUDICIAL; y (c) sin haber obtenido NUNCA permiso o licencia → procede instruir ' +
      'ATESTADO. FUERA de esos tres casos (p. ej. permiso simplemente CADUCADO sin renovar, o no ' +
      'tener la clase adecuada), es SANCIÓN ADMINISTRATIVA muy grave (art. 77 LSV, ver ficha ' +
      '"Conducir sin permiso o sin vigencia") → boletín. La calificación final corresponde a la autoridad judicial.',
    terminos: [
      'conducir sin puntos',
      'sin puntos delito',
      'nunca ha tenido carnet',
      'privado del carnet por el juez',
      'conducir sin carnet delito',
      // Argot de calle (validación GC): «sin carne»/«sin carnet» son AMBIGUOS (pueden ser el art.
      // 77 LSV administrativo o el delito del 384): es correcto que surjan también aquí, igual que
      // ya lo hacen «conducir sin puntos» y «nunca ha tenido carnet».
      'sin carne',
      'sin carnet',
      '384',
    ],
    consecuencias: [
      {
        tipo: 'detencion',
        textoCorto:
          'Ante un delito flagrante procede valorar la detención conforme a los arts. 490 y 492 ' +
          'LECrim; la valoración de los indicios y del riesgo corresponde al agente y, en su caso, a ' +
          'la autoridad judicial.',
        fuente: 'CP art. 384; LECrim arts. 490 y 492',
      },
      {
        tipo: 'inmovilizacion',
        textoCorto:
          'Procede valorar la inmovilización del vehículo mientras persista la causa (art. 104 LSV), ' +
          'salvo que se haga cargo otro conductor habilitado.',
        fuente: 'LSV art. 104',
      },
    ],
    marcoImporte: 'penal',
    notaRevision:
      'A VERIFICAR la pena y los TRES supuestos contra el texto consolidado del CP: delito del art. ' +
      '384 CP → prisión de 3 a 6 meses o multa de 12 a 24 meses o trabajos en beneficio de la ' +
      'comunidad de 31 a 90 días → MENOS GRAVE (art. 33.3 CP). NO conlleva privación del derecho a ' +
      'conducir (el reo carece ya de permiso). Distinguir con claridad de la sanción administrativa ' +
      'del art. 77 LSV (`inf-sin-permiso`): el permiso caducado sin renovar o sin la clase adecuada ' +
      'suele ser administrativo. Redacción de la detención a validar por el revisor jurídico (§4.6, ' +
      'lenguaje NUNCA imperativo). No lleva importe (vía penal). CONFIRMADO por fuente oficial el ' +
      'texto del art. 384 CP (tres supuestos y pena); revisar antes de publicar.',
  }),
  construirInfraccion({
    id: 'inf-estacionamiento-indebido',
    articulo: ART_RGC_94,
    tituloCorto: 'Estacionamiento indebido',
    gravedad: 'grave',
    importeEur: 200,
    importeReducidoEur: 100,
    puntos: 0,
    textoBoletin:
      'Estacionar el vehículo en un lugar prohibido —sobre la acera o zona peatonal, en doble fila, ' +
      'en un paso de peatones, delante de un vado señalizado o en un carril reservado— obstaculizando ' +
      'la circulación o el paso de peatones.',
    terminos: [
      'mal aparcado',
      'aparcado en doble fila',
      'doble fila',
      'aparcar en la acera',
      'encima de la acera',
      'en el paso de cebra',
      'en el vado',
      'aparcado en el paso de peatones',
      'estacionar mal',
      'aparcar donde no se debe',
      'grua',
      // NOTA (validación de calle, Local): NO se enganchan aquí 'zona azul'/'zona verde'/'ora'/
      // 'parquimetro'/'sin ticket'/'ticket caducado'/'excedido'. Un exceso de estacionamiento
      // regulado (ORA) NO es este supuesto GRAVE de 200 € + grúa: se rige por la ORDENANZA
      // municipal (cuando esté cargada). Mientras no haya ordenanza de zona azul, es preferible
      // "sin resultado → solicitar mi ordenanza" que devolver un dato falso.
      'pmr',
      'plaza de minusvalidos',
      'plaza de movilidad reducida',
      'carga y descarga',
      'c/d',
      'aparcado en carga y descarga',
    ],
    consecuencias: [
      {
        tipo: 'deposito',
        textoCorto:
          'Procede valorar la retirada del vehículo por la grúa al depósito cuando obstaculiza la ' +
          'circulación o el paso, en los supuestos del art. 105 LSV.',
        fuente: 'LSV art. 105',
      },
    ],
    marcoImporte: 'trafico',
    notaRevision:
      'A VERIFICAR: muchos supuestos de parada/estacionamiento son leves (80–90 €) o dependen de la ' +
      'ordenanza municipal; la ficha modela el supuesto grave de 200 € (acera, paso de peatones, ' +
      'doble fila que obstaculiza). Confirmar clasificación y cuantía por supuesto antes de publicar.',
  }),
  construirInfraccion({
    id: 'inf-sin-permiso',
    articulo: ART_LSV_77,
    tituloCorto: 'Conducir sin permiso o sin vigencia',
    gravedad: 'muy_grave',
    importeEur: 500,
    importeReducidoEur: 250,
    puntos: 0,
    textoBoletin:
      'Conducir un vehículo careciendo del permiso o licencia de conducción correspondiente (por no ' +
      'haberlo obtenido para esa clase de vehículo o por pérdida de vigencia), cuando el hecho no sea ' +
      'constitutivo de delito. Es delito del art. 384 CP conducir tras perder todos los puntos, tras ' +
      'una privación judicial del permiso o sin haberlo obtenido nunca.',
    terminos: [
      'sin carnet',
      // Argot de calle (validación GC): «sin carne» sin la «t» final, muy frecuente.
      'sin carne',
      'sin carne de conducir',
      'conducir sin carnet',
      'no tiene carnet',
      'sin permiso',
      'carnet caducado',
      'permiso caducado',
      'sin puntos',
      'perdio todos los puntos',
      'conducir sin puntos',
      'nunca ha tenido carnet',
    ],
    consecuencias: [
      {
        tipo: 'inmovilizacion',
        textoCorto:
          'Procede valorar la inmovilización del vehículo mientras el conductor no acredite estar ' +
          'habilitado o no se haga cargo otro conductor habilitado (art. 104 LSV).',
        fuente: 'LSV art. 104',
      },
    ],
    marcoImporte: 'trafico',
    notaRevision:
      'A VERIFICAR la frontera administrativa/penal: 500 € (muy grave, art. 77 LSV) SOLO cuando no ' +
      'sea delito. Si nunca obtuvo permiso, si fue privado judicialmente o si perdió todos los ' +
      'puntos y sigue conduciendo, es delito del art. 384 CP (procede atestado). El caso del permiso ' +
      'caducado sin renovar suele ser administrativo. Revisar clasificación antes de publicar.',
  }),
  construirInfraccion({
    id: 'inf-vmp-patinete',
    articulo: ART_RGC_121,
    tituloCorto: 'Infracciones con patinete (VMP)',
    gravedad: 'grave',
    importeEur: 200,
    importeReducidoEur: 100,
    puntos: 0,
    textoBoletin:
      'Circular con un vehículo de movilidad personal (patinete eléctrico) incumpliendo las normas: ' +
      'por la acera o zona peatonal, sin alumbrado ni elementos reflectantes de noche, o con dos ' +
      'ocupantes. Circular por la acera o sin alumbrado nocturno se sanciona, de forma orientativa y ' +
      'según la ordenanza municipal, con unos 200 €; llevar dos personas, con unos 100 €. El VMP no ' +
      'detrae puntos porque no requiere permiso de conducción.',
    terminos: [
      'patinete',
      'patinete electrico',
      'vmp',
      'patinete en la acera',
      'patinete sin luces',
      'dos en un patinete',
      'patinete dos personas',
      'patinete de noche',
      'patin',
      'dos en el patin',
      'con auriculares',
      'patinete con auriculares',
      'patinete de menor',
      'patinete sin seguro',
      'patinete a dos',
      'patinete sin luz',
      'patinete tuneado',
    ],
    consecuencias: [
      {
        tipo: 'inmovilizacion',
        // MISMO texto que la ficha municipal `ord-sctf-vmp-acera`: el mismo hecho (VMP de riesgo)
        // no puede dar mensajes distintos entre la capa estatal y la municipal (validación de calle).
        textoCorto:
          'Procede valorar la retención (inmovilización cautelar) del VMP cuando su circulación ' +
          'entrañe riesgo, hasta que cese la causa; la medida y la devolución del vehículo las ' +
          'concreta la ordenanza municipal.',
        fuente: 'RGC (RD 1428/2003, reforma RD 970/2020) y ordenanza municipal',
      },
    ],
    marcoImporte: 'trafico',
    notaRevision:
      'A VERIFICAR: los VMP se regulan por el RGC (reforma del RD 970/2020) Y por la ordenanza ' +
      'municipal, que puede endurecer o matizar (casco, chaleco, zonas). Los importes citados ' +
      '(200 €/100 €) proceden de criterios DGT; confirmar por supuesto y advertir de la variación ' +
      'municipal. Alcohol y drogas en VMP se rigen por sus propias tasas. No detrae puntos. A ' +
      'VERIFICAR además la INMOVILIZACIÓN/retención cautelar del VMP en supuestos de riesgo: es ' +
      'ORIENTATIVA y depende de la ordenanza municipal; confirmar con el revisor jurídico. Revisar.',
  }),
  construirInfraccion({
    id: 'inf-menor-sin-sri',
    articulo: ART_RGC_117,
    tituloCorto: 'Menor sin sistema de retención (sillita)',
    gravedad: 'grave',
    importeEur: 200,
    importeReducidoEur: 100,
    puntos: 4,
    textoBoletin:
      'Circular transportando a un menor sin el sistema de retención infantil homologado y adecuado ' +
      'a su talla y peso, o utilizándolo de forma incorrecta, estando obligado a ello.',
    terminos: [
      'sin sillita',
      'nino sin sillita',
      'menor sin sillita',
      'sin silla del bebe',
      'nino sin cinturon',
      'sillita mal puesta',
      'sin sistema de retencion',
      'bebe sin silla',
    ],
    consecuencias: [
      {
        tipo: 'inmovilizacion',
        textoCorto:
          'Procede valorar la inmovilización del vehículo si el menor no puede continuar el viaje ' +
          'de forma segura (art. 104 LSV).',
        fuente: 'LSV art. 104',
      },
    ],
    marcoImporte: 'trafico',
    notaRevision:
      'Importe 200 € (grave) verificado. A VERIFICAR los puntos: se citan 4 puntos, que se detraen ' +
      'al conductor solo cuando es el responsable del menor; confirmar contra el codificado DGT. ' +
      'La infracción se aplica por cada ocupante menor sin retención. Revisar antes de publicar.',
  }),
  construirInfraccion({
    id: 'inf-negativa-prueba',
    articulo: ART_CP_383,
    tituloCorto: 'Negativa a la prueba de alcohol o drogas',
    gravedad: 'delito',
    tipo: 'penal',
    importeEur: null,
    importeReducidoEur: null,
    puntos: null,
    // Art. 383 CP: prisión de 6 meses a 1 año → MENOS GRAVE (art. 33 CP). La gravedad penal alimenta
    // el motor de detención (mismo que el seed penal) para que la ficha pinte el árbol y "Leer derechos".
    penaTexto: 'Prisión de 6 meses a 1 año y privación del derecho a conducir de 1 a 4 años (art. 383 CP)',
    gravedadPenal: 'menos_grave',
    textoBoletin:
      'Negarse, requerido por el agente, a someterse a las pruebas legalmente establecidas de ' +
      'detección de alcohol o de presencia de drogas. Es un delito autónomo del art. 383 CP, ' +
      'castigado con prisión de seis meses a un año y privación del derecho a conducir. La ' +
      'valoración final corresponde a la autoridad judicial.',
    terminos: [
      'negarse a soplar',
      'no quiere soplar',
      'se niega a la prueba',
      'negativa a la prueba',
      'no sopla',
      'se niega al test',
      'rechaza la prueba de alcohol',
      'no se somete a la prueba',
      // Argot de calle (validación GC): en pasado, como lo cuenta el agente en el atestado.
      'se nego a soplar',
      'no quiso soplar',
    ],
    consecuencias: [
      {
        tipo: 'detencion',
        textoCorto:
          'Ante un delito flagrante procede valorar la detención conforme a los arts. 490 y 492 ' +
          'LECrim; la valoración de los indicios y del riesgo corresponde al agente y al juez.',
        fuente: 'CP art. 383; LECrim arts. 490 y 492',
      },
    ],
    marcoImporte: 'trafico',
    notaRevision:
      'A VERIFICAR el encaje penal: delito del art. 383 CP (negativa a las pruebas). Confirmar la ' +
      'redacción orientativa de la detención con el revisor jurídico (§4.6, lenguaje NUNCA ' +
      'imperativo) y si procede reflejar pérdida de puntos asociada. No es sanción administrativa: ' +
      'no lleva importe. Revisar antes de publicar.',
  }),
  // --- Fichas "de calle" añadidas para la Guardia Civil de Tráfico (ronda validadores) -------
  construirInfraccion({
    id: 'inf-conduccion-temeraria',
    articulo: ART_CP_380,
    tituloCorto: 'Conducción temeraria',
    gravedad: 'delito',
    tipo: 'penal',
    importeEur: null,
    importeReducidoEur: null,
    puntos: null,
    penaTexto: 'Prisión de 6 meses a 2 años y privación del derecho a conducir de 1 a 6 años (art. 380 CP)',
    gravedadPenal: 'menos_grave',
    textoBoletin:
      'Conducir un vehículo a motor o ciclomotor con temeridad manifiesta poniendo en concreto ' +
      'peligro la vida o la integridad de las personas (art. 380 CP). Se presume la temeridad ' +
      'manifiesta cuando concurren un exceso de velocidad y una tasa de alcohol constitutivos de ' +
      'delito. Si además se conduce con manifiesto desprecio por la vida de los demás, procede el ' +
      'art. 381 CP (pena superior). La calificación final corresponde a la autoridad judicial.',
    terminos: [
      'conduccion temeraria',
      'temeraria',
      'conducir de forma temeraria',
      'conduccion peligrosa',
      'poniendo en peligro',
      'zigzag entre coches',
      'circular en sentido contrario',
      'conducir a lo loco',
      'temerario',
    ],
    consecuencias: [
      {
        tipo: 'detencion',
        textoCorto:
          'Ante un delito flagrante (art. 490 LECrim) procede valorar la detención; en un delito ' +
          'menos grave el art. 492.1 LECrim prevé la obligación de detener cuando concurre una causa ' +
          'del art. 490. Valórese según los indicios y el riesgo; la valoración final corresponde al ' +
          'agente y, en su caso, a la autoridad judicial.',
        fuente: 'CP art. 380; LECrim arts. 490 y 492.1',
      },
      {
        tipo: 'inmovilizacion',
        textoCorto:
          'Procede valorar la inmovilización del vehículo mientras persista la situación de riesgo ' +
          '(art. 104 LSV) y la intervención del permiso de conducción.',
        fuente: 'LSV art. 104',
      },
    ],
    marcoImporte: 'penal',
    notaRevision:
      'A VERIFICAR el marco de pena y el subtipo: conducción temeraria del art. 380 CP (prisión de ' +
      '6 meses a 2 años → MENOS GRAVE); con manifiesto desprecio por la vida de los demás pasa al ' +
      'art. 381 CP (prisión de 2 a 5 años, con posible rebaja del 381.2). Confirmar penas y la ' +
      'presunción del art. 380.2 (exceso de velocidad + alcohol constitutivos de delito) contra el ' +
      'texto consolidado del CP. Redacción de la detención a validar por el revisor jurídico (§4.6).',
  }),
  construirInfraccion({
    id: 'inf-tacografo',
    articulo: ART_LOTT_140,
    tituloCorto: 'Manipulación del tacógrafo o exceso de tiempos',
    gravedad: 'muy_grave',
    // LOTT art. 143: horquilla del tramo MUY GRAVE (1.001–6.000 €). NO es cifra fija: la ficha lo
    // pinta como rango sin énfasis (GC I1). A verificar el importe exacto contra el texto consolidado.
    importeEur: 1001,
    importeReducidoEur: null,
    importeMaxEur: 6000,
    puntos: null,
    textoBoletin:
      'Manipular o falsear el tacógrafo, el limitador de velocidad o sus elementos (imanes, ' +
      'emuladores, alteración de datos), o incumplir los tiempos de conducción y descanso del ' +
      'Reglamento (CE) 561/2006. Es infracción muy grave de la LOTT (art. 140), sancionable con ' +
      'multa y precinto/inmovilización, sin perjuicio de que la manipulación pueda ser constitutiva ' +
      'de delito (falsedad). La valoración final corresponde a la autoridad competente.',
    terminos: [
      'tacografo',
      'manipular tacografo',
      'iman en el tacografo',
      'tacografo manipulado',
      'falsear el tacografo',
      'tiempos de conduccion',
      'exceso de jornada',
      'no ha descansado',
      'disco del tacografo',
      'tarjeta de conductor',
      'sin descanso',
    ],
    consecuencias: [
      {
        tipo: 'inmovilizacion',
        textoCorto:
          'Procede valorar la inmovilización o el precinto del vehículo y del dispositivo ' +
          'manipulado hasta que se subsane, conforme al régimen sancionador de la LOTT.',
        fuente: 'LOTT art. 143',
      },
    ],
    marcoImporte: 'transporte',
    notaRevision:
      'A VERIFICAR el importe y la clasificación exactos: la LOTT (art. 140/143, reformada por la ' +
      'Ley 13/2021) sanciona la manipulación del tacógrafo como MUY GRAVE; el seed fija la horquilla ' +
      '1.001–6.000 € del tramo muy grave, pendiente de confirmar contra el texto consolidado y su ' +
      'reglamento (RD 1211/1990). A VERIFICAR además la frontera penal: la manipulación puede ser ' +
      'delito de falsedad (arts. 390/395 CP), lo que abriría la vía penal. No detrae puntos DGT. ' +
      'Consúltese el artículo para el importe efectivo. Revisar con el revisor jurídico.',
  }),
  // --- Transporte pesado: sobrecarga / exceso de MMA (LOTT, marco `transporte`) --------------
  construirInfraccion({
    id: 'inf-exceso-mma',
    articulo: ART_LOTT_141,
    tituloCorto: 'Exceso de masa máxima autorizada (sobrecarga)',
    gravedad: 'grave',
    // Horquilla del tramo GRAVE del exceso de masa (aprox. 401–2.000 €): NO es cifra fija, se gradúa
    // por el porcentaje de sobrepeso. La ficha la pinta como rango, sin énfasis (GC I1). El tramo
    // muy grave (>20 % de exceso) sube más: a verificar contra el texto consolidado y su reglamento.
    importeEur: 401,
    importeReducidoEur: null,
    importeMaxEur: 2000,
    puntos: null,
    textoBoletin:
      'Circular con un vehículo o conjunto que supera la masa máxima autorizada (MMA) o los límites ' +
      'por eje. El exceso de masa se gradúa por el PORCENTAJE de sobrepeso: hasta ~5 % suele ser leve, ' +
      'entre ~5 % y ~20 % grave, y por encima de ~20 % muy grave (con importes mayores). La ' +
      'responsabilidad puede alcanzar al transportista, al cargador y al expedidor. Los límites de masa ' +
      'los fija el Reglamento General de Vehículos (RD 2822/1998). No detrae puntos DGT.',
    terminos: [
      'sobrecargado',
      'pasado de peso',
      'exceso de peso',
      'exceso de mma',
      'masa maxima',
      'va cargado de mas',
      'sobrepeso camion',
    ],
    consecuencias: [
      {
        tipo: 'inmovilizacion',
        textoCorto:
          'Procede valorar la inmovilización del vehículo cuando el exceso de masa se detecta en ' +
          'carretera, hasta que se subsane la causa (descarga o transbordo de la mercancía sobrante).',
        fuente: 'LOTT art. 143 (y su reglamento, RD 1211/1990)',
      },
    ],
    marcoImporte: 'transporte',
    notaRevision:
      'Cotejado con el revisor jurídico: el exceso de masa GRAVE se tipifica en el art. 141 LOTT ' +
      '(apartado 141.2) y el MUY GRAVE en el art. 140 (apartado 140.23); el art. 143 no tipifica, solo ' +
      'FIJA la cuantía (el exceso de masa tiene escala sancionadora propia: leve 301–400 / grave ' +
      '401–2.000 / muy grave 2.001–4.000 €). El seed ancla el tramo GRAVE (401–2.000 €). A VERIFICAR el ' +
      'TRAMO exacto por porcentaje de exceso contra el texto consolidado de la LOTT (reformada por la ' +
      'Ley 13/2021) y su reglamento (RD 1211/1990): los umbrales de porcentaje varían según la MMA del ' +
      'vehículo y según sea sobre uno o dos ejes. La inmovilización hasta subsanar (descarga/transbordo) ' +
      'es la medida operativa habitual. No detrae puntos. Revisar por supuesto antes de publicar.',
  }),
  // --- Transporte pesado: carga mal estibada / sin sujeción (RGC art. 14, marco `transporte`) --
  construirInfraccion({
    id: 'inf-sujecion-carga',
    articulo: ART_RGC_14,
    tituloCorto: 'Carga mal estibada o sin sujeción',
    gravedad: 'grave',
    // Se modela como infracción de CIRCULACIÓN (RGC art. 14 → LSV): grave de 200 € (cifra fija, con
    // pronto pago), NO como sanción de transporte por horquilla (revisor jurídico: la mezcla anterior
    // "RGC art. 14 + marco transporte + 401–1.000 €" era internamente incoherente).
    importeEur: 200,
    importeReducidoEur: 100,
    importeMaxEur: null,
    puntos: null,
    textoBoletin:
      'Transportar la carga sin disponerla ni sujetarla debidamente, de forma que pueda arrastrar, ' +
      'caer total o parcialmente, desplazarse de manera peligrosa o comprometer la estabilidad del ' +
      'vehículo (art. 14 RGC). Es una de las causas más frecuentes de pérdida de carga en carretera. ' +
      'Como infracción de circulación es grave; procede valorar la inmovilización hasta la reestiba.',
    terminos: [
      'carga suelta',
      'carga mal atada',
      'mercancia sin atar',
      'sujecion de carga',
      'carga sin amarrar',
    ],
    consecuencias: [
      {
        tipo: 'inmovilizacion',
        textoCorto:
          'Procede valorar la inmovilización del vehículo hasta que la carga quede correctamente ' +
          'dispuesta y sujeta (reestiba), cuando su estado suponga un riesgo para la circulación.',
        fuente: 'LSV art. 104',
      },
    ],
    marcoImporte: 'trafico',
    notaRevision:
      'A VERIFICAR el precepto sancionador y la cuantía por supuesto. La DISPOSICIÓN DE LA CARGA es el ' +
      'art. 14 del RGC (RD 1428/2003) —NO el art. 14 de la LSV, que regula el alcohol—: confirmado por ' +
      'fuente oficial. Tras la revisión jurídica, la ficha modela la mala estiba como infracción de ' +
      'CIRCULACIÓN (marco `trafico`), GRAVE de 200 € con pronto pago, que es la vía coherente con el ' +
      'artículo citado. ALTERNATIVA a valorar por supuesto: si el hecho se persigue por la vía del ' +
      'TRANSPORTE (LOTT / RD 563/2017 sobre control de la sujeción de la carga en carretera), la ' +
      'clasificación y la cuantía cambian (horquilla, no cifra fija). La inmovilización hasta reestiba ' +
      'es la medida operativa habitual. A VERIFICAR los puntos DGT (el seed no fija). Revisar.',
  }),
  // --- Transporte pesado: mercancías peligrosas / ADR (LOTT muy grave, marco `transporte`) ----
  construirInfraccion({
    id: 'inf-adr-mercancias-peligrosas',
    articulo: ART_LOTT_MMPP,
    tituloCorto: 'Mercancías peligrosas: incumplimiento del ADR',
    gravedad: 'muy_grave',
    // Horquilla del tramo alto del muy grave ADR (4.001–6.000 €): NO es cifra fija. Se pinta como
    // rango, sin énfasis (GC I1). El revisor jurídico sitúa el ADR general (art. 140.15) en el tramo
    // alto; con reincidencia en 12 meses sube (6.001–18.000 €, fuera del rango del validador, ver nota).
    importeEur: 4001,
    importeReducidoEur: null,
    importeMaxEur: 6000,
    puntos: null,
    textoBoletin:
      'Transportar mercancías peligrosas incumpliendo las condiciones del ADR: sin los paneles ' +
      'naranjas ni las etiquetas de peligro reglamentarias, sin la carta de porte con los datos de la ' +
      'mercancía (número ONU), o sin la autorización, la formación del conductor (certificado ADR) o ' +
      'los equipos de seguridad obligatorios. Es infracción muy grave de la LOTT, sancionable con ' +
      'multa y precinto/inmovilización del vehículo. La valoración final corresponde a la autoridad ' +
      'competente.',
    terminos: [
      'adr',
      'mercancias peligrosas',
      'camion de peligrosas',
      'paneles naranjas',
      'numero onu',
      'carta de porte adr',
      'sin adr',
    ],
    consecuencias: [
      {
        tipo: 'inmovilizacion',
        textoCorto:
          'Procede valorar la inmovilización o el precinto del vehículo hasta que se subsane el ' +
          'incumplimiento del ADR, conforme al régimen sancionador de la LOTT.',
        fuente: 'LOTT art. 143 (y su reglamento, RD 1211/1990)',
      },
    ],
    marcoImporte: 'transporte',
    notaRevision:
      'A VERIFICAR el importe, la clasificación y el PRECEPTO exactos contra el texto consolidado de la ' +
      'LOTT (arts. 140-143, reformada por la Ley 13/2021), su reglamento (RD 1211/1990), el RD 97/2014 ' +
      '(que desarrolla en España el transporte de mercancías peligrosas por carretera) y el propio ADR ' +
      'vigente. El artículo citado ("140 mercancías peligrosas") es una REFERENCIA al bloque de ' +
      'infracciones muy graves del art. 140.15 LOTT y sus subapartados (p. ej. 140.15.5 paneles/' +
      'etiquetas, 140.15.8 carta de porte, 140.15.3 certificado de aprobación): A VERIFICAR el ' +
      'subapartado/letra concreto por supuesto. El seed ancla el tramo ALTO del muy grave ' +
      '(4.001–6.000 €), donde el revisor sitúa el ADR general; con REINCIDENCIA en 12 meses la cuantía ' +
      'sube a 6.001–18.000 € (fuera del rango del validador `transporte`, por eso solo se anota, no se ' +
      'modela como importe). Distinguir los distintos incumplimientos (paneles, carta de porte, ' +
      'formación, cisterna). El precinto/inmovilización es la medida operativa habitual. Revisar.',
  }),
  // === OLA 2 del catálogo: submenú TRANSPORTE (LOTT arts. 140-143, marco `transporte`) ========
  // Cubre los sub-temas del submenú de transporte de SPPLB que aún no teníamos: título habilitante,
  // viajeros, escolar, ADR (variantes), perecederas (ATP), documentación/visado, dimensiones y
  // tacógrafo (variante documental). NO duplican las de Ola 1 (`inf-tacografo` manipulación/tiempos,
  // `inf-exceso-mma` masa, `inf-adr-mercancias-peligrosas` ADR general). Sanciones LOTT = HORQUILLAS
  // amplias (importeEur = mínimo del tramo + importeMaxEur = extremo), NO cifra fija; sin pronto pago
  // modelado (importeReducidoEur null, a verificar); sin puntos DGT (el transporte LOTT no detrae
  // puntos). TODO `pendiente_revision`: la nota marca "a verificar" el apartado/letra, la gravedad y
  // la horquilla. Consecuencia habitual: inmovilización/precinto.
  // --- Título habilitante (transporte público/privado) --------------------------------------
  construirInfraccion({
    id: 'inf-transporte-sin-titulo',
    articulo: ART_LOTT_140_TITULO,
    tituloCorto: 'Transporte público sin título habilitante',
    gravedad: 'muy_grave',
    // Horquilla del tramo alto del muy grave LOTT (4.001–6.000 €): NO cifra fija. Se pinta como rango.
    importeEur: 4001,
    importeReducidoEur: null,
    importeMaxEur: 6000,
    puntos: null,
    textoBoletin:
      'Realizar transporte público de mercancías o de viajeros careciendo de la autorización, título ' +
      'habilitante o tarjeta de transporte, o seguir prestándolo tras su caducidad, revocación o ' +
      'suspensión. Es infracción muy grave de la LOTT, sancionable con multa y con la posibilidad de ' +
      'inmovilizar o precintar el vehículo hasta que se subsane. La valoración final corresponde a la ' +
      'autoridad competente.',
    terminos: [
      'sin tarjeta de transporte',
      'camion sin tarjeta',
      'transporte sin autorizacion',
      'sin titulo de transporte',
      'transportista sin licencia',
      'transporte publico ilegal',
    ],
    consecuencias: [
      {
        tipo: 'inmovilizacion',
        textoCorto:
          'Procede valorar la inmovilización o el precinto del vehículo hasta que se acredite el ' +
          'título habilitante o cese la prestación, conforme al régimen sancionador de la LOTT.',
        fuente: 'LOTT art. 143 (y su reglamento, ROTT)',
      },
    ],
    marcoImporte: 'transporte',
    notaRevision:
      'A VERIFICAR el apartado/letra exacto del art. 140 LOTT (carecer de título habilitante para el ' +
      'transporte público; reformado por la Ley 13/2021) y la GRAVEDAD por supuesto contra el texto ' +
      'consolidado y el ROTT (RD 1211/1990). El seed ancla el tramo ALTO del muy grave (4.001–6.000 €) ' +
      'como horquilla; A VERIFICAR el importe efectivo por supuesto. Sin pronto pago modelado (a ' +
      'verificar la reducción del 30 %). No detrae puntos DGT. Revisar por supuesto antes de publicar.',
  }),
  construirInfraccion({
    id: 'inf-transporte-privado-excede',
    articulo: ART_LOTT_141_PRIVADO,
    tituloCorto: 'Transporte privado excediendo sus límites',
    gravedad: 'grave',
    // Horquilla del tramo grave LOTT (401–1.000 €): NO cifra fija. Se pinta como rango.
    importeEur: 401,
    importeReducidoEur: null,
    importeMaxEur: 1000,
    puntos: null,
    textoBoletin:
      'Realizar transporte privado complementario excediendo los límites que lo definen: transportar ' +
      'mercancías o personas ajenas a la propia actividad de la empresa, o mediante precio, como si ' +
      'fuera transporte público, sin disponer del título habilitante que este exigiría. La cuantía y ' +
      'las medidas se rigen por la LOTT. La valoración final corresponde a la autoridad competente.',
    terminos: [
      'transporte privado ilegal',
      'transporte por cuenta propia excedido',
      'privado como si fuera publico',
      'transporte sin ser publico',
      'cobrar por transportar sin licencia',
    ],
    consecuencias: [
      {
        tipo: 'inmovilizacion',
        textoCorto:
          'Procede valorar la inmovilización del vehículo hasta que cese la actividad no amparada por ' +
          'el título, conforme al régimen sancionador de la LOTT.',
        fuente: 'LOTT art. 143 (y su reglamento, ROTT)',
      },
    ],
    marcoImporte: 'transporte',
    notaRevision:
      'A VERIFICAR el apartado exacto y la GRAVEDAD contra el texto consolidado de la LOTT (arts. ' +
      '140-142, reformada por la Ley 13/2021) y el ROTT: exceder los límites del transporte privado ' +
      'complementario puede ser grave o, según el caso (ánimo de lucro, reiteración), reconducirse a la ' +
      'falta de título habilitante (muy grave). El seed ancla el tramo GRAVE (401–1.000 €); A VERIFICAR ' +
      'la horquilla. Sin pronto pago modelado. No detrae puntos DGT. Revisar por supuesto.',
  }),
  // --- Viajeros (autobús / VTC / taxi) -------------------------------------------------------
  construirInfraccion({
    id: 'inf-viajeros-sin-autorizacion',
    articulo: ART_LOTT_140_TITULO,
    tituloCorto: 'Transporte de viajeros sin autorización',
    gravedad: 'muy_grave',
    importeEur: 4001,
    importeReducidoEur: null,
    importeMaxEur: 6000,
    puntos: null,
    textoBoletin:
      'Realizar transporte de viajeros (autobús, autocar, vehículo de arrendamiento con conductor ' +
      '—VTC— o taxi) careciendo de la autorización o licencia exigible, o excediendo su ámbito. Es ' +
      'infracción muy grave de la LOTT, sancionable con multa y con la posibilidad de inmovilizar o ' +
      'precintar el vehículo. La valoración final corresponde a la autoridad competente.',
    terminos: [
      'autobus sin licencia',
      'vtc sin autorizacion',
      'taxi sin licencia',
      'bus sin autorizacion',
      'transporte de viajeros ilegal',
      'llevar pasajeros sin licencia',
    ],
    consecuencias: [
      {
        tipo: 'inmovilizacion',
        textoCorto:
          'Procede valorar la inmovilización o el precinto del vehículo hasta que se acredite la ' +
          'autorización o cese la prestación, conforme al régimen sancionador de la LOTT.',
        fuente: 'LOTT art. 143 (y su reglamento, ROTT)',
      },
    ],
    marcoImporte: 'transporte',
    notaRevision:
      'A VERIFICAR el apartado/letra del art. 140 LOTT (transporte público de viajeros sin título) y su ' +
      'gravedad contra el texto consolidado (Ley 13/2021) y el ROTT. Distinguir el régimen del TAXI y ' +
      'del VTC (competencias autonómicas/locales y RD 1076/2017 para VTC) del transporte en autobús. El ' +
      'seed ancla el tramo alto del muy grave (4.001–6.000 €); A VERIFICAR importe y horquilla por ' +
      'supuesto. Sin pronto pago modelado. No detrae puntos DGT. Revisar antes de publicar.',
  }),
  construirInfraccion({
    id: 'inf-viajeros-exceso-plazas',
    articulo: ART_LOTT_141_VIAJEROS,
    tituloCorto: 'Exceso de viajeros sobre las plazas autorizadas',
    gravedad: 'grave',
    importeEur: 401,
    importeReducidoEur: null,
    importeMaxEur: 1000,
    puntos: null,
    textoBoletin:
      'Transportar un número de viajeros superior al de plazas autorizadas del vehículo (las que ' +
      'figuran en la ficha técnica y la tarjeta de transporte). Es infracción de la LOTT; procede ' +
      'valorar la regularización del exceso de ocupantes antes de reanudar la marcha.',
    terminos: [
      'exceso de viajeros',
      'mas pasajeros de la cuenta',
      'bus con exceso de plazas',
      'autobus sobreocupado',
      'demasiados pasajeros',
    ],
    consecuencias: [
      {
        tipo: 'inmovilizacion',
        textoCorto:
          'Procede valorar la inmovilización del vehículo hasta que se regularice el número de ' +
          'ocupantes al de plazas autorizadas, conforme al régimen sancionador de la LOTT.',
        fuente: 'LOTT art. 143 (y su reglamento, ROTT)',
      },
    ],
    marcoImporte: 'transporte',
    notaRevision:
      'A VERIFICAR el apartado exacto (exceso de viajeros sobre plazas autorizadas) y la GRAVEDAD contra ' +
      'el texto consolidado de la LOTT (arts. 140-142, Ley 13/2021) y el ROTT: el exceso puede graduarse ' +
      'según su porcentaje. El seed ancla el tramo GRAVE (401–1.000 €); A VERIFICAR la horquilla. Sin ' +
      'pronto pago modelado. No detrae puntos DGT. Revisar por supuesto.',
  }),
  construirInfraccion({
    id: 'inf-viajeros-sin-billete',
    articulo: ART_LOTT_142_VIAJEROS,
    tituloCorto: 'Viajeros sin billetes ni hojas de reclamación',
    gravedad: 'leve',
    // Horquilla del tramo leve LOTT (100–200 €): NO cifra fija. Se pinta como rango.
    importeEur: 100,
    importeReducidoEur: null,
    importeMaxEur: 200,
    puntos: null,
    textoBoletin:
      'Prestar transporte de viajeros careciendo de los billetes u otro título de transporte de los ' +
      'usuarios, no expedirlos, o carecer de las hojas de reclamación a disposición de los viajeros. Es ' +
      'infracción leve de la LOTT por incumplimiento de las obligaciones formales del servicio.',
    terminos: [
      'sin billetes',
      'sin hojas de reclamacion',
      'sin billete el autobus',
      'no da billete',
      'sin titulo de transporte del viajero',
    ],
    marcoImporte: 'transporte',
    notaRevision:
      'A VERIFICAR el apartado exacto del art. 142 LOTT (obligaciones formales de billetes/hojas de ' +
      'reclamación) contra el texto consolidado (Ley 13/2021) y el ROTT. El seed ancla el tramo LEVE ' +
      '(100–200 €) como horquilla; A VERIFICAR el importe efectivo. Sin pronto pago modelado. No detrae ' +
      'puntos DGT. Revisar por supuesto antes de publicar.',
  }),
  // --- Transporte escolar y de menores -------------------------------------------------------
  construirInfraccion({
    id: 'inf-transporte-escolar',
    articulo: ART_LOTT_ESCOLAR,
    tituloCorto: 'Transporte escolar incumpliendo sus condiciones',
    gravedad: 'muy_grave',
    // Horquilla del tramo medio del muy grave LOTT (2.001–4.000 €): NO cifra fija. Se pinta como rango.
    importeEur: 2001,
    importeReducidoEur: null,
    importeMaxEur: 4000,
    puntos: null,
    textoBoletin:
      'Realizar transporte escolar o de menores incumpliendo las condiciones de seguridad exigibles: ' +
      'falta del acompañante o monitor cuando es obligatorio, vehículo que supera la antigüedad máxima ' +
      'o sin la ITV específica, ausencia de la señalización de transporte escolar, o exceso sobre las ' +
      'plazas autorizadas. Estas condiciones las desarrolla el RD 443/2001. Procede valorar la ' +
      'inmovilización hasta subsanar. La valoración final corresponde a la autoridad competente.',
    terminos: [
      'escolar sin acompañante',
      'autobus escolar sin monitor',
      'transporte escolar sin señalizar',
      'bus escolar sin itv',
      'ruta escolar sin acompañante',
      'transporte de menores sin monitor',
    ],
    consecuencias: [
      {
        tipo: 'inmovilizacion',
        textoCorto:
          'Procede valorar la inmovilización del vehículo hasta que se subsane la condición de ' +
          'seguridad incumplida (acompañante, señalización, plazas), conforme al régimen de la LOTT.',
        fuente: 'LOTT art. 143 (y RD 443/2001, transporte escolar y de menores)',
      },
    ],
    marcoImporte: 'transporte',
    notaRevision:
      'A VERIFICAR el apartado/letra exacto y la GRAVEDAD por supuesto contra el texto consolidado de la ' +
      'LOTT (arts. 140-142, Ley 13/2021), el ROTT y el RD 443/2001 (condiciones de seguridad del ' +
      'transporte escolar y de menores): algunas condiciones (acompañante, señalización) pueden ser ' +
      'graves y otras muy graves. El seed ancla el tramo medio del muy grave (2.001–4.000 €); A ' +
      'VERIFICAR importe y horquilla. Sin pronto pago modelado. No detrae puntos DGT. Revisar.',
  }),
  // --- Mercancías peligrosas (ADR): variantes distintas de la general muy grave --------------
  construirInfraccion({
    id: 'inf-adr-documentacion',
    articulo: ART_LOTT_ADR_DOC,
    tituloCorto: 'ADR: documentación deficiente (instrucciones escritas / carta de porte)',
    gravedad: 'grave',
    // Horquilla del tramo alto del grave LOTT (601–1.000 €): NO cifra fija. Se pinta como rango.
    importeEur: 601,
    importeReducidoEur: null,
    importeMaxEur: 1000,
    puntos: null,
    textoBoletin:
      'Transportar mercancías peligrosas con deficiencias documentales del ADR distintas de las que ' +
      'constituyen infracción muy grave: sin las instrucciones escritas de seguridad o con ellas ' +
      'incompletas, o con la documentación de la mercancía incompleta cuando el hecho no comprometa ' +
      'gravemente la seguridad. Se distingue de la ausencia total de paneles, etiquetado, autorización ' +
      'o formación (muy grave). Procede valorar la subsanación antes de reanudar la marcha.',
    terminos: [
      'sin instrucciones escritas adr',
      'documentacion de peligrosas incompleta',
      'papeles adr incompletos',
      'instrucciones escritas de seguridad',
      'documentacion adr deficiente',
    ],
    consecuencias: [
      {
        tipo: 'inmovilizacion',
        textoCorto:
          'Procede valorar la inmovilización del vehículo hasta que se aporte o complete la ' +
          'documentación ADR, conforme al régimen sancionador de la LOTT.',
        fuente: 'LOTT art. 143 (y RD 97/2014, mercancías peligrosas por carretera)',
      },
    ],
    marcoImporte: 'transporte',
    notaRevision:
      'A VERIFICAR el apartado/letra exacto y la GRAVEDAD contra el texto consolidado de la LOTT ' +
      '(arts. 140-142, Ley 13/2021), el ROTT, el RD 97/2014 y el ADR vigente: distinguir la deficiencia ' +
      'documental (grave o leve) de la ausencia total de documentación esencial (muy grave, ver ' +
      '`inf-adr-mercancias-peligrosas`). El seed ancla el tramo alto del grave (601–1.000 €); A ' +
      'VERIFICAR la horquilla. Sin pronto pago modelado. No detrae puntos DGT. Revisar por supuesto.',
  }),
  construirInfraccion({
    id: 'inf-adr-conductor-formacion',
    articulo: ART_LOTT_ADR_FORMACION,
    tituloCorto: 'ADR: conductor sin la formación exigible',
    gravedad: 'muy_grave',
    importeEur: 2001,
    importeReducidoEur: null,
    importeMaxEur: 4000,
    puntos: null,
    textoBoletin:
      'Transportar mercancías peligrosas con un conductor que carece del certificado de formación ADR ' +
      'en vigor exigible para la clase de mercancía y de vehículo, o llevándolo caducado. La formación ' +
      'del conductor es un requisito esencial de seguridad del ADR. Es infracción muy grave de la LOTT; ' +
      'procede valorar la inmovilización o el precinto. La valoración final corresponde a la autoridad.',
    terminos: [
      'sin certificado adr',
      'conductor sin formacion adr',
      'carnet adr caducado',
      'sin curso adr',
      'chofer sin adr',
    ],
    consecuencias: [
      {
        tipo: 'inmovilizacion',
        textoCorto:
          'Procede valorar la inmovilización o el precinto del vehículo hasta que conduzca un chofer ' +
          'con la formación ADR en vigor, conforme al régimen sancionador de la LOTT.',
        fuente: 'LOTT art. 143 (y RD 97/2014, mercancías peligrosas por carretera)',
      },
    ],
    marcoImporte: 'transporte',
    notaRevision:
      'A VERIFICAR el apartado/letra exacto del art. 140 LOTT (conductor sin formación ADR) y la ' +
      'gravedad contra el texto consolidado (Ley 13/2021), el ROTT, el RD 97/2014 y el ADR vigente. El ' +
      'seed ancla el tramo medio del muy grave (2.001–4.000 €); A VERIFICAR importe y horquilla por ' +
      'supuesto. Distinta de la deficiencia documental (`inf-adr-documentacion`) y del ADR general ' +
      '(`inf-adr-mercancias-peligrosas`). Sin pronto pago modelado. No detrae puntos DGT. Revisar.',
  }),
  // --- Mercancías perecederas (ATP) ----------------------------------------------------------
  construirInfraccion({
    id: 'inf-perecederas-atp',
    articulo: ART_LOTT_ATP,
    tituloCorto: 'Perecederas sin certificado ATP o con frío deficiente',
    gravedad: 'grave',
    importeEur: 401,
    importeReducidoEur: null,
    importeMaxEur: 1000,
    puntos: null,
    textoBoletin:
      'Transportar mercancías perecederas (alimentos a temperatura controlada) sin el certificado ATP ' +
      'en vigor del vehículo o contenedor, o con el equipo de frío averiado o incumpliendo las ' +
      'temperaturas exigidas. El régimen técnico lo fija el Acuerdo ATP. Es infracción de la LOTT; ' +
      'procede valorar la subsanación para preservar la cadena de frío de los alimentos.',
    terminos: [
      'sin certificado atp',
      'camion de perecederas sin atp',
      'sin atp',
      'equipo de frio averiado',
      'cadena de frio rota',
      'frigorifico sin atp',
    ],
    consecuencias: [
      {
        tipo: 'inmovilizacion',
        textoCorto:
          'Procede valorar la inmovilización del vehículo cuando el incumplimiento comprometa la ' +
          'cadena de frío o la seguridad alimentaria, conforme al régimen sancionador de la LOTT.',
        fuente: 'LOTT art. 143 (y Acuerdo ATP)',
      },
    ],
    marcoImporte: 'transporte',
    notaRevision:
      'A VERIFICAR el apartado/letra exacto y la GRAVEDAD contra el texto consolidado de la LOTT ' +
      '(arts. 140-142, Ley 13/2021), el ROTT y el Acuerdo ATP: distinguir la falta de certificado ATP ' +
      'del incumplimiento de temperaturas o del equipo de frío averiado (pueden graduarse distinto). El ' +
      'seed ancla el tramo GRAVE (401–1.000 €); A VERIFICAR la horquilla. Sin pronto pago modelado. No ' +
      'detrae puntos DGT. Revisar por supuesto antes de publicar.',
  }),
  // --- Obligaciones con la Administración (documentación de control / visado) ----------------
  construirInfraccion({
    id: 'inf-documentacion-control',
    articulo: ART_LOTT_142_DOCS,
    tituloCorto: 'No llevar o no exhibir la documentación de control',
    gravedad: 'leve',
    importeEur: 100,
    importeReducidoEur: null,
    importeMaxEur: 400,
    puntos: null,
    textoBoletin:
      'No llevar a bordo o no exhibir a los servicios de inspección la documentación de control del ' +
      'transporte: la tarjeta de transporte o autorización y los demás documentos de control exigibles. ' +
      'Se distingue de CARECER del título habilitante (muy grave): aquí el transportista sí lo tiene ' +
      'pero no lo lleva o no lo exhibe, supuesto por lo general leve y subsanable.',
    terminos: [
      'no lleva la documentacion de transporte',
      'no exhibe la tarjeta de transporte',
      'sin los documentos de control',
      'no enseña la autorizacion de transporte',
      'olvido la tarjeta de transporte',
    ],
    marcoImporte: 'transporte',
    notaRevision:
      'A VERIFICAR el apartado exacto y la GRAVEDAD contra el texto consolidado de la LOTT (arts. ' +
      '140-142, Ley 13/2021) y el ROTT: NO llevar o NO exhibir la documentación de control suele ser ' +
      'LEVE y subsanable, pero la NEGATIVA a exhibirla o la obstrucción a la inspección puede ser grave ' +
      'o muy grave. NO confundir con CARECER del título (muy grave, `inf-transporte-sin-titulo`). El ' +
      'seed ancla el tramo LEVE (100–400 €); A VERIFICAR el importe. Sin pronto pago modelado. No detrae ' +
      'puntos DGT. Revisar por supuesto.',
  }),
  construirInfraccion({
    id: 'inf-visado-transporte',
    articulo: ART_LOTT_141_VISADO,
    tituloCorto: 'Autorización de transporte sin visar',
    gravedad: 'grave',
    importeEur: 401,
    importeReducidoEur: null,
    importeMaxEur: 800,
    puntos: null,
    textoBoletin:
      'Mantener en explotación un vehículo o una autorización de transporte sin haber realizado el ' +
      'visado periódico exigible, o incumpliendo las condiciones a las que se sujeta su vigencia. Es ' +
      'infracción de la LOTT relacionada con el mantenimiento de los requisitos de la autorización.',
    terminos: [
      'sin visar la tarjeta de transporte',
      'visado caducado',
      'autorizacion sin visar',
      'tarjeta de transporte sin visar',
      'no ha pasado el visado del transporte',
    ],
    marcoImporte: 'transporte',
    notaRevision:
      'A VERIFICAR el apartado exacto y la GRAVEDAD contra el texto consolidado de la LOTT (arts. ' +
      '140-142, Ley 13/2021) y el ROTT: la falta de visado en plazo puede ser leve o grave según su ' +
      'alcance y la reiteración. El seed ancla el tramo GRAVE (401–800 €); A VERIFICAR la horquilla. Sin ' +
      'pronto pago modelado. No detrae puntos DGT. Revisar por supuesto antes de publicar.',
  }),
  // --- Pesos y dimensiones: exceso de dimensiones (además del exceso de MMA de Ola 1) --------
  construirInfraccion({
    id: 'inf-exceso-dimensiones',
    articulo: ART_LOTT_141_DIMENSIONES,
    tituloCorto: 'Exceso de dimensiones del vehículo o conjunto',
    gravedad: 'grave',
    importeEur: 401,
    importeReducidoEur: null,
    importeMaxEur: 1000,
    puntos: null,
    textoBoletin:
      'Circular excediendo las dimensiones máximas reglamentarias (longitud, anchura o altura) del ' +
      'vehículo o del conjunto, o realizar un transporte que por sus dimensiones requiere autorización ' +
      'especial de circulación sin disponer de ella. Se distingue del exceso de MASA máxima autorizada. ' +
      'Procede valorar la inmovilización hasta subsanar.',
    terminos: [
      'exceso de dimensiones',
      'camion demasiado largo',
      'exceso de longitud',
      'transporte especial sin autorizacion',
      'carga que sobresale',
      'vehiculo demasiado ancho',
    ],
    consecuencias: [
      {
        tipo: 'inmovilizacion',
        textoCorto:
          'Procede valorar la inmovilización del vehículo hasta que se ajusten las dimensiones o se ' +
          'obtenga la autorización especial de circulación, conforme al régimen de la LOTT.',
        fuente: 'LOTT art. 143 (y RD 2822/1998, Reglamento General de Vehículos)',
      },
    ],
    marcoImporte: 'transporte',
    notaRevision:
      'A VERIFICAR el apartado/letra exacto y la GRAVEDAD por supuesto contra el texto consolidado de la ' +
      'LOTT (arts. 140-142, Ley 13/2021), el ROTT y los límites de dimensiones del Reglamento General de ' +
      'Vehículos (RD 2822/1998): el exceso puede graduarse por su porcentaje y por la necesidad de ' +
      'autorización de transporte especial. El seed ancla el tramo GRAVE (401–1.000 €); A VERIFICAR la ' +
      'horquilla. Distinta del exceso de MMA (`inf-exceso-mma`). Sin pronto pago modelado. No detrae ' +
      'puntos DGT. Revisar por supuesto.',
  }),
  // --- Tacógrafo: variante documental (distinta de la manipulación muy grave de Ola 1) -------
  construirInfraccion({
    id: 'inf-tacografo-sin-registros',
    articulo: ART_LOTT_141_TACOGRAFO,
    tituloCorto: 'No llevar o no conservar los registros del tacógrafo',
    gravedad: 'grave',
    importeEur: 401,
    importeReducidoEur: null,
    importeMaxEur: 1000,
    puntos: null,
    textoBoletin:
      'No llevar a bordo las hojas de registro o la tarjeta de conductor del tacógrafo, o no conservar ' +
      'y presentar los registros de los tiempos de conducción y descanso durante el periodo exigido. Se ' +
      'distingue de la MANIPULACIÓN o el falseamiento del tacógrafo y del exceso de tiempos (muy grave): ' +
      'aquí se trata del incumplimiento documental de porte y conservación de los registros.',
    terminos: [
      'sin hojas del tacografo',
      'sin tarjeta de tacografo',
      'no conserva los discos',
      'sin registros del tacografo',
      'no lleva la tarjeta de conductor',
    ],
    marcoImporte: 'transporte',
    notaRevision:
      'A VERIFICAR el apartado exacto y la GRAVEDAD contra el texto consolidado de la LOTT (arts. ' +
      '140-142, Ley 13/2021), el ROTT, el Reglamento (UE) 165/2014 (tacógrafo) y el Rgto (CE) 561/2006: ' +
      'no llevar/no conservar registros suele ser grave, distinto de la manipulación o el exceso de ' +
      'tiempos (muy grave, `inf-tacografo`). El seed ancla el tramo GRAVE (401–1.000 €); A VERIFICAR la ' +
      'horquilla. Sin pronto pago modelado. No detrae puntos DGT. Revisar por supuesto antes de publicar.',
  }),
  construirInfraccion({
    id: 'inf-adelantamiento-antirreglamentario',
    articulo: ART_RGC_33,
    tituloCorto: 'Adelantamiento antirreglamentario / línea continua',
    gravedad: 'grave',
    importeEur: 200,
    importeReducidoEur: 100,
    puntos: 4,
    textoBoletin:
      'Adelantar de forma antirreglamentaria: sin visibilidad o espacio suficiente, en lugar ' +
      'prohibido (cambio de rasante, curva, paso para peatones) o rebasando una marca longitudinal ' +
      'continua. Es infracción grave de circulación (art. 33 y ss. RGC).',
    terminos: [
      'adelantamiento',
      'adelantar en linea continua',
      'linea continua',
      'se salto la linea continua',
      'adelantamiento prohibido',
      'adelantar donde no se puede',
      'adelantar en curva',
      'pisar la continua',
      'raya continua',
    ],
    marcoImporte: 'trafico',
    notaRevision:
      'Importe 200 € (grave, marco tráfico). A VERIFICAR los puntos: el adelantamiento ' +
      'antirreglamentario y el rebasamiento de línea continua se citan con 3 o 4 puntos según el ' +
      'supuesto (DGT); el seed fija 4, a confirmar por supuesto contra el codificado DGT. Distinguir ' +
      'del adelantamiento con riesgo que pueda escalar a conducción temeraria (art. 380 CP). Revisar.',
  }),
  construirInfraccion({
    id: 'inf-neumaticos-mal-estado',
    articulo: ART_RGV_12,
    tituloCorto: 'Neumáticos en mal estado',
    gravedad: 'grave',
    importeEur: 200,
    importeReducidoEur: 100,
    puntos: 0,
    textoBoletin:
      'Circular con uno o varios neumáticos en mal estado: desgaste por debajo de la profundidad ' +
      'mínima legal del dibujo, cortes, deformaciones o daños que comprometan la seguridad (RGV, ' +
      'condiciones técnicas del vehículo).',
    terminos: [
      'neumaticos',
      'ruedas',
      'neumaticos gastados',
      'rueda lisa',
      'ruedas lisas',
      'gomas lisas',
      'neumatico deteriorado',
      'sin dibujo',
      'rueda en mal estado',
      'neumaticos desgastados',
      'rueda pinchada circulando',
    ],
    consecuencias: [
      {
        tipo: 'inmovilizacion',
        textoCorto:
          'Procede valorar la inmovilización del vehículo cuando el estado de los neumáticos ' +
          'suponga un riesgo grave para la seguridad, hasta que se subsane (art. 104 LSV).',
        fuente: 'LSV art. 104',
      },
    ],
    marcoImporte: 'trafico',
    notaRevision:
      'Importe 200 € (grave, marco tráfico) como referencia. A VERIFICAR el precepto sancionador ' +
      'exacto (RGV / condiciones técnicas y Manual de Procedimiento de ITV) y si el supuesto más ' +
      'grave (varios neumáticos o riesgo manifiesto) eleva la clasificación. Confirmar contra el ' +
      'codificado DGT antes de publicar.',
  }),
  construirInfraccion({
    id: 'inf-matricula-oculta',
    articulo: ART_RGV_25,
    tituloCorto: 'Matrícula oculta, ilegible o alterada',
    gravedad: 'grave',
    importeEur: 200,
    importeReducidoEur: 100,
    puntos: 0,
    textoBoletin:
      'Circular con la placa de matrícula oculta, doblada, ilegible o alterada, de forma que se ' +
      'dificulte la identificación del vehículo (RGV, placas de matrícula).',
    terminos: [
      'matricula oculta',
      'matricula tapada',
      'matricula ilegible',
      'sin matricula',
      'matricula doblada',
      'matricula manipulada',
      'placa tapada',
      'matricula no se lee',
    ],
    marcoImporte: 'trafico',
    notaRevision:
      'Importe 200 € (grave, marco tráfico) como referencia. A VERIFICAR el precepto y la ' +
      'clasificación exactos (RGV placas de matrícula; ocultación deliberada para eludir controles ' +
      'puede ser MUY GRAVE, e incluso conectar con delitos de falsedad si la placa está falsificada). ' +
      'Confirmar contra el codificado DGT y con el revisor jurídico antes de publicar.',
  }),
  // === AMPLIACIÓN del catálogo de calle (ronda "catálogo pobre vs SPPLB") ====================
  // 14 conductas FRECUENTES que faltaban, para que ningún sub-tema quede a una sola ficha.
  // Fuente: RGC (RD 1428/2003), LSV (RDL 6/2015), RGV (RD 2822/1998) ya ingeridos + cuadro DGT.
  // TODO queda `pendiente_revision`; los importes/puntos dudosos van marcados "a verificar".
  // --- Conducta al volante -------------------------------------------------------------------
  construirInfraccion({
    id: 'inf-sin-senalizar-maniobra',
    articulo: ART_RGC_109,
    tituloCorto: 'No señalizar la maniobra (intermitentes)',
    gravedad: 'grave',
    importeEur: 200,
    importeReducidoEur: 100,
    puntos: 0,
    textoBoletin:
      'No advertir con las luces indicadoras de dirección (intermitentes), con la debida antelación, ' +
      'una maniobra lateral —cambio de carril, giro, incorporación, adelantamiento, cambio de sentido o ' +
      'salida de rotonda—, o no mantener la señal hasta completarla.',
    terminos: [
      'sin intermitente',
      'no puso el intermitente',
      'sin poner el intermitente',
      'no señalizo la maniobra',
      'sin señalizar',
      'cambio de carril sin avisar',
      'giro sin intermitente',
      'no aviso el giro',
    ],
    marcoImporte: 'trafico',
    notaRevision:
      'A VERIFICAR importe y clasificación por supuesto contra el codificado DGT: no señalizar la ' +
      'maniobra se cita como GRAVE (200 €) cuando NO se usa ningún tipo de señal; señalizar de forma ' +
      'DEFECTUOSA o sin antelación suficiente suele ser LEVE (unos 80 €). El seed ancla el supuesto ' +
      'grave (200 €). A VERIFICAR los puntos (el seed fija 0). Base: art. 109 RGC y art. 44 LSV. Revisar.',
  }),
  construirInfraccion({
    id: 'inf-carril-reservado',
    articulo: ART_RGC_41,
    tituloCorto: 'Circular por carril reservado (bus, VAO o bici)',
    gravedad: 'grave',
    importeEur: 200,
    importeReducidoEur: 100,
    puntos: 0,
    textoBoletin:
      'Circular o invadir un carril especialmente reservado sin tener derecho a ello: entrar en el ' +
      'carril VAO sin el número mínimo de ocupantes exigido, circular por el carril bus o invadir el ' +
      'carril bici.',
    terminos: [
      'carril bus',
      'carril vao',
      'vao',
      'carril bici',
      'me meti en el carril bus',
      'invadir el carril bici',
      'carril reservado',
      'circular por el carril bus',
    ],
    marcoImporte: 'trafico',
    notaRevision:
      'A VERIFICAR importe (200 €, grave) y precepto exacto contra el codificado DGT: la infracción no ' +
      'suele detraer puntos (el seed fija 0). Base: utilización de carriles reservados (art. 41 y ss. ' +
      'RGC / señalización). Distinguir el carril bus/VAO/bici por supuesto y ordenanza local. Revisar.',
  }),
  construirInfraccion({
    id: 'inf-distancia-seguridad',
    articulo: ART_RGC_54,
    tituloCorto: 'No mantener la distancia de seguridad',
    gravedad: 'grave',
    importeEur: 200,
    importeReducidoEur: 100,
    puntos: 4,
    textoBoletin:
      'Circular sin dejar entre el vehículo y el que le precede la distancia que permita detenerse, sin ' +
      'colisionar, ante un frenazo brusco («ir pegado»). Es una de las causas más frecuentes de alcance.',
    terminos: [
      'distancia de seguridad',
      'sin distancia de seguridad',
      'iba pegado',
      'pegado al de delante',
      'no guardar distancia',
      'muy cerca del coche de delante',
      'pegado detras',
    ],
    marcoImporte: 'trafico',
    notaRevision:
      'Importe 200 € (grave, art. 54 RGC). A VERIFICAR los puntos: la falta de distancia de seguridad ' +
      'se cita con 4 puntos en el cuadro DGT (el seed fija 4); confirmar por supuesto contra el ' +
      'codificado DGT antes de publicar.',
  }),
  construirInfraccion({
    id: 'inf-claxon-indebido',
    articulo: ART_RGC_110,
    tituloCorto: 'Uso indebido del claxon o señales acústicas',
    gravedad: 'leve',
    importeEur: 80,
    importeReducidoEur: 40,
    puntos: 0,
    textoBoletin:
      'Utilizar el claxon o las señales acústicas de forma inmotivada, excesiva o molesta, fuera de los ' +
      'casos permitidos (evitar un accidente, advertir un adelantamiento en vía interurbana o reclamar ' +
      'auxilio urgente), o emplear aparatos de sonido estridentes o no homologados.',
    terminos: [
      'pitar sin motivo',
      'uso del claxon',
      'claxon',
      'pitando',
      'toca el claxon sin parar',
      'bocina',
      'pitido molesto',
      'claxon no homologado',
    ],
    marcoImporte: 'trafico',
    notaRevision:
      'A VERIFICAR importe y clasificación contra el codificado DGT: el uso indebido del claxon se cita ' +
      'como LEVE (el seed ancla unos 80 €, sin puntos). Base: art. 110 RGC (advertencias acústicas). ' +
      'Distinguir del uso de dispositivos/aparatos sonoros no homologados. Revisar.',
  }),
  construirInfraccion({
    id: 'inf-circular-arcen',
    articulo: ART_RGC_36,
    tituloCorto: 'Circular indebidamente por el arcén',
    gravedad: 'grave',
    importeEur: 200,
    importeReducidoEur: 100,
    puntos: 0,
    textoBoletin:
      'Circular con un vehículo de motor por el arcén sin estar obligado ni autorizado a ello. El arcén ' +
      'se reserva a peatones, ciclos y a los vehículos obligados a utilizarlo, salvo supuestos habilitados ' +
      'y señalizados.',
    terminos: [
      'circular por el arcen',
      'por el arcen',
      'iba por el arcen',
      'adelantar por el arcen',
      'conducir por el arcen',
      'se metio en el arcen',
    ],
    marcoImporte: 'trafico',
    notaRevision:
      'A VERIFICAR importe (200 €, grave) y precepto exacto contra el codificado DGT: circular ' +
      'indebidamente por el arcén no suele detraer puntos (el seed fija 0). Base: utilización del arcén ' +
      '(art. 36 y ss. RGC). Atención a las excepciones tasadas (vehículos lentos, tramos habilitados y ' +
      'señalizados p. ej. para motos en retención). Revisar.',
  }),
  construirInfraccion({
    id: 'inf-marcha-atras-indebida',
    articulo: ART_RGC_80,
    tituloCorto: 'Marcha atrás o cambio de sentido antirreglamentarios',
    gravedad: 'grave',
    importeEur: 200,
    importeReducidoEur: 100,
    puntos: 4,
    textoBoletin:
      'Efectuar la marcha atrás fuera de los casos permitidos (recorrer largos tramos, hacerla como ' +
      'maniobra principal, o para retroceder a una salida ya rebasada) o realizar un cambio de sentido en ' +
      'lugar prohibido o sin la debida seguridad. Cuando la maniobra equivale a circular en sentido ' +
      'contrario, puede calificarse como muy grave.',
    terminos: [
      'marcha atras',
      'dar marcha atras',
      'cambio de sentido prohibido',
      'cambiar de sentido donde no se debe',
      'dio marcha atras en la salida',
    ],
    marcoImporte: 'trafico',
    notaRevision:
      'Importe 200 € (grave, art. 80 RGC / art. 31 LSV) y 4 puntos como referencia del cuadro DGT para ' +
      'la marcha atrás indebida GENERAL. El caso de marcha atrás en autopista/autovía (equivale a ' +
      'circular en sentido contrario) se modela aparte como MUY GRAVE en `inf-marcha-atras-autopista`. ' +
      'Confirmar importe y puntos por supuesto contra el codificado DGT. Revisar.',
  }),
  construirInfraccion({
    // Variante MUY GRAVE (revisor Ola 1): la marcha atrás / retroceso en autopista o autovía equivale
    // a circular en sentido contrario → muy grave 500 € / 6 puntos (no los 200/4 de la marcha atrás
    // común). Se separa para que el agente no infravalore el caso al copiar el boletín.
    id: 'inf-marcha-atras-autopista',
    articulo: ART_RGC_80,
    tituloCorto: 'Marcha atrás en autopista o autovía (sentido contrario)',
    gravedad: 'muy_grave',
    importeEur: 500,
    importeReducidoEur: 250,
    puntos: 6,
    textoBoletin:
      'Efectuar la marcha atrás o retroceder en autopista o autovía. Por prohibición expresa (art. 80 ' +
      'RGC) y por equivaler a circular en sentido contrario al establecido, es infracción MUY GRAVE, ' +
      'con retirada de 6 puntos. Distíngase de la marcha atrás indebida común en vía ordinaria (grave, ' +
      '200 €).',
    terminos: [
      'marcha atras en autovia',
      'marcha atras en autopista',
      'retroceder en la autopista',
      'retroceder en autovia',
      'sentido contrario en autopista',
    ],
    marcoImporte: 'trafico',
    notaRevision:
      'MUY GRAVE 500 € / 6 puntos (art. 80 RGC en relación con la prohibición de circular en sentido ' +
      'contrario). A VERIFICAR el precepto sancionador exacto (art. 77 LSV, apartado de sentido ' +
      'contrario) y los puntos (Anexo II LSV) contra el codificado DGT. Distinta de la marcha atrás ' +
      'indebida común (`inf-marcha-atras-indebida`, grave). Revisar.',
  }),
  // --- Estado del vehículo (RGV: condiciones técnicas, reformas y homologación) --------------
  construirInfraccion({
    id: 'inf-lunas-tintadas',
    articulo: ART_RGV_7,
    tituloCorto: 'Lunas tintadas o láminas no homologadas',
    gravedad: 'grave',
    importeEur: 200,
    importeReducidoEur: 100,
    puntos: 0,
    textoBoletin:
      'Circular con las lunas del vehículo cubiertas con láminas o tintados no homologados, o que reduzcan ' +
      'la transparencia por debajo de lo reglamentario o la visibilidad del conductor. Los tintados solo se ' +
      'admiten en las lunas permitidas y con homologación, anotada como reforma cuando proceda.',
    terminos: [
      'lunas tintadas',
      'cristales tintados',
      'laminas en las lunas',
      'tintado no homologado',
      'lunas negras',
      'vinilo en las lunas',
      'cristales oscuros',
    ],
    consecuencias: [
      {
        tipo: 'inmovilizacion',
        textoCorto:
          'Procede valorar la inmovilización del vehículo cuando el tintado reduzca de forma relevante la ' +
          'visibilidad del conductor y suponga un riesgo, hasta que se subsane (art. 104 LSV).',
        fuente: 'LSV art. 104',
      },
    ],
    marcoImporte: 'trafico',
    notaRevision:
      'A VERIFICAR importe (200 €, grave) y precepto exacto contra el codificado DGT y el RGV/RD 866/2010 ' +
      'de reformas: distinguir el tintado en lunas PERMITIDAS con homologación (no sancionable) del tintado ' +
      'NO homologado o en lunas delanteras/parabrisas (sancionable, sin puntos según el seed). Revisar.',
  }),
  construirInfraccion({
    id: 'inf-escape-ruido',
    articulo: ART_RGV_7,
    tituloCorto: 'Escape no homologado o ruido excesivo',
    gravedad: 'grave',
    importeEur: 200,
    importeReducidoEur: 100,
    puntos: 0,
    textoBoletin:
      'Circular con el sistema de escape no homologado, manipulado o suprimido, o superando los niveles de ' +
      'ruido reglamentarios (habitualmente en torno a los límites que fija la ficha técnica). Incluye el ' +
      'escape «libre» y los silenciosos alterados.',
    terminos: [
      'escape libre',
      'tubo de escape ruidoso',
      'escape no homologado',
      'mucho ruido la moto',
      'escape modificado',
      'tubarro',
      'ruido excesivo',
      'petardeo del escape',
    ],
    consecuencias: [
      {
        tipo: 'inmovilizacion',
        textoCorto:
          'Procede valorar la inmovilización del vehículo cuando el escape o el ruido supongan una ' +
          'deficiencia relevante, hasta que se subsane (art. 104 LSV).',
        fuente: 'LSV art. 104',
      },
    ],
    marcoImporte: 'trafico',
    notaRevision:
      'A VERIFICAR importe y clasificación por supuesto contra el codificado DGT: el escape no homologado ' +
      'se cita como GRAVE (200 €, el seed lo ancla ahí, sin puntos); el RUIDO por encima de los límites ' +
      'legales puede elevar la sanción (se citan hasta ~600 €). Base: condiciones técnicas y reformas ' +
      '(RGV / RD 866/2010). Confirmar el importe efectivo por decibelios/supuesto. Revisar.',
  }),
  construirInfraccion({
    id: 'inf-luces-no-homologadas',
    articulo: ART_RGV_7,
    tituloCorto: 'Luces adicionales o no homologadas',
    gravedad: 'grave',
    importeEur: 200,
    importeReducidoEur: 100,
    puntos: 0,
    textoBoletin:
      'Circular con luces adicionales, de un color o uso no permitido, o no homologadas (por ejemplo, ' +
      'neones, luces de colores en la parte delantera o trasera, o dispositivos luminosos que puedan ' +
      'deslumbrar o confundirse con los de los vehículos prioritarios).',
    terminos: [
      'neones',
      'luces no homologadas',
      'luces de colores',
      'faros led no homologados',
      'luces azules',
      'tira de led',
      'luces tuneadas',
    ],
    marcoImporte: 'trafico',
    notaRevision:
      'A VERIFICAR importe (200 €, grave) y precepto exacto contra el codificado DGT y el RGV/RD 866/2010: ' +
      'distinguir las luces homologadas y anotadas como reforma (no sancionable) de las no homologadas o de ' +
      'color/uso prohibido. Las luces AZULES o que imiten a vehículos prioritarios pueden agravar la ' +
      'clasificación. El seed no detrae puntos; confirmar por supuesto. Revisar.',
  }),
  // --- Estacionamiento y parada --------------------------------------------------------------
  construirInfraccion({
    id: 'inf-parada-lugar-peligroso',
    articulo: ART_RGC_94,
    tituloCorto: 'Parada o estacionamiento en lugar peligroso',
    gravedad: 'grave',
    importeEur: 200,
    importeReducidoEur: 100,
    puntos: 0,
    textoBoletin:
      'Parar o estacionar el vehículo en un lugar peligroso o que obstaculice gravemente la circulación: ' +
      'en curvas o cambios de rasante de visibilidad reducida, en túneles, en un carril reservado (bus, ' +
      'VAO o bici), en la calzada de una autovía o autopista, o donde se impida la visibilidad de la ' +
      'señalización. Se distingue del estacionamiento indebido común (acera, doble fila, vado) por el ' +
      'riesgo que genera.',
    terminos: [
      'parado en curva',
      'parado en un tunel',
      'parado en la autovia',
      'parada peligrosa',
      'estacionar en sitio peligroso',
      'parado en cambio de rasante',
      'parado en el carril bus',
    ],
    consecuencias: [
      {
        tipo: 'deposito',
        textoCorto:
          'Procede valorar la retirada del vehículo por la grúa al depósito cuando su parada o ' +
          'estacionamiento genere riesgo u obstaculice gravemente la circulación (art. 105 LSV).',
        fuente: 'LSV art. 105',
      },
    ],
    marcoImporte: 'trafico',
    notaRevision:
      'A VERIFICAR importe (200 €, grave) y clasificación por supuesto contra el codificado DGT: la ' +
      'parada/estacionamiento en lugar PELIGROSO o que obstaculice GRAVEMENTE la circulación es grave; ' +
      'algunos supuestos (autopista/autovía, túnel) pueden endurecerse. Se modela distinta del ' +
      '`inf-estacionamiento-indebido` (acera/doble fila/vado) por el riesgo. Base: art. 94 RGC. Revisar.',
  }),
  // --- Señales y prioridad -------------------------------------------------------------------
  construirInfraccion({
    id: 'inf-stop-ceda-el-paso',
    articulo: ART_RGC_56,
    tituloCorto: 'No respetar el STOP o el ceda el paso',
    gravedad: 'grave',
    importeEur: 200,
    importeReducidoEur: 100,
    puntos: 4,
    textoBoletin:
      'No respetar la prioridad de paso señalizada: no detener por completo el vehículo ante una señal de ' +
      'STOP (R-2) antes de ceder el paso, o no ceder el paso ante un ceda el paso (R-1) cuando otro usuario ' +
      'tiene preferencia.',
    terminos: [
      'se salto el stop',
      'no respeto el stop',
      'no hizo el stop',
      'stop',
      'ceda el paso',
      'no cedio el paso',
      'se comio el ceda',
      'no paro en el stop',
    ],
    marcoImporte: 'trafico',
    notaRevision:
      'Importe 200 € (grave) y 4 puntos como referencia del cuadro DGT (misma sanción que saltarse un ' +
      'semáforo en rojo). A VERIFICAR el precepto exacto de la señalización de prioridad (arts. 56 y ss. ' +
      'RGC; señales R-1 y R-2) y confirmar puntos contra el codificado DGT. Revisar.',
  }),
  construirInfraccion({
    id: 'inf-prioridad-peatones',
    articulo: ART_RGC_65,
    tituloCorto: 'No respetar la prioridad de paso de los peatones',
    gravedad: 'grave',
    importeEur: 200,
    importeReducidoEur: 100,
    puntos: 4,
    textoBoletin:
      'No ceder el paso a los peatones cuando tienen prioridad: en un paso de peatones debidamente ' +
      'señalizado, al girar el vehículo para entrar en otra vía por la que cruzan peatones, o en las demás ' +
      'situaciones en que el reglamento les reconoce preferencia.',
    terminos: [
      'no cedio el paso al peaton',
      'no respeto el paso de peatones',
      'no dejo pasar al peaton',
      'prioridad del peaton',
      'atropello en paso de cebra',
      'no freno en el paso de peatones',
      'no dio paso al peaton',
    ],
    marcoImporte: 'trafico',
    notaRevision:
      'Importe 200 € (grave) y 4 puntos como referencia del cuadro DGT. A VERIFICAR el precepto exacto ' +
      'de la prioridad del peatón (el seed cita el art. 65 RGC; algunas fuentes citan el art. 21 RGC): ' +
      'confirmar el artículo y los puntos contra el texto consolidado y el codificado DGT. Distinguir del ' +
      'atropello con resultado lesivo (posible delito). Revisar.',
  }),
  // --- Documentación -------------------------------------------------------------------------
  construirInfraccion({
    id: 'inf-sin-documentacion',
    articulo: ART_RGC_5,
    tituloCorto: 'No llevar o no exhibir la documentación',
    gravedad: 'leve',
    importeEur: 10,
    importeReducidoEur: 5,
    puntos: 0,
    textoBoletin:
      'No llevar consigo o no exhibir a requerimiento de los agentes la documentación exigible: permiso o ' +
      'licencia de conducción, permiso de circulación del vehículo o tarjeta de inspección técnica (ficha ' +
      'técnica). Es distinto de carecer del documento en vigor (p. ej. permiso caducado o ITV caducada), que ' +
      'tiene su propia sanción.',
    terminos: [
      'sin la documentacion',
      'sin papeles',
      'no lleva la documentacion',
      'sin el permiso de circulacion',
      'sin ficha tecnica',
      'no lleva el carnet encima',
      'olvido la documentacion',
      'sin documentacion del coche',
    ],
    marcoImporte: 'trafico',
    notaRevision:
      'A VERIFICAR importe exacto por documento contra el codificado DGT: no LLEVAR la documentación es ' +
      'LEVE (se cita en torno a 10 € por documento); el seed ancla 10 €. NO confundir con CARECER del ' +
      'documento en vigor: permiso caducado/no vigencia (art. 77 LSV, ver `inf-sin-permiso`) o ITV caducada ' +
      '(200 €, ver `inf-itv-caducada`). La falta de seguro tiene su propio régimen. Base: art. 5 RGC y ' +
      'Reglamento General de Conductores. Revisar antes de publicar.',
  }),
  // --- Seguridad: auriculares/cascos mientras se conduce -------------------------------------
  construirInfraccion({
    id: 'inf-auriculares-conduciendo',
    articulo: ART_RGC_18,
    tituloCorto: 'Conducir con auriculares o cascos de sonido',
    gravedad: 'grave',
    importeEur: 200,
    importeReducidoEur: 100,
    puntos: 3,
    textoBoletin:
      'Conducir utilizando auriculares o cascos conectados a dispositivos reproductores o receptores de ' +
      'sonido. La prohibición es total y se aplica en cualquier vía, con independencia del volumen o de que ' +
      'se lleve un solo auricular.',
    terminos: [
      'auriculares',
      'con auriculares conduciendo',
      'cascos en los oidos',
      'airpods',
      'conducir con cascos',
      'auriculares al volante',
      'escuchando musica con cascos',
      'con los cascos puestos',
    ],
    marcoImporte: 'trafico',
    notaRevision:
      'Importe 200 € (grave) y 3 puntos verificados (art. 18.2 RGC: prohíbe conducir utilizando ' +
      'auriculares o cascos conectados a dispositivos de sonido). Pendiente de visto bueno del revisor. ' +
      'NOTA: los sistemas de comunicación integrados y homologados del casco de moto que no aíslan del ' +
      'entorno quedan fuera; confirmar el matiz.',
  }),
];

/** Estructura completa del seed lista para el constructor del paquete. */
export interface SeedContenido {
  normas: Norma[];
  articulos: Articulo[];
  infracciones: InfraccionSeed[];
  /**
   * Tabla de sustancias (§4.7). Opcional: solo el seed de sustancias la aporta; el resto de
   * seeds (tráfico, penal, seguridad ciudadana) la dejan sin definir.
   */
  sustancias?: Sustancia[];
}

export const SEED_TRAFICO: SeedContenido = {
  normas: NORMAS_SEED,
  articulos: ARTICULOS_SEED,
  infracciones: INFRACCIONES_SEED,
};
