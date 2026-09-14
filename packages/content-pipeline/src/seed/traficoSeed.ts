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

const ART_CP_382_BIS = articuloSeed({
  normaId: ID_CP,
  numero: '382 bis',
  titulo: 'Abandono del lugar del accidente (delito contra la seguridad vial)',
  texto:
    'Castiga como delito que el conductor, voluntariamente y sin que concurra riesgo propio o de ' +
    'terceros, abandone el lugar de los hechos tras causar un accidente en el que fallezca una o varias ' +
    'personas o se cause alguna de las lesiones de los arts. 147.1, 149 o 150 CP. Se distingue de la ' +
    'omisión del deber de ' +
    'socorro (art. 195): aquí se castiga la HUIDA del lugar, aunque no hubiera a quién socorrer (p. ej. ' +
    'para eludir el control de alcohol o drogas), y ambos delitos pueden concurrir. La pena es mayor si ' +
    'el accidente se debió a imprudencia del conductor que si fue fortuito, y lleva privación del ' +
    'derecho a conducir. Resumen orientativo; consúltese el texto consolidado en el BOE.',
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
  numero: '140.26 / 141 (exceso de viajeros)',
  titulo: 'Exceso de viajeros sobre las plazas autorizadas (graduable grave/muy grave)',
  texto:
    'Tipifica como infracción de la ordenación del transporte de viajeros el transportar un número de ' +
    'viajeros superior al de plazas autorizadas del vehículo (las que figuran en la ficha técnica y la ' +
    'tarjeta de transporte). Se GRADÚA por la magnitud del exceso: el exceso elevado es MUY GRAVE ' +
    '(art. 140.26 LOTT, en relación con el art. 197 del ROTT); el exceso menor se sanciona como grave. ' +
    'La cuantía la concreta el art. 143 LOTT y su reglamento (ROTT). Resumen orientativo; consúltese el BOE.',
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
  numero: '142.1 (autorización sin visar en plazo)',
  titulo: 'Infracciones leves: transporte con la autorización de transporte sin visar en plazo',
  texto:
    'Tipifica como infracción LEVE (art. 142.1 LOTT) el realizar transporte con la autorización o tarjeta ' +
    'de transporte sin haber pasado el visado en el plazo exigible, cuando el transportista sí cumple los ' +
    'requisitos de fondo. Queda exento de sanción si acredita que reunía todos los requisitos y solicita ' +
    'el visado en los 15 días siguientes a la notificación. Si NO mantiene los requisitos, deja de ser un ' +
    'simple visado y puede reconducirse a la falta de título habilitante (muy grave). La cuantía la ' +
    'concreta el art. 143 LOTT y su reglamento (ROTT). Resumen orientativo; consúltese el BOE.',
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

const ART_LOTT_DIMENSIONES = articuloSeed({
  normaId: ID_LOTT,
  numero: '141 (exceso de dimensiones)',
  titulo: 'Infracciones graves: circular excediendo las dimensiones máximas o sin autorización de transporte especial',
  texto:
    'Tipifica como infracción de la ordenación del transporte el circular con un vehículo o conjunto ' +
    'que excede las dimensiones máximas autorizadas (longitud, anchura o altura) sin la preceptiva ' +
    'autorización de circulación de transporte especial, o incumpliendo las condiciones de esa ' +
    'autorización. Los límites de dimensiones los fija el Reglamento General de Vehículos (RD 2822/1998) ' +
    'y el régimen de transporte especial, el RGC (art. 14 y concordantes) y su normativa de complementos. ' +
    'La cuantía y el régimen de inmovilización los concretan el art. 143 LOTT y su reglamento (ROTT). ' +
    'Resumen orientativo; consúltese el texto consolidado en el BOE.',
});

const ART_LOTT_SENALIZACION = articuloSeed({
  normaId: ID_LOTT,
  numero: '141 (señalización del transporte especial)',
  titulo: 'Infracciones graves: transporte especial sin la señalización de advertencia exigible',
  texto:
    'Tipifica como infracción de la ordenación del transporte el realizar un transporte especial ' +
    '(vehículo largo, ancho, pesado o con carga que sobresale) sin la señalización de advertencia ' +
    'exigible: paneles reflectantes, señal luminosa V-2 (rotativo amarillo auxiliar), señal V-20 de ' +
    'carga que sobresale, o el vehículo o vehículos de acompañamiento (piloto) cuando la autorización ' +
    'los exige. La señalización de los vehículos la fija el Reglamento General de Vehículos (RD 2822/1998, ' +
    'Anexo XI de señales) y las condiciones del transporte especial. La cuantía la concretan el art. 143 ' +
    'LOTT y su reglamento (ROTT). Resumen orientativo; consúltese el texto consolidado en el BOE.',
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

// --- Artículos de la OLA DE TRÁFICO (volumen de catálogo, 2026-09-10) ------------------------
const ART_RGC_29 = articuloSeed({
  normaId: ID_RGC,
  numero: '29',
  titulo: 'Colocación en la calzada (circular por la derecha)',
  texto:
    'Como norma general, todo conductor debe circular por la derecha y lo más cerca posible del borde ' +
    'derecho de la calzada, manteniendo la separación lateral suficiente para adelantar con seguridad, ' +
    'salvo cuando adelante o la señalización permita otra cosa. Resumen orientativo; consúltese el BOE.',
});

const ART_RGC_35 = articuloSeed({
  normaId: ID_RGC,
  numero: '35',
  titulo: 'Separación lateral en el adelantamiento (1,5 m a ciclistas)',
  texto:
    'El adelantamiento debe realizarse dejando una separación lateral suficiente y, en todo caso, de al ' +
    'menos 1,5 metros al adelantar a ciclos, ciclomotores, peatones o animales; para respetarla se puede ' +
    'ocupar parte del carril contiguo o contrario cuando sea posible con seguridad. Resumen orientativo.',
});

const ART_RGC_45 = articuloSeed({
  normaId: ID_RGC,
  numero: '45',
  titulo: 'Velocidad anormalmente reducida',
  texto:
    'No se puede entorpecer la marcha de otros vehículos circulando sin causa justificada a una velocidad ' +
    'anormalmente reducida, ni por debajo de los límites mínimos de velocidad establecidos. Resumen orientativo.',
});

const ART_RGC_55 = articuloSeed({
  normaId: ID_RGC,
  numero: '55',
  titulo: 'Incorporación a la circulación (ceder el paso)',
  texto:
    'El conductor que se incorpora a la circulación desde una vía de acceso, propiedad colindante, zona de ' +
    'servicio o inmueble debe cerciorarse de que puede hacerlo sin peligro y CEDER EL PASO a los vehículos ' +
    'que circulan por la vía a la que se accede. Resumen orientativo; consúltese el BOE.',
});

const ART_RGC_167 = articuloSeed({
  normaId: ID_RGC,
  numero: '167',
  titulo: 'Marcas longitudinales continuas (línea continua)',
  texto:
    'Una marca longitudinal continua (M-2.1) sobre la calzada significa que ningún conductor, con carácter ' +
    'general, debe atravesarla ni circular sobre ella, ni con su vehículo pisar la línea, salvo en los casos ' +
    'excepcionalmente permitidos. Resumen orientativo; consúltese el BOE.',
});

const ART_LSV_76 = articuloSeed({
  normaId: ID_LSV,
  numero: '76',
  titulo: 'Infracciones graves (catálogo del art. 76)',
  texto:
    'Enumera las infracciones GRAVES de tráfico, entre ellas arrojar a la vía o sus inmediaciones objetos ' +
    'que puedan producir incendios o accidentes u obstaculizar la circulación, y el exceso de ocupantes o ' +
    'de las condiciones del transporte que comprometa la seguridad. Resumen orientativo; consúltese el BOE.',
});

const ART_LSV_13 = articuloSeed({
  normaId: ID_LSV,
  numero: '13',
  titulo: 'Detectores e inhibidores de radar',
  texto:
    'Prohíbe instalar o llevar en el vehículo mecanismos o sistemas encaminados a detectar los aparatos de ' +
    'vigilancia del tráfico (detectores de radar). Los INHIBIDORES de señal, que impiden el funcionamiento ' +
    'de esos aparatos, constituyen una infracción MUY GRAVE. Resumen orientativo; consúltese el BOE.',
});

// --- Artículos de la 2ª OLA DE TRÁFICO (volumen de catálogo, 2026-09-11) ---------------------
const ART_RGC_98 = articuloSeed({
  normaId: ID_RGC,
  numero: '98',
  titulo: 'Alumbrado en túneles y pasos inferiores',
  texto:
    'Obliga a encender el alumbrado de cruce (y las luces de posición) al circular por túneles, pasos ' +
    'inferiores y tramos de vía afectados por la señal de "túnel", con independencia de la hora, para ' +
    'ver y ser visto. Resumen orientativo; consúltese el texto consolidado en el BOE.',
});

const ART_RGC_114 = articuloSeed({
  normaId: ID_RGC,
  numero: '114',
  titulo: 'Apertura de puertas y bajada del vehículo con seguridad',
  texto:
    'Prohíbe abrir las puertas del vehículo o apearse de él sin haberse cerciorado previamente de que ' +
    'ello no crea peligro o entorpecimiento para otros usuarios, en especial ciclistas y motoristas ' +
    '(art. 114 RGC). Resumen orientativo; consúltese el texto consolidado en el BOE.',
});

const ART_RGC_130 = articuloSeed({
  normaId: ID_RGC,
  numero: '130',
  titulo: 'Preseñalización de peligro y dispositivos obligatorios',
  texto:
    'Regula la preseñalización de un vehículo inmovilizado o de un obstáculo en la calzada mediante el ' +
    'dispositivo de preseñalización de peligro (luz de emergencia V16 o, en su caso, triángulos) y el uso ' +
    'del chaleco reflectante al salir del vehículo. Desde el 1 de enero de 2026 la luz V16 conectada ' +
    'sustituye a los triángulos (RD 159/2021). Resumen orientativo; consúltese el BOE.',
});

const ART_RGC_141 = articuloSeed({
  normaId: ID_RGC,
  numero: '141',
  titulo: 'Señales de los agentes (prevalencia y obediencia)',
  texto:
    'Las señales y órdenes de los agentes encargados de la vigilancia del tráfico son de obligado ' +
    'cumplimiento y PREVALECEN sobre cualquier otra señal (arts. 141-143 RGC y art. 133 RGC). No ' +
    'obedecerlas es infracción GRAVE sancionada por el art. 76.j) LSV, con detracción de puntos (Anexo ' +
    'II LSV). Resumen orientativo; consúltese el texto consolidado en el BOE.',
});

const ART_RGV_11 = articuloSeed({
  normaId: ID_RGV,
  numero: '11',
  titulo: 'Matriculación y condiciones de remolques',
  texto:
    'Regula la matriculación y las placas de los remolques y semirremolques y las condiciones del conjunto ' +
    'arrastrante-arrastrado: el dispositivo de acoplamiento debe ofrecer garantías de seguridad y el ' +
    'conjunto contar con la autorización y documentación exigibles. Resumen orientativo; consúltese el BOE.',
});

// --- Artículos de la 3ª OLA DE TRÁFICO/TRANSPORTE (volumen de catálogo, 2026-09-14) ----------
// Amplía el catálogo de calle acercándonos a la paridad con SPPLB (su fuerte es el volumen).
// Cada artículo es un RESUMEN NEUTRO redactado por nosotros; el apartado/importe/puntos concretos
// quedan "a verificar" en la nota de cada infracción.
const ART_RGC_11 = articuloSeed({
  normaId: ID_RGC,
  numero: '11',
  titulo: 'Número de personas transportadas y su colocación',
  texto:
    'Regula que no se puede transportar un número de personas superior al de las plazas autorizadas del ' +
    'vehículo ni en emplazamientos no acondicionados para ello (por ejemplo, en la caja de una furgoneta o ' +
    'camión, en el maletero o en lugares que no ofrezcan garantías de seguridad). El exceso de ocupantes o el ' +
    'transporte de personas fuera de los asientos habilitados es infracción de circulación y, cuando ' +
    'comprometa la seguridad, puede ser grave (concordante con el art. 76 LSV). Resumen orientativo; ' +
    'consúltese el texto consolidado en el BOE.',
});

const ART_RGC_15 = articuloSeed({
  normaId: ID_RGC,
  numero: '15',
  titulo: 'Dimensiones de la carga y su señalización (V-20)',
  texto:
    'Regula la posición de la carga y sus dimensiones: cuándo la carga puede sobresalir del vehículo y la ' +
    'obligación de señalizarla con el dispositivo reglamentario (señal V-20 y, de noche o con poca ' +
    'visibilidad, luces) para hacerla visible al resto de usuarios. Transportar una carga que sobresale sin ' +
    'la señalización reglamentaria, o que sobresale más de lo permitido, es infracción de circulación y ' +
    'puede motivar la inmovilización hasta subsanar. Resumen orientativo; consúltese el texto consolidado y ' +
    'la normativa de señalización de cargas.',
});

const ART_RGC_38 = articuloSeed({
  normaId: ID_RGC,
  numero: '38',
  titulo: 'Vehículos y usuarios excluidos de autopistas y autovías',
  texto:
    'Prohíbe la circulación por autopistas y autovías de determinados usuarios y vehículos: peatones, ' +
    'animales, ciclos (con matices según la vía y su señalización), ciclomotores, vehículos de tracción ' +
    'animal, vehículos de movilidad personal (VMP) y, en general, los que no puedan alcanzar la velocidad ' +
    'mínima exigible. Acceder o circular por autovía o autopista con un vehículo o como usuario no ' +
    'autorizado es infracción de circulación y entraña un riesgo elevado. Resumen orientativo; consúltese el ' +
    'texto consolidado y la señalización aplicable.',
});

const ART_RGC_79 = articuloSeed({
  normaId: ID_RGC,
  numero: '79',
  titulo: 'Cambio de sentido de la marcha',
  texto:
    'Regula la maniobra de cambio de sentido: el conductor que pretenda invertir el sentido de su marcha ' +
    'debe elegir un lugar adecuado y con visibilidad, advertir la maniobra con antelación y cerciorarse de ' +
    'que no crea peligro ni obstáculo para otros usuarios; y tiene prohibido hacerlo en cambios de rasante, ' +
    'curvas de visibilidad reducida, pasos a nivel, túneles, autopistas y autovías, y allí donde la ' +
    'señalización lo prohíba. El cambio de sentido en lugar prohibido o sin las debidas garantías es ' +
    'infracción de circulación (concordante con el art. 31 LSV). Resumen orientativo; consúltese el BOE.',
});

const ART_RGC_90 = articuloSeed({
  normaId: ID_RGC,
  numero: '90',
  titulo: 'Parada y estacionamiento en autopistas y autovías',
  texto:
    'Prohíbe, con carácter general, parar o estacionar en autopistas y autovías salvo en las zonas ' +
    'habilitadas para ello (áreas de servicio y de descanso). Si el vehículo queda inmovilizado por avería o ' +
    'emergencia, debe sacarse de la calzada al arcén o al lugar más seguro posible, preseñalizarlo y avisar. ' +
    'Detenerse o estacionar en la calzada o el arcén de una autovía o autopista fuera de esos supuestos es ' +
    'infracción de circulación por el elevado riesgo que genera. Resumen orientativo; consúltese el BOE.',
});

const ART_RGC_100 = articuloSeed({
  normaId: ID_RGC,
  numero: '100',
  titulo: 'Empleo de la luz de carretera y deslumbramiento',
  texto:
    'Regula el uso de la luz de carretera (larga) y el cambio a la de cruce (corta) para no deslumbrar a los ' +
    'demás conductores: al cruzarse con otro vehículo, al circular detrás de otro a corta distancia y en ' +
    'tramos suficientemente iluminados. Deslumbrar por no cambiar a la luz de cruce, o por llevar el ' +
    'alumbrado mal reglado, dificulta la visión del resto de usuarios y es infracción de circulación. ' +
    'Resumen orientativo; consúltese el texto consolidado en el BOE.',
});

const ART_RGC_106 = articuloSeed({
  normaId: ID_RGC,
  numero: '106',
  titulo: 'Alumbrado en condiciones meteorológicas o ambientales adversas',
  texto:
    'Obliga a emplear el alumbrado que corresponda (luz de cruce y, en su caso, las luces de niebla) cuando ' +
    'existan condiciones meteorológicas o ambientales que disminuyan sensiblemente la visibilidad, como ' +
    'niebla, lluvia intensa, nevada, nubes de humo o de polvo, con independencia de la hora, para ver y ser ' +
    'visto. No encender el alumbrado en esas condiciones es infracción de circulación. Resumen orientativo; ' +
    'consúltese el texto consolidado en el BOE.',
});

const ART_LOTT_VTC = articuloSeed({
  normaId: ID_LOTT,
  numero: '140/141 (VTC y taxi)',
  titulo: 'Infracciones en el arrendamiento con conductor (VTC) y el taxi',
  texto:
    'Tipifica como infracción de la ordenación del transporte de viajeros el incumplimiento de las ' +
    'condiciones específicas de los vehículos de arrendamiento con conductor (VTC) y del taxi: prestar el ' +
    'servicio sin la preceptiva autorización o licencia, captar o recoger viajeros en la vía pública sin la ' +
    'contratación previa exigible al VTC, o circular buscando clientes fuera de los supuestos permitidos. La ' +
    'ausencia total de autorización es muy grave (ver `inf-transporte-sin-titulo`); las conductas de ' +
    'captación/contratación indebida se gradúan como graves según el supuesto. La cuantía la concreta el ' +
    'art. 143 LOTT y su reglamento (ROTT), además de la normativa autonómica y municipal del taxi y del VTC. ' +
    'Resumen orientativo; consúltese el texto consolidado en el BOE.',
});

// --- Artículos de la 4ª OLA DE TRÁFICO (paridad SPPLB: conductores, VMP, placas, ITV) ---------
// Sub-áreas poco cubiertas frente a SPPLB: Reglamento de Conductores (RD 818/2009), VMP
// desglosado, régimen del titular (art. 11 LSV), bajas de vehículos y circular tras rechazo de
// ITV. Cada artículo es un RESUMEN NEUTRO redactado por nosotros; el apartado/importe/puntos y la
// gravedad concretos quedan "a verificar" en la nota de cada infracción.
const ART_LSV_75 = articuloSeed({
  normaId: ID_LSV,
  numero: '75',
  titulo: 'Infracciones leves (catálogo del art. 75)',
  texto:
    'Enumera con carácter de cierre las infracciones LEVES de tráfico: las conductas contrarias a ' +
    'la ley y sus reglamentos (RGC, RGV, Reglamento General de Conductores RD 818/2009) que no estén ' +
    'calificadas expresamente como graves o muy graves. Encajan aquí incumplimientos formales o de ' +
    'menor riesgo, como no exhibir determinadas señales o placas obligatorias del vehículo o del ' +
    'conductor (p. ej. la señal "L" de conductor novel durante el primer año). Resumen orientativo; ' +
    'consúltese el texto consolidado en el BOE.',
});

const ART_LSV_11 = articuloSeed({
  normaId: ID_LSV,
  numero: '11',
  titulo: 'Obligaciones del titular y del conductor habitual: deber de identificar al conductor',
  texto:
    'Impone al titular del vehículo (y, en su caso, al conductor habitual o al arrendatario) el deber ' +
    'de facilitar a la Administración la identificación veraz del conductor responsable de una ' +
    'infracción cuando sea debidamente requerido para ello. El incumplimiento de este deber sin causa ' +
    'justificada se sanciona de forma autónoma como infracción MUY GRAVE (art. 77.j LSV), con una ' +
    'cuantía agravada respecto de la infracción originaria. Resumen orientativo; consúltese el texto ' +
    'consolidado en el BOE.',
});

const ART_RGV_35 = articuloSeed({
  normaId: ID_RGV,
  numero: '35',
  titulo: 'Bajas de vehículos en el Registro',
  texto:
    'Regula la baja de los vehículos en el Registro de Vehículos (baja temporal —voluntaria, por robo ' +
    'o por transmisión— y baja definitiva por desguace/fin de vida útil). Un vehículo dado de baja NO ' +
    'puede circular por las vías públicas; hacerlo es infracción y puede motivar su inmovilización y ' +
    'retirada. Resumen orientativo; consúltese el texto consolidado y el RD 265/2021 de bajas.',
});

export const ARTICULOS_SEED: Articulo[] = [
  ART_LSV_75,
  ART_LSV_11,
  ART_RGV_35,
  ART_RGC_11,
  ART_RGC_15,
  ART_RGC_38,
  ART_RGC_79,
  ART_RGC_90,
  ART_RGC_100,
  ART_RGC_106,
  ART_LOTT_VTC,
  ART_RGC_98,
  ART_RGC_114,
  ART_RGC_130,
  ART_RGC_141,
  ART_RGV_11,
  ART_RGC_29,
  ART_RGC_35,
  ART_RGC_45,
  ART_RGC_55,
  ART_RGC_167,
  ART_LSV_76,
  ART_LSV_13,
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
  ART_LOTT_141_TACOGRAFO,
  ART_LOTT_DIMENSIONES,
  ART_LOTT_SENALIZACION,
  ART_CP_379,
  ART_CP_379_1,
  ART_CP_384,
  ART_CP_382_BIS,
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
      // Añadidos de calle (validador 2026-09).
      'no pago el seguro',
      'coche sin asegurar',
      'no tiene el coche asegurado',
      'seguro vencido',
      'seguro dado de baja',
      'poliza vencida',
    ],
    consecuencias: [
      {
        tipo: 'inmovilizacion',
        textoCorto: 'Procede valorar la inmovilización del vehículo hasta acreditar el seguro (art. 104 LSV).',
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
      // Añadidos de calle (validador 2026-09).
      'con el telefono',
      'tecleando conduciendo',
      'escribiendo al volante',
      'wasapeando',
      'el guasap',
      'mandando mensajes conduciendo',
      'sin manos libres',
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
      // Añadidos de calle (validador 2026-09).
      'no tiene la itv',
      'itv sin pasar',
      'sin pegatina de la itv',
      'sin pegatina',
      'no ha pasado la revision',
      'itv atrasada',
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
      // Añadidos de calle (validador 2026-09): también pasajeros.
      'no lleva el cinturon puesto',
      'iba sin cinturon',
      'el copiloto sin cinturon',
      'de atras sin cinturon',
      'no se puso el cinturon',
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
      // Añadidos de calle (validador 2026-09): también el pasajero ("paquete").
      'no lleva casco',
      'sin el casco puesto',
      'de paquete sin casco',
      'el paquete sin casco',
      'moto sin el casco',
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
      // Añadidos de calle (validador 2026-09). No se añade "ambar" (supuesto distinto).
      'se comio el semaforo',
      'paso con el rojo',
      'cruzar en rojo',
      'se lo salto en rojo',
      'el disco en rojo',
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
      // Añadidos de calle (validador 2026-09): jerga y variantes numéricas que teclea el agente.
      'cazado por radar',
      'me cazo el radar',
      'iba pasado',
      'pasado de velocidad',
      'a 180',
      'a 200',
      'foto radar',
      'iba pisando',
      'iba lanzado',
      'control de velocidad',
    ],
    marcoImporte: 'velocidad',
    notaRevision:
      'NOTA sobre la gravedad: `gravedad: "grave"` es solo la etiqueta REPRESENTATIVA del cuadro, que ' +
      'en realidad abarca de LEVE (el suelo de 100 € sin puntos) a GRAVE/MUY GRAVE según el exceso; por ' +
      'eso la ficha usa marco `velocidad` y modela un RANGO (importeEur 100 = suelo, importeMaxEur 600), ' +
      'no una cifra fija. A VERIFICAR el cuadro completo de tramos (importe y puntos por km/h de exceso, ' +
      'distinto según el límite de la vía) contra el cuadro de la LSV y el codificado DGT: la ficha lo ' +
      'pinta como rango "según exceso, desde 100 €" (100–600 €), SIN cifra fija enfatizada, y los puntos ' +
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
      'alcolemia',
      // Añadidos de calle (validador 2026-09): jerga y variantes de tasa.
      'dar positivo',
      'positivo de alcohol',
      'borracho al volante',
      'conducir borracho',
      'iba mamado',
      'iba pedo',
      'olia a alcohol',
      'control de alcoholemia',
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
      // Añadidos de calle (validador 2026-09): carné retirado por el juez → vía penal (384).
      'carne retirado',
      'carnet retirado',
      'se lo quito el juez',
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
  // --- Abandono del lugar del accidente (382 bis): distinto de la omisión de socorro del 195 -----
  construirInfraccion({
    id: 'del-abandono-accidente',
    articulo: ART_CP_382_BIS,
    tituloCorto: 'Abandono del lugar del accidente (delito)',
    gravedad: 'delito',
    tipo: 'penal',
    importeEur: null,
    importeReducidoEur: null,
    puntos: null,
    penaTexto:
      'Prisión de 6 meses a 4 años y privación del derecho a conducir de 1 a 4 años si el accidente lo ' +
      'causó la imprudencia del conductor; prisión de 3 a 6 meses y privación de 6 meses a 2 años si fue ' +
      'fortuito (art. 382 bis CP). A verificar',
    gravedadPenal: 'menos_grave',
    textoBoletin:
      'Es DELITO (art. 382 bis CP) que el conductor abandone voluntariamente el lugar del accidente, sin ' +
      'que concurra riesgo propio o de terceros, tras haber causado un accidente en el que fallece una o ' +
      'varias personas o se causa alguna de las lesiones de los arts. 147.1, 149 o 150 CP (las que ' +
      'requieren tratamiento médico o quirúrgico, o causan deformidad o pérdida de un órgano o miembro). ' +
      'Abandonar tras un accidente con SOLO daños materiales NO es este delito. Se distingue de la omisión ' +
      'del deber de socorro (art. 195, ver ficha `del-omision-socorro`): aquí se castiga la HUIDA del lugar ' +
      'aunque no hubiera a quién socorrer (p. ej. para eludir el control de alcohol o drogas), y ambos ' +
      'delitos pueden concurrir. La pena es mayor si el accidente se debió a imprudencia del conductor. ' +
      'Procede instruir ATESTADO. La calificación final corresponde a la autoridad judicial.',
    terminos: [
      'abandono del lugar del accidente',
      'se fue tras el accidente',
      'huyo tras el choque',
      'positivo y se va',
      'se fuga tras el accidente',
      'abandonar el accidente',
      'huir del accidente',
      'se marcho del accidente',
      'darse a la fuga',
      'se dio a la fuga',
      'atropello con fuga',
      'atropello y se fue',
      'choque y huida',
      'conductor fugado',
    ],
    consecuencias: [
      {
        tipo: 'detencion',
        textoCorto:
          'Ante un delito flagrante procede valorar la detención conforme a los arts. 490 y 492 LECrim; ' +
          'la valoración de los indicios y del riesgo corresponde al agente y, en su caso, a la autoridad ' +
          'judicial.',
        fuente: 'CP art. 382 bis; LECrim arts. 490 y 492',
      },
    ],
    marcoImporte: 'penal',
    notaRevision:
      'A VERIFICAR contra el texto consolidado del CP: el art. 382 bis (redacción vigente de la LO 11/2022) ' +
      'exige que el accidente haya causado la MUERTE de una o varias personas o alguna de las lesiones de ' +
      'los arts. 147.1, 149 y 150 CP, y que el abandono sea voluntario y sin riesgo propio o de terceros. Penas: por imprudencia del ' +
      'conductor → prisión 6 meses-4 años + privación 1-4 años; fortuito → prisión 3-6 meses + privación ' +
      '6 meses-2 años (MENOS GRAVE en ambos, art. 33.3). Distinguir de la omisión del deber de socorro ' +
      '(art. 195, `del-omision-socorro`), con la que puede concurrir. El abandono tras accidente con SOLO ' +
      'daños materiales NO es este delito (vía administrativa/civil). Confirmar penas y encaje.',
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
      // NO se enganchan aquí 'carga y descarga'/'c/d'/'aparcado en carga y descarga': ese supuesto es
      // LEVE/100 € y vive en `inf-estacionar-carga-descarga`; devolverlo desde este genérico (grave,
      // 200 €) daría un dato erróneo (corrección revisor 2026-09-14).
      'estacionamento',
      'aparcamiendo',
      // Añadidos de calle (validador 2026-09). NO se añade zona azul/ORA (ver comentario arriba).
      'bloqueando la salida',
      'obstruyendo el paso',
      'en sitio de minusvalidos',
      'aparcado en curva',
      'en la parada del bus',
      'mal estacionado',
      'en zona prohibida',
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
      'patinete de noche',
      'patin',
      'con auriculares',
      'patinete con auriculares',
      'patinete de menor',
      'patinete sin seguro',
      'patinete sin luz',
      'patinete tuneado',
      'patinet',
      // NO se enganchan aquí los términos de "dos ocupantes" ('dos en un patinete', 'patinete dos
      // personas', 'patinete a dos', 'dos en el patin'): ese supuesto es LEVE/100 € y vive en
      // `inf-vmp-pasajero`; devolverlo desde este genérico (grave, 200 €) daría un dato erróneo
      // (corrección revisor 2026-09-14).
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
      'ORIENTATIVA y depende de la ordenanza municipal; confirmar con el revisor jurídico. ' +
      'PRÓXIMO CAMBIO (RD 518/2026, BOE-A-2026-13889, EN VIGOR 1-OCT-2026): la reforma del RGC introduce ' +
      'obligaciones nuevas para los VMP (entre ellas el uso de CASCO) y otras medidas de protección de ' +
      'usuarios vulnerables; desde el 1-oct-2026 hay que AÑADIR esas conductas y su régimen — a verificar ' +
      'el alcance exacto (casco, edad mínima) en el articulado reformado.',
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
    marcoImporte: 'penal',
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
      'panel naranja',
      'clase 3',
      'clase 7',
      'mercancia peligrosa',
      'etiqueta de peligro',
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
    // Horquilla ajustada al subtramo grave del art. 143 LOTT (601–800 €; art. 141.14 s/ revisión jurídica): NO cifra fija.
    importeEur: 601,
    importeReducidoEur: null,
    importeMaxEur: 800,
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
      'falta de título habilitante (muy grave). Horquilla ajustada al subtramo grave 601–800 € (art. 141.14, ' +
      'baremo art. 143) en revisión jurídica; A VERIFICAR el apartado exacto. Sin pronto pago modelado. No ' +
      'detrae puntos DGT. Revisar por supuesto.',
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
    // Base grave (subtramo 401–600 €); el exceso ELEVADO es MUY GRAVE (art. 140.26 LOTT). Horquilla, no cifra fija.
    importeEur: 401,
    importeReducidoEur: null,
    importeMaxEur: 600,
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
      'Verificado en BOE/ROTT: el exceso de viajeros se GRADÚA por magnitud —el exceso elevado es MUY ' +
      'GRAVE (art. 140.26 LOTT, en relación con el art. 197 ROTT) y el menor, grave—. El seed muestra la ' +
      'base grave (subtramo 401–600 €) y avisa de la escalada a muy grave. A VERIFICAR el umbral exacto de ' +
      'porcentaje que salta a muy grave y su importe. Sin pronto pago modelado. No detrae puntos DGT.',
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
    // Horquilla ajustada al subtramo bajo del muy grave del art. 143 LOTT (1.001–2.000 €; art. 140.29/30 s/ revisión): NO cifra fija.
    importeEur: 1001,
    importeReducidoEur: null,
    importeMaxEur: 2000,
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
      'graves y otras muy graves. Horquilla corregida al subtramo bajo del muy grave 1.001–2.000 € (art. ' +
      '140.29/30, baremo art. 143) tras revisión jurídica —antes sobrevaloraba el mínimo—; A VERIFICAR el ' +
      'apartado por supuesto. Sin pronto pago modelado. No detrae puntos DGT. Revisar.',
  }),
  // --- Mercancías peligrosas (ADR): variantes distintas de la general muy grave --------------
  construirInfraccion({
    id: 'inf-adr-documentacion',
    articulo: ART_LOTT_ADR_DOC,
    tituloCorto: 'ADR: documentación deficiente (instrucciones escritas / carta de porte)',
    gravedad: 'grave',
    // Horquilla ajustada al subtramo alto del grave del art. 143 LOTT (801–1.000 €; art. 141.5 s/ revisión): NO cifra fija.
    importeEur: 801,
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
      '`inf-adr-mercancias-peligrosas`). Horquilla ajustada al subtramo alto del grave 801–1.000 € (art. ' +
      '141.5, baremo art. 143) en revisión; A VERIFICAR el apartado. Sin pronto pago modelado. No detrae ' +
      'puntos DGT. Revisar por supuesto.',
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
    // Horquilla ajustada al subtramo grave del art. 143 LOTT (401–600 €; art. 141.21 s/ revisión): NO cifra fija.
    importeEur: 401,
    importeReducidoEur: null,
    importeMaxEur: 600,
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
      'del incumplimiento de temperaturas o del equipo de frío averiado (pueden graduarse distinto). ' +
      'Horquilla ajustada al subtramo grave 401–600 € (art. 141.21, baremo art. 143) en revisión; A ' +
      'VERIFICAR el apartado. Sin pronto pago modelado. No ' +
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
    gravedad: 'leve',
    // Subtramo leve del art. 143 LOTT (301–400 €; art. 142.1 s/ verificación BOE): NO cifra fija.
    importeEur: 301,
    importeReducidoEur: null,
    importeMaxEur: 400,
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
      'Reclasificada a LEVE (art. 142.1 LOTT, subtramo 301–400 €) tras verificación en BOE/fuentes ' +
      'oficiales: realizar transporte con la autorización sin visar en plazo es leve y subsanable (exención ' +
      'si acredita requisitos y solicita el visado en 15 días). A VERIFICAR si, al no mantener los ' +
      'requisitos de fondo, el supuesto se reconduce a la falta de título (muy grave). Sin pronto pago ' +
      'modelado. No detrae puntos DGT.',
  }),
  // --- Tacógrafo: variante documental (distinta de la manipulación muy grave de Ola 1) -------
  construirInfraccion({
    id: 'inf-tacografo-sin-registros',
    articulo: ART_LOTT_141_TACOGRAFO,
    tituloCorto: 'No llevar o no conservar los registros del tacógrafo',
    gravedad: 'grave',
    // Horquilla ajustada al subtramo grave del art. 143 LOTT (601–800 €; art. 141.13 s/ revisión): NO cifra fija.
    importeEur: 601,
    importeReducidoEur: null,
    importeMaxEur: 800,
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
      'tiempos (muy grave, `inf-tacografo`). Horquilla ajustada al subtramo grave 601–800 € (art. 141.13, ' +
      'baremo art. 143) en revisión; A VERIFICAR el apartado y si la carencia significativa sube a muy grave. ' +
      'Sin pronto pago modelado. No detrae puntos DGT. Revisar por supuesto antes de publicar.',
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
      // 'sin matricula' vive en `inf-sin-placa-o-no-reglamentaria` (placa AUSENTE); aquí es la placa
      // presente pero oculta/doblada/ilegible (corrección revisor 2026-09-14).
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
      // Añadidos de calle (validador 2026-09).
      'no lleva papeles del coche',
      'sin los papeles del vehiculo',
      'se dejo los papeles en casa',
      'no exhibe la documentacion',
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
  // --- OLA DE TRÁFICO (volumen de catálogo, 2026-09-10): conductas de calle frecuentes que faltaban.
  // Importes al cuadro estricto del marco 'trafico' (leve ≤100, grave 200, muy grave 500). Los PUNTOS
  // marcados "a verificar" son el dato sensible: el revisor los contrasta con el Anexo II LSV.
  construirInfraccion({
    id: 'inf-sentido-contrario',
    articulo: ART_LSV_77,
    tituloCorto: 'Circular en sentido contrario',
    gravedad: 'muy_grave',
    importeEur: 500,
    importeReducidoEur: 250,
    puntos: 6,
    textoBoletin:
      'Conducir por una vía o tramo en sentido contrario al establecido para la circulación, con el ' +
      'consiguiente riesgo grave para el resto de usuarios.',
    terminos: [
      'sentido contrario',
      'direccion prohibida',
      'a contramano',
      'entro por la salida',
      'por el carril contrario',
      'conduccion suicida',
      'contra direccion',
      'kamikaze',
      'via de un solo sentido',
    ],
    consecuencias: [
      {
        tipo: 'inmovilizacion',
        textoCorto:
          'Procede valorar la inmovilización del vehículo si persiste el riesgo para la circulación ' +
          '(art. 104 LSV); la medida se levanta al cesar la causa.',
        fuente: 'RD-Leg 6/2015 (LSV) art. 104',
      },
    ],
    marcoImporte: 'trafico',
    notaRevision:
      'A VERIFICAR (dato sensible): el apartado exacto del art. 77 LSV (muy grave, "conducir en sentido ' +
      'contrario al establecido") y la confirmación de 6 PUNTOS en el Anexo II LSV. Importe muy grave 500 €.',
  }),
  construirInfraccion({
    id: 'inf-linea-continua',
    articulo: ART_RGC_167,
    tituloCorto: 'Pisar o rebasar línea continua',
    gravedad: 'grave',
    importeEur: 200,
    importeReducidoEur: 100,
    puntos: null,
    textoBoletin:
      'No respetar una marca vial longitudinal continua, pisándola o rebasándola, fuera de los supuestos ' +
      'en que reglamentariamente está permitido. Si se rebasa PARA ADELANTAR, se aplica la infracción de ' +
      'adelantamiento antirreglamentario.',
    terminos: [
      'linea continua',
      'pisar la raya',
      'cruzar la linea',
      'raya continua',
      'linea blanca',
      'rebasar linea',
      'invadir el carril contrario',
      'cambiar de carril con linea continua',
    ],
    marcoImporte: 'trafico',
    notaRevision:
      'A VERIFICAR: la gravedad (grave si entraña riesgo; podría ser leve en supuestos menores) y el ' +
      'apartado exacto del art. 167/137 RGC. Sin puntos por el mero pisar/rebasar (si es para adelantar, ' +
      'la de adelantamiento sí detrae). Importe grave 200 €.',
  }),
  construirInfraccion({
    id: 'inf-no-mantener-derecha',
    articulo: ART_RGC_29,
    tituloCorto: 'Circular sin mantenerse a la derecha',
    gravedad: 'leve',
    importeEur: 100,
    importeReducidoEur: 50,
    puntos: null,
    textoBoletin:
      'Circular sin mantenerse en el carril derecho o sin ceñirse al borde derecho de la calzada cuando ' +
      'no se está adelantando ni la señalización lo permite, entorpeciendo la ordenada circulación.',
    terminos: [
      'por el carril izquierdo',
      'no se aparta',
      'va por la izquierda',
      'carril central sin motivo',
      'no mantiene la derecha',
      'ocupando carril izquierdo',
      'va en medio',
      'no cede el carril',
    ],
    marcoImporte: 'trafico',
    notaRevision:
      'A VERIFICAR: la gravedad (leve 100 € vs grave 200 € si crea riesgo) y el apartado exacto del ' +
      'art. 29 RGC (colocación en la calzada). Sin puntos.',
  }),
  construirInfraccion({
    id: 'inf-adelantar-ciclista-sin-15m',
    articulo: ART_RGC_35,
    tituloCorto: 'Adelantar a ciclista sin 1,5 m',
    gravedad: 'grave',
    importeEur: 200,
    importeReducidoEur: 100,
    puntos: 6,
    textoBoletin:
      'Adelantar a un ciclista o a un grupo de ciclistas sin dejar una separación lateral de al menos ' +
      '1,5 metros, o hacerlo poniendo en peligro su seguridad.',
    terminos: [
      'adelantar ciclista',
      'metro y medio',
      '1,5 metros',
      'rozar al ciclista',
      'adelantar bici',
      'sin separacion al ciclista',
      'pasar pegado a la bici',
      'adelantar a un ciclista',
    ],
    marcoImporte: 'trafico',
    notaRevision:
      'A VERIFICAR (dato sensible): los PUNTOS exactos (¿6? tras la reforma que endureció el ' +
      'adelantamiento peligroso a ciclistas) en el Anexo II LSV y el apartado del art. 35 RGC ' +
      '(separación lateral de 1,5 m). Importe grave 200 €.',
  }),
  construirInfraccion({
    id: 'inf-estacionar-carril-bus-bici',
    articulo: ART_RGC_94,
    tituloCorto: 'Estacionar en carril bus/bici o parada de bus',
    gravedad: 'grave',
    importeEur: 200,
    importeReducidoEur: 100,
    puntos: null,
    textoBoletin:
      'Estacionar el vehículo en un carril o parte de la vía reservada (carril bus, carril bici) o en una ' +
      'parada de transporte público señalizada, obstaculizando el uso al que está destinada.',
    terminos: [
      'aparcar en el carril bus',
      'parado en la parada del bus',
      'carril bici',
      'aparcar en carril bici',
      'en la parada',
      'zona de bus',
      'sobre el carril bici',
      'aparcar en la parada',
    ],
    consecuencias: [
      {
        tipo: 'deposito',
        textoCorto:
          'Puede proceder la retirada del vehículo por la grúa cuando obstaculice un carril o parte de la ' +
          'vía reservada o una parada de transporte público (art. 105 LSV).',
        fuente: 'RD-Leg 6/2015 (LSV) art. 105',
      },
    ],
    marcoImporte: 'trafico',
    notaRevision:
      'A VERIFICAR: la gravedad y el importe (el estacionamiento sobre carril reservado/parada suele ser ' +
      'grave 200 €, pero en zona urbana puede regir la ORDENANZA municipal) y el apartado del art. 94.2 ' +
      'RGC. Ficha desglosada frente al genérico `inf-estacionamiento-indebido`. Sin puntos.',
  }),
  construirInfraccion({
    id: 'inf-no-ceder-incorporacion',
    articulo: ART_RGC_55,
    tituloCorto: 'No ceder el paso al incorporarse',
    gravedad: 'grave',
    importeEur: 200,
    importeReducidoEur: 100,
    puntos: null,
    textoBoletin:
      'Incorporarse a la circulación desde una vía de acceso, área de servicio, zona colindante o inmueble ' +
      'sin ceder el paso a los vehículos que circulan por la vía a la que se accede.',
    terminos: [
      'incorporacion',
      'salir sin mirar',
      'meterse sin ceder',
      'entrar a la via',
      'incorporarse a la autovia',
      'salida de gasolinera',
      'no cede al entrar',
      'ceda de incorporacion',
    ],
    marcoImporte: 'trafico',
    notaRevision:
      'A VERIFICAR: la gravedad y el apartado del art. 55 RGC (incorporación a la circulación). Distinta ' +
      'de `inf-stop-ceda-el-paso` (señal en intersección). Importe grave 200 €. Sin puntos.',
  }),
  construirInfraccion({
    id: 'inf-arrojar-objetos-via',
    articulo: ART_LSV_77,
    tituloCorto: 'Arrojar objetos que puedan causar incendio o accidente',
    gravedad: 'muy_grave',
    importeEur: 500,
    importeReducidoEur: 250,
    puntos: 6,
    textoBoletin:
      'Arrojar, depositar o abandonar sobre la vía o sus inmediaciones objetos o materias que puedan ' +
      'producir incendios o accidentes (por ejemplo, arrojar una colilla encendida). Es infracción MUY ' +
      'GRAVE (art. 77 LSV, reforma Ley 18/2021). Si el objeto solo obstaculiza la circulación SIN riesgo ' +
      'de incendio ni accidente, la conducta es grave (art. 76 LSV).',
    terminos: [
      'tirar la colilla',
      'arrojar basura',
      'tirar cosas por la ventanilla',
      'colilla encendida',
      'tirar el cigarro',
      'riesgo de incendio',
      'tirar objetos',
      'escombros en la via',
    ],
    marcoImporte: 'trafico',
    notaRevision:
      'CORREGIDO tras revisión: arrojar objetos que puedan producir INCENDIO o ACCIDENTE (colilla ' +
      'encendida) es MUY GRAVE (art. 77 LSV, tras la Ley 18/2021), 6 PUNTOS (Anexo II), importe muy grave ' +
      '500 €. El supuesto meramente obstaculizador (sin incendio/accidente) sí es grave (art. 76 LSV). Si ' +
      'el objeto provoca un incendio puede haber responsabilidad penal aparte. Confirmar con el revisor.',
  }),
  construirInfraccion({
    id: 'inf-detector-radar',
    articulo: ART_LSV_13,
    tituloCorto: 'Llevar detector de radar',
    gravedad: 'grave',
    importeEur: 200,
    importeReducidoEur: 100,
    puntos: 3,
    textoBoletin:
      'Circular con un mecanismo o dispositivo destinado a detectar los sistemas de vigilancia del tráfico ' +
      '(detector de radar). DISTINTO del inhibidor de señal, que constituye infracción MUY GRAVE (art. 77 ' +
      'LSV), de importe muy superior.',
    terminos: [
      'detector de radar',
      'avisador de radar',
      'chivato de radar',
      'antirradar',
      'detector',
      'saltarse el radar',
      'aparato antirradar',
      // NO se incluye 'inhibidor': el inhibidor de señal es infracción MUY GRAVE distinta (art. 77
      // LSV), de importe superior; devolver esta ficha (grave, 200 €) daría un dato erróneo. Se
      // reintroducirá cuando exista una ficha `inf-inhibidor-radar` propia (corrección revisor 2026-09-14).
    ],
    marcoImporte: 'trafico',
    notaRevision:
      'A VERIFICAR (dato sensible): los PUNTOS (¿3?) en el Anexo II LSV, el apartado del art. 13 LSV y la ' +
      'frontera exacta detector (grave, 200 €) vs INHIBIDOR (muy grave, art. 77 LSV; en el marco `trafico` ' +
      'el tramo muy grave es 500 €). Confirmar la base legal de la intervención del dispositivo antes de ' +
      'afirmarla. Importe grave 200 €. ' +
      'PRÓXIMO CAMBIO (RD 518/2026, BOE-A-2026-13889, EN VIGOR 1-OCT-2026): la reforma del RGC podría ' +
      'elevar el detector de radar a MUY GRAVE / 500 € — a partir de esa fecha hay que ACTUALIZAR el ' +
      'importe y la gravedad; a verificar el detalle en el articulado reformado.',
  }),
  construirInfraccion({
    id: 'inf-exceso-ocupantes',
    articulo: ART_LSV_76,
    tituloCorto: 'Exceso de ocupantes',
    gravedad: 'grave',
    importeEur: 200,
    importeReducidoEur: 100,
    puntos: null,
    textoBoletin:
      'Transportar en el vehículo un número de personas superior al de plazas autorizadas, o hacerlo en ' +
      'emplazamientos o condiciones distintos de los previstos, comprometiendo la seguridad de los ocupantes. ' +
      'En turismo, el exceso HASTA el 50 % de las plazas es LEVE; el exceso que SUPERA el 50 % es GRAVE ' +
      '(art. 76 LSV). No detrae puntos.',
    terminos: [
      'exceso de pasajeros',
      'mas gente de la cuenta',
      'van apretados',
      'mas personas que plazas',
      'llevar gente en el maletero',
      'sin plaza',
      'ocupantes de mas',
      'hacinados',
    ],
    consecuencias: [
      {
        tipo: 'inmovilizacion',
        textoCorto:
          'Procede valorar la inmovilización del vehículo hasta cesar el riesgo cuando el exceso de ' +
          'ocupantes comprometa la seguridad (art. 104 LSV).',
        fuente: 'RD-Leg 6/2015 (LSV) art. 104',
      },
    ],
    marcoImporte: 'trafico',
    notaRevision:
      'CORREGIDO tras revisión: en TURISMO no hay tramo muy grave. Exceso HASTA el 50 % de las plazas → ' +
      'LEVE (100 €); exceso que SUPERA el 50 % → GRAVE (200 €), art. 76 LSV. NO detrae puntos. La ficha ' +
      'modela el caso grave (>50 %). Distinto de las fichas LOTT de viajeros. Confirmar apartado con el revisor.',
  }),
  construirInfraccion({
    id: 'inf-velocidad-reducida',
    articulo: ART_RGC_45,
    tituloCorto: 'Velocidad anormalmente reducida',
    gravedad: 'grave',
    importeEur: 200,
    importeReducidoEur: 100,
    puntos: null,
    textoBoletin:
      'Circular sin causa justificada a una velocidad anormalmente reducida, entorpeciendo la marcha del ' +
      'resto de vehículos, o por debajo de la velocidad mínima exigible en la vía.',
    terminos: [
      'va muy lento',
      'circular despacio',
      'velocidad minima',
      'entorpecer',
      'tapon',
      'coche lento en autovia',
      'ir a paso de tortuga',
      'molestar circulando lento',
    ],
    marcoImporte: 'trafico',
    notaRevision:
      'A VERIFICAR: la gravedad (leve 100 € vs grave 200 € si entorpece con riesgo) y el apartado del ' +
      'art. 45/49 RGC (velocidad anormalmente reducida / mínima). Sin puntos. Referencia 200 €.',
  }),
  // --- 2ª OLA DE TRÁFICO (volumen, 2026-09-11): aparcamiento desglosado y conductas frecuentes ----
  construirInfraccion({
    id: 'inf-doble-fila',
    articulo: ART_RGC_94,
    tituloCorto: 'Parar o estacionar en doble fila',
    gravedad: 'grave',
    importeEur: 200,
    importeReducidoEur: 100,
    puntos: null,
    textoBoletin:
      'Parar o estacionar el vehículo en doble fila, junto a otro ya detenido o estacionado en el borde de ' +
      'la calzada, obstaculizando la circulación del resto de usuarios (art. 94 RGC). En zona urbana el ' +
      'importe y la gravedad pueden regirlos la ordenanza municipal.',
    terminos: [
      'doble fila',
      'en doble fila',
      'parado en doble fila',
      'aparcar en doble fila',
      'segunda fila',
      'bloqueando el carril',
      'cortando el paso',
      'parado tapando',
    ],
    consecuencias: [
      {
        tipo: 'deposito',
        textoCorto: 'Puede proceder la retirada por la grúa cuando obstaculice gravemente la circulación (art. 105 LSV).',
        fuente: 'RD-Leg 6/2015 (LSV) art. 105',
      },
    ],
    marcoImporte: 'trafico',
    notaRevision:
      'A VERIFICAR el apartado del art. 94 RGC y la gravedad (grave 200 € si obstaculiza; leve 100 € si no). ' +
      'Sin puntos. En zona urbana puede regir la ORDENANZA municipal.',
  }),
  construirInfraccion({
    id: 'inf-estacionar-paso-peatones',
    articulo: ART_RGC_94,
    tituloCorto: 'Estacionar sobre un paso de peatones',
    gravedad: 'grave',
    importeEur: 200,
    importeReducidoEur: 100,
    puntos: null,
    textoBoletin:
      'Estacionar el vehículo sobre un paso para peatones o para ciclistas señalizado, impidiendo el cruce ' +
      'seguro y la visibilidad recíproca (art. 94 RGC).',
    terminos: [
      'encima del paso de cebra',
      'sobre el paso de peatones',
      'en la cebra',
      'tapando el paso',
      'paso de cebra',
      'sobre el paso ciclista',
      'pisando la cebra',
      'aparcar en el paso de peatones',
    ],
    consecuencias: [
      {
        tipo: 'deposito',
        textoCorto: 'Puede proceder la retirada por la grúa por impedir el paso seguro de peatones (art. 105 LSV).',
        fuente: 'RD-Leg 6/2015 (LSV) art. 105',
      },
    ],
    marcoImporte: 'trafico',
    notaRevision:
      'A VERIFICAR: grave 200 €, 0 puntos. Confirmar el apartado del art. 94 RGC (pasos). En urbano puede ' +
      'regir la ordenanza municipal.',
  }),
  construirInfraccion({
    id: 'inf-estacionar-vado',
    articulo: ART_RGC_94,
    tituloCorto: 'Estacionar frente a un vado señalizado',
    gravedad: 'grave',
    importeEur: 200,
    importeReducidoEur: 100,
    puntos: null,
    textoBoletin:
      'Estacionar el vehículo frente a la salida de un inmueble señalizada con vado en vigor, impidiendo la ' +
      'entrada o salida de vehículos (art. 94 RGC). Suele regirlo la ORDENANZA municipal (importe y gravedad ' +
      'variables; con frecuencia leve).',
    terminos: [
      'vado',
      'delante del vado',
      'tapando el garaje',
      'salida de garaje',
      'vado permanente',
      'bloqueando el garaje',
      'entrada de coches',
      'aparcar en un vado',
    ],
    consecuencias: [
      {
        tipo: 'deposito',
        textoCorto: 'Puede proceder la retirada por la grúa, normalmente a instancia del titular del vado (art. 105 LSV).',
        fuente: 'RD-Leg 6/2015 (LSV) art. 105',
      },
    ],
    marcoImporte: 'trafico',
    notaRevision:
      'IMPORTANTE: el vado suele sancionarse por ORDENANZA MUNICIPAL, con importe variable; el seed usa el ' +
      'supletorio del RGC 94 (grave 200 €). A VERIFICAR importe/competencia por municipio. Sin puntos.',
  }),
  construirInfraccion({
    id: 'inf-estacionar-pmr-sin-tarjeta',
    articulo: ART_RGC_94,
    tituloCorto: 'Estacionar en plaza para PMR sin tarjeta',
    gravedad: 'grave',
    importeEur: 200,
    importeReducidoEur: 100,
    puntos: null,
    textoBoletin:
      'Estacionar en una plaza reservada a personas con movilidad reducida sin exhibir la tarjeta de ' +
      'estacionamiento válida y en vigor, privando de la plaza a quien tiene derecho a ella (art. 94 RGC y ' +
      'ordenanza de accesibilidad).',
    terminos: [
      'plaza de minusvalidos',
      'plaza de discapacitados',
      'plaza pmr',
      'sin tarjeta de minusvalido',
      'reservada movilidad reducida',
      'aparcar en plaza de discapacitado',
      'silla de ruedas plaza',
      'tarjeta de estacionamiento',
    ],
    consecuencias: [
      {
        tipo: 'deposito',
        textoCorto: 'Puede proceder la retirada por la grúa por ocupar indebidamente una plaza reservada (art. 105 LSV).',
        fuente: 'RD-Leg 6/2015 (LSV) art. 105',
      },
    ],
    marcoImporte: 'trafico',
    notaRevision:
      'MARCO predominantemente MUNICIPAL: el importe lo fija la ordenanza (200-300 € y en algunas hasta ' +
      '500 €); el seed usa el supletorio grave 200 €. A VERIFICAR importe/base local. Sin puntos.',
  }),
  construirInfraccion({
    id: 'inf-estacionar-carga-descarga',
    articulo: ART_RGC_94,
    tituloCorto: 'Estacionar en zona de carga y descarga',
    gravedad: 'leve',
    importeEur: 100,
    importeReducidoEur: 50,
    puntos: null,
    textoBoletin:
      'Estacionar un vehículo en una zona reservada a carga y descarga durante el horario en que la reserva ' +
      'está en vigor, sin estar autorizado a ello (art. 94 RGC y ordenanza municipal).',
    terminos: [
      'carga y descarga',
      'zona de carga',
      'reservado carga',
      'zona amarilla',
      'aparcar en carga y descarga',
      'descarga mercancias',
      'franja amarilla',
      'aparcar en zona de reparto',
    ],
    marcoImporte: 'trafico',
    notaRevision:
      'MARCO MUNICIPAL: importe y horario los fija la ordenanza (60-200 €); el seed usa el supletorio leve ' +
      '100 €. A VERIFICAR por municipio. Sin puntos.',
  }),
  construirInfraccion({
    id: 'inf-sin-chaleco-triangulos-v16',
    articulo: ART_RGC_130,
    tituloCorto: 'No señalizar el vehículo inmovilizado o no usar el chaleco',
    gravedad: 'leve',
    importeEur: 80,
    importeReducidoEur: 40,
    puntos: null,
    textoBoletin:
      'NO SEÑALIZAR el vehículo inmovilizado o un obstáculo en la calzada con el dispositivo de ' +
      'preseñalización de peligro (luz de emergencia V16 o, hasta su sustitución, triángulos), o NO usar el ' +
      'chaleco reflectante al salir del vehículo a la calzada o el arcén (art. 130 RGC). OJO: no existe una ' +
      'multa general por "no llevar" el dispositivo a bordo; lo sancionable es no señalizar cuando procede o ' +
      'no usar el chaleco. Desde el 1 de enero de 2026 la V16 conectada sustituye a los triángulos (RD 159/2021).',
    terminos: [
      'no señalizar el vehiculo',
      'sin chaleco al bajar',
      'chaleco reflectante',
      'no poner los triangulos',
      'luz v16',
      'baliza v16',
      'sin señalizar averia',
      'preseñalizacion de peligro',
    ],
    marcoImporte: 'trafico',
    notaRevision:
      'CORREGIDO por el revisor: NO es denunciable "carecer a bordo" del dispositivo (no hay obligación ' +
      'general de llevarlo); lo sancionable es NO SEÑALIZAR el vehículo inmovilizado o NO usar el chaleco al ' +
      'salir (art. 130 RGC). El chaleco puede no estar en el literal del 130: a verificar su precepto. Desde ' +
      '01/01/2026 la V16 conectada sustituye a los triángulos (RD 159/2021). Importe leve (~80 €, ≤100).',
  }),
  construirInfraccion({
    id: 'inf-alumbrado-tunel',
    articulo: ART_RGC_98,
    tituloCorto: 'No usar el alumbrado en túnel',
    gravedad: 'grave',
    importeEur: 200,
    importeReducidoEur: 100,
    puntos: null,
    textoBoletin:
      'Circular por un túnel, paso inferior o tramo señalizado sin encender el alumbrado de cruce, ' +
      'reduciendo la visibilidad propia y la de ser visto (arts. 95 y 98 RGC). Es infracción GRAVE (art. ' +
      '76.e LSV).',
    terminos: [
      'sin luces en el tunel',
      'tunel sin luz',
      'no encender en el tunel',
      'luces tunel',
      'paso inferior',
      'sin alumbrado tunel',
      'cruce apagado en tunel',
    ],
    marcoImporte: 'trafico',
    notaRevision:
      'CORREGIDO por el revisor: circular sin el alumbrado obligatorio en túnel es GRAVE (art. 76.e LSV), ' +
      '200 €, 0 puntos (no leve). Artículo material arts. 95 y 98 RGC. Confirmar apartado.',
  }),
  construirInfraccion({
    id: 'inf-sin-libertad-movimientos',
    articulo: ART_RGC_18,
    tituloCorto: 'Conducir sin libertad de movimientos o visión',
    gravedad: 'grave',
    importeEur: 200,
    importeReducidoEur: 100,
    puntos: null,
    textoBoletin:
      'Conducir sin mantener la propia libertad de movimientos, el campo necesario de visión o la atención ' +
      'permanente, por llevar objetos, bultos o elementos que dificulten el control del vehículo (art. 18 ' +
      'RGC). Distinto del uso del móvil (art. 18.2), que tiene ficha propia.',
    terminos: [
      'sin ver bien',
      'con la mano ocupada',
      'objeto que estorba',
      'bulto delante',
      'parabrisas tapado',
      'conduciendo con una mano',
      'salpicadero lleno',
      'sin campo de vision',
    ],
    marcoImporte: 'trafico',
    notaRevision:
      'A VERIFICAR gravedad (grave 200) y si detrae puntos (posible 3). Distinto del móvil (art. 18.2, ficha ' +
      'propia). Confirmar apartado del art. 18 RGC en el codificado DGT.',
  }),
  construirInfraccion({
    id: 'inf-animal-suelto-habitaculo',
    articulo: ART_RGC_18,
    tituloCorto: 'Llevar un animal suelto que dificulte la conducción',
    gravedad: 'grave',
    importeEur: 200,
    importeReducidoEur: 100,
    puntos: null,
    textoBoletin:
      'Conducir llevando un animal suelto en el habitáculo, sin sistema de sujeción adecuado, de modo que ' +
      'pueda interferir en el control del vehículo o distraer al conductor (art. 18 RGC).',
    terminos: [
      'perro suelto en el coche',
      'animal suelto en el coche',
      'perro en las piernas',
      'mascota sin atar',
      'perro en el asiento conduciendo',
      'gato suelto en el coche',
      'sin transportin',
      'perro delante conduciendo',
    ],
    marcoImporte: 'trafico',
    notaRevision:
      'A VERIFICAR importe/gravedad (grave 200 por asimilación a falta de libertad de movimientos) y puntos ' +
      '(0/3). Confirmar apartado del art. 18 RGC.',
  }),
  construirInfraccion({
    id: 'inf-remolque-mal-enganchado',
    articulo: ART_RGV_11,
    tituloCorto: 'Remolque mal enganchado o sin autorización',
    gravedad: 'grave',
    importeEur: 200,
    importeReducidoEur: 100,
    puntos: null,
    textoBoletin:
      'Arrastrar un remolque cuyo dispositivo de acoplamiento no ofrece garantías de seguridad, o hacerlo ' +
      'careciendo de la matriculación o autorización exigible al conjunto, con riesgo de desenganche o ' +
      'pérdida de estabilidad (art. 11 RGV).',
    terminos: [
      'remolque mal enganchado',
      'remolque suelto',
      'enganche flojo',
      'remolque sin matricula',
      'bola del remolque',
      'remolque sin papeles',
      'sin cadena de seguridad',
      'remolque peligroso',
    ],
    consecuencias: [
      {
        tipo: 'inmovilizacion',
        textoCorto: 'Procede valorar la inmovilización por deficiencia con riesgo hasta subsanar (art. 104 LSV).',
        fuente: 'RD-Leg 6/2015 (LSV) art. 104',
      },
    ],
    marcoImporte: 'trafico',
    notaRevision:
      'A VERIFICAR: separar dos supuestos (mal enganchado = seguridad; sin autorización/placa = RGV ' +
      'documental) podría dar dos fichas. Importe grave 200 y puntos 0 a confirmar; concretar apartado del ' +
      'art. 11/Anexo RGV.',
  }),
  construirInfraccion({
    id: 'inf-apertura-puertas-apearse',
    articulo: ART_RGC_114,
    tituloCorto: 'Abrir puertas o apearse sin precaución',
    gravedad: 'leve',
    importeEur: 100,
    importeReducidoEur: 50,
    puntos: null,
    textoBoletin:
      'Abrir las puertas del vehículo o apearse de él sin cerciorarse previamente de que no origina peligro ' +
      'o entorpecimiento para otros usuarios, en especial ciclistas y motoristas (art. 114 RGC).',
    terminos: [
      'abrir la puerta sin mirar',
      'puertazo',
      'apearse sin mirar',
      'puerta al ciclista',
      'bajarse del coche sin mirar',
      'abrir sin precaucion',
      'dooring',
      'golpe con la puerta',
    ],
    marcoImporte: 'trafico',
    notaRevision:
      'CORREGIDO por el revisor: la apertura de puertas/apearse es el art. 114 RGC (no el 91, que es la ' +
      'forma de estacionar). A VERIFICAR la gravedad (varias fuentes la sitúan como GRAVE 200 € por riesgo, ' +
      'p. ej. al ciclista; el seed pone leve 100 €). Sin puntos.',
  }),
  construirInfraccion({
    id: 'inf-desobedecer-agente',
    articulo: ART_RGC_141,
    tituloCorto: 'No obedecer las señales de un agente',
    gravedad: 'grave',
    importeEur: 200,
    importeReducidoEur: 100,
    puntos: 4,
    textoBoletin:
      'No obedecer las señales u órdenes de los agentes que regulan la circulación, que prevalecen sobre ' +
      'cualquier otra señal (arts. 141-143 RGC). Es infracción GRAVE (art. 76.j LSV) con 4 puntos (Anexo ' +
      'II). FRONTERA: la mera desobediencia a la señal de tráfico es administrativa; la desobediencia GRAVE ' +
      'a la autoridad puede ir por la LO 4/2015 (art. 36.6) o el art. 556 CP.',
    terminos: [
      'no parar al agente',
      'saltarse al guardia',
      'no obedecer al agente',
      'ignorar la señal del agente',
      'no atender la orden',
      'desobedecer al policia de trafico',
      'no respetar al agente',
      'no parar en un control',
    ],
    marcoImporte: 'trafico',
    notaRevision:
      'CONFIRMADO por el revisor: precepto sancionador art. 76.j LSV (grave, 200 €) + 4 puntos (Anexo II ' +
      'ap. 15); reglamentario, señales de los agentes arts. 141-143 y prevalencia art. 133 RGC. (El art. ' +
      '143 RGC define "tipos de semáforos"; corregida la cita.) FRONTERA: desobediencia grave a la autoridad ' +
      '→ LO 4/2015 art. 36.6 o art. 556 CP; no confundir con el art. 383 CP (negativa a pruebas, ficha propia).',
  }),
  // === 3ª OLA DE TRÁFICO/TRANSPORTE (volumen vs SPPLB, 2026-09-14) ============================
  // 15 conductas FRECUENTES de calle que faltaban, sin duplicar las 77 ya existentes. Fuente: RGC
  // (RD 1428/2003), RGV (RD 2822/1998) y LOTT (Ley 16/1987) ya ingeridos + cuadro DGT. TODO queda
  // `pendiente_revision`; el apartado/importe/gravedad/puntos dudosos van marcados "a verificar".
  // --- Maniobras y colocación en la vía ------------------------------------------------------
  construirInfraccion({
    id: 'inf-cambio-sentido-prohibido',
    articulo: ART_RGC_79,
    tituloCorto: 'Cambio de sentido en lugar prohibido',
    gravedad: 'grave',
    importeEur: 200,
    importeReducidoEur: 100,
    puntos: 0,
    textoBoletin:
      'Realizar el cambio de sentido de la marcha en un lugar prohibido o sin las debidas garantías: en ' +
      'cambio de rasante, curva de visibilidad reducida, túnel, paso a nivel, autovía o autopista, o donde ' +
      'la señalización lo prohíbe, o sin advertir la maniobra y cerciorarse de que no crea peligro (art. 79 ' +
      'RGC). No confundir con el cambio de sentido que invade el sentido contrario o con circular en sentido ' +
      'contrario (ficha propia, más grave).',
    terminos: [
      'cambio de sentido prohibido',
      'cambio de sentido donde no se puede',
      'dar la vuelta prohibida',
      'giro en u',
      'giro en u prohibido',
      'cambiar de sentido en linea continua',
      'media vuelta antirreglamentaria',
    ],
    marcoImporte: 'trafico',
    notaRevision:
      'A VERIFICAR contra el codificado DGT el precepto sancionador y la GRAVEDAD por supuesto (art. 79 RGC / ' +
      'art. 76 LSV): el cambio de sentido antirreglamentario se cita como GRAVE (200 €); el seed lo ancla ahí. ' +
      'A VERIFICAR los PUNTOS (el seed fija 0 por prudencia; algún supuesto podría detraer 3). Si el cambio de ' +
      'sentido equivale a invadir el sentido contrario, valorar reconducir a `inf-sentido-contrario` (muy grave). Revisar.',
  }),
  construirInfraccion({
    id: 'inf-vehiculo-no-autorizado-autovia',
    articulo: ART_RGC_38,
    tituloCorto: 'Vehículo o usuario no autorizado en autovía/autopista',
    gravedad: 'grave',
    importeEur: 200,
    importeReducidoEur: 100,
    puntos: 0,
    textoBoletin:
      'Acceder o circular por autopista o autovía con un vehículo o como usuario no autorizado: peatón, ' +
      'animal, ciclomotor, vehículo de tracción animal, vehículo de movilidad personal (patinete) y, en ' +
      'general, los vehículos que no puedan alcanzar la velocidad mínima exigible (art. 38 RGC). Es infracción ' +
      'de circulación por el elevado riesgo que genera.',
    terminos: [
      'patinete en autovia',
      'peaton en autopista',
      'ciclomotor en autovia',
      'circular por autovia sin poder',
      'vehiculo no autorizado en autopista',
      'andar por la autovia',
      'meterse en la autovia con patinete',
    ],
    marcoImporte: 'trafico',
    notaRevision:
      'A VERIFICAR el precepto sancionador y la GRAVEDAD por tipo de usuario/vehículo contra el codificado DGT ' +
      '(art. 38 RGC / art. 76 LSV): el seed ancla GRAVE (200 €) por prudencia. A VERIFICAR los PUNTOS (el seed ' +
      'fija 0). Distinguir del peatón por autovía como mera infracción de peatón (importe menor). Revisar por supuesto.',
  }),
  construirInfraccion({
    id: 'inf-personas-lugar-no-acondicionado',
    articulo: ART_RGC_11,
    tituloCorto: 'Transportar personas en lugar no acondicionado',
    gravedad: 'grave',
    importeEur: 200,
    importeReducidoEur: 100,
    puntos: 0,
    textoBoletin:
      'Transportar personas en un emplazamiento del vehículo no acondicionado ni autorizado para ello: en la ' +
      'caja de una furgoneta o camión, en el maletero, en el remolque o en cualquier lugar que no ofrezca ' +
      'garantías de seguridad (art. 11 RGC). Distinto del mero exceso de ocupantes sobre las plazas ' +
      'autorizadas (ver `inf-exceso-ocupantes`): aquí lo determinante es el lugar peligroso.',
    terminos: [
      'personas en la caja del camion',
      'gente en el maletero',
      'llevar personas en la furgoneta detras',
      'pasajeros sin asiento',
      'transportar personas en el remolque',
      'gente en la parte de carga',
    ],
    marcoImporte: 'trafico',
    notaRevision:
      'A VERIFICAR el precepto y la GRAVEDAD contra el codificado DGT (art. 11 RGC / art. 76 LSV): transportar ' +
      'personas en lugar no acondicionado se cita como GRAVE (200 €); el seed lo ancla ahí por prudencia. A ' +
      'VERIFICAR los PUNTOS (el seed fija 0). No solaparlo con `inf-exceso-ocupantes` (exceso sobre plazas). Revisar.',
  }),
  // --- Estado, equipamiento y carga del vehículo ---------------------------------------------
  construirInfraccion({
    id: 'inf-carga-sobresale-sin-senalizar',
    articulo: ART_RGC_15,
    tituloCorto: 'Carga que sobresale sin señalizar (V-20)',
    gravedad: 'grave',
    importeEur: 200,
    importeReducidoEur: 100,
    puntos: 0,
    textoBoletin:
      'Transportar una carga que sobresale del vehículo sin la señalización reglamentaria (señal V-20 y, de ' +
      'noche o con poca visibilidad, luces), o que sobresale más de lo permitido (art. 15 RGC). Distinto de la ' +
      'carga mal estibada o sin sujeción (ver `inf-sujecion-carga`): aquí el problema es la falta de ' +
      'señalización o el exceso de dimensiones de la carga.',
    terminos: [
      'carga que sobresale',
      'carga sin señalizar',
      'sin la señal v20',
      'v-20',
      'carga larga sin marcar',
      'hierros sobresaliendo',
      'transportar algo que sobresale',
    ],
    consecuencias: [
      {
        tipo: 'inmovilizacion',
        textoCorto:
          'Procede valorar la inmovilización del vehículo hasta que se señalice o reduzca la carga que ' +
          'sobresale, cuando suponga un riesgo para la circulación (art. 104 LSV).',
        fuente: 'LSV art. 104',
      },
    ],
    marcoImporte: 'trafico',
    notaRevision:
      'A VERIFICAR contra el codificado DGT el precepto (art. 15 RGC / normativa de señalización de cargas) y ' +
      'la GRAVEDAD por supuesto: la carga que sobresale sin señalizar se cita como GRAVE (200 €); el seed lo ' +
      'ancla ahí. A VERIFICAR los PUNTOS (el seed fija 0) y el límite de dimensiones aplicable. Distinguir de la ' +
      'mala estiba (`inf-sujecion-carga`). Revisar antes de publicar.',
  }),
  construirInfraccion({
    id: 'inf-reforma-sin-homologar',
    articulo: ART_RGV_7,
    tituloCorto: 'Reforma del vehículo sin homologar ni legalizar',
    gravedad: 'grave',
    importeEur: 200,
    importeReducidoEur: 100,
    puntos: 0,
    textoBoletin:
      'Circular con una reforma de importancia del vehículo que altera sus características sin estar ' +
      'homologada, aprobada y anotada en la documentación (ficha técnica): cambios de motor, suspensión, ' +
      'llantas/neumáticos, carrocería, potencia, etc. (art. 7 RGV; RD 866/2010 de reformas de vehículos). ' +
      'Distinto de los supuestos específicos ya sembrados (lunas tintadas, escape/ruido, luces no homologadas): ' +
      'aquí se trata de la reforma no legalizada en general.',
    terminos: [
      'reforma sin homologar',
      'coche modificado sin papeles',
      'sin legalizar la reforma',
      'reforma no anotada en la ficha tecnica',
      'modificacion no homologada',
      'tuning ilegal',
      'cambio de motor sin legalizar',
    ],
    consecuencias: [
      {
        tipo: 'inmovilizacion',
        textoCorto:
          'Procede valorar la inmovilización del vehículo hasta que se legalice o retire la reforma no ' +
          'homologada, cuando afecte a la seguridad (art. 104 LSV).',
        fuente: 'LSV art. 104',
      },
    ],
    marcoImporte: 'trafico',
    notaRevision:
      'A VERIFICAR el precepto y la GRAVEDAD contra el codificado DGT (art. 7 RGV; RD 866/2010 y Manual de ' +
      'Reformas): la reforma de importancia sin legalizar se cita como GRAVE (200 €); el seed lo ancla ahí. A ' +
      'VERIFICAR los PUNTOS (el seed fija 0) y que no solape con las fichas específicas (lunas, escape, luces). Revisar.',
  }),
  construirInfraccion({
    id: 'inf-frenos-direccion-deficientes',
    articulo: ART_RGV_12,
    tituloCorto: 'Frenos o dirección en mal estado',
    gravedad: 'grave',
    importeEur: 200,
    importeReducidoEur: 100,
    puntos: 0,
    textoBoletin:
      'Circular con el sistema de frenado o de dirección en deficientes condiciones o sin reunir las ' +
      'condiciones técnicas reglamentarias, comprometiendo la seguridad (RGV, condiciones técnicas del ' +
      'vehículo). Distinto de los neumáticos en mal estado (ver `inf-neumaticos-mal-estado`).',
    terminos: [
      'frenos en mal estado',
      'sin frenos',
      'frenos deficientes',
      'direccion en mal estado',
      'coche que no frena bien',
      'holgura en la direccion',
      'fallo de frenos circulando',
    ],
    consecuencias: [
      {
        tipo: 'inmovilizacion',
        textoCorto:
          'Procede valorar la inmovilización del vehículo cuando el estado de los frenos o la dirección ' +
          'suponga un riesgo grave para la seguridad, hasta que se subsane (art. 104 LSV).',
        fuente: 'LSV art. 104',
      },
    ],
    marcoImporte: 'trafico',
    notaRevision:
      'A VERIFICAR el precepto sancionador exacto (RGV / condiciones técnicas y Manual de Procedimiento de ITV) ' +
      'y la GRAVEDAD contra el codificado DGT: el seed ancla GRAVE (200 €). A VERIFICAR los PUNTOS (el seed fija ' +
      '0) y si el riesgo manifiesto eleva la clasificación. Confirmar antes de publicar.',
  }),
  // --- Alumbrado (uso) -----------------------------------------------------------------------
  construirInfraccion({
    id: 'inf-deslumbrar-luz-larga',
    articulo: ART_RGC_100,
    tituloCorto: 'Deslumbrar por no cambiar a la luz de cruce',
    gravedad: 'leve',
    importeEur: 100,
    importeReducidoEur: 50,
    puntos: 0,
    textoBoletin:
      'Deslumbrar a otros conductores por no cambiar la luz de carretera (larga) a la de cruce (corta) al ' +
      'cruzarse con otro vehículo, al circular detrás de otro a corta distancia o en tramos suficientemente ' +
      'iluminados, o por llevar el alumbrado mal reglado (art. 100 RGC).',
    terminos: [
      'deslumbrar',
      'luces largas deslumbrando',
      'no bajar las luces',
      'no dar las cortas',
      'circular con largas en ciudad',
      'faros mal reglados deslumbrando',
    ],
    marcoImporte: 'trafico',
    notaRevision:
      'A VERIFICAR contra el codificado DGT el precepto (art. 100 RGC) y la GRAVEDAD: el mal uso del alumbrado ' +
      'suele citarse como LEVE (el seed ancla 100 €); ciertos supuestos de deslumbramiento peligroso podrían ' +
      'graduarse como GRAVE. A VERIFICAR los PUNTOS (el seed fija 0). Revisar por supuesto antes de publicar.',
  }),
  construirInfraccion({
    id: 'inf-alumbrado-lluvia-niebla',
    articulo: ART_RGC_106,
    tituloCorto: 'No usar el alumbrado con niebla, lluvia o poca visibilidad',
    gravedad: 'leve',
    importeEur: 100,
    importeReducidoEur: 50,
    puntos: 0,
    textoBoletin:
      'No emplear el alumbrado que corresponde (luz de cruce y, en su caso, luces de niebla) cuando las ' +
      'condiciones meteorológicas o ambientales reducen sensiblemente la visibilidad —niebla, lluvia intensa, ' +
      'nieve, humo o polvo—, con independencia de la hora (art. 106 RGC). Distinto del alumbrado deficiente ' +
      'por avería (ver `inf-alumbrado-deficiente`) y del alumbrado en túnel (ver `inf-alumbrado-tunel`).',
    terminos: [
      'sin luces con niebla',
      'sin luces con lluvia',
      'no encender las luces con niebla',
      'circular sin luces con mala visibilidad',
      'sin luces de niebla',
      'sin alumbrado con lluvia intensa',
    ],
    marcoImporte: 'trafico',
    notaRevision:
      'A VERIFICAR contra el codificado DGT el precepto (art. 106 RGC) y la GRAVEDAD: no usar el alumbrado en ' +
      'condiciones de baja visibilidad suele citarse como LEVE (el seed ancla 100 €). A VERIFICAR los PUNTOS ' +
      '(el seed fija 0). No solapar con `inf-alumbrado-deficiente` (avería) ni `inf-alumbrado-tunel`. Revisar.',
  }),
  // --- Parada/estacionamiento en vías rápidas ------------------------------------------------
  construirInfraccion({
    id: 'inf-parar-autovia',
    articulo: ART_RGC_90,
    tituloCorto: 'Parar o estacionar en autovía/autopista',
    gravedad: 'grave',
    importeEur: 200,
    importeReducidoEur: 100,
    puntos: 0,
    textoBoletin:
      'Parar o estacionar en la calzada o el arcén de una autopista o autovía fuera de las zonas habilitadas ' +
      '(áreas de servicio y de descanso) y de los supuestos de emergencia, sin sacar el vehículo al lugar más ' +
      'seguro ni preseñalizarlo (art. 90 RGC). Es infracción de circulación por el elevado riesgo que genera. ' +
      'Distinto de la parada en lugar peligroso general (ver `inf-parada-lugar-peligroso`).',
    terminos: [
      'parar en autovia',
      'parado en la autopista',
      'estacionar en autovia',
      'detenerse en el arcen de la autovia',
      'coche parado en autopista',
      'parar en la calzada de la autovia',
    ],
    marcoImporte: 'trafico',
    notaRevision:
      'A VERIFICAR contra el codificado DGT el precepto (art. 90 RGC) y la GRAVEDAD por supuesto: parar/estacionar ' +
      'en autovía o autopista se cita como GRAVE (200 €); el seed lo ancla ahí. A VERIFICAR los PUNTOS (el seed ' +
      'fija 0). Valorar si la detención en la calzada con riesgo puede escalar a temeraria (art. 380 CP). Revisar.',
  }),
  // --- Seguridad pasiva (SRI desglosado) -----------------------------------------------------
  construirInfraccion({
    id: 'inf-menor-asiento-delantero',
    articulo: ART_RGC_117,
    tituloCorto: 'Menor en asiento delantero sin cumplir los requisitos',
    gravedad: 'grave',
    importeEur: 200,
    importeReducidoEur: 100,
    puntos: 4,
    textoBoletin:
      'Circular con un menor de edad de estatura igual o inferior a 135 cm ocupando el asiento delantero sin ' +
      'cumplir los requisitos legales (por regla general debe viajar en los asientos traseros con el sistema ' +
      'de retención infantil adecuado a su talla y peso), fuera de las excepciones tasadas (art. 117 RGC). ' +
      'Distinto de circular sin ningún sistema de retención infantil (ver `inf-menor-sin-sri`).',
    terminos: [
      'niño en el asiento de delante',
      'menor delante sin sillita',
      'niño delante',
      'menor en el asiento delantero',
      'llevar al niño delante',
      'niño copiloto sin sillita',
    ],
    marcoImporte: 'trafico',
    notaRevision:
      'GRAVE (200 €) y 4 PUNTOS conforme al Anexo II LSV, reformado por la Ley 18/2021 (en vigor ' +
      '21/03/2022), que elevó de 3 a 4 los puntos por no usar/usar mal cinturón, SRI, casco y demás ' +
      'elementos de protección. A VERIFICAR contra el codificado DGT el apartado exacto del art. 117 RGC ' +
      'y las EXCEPCIONES (talla ≤135 cm, ocupación de plazas traseras, desactivación del airbag). Si el ' +
      'código DGT del supuesto "asiento delantero con SRI" fuera de solo multa, serían 0 puntos; en ningún ' +
      'caso 3 (valor previo a la reforma). No solapar con `inf-menor-sin-sri`. Revisar antes de publicar.',
  }),
  // --- Transporte (LOTT) ---------------------------------------------------------------------
  construirInfraccion({
    id: 'inf-tiempos-conduccion-descanso',
    articulo: ART_LOTT_140,
    tituloCorto: 'Exceso de tiempos de conducción o falta de descanso',
    gravedad: 'muy_grave',
    importeEur: 2001,
    importeReducidoEur: null,
    importeMaxEur: 4000,
    puntos: null,
    textoBoletin:
      'Incumplir los tiempos de conducción y los periodos de descanso del Reglamento (CE) 561/2006: superar ' +
      'el tiempo máximo de conducción diaria o continuada, o no respetar los descansos obligatorios. Es ' +
      'infracción de la LOTT, sancionable con multa y con la posibilidad de inmovilizar el vehículo hasta que ' +
      'se cumpla el descanso. Distinto de la manipulación del tacógrafo (ver `inf-tacografo`). La valoración ' +
      'final corresponde a la autoridad competente.',
    terminos: [
      'exceso de tiempo de conduccion',
      'sin descanso obligatorio',
      'conducir mas horas de las permitidas',
      'no respetar el descanso del camion',
      'exceso de jornada del camionero',
      'sin parar a descansar',
    ],
    consecuencias: [
      {
        tipo: 'inmovilizacion',
        textoCorto:
          'Procede valorar la inmovilización del vehículo hasta que el conductor cumpla el periodo de ' +
          'descanso obligatorio, conforme al régimen sancionador de la LOTT.',
        fuente: 'LOTT art. 143 (y su reglamento, ROTT)',
      },
    ],
    marcoImporte: 'transporte',
    notaRevision:
      'A VERIFICAR el apartado exacto del art. 140/141 LOTT (reformado por la Ley 13/2021) y la GRAVEDAD por ' +
      'magnitud del exceso contra el texto consolidado y el ROTT: el exceso grave de tiempos y la falta de ' +
      'descanso se citan como MUY GRAVE; el seed ancla la horquilla 2.001–4.000 € como referencia, A VERIFICAR ' +
      'el tramo efectivo por supuesto. Sin pronto pago modelado. No detrae puntos DGT. Revisar por supuesto.',
  }),
  construirInfraccion({
    id: 'inf-tacografo-tarjeta-ajena',
    articulo: ART_LOTT_140,
    tituloCorto: 'Usar la tarjeta de tacógrafo de otro conductor',
    gravedad: 'muy_grave',
    importeEur: 2001,
    importeReducidoEur: null,
    importeMaxEur: 4000,
    puntos: null,
    textoBoletin:
      'Utilizar en el tacógrafo la tarjeta de conductor de otra persona, o conducir sin insertar la tarjeta ' +
      'para ocultar los tiempos reales de conducción y descanso: es una forma de falseamiento de los datos del ' +
      'tacógrafo. Es infracción muy grave de la LOTT. Distinto de no llevar/no conservar las hojas o registros ' +
      '(ver `inf-tacografo-sin-registros`, grave). La valoración final corresponde a la autoridad competente.',
    terminos: [
      'tarjeta de tacografo de otro',
      'usar la tarjeta de otro conductor',
      'tarjeta ajena del tacografo',
      'conducir con la tarjeta de un compañero',
      'ocultar horas con otra tarjeta',
      'tacografo con tarjeta de otro',
    ],
    consecuencias: [
      {
        tipo: 'inmovilizacion',
        textoCorto:
          'Procede valorar la inmovilización o el precinto del vehículo conforme al régimen sancionador de ' +
          'la LOTT, sin perjuicio de las responsabilidades por falseamiento.',
        fuente: 'LOTT art. 143 (y su reglamento, ROTT)',
      },
    ],
    marcoImporte: 'transporte',
    notaRevision:
      'A VERIFICAR el apartado exacto del art. 140 LOTT (falseamiento/mal uso del tacógrafo; Reglamento (UE) ' +
      '165/2014) y si concurre además responsabilidad penal por falsedad. El seed ancla MUY GRAVE con horquilla ' +
      '2.001–4.000 €; A VERIFICAR el tramo efectivo por supuesto contra el texto consolidado y el ROTT. Sin pronto ' +
      'pago modelado. No detrae puntos DGT. Revisar antes de publicar.',
  }),
  construirInfraccion({
    id: 'inf-limitador-velocidad',
    articulo: ART_LOTT_140,
    tituloCorto: 'Limitador de velocidad manipulado o ausente',
    gravedad: 'muy_grave',
    importeEur: 2001,
    importeReducidoEur: null,
    importeMaxEur: 4000,
    puntos: null,
    textoBoletin:
      'Circular con el limitador de velocidad manipulado, desconectado o inexistente en los vehículos ' +
      'obligados a llevarlo (camiones y autobuses), de forma que no cumpla su función de limitar la velocidad ' +
      'máxima. Es infracción muy grave de la LOTT, con la posibilidad de inmovilizar o precintar el vehículo. ' +
      'La valoración final corresponde a la autoridad competente.',
    terminos: [
      'limitador de velocidad manipulado',
      'sin limitador',
      'limitador desconectado',
      'camion sin limitador',
      'trucar el limitador',
      'autobus con el limitador anulado',
    ],
    consecuencias: [
      {
        tipo: 'inmovilizacion',
        textoCorto:
          'Procede valorar la inmovilización o el precinto del vehículo hasta que se restablezca el ' +
          'limitador de velocidad, conforme al régimen sancionador de la LOTT.',
        fuente: 'LOTT art. 143 (y su reglamento, ROTT)',
      },
    ],
    marcoImporte: 'transporte',
    notaRevision:
      'A VERIFICAR el apartado exacto del art. 140 LOTT (manipulación del limitador/tacógrafo y sus elementos) ' +
      'contra el texto consolidado y el ROTT. El seed ancla MUY GRAVE con horquilla 2.001–4.000 €; A VERIFICAR ' +
      'el tramo efectivo por supuesto. Sin pronto pago modelado. No detrae puntos DGT. Revisar antes de publicar.',
  }),
  construirInfraccion({
    id: 'inf-carta-porte',
    articulo: ART_LOTT_142_DOCS,
    tituloCorto: 'Mercancías sin carta de porte ni documento de control',
    gravedad: 'leve',
    importeEur: 100,
    importeReducidoEur: null,
    importeMaxEur: 300,
    puntos: null,
    textoBoletin:
      'Realizar transporte de mercancías sin llevar a bordo la carta de porte u otro documento de control que ' +
      'ampare la expedición, o no exhibirlo a la inspección. Es, por lo general, infracción leve de la LOTT, ' +
      'subsanable. Distinto de carecer del título habilitante (ver `inf-transporte-sin-titulo`, muy grave) y ' +
      'de no exhibir la tarjeta de transporte (ver `inf-documentacion-control`).',
    terminos: [
      'sin carta de porte',
      'camion sin carta de porte',
      'sin documento de control de la mercancia',
      'sin albaran de transporte',
      'mercancia sin documentacion de porte',
      'falta la carta de porte',
    ],
    marcoImporte: 'transporte',
    notaRevision:
      'A VERIFICAR el apartado exacto del art. 142 LOTT (documentos de control; obligación de carta de porte, ' +
      'Ley 15/2009 del contrato de transporte terrestre de mercancías) y la GRAVEDAD contra el texto consolidado ' +
      'y el ROTT: el seed ancla LEVE con horquilla 100–300 € (mínimo del tramo leve) por prudencia; A VERIFICAR ' +
      'el importe efectivo. Sin pronto pago modelado. No detrae puntos DGT. Revisar antes de publicar.',
  }),
  construirInfraccion({
    id: 'inf-vtc-captacion',
    articulo: ART_LOTT_VTC,
    tituloCorto: 'VTC captando o recogiendo viajeros indebidamente',
    gravedad: 'grave',
    importeEur: 601,
    importeReducidoEur: null,
    importeMaxEur: 800,
    puntos: null,
    textoBoletin:
      'Prestar servicio con un vehículo de arrendamiento con conductor (VTC) captando o recogiendo viajeros en ' +
      'la vía pública sin la contratación previa exigible, o circulando en busca de clientes fuera de los ' +
      'supuestos permitidos. Distinto de carecer por completo de la autorización VTC/taxi (ver ' +
      '`inf-transporte-sin-titulo`, muy grave). La valoración final corresponde a la autoridad competente y a ' +
      'la normativa autonómica y municipal del taxi y del VTC.',
    terminos: [
      'vtc captando clientes',
      'vtc recogiendo en la calle',
      'vtc sin contrato previo',
      'uber sin contratacion previa',
      'vtc buscando clientes',
      'coger viajeros en la calle con vtc',
    ],
    marcoImporte: 'transporte',
    notaRevision:
      'A VERIFICAR el apartado exacto y la GRAVEDAD contra el texto consolidado de la LOTT (arts. 140-142), el ' +
      'ROTT y, sobre todo, la NORMATIVA AUTONÓMICA/MUNICIPAL del taxi y del VTC (competencia transferida, RD-ley ' +
      '13/2018): la captación indebida puede ser grave o muy grave según el supuesto y el territorio. El seed ' +
      'ancla GRAVE con horquilla 601–800 € por prudencia; A VERIFICAR el importe y el precepto por territorio. ' +
      'Sin pronto pago modelado. No detrae puntos DGT. Revisar antes de publicar.',
  }),
  // --- 4ª OLA DE TRÁFICO (paridad SPPLB, 2026-09-14): sub-áreas poco cubiertas -----------------
  // Reglamento de Conductores (permiso de clase inadecuada, caducado por reconocimiento, novel,
  // permiso extranjero), VMP desglosado, régimen del titular (art. 11 LSV), placas, bajas, ITV.
  construirInfraccion({
    id: 'inf-permiso-clase-inadecuada',
    articulo: ART_LSV_77,
    tituloCorto: 'Conducir con permiso de clase no válida para el vehículo',
    gravedad: 'muy_grave',
    importeEur: 500,
    importeReducidoEur: 250,
    puntos: 0,
    textoBoletin:
      'Conducir un vehículo careciendo del permiso de la clase que corresponde a ese vehículo, es ' +
      'decir, con un permiso que NO habilita para conducirlo (por ejemplo, conducir un camión o un ' +
      'autobús con el permiso B, o una motocicleta de gran cilindrada con un A1/A2 que no la ' +
      'autoriza), cuando el hecho no sea constitutivo de delito. Distinto de no haber obtenido nunca ' +
      'permiso (delito del art. 384 CP) y de conducir con el permiso caducado (ver ' +
      '`inf-permiso-caducado-reconocimiento`).',
    terminos: [
      'permiso de otra clase',
      'carnet que no vale para ese vehiculo',
      'camion con el carnet de coche',
      'autobus con el carnet b',
      'moto grande con a2',
      'sin el carnet adecuado',
      'clase de permiso incorrecta',
      'no tiene el carnet para ese vehiculo',
    ],
    consecuencias: [
      {
        tipo: 'inmovilizacion',
        textoCorto:
          'Procede valorar la inmovilización del vehículo mientras no se haga cargo un conductor ' +
          'habilitado para esa clase de vehículo (art. 104 LSV).',
        fuente: 'LSV art. 104',
      },
    ],
    marcoImporte: 'trafico',
    notaRevision:
      'A VERIFICAR gravedad e importe: se ancla MUY GRAVE (500 €, art. 77 LSV) por conducir sin el ' +
      'permiso de la clase requerida, cuando NO sea delito. Contrastar con el Reglamento General de ' +
      'Conductores (RD 818/2009, clases de permiso y equivalencias) y el codificado DGT antes de ' +
      'publicar; confirmar que no detrae puntos y el tratamiento del pronto pago.',
  }),
  construirInfraccion({
    id: 'inf-permiso-caducado-reconocimiento',
    articulo: ART_LSV_76,
    tituloCorto: 'Permiso caducado por no renovar (reconocimiento psicofísico)',
    gravedad: 'grave',
    importeEur: 200,
    importeReducidoEur: 100,
    puntos: 0,
    textoBoletin:
      'Conducir con el permiso o licencia de conducción caducado por no haberlo renovado en plazo, ' +
      'cuando la renovación estaba condicionada a superar el reconocimiento de aptitudes psicofísicas ' +
      'y este no se ha pasado. Se trata de una infracción ADMINISTRATIVA (distinta del delito del ' +
      'art. 384 CP, que exige la pérdida de vigencia por pérdida total de puntos, la privación ' +
      'judicial o no haberlo obtenido nunca). El simple retraso administrativo en la renovación, ' +
      'cumpliendo los requisitos, suele ser de menor entidad.',
    terminos: [
      'permiso caducado sin renovar',
      'carnet caducado por no pasar el reconocimiento',
      'no ha renovado el carnet',
      'carnet vencido',
      'no paso el reconocimiento medico del carnet',
      'renovacion del carnet caducada',
      'carnet sin renovar',
    ],
    marcoImporte: 'trafico',
    notaRevision:
      'A VERIFICAR gravedad e importe: se ancla GRAVE (200 €) para el caso de caducidad ligada al ' +
      'reconocimiento psicofísico no superado; el mero retraso administrativo de la renovación puede ' +
      'ser LEVE. Contrastar con el Reglamento General de Conductores (RD 818/2009, vigencia y ' +
      'renovación) y el codificado DGT. Confirmar puntos (previsiblemente 0) antes de publicar.',
  }),
  construirInfraccion({
    id: 'inf-conductor-novel-sin-l',
    articulo: ART_LSV_75,
    tituloCorto: 'Conductor novel sin la señal "L"',
    gravedad: 'leve',
    importeEur: 100,
    importeReducidoEur: 50,
    puntos: 0,
    textoBoletin:
      'Circular un conductor novel sin exhibir la señal "L" (conductor novel) en el vehículo durante ' +
      'el periodo en que es obligatoria (primer año desde la obtención del permiso). Es un ' +
      'incumplimiento formal de menor entidad. Distinto de las prácticas de aprendizaje sin la señal ' +
      'de la autoescuela o sin profesor, que tienen su propio régimen.',
    terminos: [
      'sin la l de novel',
      'conductor novel sin l',
      'sin pegatina de novel',
      'novel sin la l',
      'sin la l',
      'primer año de carnet sin l',
    ],
    marcoImporte: 'trafico',
    notaRevision:
      'A VERIFICAR con carácter prioritario: confirmar si la falta de la señal "L" del conductor novel ' +
      'es HOY sancionable y su importe/gravedad (Reglamento General de Conductores RD 818/2009 y RGV ' +
      'Anexo XI de señales). Se ancla LEVE (100 €, el valor bajo que citan las fuentes; NO hay respaldo ' +
      'para 80 €); podría no ser sancionable de forma autónoma o llegar a 200 €. No detrae puntos. ' +
      'Revisar antes de publicar (posible ficha meramente informativa).',
  }),
  construirInfraccion({
    id: 'inf-permiso-extranjero-no-valido',
    articulo: ART_LSV_77,
    tituloCorto: 'Conducir con permiso extranjero no válido en España',
    gravedad: 'muy_grave',
    importeEur: 500,
    importeReducidoEur: 250,
    puntos: 0,
    textoBoletin:
      'Conducir con un permiso de conducción extranjero que NO es válido para circular en España por ' +
      'no ser canjeable o no reunir los requisitos exigidos: equivale a conducir careciendo del permiso ' +
      'correspondiente (MUY GRAVE, art. 77 LSV), cuando el hecho no sea constitutivo de delito. FRONTERA ' +
      'IMPORTANTE: el permiso extranjero SÍ canjeable pero con el plazo de canje vencido (con carácter ' +
      'general, seis meses desde la residencia) es un supuesto distinto y MENOS grave —autorización sin ' +
      'validez administrativa por no cumplir las condiciones exigidas (GRAVE, ~200 €, art. 76.ll LSV)—, ' +
      'no esta muy grave. A verificar la calificación según cada caso.',
    terminos: [
      'permiso extranjero',
      'carnet de otro pais',
      'carnet extranjero caducado en españa',
      'sin canjear el carnet',
      'carnet no canjeado',
      'licencia extranjera no valida',
      'conducir con carnet de fuera',
    ],
    marcoImporte: 'trafico',
    notaRevision:
      'A VERIFICAR: el régimen del permiso extranjero (validez, canje y plazos) lo fija el Reglamento ' +
      'General de Conductores (RD 818/2009) y los convenios/acuerdos con cada país; el plazo general ' +
      'de canje tras adquirir residencia y las excepciones deben confirmarse. Se ancla MUY GRAVE ' +
      '(500 €, art. 77 LSV) por asimilación a conducir sin permiso válido. Revisar antes de publicar.',
  }),
  construirInfraccion({
    id: 'inf-vmp-acera',
    articulo: ART_RGC_121,
    tituloCorto: 'VMP (patinete) por la acera o zona peatonal',
    gravedad: 'grave',
    importeEur: 200,
    importeReducidoEur: 100,
    puntos: 0,
    textoBoletin:
      'Circular con un vehículo de movilidad personal (patinete eléctrico) por la acera, por zonas ' +
      'peatonales o por espacios reservados a los peatones, donde el VMP tiene prohibida la ' +
      'circulación. El VMP no detrae puntos porque no requiere permiso de conducción. Desglose de la ' +
      'ficha general `inf-vmp-patinete` para el supuesto concreto de circulación por la acera.',
    terminos: [
      'patinete por la acera',
      'vmp por la acera',
      'patinete por zona peatonal',
      'patinete entre peatones',
      'patinete por el paseo',
      'patin por la acera',
    ],
    consecuencias: [
      {
        tipo: 'inmovilizacion',
        textoCorto:
          'Procede valorar la retención (inmovilización cautelar) del VMP cuando su circulación ' +
          'entrañe riesgo, hasta que cese la causa; la medida la concreta la ordenanza municipal.',
        fuente: 'RGC (RD 1428/2003, reforma RD 970/2020) y ordenanza municipal',
      },
    ],
    marcoImporte: 'trafico',
    notaRevision:
      'A VERIFICAR importe y gravedad: se ancla en unos 200 € (criterio DGT), pero los VMP se regulan ' +
      'además por la ORDENANZA municipal, que puede endurecer o matizar. Confirmar por supuesto y ' +
      'advertir de la variación municipal. Convive con la ficha general `inf-vmp-patinete`: valorar si ' +
      'se mantienen desglosadas o se fusionan. No detrae puntos. Revisar antes de publicar.',
  }),
  construirInfraccion({
    id: 'inf-vmp-pasajero',
    articulo: ART_RGC_121,
    tituloCorto: 'VMP (patinete) con un pasajero',
    gravedad: 'leve',
    importeEur: 100,
    importeReducidoEur: 50,
    puntos: 0,
    textoBoletin:
      'Circular con un vehículo de movilidad personal (patinete eléctrico) transportando a otra ' +
      'persona, cuando el VMP está diseñado y homologado para un único ocupante. El VMP no detrae ' +
      'puntos porque no requiere permiso de conducción. Desglose de la ficha general ' +
      '`inf-vmp-patinete` para el supuesto concreto de llevar pasajero.',
    terminos: [
      'dos en el patinete',
      'patinete con pasajero',
      'patinete con dos personas',
      'llevar a alguien en el patinete',
      'patin con acompañante',
      'montado detras en el patinete',
      // Reasignados desde `inf-vmp-patinete` (genérico grave/200 €) para que el supuesto de dos
      // ocupantes resuelva a esta ficha LEVE/100 € (corrección revisor 2026-09-14).
      'dos en un patinete',
      'patinete dos personas',
      'patinete a dos',
      'dos en el patin',
    ],
    marcoImporte: 'trafico',
    notaRevision:
      'A VERIFICAR importe y gravedad: se ancla LEVE (unos 100 €, criterio DGT) para el VMP con dos ' +
      'ocupantes; la ORDENANZA municipal puede matizar. Convive con la ficha general ' +
      '`inf-vmp-patinete`: valorar si se mantienen desglosadas o se fusionan. No detrae puntos. ' +
      'Revisar antes de publicar.',
  }),
  construirInfraccion({
    id: 'inf-vmp-nocturno-sin-luces',
    articulo: ART_RGC_121,
    tituloCorto: 'VMP (patinete) de noche sin alumbrado ni reflectantes',
    gravedad: 'grave',
    importeEur: 200,
    importeReducidoEur: 100,
    puntos: 0,
    textoBoletin:
      'Circular con un vehículo de movilidad personal (patinete eléctrico) de noche, o en condiciones ' +
      'de escasa visibilidad, sin el alumbrado y los elementos reflectantes exigibles para ser visto ' +
      'por el resto de usuarios. El VMP no detrae puntos porque no requiere permiso de conducción. ' +
      'Desglose de la ficha general `inf-vmp-patinete` para el supuesto concreto de circulación ' +
      'nocturna sin alumbrado.',
    terminos: [
      'patinete de noche sin luces',
      'vmp sin luces de noche',
      'patinete sin reflectantes',
      'patinete sin alumbrado nocturno',
      'patin de noche sin luz',
      'patinete sin luz por la noche',
    ],
    marcoImporte: 'trafico',
    notaRevision:
      'A VERIFICAR importe y gravedad: se ancla en unos 200 € (criterio DGT) por el riesgo de no ser ' +
      'visto de noche; la ORDENANZA municipal puede concretar el equipamiento (alumbrado, chaleco). ' +
      'Convive con la ficha general `inf-vmp-patinete`: valorar si se mantienen desglosadas o se ' +
      'fusionan. No detrae puntos. Revisar antes de publicar.',
  }),
  construirInfraccion({
    id: 'inf-vehiculo-dado-baja',
    articulo: ART_RGV_35,
    tituloCorto: 'Circular con un vehículo dado de baja',
    gravedad: 'muy_grave',
    importeEur: 500,
    importeReducidoEur: 250,
    puntos: 0,
    textoBoletin:
      'Circular con un vehículo que consta dado de baja en el Registro de Vehículos (baja temporal ' +
      'voluntaria, por robo o por transmisión, o baja definitiva por desguace), pese a que un vehículo ' +
      'de baja no puede circular por las vías públicas. Suele concurrir con la falta de seguro y de ' +
      'ITV en vigor.',
    terminos: [
      'coche dado de baja',
      'vehiculo dado de baja circulando',
      'coche de baja',
      'circular con un coche de baja',
      'vehiculo de baja temporal',
      'coche desguazado circulando',
      'baja definitiva circulando',
    ],
    consecuencias: [
      {
        tipo: 'inmovilizacion',
        textoCorto:
          'Procede valorar la inmovilización y, en su caso, la retirada del vehículo, que al estar de ' +
          'baja no puede circular (art. 104 LSV).',
        fuente: 'LSV art. 104',
      },
    ],
    marcoImporte: 'trafico',
    notaRevision:
      'A VERIFICAR gravedad e importe: se ancla MUY GRAVE (500 €) por circular con un vehículo dado de ' +
      'baja (RGV y RD 265/2021 de bajas; sanción por la vía del art. 77 LSV). Contrastar el precepto ' +
      'sancionador exacto y el tratamiento del pronto pago con el codificado DGT. Advertir de la ' +
      'concurrencia habitual con falta de seguro (`inf-sin-seguro`) e ITV. Revisar antes de publicar.',
  }),
  construirInfraccion({
    id: 'inf-titular-no-identifica-conductor',
    articulo: ART_LSV_11,
    tituloCorto: 'El titular no identifica al conductor infractor',
    gravedad: 'muy_grave',
    importeEur: 500,
    importeReducidoEur: null,
    puntos: 0,
    textoBoletin:
      'No facilitar el titular del vehículo (o el conductor habitual o arrendatario), debidamente ' +
      'requerido para ello, la identificación veraz del conductor responsable de una infracción, sin ' +
      'causa justificada. Se sanciona de forma autónoma como infracción muy grave (art. 77.j LSV). ' +
      'IMPORTE: NO es una cifra fija ni admite pronto pago; es un MÚLTIPLO de la infracción originaria ' +
      '(el DOBLE si esta es leve, el TRIPLE si es grave o muy grave), por lo que puede superar los ' +
      '500 €. No corresponde a una conducta de circulación, sino al deber de colaboración del titular ' +
      '(art. 11 LSV).',
    terminos: [
      'el titular no dice quien conducia',
      'no identifica al conductor',
      'no facilita el conductor',
      'el dueño no dice quien iba conduciendo',
      'no identificar al conductor',
      'obligacion de identificar al conductor',
      'multa por no identificar al conductor',
    ],
    marcoImporte: 'trafico',
    notaRevision:
      'A VERIFICAR importe: la sanción por no identificar al conductor (art. 77.j LSV) es un MÚLTIPLO ' +
      'de la infracción originaria (el doble si es leve; el triple si es grave o muy grave), por lo ' +
      'que el importe real varía y puede superar el tope fijo de muy grave. Se ancla en 500 € (muy ' +
      'grave) como referencia; modelar la horquilla/cálculo con el revisor. No detrae puntos al ' +
      'titular. Revisar antes de publicar.',
  }),
  construirInfraccion({
    id: 'inf-sin-placa-o-no-reglamentaria',
    articulo: ART_RGV_25,
    tituloCorto: 'Sin placa de matrícula o con placa no reglamentaria',
    gravedad: 'grave',
    importeEur: 200,
    importeReducidoEur: 100,
    puntos: 0,
    textoBoletin:
      'Circular con un vehículo al que le falta una o ambas placas de matrícula, o que lleva una placa ' +
      'no reglamentaria (caracteres, tamaño, color de fondo o material no homologados, o placa ' +
      'artesanal/manipulada). Distinto de la placa colocada pero oculta, doblada o ilegible (ver ' +
      '`inf-matricula-oculta`).',
    terminos: [
      'sin matricula',
      'sin placa de matricula',
      'le falta la matricula',
      'matricula no reglamentaria',
      'matricula casera',
      'placa no homologada',
      'circular sin matricula',
    ],
    marcoImporte: 'trafico',
    notaRevision:
      'A VERIFICAR gravedad e importe: se ancla GRAVE (200 €) por circular sin placa reglamentaria ' +
      '(RGV art. 25 y Anexo XVIII de placas). Contrastar con el codificado DGT si el supuesto de ' +
      'ausencia total de placa se agrava respecto de la placa no reglamentaria. Confirmar puntos ' +
      '(previsiblemente 0) y deslindar de `inf-matricula-oculta`. Revisar antes de publicar.',
  }),
  construirInfraccion({
    id: 'inf-remolque-sin-documentacion',
    articulo: ART_RGV_11,
    tituloCorto: 'Remolque ligero sin documentación ni placa',
    gravedad: 'grave',
    importeEur: 200,
    importeReducidoEur: 100,
    puntos: 0,
    textoBoletin:
      'Circular arrastrando un remolque (incluido el remolque ligero, de masa máxima autorizada hasta ' +
      '750 kg) sin la documentación exigible o sin la placa de matrícula/identificación que le ' +
      'corresponda. Distinto del enganche o acoplamiento en malas condiciones (ver ' +
      '`inf-remolque-mal-enganchado`).',
    terminos: [
      'remolque sin documentacion',
      'remolque sin ficha tecnica',
      'remolque ligero sin papeles',
      'remolque sin permiso de circulacion',
      'documentacion del remolque',
      'remolque sin placa',
    ],
    consecuencias: [
      {
        tipo: 'inmovilizacion',
        textoCorto:
          'Procede valorar la inmovilización del conjunto hasta subsanar la falta de documentación o ' +
          'placa del remolque (art. 104 LSV).',
        fuente: 'LSV art. 104',
      },
    ],
    marcoImporte: 'trafico',
    notaRevision:
      'A VERIFICAR gravedad, importe y régimen documental del remolque LIGERO (≤ 750 kg) frente al que ' +
      'requiere matriculación propia (RGV art. 11 y concordantes). Se ancla GRAVE (200 €) por ' +
      'prudencia; el supuesto puede ser leve según el defecto documental concreto. SOLAPA con ' +
      '`inf-remolque-mal-enganchado`, que ya recoge el caso "sin matriculación/autorización": VALORAR ' +
      'con el revisor si se mantienen separadas (documental vs. seguridad del enganche) o se fusionan. ' +
      'Confirmar la inmovilización orientativa. No detrae puntos. Revisar antes de publicar.',
  }),
  construirInfraccion({
    id: 'inf-circular-itv-negativa-inmovilizado',
    articulo: ART_RGV_10,
    tituloCorto: 'Circular tras rechazo de ITV con el vehículo inmovilizado',
    gravedad: 'muy_grave',
    importeEur: 500,
    importeReducidoEur: 250,
    puntos: 0,
    textoBoletin:
      'Circular con un vehículo cuya inspección técnica (ITV) resultó NEGATIVA por defectos graves o ' +
      'muy graves, incumpliendo la limitación de circulación impuesta (que solo permite, en su caso, ' +
      'el traslado al taller o a una nueva inspección) o pese a haber sido inmovilizado por ello. Es ' +
      'más grave que la simple ITV caducada (ver `inf-itv-caducada`) porque el vehículo tiene ' +
      'defectos que comprometen la seguridad.',
    terminos: [
      'itv negativa circulando',
      'circular con la itv rechazada',
      'itv desfavorable grave',
      'vehiculo inmovilizado por la itv',
      'saltarse la inmovilizacion de la itv',
      'circular con defectos graves de itv',
    ],
    consecuencias: [
      {
        tipo: 'inmovilizacion',
        textoCorto:
          'Procede valorar la inmovilización del vehículo hasta subsanar los defectos y superar una ' +
          'nueva inspección (art. 104 LSV).',
        fuente: 'LSV art. 104',
      },
    ],
    marcoImporte: 'trafico',
    notaRevision:
      'A VERIFICAR gravedad e importe: se ancla MUY GRAVE (500 €) por circular con ITV negativa por ' +
      'defectos graves/muy graves o pese a la inmovilización, frente a la ITV caducada (grave, ' +
      '`inf-itv-caducada`). Contrastar el precepto y el tratamiento con el codificado DGT y el Manual ' +
      'de Procedimiento de ITV (RD 920/2017). Revisar antes de publicar.',
  }),
  // --- 5ª OLA DE TRÁFICO/TRANSPORTE (paridad SPPLB, 2026-09-14): sub-áreas poco cubiertas -------
  // Reglamento de Conductores (permiso suspendido cautelarmente, prácticas sin profesor/doble mando,
  // exceso de ocupantes en prácticas), transporte de viajeros (taxi/VTC sin distintivo), transporte
  // escolar desglosado (sin acompañante, sin señalización), MMA muy grave por tramo, exceso de
  // dimensiones, perecederas por temperatura y señalización del transporte especial. NO duplican las
  // fichas previas (bundles broad de escolar/ATP/MMA): estas afinan un supuesto concreto. TODO
  // `pendiente_revision`; la nota marca "a verificar" el precepto, la gravedad y la horquilla.
  // --- Reglamento de Conductores (RD 818/2009) -----------------------------------------------
  construirInfraccion({
    id: 'inf-permiso-suspendido-cautelar',
    articulo: ART_LSV_76,
    tituloCorto: 'Conducir con el permiso suspendido cautelarmente (administrativo)',
    gravedad: 'grave',
    importeEur: 200,
    importeReducidoEur: 100,
    puntos: 0,
    textoBoletin:
      'Conducir un vehículo con el permiso SUSPENDIDO como medida cautelar por vía ADMINISTRATIVA (o ' +
      'prohibido su uso): infracción GRAVE (art. 76.s LSV). TRES SUPUESTOS DISTINTOS que no hay que ' +
      'confundir: (1) suspensión administrativa cautelar = esta ficha, GRAVE; (2) permiso INTERVENIDO por ' +
      'la Policía Judicial en un proceso penal (art. 770.6 LECrim, p. ej. tras un accidente) = conducir ' +
      'careciendo de permiso, MUY GRAVE (art. 77.k LSV, ~500 €); (3) pérdida de vigencia por pérdida total ' +
      'de puntos o privación JUDICIAL del derecho a conducir = DELITO (art. 384 CP, ver `inf-sin-permiso`). ' +
      'Esta ficha es solo el supuesto (1).',
    terminos: [
      'permiso suspendido cautelar',
      'carnet intervenido',
      'carnet retirado cautelarmente',
      'conducir con el permiso suspendido',
      'permiso intervenido conduciendo',
      'medida cautelar del carnet',
    ],
    consecuencias: [
      {
        tipo: 'inmovilizacion',
        textoCorto:
          'Procede valorar la inmovilización del vehículo mientras no se haga cargo un conductor ' +
          'habilitado (art. 104 LSV).',
        fuente: 'LSV art. 104',
      },
    ],
    marcoImporte: 'trafico',
    notaRevision:
      'A VERIFICAR con carácter prioritario la GRAVEDAD, el importe y la FRONTERA PENAL: la suspensión/' +
      'intervención administrativa CAUTELAR del permiso se ancla GRAVE (200 €, art. 76 LSV); la pérdida ' +
      'de vigencia por pérdida total de puntos o la privación JUDICIAL del derecho a conducir son DELITO ' +
      '(art. 384 CP, ver `inf-sin-permiso`), no esta infracción. Contrastar con el Reglamento General de ' +
      'Conductores (RD 818/2009) y el codificado DGT. Confirmar puntos (previsiblemente 0). Revisar.',
  }),
  construirInfraccion({
    id: 'inf-practicas-sin-profesor',
    articulo: ART_LSV_75,
    tituloCorto: 'Prácticas de aprendizaje sin profesor o sin doble mando',
    gravedad: 'leve',
    importeEur: 100,
    importeReducidoEur: 50,
    puntos: 0,
    textoBoletin:
      'Realizar prácticas de conducción en fase de aprendizaje incumpliendo las condiciones exigibles: ' +
      'sin ir acompañado del profesor de formación vial autorizado, o en un vehículo que carece de los ' +
      'dobles mandos (doble pedal) reglamentarios que permiten al profesor intervenir. Las prácticas de ' +
      'aprendizaje solo pueden hacerse en las condiciones y con los vehículos que fija el Reglamento ' +
      'General de Conductores (RD 818/2009). Distinto del conductor novel sin la señal "L" (ver ' +
      '`inf-conductor-novel-sin-l`).',
    terminos: [
      'practicas sin profesor',
      'aprender a conducir sin profesor',
      'practicas sin doble mando',
      'coche de practicas sin doble pedal',
      'practicas de autoescuela sin profesor',
      'sin doble mando en practicas',
    ],
    marcoImporte: 'trafico',
    notaRevision:
      'A VERIFICAR (revisor 2ª): no hay letra específica en el art. 76/77 LSV para esta conducta; ' +
      'reclasificada a LEVE (100 €) por la cláusula RESIDUAL del art. 75 LSV. OJO: si el supuesto se ' +
      'asimila a conducir SIN la habilitación correspondiente, sería MUY GRAVE (art. 77.k) — extremo ' +
      'contrario. Contrastar con el RD 818/2009 (condiciones del aprendizaje) y el codificado DGT antes ' +
      'de publicar; no dar por firme el tramo hasta entonces.',
  }),
  construirInfraccion({
    id: 'inf-practicas-exceso-ocupantes',
    articulo: ART_LSV_76,
    tituloCorto: 'Exceso de ocupantes en el vehículo de prácticas',
    gravedad: 'grave',
    importeEur: 200,
    importeReducidoEur: 100,
    puntos: 0,
    textoBoletin:
      'Realizar prácticas de aprendizaje o el examen de conducir llevando en el vehículo más personas ' +
      'de las autorizadas para esa actividad (con carácter general, solo el aprendiz, el profesor y, en ' +
      'su caso, el examinador). El exceso de ocupantes durante el aprendizaje compromete la seguridad y ' +
      'las condiciones en que debe desarrollarse la práctica, que fija el Reglamento General de ' +
      'Conductores (RD 818/2009).',
    terminos: [
      'exceso de ocupantes en practicas',
      'mas gente en el coche de practicas',
      'acompañantes de mas en practicas',
      'pasajeros en el coche de autoescuela',
      'demasiadas personas en practicas',
      'ocupantes no autorizados en practicas',
    ],
    marcoImporte: 'trafico',
    notaRevision:
      'A VERIFICAR la GRAVEDAD, el importe y el precepto: el exceso de ocupantes en el vehículo de ' +
      'prácticas/examen se ancla GRAVE (200 €, art. 76 LSV, que incluye el exceso de ocupantes que ' +
      'comprometa la seguridad). Contrastar con el Reglamento General de Conductores (RD 818/2009, ' +
      'personas admitidas en el vehículo durante el aprendizaje y el examen) y el codificado DGT. ' +
      'Confirmar puntos (previsiblemente 0). Revisar antes de publicar.',
  }),
  // --- Transporte de viajeros (taxi / VTC) ---------------------------------------------------
  construirInfraccion({
    id: 'inf-taxi-vtc-sin-distintivo',
    articulo: ART_LOTT_VTC,
    tituloCorto: 'Taxi o VTC sin el distintivo o placa identificativa',
    gravedad: 'leve',
    importeEur: 100,
    importeReducidoEur: null,
    importeMaxEur: 400,
    puntos: null,
    textoBoletin:
      'Prestar servicio de taxi o de vehículo de arrendamiento con conductor (VTC) sin exhibir el ' +
      'distintivo, la placa o el identificativo obligatorio del servicio (distintivo de VTC, placa SP, ' +
      'número de licencia de taxi, etc.), o llevándolo deteriorado o no visible. Se distingue de carecer ' +
      'de la propia autorización (muy grave, ver `inf-viajeros-sin-autorizacion`) y de la captación ' +
      'indebida de viajeros por el VTC (ver `inf-vtc-captacion`): aquí el título existe pero falta la ' +
      'señalización identificativa del vehículo.',
    terminos: [
      'taxi sin placa sp',
      'vtc sin distintivo',
      'taxi sin numero de licencia',
      'vtc sin la pegatina',
      'sin distintivo de vtc',
      'taxi sin identificativo',
    ],
    marcoImporte: 'transporte',
    notaRevision:
      'A VERIFICAR el precepto exacto y la GRAVEDAD contra el texto consolidado de la LOTT (arts. 140-142), ' +
      'el ROTT y, sobre todo, la NORMATIVA AUTONÓMICA/MUNICIPAL del taxi y del VTC (competencia ' +
      'transferida, RD 1076/2017 para VTC): la falta del distintivo/placa suele ser LEVE y subsanable, ' +
      'pero el precepto y la cuantía los concreta cada territorio. El seed ancla LEVE (100–400 €) por ' +
      'prudencia; A VERIFICAR el importe por territorio. Sin pronto pago modelado. No detrae puntos DGT.',
  }),
  // --- Transporte escolar y de menores (RD 443/2001): supuestos desglosados ------------------
  construirInfraccion({
    id: 'inf-escolar-sin-acompanante',
    articulo: ART_LOTT_ESCOLAR,
    tituloCorto: 'Transporte escolar sin el acompañante obligatorio (muy grave)',
    gravedad: 'muy_grave',
    importeEur: 2001,
    importeReducidoEur: null,
    importeMaxEur: 4000,
    puntos: null,
    textoBoletin:
      'Realizar transporte escolar o de menores sin el acompañante o monitor a bordo cuando su presencia ' +
      'es obligatoria (según la edad de los menores y el tipo de servicio que fija el RD 443/2001). El ' +
      'acompañante es una condición de seguridad esencial de este transporte. Es un supuesto CONCRETO del ' +
      'incumplimiento de las condiciones del transporte escolar (ver también `inf-transporte-escolar`, ' +
      'ficha general): procede valorar la subsanación antes de reanudar la marcha.',
    terminos: [
      'escolar sin acompañante obligatorio',
      'ruta escolar sin monitor',
      'bus de niños sin acompañante',
      'transporte de menores sin acompañante',
      'falta el monitor del bus escolar',
      'sin cuidador en el autobus escolar',
    ],
    consecuencias: [
      {
        tipo: 'inmovilizacion',
        textoCorto:
          'Procede valorar la inmovilización del vehículo hasta que se incorpore el acompañante ' +
          'obligatorio, conforme al régimen sancionador de la LOTT.',
        fuente: 'LOTT art. 143 (y RD 443/2001, transporte escolar y de menores)',
      },
    ],
    marcoImporte: 'transporte',
    notaRevision:
      'RECLASIFICADA a MUY GRAVE (revisor 2ª): la ausencia de persona mayor de edad idónea distinta del ' +
      'conductor en el transporte de escolares y menores está tipificada como MUY GRAVE en el art. 140.29 ' +
      'LOTT. Tramo muy grave del art. 143 (el seed usa 2.001-4.000 €; A VERIFICAR el sub-tramo exacto). Sin ' +
      'pronto pago. No detrae puntos DGT. Confirmar la cifra final contra el texto consolidado.',
  }),
  construirInfraccion({
    id: 'inf-escolar-sin-senalizacion',
    articulo: ART_LOTT_ESCOLAR,
    tituloCorto: 'Transporte escolar sin la señalización obligatoria',
    gravedad: 'grave',
    importeEur: 401,
    importeReducidoEur: null,
    importeMaxEur: 600,
    puntos: null,
    textoBoletin:
      'Realizar transporte escolar o de menores sin la señalización específica exigible al vehículo ' +
      '(señal de transporte escolar V-10 en la parte delantera y trasera, y demás distintivos que fija ' +
      'el RD 443/2001), o llevándola deteriorada o no visible. La señalización advierte al resto de ' +
      'usuarios de que se trata de un transporte de menores. Es un supuesto CONCRETO del incumplimiento ' +
      'de las condiciones del transporte escolar (ver también `inf-transporte-escolar`, ficha general).',
    terminos: [
      'escolar sin señal v-10',
      'bus escolar sin señalizar',
      'transporte de menores sin señalizacion',
      'autobus escolar sin distintivo',
      'sin cartel de transporte escolar',
      'ruta escolar sin señalizacion',
    ],
    marcoImporte: 'transporte',
    notaRevision:
      'A VERIFICAR con PRIORIDAD ALTA la BASE LEGAL y el MARCO (revisor 2ª): la falta de la señal V-10 ' +
      'podría perseguirse NO por la LOTT (marco `transporte`, como está ahora) sino por el RGC/RGV vía LSV ' +
      '(marco `trafico`, importes fijos) — son dos regímenes de cuantía distintos e incompatibles. Mientras ' +
      'no se confirme contra el BOE (RD 443/2001 art. 5, RGV Anexo XI, catálogo LSV/LOTT), NO dar por firme ' +
      'ni el marco ni el importe (el seed ancla GRAVE 401–600 € solo de forma provisional). No publicar como ' +
      'verificado hasta resolverlo. No detrae puntos DGT.',
  }),
  // --- MMA / sobrepeso: tramo muy grave (afina `inf-exceso-mma`, que ancla el grave) ----------
  construirInfraccion({
    id: 'inf-exceso-mma-muy-grave',
    articulo: ART_LOTT_140,
    tituloCorto: 'Exceso de masa máxima autorizada muy grave (sobrepeso elevado)',
    gravedad: 'muy_grave',
    importeEur: 2001,
    importeReducidoEur: null,
    importeMaxEur: 4000,
    puntos: null,
    textoBoletin:
      'Circular con un vehículo o conjunto con un exceso ELEVADO de masa máxima autorizada (MMA) o de masa ' +
      'por eje: el tramo MUY GRAVE del art. 140.23 LOTT se aprecia, con carácter general, a partir de un ' +
      'exceso ≥ 25 % de la MMA total o ≥ 50 % por eje (reducidos a ≥ 20 % y ≥ 40 % si la MMA del vehículo ' +
      'supera las 12 t). Por debajo de esos umbrales, el exceso es GRAVE (ver `inf-exceso-mma`). La ' +
      'responsabilidad puede alcanzar al transportista, al cargador y al expedidor. Los límites de masa ' +
      'los fija el Reglamento General de Vehículos (RD 2822/1998).',
    terminos: [
      'sobrepeso muy grave',
      'exceso de mma elevado',
      'camion muy sobrecargado',
      'exceso de peso superior al 20 por ciento',
      'sobrepeso grave de camion',
      'mucho exceso de masa',
    ],
    consecuencias: [
      {
        tipo: 'inmovilizacion',
        textoCorto:
          'Procede valorar la inmovilización del vehículo hasta que se subsane el exceso de masa ' +
          '(descarga o transbordo de la mercancía sobrante), conforme al régimen sancionador de la LOTT.',
        fuente: 'LOTT art. 143 (y su reglamento, RD 1211/1990)',
      },
    ],
    marcoImporte: 'transporte',
    notaRevision:
      'A VERIFICAR el TRAMO exacto por porcentaje de exceso y el importe contra el texto consolidado de la ' +
      'LOTT (exceso de masa MUY GRAVE del art. 140.23, baremo del art. 143) y el RD 1211/1990: los ' +
      'umbrales de porcentaje varían según la MMA del vehículo y según sea sobre uno o dos ejes. El seed ' +
      'ancla el tramo muy grave (2.001–4.000 €); NO duplica `inf-exceso-mma` (grave), la COMPLEMENTA con ' +
      'el tramo alto. Sin pronto pago modelado. No detrae puntos DGT. Revisar por supuesto.',
  }),
  // --- Exceso de dimensiones / transporte especial -------------------------------------------
  construirInfraccion({
    id: 'inf-exceso-dimensiones',
    articulo: ART_LOTT_DIMENSIONES,
    tituloCorto: 'Exceso de dimensiones sin autorización de transporte especial',
    gravedad: 'grave',
    importeEur: 401,
    importeReducidoEur: null,
    importeMaxEur: 600,
    puntos: null,
    textoBoletin:
      'Circular con un vehículo o conjunto que supera las dimensiones máximas autorizadas (longitud, ' +
      'anchura o altura) sin disponer de la autorización de circulación de transporte especial, o ' +
      'incumpliendo las condiciones de esa autorización (itinerario, horario, señalización o vehículos ' +
      'de acompañamiento). Los límites de dimensiones los fija el Reglamento General de Vehículos ' +
      '(RD 2822/1998). Distinto del exceso de masa/peso (ver `inf-exceso-mma`).',
    terminos: [
      'exceso de dimensiones',
      'camion demasiado largo',
      'transporte especial sin autorizacion',
      'vehiculo mas ancho de lo permitido',
      'exceso de longitud del camion',
      'sin permiso de transporte especial',
    ],
    consecuencias: [
      {
        tipo: 'inmovilizacion',
        textoCorto:
          'Procede valorar la inmovilización del vehículo hasta que se subsane el exceso o se aporte la ' +
          'autorización de transporte especial, conforme al régimen sancionador de la LOTT.',
        fuente: 'LOTT art. 143 (y su reglamento, ROTT)',
      },
    ],
    marcoImporte: 'transporte',
    notaRevision:
      'A VERIFICAR el apartado/letra exacto y la GRAVEDAD contra el texto consolidado de la LOTT ' +
      '(arts. 140-142), el ROTT, el RGV (RD 2822/1998, dimensiones máximas) y el régimen de transporte ' +
      'especial: el exceso de dimensiones sin autorización puede ser grave o muy grave según la magnitud. ' +
      'El seed ancla GRAVE (401–600 €) por prudencia; A VERIFICAR el importe y el precepto por supuesto. ' +
      'Sin pronto pago modelado. No detrae puntos DGT. Revisar antes de publicar.',
  }),
  construirInfraccion({
    id: 'inf-transporte-senalizacion-especial',
    articulo: ART_LOTT_SENALIZACION,
    tituloCorto: 'Transporte especial sin la señalización de advertencia',
    gravedad: 'grave',
    importeEur: 401,
    importeReducidoEur: null,
    importeMaxEur: 600,
    puntos: null,
    textoBoletin:
      'Realizar un transporte especial (vehículo largo, ancho, pesado o con carga que sobresale) sin la ' +
      'señalización de advertencia exigible: paneles reflectantes, señal luminosa V-2 (rotativo amarillo ' +
      'auxiliar), señal V-20 de carga que sobresale, o los vehículos de acompañamiento (piloto) cuando la ' +
      'autorización los exige, o llevándolos apagados o no visibles. La señalización advierte al resto de ' +
      'usuarios del carácter especial del transporte. Distinto del exceso de dimensiones en sí (ver ' +
      '`inf-exceso-dimensiones`): aquí el defecto es la falta de señalización.',
    terminos: [
      'transporte especial sin señalizar',
      'sin rotativo el camion especial',
      'sin señal v-20',
      'carga que sobresale sin señalizar',
      'sin vehiculo piloto',
      'transporte especial sin paneles',
    ],
    consecuencias: [
      {
        tipo: 'inmovilizacion',
        textoCorto:
          'Procede valorar la inmovilización del vehículo hasta que se dote de la señalización de ' +
          'advertencia exigible, conforme al régimen sancionador de la LOTT.',
        fuente: 'LOTT art. 143 (y RGV, RD 2822/1998, Anexo XI de señales)',
      },
    ],
    marcoImporte: 'transporte',
    notaRevision:
      'A VERIFICAR el apartado/letra exacto y la GRAVEDAD contra el texto consolidado de la LOTT ' +
      '(arts. 140-142), el ROTT, el RGV (RD 2822/1998, Anexo XI: señales V-2, V-20) y el régimen de ' +
      'transporte especial: la falta de señalización de advertencia suele ser GRAVE. El seed ancla GRAVE ' +
      '(401–600 €) por prudencia; A VERIFICAR el importe y el precepto por supuesto. Sin pronto pago ' +
      'modelado. No detrae puntos DGT. Revisar antes de publicar.',
  }),
  // --- Mercancías perecederas: incumplimiento de temperaturas (afina `inf-perecederas-atp`) ---
  construirInfraccion({
    id: 'inf-perecederas-temperatura',
    articulo: ART_LOTT_ATP,
    tituloCorto: 'Perecederas incumpliendo las temperaturas exigidas',
    gravedad: 'grave',
    importeEur: 401,
    importeReducidoEur: null,
    importeMaxEur: 600,
    puntos: null,
    textoBoletin:
      'Transportar mercancías perecederas (alimentos a temperatura controlada) incumpliendo las ' +
      'temperaturas máximas exigidas por el Acuerdo ATP durante el transporte, rompiendo la cadena de ' +
      'frío, aun disponiendo del certificado ATP en vigor del vehículo o contenedor. Se distingue de ' +
      'carecer del certificado ATP o de tener el equipo de frío averiado (ver `inf-perecederas-atp`): ' +
      'aquí el equipo puede funcionar pero no se mantienen las temperaturas reglamentarias, lo que ' +
      'compromete la seguridad alimentaria.',
    terminos: [
      'temperatura de la mercancia incorrecta',
      'perecederas fuera de temperatura',
      'cadena de frio incumplida',
      'camion frigorifico a mas temperatura',
      'alimentos por encima de la temperatura',
      'rotura de la cadena de frio',
    ],
    consecuencias: [
      {
        tipo: 'inmovilizacion',
        textoCorto:
          'Procede valorar la inmovilización del vehículo cuando el incumplimiento de las temperaturas ' +
          'comprometa la seguridad alimentaria, conforme al régimen sancionador de la LOTT.',
        fuente: 'LOTT art. 143 (y Acuerdo ATP)',
      },
    ],
    marcoImporte: 'transporte',
    notaRevision:
      'A VERIFICAR el apartado/letra exacto y la GRAVEDAD contra el texto consolidado de la LOTT ' +
      '(arts. 140-142), el ROTT y el Acuerdo ATP: el incumplimiento de las temperaturas de transporte ' +
      'puede graduarse distinto de la falta de certificado ATP o del equipo averiado (ver ' +
      '`inf-perecederas-atp`, que el seed ancla también en el tramo grave). El seed ancla GRAVE ' +
      '(401–600 €) por prudencia; A VERIFICAR el importe y el precepto por supuesto. Sin pronto pago ' +
      'modelado. No detrae puntos DGT. Revisar antes de publicar.',
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
