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

export const ARTICULOS_EXTRANJERIA_LOCAL_SEED: Articulo[] = [
  ART_LOEX_53,
  ART_LOEX_53_TRABAJO,
  ART_PPP_13,
];

// --- Constructor de una infracción administrativa con sus sinónimos y consecuencias ---------
interface InfraccionSeedInput {
  id: string;
  articulo: Articulo;
  tituloCorto: string;
  gravedad: Infraccion['gravedad'];
  importeEur: number;
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
      'y cierre; posible delito del art. 311 bis CP si es reiterado). ' +
      'MENSAJE CLAVE a preservar: es infracción ADMINISTRATIVA, NO delito; NO procede detención penal ' +
      'por ella. Punto jurídicamente sensible: confirmar toda la redacción con el revisor jurídico antes ' +
      'de publicar.',
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
];

/** Estructura completa del seed lista para combinar con el resto de contenido. */
export const SEED_EXTRANJERIA_LOCAL: SeedContenido = {
  normas: NORMAS_EXTRANJERIA_LOCAL_SEED,
  articulos: ARTICULOS_EXTRANJERIA_LOCAL_SEED,
  infracciones: INFRACCIONES_EXTRANJERIA_LOCAL_SEED,
};
