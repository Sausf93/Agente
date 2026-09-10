import {
  Articulo,
  Consecuencia,
  Infraccion,
  Norma,
  Sinonimo,
  evaluarDetencion,
  textoConsecuenciaDetencion,
  type EstadoRevision,
  type GravedadPenal,
  type MarcoImporte,
} from '@agente/shared';
import { hashTexto } from '../parsers/boe-xml/hash.js';
import { escenarioBaseDetencion, reglaDetencion } from './detencion.js';
import type { InfraccionSeed, SeedContenido } from './traficoSeed.js';

/**
 * SEED de DELITOS penales frecuentes (Fase 2, capa penal — sección 4.6 de la especificación).
 *
 * Objetivo: ejercitar el MOTOR DE DETENCIÓN (LECrim) de `@agente/shared` con delitos reales de
 * calle (hurto, robo con violencia, lesiones, quebrantamiento) para que la ficha muestre una
 * consecuencia de tipo `detencion` ORIENTATIVA con su fuente, y para que mobile-dev construya
 * después el árbol interactivo alimentando ESTE MISMO motor.
 *
 * Reglas aplicadas (CLAUDE.md §4.6 y nota legal):
 *  - Textos de artículo y de boletín REDACTADOS POR NOSOTROS (resúmenes neutros, no copiados).
 *  - Cada delito lleva su artículo fuente (CP) y su gravedad penal (art. 33 CP) derivada de la
 *    pena. La consecuencia de detención la GENERA el motor: una sola fuente de verdad.
 *  - Lenguaje ORIENTATIVO, nunca imperativo; pie de responsabilidad fijo (lo pone el motor).
 *  - NADA se publica "verificado": TODO queda `pendiente_revision` para el panel (revisor
 *    jurídico + segundo revisor). `notaRevision` detalla la pena y el subtipo "a verificar".
 *
 * IMPORTANTE sobre las PENAS: se declaran con el marco de pena que consta en el Código Penal
 * consolidado, pero se marcan "a verificar" en la nota de revisión: el revisor jurídico debe
 * confirmarlas contra el texto consolidado antes de publicar (posibles reformas).
 */

/** Fecha de curación de este seed (la que verá el agente como "Actualizado el…"). */
const FECHA_ACTUALIZACION = '2026-09-07';
const VALID_FROM = `${FECHA_ACTUALIZACION}T00:00:00.000Z`;

// --- Norma: Código Penal (misma identidad BOE que declara el seed de tráfico) ---------------
const ID_CP = 'BOE-A-1995-25444'; // LO 10/1995, Código Penal
const urlBoe = (id: string): string => `https://www.boe.es/buscar/act.php?id=${id}`;

/**
 * Se declara el CP también aquí para que el seed penal sea autosuficiente y testeable por sí
 * solo. Al combinar con el seed de tráfico se deduplica por `id` (ver `combinarSeeds`): el CP
 * aparece una sola vez con este título general (coincide con el del seed de tráfico).
 */
export const NORMAS_PENAL_SEED: Norma[] = [
  Norma.parse({
    id: ID_CP,
    codigo: 'CP',
    titulo: 'Código Penal (Ley Orgánica 10/1995)',
    tipo: 'ley',
    ambito: 'estatal',
    urlBoe: urlBoe(ID_CP),
    fechaConsolidacion: null,
  }),
];

// --- Artículos citados (resúmenes neutros propios) ------------------------------------------
interface ArticuloSeedInput {
  numero: string;
  titulo: string;
  texto: string;
}

