import {
  Articulo,
  Consecuencia,
  Infraccion,
  Norma,
  Sinonimo,
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
];

// --- Artículos citados (resúmenes neutros propios) ------------------------------------------
interface ArticuloSeedInput {
  numero: string;
  titulo: string;
  texto: string;
}

function articuloLosc({ numero, titulo, texto }: ArticuloSeedInput): Articulo {
  return Articulo.parse({
    id: `${ID_LOSC}:seed-a${numero.replace(/\s+/g, '')}`,
    normaId: ID_LOSC,
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

export const ARTICULOS_SEGURIDAD_SEED: Articulo[] = [
  ART_LOSC_36_1,
  ART_LOSC_36_3,
  ART_LOSC_36_6,
  ART_LOSC_36_10,
  ART_LOSC_36_16,
  ART_LOSC_36_23,
  ART_LOSC_37_1,
  ART_LOSC_37_4,
  ART_LOSC_37_7,
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
  importeEur: number;
  importeReducidoEur: number;
  textoBoletin: string;
  terminos: string[];
  consecuencias?: Array<{ tipo: Consecuencia['tipo']; textoCorto: string; fuente: string }>;
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
    marcoImporte: 'seguridad_ciudadana' satisfies MarcoImporte,
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
      'venta ambulante sin permiso',
      'top manta',
      'permanencia contra la voluntad del dueño',
    ],
    notaRevision:
      NOTA_LEVE_IMPORTE +
      ' A VERIFICAR la frontera con los delitos de allanamiento de morada (art. 202 CP) y usurpación ' +
      '(art. 245 CP): la infracción administrativa cubre la ocupación/permanencia que NO sea delito. ' +
      'Confirmar el encaje del caso con el revisor jurídico.',
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
    ],
    notaRevision:
      NOTA_LEVE_IMPORTE +
      ' A VERIFICAR: el derecho de reunión es un derecho fundamental (art. 21 CE); la falta de ' +
      'comunicación NO impide por sí sola el ejercicio del derecho y la sanción debe ponderarse. ' +
      'Distinguir de la infracción MUY GRAVE del art. 35.1 (reuniones o manifestaciones en ' +
      'infraestructuras críticas) y de la GRAVE del art. 36.8 (perturbación del desarrollo de una ' +
      'reunión o manifestación lícita). Punto sensible: confirmar con el revisor jurídico.',
  }),
];

/** Estructura completa del seed lista para combinar con el resto de contenido. */
export const SEED_SEGURIDAD_CIUDADANA: SeedContenido = {
  normas: NORMAS_SEGURIDAD_SEED,
  articulos: ARTICULOS_SEGURIDAD_SEED,
  infracciones: INFRACCIONES_SEGURIDAD_SEED,
};
