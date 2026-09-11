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
const FECHA_ACTUALIZACION = '2026-09-07';
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
    'sanción por tramos del art. 80 (grave 10.001-50.000 €). DESLINDE PENAL: si del abandono se deriva un ' +
    'riesgo para la vida o integridad del animal, el hecho puede ser DELITO del art. 340 ter CP. Resumen ' +
    'orientativo; consúltese el BOE.',
});

const ART_LBA_IDENTIFICACION = articuloSeed({
  normaId: ID_LBA,
  numero: '74.b',
  titulo: 'Bienestar animal: identificación y registro (infracción grave)',
  texto:
    'La Ley 7/2023 tipifica como infracción GRAVE (art. 74.b) mantener sin identificar (microchip) o sin ' +
    'registrar a un animal de compañía sujeto a ello, con la sanción del art. 80. Es el deber ESTATAL de ' +
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
    'sufrimiento sin llegar a la lesión que requiera tratamiento (sanción del art. 80). Las infracciones muy ' +
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

export const ARTICULOS_EXTRANJERIA_LOCAL_SEED: Articulo[] = [
  ART_LOEX_53,
  ART_LOEX_53_TRABAJO,
  ART_LOEX_54_1_D,
  ART_LOEX_52_B,
  ART_LOEX_52_A,
  ART_LOEX_4,
  ART_LOEX_58_3_A,
  ART_LOEX_53_1_G,
  ART_PPP_13,
  ART_LBA_ABANDONO,
  ART_LBA_IDENTIFICACION,
  ART_LBA_MALTRATO,
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
    // referencia; en la estancia irregular la sanción PRINCIPAL suele ser la expulsión (art. 57).
    importeEur: 501,
    importeReducidoEur: null,
    textoBoletin:
      'Encontrarse irregularmente en territorio español (sin autorización de estancia o residencia, ' +
      'o con ella caducada más de tres meses sin solicitar renovación). Es una infracción GRAVE ' +
      'ADMINISTRATIVA del art. 53.1.a LO 4/2000. MENSAJE CLAVE: la estancia irregular NO es delito y ' +
      'NO procede detención penal por ella; su tratamiento es administrativo y la sanción principal ' +
      'suele ser la expulsión (arts. 57 y 58 LO 4/2000), no la multa. La detención cautelar del ' +
      'expediente de expulsión tiene requisitos y plazos propios (art. 61) y la acuerda la autoridad ' +
      'competente. La valoración final corresponde a la autoridad administrativa/judicial.',
    terminos: [
      'estancia irregular',
      'sin papeles',
      'situacion irregular',
      'irregular en españa',
      'extranjero sin papeles',
      'sin permiso de residencia',
      'residencia caducada',
      'sin autorizacion de residencia',
      'inmigrante irregular',
      'sin documentacion de extranjero',
    ],
    cuerposCompetentes: ['guardia_civil', 'policia_nacional', 'policia_local'],
    consecuencias: [
      {
        tipo: 'identificacion',
        textoCorto:
          'Procede la identificación y la comprobación documental; la estancia irregular se tramita ' +
          'por vía administrativa (multa o expulsión, arts. 57/58 LO 4/2000). NO procede la ' +
          'detención penal por la mera situación irregular; cualquier medida cautelar de internamiento ' +
          'la acuerda la autoridad competente con los requisitos del art. 61 y ss.',
        fuente: 'LO 4/2000 arts. 53, 57, 58 y 61',
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
      'sin documentacion encima',
      'no lleva el nie',
      'olvido la tarjeta',
      'sin pasaporte encima',
      'no lleva la tie',
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
      'ENTRADA CONSULTABLE (deslinde): la obligación de portar la documentación es del art. 4 LO 4/2000, ' +
      'pero NO llevarla encima no es sin más infracción grave. Modelada como no_sancionador (sin importe). ' +
      'MENSAJE CLAVE a preservar. Confirmar con el revisor jurídico.',
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
    tituloCorto: 'Perro peligroso (PPP) sin licencia ni registro',
    gravedad: 'muy_grave',
    // Ley 50/1999 art. 13.5: muy graves, de 2.404,06 a 15.025,30 €. Se fija el mínimo del tramo.
    importeEur: 2404.06,
    importeReducidoEur: null,
    textoBoletin:
      'Tener un animal potencialmente peligroso (perro de raza o características de PPP) careciendo ' +
      'de la licencia administrativa preceptiva o sin haberlo inscrito en el Registro de Animales ' +
      'Potencialmente Peligrosos. Es infracción MUY GRAVE de la Ley 50/1999 (art. 13.1), sancionable ' +
      'con multa y, en su caso, comiso del animal. La valoración final corresponde a la autoridad competente.',
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
      'A VERIFICAR importe y clasificación: carecer de licencia o de inscripción registral del PPP ' +
      'es MUY GRAVE (Ley 50/1999 art. 13.1), multa de 2.404,06 a 15.025,30 € (art. 13.5); el seed ' +
      'fija el mínimo del tramo. La lista de razas y el desarrollo están en el RD 287/2002. Muchas ' +
      'competencias sancionadoras y matices los fija la ORDENANZA MUNICIPAL y la normativa autonómica ' +
      '(incluida la Ley 7/2023 de bienestar animal). Confirmar con el revisor jurídico antes de publicar.',
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
      'A VERIFICAR importe y clasificación: llevar el PPP sin bozal/correa o suelto en la vía pública ' +
      'es GRAVE (Ley 50/1999 art. 13.2), multa de 300,52 a 2.404,05 € (art. 13.5); el seed fija el ' +
      'mínimo del tramo. Las medidas concretas (bozal, correa ≤ 2 m no extensible, un animal por ' +
      'persona) y las cuantías las suele detallar la ORDENANZA MUNICIPAL. A VERIFICAR también el ' +
      'ASEGURAMIENTO/intervención cautelar del animal (orientativo, art. 13 y RD 287/2002). Confirmar ' +
      'con el revisor jurídico.',
  }),
  // --- OLA DE ANIMALES (2026-09-11): bienestar animal (Ley 7/2023) + PPP (Ley 50/1999) ----------
  construirInfraccion({
    id: 'animal-abandono',
    articulo: ART_LBA_ABANDONO,
    tituloCorto: 'Abandono de un animal de compañía',
    gravedad: 'grave',
    // Ley 7/2023 art. 80: graves 10.001-50.000 €. Mínimo del tramo como referencia.
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
        fuente: 'Ley 7/2023 art. 80',
      },
    ],
    marcoImporte: 'bienestar_animal',
    notaRevision:
      'A VERIFICAR clasificación (leve/grave/muy grave, arts. 74-76) e importe del art. 80 (grave ' +
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
        fuente: 'Ley 7/2023 arts. 74 y 80',
      },
    ],
    marcoImporte: 'bienestar_animal',
    notaRevision:
      'A VERIFICAR la frontera leve/grave y el importe del art. 80 (el seed usa el mínimo grave 10.001 €; ' +
      'podría ser leve 500 € si es subsanable). Deslindar del CENSO municipal (`ord-sctf-perro-sin-censar`): ' +
      'esta es la identificación ESTATAL. La Ley 7/2023 amplía la identificación a más especies. Revisor.',
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
        fuente: 'Ley 7/2023 arts. 75 y 80',
      },
    ],
    marcoImporte: 'bienestar_animal',
    notaRevision:
      'Punto SENSIBLE: el deslinde con el art. 340 bis CP (la frontera es "lesión que requiere tratamiento ' +
      'veterinario / menoscabo grave"). No solaparse con la ficha penal `del-maltrato-animal`. A VERIFICAR ' +
      'clasificación e importe del art. 80. Revisor jurídico obligatorio.',
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
        fuente: 'Ley 7/2023 arts. 75 y 80',
      },
    ],
    marcoImporte: 'bienestar_animal',
    notaRevision:
      'Ficha SENSIBLE por el componente de URGENCIA. A VERIFICAR clasificación e importe (art. 80) y el ' +
      'deslinde penal (riesgo para la vida → 340 ter; lesión/muerte → 340 bis CP). Revisor jurídico.',
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
        fuente: 'Ley 7/2023 arts. 74, 75 y 80',
      },
    ],
    marcoImporte: 'bienestar_animal',
    notaRevision:
      'A VERIFICAR la frontera leve/grave y el importe (art. 80; el seed usa el mínimo grave). Deslinde con ' +
      'el maltrato (`animal-maltrato-sin-lesion`) y con el delito 340 bis si hay menoscabo grave. Revisor.',
  }),
  construirInfraccion({
    id: 'ppp-sin-seguro',
    articulo: ART_PPP_13,
    tituloCorto: 'Perro peligroso (PPP) sin seguro de responsabilidad civil',
    gravedad: 'grave',
    // Ley 50/1999 art. 13.5: graves 300,52-2.404,05 €. Mínimo del tramo.
    importeEur: 300.52,
    importeReducidoEur: null,
    textoBoletin:
      'Tener un animal potencialmente peligroso careciendo del seguro de responsabilidad civil por daños a ' +
      'terceros exigido para su tenencia (Ley 50/1999 y RD 287/2002). El seguro es requisito de la licencia; ' +
      'su falta se sanciona como infracción grave. La valoración final corresponde a la autoridad competente.',
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
      'A VERIFICAR (revisor de animales): la falta de seguro NO está tipificada específicamente en el art. ' +
      '13; el seguro es requisito de la licencia (RD 287/2002 art. 3). La gravedad "grave 300,52 €" carece ' +
      'de fuente directa: podría ser MUY GRAVE (13.1, si invalida la licencia) o LEVE (13.4), o elevarla la ' +
      'ORDENANZA municipal. Reclasificar tras el visto bueno del revisor.',
  }),
  construirInfraccion({
    id: 'ppp-menor-conduciendo',
    articulo: ART_PPP_13,
    tituloCorto: 'PPP conducido por un menor de edad',
    gravedad: 'grave',
    importeEur: 300.52,
    importeReducidoEur: null,
    textoBoletin:
      'Permitir que un animal potencialmente peligroso sea conducido o manejado en lugares públicos por una ' +
      'persona menor de edad. La tenencia y conducción de PPP exige licencia, reservada a mayores de edad ' +
      '(Ley 50/1999 y RD 287/2002). La valoración final corresponde a la autoridad competente.',
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
      'A VERIFICAR (revisor de animales): conducir un PPP siendo menor no figura literal en el art. 13.2; la ' +
      'exigencia de mayoría de edad es del RD 287/2002 art. 3. La gravedad "grave" carece de apoyo directo: ' +
      'probable LEVE (13.4) o vía ordenanza (salvo lectura de "conducción sin licencia"). Reclasificar con el revisor.',
  }),
  construirInfraccion({
    id: 'ppp-mas-de-uno',
    articulo: ART_PPP_13,
    tituloCorto: 'Más de un PPP por persona en la vía pública',
    gravedad: 'grave',
    importeEur: 300.52,
    importeReducidoEur: null,
    textoBoletin:
      'Llevar a más de un animal potencialmente peligroso por persona simultáneamente en lugares públicos, ' +
      'incumpliendo las medidas de seguridad exigidas (RD 287/2002). La valoración final corresponde a la ' +
      'autoridad competente.',
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
      'A VERIFICAR (revisor de animales): "un perro por persona" (RD 287/2002 art. 8) no figura en la lista ' +
      'de graves del art. 13.2; la gravedad "grave" carece de apoyo directo: probable LEVE (13.4) o vía ' +
      'ordenanza. Reclasificar con el revisor.',
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
      'A VERIFICAR el apartado e importe (art. 13.5, mínimo grave 300,52 €); condiciones de transporte en el ' +
      'RD 287/2002. Revisor.',
  }),
];

/** Estructura completa del seed lista para combinar con el resto de contenido. */
export const SEED_EXTRANJERIA_LOCAL: SeedContenido = {
  normas: NORMAS_EXTRANJERIA_LOCAL_SEED,
  articulos: ARTICULOS_EXTRANJERIA_LOCAL_SEED,
  infracciones: INFRACCIONES_EXTRANJERIA_LOCAL_SEED,
};
