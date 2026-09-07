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
    'Castiga a quienes, actuando en grupo y con el fin de atentar contra la paz pública, alteren el ' +
    'orden público causando lesiones a las personas, produciendo daños en las propiedades, ' +
    'obstaculizando las vías públicas o los accesos de emergencia de forma peligrosa, o invadiendo ' +
    'instalaciones o edificios. Existen tipos agravados (art. 557 bis: porte de armas, actos de ' +
    'violencia con peligro para la vida, actuación en multitud que facilita la impunidad, etc.). La ' +
    'alteración de menor entidad puede ser infracción administrativa (art. 36.1/36.3 LO 4/2015). ' +
    'Resumen orientativo; consúltese el texto consolidado en el BOE.',
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

export const ARTICULOS_PENAL_SEED: Articulo[] = [
  ART_CP_234,
  ART_CP_242,
  ART_CP_147,
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

  return {
    infraccion,
    sinonimos,
    consecuencias: [consecuencia],
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
      'coaccion',
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
    // Art. 557 (actuar en grupo alterando la paz pública con violencia sobre personas/cosas):
    // prisión de 6 meses a 3 años → MENOS GRAVE; agravados del art. 557 bis pueden elevarse.
    gravedadCp: 'menos_grave',
    penaTexto:
      'Prisión de 6 meses a 3 años (desórdenes públicos en grupo, art. 557 CP); tipos agravados del ' +
      'art. 557 bis (armas, peligro para la vida, etc.). A verificar',
    textoBoletin:
      'Actuar en grupo y con el fin de atentar contra la paz pública alterando el orden mediante ' +
      'violencia sobre las personas o las cosas: causar lesiones, producir daños, obstaculizar de ' +
      'forma peligrosa las vías o los accesos de emergencia, o invadir instalaciones o edificios ' +
      '(art. 557 CP). La alteración de menor entidad, sin llegar a delito, puede ser infracción ' +
      'administrativa (art. 36.1/36.3 LO 4/2015). La calificación final corresponde a la autoridad judicial.',
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
      'A VERIFICAR el marco de pena y el encaje: desórdenes públicos del art. 557 CP → prisión de 6 ' +
      'meses a 3 años → MENOS GRAVE; los tipos agravados del art. 557 bis (porte de armas u objetos ' +
      'peligrosos, actos de violencia con peligro para la vida, aprovechar la multitud para asegurar ' +
      'la impunidad, etc.) elevan la pena y podrían pasar a GRAVE, cambiando la rama de detención. ' +
      'DISTINGUIR de la infracción administrativa de desórdenes (art. 36.1/36.3 LO 4/2015), que exige ' +
      'alteración grave de la seguridad ciudadana SIN llegar a delito. Confirmar penas y encaje contra ' +
      'el texto consolidado del CP con el revisor jurídico.',
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
];

/** Estructura completa del seed penal lista para combinar con el resto de contenido. */
export const SEED_PENAL: SeedContenido = {
  normas: NORMAS_PENAL_SEED,
  articulos: ARTICULOS_PENAL_SEED,
  infracciones: INFRACCIONES_PENAL_SEED,
};