function articuloCp({ numero, titulo, texto }: ArticuloSeedInput): Articulo {
  return Articulo.parse({
    id: `${ID_CP}:seed-a${numero.replace(/\s+/g, '')}`,
    normaId: ID_CP,
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

const ART_CP_234 = articuloCp({
  numero: '234',
  titulo: 'Hurto',
  texto:
    'Castiga como hurto tomar cosas muebles ajenas con ánimo de lucro y sin la voluntad de su ' +
    'dueño, sin emplear fuerza en las cosas ni violencia o intimidación en las personas. La pena ' +
    'varía según la cuantía de lo sustraído (referencia orientativa: 400 €) y las agravantes del ' +
    'art. 235. Resumen orientativo; consúltese el texto consolidado en el BOE.',
});

const ART_CP_242 = articuloCp({
  numero: '242',
  titulo: 'Robo con violencia o intimidación en las personas',
  texto:
    'Castiga como robo con violencia o intimidación el apoderamiento de cosas muebles ajenas ' +
    'empleando violencia o intimidación sobre las personas para conseguirlas o asegurar la huida. ' +
    'Se agrava cuando el robo se comete en casa habitada o con uso de armas u otros medios ' +
    'peligrosos. Resumen orientativo; consúltese el texto consolidado en el BOE.',
});

const ART_CP_147 = articuloCp({
  numero: '147',
  titulo: 'Lesiones',
  texto:
    'Castiga causar a otro una lesión que menoscabe su integridad corporal o su salud física o ' +
    'mental y que requiera objetivamente, además de una primera asistencia facultativa, ' +
    'tratamiento médico o quirúrgico. Los supuestos de menor entidad (sin tratamiento) y el ' +
    'maltrato de obra sin causar lesión se castigan con pena leve. Resumen orientativo.',
});

const ART_CP_148 = articuloCp({
  numero: '148',
  titulo: 'Lesiones agravadas',
  texto:
    'Las lesiones del art. 147.1 podrán castigarse con prisión de dos a cinco años, atendiendo al ' +
    'resultado causado o al riesgo producido, cuando concurra alguna agravación: haberse utilizado en la ' +
    'agresión armas, instrumentos, objetos, medios, métodos o formas concretamente peligrosos para la ' +
    'vida o la salud, física o psíquica, del lesionado; ensañamiento o alevosía; ser la víctima menor de ' +
    'catorce años o persona con discapacidad necesitada de especial protección; ser o haber sido la ' +
    'víctima esposa o mujer ligada al autor por análoga relación de afectividad, aun sin convivencia; o ' +
    'ser una persona especialmente vulnerable que conviva con el autor. Resumen orientativo.',
});

const ART_CP_172 = articuloCp({
  numero: '172',
  titulo: 'Coacciones',
  texto:
    'Castiga al que, sin estar legítimamente autorizado, impidiere a otro con violencia hacer lo que la ' +
    'ley no prohíbe, o le compeliere a efectuar lo que no quiere, sea justo o injusto. La pena base es ' +
    'prisión de 6 meses a 3 años o multa de 12 a 24 meses. Se agrava si la coacción se dirige a impedir ' +
    'el ejercicio de un derecho fundamental o el legítimo disfrute de la vivienda; la coacción de ' +
    'carácter leve es delito leve (multa). Resumen orientativo; consúltese el texto consolidado en el BOE.',
});

const ART_CP_298 = articuloCp({
  numero: '298',
  titulo: 'Receptación',
  texto:
    'Castiga al que, con ánimo de lucro y con conocimiento de la comisión de un delito contra el ' +
    'patrimonio o el orden socioeconómico en el que no ha intervenido ni como autor ni como cómplice, ' +
    'ayuda a los responsables a aprovecharse de los efectos del delito, o recibe, adquiere u oculta tales ' +
    'efectos. La pena base es prisión de 6 meses a 2 años; se agrava (mitad superior) si se reciben, ' +
    'adquieren u ocultan los efectos para traficar con ellos, y con multa si el tráfico se hace con ' +
    'establecimiento o local comercial (art. 298.2). La pena nunca puede exceder de la señalada al ' +
    'delito encubierto (art. 298.3). Resumen orientativo; consúltese el texto consolidado en el BOE.',
});

const ART_CP_340_BIS = articuloCp({
  numero: '340 bis',
  titulo: 'Maltrato animal (delitos contra los animales)',
  texto:
    'Título XVI bis del CP (introducido por la LO 3/2023, que SUPRIMIÓ el antiguo art. 337 y trasladó aquí ' +
    'el maltrato animal). Castiga a quien, por cualquier medio o procedimiento —incluidos los actos de ' +
    'carácter sexual—, maltrate a un animal doméstico, amansado, domesticado o que viva temporal o ' +
    'permanentemente bajo control humano, causándole lesión que requiera tratamiento veterinario o ' +
    'menoscabo grave de su salud: prisión de 3 a 18 meses o multa de 6 a 12 meses e inhabilitación especial ' +
    'de 1 a 3 años. Si el maltrato se causa a cualquier otro animal vertebrado, la pena es menor (prisión ' +
    'de 3 a 12 meses o multa de 3 a 6 meses). La pena sube si causa la MUERTE del animal y se agrava (mitad ' +
    'superior) por ensañamiento, armas, ante un menor o persona vulnerable, difusión, etc. El abandono es ' +
    'el art. 340 ter. Resumen orientativo; consúltese el texto consolidado en el BOE.',
});

const ART_CP_163 = articuloCp({
  numero: '163',
  titulo: 'Detención ilegal',
  texto:
    'Castiga al particular que encerrare o detuviere a otro privándole de su libertad, con prisión de 4 a ' +
    '6 años. La pena baja si el culpable da libertad al encerrado o detenido dentro de los tres primeros ' +
    'días (163.2), y sube si la privación dura más de quince días (163.3); se impone en su mitad superior ' +
    '(art. 165) si se simula ser autoridad, la víctima es menor o persona con discapacidad necesitada de ' +
    'especial protección, o es funcionario público en el ejercicio de sus funciones. El particular que, ' +
    'fuera de los casos permitidos, detiene a otro para presentarlo a la autoridad ' +
    'puede tener una pena atenuada si alega haber obrado por ese motivo (163.4). Resumen orientativo; ' +
    'consúltese el texto consolidado en el BOE.',
});

const ART_CP_468 = articuloCp({
  numero: '468',
  titulo: 'Quebrantamiento de condena, medida cautelar o de seguridad',
  texto:
    'Castiga quebrantar una condena, medida de seguridad, prisión, medida cautelar, conducción o ' +
    'custodia. Cuando lo quebrantado es una pena o medida de alejamiento u otra del art. 48 ' +
    'impuesta para proteger a la víctima de violencia de género o doméstica (art. 173.2), se ' +
    'impone en todo caso pena de prisión. Resumen orientativo; consúltese el texto consolidado.',
});

const ART_CP_550 = articuloCp({
  numero: '550',
  titulo: 'Atentado contra la autoridad, sus agentes y los funcionarios públicos',
  texto:
    'Castiga como atentado agredir a la autoridad, a sus agentes o a los funcionarios públicos, o ' +
    'emplear intimidación grave o violencia contra ellos cuando se hallen en el ejercicio de sus ' +
    'funciones o con ocasión de ellas. Se agrava, entre otros supuestos, cuando se emplean armas u ' +
    'objetos peligrosos. La resistencia o desobediencia grave sin llegar al atentado se castiga por ' +
    'el art. 556. Resumen orientativo; consúltese el texto consolidado en el BOE.',
});

const ART_CP_368 = articuloCp({
  numero: '368',
  titulo: 'Tráfico de drogas',
  texto:
    'Castiga a quienes ejecuten actos de cultivo, elaboración o tráfico, o de otro modo promuevan, ' +
    'favorezcan o faciliten el consumo ilegal de drogas tóxicas, estupefacientes o sustancias ' +
    'psicotrópicas, o las posean con esos fines. La pena es mayor si la sustancia causa grave daño ' +
    'a la salud (p. ej. cocaína, heroína) que si no lo causa (p. ej. hachís). El consumo o la ' +
    'tenencia para el consumo propio NO es delito (puede ser infracción de la LO 4/2015). La ' +
    'calificación consumo/tráfico corresponde a la autoridad judicial. Resumen orientativo.',
});

const ART_CP_169 = articuloCp({
  numero: '169',
  titulo: 'Amenazas',
  texto:
    'Castiga a quien amenaza a otro con causarle a él, a su familia o a personas con las que esté ' +
    'íntimamente vinculado un mal que constituya delito (homicidio, lesiones, etc.). La pena es ' +
    'mayor cuando la amenaza es condicional (se exige una cantidad o se impone una condición) y ' +
    'según se consiga o no el propósito. Las amenazas de un mal que no es delito y las leves se ' +
    'regulan en los arts. 171 y 173. Resumen orientativo; consúltese el texto consolidado.',
});

const ART_CP_263 = articuloCp({
  numero: '263',
  titulo: 'Daños',
  texto:
    'Castiga a quien causa daños en propiedad ajena no comprendidos en otros títulos del Código, ' +
    'cuando la cuantía del daño excede de 400 euros. Los daños de 400 euros o menos se castigan ' +
    'como delito leve. Existen tipos agravados (daños a bienes de servicio público, patrimonio ' +
    'histórico, con incendio, etc.). Resumen orientativo; consúltese el texto consolidado en el BOE.',
});

const ART_CP_241 = articuloCp({
  numero: '241',
  titulo: 'Robo con fuerza en casa habitada, edificio público o local abierto al público',
  texto:
    'Agrava el robo con fuerza en las cosas (arts. 237 a 240) cuando se comete en casa habitada, en ' +
    'alguna de sus dependencias, o en edificio o local abiertos al público o en sus dependencias. Se ' +
    'considera casa habitada todo albergue que constituya morada de una o más personas, aunque ' +
    'accidentalmente se encuentren ausentes cuando el robo tiene lugar. Resumen orientativo; ' +
    'consúltese el texto consolidado en el BOE.',
});

const ART_CP_153 = articuloCp({
  numero: '153',
  titulo: 'Maltrato o lesión de menor entidad en el ámbito de la violencia de género o doméstica',
  texto:
    'Castiga causar a otra persona un menoscabo psíquico o una lesión de menor gravedad de las ' +
    'previstas en el art. 147.2, o golpear o maltratar de obra sin causar lesión, cuando la ofendida ' +
    'es o ha sido esposa o mujer ligada al autor por análoga relación de afectividad aun sin ' +
    'convivencia, o una persona especialmente vulnerable que conviva con el autor (art. 153.1). El ' +
    'art. 153.2 recoge el resto de personas del art. 173.2 (otros miembros del ámbito familiar). Se ' +
    'agrava, entre otros supuestos, si el hecho se comete en presencia de menores o en el domicilio ' +
    'común. La violencia física o psíquica HABITUAL se castiga aparte por el art. 173.2. Resumen ' +
    'orientativo; consúltese el texto consolidado en el BOE.',
});

const ART_CP_173 = articuloCp({
  numero: '173.2',
  titulo: 'Violencia física o psíquica habitual en el ámbito familiar',
  texto:
    'Castiga a quien habitualmente ejerce violencia física o psíquica sobre quien sea o haya sido su ' +
    'cónyuge o persona ligada por análoga relación de afectividad, o sobre los demás miembros del ' +
    'ámbito familiar o personas del art. 173.2 (descendientes, ascendientes, personas vulnerables que ' +
    'convivan, etc.). Para apreciar la HABITUALIDAD se atiende al número de actos de violencia y a su ' +
    'proximidad temporal, con independencia de que hayan sido o no enjuiciados antes. Es compatible ' +
    'con las penas por los concretos actos de violencia (arts. 153, 147, 148…). Resumen orientativo; ' +
    'consúltese el texto consolidado en el BOE.',
});

const ART_CP_557 = articuloCp({
  numero: '557',
  titulo: 'Desórdenes públicos',
  texto:
    'Castiga (art. 557.1, redacción de la LO 14/2022) a quienes, actuando en grupo y con el fin de ' +
    'atentar contra la paz pública, ejecuten actos de violencia o intimidación sobre las personas o ' +
    'sobre las cosas, o amenacen con llevarlos a cabo: prisión de seis meses a tres años. La ' +
    'modalidad AGRAVADA del art. 557.2 se aprecia cuando los hechos se cometen en el seno de una ' +
    'multitud o grupo numeroso idóneo para afectar gravemente el orden público, o cuando el ' +
    'culpable se prevalga de esa situación: prisión de tres a cinco años. El subtipo AGRAVADO del ' +
    'art. 557.3 (llevar armas u otros instrumentos peligrosos, o cometer actos de pillaje) eleva la ' +
    'pena (redacción de la LO 14/2022). El art. 557 bis, tras esa reforma, castiga aparte la ' +
    'invasión u ocupación en grupo del domicilio de una persona jurídica, despacho, oficina, ' +
    'establecimiento o local. La alteración de menor entidad puede ser infracción ' +
    'administrativa (art. 36.1/36.3 LO 4/2015). Resumen orientativo; consúltese el texto ' +
    'consolidado en el BOE.',
});

const ART_CP_556 = articuloCp({
  numero: '556',
  titulo: 'Resistencia o desobediencia grave a la autoridad o sus agentes',
  texto:
    'Castiga a quienes, sin estar comprendidos en el atentado del art. 550, resistan o desobedezcan ' +
    'gravemente a la autoridad o a sus agentes en el ejercicio de sus funciones. La resistencia del ' +
    'art. 556 es la NO violenta o de escasa entidad (p. ej. forcejeo pasivo, negarse activamente a ' +
    'cumplir una orden legítima); cuando media agresión, violencia o intimidación grave, el hecho es ' +
    'atentado (art. 550). La desobediencia o resistencia que no llega a "grave" puede ser infracción ' +
    'administrativa (art. 36.6 LO 4/2015). Resumen orientativo; consúltese el texto consolidado.',
});

const ART_CP_249 = articuloCp({
  numero: '249',
  titulo: 'Estafa',
  texto:
    'Castiga como estafa a quien, con ánimo de lucro, utiliza engaño bastante para producir error en ' +
    'otra persona, induciéndola a realizar un acto de disposición en perjuicio propio o ajeno (art. ' +
    '248). El art. 249 fija la pena atendiendo a la cuantía de lo defraudado, el perjuicio, las ' +
    'relaciones entre las partes y demás circunstancias. Cuando la cuantía no excede de 400 euros, el ' +
    'hecho es delito leve. La calificación final corresponde a la autoridad judicial. Resumen ' +
    'orientativo; consúltese el texto consolidado en el BOE.',
});

const ART_CP_392 = articuloCp({
  numero: '392',
  titulo: 'Falsedad en documento público, oficial o mercantil cometida por particular',
  texto:
    'Castiga al particular que comete en documento público, oficial o mercantil alguna de las ' +
    'falsedades de los tres primeros números del art. 390.1 (alterar un documento en un elemento ' +
    'esencial, simular un documento que induzca a error sobre su autenticidad o suponer en un acto ' +
    'la intervención de personas que no la han tenido): prisión de seis meses a tres años y multa ' +
    'de seis a doce meses (art. 392.1). El art. 392.2 castiga al que, sin haber intervenido en la ' +
    'falsificación, trafica de cualquier modo con un documento de identidad falso (misma pena) y al ' +
    'que hace uso, a sabiendas, de un documento de identidad falso (prisión de seis meses a un año y ' +
    'multa de tres a seis meses), aunque el documento sea de otro Estado. El uso de documento falso ' +
    'por quien no lo falsificó se castiga por el art. 393 (pena inferior en grado); el art. 400 bis ' +
    'equipara al uso el empleo de un documento auténtico por quien no está legitimado para ello. ' +
    'Resumen orientativo; consúltese el texto consolidado en el BOE.',
});

const ART_CP_244 = articuloCp({
  numero: '244',
  titulo: 'Robo y hurto de uso de vehículos',
  texto:
    'Castiga a quien sustrae o utiliza sin la debida autorización un vehículo a motor o ciclomotor ' +
    'ajenos, sin ánimo de apropiárselo (hurto de uso). Cuando lo restituye, directa o ' +
    'indirectamente, en un plazo no superior a cuarenta y ocho horas, la pena es de trabajos en ' +
    'beneficio de la comunidad de treinta y uno a noventa días o multa de dos a doce meses ' +
    '(art. 244.1). Si el hecho se ejecuta empleando fuerza en las cosas, la pena se impone en su ' +
    'mitad superior. De no producirse la restitución en ese plazo, el hecho se castiga como hurto o ' +
    'robo, según corresponda. Si media violencia o intimidación en las personas, se imponen en todo ' +
    'caso las penas del art. 242 (robo con violencia). Resumen orientativo; consúltese el texto ' +
    'consolidado en el BOE.',
});

const ART_CP_245 = articuloCp({
  numero: '245',
  titulo: 'Usurpación de bienes inmuebles',
  texto:
    'Castiga (art. 245.1) a quien, con violencia o intimidación en las personas, ocupa una cosa ' +
    'inmueble o usurpa un derecho real inmobiliario ajeno: prisión de uno a dos años (además de las ' +
    'penas por las violencias ejercidas), según la utilidad obtenida y el daño causado. El art. ' +
    '245.2 castiga con multa de tres a seis meses a quien ocupa, sin autorización debida, un ' +
    'inmueble, vivienda o edificio ajenos que NO constituyan morada, o se mantiene en ellos contra ' +
    'la voluntad de su titular (ocupación pacífica). Se distingue del allanamiento de morada ' +
    '(art. 202, cuando el inmueble es morada) y de la infracción administrativa de ocupación del ' +
    'art. 37.7 de la LO 4/2015 (ocupación que no es constitutiva de delito). Resumen orientativo; ' +
    'consúltese el texto consolidado en el BOE.',
});

const ART_CP_202 = articuloCp({
  numero: '202',
  titulo: 'Allanamiento de morada',
  texto:
    'Castiga (art. 202.1) al particular que, sin habitar en ella, entra en morada ajena o se ' +
    'mantiene en la misma contra la voluntad de su morador: prisión de seis meses a dos años. Si el ' +
    'hecho se ejecuta con violencia o intimidación, la pena es de prisión de uno a cuatro años y ' +
    'multa de seis a doce meses (art. 202.2). La clave es que el lugar sea MORADA (espacio de vida ' +
    'privada del morador); la ocupación de un inmueble ajeno que no es morada se castiga por la ' +
    'usurpación (art. 245). Resumen orientativo; consúltese el texto consolidado en el BOE.',
});

const ART_CP_195 = articuloCp({
  numero: '195',
  titulo: 'Omisión del deber de socorro',
  texto:
    'Castiga (art. 195.1) a quien no socorre a una persona que se halla desamparada y en peligro ' +
    'manifiesto y grave, cuando pudiera hacerlo sin riesgo propio ni de terceros: multa de tres a ' +
    'doce meses. La misma pena se impone (art. 195.2) a quien, impedido de prestar socorro, no ' +
    'demanda con urgencia auxilio ajeno. Cuando la víctima lo es por un accidente ocasionado por el ' +
    'que omitió el auxilio (art. 195.3), la pena es de prisión de seis meses a dieciocho meses si el ' +
    'accidente fue fortuito, y de prisión de seis meses a cuatro años si se debió a imprudencia. ' +
    'Este supuesto es el típico de la fuga tras un atropello. La calificación final corresponde a la ' +
    'autoridad judicial. Resumen orientativo; consúltese el texto consolidado en el BOE.',
});

const ART_CP_564 = articuloCp({
  numero: '564',
  titulo: 'Tenencia ilícita de armas de fuego reglamentadas',
  texto:
    'Castiga la tenencia de armas de fuego reglamentadas careciendo de las licencias o permisos ' +
    'necesarios (art. 564.1): prisión de uno a dos años si se trata de armas cortas, y prisión de ' +
    'seis meses a un año si se trata de armas largas. Las penas se imponen en su mitad superior ' +
    '(art. 564.2) cuando el arma carece de marcas de fábrica o de número, o los tiene alterados o ' +
    'borrados; ha sido introducida ilegalmente en territorio español; o ha sido transformada ' +
    'modificando sus características originales. La tenencia de armas PROHIBIDAS o de las que sean ' +
    'resultado de la modificación sustancial de armas reglamentadas se castiga por el art. 563 ' +
    '(prisión de uno a tres años). Se distingue de la infracción administrativa del art. 36.10 de la ' +
    'LO 4/2015 (portar, exhibir o usar armas prohibidas, o armas de otra clase fuera del domicilio, ' +
    'como navajas, porras o sprays de defensa). Resumen orientativo; consúltese el texto consolidado.',
});

// --- Artículos de la OLA DE DELITOS VIOLENTOS y CONTRA LA LIBERTAD SEXUAL (2026-09-10) ---------
const ART_CP_138 = articuloCp({
  numero: '138',
  titulo: 'Homicidio',
  texto:
    'Castiga a quien matare a otro (dolosamente) con la pena de prisión de diez a quince años ' +
    '(art. 138.1). La pena se impone en su mitad superior o superior en grado cuando concurre alguna ' +
    'circunstancia del art. 140.1 o el hecho es además constitutivo de atentado (art. 138.2). La muerte ' +
    'causada por IMPRUDENCIA no es homicidio del 138, sino el delito imprudente del art. 142. Resumen ' +
    'orientativo; consúltese el texto consolidado del CP.',
});

const ART_CP_139 = articuloCp({
  numero: '139',
  titulo: 'Asesinato',
  texto:
    'Es asesinato matar a otro concurriendo alevosía, precio/recompensa/promesa, ensañamiento (aumentar ' +
    'deliberada e inhumanamente el dolor de la víctima) o para facilitar la comisión de otro delito o ' +
    'evitar que se descubra (art. 139.1): prisión de quince a veinticinco años, en su mitad superior si ' +
    'concurre más de una circunstancia (139.2). El art. 140 impone la PRISIÓN PERMANENTE REVISABLE en los ' +
    'supuestos agravados (víctima menor de 16 años o especialmente vulnerable, hecho subsiguiente a un ' +
    'delito contra la libertad sexual, pertenencia a organización criminal, o más de dos víctimas). ' +
    'Resumen orientativo; consúltese el texto consolidado del CP.',
});

const ART_CP_178 = articuloCp({
  numero: '178',
  titulo: 'Agresión sexual (libertad sexual)',
  texto:
    'Tras la LO 10/2022 y la LO 4/2023, es agresión sexual todo acto que atente contra la libertad sexual ' +
    'de otra persona sin su consentimiento (art. 178.1): solo hay consentimiento cuando se manifiesta ' +
    'libremente por actos que expresen de forma clara la voluntad de la persona. Se consideran en todo ' +
    'caso agresión los actos con violencia, intimidación, abuso de superioridad o vulnerabilidad, o sobre ' +
    'personas privadas de sentido o de voluntad anulada, incluida la sumisión química (178.2). La pena ' +
    'base es de uno a cuatro años; con violencia o intimidación o voluntad anulada, de uno a cinco años ' +
    '(178.3). El acceso carnal (vaginal, anal o bucal) o la introducción de miembros u objetos es ' +
    'VIOLACIÓN (art. 179): prisión de cuatro a doce años (179.1) o de seis a doce años cuando media ' +
    'violencia, intimidación o la voluntad de la víctima está anulada (179.2). El art. 180 recoge los ' +
    'subtipos agravados. Resumen orientativo; consúltese el texto consolidado del CP.',
});

const ART_CP_181 = articuloCp({
  numero: '181',
  titulo: 'Agresión sexual a menor de dieciséis años',
  texto:
    'Realizar actos de carácter sexual con un menor de dieciséis años se castiga con prisión de dos a seis ' +
    'años (art. 181.1); concurriendo alguna modalidad del art. 178.2 o prevalimiento por convivencia o ' +
    'parentesco, de cinco a diez años (181.2); con acceso ' +
    'carnal o introducción de miembros u objetos, de ocho a doce años (181.4) o de doce a quince en los ' +
    'supuestos del 181.2. Existen agravantes (181.5/6) y la cláusula de proximidad por edad y grado de ' +
    'desarrollo del art. 183 bis puede excluir la responsabilidad entre iguales. El consentimiento del ' +
    'menor de dieciséis años no exime, salvo esa cláusula. Resumen orientativo; consúltese el CP.',
});

const ART_CP_173_1 = articuloCp({
  numero: '173.1',
  titulo: 'Trato degradante (integridad moral)',
  texto:
    'Castiga a quien infligiere a otra persona un trato degradante, menoscabando gravemente su integridad ' +
    'moral, con prisión de seis meses a dos años (art. 173.1). El mismo artículo tipifica el ACOSO LABORAL ' +
    '(actos hostiles o humillantes reiterados prevaliéndose de superioridad, en el ámbito laboral o ' +
    'funcionarial) y el ACOSO INMOBILIARIO (actos hostiles para impedir el disfrute legítimo de la ' +
    'vivienda). Se distingue de la tortura del art. 174 (que exige autoridad o funcionario). Resumen ' +
    'orientativo; consúltese el texto consolidado del CP.',
});

const ART_CP_174 = articuloCp({
  numero: '174',
  titulo: 'Torturas',
  texto:
    'Comete tortura la autoridad o funcionario público que, abusando de su cargo y con el fin de obtener ' +
    'una confesión o información de cualquier persona, o de castigarla por un hecho que haya cometido o se sospeche que ha cometido, o por una razón basada en cualquier tipo de discriminación, somete a una ' +
    'persona a condiciones o procedimientos que le supongan sufrimientos físicos o mentales, la supresión ' +
    'o disminución de sus facultades, o que atenten contra su integridad moral (art. 174). Pena: prisión ' +
    'de dos a seis años si el atentado es grave y de uno a tres años si no lo es; en ambos casos, ' +
    'inhabilitación absoluta de ocho a doce años. Alcanza también a funcionarios de instituciones ' +
    'penitenciarias o de centros de menores. Resumen orientativo; consúltese el CP.',
});

const ART_CP_172_TER = articuloCp({
  numero: '172 ter',
  titulo: 'Acoso (stalking)',
  texto:
    'Castiga a quien acose a una persona de forma insistente y reiterada, sin estar legítimamente ' +
    'autorizado, alterando gravemente el desarrollo de su vida cotidiana, mediante vigilarla, perseguirla ' +
    'o buscar su cercanía; establecer o intentar establecer contacto por cualquier medio o a través de ' +
    'terceros; usar indebidamente sus datos personales; o atentar contra su libertad o patrimonio o el de ' +
    'personas próximas (art. 172 ter): prisión de tres meses a dos años o multa de seis a veinticuatro ' +
    'meses. Se agrava cuando la víctima es o ha sido pareja o pertenece al ámbito del art. 173.2. Resumen ' +
    'orientativo; consúltese el texto consolidado del CP.',
});

const ART_CP_197 = articuloCp({
  numero: '197',
  titulo: 'Descubrimiento y revelación de secretos; difusión de imágenes íntimas',
  texto:
    'El art. 197.1 castiga a quien, para descubrir los secretos o vulnerar la intimidad de otro y sin su ' +
    'consentimiento, se apodera de sus documentos o efectos, intercepta sus telecomunicaciones o usa ' +
    'artificios de escucha o grabación: prisión de uno a cuatro años y multa de doce a veinticuatro meses. ' +
    'El art. 197.7 castiga la difusión, sin autorización, de imágenes o grabaciones íntimas obtenidas con ' +
    'anuencia de la víctima en un ámbito privado, cuando menoscabe gravemente su intimidad (difusión no ' +
    'consentida de imágenes íntimas): prisión de tres meses a un año o multa de seis a doce meses, ' +
    'agravada si la víctima es pareja/expareja, menor o con discapacidad, o media ánimo de lucro. Resumen ' +
    'orientativo; consúltese el texto consolidado del CP.',
});

// --- Artículos de la OLA DE FRONTERA PENAL (odio, grooming, falso policía…) 2026-09-10 ----------
const ART_CP_381 = articuloCp({
  numero: '381',
  titulo: 'Conducción con manifiesto desprecio por la vida',
  texto:
    'Castiga a quien, con manifiesto desprecio por la vida de los demás, realiza la conducción temeraria ' +
    'del art. 380 (temeridad manifiesta poniendo en concreto peligro la vida o la integridad de las ' +
    'personas): prisión de dos a cinco años, multa de doce a veinticuatro meses y privación del derecho a ' +
    'conducir de seis a diez años (art. 381.1). Si con esa conducta no se pone en concreto peligro la vida ' +
    'o la integridad, la pena es de prisión de uno a dos años (art. 381.2). Resumen orientativo; consúltese el CP.',
});

const ART_CP_510 = articuloCp({
  numero: '510',
  titulo: 'Delitos de odio y discriminación',
  texto:
    'Castiga fomentar, promover o incitar pública y directa o indirectamente al odio, la hostilidad, la ' +
    'discriminación o la violencia contra un grupo o una persona por motivos racistas, antisemitas, de ' +
    'ideología, religión, etnia, origen, sexo, orientación o identidad sexual, edad, enfermedad o ' +
    'discapacidad, entre otros; así como producir o difundir material con ese contenido y negar o enaltecer ' +
    'delitos de genocidio (art. 510.1: prisión de uno a cuatro años y multa). El art. 510.2 castiga la ' +
    'humillación o el enaltecimiento (prisión de seis meses a dos años). Se agrava por medios de ' +
    'comunicación o internet y cuando sea idóneo para alterar la paz pública. El art. 510 bis prevé la ' +
    'responsabilidad de la persona jurídica. Resumen orientativo; consúltese el CP.',
});

const ART_CP_183 = articuloCp({
  numero: '183',
  titulo: 'Ciberacoso sexual a menor (grooming)',
  texto:
    'Castiga a quien, a través de internet, teléfono o cualquier tecnología, contacta con un menor de ' +
    'dieciséis años y le propone concertar un encuentro para cometer un delito sexual, acompañando la ' +
    'propuesta de un acto material de acercamiento (art. 183.1: prisión de uno a tres años o multa de doce ' +
    'a veinticuatro meses, en su mitad superior si media coacción, intimidación o engaño); o le embauca ' +
    'para que le facilite material pornográfico o le muestre imágenes pornográficas (art. 183.2). Es un ' +
    'delito de peligro. NO confundir con el art. 183 bis (cláusula de proximidad de edad). Resumen ' +
    'orientativo; consúltese el CP.',
});

const ART_CP_189 = articuloCp({
  numero: '189',
  titulo: 'Pornografía infantil',
  texto:
    'Castiga captar o utilizar a menores o personas con discapacidad con fines pornográficos, y producir, ' +
    'vender, distribuir, difundir, exhibir o facilitar material pornográfico elaborado con ellos, así como ' +
    'su financiación (art. 189.1: prisión de uno a cinco años). Los supuestos agravados (art. 189.2: menor ' +
    'de dieciséis años, carácter degradante o violento, organización…) se castigan con prisión de cinco a ' +
    'nueve años. La mera posesión para uso propio o el acceso a sabiendas se castigan aparte (art. 189.5). ' +
    'Resumen orientativo; consúltese el CP.',
});

const ART_CP_185 = articuloCp({
  numero: '185',
  titulo: 'Exhibicionismo y provocación sexual',
  texto:
    'Castiga ejecutar o hacer ejecutar actos de exhibición obscena ante menores de edad o personas con ' +
    'discapacidad necesitadas de especial protección (art. 185), y vender, difundir o exhibir material ' +
    'pornográfico entre esas personas (art. 186): prisión de seis meses a un año o multa de doce a ' +
    'veinticuatro meses. No hay contacto físico. Resumen orientativo; consúltese el CP.',
});

const ART_CP_457 = articuloCp({
  numero: '457',
  titulo: 'Simulación de delito / denuncia falsa',
  texto:
    'Castiga a quien, ante funcionario judicial o administrativo, simula ser responsable o víctima de una ' +
    'infracción penal o denuncia una inexistente, provocando actuaciones procesales: multa de seis a doce ' +
    'meses (art. 457). Distinto de la acusación y denuncia falsas del art. 456 (cuando se imputa a persona ' +
    'concreta). Resumen orientativo; consúltese el CP.',
});

const ART_CP_225_BIS = articuloCp({
  numero: '225 bis',
  titulo: 'Sustracción de menores por un progenitor',
  texto:
    'Castiga al progenitor que sin causa justificada sustrae a su hijo menor: traslada al menor de su ' +
    'residencia habitual sin consentimiento del otro progenitor o de quien tenga su guarda, o lo retiene ' +
    'incumpliendo gravemente una resolución judicial o administrativa (art. 225 bis): prisión de dos a ' +
    'cuatro años e inhabilitación especial para la patria potestad de cuatro a diez años, en su mitad ' +
    'superior si el menor sale de España o se exige una condición para su restitución. Se atenúa si ' +
    'comunica el paradero en 24 horas o restituye en 15 días. Resumen orientativo; consúltese el CP.',
});

const ART_CP_203 = articuloCp({
  numero: '203',
  titulo: 'Allanamiento de local, oficina o establecimiento',
  texto:
    'Castiga entrar contra la voluntad de su titular en el domicilio de una persona jurídica, despacho, ' +
    'oficina o establecimiento o local abierto al público fuera de las horas de apertura (art. 203.1: ' +
    'prisión de seis meses a un año y multa de seis a diez meses); mantenerse en ellos fuera del horario ' +
    'contra la voluntad del titular (art. 203.2: multa de uno a tres meses); y hacerlo con violencia o ' +
    'intimidación (art. 203.3: prisión de seis meses a tres años). Se distingue del allanamiento de morada ' +
    '(art. 202) y de la usurpación (art. 245). Resumen orientativo; consúltese el CP.',
});

const ART_CP_402 = articuloCp({
  numero: '402',
  titulo: 'Usurpación de funciones públicas e intrusismo',
  texto:
    'La usurpación de funciones (art. 402) castiga ejercer ilegítimamente actos propios de una autoridad o ' +
    'funcionario atribuyéndose carácter oficial (p. ej. hacerse pasar por policía): prisión de uno a tres ' +
    'años. El uso público e indebido de uniforme, traje o insignia oficial es el art. 402 bis (multa). El ' +
    'intrusismo (art. 403) castiga ejercer actos propios de una profesión sin el título exigido: multa de ' +
    'doce a veinticuatro meses (sin título académico) o de seis a doce meses (sin título oficial ' +
    'habilitante); prisión de seis meses a dos años si el autor se anuncia como profesional o abre local ' +
    'al público. Resumen orientativo; consúltese el CP.',
});

export const ARTICULOS_PENAL_SEED: Articulo[] = [
  ART_CP_381,
  ART_CP_510,
  ART_CP_183,
  ART_CP_189,
  ART_CP_185,
  ART_CP_457,
  ART_CP_225_BIS,
  ART_CP_203,
  ART_CP_402,
  ART_CP_138,
  ART_CP_139,
  ART_CP_178,
  ART_CP_181,
  ART_CP_173_1,
  ART_CP_174,
  ART_CP_172_TER,
  ART_CP_197,
  ART_CP_234,
  ART_CP_242,
  ART_CP_147,
  ART_CP_148,
  ART_CP_163,
  ART_CP_172,
  ART_CP_298,
  ART_CP_340_BIS,
  ART_CP_468,
  ART_CP_550,
  ART_CP_368,
  ART_CP_169,
  ART_CP_263,
  ART_CP_241,
  ART_CP_153,
  ART_CP_173,
  ART_CP_557,
  ART_CP_556,
  ART_CP_249,
  ART_CP_392,
  ART_CP_244,
  ART_CP_245,
  ART_CP_202,
  ART_CP_195,
  ART_CP_564,
];

// --- Constructor de un delito con su consecuencia de detención generada por el motor --------

/** Competencia por defecto para delitos: los tres cuerpos generalistas pueden intervenir. */
const COMPETENCIA_PENAL = {
  cuerpos: ['guardia_civil', 'policia_nacional', 'policia_local', 'policia_autonomica'] as const,
  via: 'ambas' as const,
};

interface DelitoSeedInput {
  id: string;
  articulo: Articulo;
  tituloCorto: string;
  /** Gravedad de la pena (art. 33 CP) que alimenta el motor de detención y el chip del marco penal. */
  gravedadCp: GravedadPenal;
  /**
   * Pena legible del delito (art. del CP) para el bloque "Marco penal" de la ficha, p. ej.
   * "Prisión de 6 a 18 meses". Describe el ESCENARIO MODELADO (el más frecuente); la nota de
   * revisión detalla las fronteras y los subtipos que la cambiarían. Orientativa, a verificar.
   */
  penaTexto: string;
  textoBoletin: string;
  terminos: string[];
  notaRevision: string;
  /**
   * Consecuencias ADICIONALES a la detención (que la genera el motor). P. ej. la `proteccion` de la
   * víctima en la violencia de género: orden de protección + valoración de riesgo, con su fuente.
   * Orientativas; las acuerda la autoridad judicial.
   */
  consecuenciasExtra?: Array<{
    tipo: Consecuencia['tipo'];
    textoCorto: string;
    fuente: string;
  }>;
}

function construirDelito(input: DelitoSeedInput): InfraccionSeed {
  const infraccion = Infraccion.parse({
    id: input.id,
    articuloId: input.articulo.id,
    codigoDgt: null,
    tituloCorto: input.tituloCorto,
    gravedad: 'delito',
    tipo: 'penal',
    importeEur: null,
    importeReducidoEur: null,
    puntos: null,
    // Marco penal (sustituye a importe/pronto pago/puntos en la ficha de un delito): pena legible
    // + gravedad del art. 33 CP. `gravedadPenal` reutiliza la misma `gravedadCp` que alimenta el
    // motor de detención → una sola fuente de verdad (el chip del marco y el árbol no se contradicen).
    penaTexto: input.penaTexto,
    gravedadPenal: input.gravedadCp,
    textoBoletin: input.textoBoletin,
    variantesBoletin: [],
    competencia: COMPETENCIA_PENAL,
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

  // La consecuencia de detención SALE DEL MOTOR (una sola fuente de verdad para ficha y árbol). La
  // `regla` la construye el helper compartido `reglaDetencion` (mismo que usa el seed de tráfico).
  const resultado = evaluarDetencion(escenarioBaseDetencion(input.gravedadCp));
  const consecuencia = Consecuencia.parse({
    id: `${input.id}:cons-detencion`,
    tipo: 'detencion',
    // `regla` guarda el escenario base y la orientación: el árbol interactivo lo rehidrata.
    regla: reglaDetencion(input.gravedadCp),
    textoCorto: textoConsecuenciaDetencion(resultado),
    fuente: [`CP art. ${input.articulo.numero}`, ...resultado.fuentes].join('; '),
    infraccionId: input.id,
    articuloId: null,
  });

  // Consecuencias adicionales (p. ej. la protección de la víctima en violencia de género).
  const consecuenciasExtra: Consecuencia[] = (input.consecuenciasExtra ?? []).map((c, i) =>
    Consecuencia.parse({
      id: `${input.id}:cons-${c.tipo}-${i}`,
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
    consecuencias: [consecuencia, ...consecuenciasExtra],
    marcoImporte: 'penal' satisfies MarcoImporte,
    revision: 'pendiente_revision' satisfies EstadoRevision,
    notaRevision: input.notaRevision,
  };
}

// --- Delitos sembrados ----------------------------------------------------------------------
export const INFRACCIONES_PENAL_SEED: InfraccionSeed[] = [
  construirDelito({
    id: 'del-hurto',
    articulo: ART_CP_234,
    tituloCorto: 'Hurto',
    // Caso más frecuente en la calle: cuantía ≤ 400 € sin agravante → multa 1-3 meses → LEVE.
    gravedadCp: 'leve',
    // Pena del caso modelado (delito leve, art. 234.2 CP). A partir de 400 € o con agravante del
    // art. 235 pasa a menos grave (prisión de 6 a 18 meses) — ver notaRevision.
    penaTexto: 'Multa de 1 a 3 meses (delito leve, hasta 400 €)',
    textoBoletin:
      'Apoderamiento de cosas muebles ajenas con ánimo de lucro y sin la voluntad de su dueño, ' +
      'sin fuerza en las cosas ni violencia o intimidación en las personas. Cuando la cuantía de ' +
      'lo sustraído no excede de 400 euros y no concurre agravante del art. 235 CP, el hecho es un ' +
      'delito leve. La calificación final corresponde a la autoridad judicial.',
    terminos: [
      'hurto',
      'robo sin violencia',
      'mangar',
      'sisar',
      'robar en una tienda',
      'hurto en supermercado',
      'robo hormiga',
      'me han robado la cartera',
      'descuido',
    ],
    notaRevision:
      'A VERIFICAR el marco de pena y la frontera leve/menos grave: el hurto es DELITO LEVE ' +
      '(multa de 1 a 3 meses, art. 234.2 CP) cuando lo sustraído no excede de 400 € y no concurre ' +
      'agravante del art. 235; a partir de 400 € o con agravante pasa a MENOS GRAVE (prisión de 6 a ' +
      '18 meses, art. 234.1). La ficha modela el caso LEVE (el más frecuente) → detención regida ' +
      'por el art. 495 LECrim. Confirmar cuantía-frontera y penas contra el texto consolidado del CP.',
  }),
  construirDelito({
    id: 'del-robo-violencia',
    articulo: ART_CP_242,
    tituloCorto: 'Robo con violencia o intimidación',
    // Prisión de 2 a 5 años (art. 242.1); agravados ≤ 5 años → MENOS GRAVE (art. 33 CP).
    gravedadCp: 'menos_grave',
    penaTexto: 'Prisión de 2 a 5 años (art. 242.1 CP)',
    textoBoletin:
      'Apoderamiento de cosas muebles ajenas empleando violencia o intimidación sobre las personas ' +
      'para conseguirlas o asegurar la huida. La valoración de la violencia o intimidación y la ' +
      'calificación final corresponden a la autoridad judicial.',
    terminos: [
      'robo con violencia',
      'atraco',
      'tiron',
      'robo con intimidacion',
      'me han atracado',
      'robo con navaja',
      'asalto',
      'robo a mano armada',
    ],
    notaRevision:
      'A VERIFICAR el marco de pena: robo con violencia o intimidación, prisión de 2 a 5 años ' +
      '(art. 242.1 CP), agravado en casa habitada (art. 242.2) o con armas/medios peligrosos ' +
      '(art. 242.3, pena en su mitad superior). Todos los tramos citados son MENOS GRAVE (pena ' +
      '≤ 5 años, art. 33 CP). Confirmar penas contra el texto consolidado del CP.',
  }),
  construirDelito({
    id: 'del-lesiones',
    articulo: ART_CP_147,
    tituloCorto: 'Lesiones',
    // Art. 147.1 (requieren tratamiento): prisión 3 meses a 3 años o multa → MENOS GRAVE.
    gravedadCp: 'menos_grave',
    penaTexto: 'Prisión de 3 meses a 3 años o multa de 6 a 12 meses (art. 147.1 CP)',
    textoBoletin:
      'Causar a otra persona una lesión que, además de una primera asistencia facultativa, ' +
      'requiere objetivamente tratamiento médico o quirúrgico para su sanidad (art. 147.1 CP). La ' +
      'calificación final corresponde a la autoridad judicial.',
    terminos: [
      'lesiones',
      'pelea',
      'agresion',
      'agresiones',
      'le ha pegado',
      'puñetazo',
      'navajazo',
      'herido en una pelea',
      'agresion con lesiones',
      'paliza',
    ],
    notaRevision:
      'A VERIFICAR el marco de pena y el subtipo: lesiones del art. 147.1 CP (requieren ' +
      'tratamiento médico o quirúrgico), prisión de 3 meses a 3 años o multa de 6 a 12 meses → ' +
      'MENOS GRAVE. Los supuestos de menor entidad (art. 147.2) y el maltrato de obra sin lesión ' +
      '(art. 147.3) son DELITO LEVE (multa de 1 a 3 / de 1 a 2 meses) y cambiarían la rama de ' +
      'detención al art. 495 LECrim. Confirmar penas y subtipo contra el texto consolidado del CP.',
  }),
  // --- Lesiones AGRAVADAS (art. 148): arma/medio peligroso, ensañamiento, víctima menor/vulnerable ---
  construirDelito({
    id: 'del-lesiones-agravadas',
    articulo: ART_CP_148,
    tituloCorto: 'Lesiones agravadas (arma o medio peligroso)',
    // Art. 148: prisión de 2 a 5 años → MENOS GRAVE (tope del menos grave, art. 33.3 CP).
    gravedadCp: 'menos_grave',
    penaTexto:
      'Prisión de 2 a 5 años (lesiones del art. 147.1 agravadas por el art. 148 CP). A verificar',
    textoBoletin:
      'Causar a otra persona una lesión que requiere tratamiento médico o quirúrgico (art. 147.1) ' +
      'concurriendo una circunstancia que la agrava (art. 148 CP): haberse usado en la agresión armas, ' +
      'instrumentos, objetos, medios, métodos o formas concretamente peligrosos para la vida o la salud, ' +
      'física o psíquica; ensañamiento o alevosía; ser la víctima menor de catorce años o persona con ' +
      'discapacidad necesitada de especial protección; ser o haber sido la víctima esposa o mujer ligada ' +
      'al autor por análoga relación de afectividad, aun sin convivencia; o ser una persona especialmente ' +
      'vulnerable que conviva con el autor. La apreciación de la agravante y la calificación final ' +
      'corresponden a la autoridad judicial.',
    terminos: [
      'lesiones con arma',
      'agresion con arma',
      'agresion con arma blanca',
      'navajazo',
      'cuchillada',
      'puñalada',
      'le pego con un palo',
      'le dio con una botella',
      'lesiones con objeto peligroso',
      'lesiones a un menor',
      'agresion con ensañamiento',
      'paliza con ensañamiento',
      'acuchillado',
      'apuñalado',
      'le clavo un cuchillo',
      'le rajo',
      'botellazo',
      'le dio un botellazo',
      'reyerta con arma',
      'corte con navaja',
    ],
    consecuenciasExtra: [
      {
        tipo: 'decomiso',
        textoCorto:
          'Procede valorar la intervención del arma o instrumento peligroso empleado, como pieza de ' +
          'convicción y efecto del delito, a disposición de la autoridad judicial (arts. 334 y 338 ' +
          'LECrim; comiso, art. 127 CP). La valoración final corresponde a la autoridad judicial.',
        fuente: 'LECrim arts. 334 y 338; CP art. 127',
      },
    ],
    notaRevision:
      'A VERIFICAR el marco de pena y la agravante: el art. 148 CP eleva las lesiones del art. 147.1 a ' +
      'prisión de 2 a 5 años (potestativo, "podrán ser castigadas") cuando concurren armas/medios ' +
      'peligrosos para la vida o salud física o psíquica (148.1º), ensañamiento o alevosía (148.2º), ' +
      'víctima menor de 14 años o con discapacidad necesitada de especial protección (148.3º), víctima ' +
      'esposa o mujer ligada al autor por análoga relación de afectividad, aun sin convivencia (148.4º), o ' +
      'persona especialmente vulnerable conviviente (148.5º). Sigue siendo MENOS GRAVE (≤ 5 años, art. 33.3). ' +
      'Distinguir de las lesiones básicas del art. 147.1 (`del-lesiones`), de las lesiones graves de los ' +
      'arts. 149-150 (deformidad, pérdida de órgano o miembro → GRAVE) y del maltrato del art. 153 ' +
      '(violencia de género/doméstica sin lesión que requiera tratamiento). "navajazo"/"cuchillada" figuran ' +
      'en AMBAS fichas (147.1 y 148): el arma blanca es medio peligroso del 148.1º, pero el 148 es ' +
      'potestativo y la calificación final es judicial. Confirmar penas y encaje contra el texto consolidado del CP.',
  }),
  construirDelito({
    id: 'del-quebrantamiento',
    articulo: ART_CP_468,
    tituloCorto: 'Quebrantamiento de orden de alejamiento',
    // Art. 468.2 (alejamiento en protección de víctima): prisión 6 meses a 1 año → MENOS GRAVE.
    gravedadCp: 'menos_grave',
    penaTexto: 'Prisión de 6 meses a 1 año (art. 468.2 CP)',
    textoBoletin:
      'Incumplir una pena o medida cautelar de alejamiento o de prohibición de comunicación ' +
      'impuesta para proteger a la víctima (art. 48 CP), acercándose a ella o comunicándose con ' +
      'ella. La calificación final corresponde a la autoridad judicial.',
    terminos: [
      'quebrantamiento',
      'alejamiento',
      'orden de alejamiento',
      'saltarse la orden',
      'se salto la orden de alejamiento',
      'quebrantamiento de condena',
      'se acerco a la victima',
      'orden de proteccion',
      'viola el alejamiento',
      'incumple el alejamiento',
    ],
    notaRevision:
      'A VERIFICAR el marco de pena: quebrantamiento del art. 468.2 CP (pena o medida de ' +
      'alejamiento del art. 48 en protección de víctima de violencia de género o doméstica), ' +
      'prisión de 6 meses a 1 año EN TODO CASO → MENOS GRAVE. El art. 468.1 (otros ' +
      'quebrantamientos, no privado de libertad) puede ser solo multa, lo que cambiaría la rama. ' +
      'Suele ser FLAGRANTE (el agente comprueba in situ el incumplimiento). Confirmar penas y el ' +
      'encaje del caso contra el texto consolidado del CP.',
  }),
  // --- Delitos añadidos para la Policía Nacional (ronda validadores de calle) ----------------
  construirDelito({
    id: 'del-atentado-agente',
    articulo: ART_CP_550,
    tituloCorto: 'Atentado a agente de la autoridad',
    // Atentado a AGENTE (art. 550.2, "demás casos"): prisión de 6 meses a 3 años → MENOS GRAVE.
    // (La pena de 1 a 4 años y multa del 550.2 es para el atentado contra AUTORIDAD, no agente.)
    gravedadCp: 'menos_grave',
    penaTexto:
      'Prisión de 6 meses a 3 años (atentado a agente de la autoridad, art. 550.2 CP); en su mitad ' +
      'superior si concurre agravante del art. 551 (armas u objetos peligrosos)',
    textoBoletin:
      'Agredir a un agente de la autoridad, o emplear intimidación grave o violencia contra él, ' +
      'cuando se halla en el ejercicio de sus funciones o con ocasión de ellas (art. 550 CP). Si la ' +
      'conducta no llega a atentado, puede ser resistencia o desobediencia grave (art. 556 CP) o ' +
      'infracción administrativa (art. 36.6 LO 4/2015). La calificación final corresponde a la ' +
      'autoridad judicial.',
    terminos: [
      'atentado',
      'atentado a agente',
      'agredir a un policia',
      'agresion a agente de la autoridad',
      'ha pegado a un agente',
      'resistencia activa',
      'resistirse con violencia',
      'acometer a la policia',
      'forcejeo con el agente',
      'me ha agredido',
    ],
    notaRevision:
      'A VERIFICAR el subtipo: atentado del art. 550 CP a AGENTE de la autoridad → prisión de 6 meses ' +
      'a 3 años (art. 550.2, "demás casos"); la pena de 1 a 4 años y multa es para el atentado a ' +
      'AUTORIDAD. Agravante del art. 551 (armas, objetos peligrosos) → mitad superior. MENOS GRAVE. ' +
      'Distinguir de la resistencia/desobediencia grave (art. 556 CP, ' +
      'prisión de 3 meses a 1 año) y de la infracción administrativa del art. 36.6 LO 4/2015 (sin ' +
      'violencia/intimidación grave). Confirmar penas y encaje contra el texto consolidado del CP.',
  }),
  construirDelito({
    id: 'del-trafico-drogas',
    articulo: ART_CP_368,
    tituloCorto: 'Tráfico de drogas',
    // Sustancias que causan grave daño a la salud (cocaína, heroína): prisión de 3 a 6 años →
    // GRAVE (pena que puede superar los 5 años, art. 33 CP). Sin grave daño: 1 a 3 años.
    gravedadCp: 'grave',
    penaTexto: 'Prisión de 3 a 6 años y multa (sustancias que causan grave daño a la salud, art. 368 CP)',
    textoBoletin:
      'Ejecutar actos de cultivo, elaboración o tráfico de drogas tóxicas, estupefacientes o ' +
      'sustancias psicotrópicas, o promover, favorecer o facilitar su consumo ilegal, o poseerlas ' +
      'con esos fines (art. 368 CP). La pena es mayor cuando la sustancia causa grave daño a la ' +
      'salud. El consumo o la tenencia para el consumo propio NO es delito (puede ser infracción del ' +
      'art. 36.16 LO 4/2015): la distinción se apoya en la cantidad, la forma de presentación y los ' +
      'indicadores de tráfico (ver tabla de sustancias). La calificación corresponde a la autoridad judicial.',
    terminos: [
      'trafico de drogas',
      'venta de droga',
      'vender droga',
      'trapicheo',
      'camello',
      'menudeo',
      'pillar para vender',
      'droga para vender',
      'papelinas para vender',
      'punto de venta de droga',
    ],
    notaRevision:
      'A VERIFICAR el marco de pena y la clasificación: tráfico del art. 368 CP → prisión de 3 a 6 ' +
      'años si la sustancia causa GRAVE DAÑO a la salud (cocaína, heroína…) → GRAVE (art. 33 CP); de ' +
      '1 a 3 años en otro caso (hachís, marihuana) → MENOS GRAVE, lo que cambiaría la rama de ' +
      'detención. El subtipo atenuado (art. 368.2, escasa entidad) también rebaja la pena. La ' +
      'frontera consumo/tráfico es JUDICIAL y se apoya en la tabla de sustancias (§4.7). Confirmar ' +
      'penas y encaje contra el texto consolidado del CP con el revisor jurídico.',
  }),
  construirDelito({
    id: 'del-amenazas',
    articulo: ART_CP_169,
    tituloCorto: 'Amenazas',
    // Amenazar con un mal constitutivo de delito (art. 169): prisión de 1 a 5 años (condicional
    // conseguido el propósito) → MENOS GRAVE. Los tramos inferiores también son menos graves.
    gravedadCp: 'menos_grave',
    penaTexto: 'Prisión de 1 a 5 años (amenaza de un mal constitutivo de delito, art. 169 CP)',
    textoBoletin:
      'Amenazar a otra persona con causarle a ella, a su familia o a personas con las que esté ' +
      'íntimamente vinculada un mal que constituya delito, como matarla o lesionarla (art. 169 CP). ' +
      'La pena varía según la amenaza sea o no condicional y se consiga o no el propósito. Las ' +
      'amenazas de un mal que no es delito (art. 171) y las amenazas leves (art. 171.7) tienen pena ' +
      'menor. La calificación final corresponde a la autoridad judicial.',
    terminos: [
      'amenazas',
      'amenazar',
      'me ha amenazado',
      'amenaza de muerte',
      'te voy a matar',
      'amenaza con un cuchillo',
      'intimidacion',
      'amenaza condicional',
      'chantaje',
    ],
    notaRevision:
      'A VERIFICAR el marco de pena y el subtipo: amenazas de un mal constitutivo de delito ' +
      '(art. 169 CP) → prisión de 1 a 5 años si es condicional y se consigue el propósito; tramos ' +
      'inferiores si no. Todos → MENOS GRAVE. Distinguir de las amenazas de un mal NO constitutivo ' +
      'de delito (art. 171), las coacciones (art. 172) y las amenazas LEVES (art. 171.7), que son ' +
      'delito leve y cambiarían la rama de detención (art. 495 LECrim). Confirmar penas y encaje.',
  }),
  construirDelito({
    id: 'del-danos',
    articulo: ART_CP_263,
    tituloCorto: 'Daños',
    // Daños del art. 263.1 (cuantía > 400 €): multa de 6 a 24 meses → MENOS GRAVE (multa de más
    // de 3 meses, art. 33.3 CP). Los daños ≤ 400 € son delito leve (art. 263.1, párr. 2º).
    gravedadCp: 'menos_grave',
    penaTexto: 'Multa de 6 a 24 meses (daños cuya cuantía excede de 400 €, art. 263.1 CP)',
    textoBoletin:
      'Causar daños en propiedad ajena no comprendidos en otros títulos del Código Penal, cuando la ' +
      'cuantía del daño excede de 400 euros (art. 263.1 CP). Si el daño es de 400 euros o menos, es ' +
      'delito leve. Existen tipos agravados (bienes de servicio o utilidad pública, patrimonio ' +
      'histórico, mediante incendio, etc.). La calificación final corresponde a la autoridad judicial.',
    terminos: [
      'daños',
      'rotura de mobiliario urbano',
      'vandalismo',
      'romper el retrovisor',
      'pintadas',
      'grafiti',
      'ha roto un cristal',
      'destrozos',
      'rayar un coche',
      'romper el escaparate',
    ],
    notaRevision:
      'A VERIFICAR el marco de pena y la frontera leve/menos grave: daños del art. 263.1 CP → multa ' +
      'de 6 a 24 meses cuando la cuantía EXCEDE de 400 € → MENOS GRAVE; con cuantía de 400 € o menos ' +
      'es DELITO LEVE (multa de 1 a 3 meses) → detención regida por el art. 495 LECrim. Comprobar los ' +
      'tipos agravados del art. 263.2 (bienes públicos, patrimonio histórico, incendio). El grafiti/' +
      'pintada puede ir por el art. 263 o por deslucimiento (art. 323). Confirmar penas y encaje.',
  }),
  construirDelito({
    id: 'del-robo-fuerza-casa-habitada',
    articulo: ART_CP_241,
    tituloCorto: 'Robo con fuerza en casa habitada',
    // Robo con fuerza en casa habitada (art. 241.1): prisión de 2 a 5 años → MENOS GRAVE.
    gravedadCp: 'menos_grave',
    penaTexto: 'Prisión de 2 a 5 años (robo con fuerza en casa habitada, art. 241.1 CP)',
    textoBoletin:
      'Apoderarse de cosas muebles ajenas empleando fuerza en las cosas (escalamiento, rotura, ' +
      'llaves falsas, inutilización de alarmas…) para acceder al lugar, cuando el robo se comete en ' +
      'casa habitada, en sus dependencias o en edificio o local abiertos al público (arts. 237-241 ' +
      'CP). Se considera casa habitada el albergue que constituye morada, aunque sus moradores estén ' +
      'accidentalmente ausentes. La calificación final corresponde a la autoridad judicial.',
    terminos: [
      'robo en casa',
      'robo en vivienda',
      'robo con fuerza',
      'butron',
      'escalo',
      'han entrado a robar en un piso',
      'robo en domicilio',
      'fuerza en las cosas',
      'reventar la cerradura',
      'alunizaje',
    ],
    notaRevision:
      'A VERIFICAR el marco de pena: robo con fuerza en casa habitada (art. 241.1 CP) → prisión de ' +
      '2 a 5 años → MENOS GRAVE; agravado (art. 241.2/241.4, organización o especial gravedad) puede ' +
      'elevarse. Distinguir del robo con fuerza NO en casa habitada (art. 240, prisión de 1 a 3 años) ' +
      'y del hurto (sin fuerza). Confirmar penas y encaje contra el texto consolidado del CP.',
  }),
  // --- Violencia de género / doméstica: el delito nº1 de la Policía Nacional (contenido MUY ---
  // --- sensible: se extrema el lenguaje orientativo y el "a verificar"). --------------------
  construirDelito({
    id: 'del-violencia-genero',
    articulo: ART_CP_153,
    tituloCorto: 'Violencia de género o doméstica',
    // Art. 153.1 (un acto de maltrato/lesión leve): prisión de 6 meses a 1 año → MENOS GRAVE.
    // Flagrancia frecuente (aviso en el momento) → el motor orienta a que PROCEDE la detención.
    gravedadCp: 'menos_grave',
    penaTexto:
      'Prisión de 6 meses a 1 año o trabajos en beneficio de la comunidad (un acto, art. 153.1 CP); ' +
      'violencia física o psíquica HABITUAL: prisión de 6 meses a 3 años (art. 173.2 CP). A verificar',
    textoBoletin:
      'Maltrato de obra o lesión de menor entidad sobre quien es o ha sido esposa o mujer ligada al ' +
      'autor por análoga relación de afectividad (art. 153.1 CP), o sobre otras personas del ámbito ' +
      'familiar (art. 153.2); la violencia física o psíquica HABITUAL se persigue por el art. 173.2 ' +
      'CP y las lesiones que requieren tratamiento por los arts. 147/148. MENSAJE OPERATIVO ' +
      '(orientativo): procede valorar de forma prioritaria las MEDIDAS DE PROTECCIÓN de la víctima ' +
      '(orden de protección, arts. 544 bis y 544 ter LECrim) y realizar la valoración policial del ' +
      'riesgo (VPR/sistema VioGén). La detención y las medidas cautelares las acuerda o ratifica la ' +
      'AUTORIDAD JUDICIAL; la valoración final del caso corresponde al agente y, en su caso, al juez.',
    terminos: [
      'malos tratos',
      'le pega a su mujer',
      'violencia machista',
      'maltrato en casa',
      'violencia domestica',
      'vg',
      'agresion a la pareja',
      'violencia de genero',
      'maltratador',
      'pega a su pareja',
      'violencia en la pareja',
      // Habitualidad (art. 173.2 CP): sinónimos para que el buscador la lleve también a esta ficha.
      'violencia habitual',
      'maltrato habitual',
      '173.2',
      'maltrato psicologico',
    ],
    // La PROTECCIÓN de la víctima sube DESTACADA (no enterrada en el texto): orden de protección y
    // valoración policial del riesgo. Orientativa; la acuerda/ratifica la autoridad judicial.
    consecuenciasExtra: [
      {
        tipo: 'proteccion',
        textoCorto:
          'Procede valorar de forma PRIORITARIA las medidas de protección de la víctima: instar la ' +
          'orden de protección (arts. 544 bis y 544 ter LECrim) y realizar la valoración policial del ' +
          'riesgo (VPR, sistema VioGén), activando el seguimiento y los recursos asistenciales. Las ' +
          'medidas cautelares las acuerda o ratifica la autoridad judicial.',
        fuente: 'LECrim arts. 544 bis y 544 ter; VPR/VioGén',
      },
    ],
    notaRevision:
      'CONTENIDO MUY SENSIBLE — a verificar con especial cuidado. DISTINGUIR los tipos: art. 153.1 ' +
      'CP (UN acto de maltrato de obra o lesión de menor entidad sobre pareja/expareja mujer) → ' +
      'prisión de 6 meses a 1 año o trabajos en beneficio de la comunidad de 31 a 80 días, y en ' +
      'todo caso privación del derecho a la tenencia y porte de armas; art. 153.2 (resto de personas ' +
      'del art. 173.2); art. 173.2 (violencia HABITUAL) → prisión de 6 meses a 3 años; y las LESIONES ' +
      'de los arts. 147/148 cuando requieren tratamiento médico o quirúrgico. Todos los tramos ' +
      'citados son MENOS GRAVE (art. 33 CP) → detención flagrante regida por el art. 490 LECrim. A ' +
      'VERIFICAR las penas exactas, las agravantes (presencia de menores, domicilio común, quebranto ' +
      'del art. 468) y la redacción de las MEDIDAS DE PROTECCIÓN (arts. 544 bis/ter LECrim, VPR/' +
      'VioGén) con el revisor jurídico antes de publicar. Confirmar contra el texto consolidado del CP.',
  }),
  // --- Delitos de orden público y contra la autoridad (frecuentes en la Policía Nacional) -----
  construirDelito({
    id: 'del-desordenes-publicos',
    articulo: ART_CP_557,
    tituloCorto: 'Desórdenes públicos',
    // Art. 557.1 (redacción LO 14/2022): actuar en grupo y con el fin de atentar contra la paz
    // pública ejecutando actos de violencia o intimidación → prisión de 6 meses a 3 años → MENOS
    // GRAVE (base). La modalidad agravada por MULTITUD (art. 557.2) es prisión de 3 a 5 años → GRAVE.
    gravedadCp: 'menos_grave',
    penaTexto:
      'Prisión de 6 meses a 3 años (desórdenes públicos en grupo, art. 557.1 CP); modalidad agravada ' +
      'por multitud idónea para afectar gravemente el orden público (art. 557.2): prisión de 3 a 5 ' +
      'años. A verificar',
    textoBoletin:
      'Actuar en grupo y con el fin de atentar contra la paz pública ejecutando actos de violencia o ' +
      'intimidación sobre las personas o sobre las cosas, o amenazar con llevarlos a cabo (art. 557.1 ' +
      'CP). La modalidad AGRAVADA (art. 557.2 CP) se aprecia cuando los hechos se cometen en el seno ' +
      'de una multitud o grupo numeroso idóneo para afectar gravemente el orden público, o cuando el ' +
      'culpable se prevale de esa situación. La alteración de menor entidad, sin llegar a delito, ' +
      'puede ser infracción administrativa (art. 36.1/36.3 LO 4/2015). La calificación final ' +
      'corresponde a la autoridad judicial.',
    terminos: [
      'disturbios',
      'batalla campal',
      'pelea multitudinaria en grupo',
      'desordenes publicos graves',
      'altercado violento en grupo',
      'destrozos en grupo',
      'altercados en la manifestacion',
      'grupo violento en la calle',
    ],
    notaRevision:
      'A VERIFICAR el marco de pena y el encaje (redacción vigente tras la LO 14/2022): el tipo BASE ' +
      'del art. 557.1 CP (actuar en grupo con el fin de atentar contra la paz pública ejecutando ' +
      'actos de violencia o intimidación) → prisión de 6 meses a 3 años → MENOS GRAVE; la modalidad ' +
      'AGRAVADA del art. 557.2 (hechos cometidos en el seno de una multitud o grupo numeroso idóneo ' +
      'para afectar gravemente el orden público, o prevaliéndose de ella) → prisión de 3 a 5 años → ' +
      'GRAVE, lo que cambiaría la rama de detención. El subtipo AGRAVADO del art. 557.3 (llevar armas ' +
      'u otros objetos peligrosos, o cometer actos de pillaje) también eleva la pena; OJO: tras la LO ' +
      '14/2022 el art. 557 bis dejó de ser esa agravación y pasó a castigar la invasión u ocupación ' +
      'en grupo del domicilio de una persona jurídica, despacho, oficina o local (cotejado con la LO ' +
      '14/2022). DISTINGUIR de la infracción administrativa de desórdenes (art. 36.1/36.3 LO ' +
      '4/2015), que exige alteración grave de la seguridad ciudadana SIN llegar a delito. Confirmar ' +
      'penas y encaje contra el texto consolidado del CP con el revisor jurídico.',
  }),
  construirDelito({
    id: 'del-resistencia-desobediencia',
    articulo: ART_CP_556,
    tituloCorto: 'Resistencia o desobediencia grave a la autoridad',
    // Art. 556.1 (resistencia NO violenta o desobediencia grave): prisión de 3 meses a 1 año o
    // multa de 6 a 18 meses → MENOS GRAVE. Flagrante → el motor orienta a que PROCEDE.
    gravedadCp: 'menos_grave',
    penaTexto:
      'Prisión de 3 meses a 1 año o multa de 6 a 18 meses (resistencia o desobediencia grave, ' +
      'art. 556.1 CP). A verificar',
    textoBoletin:
      'Resistir o desobedecer GRAVEMENTE a la autoridad o a sus agentes en el ejercicio de sus ' +
      'funciones, sin llegar al atentado del art. 550 (art. 556 CP): resistencia no violenta o de ' +
      'escasa entidad (p. ej. forcejeo pasivo) y desobediencia grave a una orden legítima. Cuando ' +
      'media agresión, violencia o intimidación grave, el hecho puede ser ATENTADO (art. 550 CP); si ' +
      'no llega a "grave", puede ser infracción administrativa (art. 36.6 LO 4/2015). La calificación ' +
      'final corresponde a la autoridad judicial.',
    terminos: [
      'se resiste',
      'no obedece',
      'desobediencia grave',
      'forcejeo pasivo',
      'resistencia no violenta',
      'desobedece a la autoridad',
      'no acata la orden del agente',
      'se opone al agente sin violencia',
    ],
    notaRevision:
      'A VERIFICAR el marco de pena y la frontera: resistencia o desobediencia grave del art. 556.1 ' +
      'CP → prisión de 3 meses a 1 año o multa de 6 a 18 meses → MENOS GRAVE. DISTINGUIR (i) del ' +
      'ATENTADO (art. 550 CP: agresión, acometimiento o violencia/intimidación grave sobre el agente), ' +
      'que es más grave, y (ii) de la infracción administrativa del art. 36.6 LO 4/2015 ' +
      '(desobediencia/resistencia que NO alcanza la gravedad penal). El juicio de "gravedad" es ' +
      'delicado: confirmar el encaje del caso con el revisor jurídico. Confirmar penas contra el CP.',
  }),
  // --- Estafa (patrimonial frecuente: timos, fraudes) ----------------------------------------
  construirDelito({
    id: 'del-estafa',
    articulo: ART_CP_249,
    tituloCorto: 'Estafa',
    // Art. 249 (cuantía > 400 €): prisión de 6 meses a 3 años → MENOS GRAVE. ≤ 400 € es delito leve.
    gravedadCp: 'menos_grave',
    penaTexto:
      'Prisión de 6 meses a 3 años (estafa cuya cuantía excede de 400 €, art. 249 CP); ≤ 400 € es ' +
      'delito leve (multa). A verificar',
    textoBoletin:
      'Utilizar, con ánimo de lucro, un engaño bastante para producir error en otra persona e ' +
      'inducirla a realizar un acto de disposición patrimonial en perjuicio propio o ajeno (arts. 248 ' +
      'y 249 CP). Cuando la cuantía de lo defraudado no excede de 400 euros, el hecho es delito leve. ' +
      'La calificación final corresponde a la autoridad judicial.',
    terminos: [
      'estafa',
      'timo',
      'me han estafado',
      'tocomocho',
      'fraude',
      'engaño con animo de lucro',
      'estafador',
      'timador',
      'me han timado',
    ],
    notaRevision:
      'A VERIFICAR el marco de pena y la frontera leve/menos grave: estafa del art. 249 CP → prisión ' +
      'de 6 meses a 3 años cuando la cuantía EXCEDE de 400 € → MENOS GRAVE; con cuantía de 400 € o ' +
      'menos es DELITO LEVE (multa de 1 a 3 meses) → detención regida por el art. 495 LECrim. Comprobar ' +
      'los subtipos AGRAVADOS del art. 250 (vivienda, especial gravedad, abuso de relaciones ' +
      'personales, etc.), que elevan la pena. Distinguir de la apropiación indebida (art. 253) y de la ' +
      'administración desleal (art. 252). Confirmar penas y encaje contra el texto consolidado del CP.',
  }),
  // --- Falsedad documental (muy buscada en control de extranjería / identificaciones) ---------
  construirDelito({
    id: 'del-falsedad-documental',
    articulo: ART_CP_392,
    tituloCorto: 'Falsedad de documento (papeles falsos)',
    // Caso modelado: falsedad en documento público/oficial/mercantil por particular (art. 392.1),
    // prisión de 6 meses a 3 años + multa → MENOS GRAVE (pena ≤ 5 años, art. 33 CP).
    gravedadCp: 'menos_grave',
    penaTexto:
      'Prisión de 6 meses a 3 años y multa de 6 a 12 meses (falsedad en documento público, oficial o ' +
      'mercantil por particular, art. 392.1 CP). A verificar',
    textoBoletin:
      'Falsificar un documento público, oficial o mercantil (alterándolo en un elemento esencial, ' +
      'simulándolo o suponiendo la intervención de personas que no la han tenido), o traficar con un ' +
      'documento de identidad falso o usarlo a sabiendas (art. 392 CP). En el control de extranjería ' +
      'es frecuente el uso de pasaporte, permiso de residencia o documento de identidad falso o ' +
      'ajeno: el uso de documento falso por quien no lo falsificó va por el art. 393 (pena inferior ' +
      'en grado) y el uso de un documento AUTÉNTICO por quien no está legitimado se equipara al uso ' +
      'falso (art. 400 bis). La calificación final corresponde a la autoridad judicial.',
    terminos: [
      'papeles falsos',
      'pasaporte falso',
      'dni falso',
      'documentacion falsa',
      'carnet falso',
      'documento falsificado',
      'pasaporte trucado',
      'falsedad documental',
      'permiso de residencia falso',
    ],
    // Intervención (comiso) del documento como efecto/instrumento del delito (art. 127 CP).
    consecuenciasExtra: [
      {
        tipo: 'decomiso',
        textoCorto:
          'Procede la intervención del documento presuntamente falso o usado indebidamente como ' +
          'efecto o instrumento del delito, a disposición de la autoridad judicial (comiso, art. 127 ' +
          'CP). La valoración final corresponde a la autoridad judicial.',
        fuente: 'CP art. 127 (comiso de efectos e instrumentos del delito)',
      },
    ],
    notaRevision:
      'A VERIFICAR el subtipo y el marco de pena: la ficha modela la falsedad del art. 392.1 CP ' +
      '(documento público, oficial o mercantil por particular) → prisión de 6 meses a 3 años y multa ' +
      'de 6 a 12 meses → MENOS GRAVE. DISTINGUIR: (i) tráfico con documento de IDENTIDAD falso ' +
      '(art. 392.2, misma pena) y USO a sabiendas de documento de identidad falso (art. 392.2, ' +
      'prisión de 6 meses a 1 año y multa de 3 a 6 meses); (ii) uso de documento falso por quien no ' +
      'lo falsificó (art. 393, pena inferior en grado); (iii) uso de documento auténtico por quien no ' +
      'está legitimado (art. 400 bis); (iv) falsedad en certificados (art. 399) y falsificación de ' +
      'tarjetas de crédito/débito y cheques de viaje (art. 399 bis, pena MÁS grave, hasta prisión de ' +
      '4 a 8 años → GRAVE). Confirmar el encaje del caso y las penas contra el texto consolidado del CP.',
  }),
  // --- Sustracción de vehículos (Guardia Civil rural) ----------------------------------------
  construirDelito({
    id: 'del-sustraccion-vehiculo',
    articulo: ART_CP_244,
    tituloCorto: 'Robo y hurto de uso de vehículo',
    // Caso modelado: hurto de uso del art. 244.1 (sin ánimo de apropiárselo, restitución < 48 h) →
    // trabajos en beneficio de la comunidad de 31 a 90 días o multa de 2 a 12 meses → MENOS GRAVE.
    gravedadCp: 'menos_grave',
    penaTexto:
      'Trabajos en beneficio de la comunidad de 31 a 90 días o multa de 2 a 12 meses (hurto de uso, ' +
      'restitución < 48 h, art. 244.1 CP); en su mitad superior si hay fuerza en las cosas. A verificar',
    textoBoletin:
      'Sustraer o utilizar sin autorización un vehículo a motor o ciclomotor ajenos SIN ánimo de ' +
      'apropiárselo (hurto de uso, art. 244 CP). Si se restituye en un plazo no superior a 48 horas, ' +
      'la pena es de trabajos en beneficio de la comunidad o multa; con fuerza en las cosas se impone ' +
      'en su mitad superior. Si NO se restituye en plazo, el hecho se castiga como HURTO o ROBO ' +
      '(según haya o no fuerza); si media violencia o intimidación, se aplican en todo caso las penas ' +
      'del robo con violencia (art. 242). La calificación final corresponde a la autoridad judicial.',
    terminos: [
      'coche robado',
      'sustraccion de vehiculo',
      'robo de coche',
      'me han robado el coche',
      'vehiculo sustraido',
      'requisitoria',
      'hurto de uso',
      'moto robada',
    ],
    // Vehículo recuperado: depósito y devolución al titular + comprobación de sustracción/requisitoria.
    consecuenciasExtra: [
      {
        tipo: 'deposito',
        textoCorto:
          'Si el vehículo se recupera, procede su depósito y la devolución a su titular, previa ' +
          'comprobación de si consta como sustraído o requisitoriado en las bases de datos policiales. ' +
          'Las medidas sobre el vehículo y las personas las acuerda o ratifica la autoridad judicial.',
        fuente: 'CP art. 244; comprobación de sustracción/requisitoria en bases de datos policiales',
      },
    ],
    notaRevision:
      'A VERIFICAR el subtipo y el marco de pena: la ficha modela el HURTO DE USO del art. 244.1 CP ' +
      '(sin ánimo de apropiárselo, restitución en 48 h) → trabajos en beneficio de la comunidad de 31 ' +
      'a 90 días o multa de 2 a 12 meses → MENOS GRAVE (por trabajos > 30 días / multa > 3 meses, ' +
      'art. 33 CP). Cambian la pena y la rama: fuerza en las cosas (mitad superior), NO restitución en ' +
      '48 h (se castiga como HURTO art. 234 o ROBO con fuerza art. 237 y ss.) y violencia o ' +
      'intimidación (penas del art. 242). DISTINGUIR del robo/hurto de cosas del interior del vehículo. ' +
      'MATIZ (revisor): por la cláusula de tope del propio art. 244.1 ("la pena no podrá ser igual o ' +
      'superior a la que correspondería si se apropiare definitivamente"), un vehículo de ESCASO VALOR ' +
      '(por debajo del umbral del hurto, 400 €), sin fuerza ni violencia, puede arrastrar el hecho al ' +
      'HURTO DE USO LEVE, lo que cambiaría la rama de detención al art. 495 LECrim. El caso modelado ' +
      'asume un vehículo de valor normal (menos grave). Confirmar penas y encaje contra el CP consolidado.',
  }),
  // --- Usurpación de inmueble / okupación (frontera con allanamiento y con la leve 37.7 LOSC) --
  construirDelito({
    id: 'del-usurpacion',
    articulo: ART_CP_245,
    tituloCorto: 'Usurpación de inmueble (okupación)',
    // Caso modelado: OCUPACIÓN PACÍFICA de inmueble ajeno que no es morada (art. 245.2) → multa de
    // 3 a 6 meses. Por el art. 13.4 CP (pena que puede ser leve o menos grave → LEVE), es DELITO LEVE
    // → la detención se rige por el art. 495 LECrim (no procede salvo excepción).
    gravedadCp: 'leve',
    penaTexto:
      'Multa de 3 a 6 meses (ocupación pacífica de inmueble ajeno que no es morada, art. 245.2 CP); ' +
      'con violencia o intimidación (art. 245.1): prisión de 1 a 2 años. A verificar',
    textoBoletin:
      'Ocupar, sin autorización debida, un inmueble, vivienda o edificio ajenos que NO constituyan ' +
      'morada, o mantenerse en ellos contra la voluntad de su titular (ocupación pacífica, art. 245.2 ' +
      'CP). FRONTERAS: si el inmueble es MORADA (alguien vive en él), el hecho es allanamiento de ' +
      'morada (art. 202 CP), más grave; si se ocupa con violencia o intimidación en las personas, ' +
      'art. 245.1 (prisión de 1 a 2 años); y la ocupación que NO es constitutiva de delito puede ser ' +
      'infracción administrativa (art. 37.7 LO 4/2015). La calificación final corresponde a la ' +
      'autoridad judicial.',
    terminos: [
      'okupas',
      'okupacion',
      'usurpacion',
      'han okupado',
      'ocupacion de inmueble',
      'okupas en un piso vacio',
      'usurpacion de inmueble',
      'ocupacion ilegal',
    ],
    notaRevision:
      'A VERIFICAR la clasificación y la frontera: la ficha modela la OCUPACIÓN PACÍFICA del ' +
      'art. 245.2 CP (inmueble ajeno que no es morada) → multa de 3 a 6 meses. Al ser una pena que por ' +
      'su extensión puede ser leve o menos grave, el art. 13.4 CP obliga a considerarla DELITO LEVE → ' +
      'la detención se rige por el art. 495 LECrim (NO procede salvo excepción, p. ej. desconocer el ' +
      'domicilio). DISTINGUIR: (i) del ALLANAMIENTO DE MORADA (art. 202 CP) cuando el inmueble es ' +
      'morada habitada; (ii) de la usurpación con VIOLENCIA o intimidación (art. 245.1, prisión de 1 a ' +
      '2 años → MENOS GRAVE, que sí cambiaría la rama de detención); y (iii) de la infracción ' +
      'administrativa de ocupación del art. 37.7 LO 4/2015. Confirmar clasificación (leve vs menos ' +
      'grave) y penas con el revisor jurídico contra el texto consolidado del CP.',
  }),
  // --- Allanamiento de morada (Policía Nacional; frontera con la usurpación) ------------------
  construirDelito({
    id: 'del-allanamiento-morada',
    articulo: ART_CP_202,
    tituloCorto: 'Allanamiento de morada',
    // Caso modelado: art. 202.1 (entrar o mantenerse en morada ajena contra la voluntad del morador)
    // → prisión de 6 meses a 2 años → MENOS GRAVE. Con violencia/intimidación (202.2): 1 a 4 años.
    gravedadCp: 'menos_grave',
    penaTexto:
      'Prisión de 6 meses a 2 años (allanamiento de morada, art. 202.1 CP); con violencia o ' +
      'intimidación (art. 202.2): prisión de 1 a 4 años y multa de 6 a 12 meses. A verificar',
    textoBoletin:
      'Entrar en morada ajena, o mantenerse en ella contra la voluntad de su morador, por un ' +
      'particular que no la habita (art. 202.1 CP). Si el hecho se ejecuta con violencia o ' +
      'intimidación, la pena es mayor (art. 202.2). FRONTERA con la usurpación: el art. 202 protege ' +
      'la MORADA (el espacio de vida privada donde alguien vive), mientras que la ocupación de un ' +
      'inmueble ajeno que NO es morada se castiga por la usurpación (art. 245 CP). La calificación ' +
      'final corresponde a la autoridad judicial.',
    terminos: [
      'allanamiento',
      'allanamiento de morada',
      'entrar en casa ajena',
      'se metio en mi casa',
      'okupas con gente dentro',
      'entrada en domicilio',
      'se ha colado en mi casa',
    ],
    notaRevision:
      'A VERIFICAR el subtipo y el marco de pena: allanamiento de morada del art. 202.1 CP → prisión ' +
      'de 6 meses a 2 años → MENOS GRAVE; con violencia o intimidación (art. 202.2) → prisión de 1 a 4 ' +
      'años y multa de 6 a 12 meses (también MENOS GRAVE, pena ≤ 5 años). La clave del tipo es que el ' +
      'lugar sea MORADA: DISTINGUIR de la usurpación de inmueble que no es morada (art. 245 CP) y del ' +
      'allanamiento de domicilio de persona jurídica, despacho u oficina (art. 203 CP). Confirmar ' +
      'penas y encaje contra el texto consolidado del CP.',
  }),
  // --- Omisión del deber de socorro (fuga tras atropello) ------------------------------------
  construirDelito({
    id: 'del-omision-socorro',
    articulo: ART_CP_195,
    tituloCorto: 'Omisión del deber de socorro',
    // Caso modelado: fuga tras atropello causado por imprudencia del que omite (art. 195.3) →
    // prisión de 6 meses a 4 años → MENOS GRAVE (pena ≤ 5 años, art. 33 CP).
    gravedadCp: 'menos_grave',
    penaTexto:
      'Prisión de 6 meses a 4 años (accidente causado por imprudencia del que omite el auxilio, ' +
      'art. 195.3 CP); si el accidente fue fortuito: prisión de 6 a 18 meses. El tipo básico ' +
      '(art. 195.1) es multa de 3 a 12 meses. A verificar',
    textoBoletin:
      'No socorrer a una persona desamparada y en peligro manifiesto y grave pudiendo hacerlo sin ' +
      'riesgo propio ni de terceros (art. 195.1 CP), o no demandar auxilio ajeno cuando uno está ' +
      'impedido de socorrer (art. 195.2). La pena se agrava (art. 195.3) cuando la víctima lo es por ' +
      'un accidente ocasionado por el propio que omite el auxilio: es el supuesto típico de la FUGA ' +
      'tras un atropello, mayor aún si el accidente se debió a imprudencia. La calificación final ' +
      'corresponde a la autoridad judicial.',
    terminos: [
      'omision de socorro',
      'se dio a la fuga',
      'se piro tras el golpe',
      'fuga tras atropello',
      'no auxilio',
      'dejar tirado a un herido',
      'atropello y huida',
      'no socorrer',
      'darse a la fuga',
    ],
    notaRevision:
      'A VERIFICAR el subtipo y el marco de pena: la ficha modela el art. 195.3 CP (víctima por ' +
      'accidente ocasionado por el que omitió el auxilio) → prisión de 6 a 18 meses si el accidente ' +
      'fue FORTUITO y prisión de 6 meses a 4 años si se debió a IMPRUDENCIA; ambos MENOS GRAVE. El ' +
      'tipo BÁSICO (art. 195.1, no socorrer a un desamparado en peligro) es multa de 3 a 12 meses → ' +
      'por el art. 13.4 CP sería DELITO LEVE (cambiaría la rama de detención al art. 495 LECrim). OJO: ' +
      'la fuga tras atropello puede concurrir con el abandono del lugar del accidente (art. 382 bis ' +
      'CP) y con el delito imprudente de lesiones/homicidio; deslindar los tipos. Confirmar la ' +
      'redacción vigente del art. 195.3 y las penas contra el texto consolidado del CP.',
  }),
  // --- Tenencia ilícita de armas de fuego (Guardia Civil rural) -------------------------------
  construirDelito({
    id: 'del-tenencia-armas',
    articulo: ART_CP_564,
    tituloCorto: 'Tenencia ilícita de armas de fuego',
    // Caso modelado: tenencia de arma de fuego reglamentada sin licencia/guía, arma corta (art.
    // 564.1.1º) → prisión de 1 a 2 años → MENOS GRAVE. Arma larga (564.1.2º): 6 meses a 1 año.
    gravedadCp: 'menos_grave',
    penaTexto:
      'Prisión de 1 a 2 años (arma de fuego corta reglamentada sin licencia, art. 564.1.1º CP); arma ' +
      'larga (art. 564.1.2º): prisión de 6 meses a 1 año; armas prohibidas (art. 563): prisión de 1 a ' +
      '3 años. A verificar',
    textoBoletin:
      'Tener un arma de fuego reglamentada careciendo de las licencias o permisos necesarios (guía de ' +
      'pertenencia, licencia) — art. 564 CP: prisión de 1 a 2 años si es arma corta y de 6 meses a 1 ' +
      'año si es arma larga (escopeta, rifle). La pena sube (art. 564.2) si el arma carece de marcas o ' +
      'número o los tiene borrados, se introdujo ilegalmente en España o fue transformada. La tenencia ' +
      'de armas PROHIBIDAS o de las resultantes de modificar sustancialmente un arma reglamentada va ' +
      'por el art. 563 (prisión de 1 a 3 años). FRONTERA: portar navajas, porras, sprays de defensa u ' +
      'otras armas prohibidas por la normativa, sin llegar al tipo penal, es infracción administrativa ' +
      '(art. 36.10 LO 4/2015). La calificación final corresponde a la autoridad judicial.',
    terminos: [
      'arma de fuego',
      'pistola',
      'fusca',
      'hierro',
      'escopeta sin guia',
      'sin licencia de armas',
      'tenencia ilicita de armas',
      'escopeta sin papeles',
      'arma sin licencia',
    ],
    // Intervención (comiso) del arma como efecto/instrumento del delito (art. 127 CP).
    consecuenciasExtra: [
      {
        tipo: 'decomiso',
        textoCorto:
          'Procede la intervención del arma y de su munición como efecto o instrumento del delito, a ' +
          'disposición de la autoridad judicial (comiso, art. 127 CP). La valoración final corresponde ' +
          'a la autoridad judicial.',
        fuente: 'CP art. 127 (comiso de efectos e instrumentos del delito)',
      },
    ],
    notaRevision:
      'A VERIFICAR el subtipo y el marco de pena: la ficha modela la tenencia de arma de fuego ' +
      'reglamentada SIN licencia del art. 564.1 CP → prisión de 1 a 2 años (arma corta) o de 6 meses a ' +
      '1 año (arma larga) → MENOS GRAVE; agravada (art. 564.2: sin marcas/número o borrados, ' +
      'introducción ilegal, transformación) en su mitad superior. La tenencia de armas PROHIBIDAS o de ' +
      'armas reglamentadas modificadas sustancialmente va por el art. 563 (prisión de 1 a 3 años → ' +
      'MENOS GRAVE). DISTINGUIR de la infracción administrativa del art. 36.10 LO 4/2015 (portar, ' +
      'exhibir o usar armas prohibidas —navaja, porra, spray— o armas fuera del domicilio) y del ' +
      'depósito de armas de guerra (arts. 566-567, pena MÁS grave). Confirmar penas y encaje contra el ' +
      'texto consolidado del CP con el revisor jurídico.',
  }),
  // --- Coacciones (172): doblegar la voluntad ahora, distinto de las amenazas (169) ---------------
  construirDelito({
    id: 'del-coacciones',
    articulo: ART_CP_172,
    tituloCorto: 'Coacciones',
    // Art. 172.1: prisión 6 meses a 3 años o multa → MENOS GRAVE (art. 33.3 CP).
    gravedadCp: 'menos_grave',
    penaTexto:
      'Prisión de 6 meses a 3 años o multa de 12 a 24 meses (coacciones del art. 172.1 CP). A verificar',
    textoBoletin:
      'Impedir a otra persona, sin estar legítimamente autorizado y empleando violencia (sobre las ' +
      'personas o las cosas), hacer lo que la ley no prohíbe, o compelerla a hacer lo que no quiere, sea ' +
      'justo o injusto (art. 172 CP). Se distingue de las amenazas (anunciar un mal futuro, art. 169) en ' +
      'que aquí se DOBLEGA la voluntad en el momento. Si además ENCIERRAN o retienen a la persona ' +
      'privándola de su libertad, es detención ilegal (art. 163, más grave, ver ficha). La coacción de ' +
      'carácter leve es delito leve (multa); hay subtipos agravados (impedir un derecho fundamental, ' +
      'acoso, violencia de género). La ' +
      'calificación final corresponde a la autoridad judicial.',
    terminos: [
      'coacciones',
      'coaccion',
      'me esta obligando',
      'no me deja salir',
      'no me deja pasar',
      'me obliga a la fuerza',
      'me esta forzando',
      'no me deja irme',
      'me corta el paso',
      'me impide el paso',
      'no me deja entrar en mi casa',
      'me obliga a firmar',
      'me obliga a pagar',
      'me esta coaccionando',
    ],
    notaRevision:
      'A VERIFICAR el marco de pena y el subtipo: coacciones del art. 172.1 CP → prisión de 6 meses a 3 ' +
      'años o multa de 12 a 24 meses → MENOS GRAVE. La coacción LEVE es delito leve del art. 172.3 (multa ' +
      'de 1 a 3 meses) → cambia la rama de detención al art. 495 LECrim. Subtipos agravados: impedir el ' +
      'ejercicio de un derecho fundamental (172.1 pár. 2) o el legítimo disfrute de la vivienda (172.1 ' +
      'pár. 3), acoso (172 ter) y ' +
      'coacciones en el ámbito de violencia de género/doméstica (172.2). Distinguir de las amenazas ' +
      '(art. 169, `del-amenazas`). Confirmar penas y encaje contra el texto consolidado del CP.',
  }),
  // --- Receptación (298): aprovecharse de lo robado (perista) ------------------------------------
  construirDelito({
    id: 'del-receptacion',
    articulo: ART_CP_298,
    tituloCorto: 'Receptación (aprovecharse de lo robado)',
    // Art. 298.1: prisión 6 meses a 2 años → MENOS GRAVE (art. 33.3 CP).
    gravedadCp: 'menos_grave',
    penaTexto:
      'Prisión de 6 meses a 2 años (receptación del art. 298.1 CP); se agrava según el valor y el caso. ' +
      'A verificar',
    textoBoletin:
      'Con ánimo de lucro y sabiendo que proceden de un delito contra el patrimonio o el orden ' +
      'socioeconómico en el que no se ha participado, ayudar a los responsables a aprovecharse de los ' +
      'efectos, o recibir, adquirir u ocultar ' +
      'esos efectos (art. 298 CP): p. ej. comprar o revender género que se sabe robado. Exige conocimiento ' +
      'del origen delictivo y ánimo de lucro. Se distingue del blanqueo de capitales (art. 301) y del ' +
      'encubrimiento (art. 451). Procede la intervención de los efectos. La calificación final corresponde ' +
      'a la autoridad judicial.',
    terminos: [
      'receptacion',
      'comprar lo robado',
      'vender lo robado',
      'genero robado',
      'sabe que es robado',
      'perista',
      'reducidor',
      'compra de objetos robados',
      'revender robado',
      'cobre robado',
      'chatarra robada',
      'venta de cobre',
      'compro oro',
      'casa de empeño',
      'movil robado',
      'objetos robados',
    ],
    consecuenciasExtra: [
      {
        tipo: 'decomiso',
        textoCorto:
          'Procede la intervención de los efectos presuntamente procedentes del delito, a disposición de ' +
          'la autoridad judicial (comiso, art. 127 CP). La valoración final corresponde a la autoridad judicial.',
        fuente: 'CP art. 127 (comiso de efectos del delito)',
      },
    ],
    notaRevision:
      'A VERIFICAR el marco de pena y los subtipos: receptación del art. 298.1 CP → prisión de 6 meses a 2 ' +
      'años → MENOS GRAVE. Se AGRAVA (298.2) si se reciben/adquieren/ocultan los efectos para TRAFICAR con ' +
      'ellos (pena en su mitad superior) o si el tráfico se hace con establecimiento o local comercial ' +
      '(multa e inhabilitación/clausura). La pena NUNCA puede exceder de la señalada al delito encubierto ' +
      '(art. 298.3). Exige DOLO ' +
      '(conocimiento del origen) y ánimo de lucro. Distinguir del blanqueo de capitales (art. 301) y del ' +
      'encubrimiento (art. 451). Confirmar penas y encaje contra el texto consolidado del CP.',
  }),
  // --- Detención ilegal (163): atacar la libertad ambulatoria; distinta de las coacciones (172) ---
  construirDelito({
    id: 'del-detencion-ilegal',
    articulo: ART_CP_163,
    tituloCorto: 'Detención ilegal (retención contra su voluntad)',
    // Art. 163.1: prisión 4-6 años → GRAVE (máx. 6 > 5 años, art. 33.2 CP).
    gravedadCp: 'grave',
    penaTexto:
      'Prisión de 4 a 6 años (detención ilegal por particular, art. 163.1 CP); menor si libera en los 3 ' +
      'primeros días (163.2) y mayor si dura más de 15 días (163.3). A verificar',
    textoBoletin:
      'Encerrar o detener a otra persona privándola de su libertad, sin estar legítimamente autorizado ' +
      '(art. 163 CP): p. ej. retenerla contra su voluntad, encerrarla o impedirle marcharse. Es delito de ' +
      'un PARTICULAR (si lo comete una autoridad o funcionario fuera de los casos legales, va por el art. ' +
      '167). La pena baja si se libera en los 3 primeros días y sube si dura más de 15 días (163.3); se ' +
      'agrava en su mitad superior (art. 165) si se simula ser autoridad, la víctima es menor o ' +
      'especialmente vulnerable, o es funcionario en el ejercicio de sus funciones. Se distingue de las ' +
      'coacciones (art. 172): aquí se ataca la LIBERTAD AMBULATORIA (la ' +
      'de moverse o marcharse). NO comete este delito quien sujeta a otra persona para entregarla ' +
      'INMEDIATAMENTE a la autoridad tras sorprenderla en un delito flagrante (art. 490 LECrim; tipo ' +
      'atenuado del art. 163.4). La calificación final corresponde a la autoridad judicial.',
    terminos: [
      'detencion ilegal',
      'lo tienen retenido',
      'la tienen encerrada',
      'secuestro',
      'lo tienen secuestrado',
      'no la dejan salir',
      'retencion contra su voluntad',
      'lo tienen encerrado',
      'privacion de libertad',
      'rehen',
      'tiene un rehen',
      'la ha encerrado',
      'encerrada en casa',
      'no la deja salir de casa',
    ],
    notaRevision:
      'A VERIFICAR el marco de pena y los subtipos: detención ilegal del art. 163.1 CP → prisión de 4 a 6 ' +
      'años → GRAVE (art. 33.2). Subtipos: liberación en los 3 primeros días → pena inferior en grado ' +
      '(163.2); duración superior a 15 días → prisión de 5 a 8 años (163.3). La simulación de autoridad, o ' +
      'que la víctima sea menor, persona con discapacidad necesitada de especial protección o funcionario ' +
      'en el ejercicio, imponen la pena en su MITAD SUPERIOR (art. 165). El secuestro CONDICIONAL (exigir ' +
      'una condición para liberar) es el art. 164, con pena mayor. La detención ilegal por AUTORIDAD o ' +
      'funcionario fuera de los casos legales es el art. 167. El particular que aprehende a otro para ' +
      'presentarlo INMEDIATAMENTE a la autoridad (p. ej. tras sorprender un delito flagrante, art. 490 ' +
      'LECrim) responde por el tipo atenuado del art. 163.4 (multa de 3 a 6 meses). Distinguir ' +
      'de las coacciones (art. 172, `del-coacciones`). Confirmar penas y encaje contra el texto consolidado del CP.',
  }),
  // --- Maltrato animal (Título XVI bis, arts. 340 bis/ter; la LO 3/2023 SUPRIMIÓ el antiguo 337) -----
  construirDelito({
    id: 'del-maltrato-animal',
    articulo: ART_CP_340_BIS,
    tituloCorto: 'Maltrato animal',
    // Art. 340 bis: prisión/multa e inhabilitación → MENOS GRAVE; la muerte del animal sube la pena.
    gravedadCp: 'menos_grave',
    penaTexto:
      'Prisión de 3 a 18 meses o multa de 6 a 12 meses e inhabilitación especial de 1 a 3 años (maltrato ' +
      'con lesión que requiere tratamiento veterinario a animal doméstico o bajo control humano, art. 340 ' +
      'bis CP); si causa la MUERTE, prisión de 12 a 24 meses. Pena menor si el animal es un vertebrado no ' +
      'doméstico. A verificar',
    textoBoletin:
      'Maltratar a un animal doméstico, amansado, domesticado o que viva bajo control humano, por cualquier ' +
      'medio —incluidos los actos de carácter sexual—, causándole una lesión que requiere tratamiento ' +
      'veterinario o un menoscabo grave de su salud (art. 340 bis CP, Título XVI bis introducido por la LO ' +
      '3/2023, que SUPRIMIÓ el antiguo art. 337). Se agrava (mitad superior) por ensañamiento, uso de ' +
      'armas, ante un menor o persona vulnerable, o difundiendo los hechos, y la pena es mayor si el animal ' +
      'MUERE. Si la víctima es un vertebrado NO doméstico, la pena es menor. El maltrato cruel sin lesión ' +
      'que requiera tratamiento es delito leve, y el ABANDONO del animal es el art. 340 ter. Distinto de la ' +
      'infracción ADMINISTRATIVA de bienestar/tenencia (Ley 7/2023 y ordenanzas). La calificación final ' +
      'corresponde a la autoridad judicial.',
    terminos: [
      'maltrato animal',
      'maltrato a un animal',
      'ha pegado al perro',
      'crueldad con animales',
      'ha matado al perro',
      'maltrata a su perro',
      'animal maltratado',
      'pego una paliza al perro',
      'apalear un animal',
      'perro apaleado',
      'peleas de perros',
      'pelea de gallos',
      'envenenar perro',
      'veneno para perros',
      'mataperros',
      'perro atado sin agua ni comida',
      'matar gatos',
      'disparar a un animal',
    ],
    consecuenciasExtra: [
      {
        tipo: 'decomiso',
        textoCorto:
          'Procede valorar la retirada o incautación cautelar del animal para su protección y su ' +
          'entrega a un centro o a la autoridad competente, conforme a las medidas del Título XVI bis ' +
          '(art. 340 quinquies CP) y a la normativa de protección animal. La valoración final corresponde ' +
          'a la autoridad judicial o administrativa.',
        fuente: 'CP art. 340 quinquies; normativa de protección animal',
      },
    ],
    notaRevision:
      'A VERIFICAR las cifras contra el CP con el Título XVI bis VIGENTE (LO 3/2023, que SUPRIMIÓ los arts. ' +
      '337 y 337 bis y creó los arts. 340 bis a 340 quinquies; reforma PENAL en vigor el 18-04-2023, ' +
      'distinta de la Ley 7/2023 de bienestar animal —administrativa, de sep-2023—). Marco base del art. ' +
      '340 bis: animal doméstico/bajo control humano → prisión de 3 a 18 meses o multa de 6 a 12 meses e ' +
      'inhabilitación 1-3 años; MUERTE → prisión de 12 a 24 meses e inhabilitación 2-4 años; vertebrado NO ' +
      'doméstico → marco atenuado (prisión de 3 a 12 meses o multa de 3 a 6 meses; muerte 6-18 meses o ' +
      'multa 18-24). Agravantes del 340 bis en su mitad superior. El maltrato sin lesión que requiera ' +
      'tratamiento es DELITO LEVE (multa 1-2 meses) → rama de detención del art. 495 LECrim. ABANDONO = ' +
      'art. 340 ter. Distinguir del régimen ADMINISTRATIVO (Ley 7/2023 y ordenanzas). Confirmar todas las ' +
      'cifras con el revisor antes de retirar el "a verificar".',
  }),
  // --- OLA DE DELITOS VIOLENTOS Y CONTRA LA LIBERTAD SEXUAL (2026-09-10) --------------------------
  // Contenido MUY sensible (vida, libertad sexual, menores). Lenguaje ORIENTATIVO; la detención la
  // genera el motor; la protección de la víctima va como consecuencia extra. Todo pendiente_revision.
  construirDelito({
    id: 'del-homicidio',
    articulo: ART_CP_138,
    tituloCorto: 'Homicidio',
    gravedadCp: 'grave',
    penaTexto: 'Prisión de 10 a 15 años (homicidio doloso, art. 138.1 CP)',
    textoBoletin:
      'Causar dolosamente la muerte de otra persona (art. 138.1 CP): prisión de 10 a 15 años. La pena se ' +
      'eleva (art. 138.2) cuando concurre alguna circunstancia del art. 140.1 o el hecho es además ' +
      'constitutivo de atentado. Si la muerte se causa por IMPRUDENCIA no es homicidio del 138, sino el ' +
      'delito imprudente del art. 142. La calificación (dolo/imprudencia, homicidio/asesinato) corresponde ' +
      'en exclusiva a la autoridad judicial; el atestado describe hechos, no califica. ' +
      'EN LA ESCENA (orientativo, lo PRIMERO): auxilio a la víctima si hay cualquier signo de vida (aviso ' +
      'sanitario); PRESERVAR la escena sin tocar ni mover nada, acordonar y no pisar; asegurar al presunto ' +
      'autor si está presente; identificar y separar a los testigos; y avisar a la Policía Judicial/Científica ' +
      'y a la comisión judicial para el levantamiento del cadáver. La detención se valora conforme a la LECrim.',
    terminos: [
      'lo mato',
      'le ha matado',
      'homicidio',
      'hay un muerto',
      'una persona muerta',
      'cadaver',
      'muerte sospechosa',
      'muerto a golpes',
      'apuñalado hasta la muerte',
      'le quito la vida',
      'muerte violenta',
      'lo han matado',
    ],
    notaRevision:
      'CONTENIDO MUY SENSIBLE (vida). A VERIFICAR: homicidio doloso art. 138.1 → prisión de 10 a 15 años → ' +
      'GRAVE; subtipo agravado 138.2 (circunstancias del 140.1 o atentado) → pena superior en grado. ' +
      'DISTINGUIR del ASESINATO (139, con alevosía/precio/ensañamiento/para facilitar otro delito) y del ' +
      'HOMICIDIO IMPRUDENTE (142: grave 1-4 años; menos grave multa 3-18 meses). Confirmar penas y encaje ' +
      'contra el texto consolidado del CP antes de retirar el "a verificar".',
  }),
  construirDelito({
    id: 'del-asesinato',
    articulo: ART_CP_139,
    tituloCorto: 'Asesinato',
    gravedadCp: 'grave',
    penaTexto:
      'Prisión de 15 a 25 años (art. 139.1 CP); prisión permanente revisable en los supuestos del art. 140',
    textoBoletin:
      'Matar a otra persona concurriendo alguna circunstancia del art. 139.1 CP: alevosía; precio, ' +
      'recompensa o promesa; ensañamiento; o para facilitar otro delito o evitar su descubrimiento. Pena: ' +
      'prisión de 15 a 25 años, en su mitad superior si concurre más de una circunstancia (139.2). El art. ' +
      '140 impone PRISIÓN PERMANENTE REVISABLE (víctima menor de 16 años o especialmente vulnerable, hecho ' +
      'subsiguiente a un delito contra la libertad sexual, organización criminal, o más de dos víctimas). ' +
      'La calificación (homicidio/asesinato y sus circunstancias) corresponde en exclusiva al juez. ' +
      'EN LA ESCENA (orientativo): mismo protocolo que el homicidio — auxilio si hay signos de vida, ' +
      'PRESERVAR la escena (no tocar, no mover, acordonar), asegurar al presunto autor, separar testigos ' +
      'y avisar a Policía Judicial/Científica y a la comisión judicial para el levantamiento del cadáver.',
    terminos: [
      'asesinato',
      'lo mato a sangre fria',
      'crimen',
      'lo han matado',
      'lo mato por la espalda',
      'ejecucion',
      'sicario',
      'lo mato con saña',
      'asesino a sueldo',
    ],
    notaRevision:
      'CONTENIDO MUY SENSIBLE. A VERIFICAR: asesinato 139.1 → prisión de 15 a 25 años → GRAVE; mitad ' +
      'superior si concurre más de una circunstancia (139.2); art. 140 → PRISIÓN PERMANENTE REVISABLE en ' +
      'sus supuestos. La frontera alevosía/ensañamiento es estrictamente JUDICIAL; el atestado describe, no ' +
      'califica. Confirmar penas y encaje contra el texto consolidado del CP.',
  }),
  construirDelito({
    id: 'del-agresion-sexual',
    articulo: ART_CP_178,
    tituloCorto: 'Agresión sexual (sin consentimiento)',
    // Modelada como GRAVE (recomendación del revisor): la ficha responde a "violación" y la violación
    // del art. 179 es delito GRAVE; modelarla menos_grave infra-orientaría la rama de detención en el
    // caso más grave y operativo. El 178.1 aislado (tocamientos) sería menos grave; lo aclara la nota.
    gravedadCp: 'grave',
    penaTexto:
      'Violación —acceso carnal o introducción de miembros u objetos— (art. 179): prisión de 4 a 12 años ' +
      '(179.1) o de 6 a 12 con violencia/intimidación o voluntad anulada (179.2). Agresión sexual sin ' +
      'acceso carnal: 1 a 4 años (178.1); con violencia/intimidación, 1 a 5 (178.3)',
    textoBoletin:
      'Tras la LO 10/2022 y la LO 4/2023, todo acto que atente contra la libertad sexual de otra persona ' +
      'SIN SU CONSENTIMIENTO es AGRESIÓN SEXUAL (art. 178.1 CP): solo hay consentimiento cuando se ' +
      'manifiesta libremente por actos que expresen de forma clara la voluntad. Son agresión en todo caso ' +
      'los actos con violencia, intimidación, abuso de superioridad o vulnerabilidad, o sobre personas de ' +
      'voluntad anulada, incluida la sumisión química (178.2). Pena base 1-4 años; con violencia/' +
      'intimidación o voluntad anulada, 1-5 años (178.3). El acceso carnal o la introducción de miembros u ' +
      'objetos es VIOLACIÓN (art. 179): 4-12 años (179.1) o 6-12 con violencia/intimidación (179.2). Las ' +
      'agravantes del art. 180 elevan las penas. La ' +
      'calificación final corresponde en exclusiva a la autoridad judicial.',
    terminos: [
      'agresion sexual',
      'abuso sexual',
      'una violacion',
      'me ha violado',
      'la han forzado',
      'intento de violacion',
      'manada',
      'me ha tocado sin permiso',
      'tocamientos',
      'meter mano',
      'sin consentimiento',
      'sumision quimica',
      'le echaron algo en la copa',
    ],
    consecuenciasExtra: [
      {
        tipo: 'proteccion',
        textoCorto:
          'PRIORIDAD la víctima (orientativo): que NO se lave ni cambie de ropa y no beba/coma hasta el ' +
          'examen forense (preservar indicios); NO reiterar la toma de declaración; acompañamiento a la ' +
          'unidad especializada (UFAM) y asistencia sanitaria y psicológica; evitar la revictimización. ' +
          'Procede valorar la orden de protección y las medidas de alejamiento (arts. 544 bis y 544 ter ' +
          'LECrim), que acuerda o ratifica la autoridad judicial.',
        fuente: 'LECrim arts. 544 bis y 544 ter',
      },
    ],
    notaRevision:
      'CONTENIDO MUY SENSIBLE (libertad sexual) — verificado por revisor tras la LO 10/2022 y LO 4/2023. ' +
      'A VERIFICAR (segundo par de ojos): art. 178.1 (cualquier acto sin consentimiento) → 1-4 años → ' +
      'menos grave; 178.3 (violencia/intimidación/voluntad anulada) → 1-5 años; art. 179 VIOLACIÓN → ' +
      '179.1 (acceso carnal/introducción) 4-12 años y 179.2 (con violencia/intimidación o voluntad ' +
      'anulada) 6-12 años, AMBOS GRAVE; art. 180 subtipos agravados. La ficha se MODELA como GRAVE ' +
      '(recomendación del revisor) porque responde a "violación"; el 178.1 aislado (tocamientos) sería ' +
      'menos grave. Confirmar todas las penas y la definición de consentimiento contra el texto ' +
      'consolidado del CP (anclas #a178, #a179, #a180) antes de retirar el "a verificar".',
  }),
  construirDelito({
    id: 'del-agresion-sexual-menor',
    articulo: ART_CP_181,
    tituloCorto: 'Agresión sexual a menor de 16 años',
    gravedadCp: 'grave',
    penaTexto:
      'Prisión de 2 a 6 años (art. 181.1); con acceso carnal, de 8 a 12 años (181.4) o de 12 a 15 (181.2)',
    textoBoletin:
      'Realizar actos de carácter sexual con un menor de dieciséis años (art. 181.1 CP): prisión de 2 a 6 ' +
      'años. Concurriendo alguna modalidad del art. 178.2 (violencia, intimidación, voluntad anulada, abuso de ' +
      'superioridad), 5 a 10 años (181.2). Con acceso carnal o introducción de miembros u objetos, 8 a 12 ' +
      'años (181.4) o 12 a 15 (sobre el 181.2). Hay agravantes (181.5/6) e inhabilitación si el autor es ' +
      'autoridad o funcionario. El consentimiento del menor de 16 años NO exime, salvo la cláusula de ' +
      'proximidad por edad y desarrollo del art. 183 bis. La calificación final corresponde al juez.',
    terminos: [
      'abuso a un menor',
      'tocamientos a un niño',
      'agresion sexual a menor',
      'pederasta',
      'abusan de una niña',
      'abusan de un niño',
      'abuso infantil',
      'actos sexuales con un menor',
      'abuso a una niña',
    ],
    consecuenciasExtra: [
      {
        tipo: 'proteccion',
        textoCorto:
          'Procede valorar de forma PRIORITARIA la protección del menor: comunicación a la autoridad ' +
          'judicial y al Ministerio Fiscal (Fiscalía de Menores) y a los servicios de protección del ' +
          'menor de la comunidad autónoma, medidas de alejamiento (arts. 544 bis/ter LECrim) y asistencia ' +
          'especializada, evitando la revictimización. Las medidas las acuerda o ratifica el juez.',
        fuente: 'LECrim arts. 544 bis y 544 ter; protección de menores',
      },
    ],
    notaRevision:
      'CONTENIDO EXTREMADAMENTE SENSIBLE (menores, libertad sexual) — verificar con máxima prudencia tras ' +
      'la LO 10/2022 y LO 4/2023. A VERIFICAR: 181.1 → 2-6 años; 181.2 → 5-10; 181.4 (acceso carnal) → ' +
      '8-12 (base) o 12-15 (sobre 181.2); agravantes 181.5/6. Es DELITO GRAVE. VERIFICAR además el art. ' +
      '182 (determinar a un menor a participar/presenciar actos sexuales) y la cláusula de proximidad de ' +
      'edad del art. 183 bis (exime entre iguales). Confirmar TODAS las penas con el revisor antes de publicar.',
  }),
  construirDelito({
    id: 'del-trato-degradante',
    articulo: ART_CP_173_1,
    tituloCorto: 'Trato degradante (integridad moral)',
    gravedadCp: 'menos_grave',
    penaTexto: 'Prisión de 6 meses a 2 años (art. 173.1 CP)',
    textoBoletin:
      'Infligir a otra persona un trato degradante, menoscabando gravemente su integridad moral (art. ' +
      '173.1 CP): prisión de 6 meses a 2 años. El mismo artículo castiga el ACOSO LABORAL (actos hostiles ' +
      'o humillantes reiterados prevaliéndose de superioridad) y el ACOSO INMOBILIARIO (actos hostiles ' +
      'para impedir el disfrute legítimo de la vivienda). Se distingue de la tortura del art. 174 (que ' +
      'exige autoridad o funcionario) y de la violencia habitual del art. 173.2. La calificación final ' +
      'corresponde a la autoridad judicial.',
    terminos: [
      'trato degradante',
      'humillacion',
      'vejaciones',
      'acoso laboral',
      'mobbing',
      'acoso inmobiliario',
      'trato inhumano',
      'le humillan',
    ],
    notaRevision:
      'A VERIFICAR: trato degradante del art. 173.1 CP → prisión de 6 meses a 2 años → MENOS GRAVE. ' +
      'Confirmar la redacción de los párrafos de ACOSO LABORAL e INMOBILIARIO del mismo artículo. ' +
      'DISTINGUIR de la tortura (174, por autoridad/funcionario), de la violencia habitual (173.2) y de ' +
      'las lesiones psíquicas (147). Confirmar penas y encaje contra el texto consolidado del CP.',
  }),
  construirDelito({
    id: 'del-torturas',
    articulo: ART_CP_174,
    tituloCorto: 'Torturas (por autoridad o funcionario)',
    gravedadCp: 'grave',
    penaTexto:
      'Prisión de 2 a 6 años (atentado grave) o de 1 a 3 años (no grave), e inhabilitación absoluta de 8 ' +
      'a 12 años (art. 174 CP)',
    textoBoletin:
      'Comete tortura la autoridad o funcionario público que, abusando de su cargo y con el fin de obtener ' +
      'una confesión o información de cualquier persona, o de castigarla por un hecho que haya cometido o se sospeche que ha cometido, o por una razón basada en cualquier tipo de discriminación, somete a ' +
      'una persona a sufrimientos físicos o mentales, a la supresión o disminución de sus facultades, o a ' +
      'condiciones que atenten contra su integridad moral (art. 174 CP). Pena: prisión de 2 a 6 años si el ' +
      'atentado es grave y de 1 a 3 años si no lo es; en ambos casos, inhabilitación absoluta de 8 a 12 ' +
      'años. Alcanza también a funcionarios de instituciones penitenciarias o de centros de menores. La ' +
      'calificación final corresponde en exclusiva a la autoridad judicial.',
    terminos: [
      'torturas',
      'malos tratos policiales',
      'abuso de autoridad con violencia',
      'coaccion para confesar',
      'tortura en comisaria',
      'vejaciones por un funcionario',
      'apremios ilegitimos',
      'tortura',
    ],
    notaRevision:
      'CONTENIDO SENSIBLE (sujeto activo cualificado: autoridad/funcionario). A VERIFICAR: art. 174 CP → ' +
      'prisión de 2 a 6 años (atentado GRAVE) o de 1 a 3 años (no grave), MÁS inhabilitación absoluta de 8 ' +
      'a 12 años. La ficha modela el atentado grave. DISTINGUIR del art. 173.1 (trato degradante por ' +
      'cualquier persona), del art. 175 (integridad moral por autoridad fuera del 174) y del art. 176 ' +
      '(autoridad que la permite por omisión). Confirmar penas contra el texto consolidado del CP.',
  }),
  construirDelito({
    id: 'del-acoso-stalking',
    articulo: ART_CP_172_TER,
    tituloCorto: 'Acoso (stalking)',
    gravedadCp: 'menos_grave',
    penaTexto:
      'Prisión de 3 meses a 2 años o multa de 6 a 24 meses (art. 172 ter); si la víctima es del art. ' +
      '173.2, prisión de 1 a 2 años o trabajos en beneficio de la comunidad',
    textoBoletin:
      'Acosar a una persona de forma insistente y reiterada, sin estar legítimamente autorizado, alterando ' +
      'gravemente el desarrollo de su vida cotidiana, mediante vigilarla, perseguirla o buscar su cercanía; ' +
      'establecer o intentar establecer contacto por cualquier medio o a través de terceros; usar ' +
      'indebidamente sus datos personales; o atentar contra su libertad o patrimonio o el de personas ' +
      'próximas (art. 172 ter CP). La pena se agrava cuando la víctima es o ha sido pareja o pertenece al ' +
      'ámbito del art. 173.2. La calificación final corresponde a la autoridad judicial.',
    terminos: [
      'acoso',
      'stalking',
      'me esta acosando',
      'no para de llamarme',
      'ciberacoso',
      'me persigue',
      'no me deja en paz',
      'aparece donde voy',
      'acecho',
      'acoso a mi expareja',
    ],
    consecuenciasExtra: [
      {
        tipo: 'proteccion',
        textoCorto:
          'En el ámbito de pareja o familiar, procede valorar de forma prioritaria las medidas de ' +
          'protección de la víctima (orden de protección, arts. 544 bis y 544 ter LECrim; valoración ' +
          'policial del riesgo, VioGén). Las medidas las acuerda o ratifica la autoridad judicial.',
        fuente: 'LECrim arts. 544 bis y 544 ter; VPR/VioGén',
      },
    ],
    notaRevision:
      'A VERIFICAR: acoso del art. 172 ter CP → prisión de 3 meses a 2 años o multa de 6 a 24 meses → ' +
      'MENOS GRAVE; modalidad agravada (víctima del art. 173.2) → prisión de 1 a 2 años o TBC. El art. 172 ' +
      'ter fue reformado por la LO 1/2023 (vigor 02-03-2023): añade el subtipo de especial vulnerabilidad y ' +
      'el de creación de perfiles falsos con imagen no consentida (ap. 5). Confirmar el catálogo de conductas ' +
      'y penas contra el texto consolidado del CP. Exige INSISTENCIA/REITERACIÓN y alteración GRAVE de la ' +
      'vida cotidiana; un episodio aislado no basta.',
  }),
  construirDelito({
    id: 'del-revelacion-secretos',
    articulo: ART_CP_197,
    tituloCorto: 'Revelación de secretos y difusión de imágenes íntimas',
    gravedadCp: 'menos_grave',
    penaTexto:
      'Prisión de 1 a 4 años y multa de 12 a 24 meses (art. 197.1); difusión de imágenes íntimas sin ' +
      'consentimiento (art. 197.7), prisión de 3 meses a 1 año o multa de 6 a 12 meses',
    textoBoletin:
      'El art. 197.1 CP castiga a quien, para descubrir los secretos o vulnerar la intimidad de otro y sin ' +
      'su consentimiento, se apodera de sus documentos o efectos, intercepta sus telecomunicaciones o usa ' +
      'artificios de escucha o grabación: prisión de 1 a 4 años y multa de 12 a 24 meses. El art. 197.7 ' +
      'castiga la difusión, sin autorización, de imágenes o grabaciones íntimas obtenidas con anuencia de ' +
      'la víctima en un ámbito privado, cuando su divulgación menoscabe gravemente su intimidad (difusión ' +
      'no consentida de imágenes íntimas): prisión de 3 meses a 1 año o multa de 6 a 12 meses, agravada si ' +
      'la víctima es o ha sido pareja, es menor o con discapacidad, o media ánimo de lucro. La ' +
      'calificación final corresponde a la autoridad judicial.',
    terminos: [
      'difundir fotos intimas',
      'sexting sin permiso',
      'ha colgado mis fotos',
      'ha subido un video mio',
      'packs',
      'ha compartido mis desnudos',
      'revelacion de secretos',
      'espiar el movil',
      'porno venganza',
    ],
    notaRevision:
      'A VERIFICAR: art. 197.1 → prisión de 1 a 4 años y multa de 12 a 24 meses → MENOS GRAVE; art. 197.7 ' +
      '(difusión de imágenes/grabaciones íntimas sin consentimiento) → prisión de 3 meses a 1 año o multa ' +
      'de 6 a 12 meses, agravante (mitad superior) si víctima pareja/expareja, menor o con discapacidad, o ' +
      'ánimo de lucro. Confirmar penas y redacción vigente contra el texto consolidado del CP. La prueba ' +
      'suele ser digital: recordar la regla de no subir datos de terceros al servidor.',
  }),
  // --- OLA DE FRONTERA PENAL (odio, online a menores, falso policía, kamikaze penal) 2026-09-10 ----
  // Cierra fronteras penales que dejaron abiertas otras olas (kamikaze -> 381) y cubre el hueco de
  // delitos ONLINE/actuales (odio 510, grooming 183, pornografia infantil 189). MUY sensible.
  construirDelito({
    id: 'del-conduccion-temeraria-desprecio',
    articulo: ART_CP_381,
    tituloCorto: 'Conducción con manifiesto desprecio por la vida',
    gravedadCp: 'menos_grave',
    penaTexto:
      'Prisión de 2 a 5 años, multa de 12 a 24 meses y privación del derecho a conducir de 6 a 10 años ' +
      '(art. 381.1 CP); si no se puso en concreto peligro la vida/integridad, prisión de 1 a 2 años (381.2)',
    textoBoletin:
      'Conducir con MANIFIESTO DESPRECIO por la vida de los demás realizando la conducción temeraria del ' +
      'art. 380 (temeridad manifiesta poniendo en concreto peligro la vida o integridad de las personas). ' +
      'Es el escalón PENAL superior del kamikaze/sentido contrario cuando se busca o se acepta el choque ' +
      'frontal (art. 381.1). Si con esa conducta NO se pone en concreto peligro la vida o integridad de ' +
      'otro, la pena baja (art. 381.2). Frontera: el art. 380 (temeraria con concreto peligro) es el ' +
      'escalón inferior. La calificación final corresponde a la autoridad judicial.',
    terminos: [
      'kamikaze',
      'sentido contrario en autopista',
      'va de frente contra los coches',
      'conducir contra direccion aposta',
      'quiere provocar un choque',
      'conductor suicida',
      'va a matar a alguien con el coche',
      'circula por el carril contrario',
    ],
    consecuenciasExtra: [
      {
        tipo: 'inmovilizacion',
        textoCorto:
          'Procede valorar la inmovilización del vehículo mientras persista la situación de riesgo (art. ' +
          '104 LSV) y la intervención del permiso de conducción.',
        fuente: 'LSV art. 104',
      },
      {
        tipo: 'retirada_permiso',
        textoCorto:
          'El delito lleva aparejada la privación del derecho a conducir de 6 a 10 años, que impone el ' +
          'juez (art. 381.1 CP); procede valorar la intervención cautelar del permiso.',
        fuente: 'CP art. 381.1',
      },
    ],
    notaRevision:
      'A VERIFICAR pena y deslinde 380/381. Art. 381.1 → prisión 2-5 años + multa 12-24 meses + privación ' +
      'de conducir 6-10 años (manifiesto desprecio por la vida + conducta del 380). Art. 381.2 → 1-2 años ' +
      'si no se puso en concreto peligro. Ambos MENOS GRAVE (art. 33.3). Enlaza con la ficha de tráfico ' +
      '"sentido contrario/kamikaze". Confirmar con el revisor contra el CP.',
  }),
  construirDelito({
    id: 'del-odio-discriminacion',
    articulo: ART_CP_510,
    tituloCorto: 'Delito de odio / discriminación',
    gravedadCp: 'menos_grave',
    penaTexto:
      'Prisión de 1 a 4 años y multa de 6 a 12 meses (art. 510.1); prisión de 6 meses a 2 años en los ' +
      'supuestos del 510.2; persona jurídica: multa de 2 a 5 años (art. 510 bis)',
    textoBoletin:
      'Fomentar, promover o incitar públicamente al odio, la hostilidad, la discriminación o la violencia ' +
      'contra un grupo o una persona por motivos racistas, antisemitas, de ideología, religión, etnia, ' +
      'origen, sexo, orientación o identidad sexual, edad, enfermedad o discapacidad, entre otros, o ' +
      'producir/difundir material con ese contenido (art. 510.1). El 510.2 castiga la humillación o el ' +
      'enaltecimiento. La pena sube (mitad superior) si se difunde por medios o internet y cuando sea ' +
      'idóneo para alterar la paz pública. Cuidado con el deslinde con la libertad de expresión. La ' +
      'calificación final corresponde a la autoridad judicial.',
    terminos: [
      'delito de odio',
      'pintadas racistas',
      'insultos racistas',
      'amenazas homofobas',
      'incitar al odio',
      'mensajes de odio en redes',
      'agresion por ser gay',
      'discriminacion',
    ],
    notaRevision:
      'A VERIFICAR penas y encaje. Art. 510.1 → 1-4 años y multa 6-12 meses; 510.2 → 6 meses-2 años; ' +
      'agravaciones 510.3 (medios/internet), 510.4 (paz pública), 510.5, 510.6 (comiso); 510 bis (persona ' +
      'jurídica, multa 2-5 años). Modela el tipo básico → MENOS GRAVE. El revisor debe cuidar el lenguaje ' +
      'orientativo y el deslinde con la libertad de expresión. Fuente: CP arts. 510 y 510 bis.',
  }),
  construirDelito({
    id: 'del-grooming-menores',
    articulo: ART_CP_183,
    tituloCorto: 'Ciberacoso sexual a menor (grooming)',
    gravedadCp: 'menos_grave',
    penaTexto:
      'Prisión de 1 a 3 años o multa de 12 a 24 meses, en su mitad superior si media coacción, ' +
      'intimidación o engaño (art. 183 CP), sin perjuicio de las penas de los delitos sexuales cometidos',
    textoBoletin:
      'Contactar con un menor de dieciséis años por internet, teléfono o cualquier tecnología y proponerle ' +
      'un encuentro para cometer un delito sexual, con un acto material de acercamiento (art. 183.1); o ' +
      'embaucarle para que facilite material pornográfico o le muestre imágenes pornográficas (art. 183.2). ' +
      'Es un delito de PELIGRO: se castiga el acercamiento con fines sexuales aunque no llegue a haber ' +
      'contacto físico. Máxima cautela con la prueba digital (dispositivos, conversaciones). La ' +
      'calificación final corresponde a la autoridad judicial.',
    terminos: [
      'grooming',
      'un adulto contacta con un menor por internet',
      'le pide fotos a una menor',
      'ciberacoso sexual',
      'contacto sexual con menor por redes',
      'acoso a menor por whatsapp',
      'quiere quedar con una nina',
      'adulto se hace pasar por nino',
    ],
    consecuenciasExtra: [
      {
        tipo: 'proteccion',
        textoCorto:
          'Procede valorar medidas de protección del menor (prohibición de aproximación y comunicación, ' +
          'art. 544 bis LECrim) y la comunicación inmediata al Ministerio Fiscal / juzgado y a la unidad ' +
          'especializada. Lo acuerda la autoridad judicial.',
        fuente: 'LECrim art. 544 bis; art. 773 (Fiscal)',
      },
    ],
    notaRevision:
      'MUY SENSIBLE. A VERIFICAR numeración y penas. Tras la LO 10/2022 el grooming es el art. 183 CP ' +
      '(183.1 propuesta de encuentro + acto material; 183.2 embaucamiento para material pornográfico). ' +
      'Pena base 1-3 años o multa 12-24 meses; mitad superior con coacción/intimidación/engaño; sin ' +
      'perjuicio de los delitos sexuales cometidos. NO confundir con el art. 183 bis (proximidad de edad) ' +
      'ni con la antigua numeración 183 ter. MENOS GRAVE. Lenguaje orientativo estricto. Fuente: CP art. 183.',
  }),
  construirDelito({
    id: 'del-pornografia-infantil',
    articulo: ART_CP_189,
    tituloCorto: 'Pornografía infantil',
    gravedadCp: 'menos_grave',
    penaTexto:
      'Prisión de 1 a 5 años (producción/difusión, art. 189.1); de 5 a 9 años en los agravados (art. ' +
      '189.2); posesión para uso propio o acceso a sabiendas: prisión de 3 meses a 1 año o multa (189.5)',
    textoBoletin:
      'Captar o utilizar a menores o personas con discapacidad con fines pornográficos, y producir, vender, ' +
      'distribuir, difundir, exhibir o facilitar material pornográfico elaborado con ellos, así como su ' +
      'financiación (art. 189.1). Se agrava (art. 189.2) cuando el material usa a menores de dieciséis años ' +
      'o tiene carácter degradante o violento. La mera posesión para uso propio y el acceso a sabiendas se ' +
      'castigan aparte (art. 189.5). Extrema la cautela con los soportes y la cadena de custodia. La ' +
      'calificación final corresponde a la autoridad judicial.',
    terminos: [
      'pornografia infantil',
      'pedofilia',
      'fotos de menores',
      'videos de abusos a ninos',
      'material de abuso sexual infantil',
      'tiene imagenes de ninos en el movil',
      'difusion de pornografia infantil',
      'descargar pornografia de menores',
    ],
    consecuenciasExtra: [
      {
        tipo: 'decomiso',
        textoCorto:
          'Procede valorar la intervención y puesta a disposición judicial de los dispositivos y soportes ' +
          '(móvil, ordenador, discos) como piezas de convicción y efectos del delito, con especial ' +
          'cuidado de la cadena de custodia (arts. 334 y 338 LECrim; comiso, art. 127 CP).',
        fuente: 'LECrim arts. 334 y 338; CP art. 127',
      },
    ],
    notaRevision:
      'MUY SENSIBLE. A VERIFICAR penas y subtipo. Art. 189.1 → 1-5 años → MENOS GRAVE; art. 189.2 ' +
      '(agravados: menor de 16, degradante/violento, organización…) → 5-9 años → GRAVE (cambia la rama de ' +
      'detención); art. 189.5 (posesión/acceso) → 3 meses-1 año o multa. La ficha modela el tipo básico ' +
      '(189.1). El revisor decide si separa el agravado 189.2 en ficha propia. Lenguaje orientativo ' +
      'estricto. Fuente: CP art. 189.',
  }),
  construirDelito({
    id: 'del-exhibicionismo',
    articulo: ART_CP_185,
    tituloCorto: 'Exhibicionismo y provocación sexual',
    gravedadCp: 'menos_grave',
    penaTexto: 'Prisión de 6 meses a 1 año o multa de 12 a 24 meses (arts. 185 y 186 CP)',
    textoBoletin:
      'Ejecutar o hacer ejecutar actos de exhibición obscena ante menores de edad o personas con ' +
      'discapacidad necesitadas de especial protección (art. 185), o vender, difundir o exhibir material ' +
      'pornográfico entre esas personas (art. 186). No hay contacto físico: se castiga exponer al menor o a ' +
      'la persona con discapacidad a la conducta obscena o al material. Se distingue de la agresión sexual ' +
      '(178-181, hay acto sexual) y de la pornografía infantil (189). La calificación final es del juez.',
    terminos: [
      'exhibicionista',
      'se ha bajado los pantalones delante de ninos',
      'se masturba en publico',
      'ensena sus partes a menores',
      'un tio ensenandose en el parque',
      'provocacion sexual a menores',
      'ensena porno a ninos',
      'exhibicionismo',
    ],
    consecuenciasExtra: [
      {
        tipo: 'proteccion',
        textoCorto:
          'Cuando la víctima es menor o persona con discapacidad, procede valorar medidas de protección ' +
          '(prohibición de aproximación, art. 544 bis LECrim) y la comunicación al Ministerio Fiscal.',
        fuente: 'LECrim art. 544 bis',
      },
    ],
    notaRevision:
      'A VERIFICAR penas. Arts. 185 y 186 CP → prisión 6 meses-1 año o multa 12-24 meses → MENOS GRAVE. ' +
      'Distinguir de la agresión sexual (178-181) y de la pornografía infantil (189). Fuente: CP 185/186.',
  }),
  construirDelito({
    id: 'del-simulacion-delito',
    articulo: ART_CP_457,
    tituloCorto: 'Denuncia falsa / simulación de delito',
    gravedadCp: 'menos_grave',
    penaTexto: 'Multa de 6 a 12 meses (art. 457 CP)',
    textoBoletin:
      'Simular ante un funcionario judicial o administrativo (p. ej. un agente) ser responsable o víctima ' +
      'de una infracción penal, o denunciar una inexistente, provocando actuaciones procesales (art. 457). ' +
      'Es el clásico de comisaría: la denuncia inventada de un robo que no existió (a menudo para el seguro) ' +
      'o la agresión simulada. IMPORTANTE: al llevar solo pena de MULTA, la detención es EXCEPCIONAL (art. ' +
      '495 LECrim). Si se imputa falsamente a una PERSONA CONCRETA, es acusación/denuncia falsas del art. ' +
      '456. La calificación final corresponde a la autoridad judicial.',
    terminos: [
      'denuncia falsa',
      'se ha inventado el robo',
      'simula un robo para el seguro',
      'denuncia un robo que no existio',
      'finge que le han atracado',
      'denunciar en falso',
      'invento que le robaron el movil',
      'autolesion para denunciar',
    ],
    notaRevision:
      'A VERIFICAR pena y deslinde 456/457, y el COMPORTAMIENTO DEL MOTOR DE DETENCIÓN: el art. 457 es ' +
      'pena de MULTA (6-12 meses), por lo que la detención es excepcional (art. 495 LECrim: no procede por ' +
      'delitos solo con pena de multa salvo domicilio desconocido o falta de garantías). El revisor debe ' +
      'confirmar que la ficha NO sobre-oriente a detener. Si se imputa a persona concreta → art. 456 ' +
      '(acusación y denuncia falsas), que exige sentencia firme o sobreseimiento previos. Fuente: CP 456/457.',
  }),
  construirDelito({
    id: 'del-sustraccion-menores',
    articulo: ART_CP_225_BIS,
    tituloCorto: 'Sustracción de menores (por un progenitor)',
    gravedadCp: 'menos_grave',
    penaTexto:
      'Prisión de 2 a 4 años e inhabilitación especial para la patria potestad de 4 a 10 años (art. 225 ' +
      'bis CP); mitad superior si el menor sale de España o se exige condición para su restitución',
    textoBoletin:
      'El progenitor que, sin causa justificada, sustrae a su hijo menor: lo traslada de su residencia ' +
      'habitual sin el consentimiento del otro progenitor o de quien tenga su guarda, o lo retiene ' +
      'incumpliendo gravemente lo acordado por resolución judicial o administrativa (art. 225 bis). Es el ' +
      'conflicto de custodia que se convierte en delito. La pena se atenúa si comunica el paradero del ' +
      'menor en 24 horas o lo restituye en 15 días. La calificación final corresponde al juez.',
    terminos: [
      'sustraccion de menores',
      'el padre se ha llevado al nino',
      'no devuelve al nino a la madre',
      'se lleva al hijo sin permiso',
      'secuestro parental',
      'no lo trae despues de la visita',
      'se ha ido con el nino al extranjero',
      'incumple las visitas llevandose al menor',
    ],
    consecuenciasExtra: [
      {
        tipo: 'proteccion',
        textoCorto:
          'Procede valorar la comunicación inmediata al juzgado (de familia y/o de guardia) y al ' +
          'Ministerio Fiscal y las medidas civiles urgentes de restitución y protección del menor (art. ' +
          '158 CC), además de activar el protocolo de menor desaparecido cuando proceda.',
        fuente: 'CC art. 158; LECrim art. 544 bis',
      },
    ],
    notaRevision:
      'A VERIFICAR pena y modalidades. Art. 225 bis → prisión 2-4 años + inhabilitación patria potestad ' +
      '4-10 años; mitad superior si sale de España o se exige condición. Atenuaciones: comunicar paradero ' +
      'en 24 h o restituir en 15 días. Sujeto activo: el progenitor (ascendientes/parientes hasta 2º grado ' +
      'se equiparan, 225 bis.5). MENOS GRAVE. La "protección" aquí es más medida civil (158 CC) que orden ' +
      'del 544 ter: confirmar con el revisor. Fuente: CP art. 225 bis.',
  }),
  construirDelito({
    id: 'del-allanamiento-establecimiento',
    articulo: ART_CP_203,
    tituloCorto: 'Allanamiento de local, oficina o establecimiento',
    gravedadCp: 'menos_grave',
    penaTexto:
      'Prisión de 6 meses a 1 año y multa de 6 a 10 meses (art. 203.1); multa de 1 a 3 meses por ' +
      'mantenerse fuera de horas (203.2); prisión de 6 meses a 3 años con violencia o intimidación (203.3)',
    textoBoletin:
      'Entrar contra la voluntad de su titular en el domicilio de una persona jurídica, un despacho u ' +
      'oficina, o un establecimiento o local abierto al público fuera de las horas de apertura (art. ' +
      '203.1); o mantenerse en ellos, fuera del horario, contra la voluntad del titular (203.2). Con ' +
      'violencia o intimidación, la pena es mayor (203.3). Se distingue del allanamiento de MORADA (art. ' +
      '202, vivienda) y de la usurpación/ocupación de inmueble (art. 245). La calificación final es del juez.',
    terminos: [
      'allanamiento de local',
      'se ha colado en una oficina',
      'entra en un comercio cerrado',
      'okupas en una nave',
      'se mete en un local fuera de horario',
      'no quiere salir del local cerrado',
      'entra en la empresa sin permiso',
      'invasion de establecimiento',
    ],
    notaRevision:
      'A VERIFICAR penas. Art. 203.1 → prisión 6 meses-1 año y multa 6-10 meses; 203.2 → multa 1-3 meses; ' +
      '203.3 → prisión 6 meses-3 años (violencia/intimidación). MENOS GRAVE. Deslinde con art. 202 (morada), ' +
      '245 (usurpación de inmueble no morada) y 557 bis (invasión en grupo). Fuente: CP art. 203.',
  }),
  construirDelito({
    id: 'del-usurpacion-funciones',
    articulo: ART_CP_402,
    tituloCorto: 'Usurpación de funciones (falso policía) e intrusismo',
    gravedadCp: 'menos_grave',
    penaTexto:
      'Usurpación de funciones públicas: prisión de 1 a 3 años (art. 402). Intrusismo: multa de 12 a 24 ' +
      'meses o de 6 a 12 meses, o prisión de 6 meses a 2 años en el agravado (art. 403)',
    textoBoletin:
      'Usurpación de funciones (art. 402): ejercer ilegítimamente actos propios de una autoridad o ' +
      'funcionario atribuyéndose carácter oficial (el clásico "falso policía"). Intrusismo (art. 403): ' +
      'ejercer actos propios de una profesión sin el título académico u oficial exigido (falso médico, ' +
      'falso abogado), agravado si se anuncia como profesional o abre local al público. El uso indebido de ' +
      'uniforme o insignia oficial es el art. 402 bis. La calificación final corresponde al juez.',
    terminos: [
      'se hace pasar por policia',
      'falso policia',
      'suplanta a un agente',
      'ejerce de medico sin serlo',
      'falso abogado',
      'intrusismo',
      'lleva placa falsa de policia',
      'se hace pasar por funcionario',
    ],
    consecuenciasExtra: [
      {
        tipo: 'decomiso',
        textoCorto:
          'Procede valorar la intervención de los efectos empleados para aparentar el carácter oficial o ' +
          'profesional (placas, uniformes, distintivos, documentación) como piezas de convicción y efectos ' +
          'del delito (arts. 334 y 338 LECrim; comiso, art. 127 CP).',
        fuente: 'LECrim arts. 334 y 338; CP art. 127',
      },
    ],
    notaRevision:
      'A VERIFICAR penas y deslinde. Art. 402 (usurpación de funciones) → prisión 1-3 años; art. 402 bis ' +
      '(uso indebido de uniforme/insignia oficial) → multa, típico del "falso policía" —valorar mención—; ' +
      'art. 403 (intrusismo) → multa 12-24 meses (sin título académico), multa 6-12 meses (sin título ' +
      'oficial), o prisión 6 meses-2 años en el agravado. MENOS GRAVE. Fuente: CP arts. 402, 402 bis y 403.',
  }),
];

/** Estructura completa del seed penal lista para combinar con el resto de contenido. */
export const SEED_PENAL: SeedContenido = {
  normas: NORMAS_PENAL_SEED,
  articulos: ARTICULOS_PENAL_SEED,
  infracciones: INFRACCIONES_PENAL_SEED,
};
