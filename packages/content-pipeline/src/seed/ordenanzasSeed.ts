import {
  Articulo,
  Consecuencia,
  Infraccion,
  Norma,
  Sinonimo,
  slugMunicipio,
  type Cuerpo,
  type CuerpoCompetente,
  type EstadoRevision,
  type MarcoImporte,
} from '@agente/shared';
import { hashTexto } from '../parsers/boe-xml/hash.js';
import type { InfraccionSeed, SeedContenido } from './traficoSeed.js';

/**
 * SEED de ORDENANZAS MUNICIPALES — PILOTO de Santa Cruz de Tenerife (capa municipal, ADR-006/008).
 *
 * Es la razón de pagar de un Policía Local: que abra Normas/Buscar y vea SU ordenanza. Este seed
 * siembra las infracciones de ordenanza MÁS USADAS en la calle por un Local (VMP/patinetes,
 * estacionamiento regulado, animales, ruido/convivencia) LIGADAS al municipio mediante
 * `territorioId` = `slugMunicipio('Santa Cruz de Tenerife')` (= `mun-santa-cruz-de-tenerife`, el
 * mismo id que el onboarding deriva del municipio del perfil). Así el cliente filtra por la
 * cadena territorial (`territorio_id IS NULL OR territorio_id IN (…)`) y solo lo ve quien trabaja
 * en ese municipio.
 *
 * FUENTES OFICIALES (sede electrónica del Ayuntamiento de Santa Cruz de Tenerife y BOP):
 *  - Ordenanza municipal de circulación (sede: /sede/normativa/n647) — VMP y estacionamiento.
 *  - Ordenanza municipal reguladora de la protección y tenencia de animales (n513, texto 2017).
 *  - Ordenanza de protección del medioambiente contra la emisión de ruidos y vibraciones.
 *
 * Reglas aplicadas (CLAUDE.md y nota legal):
 *  - Textos de artículo y de boletín REDACTADOS POR NOSOTROS (resúmenes neutros, no copiados).
 *  - Toda infracción lleva su artículo/ordenanza fuente; la fecha visible la aporta el `ContentVersion`.
 *  - Lenguaje ORIENTATIVO ("procede/puede", nunca imperativo).
 *  - NADA se publica "verificado": TODO queda `pendiente_revision` para el panel (revisor
 *    jurídico + segundo revisor, §8.3). `notaRevision` detalla el dato concreto "a verificar".
 *  - Los importes son ORIENTATIVOS: la cuantía exacta la fija cada ordenanza (y su ordenanza
 *    fiscal); el marco de validación es `municipal` (solo coherencia, sin rango legal único).
 */

/** Fecha de curación de este seed (la que verá el agente como "Actualizado el…"). */
const FECHA_ACTUALIZACION = '2026-09-07';
const VALID_FROM = `${FECHA_ACTUALIZACION}T00:00:00.000Z`;

/**
 * Municipio del piloto. Se deriva con `slugMunicipio` (la MISMA función que usa el onboarding
 * para el `municipioId` del perfil) para garantizar que el id coincide exactamente y el filtro
 * territorial engancha. Municipio → `mun-santa-cruz-de-tenerife`.
 */
export const MUNICIPIO_SCTF_NOMBRE = 'Santa Cruz de Tenerife';
export const TERRITORIO_SCTF = slugMunicipio(MUNICIPIO_SCTF_NOMBRE);

/**
 * Relevancia de las ordenanzas municipales: las aplica en la calle sobre todo la Policía Local; en
 * Canarias también la Policía Canaria (autonómica). No se etiqueta a la Guardia Civil ni a la
 * Policía Nacional (una ordenanza municipal urbana no es su trabajo de oficio). NO restringe el
 * acceso, solo prioriza (columna `cuerpos` del paquete).
 */
const CUERPOS_MUNICIPAL: Cuerpo[] = ['policia_local', 'policia_autonomica'];

/**
 * Competencia (aviso orientativo, ADR-007): en una ordenanza municipal urbana denuncian la Policía
 * Local y, en Canarias, la Policía Canaria. Vía urbana.
 */
const COMPETENCIA_MUNICIPAL: CuerpoCompetente[] = ['policia_local', 'policia_autonomica'];

// --- Identificadores de norma (municipales, prefijo estable) --------------------------------
const ID_OM_CIRC = 'OM-SCTF-CIRCULACION'; // Ordenanza municipal de circulación
const ID_OM_ANIM = 'OM-SCTF-ANIMALES'; // Ordenanza de protección y tenencia de animales
const ID_OM_RUIDO = 'OM-SCTF-RUIDOS'; // Ordenanza de ruidos y vibraciones
const ID_OM_TERRAZAS = 'OM-SCTF-TERRAZAS'; // Ordenanza de ocupación de vía pública con mesas/sillas
const ID_OM_ZBE = 'OM-SCTF-ZBE'; // Ordenanza reguladora de la Zona de Bajas Emisiones
const ID_OM_RESIDUOS = 'OM-SCTF-RESIDUOS'; // Ordenanza de gestión de residuos y limpieza
const ID_OM_POLICIA = 'OM-SCTF-POLICIA'; // Ordenanza de policía y buen gobierno
const ID_OM_VENTA = 'OM-SCTF-VENTA'; // Ordenanza de venta fuera de establecimiento comercial permanente

const URL_OM_CIRC = 'https://sede.santacruzdetenerife.es/sede/normativa/n647';
const URL_OM_ANIM = 'https://sede.santacruzdetenerife.es/sede/normativa/n513';
const URL_OM_RUIDO =
  'https://sede.santacruzdetenerife.es/fileadmin/user_upload/Sede/normativas/Ordenanzas_municipales/OMRuidosyVibraciones.pdf';
const URL_OM_TERRAZAS =
  'https://sede.santacruzdetenerife.es/sede/tramites/ocupacion-de-la-via-publica-con-mesas-sillas-y-parasoles';
const URL_OM_ZBE =
  'https://www.santacruzdetenerife.es/web/servicios-municipales/movilidad-y-accesibilidad-universal/zonas-de-bajas-emisiones';
const URL_OM_RESIDUOS =
  'https://sede.santacruzdetenerife.es/fileadmin/user_upload/Sede/normativas/Ordenanzas_municipales/Texto_consolidado_OMGRL.pdf';
const URL_OM_POLICIA =
  'https://sede.santacruzdetenerife.es/fileadmin/user_upload/Sede/normativas/Ordenanzas_municipales/OMPoliciayBGobierno_Texto_consolidado.pdf';
const URL_OM_VENTA = 'https://sede.santacruzdetenerife.es/sede/tramite/t491';

/** Construye una `Norma` municipal ligada al municipio del piloto. */
function normaMunicipal(input: { id: string; codigo: string; titulo: string; url: string }): Norma {
  return Norma.parse({
    id: input.id,
    codigo: input.codigo,
    titulo: input.titulo,
    tipo: 'ordenanza',
    ambito: 'municipal',
    territorioId: TERRITORIO_SCTF,
    origen: 'oficial',
    urlBoe: input.url,
    fechaConsolidacion: null,
    cuerpos: CUERPOS_MUNICIPAL,
  });
}

export const NORMAS_ORDENANZAS_SEED: Norma[] = [
  normaMunicipal({
    id: ID_OM_CIRC,
    codigo: 'OM-CIRC-SCTF',
    titulo: 'Ordenanza Municipal de Circulación y Movilidad (Santa Cruz de Tenerife)',
    url: URL_OM_CIRC,
  }),
  normaMunicipal({
    id: ID_OM_ANIM,
    codigo: 'OM-ANIM-SCTF',
    titulo: 'Ordenanza reguladora de la protección y tenencia de animales (Santa Cruz de Tenerife)',
    url: URL_OM_ANIM,
  }),
  normaMunicipal({
    id: ID_OM_RUIDO,
    codigo: 'OM-RUIDO-SCTF',
    titulo:
      'Ordenanza de protección del medioambiente contra la emisión de ruidos y vibraciones (Santa Cruz de Tenerife)',
    url: URL_OM_RUIDO,
  }),
  normaMunicipal({
    id: ID_OM_TERRAZAS,
    codigo: 'OM-TERRAZAS-SCTF',
    titulo:
      'Ordenanza reguladora de la ocupación del dominio público con mesas, sillas y parasoles (Santa Cruz de Tenerife)',
    url: URL_OM_TERRAZAS,
  }),
  normaMunicipal({
    id: ID_OM_ZBE,
    codigo: 'OM-ZBE-SCTF',
    titulo: 'Ordenanza reguladora de la Zona de Bajas Emisiones (Santa Cruz de Tenerife)',
    url: URL_OM_ZBE,
  }),
  normaMunicipal({
    id: ID_OM_RESIDUOS,
    codigo: 'OM-RESIDUOS-SCTF',
    titulo:
      'Ordenanza de gestión de residuos y limpieza de espacios públicos para una economía circular (Santa Cruz de Tenerife)',
    url: URL_OM_RESIDUOS,
  }),
  normaMunicipal({
    id: ID_OM_POLICIA,
    codigo: 'OM-POLICIA-SCTF',
    titulo: 'Ordenanza de policía y buen gobierno (Santa Cruz de Tenerife)',
    url: URL_OM_POLICIA,
  }),
  normaMunicipal({
    id: ID_OM_VENTA,
    codigo: 'OM-VENTA-SCTF',
    titulo:
      'Ordenanza reguladora de la venta fuera de establecimiento comercial permanente y actividades en la vía pública (Santa Cruz de Tenerife)',
    url: URL_OM_VENTA,
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

const ART_CIRC_VMP = articuloSeed({
  normaId: ID_OM_CIRC,
  numero: 'VMP',
  titulo: 'Circulación de vehículos de movilidad personal (VMP) y patinetes',
  texto:
    'Regula la circulación de los vehículos de movilidad personal (patinetes eléctricos y ' +
    'similares) en el municipio, en desarrollo de la normativa estatal. Queda prohibido circular ' +
    'con VMP por aceras y zonas peatonales; se fija la velocidad máxima urbana, la prohibición de ' +
    'llevar más de un ocupante y de usar el móvil o auriculares mientras se conduce, y las medidas ' +
    'de protección (casco para menores, elementos reflectantes de noche). Resumen orientativo; ' +
    'consúltese el texto consolidado en la sede electrónica del Ayuntamiento.',
});

// NOTA (revisor jurídico, 2026-09): la ZONA AZUL/ORA en Santa Cruz de Tenerife AÚN NO está
// operativa (proyecto 2026-2028). Se retira su artículo y su ficha (`ord-sctf-zona-azul`) del
// piloto: sus importes (60/30 €) eran una cifra sin fuente sobre una norma inexistente. Volverán
// cuando el Ayuntamiento apruebe y ponga en vigor la ordenanza reguladora y su ordenanza fiscal.

const ART_ANIM_VIA = articuloSeed({
  normaId: ID_OM_ANIM,
  numero: 'VP',
  titulo: 'Tenencia de animales en la vía pública: correa, control y excrementos',
  texto:
    'Obliga a llevar a los perros sujetos con correa y bajo control en las vías y espacios ' +
    'públicos, y a recoger de inmediato los excrementos que depositen. Prohíbe dejar al animal ' +
    'suelto o desatendido de forma que pueda causar molestias o riesgo. Resumen orientativo; ' +
    'consúltese el texto consolidado en la sede electrónica del Ayuntamiento.',
});

const ART_ANIM_CENSO = articuloSeed({
  normaId: ID_OM_ANIM,
  numero: 'CENSO',
  titulo: 'Identificación y censo de los animales de compañía',
  texto:
    'Exige identificar a los animales de compañía mediante microchip y su inscripción en el censo ' +
    'municipal. No tener al perro identificado o censado es una infracción de la ordenanza. ' +
    'Resumen orientativo; consúltese el texto consolidado en la sede electrónica del Ayuntamiento.',
});

const ART_RUIDO_CONV = articuloSeed({
  normaId: ID_OM_RUIDO,
  numero: 'CONV',
  titulo: 'Ruidos molestos y convivencia: emisión de ruido en la vía pública y viviendas',
  texto:
    'Regula los niveles de ruido admisibles y prohíbe producir ruidos que excedan de los límites ' +
    'exigibles para la convivencia, tanto en la vía pública (música, aparatos, concentraciones ' +
    'ruidosas) como en el interior de las viviendas cuando se perciben desde el exterior o molestan ' +
    'al vecindario, en especial en horario nocturno. Resumen orientativo; consúltese el texto ' +
    'consolidado en la sede electrónica del Ayuntamiento.',
});

const ART_TERRAZAS = articuloSeed({
  normaId: ID_OM_TERRAZAS,
  numero: 'OCUP',
  titulo: 'Ocupación de la vía pública con terraza (mesas, sillas y parasoles) sin licencia o excediéndola',
  texto:
    'Exige licencia o autorización municipal para ocupar la vía pública con mesas, sillas, veladores y ' +
    'parasoles al servicio de un establecimiento de hostelería, y ceñir la ocupación a la superficie, ' +
    'los elementos y el horario autorizados. Instalar la terraza SIN licencia, o EXCEDER lo autorizado ' +
    '(más mesas o superficie, invadir la acera o el paso de peatones), incumple la ordenanza. Como ' +
    'medida orientativa procede requerir la retirada de mesas y sillas y el cese de la ocupación no ' +
    'amparada. Resumen orientativo; consúltese el texto consolidado en la sede electrónica del ' +
    'Ayuntamiento.',
});

const ART_ZBE = articuloSeed({
  normaId: ID_OM_ZBE,
  numero: 'ZBE',
  titulo: 'Acceso o circulación indebida en la Zona de Bajas Emisiones (ZBE)',
  texto:
    'Regula el acceso y la circulación de vehículos en la Zona de Bajas Emisiones (ZBE) o área ' +
    'restringida del municipio en función de su distintivo ambiental de la DGT y de las autorizaciones ' +
    '(residentes, garajes, servicios). Acceder o circular por la ZBE sin el distintivo ambiental exigido ' +
    'o sin autorización, cuando el régimen esté en vigor, incumple la ordenanza. IMPORTANTE: la ordenanza ' +
    'de la ZBE de Santa Cruz de Tenerife está aprobada pero su RÉGIMEN SANCIONADOR aún NO es aplicable ' +
    '(periodo transitorio); no procede sanción hasta que entre en vigor. Resumen orientativo; consúltese ' +
    'el texto consolidado en la sede electrónica del Ayuntamiento.',
});

// --- Artículos de la OLA DE ORDENANZAS SCTF (convivencia, limpieza, playas, venta) 2026-09-10 ----
const ART_RESIDUOS_38_6 = articuloSeed({
  normaId: ID_OM_RESIDUOS,
  numero: '38.6',
  titulo: 'Prohibición de orinar, defecar o escupir en el espacio público',
  texto:
    'La ordenanza de gestión de residuos y limpieza prohíbe defecar, miccionar (orinar) o escupir en ' +
    'los espacios públicos (art. 38.6). Su incumplimiento es infracción leve, con cuantía graduable ' +
    'hasta el máximo del tramo leve (art. 52.2). Resumen orientativo; consúltese el texto consolidado.',
});

const ART_RESIDUOS_42 = articuloSeed({
  normaId: ID_OM_RESIDUOS,
  numero: '42',
  titulo: 'Pintadas y grafitis en el espacio público',
  texto:
    'La ordenanza de limpieza prohíbe realizar pintadas, grafitis, inscripciones o manchas sobre ' +
    'cualquier elemento del espacio público, mobiliario urbano, árboles o vías, salvo los murales ' +
    'autorizados (art. 42). Puede agravarse si el deterioro es grave o afecta a bienes protegidos, y ' +
    'ponerse en conocimiento de la autoridad judicial si es constitutiva de delito de daños. Orientativo.',
});

const ART_RESIDUOS_27 = articuloSeed({
  normaId: ID_OM_RESIDUOS,
  numero: '27',
  titulo: 'Abandono de residuos voluminosos (muebles y enseres)',
  texto:
    'La ordenanza de limpieza prohíbe abandonar residuos voluminosos (muebles, colchones, enseres) en el ' +
    'espacio público o fuera de los contenedores y del sistema de recogida habilitado (art. 27), y ' +
    'considera el depósito fuera de contenedor infracción grave (art. 50.1.b). Orientativo; consúltese el BOP.',
});

const ART_RESIDUOS_51 = articuloSeed({
  normaId: ID_OM_RESIDUOS,
  numero: '51',
  titulo: 'Depósito de residuos o contenedores fuera de horario',
  texto:
    'La ordenanza de limpieza tipifica como leve sacar los contenedores o depositar la basura en la vía ' +
    'pública fuera de las horas, lugares o condiciones establecidos (art. 51.1.b y 51.1.c). Orientativo.',
});

const ART_RESIDUOS_38 = articuloSeed({
  normaId: ID_OM_RESIDUOS,
  numero: '38',
  titulo: 'Vertidos de líquidos a la vía pública',
  texto:
    'La ordenanza de limpieza prohíbe verter en la vía pública aguas sucias, de riego o de aparatos de ' +
    'refrigeración, y arrojar residuos desde ventanas, balcones o vehículos (art. 38, aptdos. 5/7/8/9). ' +
    'Es leve, agravable por su entidad (art. 50.2.b). Orientativo; consúltese el texto consolidado.',
});

const ART_RESIDUOS_43 = articuloSeed({
  normaId: ID_OM_RESIDUOS,
  numero: '43',
  titulo: 'Playas y zonas de baño: residuos y prohibición de fumar',
  texto:
    'La ordenanza de limpieza prohíbe depositar residuos directamente en la arena o rocas de las playas ' +
    'y zonas de baño (art. 43.1) y fumar en ellas fuera de las zonas expresamente habilitadas (art. 43.2), ' +
    'para evitar colillas y residuos en la arena. Infracciones leves. Orientativo; consúltese el BOP.',
});

const ART_POLICIA_109 = articuloSeed({
  normaId: ID_OM_POLICIA,
  numero: '109',
  titulo: 'Consumo de bebidas alcohólicas en la vía pública',
  texto:
    'La ordenanza de policía y buen gobierno prohíbe consumir bebidas alcohólicas en la vía pública fuera ' +
    'de los establecimientos de hostelería y kioscos autorizados (art. 109). La ordenanza no fija cuantía ' +
    '(remite a la legislación vigente, art. 135): el importe debe consultarse. Puede concurrir con la ' +
    'normativa de limpieza si se ensucia la vía. Resumen orientativo; consúltese el texto consolidado.',
});

const ART_POLICIA_130 = articuloSeed({
  normaId: ID_OM_POLICIA,
  numero: '130',
  titulo: 'Acampada y fuego en parques de montaña',
  texto:
    'La ordenanza de policía y buen gobierno solo permite acampar y encender fuego en los lugares ' +
    'expresamente habilitados de los parques de montaña (arts. 130-131). No fija cuantía (art. 135). ' +
    'Máxima cautela por riesgo de incendio forestal; puede concurrir la normativa forestal de Canarias, ' +
    'con sanciones propias más graves. Resumen orientativo; consúltese el texto consolidado.',
});

const ART_VENTA_AMBULANTE = articuloSeed({
  normaId: ID_OM_VENTA,
  numero: 'venta',
  titulo: 'Venta ambulante sin autorización',
  texto:
    'La ordenanza reguladora de la venta fuera de establecimiento comercial permanente exige autorización ' +
    'municipal para la venta ambulante o no sedentaria en la vía o espacios públicos. Ejercerla sin ' +
    'autorización, o fuera de las zonas, fechas y condiciones autorizadas, la incumple. Su artículo ' +
    'sancionador y cuantía deben consultarse en el texto de la ordenanza. Si los géneros pudieran vulnerar ' +
    'la propiedad industrial o intelectual, valorar el traslado del tanto de culpa a la autoridad judicial. ' +
    'Resumen orientativo; consúltese el texto de la ordenanza.',
});

export const ARTICULOS_ORDENANZAS_SEED: Articulo[] = [
  ART_CIRC_VMP,
  ART_ANIM_VIA,
  ART_ANIM_CENSO,
  ART_RUIDO_CONV,
  ART_TERRAZAS,
  ART_ZBE,
  ART_RESIDUOS_38_6,
  ART_RESIDUOS_42,
  ART_RESIDUOS_27,
  ART_RESIDUOS_51,
  ART_RESIDUOS_38,
  ART_RESIDUOS_43,
  ART_POLICIA_109,
  ART_POLICIA_130,
  ART_VENTA_AMBULANTE,
];

// --- Constructor de una infracción MUNICIPAL con sus sinónimos y consecuencias --------------
interface InfraccionSeedInput {
  id: string;
  articulo: Articulo;
  tituloCorto: string;
  gravedad: Infraccion['gravedad'];
  /**
   * Importe base. `null` SOLO en entradas CONSULTABLES (`no_sancionador`): ordenanzas cuya norma
   * existe pero cuyo régimen sancionador o cuantía NO podemos confirmar hoy (no se inventa cifra).
   */
  importeEur: number | null;
  importeReducidoEur: number | null;
  textoBoletin: string;
  terminos: string[];
  consecuencias?: Array<{ tipo: Consecuencia['tipo']; textoCorto: string; fuente: string }>;
  notaRevision: string;
  /**
   * Marco de validación. Por defecto `municipal` (con importe orientativo). Se pone
   * `no_sancionador` en las entradas CONSULTABLES sin importe (norma existente pero sin cuantía
   * confirmada, p. ej. ZBE aún no sancionable): así los validadores no exigen importe y mejor
   * "sin cuantía + a verificar" que un dato falso (misma regla que aplicamos a la zona azul).
   */
  marcoImporte?: MarcoImporte;
}

function construirInfraccion(input: InfraccionSeedInput): InfraccionSeed {
  const marco = input.marcoImporte ?? ('municipal' satisfies MarcoImporte);
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
    competencia: { cuerpos: COMPETENCIA_MUNICIPAL, via: 'urbana' },
    ambito: 'municipal',
    territorioId: TERRITORIO_SCTF,
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
    // El marco de validación de una ordenanza es `municipal` (sin rango legal único: varía por
    // ordenanza, solo se valida coherencia: importe presente y reducido ≤ base) salvo las entradas
    // CONSULTABLES sin cuantía confirmada, que van como `no_sancionador`. §8.3.
    marcoImporte: marco,
    revision: 'pendiente_revision' satisfies EstadoRevision,
    notaRevision: input.notaRevision,
  };
}

// --- Infracciones sembradas (las más usadas por un Local) -----------------------------------
export const INFRACCIONES_ORDENANZAS_SEED: InfraccionSeed[] = [
  construirInfraccion({
    id: 'ord-sctf-vmp-acera',
    articulo: ART_CIRC_VMP,
    tituloCorto: 'Patinete/VMP por la acera o zona peatonal',
    gravedad: 'grave',
    importeEur: 200,
    importeReducidoEur: 100,
    textoBoletin:
      'Circular con un vehículo de movilidad personal (patinete eléctrico o similar) por la acera, ' +
      'zona peatonal u otro espacio reservado a peatones, donde su circulación está prohibida por la ' +
      'ordenanza municipal de circulación.',
    terminos: [
      'patinete',
      'patinete electrico',
      'patinete en la acera',
      'patinete por la acera',
      'vmp acera',
      'patinete zona peatonal',
      'patin electrico acera',
      'patinete peaton',
      'patinete a dos',
      'patinete sin luz',
      'patinete tuneado',
    ],
    consecuencias: [
      {
        tipo: 'inmovilizacion',
        // MISMO texto que la ficha estatal `inf-vmp-patinete`: el mismo hecho (VMP de riesgo) no
        // puede dar mensajes distintos entre la capa estatal y la municipal (validación de calle).
        textoCorto:
          'Procede valorar la retención (inmovilización cautelar) del VMP cuando su circulación ' +
          'entrañe riesgo, hasta que cese la causa; la medida y la devolución del vehículo las ' +
          'concreta la ordenanza municipal.',
        fuente: 'Ordenanza municipal de circulación (VMP)',
      },
    ],
    notaRevision:
      'A VERIFICAR importe y clasificación: circular con VMP por acera/zona peatonal está prohibido ' +
      'por la Ordenanza municipal de circulación (campaña municipal "las 7 reglas del patinete" cita ' +
      'hasta 200 €). Confirmar el artículo exacto, la cuantía y si hay pronto pago (reducido) con el ' +
      'texto consolidado en la sede electrónica y con el revisor jurídico antes de publicar. La ' +
      'INMOVILIZACIÓN/retención cautelar del VMP es ORIENTATIVA (a confirmar en la ordenanza).',
  }),
  construirInfraccion({
    id: 'ord-sctf-vmp-sin-casco-menor',
    articulo: ART_CIRC_VMP,
    tituloCorto: 'Patinete/VMP: menor de 16 sin casco',
    gravedad: 'leve',
    importeEur: 100,
    importeReducidoEur: 50,
    textoBoletin:
      'Conducir un vehículo de movilidad personal (patinete eléctrico) un menor de dieciséis años sin ' +
      'el casco de protección homologado que la ordenanza municipal exige a los menores.',
    terminos: [
      'patinete sin casco',
      'menor sin casco patinete',
      'vmp sin casco',
      'nino patinete sin casco',
      'patinete casco menor',
      'sin casco patinete',
    ],
    notaRevision:
      'A VERIFICAR importe, edad y clasificación: la ordenanza (y la campaña municipal) exige casco a ' +
      'los MENORES de 16 en VMP (cita ~100 €). Confirmar el artículo exacto, el umbral de edad y la ' +
      'cuantía con el texto consolidado en la sede electrónica y con el revisor jurídico.',
  }),
  // `ord-sctf-zona-azul` ELIMINADA (revisor jurídico, 2026-09): la zona azul aún no está operativa
  // en Santa Cruz (proyecto 2026-2028) y sus 60/30 € eran una cifra sin fuente sobre una norma
  // inexistente. Se reincorporará cuando el Ayuntamiento apruebe y ponga en vigor su ordenanza.
  construirInfraccion({
    id: 'ord-sctf-perro-suelto',
    articulo: ART_ANIM_VIA,
    tituloCorto: 'Perro suelto o sin correa en la vía pública',
    gravedad: 'leve',
    importeEur: 90,
    importeReducidoEur: 45,
    textoBoletin:
      'Llevar un perro suelto o sin correa por la vía o espacios públicos, sin el control exigido por ' +
      'la ordenanza municipal de protección y tenencia de animales.',
    terminos: [
      'perro suelto',
      'perro sin correa',
      'perro sin atar',
      'perro suelto en la calle',
      'can suelto',
      'perro sin correa en la calle',
    ],
    notaRevision:
      'A VERIFICAR importe y clasificación: llevar el perro suelto/sin correa en la vía pública es ' +
      'infracción de la Ordenanza de protección y tenencia de animales (2017). El importe (90/45 €) es ' +
      'ORIENTATIVO; confirmar el artículo, el tramo (leve/grave) y la cuantía con el texto consolidado ' +
      'y el revisor jurídico. Ojo: si el perro es potencialmente peligroso (PPP) aplica la Ley 50/1999.',
  }),
  construirInfraccion({
    id: 'ord-sctf-excrementos',
    articulo: ART_ANIM_VIA,
    tituloCorto: 'No recoger los excrementos del perro',
    gravedad: 'leve',
    importeEur: 90,
    importeReducidoEur: 45,
    textoBoletin:
      'No recoger de forma inmediata los excrementos depositados por un animal de compañía en la vía o ' +
      'espacios públicos, incumpliendo la ordenanza municipal.',
    terminos: [
      'excrementos',
      'caca de perro',
      'no recoger caca',
      'excrementos perro',
      'cacas de perro',
      'no recoge la caca',
      'heces perro',
    ],
    notaRevision:
      'A VERIFICAR importe y clasificación: no recoger los excrementos es infracción de la Ordenanza de ' +
      'protección y tenencia de animales (y de la de limpieza/residuos). El importe (90/45 €) es ' +
      'ORIENTATIVO; confirmar artículo, tramo y cuantía con el texto consolidado y el revisor jurídico.',
  }),
  construirInfraccion({
    id: 'ord-sctf-perro-sin-censar',
    articulo: ART_ANIM_CENSO,
    tituloCorto: 'Perro sin inscribir en el censo municipal',
    gravedad: 'leve',
    importeEur: 100,
    importeReducidoEur: 50,
    textoBoletin:
      'No inscribir al perro en el CENSO MUNICIPAL de animales, incumpliendo la ordenanza municipal de ' +
      'protección y tenencia de animales (infracción leve). El deber de IDENTIFICACIÓN por microchip es ' +
      'ESTATAL (Ley 7/2023, ficha propia, infracción grave): esta ficha es el censo local.',
    terminos: [
      'perro sin censar',
      'sin censo animal',
      'perro no censado',
      'no inscrito en el censo',
      'censo municipal de animales',
      'dar de alta el perro en el ayuntamiento',
    ],
    notaRevision:
      'A VERIFICAR importe y clasificación: no inscribir al animal en el CENSO municipal es infracción ' +
      'de la Ordenanza. El importe (100/50 €) es ORIENTATIVO. DESLINDE (revisor de animales): la ' +
      'identificación por MICROCHIP es deber ESTATAL de la Ley 7/2023 (ficha `animal-no-identificacion`, ' +
      'grave); esta ficha se reserva al censo municipal para no confundir 100 € con 10.001 €.',
  }),
  construirInfraccion({
    id: 'ord-sctf-ruido-convivencia',
    articulo: ART_RUIDO_CONV,
    // Reclasificada a LEVE (revisor jurídico, 2026-09): 300 € queda por debajo del mínimo del tramo
    // GRAVE de la Ley del Ruido (Ley 37/2003), por lo que encaja como infracción LEVE de convivencia.
    tituloCorto: 'Ruido y molestias vecinales (música, escándalo)',
    gravedad: 'leve',
    importeEur: 300,
    importeReducidoEur: 150,
    textoBoletin:
      'Producir ruidos que exceden de los límites exigibles para la convivencia (música o aparatos a ' +
      'alto volumen, concentraciones ruidosas, molestias al vecindario), especialmente en horario ' +
      'nocturno, incumpliendo la ordenanza municipal de protección frente al ruido.',
    terminos: [
      'ruido',
      'ruidos',
      'musica alta',
      'molestias vecinales',
      'ruido vecinos',
      'escandalo',
      'botellon ruido',
      'ruido nocturno',
      'fiesta ruidosa',
    ],
    notaRevision:
      'A VERIFICAR importe y clasificación: los ruidos molestos se sancionan por la Ordenanza de ruidos y ' +
      'vibraciones (tramos leve/grave/muy grave). Reclasificada a LEVE porque 300 € queda por debajo del ' +
      'mínimo del tramo GRAVE de la Ley 37/2003 del Ruido; el importe (300/150 €) es ORIENTATIVO. ' +
      'Confirmar artículo, tramo y cuantía con el texto consolidado y el revisor jurídico. Puede requerir ' +
      'medición sonométrica para acreditar el exceso.',
  }),
  // TERRAZAS: la ordenanza de ocupación de vía pública con mesas/sillas/parasoles EXISTE y está en
  // vigor, pero NO hemos podido confirmar el artículo del régimen sancionador ni la cuantía. Siguiendo
  // la regla de la zona azul (mejor honesto que un dato falso), NO se inventa importe: se modela como
  // entrada CONSULTABLE (`no_sancionador`, sin importe) con la orientación útil (requerir licencia,
  // retirada/cese) y el importe/artículo marcados fuertemente "a verificar".
  construirInfraccion({
    id: 'ord-sctf-terrazas',
    articulo: ART_TERRAZAS,
    tituloCorto: 'Terraza/veladores sin licencia o excediendo lo autorizado',
    gravedad: 'leve', // valor de relleno del modelo; lo determinante es que NO se afirma cuantía
    marcoImporte: 'no_sancionador',
    importeEur: null,
    importeReducidoEur: null,
    textoBoletin:
      'Ocupar la vía pública con una terraza (mesas, sillas, veladores, parasoles) SIN licencia ' +
      'municipal, o EXCEDIENDO lo autorizado (más superficie o mesas, invadir la acera o el paso de ' +
      'peatones), incumpliendo la ordenanza de ocupación del dominio público de Santa Cruz de Tenerife. ' +
      'ORIENTACIÓN: procede requerir la licencia o autorización y, en su defecto, el cese de la ocupación ' +
      'y la retirada de las mesas y sillas no amparadas. El importe y el artículo del régimen sancionador ' +
      'NO están confirmados (a verificar en la ordenanza y su ordenanza fiscal). La valoración final ' +
      'corresponde al agente y al órgano municipal competente.',
    terminos: [
      'terraza sin licencia',
      'veladores',
      'mesas y sillas',
      'terraza',
      'sombrillas en la acera',
      'la terraza ocupa la acera',
    ],
    consecuencias: [
      {
        tipo: 'cese_actividad',
        textoCorto:
          'Procede requerir la licencia/autorización y, en su defecto, el cese de la ocupación y la ' +
          'retirada de las mesas y sillas no amparadas por la licencia; la medida concreta la fija la ' +
          'ordenanza y el órgano municipal.',
        fuente: 'Ordenanza municipal de ocupación de vía pública (terrazas)',
      },
    ],
    notaRevision:
      'ENTRADA CONSULTABLE sin cuantía confirmada: la ordenanza de ocupación de vía pública con mesas, ' +
      'sillas y parasoles de Santa Cruz de Tenerife EXISTE y está en vigor, pero NO se ha podido ' +
      'confirmar el ARTÍCULO del régimen sancionador ni el IMPORTE, por lo que —igual que con la zona ' +
      'azul— NO se inventa cuantía (marco `no_sancionador`, sin importe). A VERIFICAR fuertemente con el ' +
      'texto consolidado de la ordenanza y su ordenanza fiscal, y con el revisor jurídico: artículo, ' +
      'clasificación (leve/grave), cuantía, y el régimen de retirada/cese como medida cautelar o sanción ' +
      'accesoria. No publicar hasta confirmar la fuente.',
  }),
  // ZBE: la ordenanza reguladora de la Zona de Bajas Emisiones de Santa Cruz de Tenerife está APROBADA
  // (aprobación definitiva BOP nº 101/2026, 24-ago-2026), pero su RÉGIMEN SANCIONADOR NO es aplicable
  // aún (periodo transitorio; la infraestructura de cámaras tardará ~18 meses y las sanciones se prevén
  // hacia 2029). Como todavía NO procede sanción, se modela como entrada CONSULTABLE (`no_sancionador`)
  // que informa de la restricción y de que aún no se multa; nada de cuantías inventadas.
  construirInfraccion({
    id: 'ord-sctf-zbe',
    articulo: ART_ZBE,
    tituloCorto: 'Zona de Bajas Emisiones (ZBE): acceso sin distintivo o autorización',
    gravedad: 'leve', // valor de relleno del modelo; NO se afirma cuantía (régimen aún no aplicable)
    marcoImporte: 'no_sancionador',
    importeEur: null,
    importeReducidoEur: null,
    textoBoletin:
      'Acceder o circular por la Zona de Bajas Emisiones (ZBE) o área restringida de Santa Cruz de ' +
      'Tenerife sin el distintivo ambiental de la DGT exigido o sin autorización (residente, garaje, ' +
      'servicio). IMPORTANTE: la ordenanza de la ZBE está aprobada pero su RÉGIMEN SANCIONADOR aún NO es ' +
      'aplicable (periodo transitorio; la infraestructura de control tardará en estar operativa), por lo ' +
      'que HOY no procede sanción por este motivo. Entrada informativa para orientar al agente; la ' +
      'valoración final corresponde al agente y al órgano municipal cuando el régimen entre en vigor.',
    terminos: [
      'zbe',
      'zona de bajas emisiones',
      'apr',
      'area restringida',
      'sin etiqueta ambiental',
      'distintivo ambiental',
      'sin etiqueta',
    ],
    // Sin consecuencia estructurada: el régimen sancionador aún no es aplicable, por lo que no hay
    // medida (denuncia/decomiso/cese) que proceda hoy. La orientación va en el texto del boletín.
    notaRevision:
      'ENTRADA CONSULTABLE, régimen aún NO aplicable: la ordenanza de la ZBE de Santa Cruz de Tenerife ' +
      'está APROBADA (aprobación definitiva BOP de Santa Cruz de Tenerife nº 101/2026, de 24-ago-2026; ' +
      'aprobación inicial BOP nº 56/2026), pero su RÉGIMEN SANCIONADOR NO es aplicable hoy (periodo ' +
      'transitorio; la infraestructura de cámaras tardará ~18 meses y las sanciones se prevén hacia ' +
      '2029). Por eso NO se afirma importe (marco `no_sancionador`) —misma regla que la zona azul—. A ' +
      'VERIFICAR fuertemente con el texto consolidado de la ordenanza en la sede electrónica y con el ' +
      'revisor jurídico: fecha de entrada en vigor del régimen sancionador, artículo, clasificación, ' +
      'cuantías y distintivos/autorizaciones exactos. Recordar el antecedente: el TSJ anuló en 2025 la ' +
      'anterior ordenanza de movilidad. No convertir en ficha sancionadora hasta confirmar la vigencia.',
  }),
  // --- OLA DE ORDENANZAS SCTF (convivencia, limpieza, playas, venta) 2026-09-10 -----------------
  // Bloque A + playas (fumar/residuos): artículo y TRAMO confirmados en el texto consolidado de la
  // ordenanza de limpieza (importe = MÁXIMO del tramo, art. 52.2, no cifra fija). Botellón, acampada
  // y venta ambulante: norma confirmada pero SIN cuantía → consultables (no_sancionador). Revisado por
  // ingesta-normativa contra la sede de SCTF; pendiente de revisor jurídico.
  construirInfraccion({
    id: 'ord-sctf-orinar-defecar-escupir',
    articulo: ART_RESIDUOS_38_6,
    tituloCorto: 'Orinar, defecar o escupir en la vía pública',
    gravedad: 'leve',
    importeEur: 750,
    importeReducidoEur: null,
    textoBoletin:
      'Defecar, orinar o escupir en los espacios públicos (art. 38.6 de la ordenanza de limpieza). Es ' +
      'infracción LEVE; el importe lo gradúa el órgano competente HASTA 750 € (máximo del tramo leve, ' +
      'art. 52.2), no es una cuantía fija. La valoración final corresponde al agente y al órgano municipal.',
    terminos: [
      'orinar en la calle',
      'mear en la via publica',
      'hacer pis en la calle',
      'defecar en la calle',
      'escupir en la calle',
      'necesidades en la via publica',
      'cagar en la calle',
    ],
    notaRevision:
      'Art. 38.6 y clasificación LEVE CONFIRMADOS (texto consolidado de la ordenanza de residuos y ' +
      'limpieza de SCTF). El importe (750 €) es el MÁXIMO del tramo leve (art. 52.2.c), NO cuantía fija: ' +
      'lo gradúa el órgano competente. A verificar posible pronto pago (ordenanza fiscal). Revisor.',
  }),
  construirInfraccion({
    id: 'ord-sctf-pintadas-grafitis',
    articulo: ART_RESIDUOS_42,
    tituloCorto: 'Pintadas o grafitis en el espacio público',
    gravedad: 'leve',
    importeEur: 750,
    importeReducidoEur: null,
    textoBoletin:
      'Realizar pintadas, grafitis o inscripciones sobre elementos del espacio público, mobiliario ' +
      'urbano, árboles o vías, salvo murales autorizados (art. 42 de la ordenanza de limpieza). LEVE con ' +
      'carácter general (hasta 750 €); puede agravarse (hasta 1.500 € o 3.000 €) por deterioro grave o ' +
      'bien protegido. Si la pintada pudiera ser delito de daños, procede ponerlo en conocimiento de la ' +
      'autoridad judicial, sin perjuicio del expediente sancionador. La valoración final es del órgano competente.',
    terminos: [
      'pintadas',
      'grafiti',
      'grafitis',
      'pintar pared',
      'spray pared',
      'firmas en la pared',
      'rayar mobiliario',
      'graffiti sin permiso',
    ],
    notaRevision:
      'Art. 42 CONFIRMADO. Importe = techo de tramo (leve ≤750 €; grave ≤1.500 €; muy grave ≤3.000 €, ' +
      'art. 52.2). A verificar con el revisor el criterio de gravedad (deterioro/patrimonio) y la ' +
      'frontera con el delito de daños del CP (art. 42 remite a la autoridad judicial).',
  }),
  construirInfraccion({
    id: 'ord-sctf-abandono-enseres',
    articulo: ART_RESIDUOS_27,
    tituloCorto: 'Abandonar muebles o enseres en la vía pública',
    gravedad: 'grave',
    importeEur: 1500,
    importeReducidoEur: null,
    textoBoletin:
      'Abandonar residuos voluminosos (muebles, colchones, enseres) en el espacio público o fuera de los ' +
      'contenedores y del sistema de recogida habilitado (art. 27). La ordenanza considera el depósito ' +
      'fuera de contenedor infracción GRAVE (art. 50.1.b), con importe graduable hasta 1.500 € (máx. del ' +
      'tramo grave, art. 52.2.b). Procede informar del servicio de recogida de voluminosos. Orientativo.',
    terminos: [
      'tirar muebles en la calle',
      'abandonar sofa',
      'colchon en la acera',
      'enseres en la calle',
      'dejar trastos',
      'muebles junto al contenedor',
      'voluminosos',
      'sacar la basura grande',
    ],
    notaRevision:
      'Arts. 27 y 50.1.b CONFIRMADOS (abandono fuera de contenedor = grave). Importe = techo del tramo ' +
      'grave (art. 52.2.b: hasta 1.500 €), no cuantía fija. A verificar si el simple depósito junto al ' +
      'contenedor se degrada a leve por escasa entidad (art. 51). Revisor.',
  }),
  construirInfraccion({
    id: 'ord-sctf-contenedores-fuera-horario',
    articulo: ART_RESIDUOS_51,
    tituloCorto: 'Sacar la basura o contenedores fuera de horario',
    gravedad: 'leve',
    importeEur: 750,
    importeReducidoEur: null,
    textoBoletin:
      'Sacar los contenedores o depositar la basura en la vía pública fuera de las horas, lugares o ' +
      'condiciones establecidos por el Ayuntamiento (arts. 51.1.b y 51.1.c de la ordenanza de limpieza). ' +
      'Es infracción LEVE (hasta 750 €). La valoración final corresponde al agente y al órgano municipal.',
    terminos: [
      'basura fuera de horario',
      'sacar la basura antes de hora',
      'contenedor fuera de hora',
      'tirar basura de dia',
      'horario de basura',
      'bolsa en la calle',
      'depositar residuos fuera de hora',
    ],
    notaRevision:
      'Arts. 51.1.b/c y clasificación leve CONFIRMADOS. Importe = techo tramo leve (≤750 €). A VERIFICAR ' +
      'la franja horaria vigente (la nota municipal citaba 19:00–21:00) para mostrarla en la ficha. Revisor.',
  }),
  construirInfraccion({
    id: 'ord-sctf-vertidos-via-publica',
    articulo: ART_RESIDUOS_38,
    tituloCorto: 'Verter aguas sucias o líquidos a la vía pública',
    gravedad: 'leve',
    importeEur: 750,
    importeReducidoEur: null,
    textoBoletin:
      'Verter en la vía pública aguas sucias, de riego o de aparatos de aire acondicionado, o arrojar ' +
      'residuos desde ventanas, balcones o vehículos (art. 38, aptdos. 5/7/8/9, de la ordenanza de ' +
      'limpieza). Es LEVE (hasta 750 €), agravable por su entidad (art. 50.2.b). Orientativo.',
    terminos: [
      'verter agua sucia',
      'tirar agua a la calle',
      'desague aire acondicionado',
      'fregar y tirar agua',
      'vertido en la acera',
      'aguas del local a la calle',
      'achique a la via publica',
    ],
    notaRevision:
      'Art. 38 (aptdos. 5/7/8/9) CONFIRMADO. Importe = techo tramo leve; posible elevación a grave (art. ' +
      '50.2.b). A VERIFICAR la delimitación frente a vertidos industriales/saneamiento con el revisor.',
  }),
  construirInfraccion({
    id: 'ord-sctf-playa-fumar',
    articulo: ART_RESIDUOS_43,
    tituloCorto: 'Fumar en la playa fuera de zona habilitada',
    gravedad: 'leve',
    importeEur: 750,
    importeReducidoEur: null,
    textoBoletin:
      'Fumar en las playas y zonas de baño del municipio fuera de las zonas expresamente habilitadas, para ' +
      'evitar colillas en la arena (art. 43.2 de la ordenanza de limpieza). Es LEVE (hasta 750 €). La ' +
      'valoración final corresponde al agente y al órgano municipal.',
    terminos: [
      'fumar en la playa',
      'colillas en la arena',
      'prohibido fumar playa',
      'cigarro en la playa',
      'playa sin humo',
      'tabaco playa',
    ],
    notaRevision:
      'Art. 43.2 CONFIRMADO. Importe = techo tramo leve (≤750 €). A verificar qué playas tienen zona ' +
      'habilitada para fumar (bando/señalización). Revisor.',
  }),
  construirInfraccion({
    id: 'ord-sctf-playa-residuos-arena',
    articulo: ART_RESIDUOS_43,
    tituloCorto: 'Tirar residuos en la arena o rocas de la playa',
    gravedad: 'leve',
    importeEur: 750,
    importeReducidoEur: null,
    textoBoletin:
      'Depositar residuos directamente en la arena o en las rocas de las playas y zonas de baño, en lugar ' +
      'de usar papeleras o contenedores (art. 43.1 de la ordenanza de limpieza). Es LEVE (hasta 750 €). ' +
      'La valoración final corresponde al agente y al órgano municipal.',
    terminos: [
      'basura en la playa',
      'tirar residuos playa',
      'dejar basura arena',
      'ensuciar la playa',
      'botellas en la arena',
      'restos en la playa',
    ],
    notaRevision:
      'Art. 43.1 CONFIRMADO. Importe = techo tramo leve (≤750 €). A VERIFICAR el importe efectivo dentro ' +
      'del tramo con el revisor.',
  }),
  construirInfraccion({
    id: 'ord-sctf-alcohol-via-publica',
    articulo: ART_POLICIA_109,
    tituloCorto: 'Consumo de alcohol en la vía pública (botellón)',
    gravedad: 'leve', // valor de relleno del modelo; NO se afirma cuantía (la ordenanza no la fija)
    marcoImporte: 'no_sancionador',
    importeEur: null,
    importeReducidoEur: null,
    textoBoletin:
      'Consumir bebidas alcohólicas en la vía pública fuera de los establecimientos de hostelería y ' +
      'kioscos autorizados (art. 109 de la ordenanza de policía y buen gobierno). La ordenanza prohíbe la ' +
      'conducta pero NO fija su cuantía (remite a la legislación vigente, art. 135): el importe debe ' +
      'consultarse. Puede concurrir con la normativa de limpieza si se ensucia la vía. La valoración final ' +
      'corresponde al agente y al órgano municipal.',
    terminos: [
      'botellon',
      'beber en la calle',
      'alcohol en la via publica',
      'consumir alcohol calle',
      'litrona en la calle',
      'beber en la plaza',
      'botellona',
    ],
    notaRevision:
      'Art. 109 CONFIRMADO (prohibición). NO se fija importe: la ordenanza remite a "legislación vigente" ' +
      '(art. 135) → entrada CONSULTABLE. A VERIFICAR con el revisor si hay ordenanza específica o cuantía ' +
      'por ordenanza fiscal; delimitar frente a la LO 4/2015 (estatal) y a la ley del menor si hay menores. ' +
      'Redactado en clave neutra, retirando el lenguaje arcaico del art. 109.',
  }),
  construirInfraccion({
    id: 'ord-sctf-acampada-parques',
    articulo: ART_POLICIA_130,
    tituloCorto: 'Acampar o hacer fuego en parques de montaña',
    gravedad: 'leve',
    marcoImporte: 'no_sancionador',
    importeEur: null,
    importeReducidoEur: null,
    textoBoletin:
      'Acampar, instalar tiendas o encender fuego en los parques de montaña del municipio fuera de los ' +
      'lugares habilitados (arts. 130-131 de la ordenanza de policía y buen gobierno). La ordenanza ' +
      'prohíbe la conducta pero no fija cuantía; el importe debe consultarse. MÁXIMA CAUTELA por riesgo de ' +
      'incendio forestal: puede concurrir la normativa forestal de Canarias, con sanciones propias más ' +
      'graves. La valoración final corresponde al agente y al órgano competente.',
    terminos: [
      'acampar en el monte',
      'fuego en el monte',
      'hoguera parque',
      'tienda de campaña monte',
      'hacer fuego forestal',
      'acampada monte',
      'barbacoa en el monte',
    ],
    notaRevision:
      'Arts. 130-131 CONFIRMADOS. Sin importe (art. 135) → CONSULTABLE. A verificar concurrencia con la ' +
      'normativa forestal/incendios de Canarias (sanciones propias más graves); el revisor decide si la ' +
      'ficha remite a esa normativa.',
  }),
  construirInfraccion({
    id: 'ord-sctf-venta-ambulante',
    articulo: ART_VENTA_AMBULANTE,
    tituloCorto: 'Venta ambulante sin autorización ("top manta")',
    gravedad: 'leve',
    marcoImporte: 'no_sancionador',
    importeEur: null,
    importeReducidoEur: null,
    textoBoletin:
      'Ejercer la venta ambulante o no sedentaria en la vía o espacios públicos sin la autorización ' +
      'municipal exigida, o fuera de las zonas, fechas y condiciones autorizadas. El artículo sancionador ' +
      'y la cuantía deben consultarse en la ordenanza reguladora. ORIENTACIÓN: procede requerir la ' +
      'autorización y, en su defecto, el cese de la venta; si los géneros pudieran vulnerar la propiedad ' +
      'industrial o intelectual, valorar el traslado del tanto de culpa a la autoridad judicial. La ' +
      'valoración final corresponde al agente y al órgano competente.',
    terminos: [
      'venta ambulante',
      'top manta',
      'mantero',
      'vender sin licencia',
      'venta ilegal calle',
      'puesto sin permiso',
      'vender en la via publica',
      'venta sin autorizacion',
    ],
    notaRevision:
      'ENTRADA CONSULTABLE: la ordenanza EXISTE (sede SCTF, trámite t491) pero NO se ha confirmado el ' +
      'artículo sancionador ni la cuantía. A VERIFICAR con el texto consolidado. Añadir decomiso/' +
      'intervención cautelar de género solo si la ordenanza lo prevé. Delimitar frente al delito contra la ' +
      'propiedad industrial del CP para el "top manta" de marcas.',
  }),
];

/** Estructura completa del seed lista para combinar con el resto de contenido. */
export const SEED_ORDENANZAS: SeedContenido = {
  normas: NORMAS_ORDENANZAS_SEED,
  articulos: ARTICULOS_ORDENANZAS_SEED,
  infracciones: INFRACCIONES_ORDENANZAS_SEED,
};

/** Municipios con ordenanza sembrada en el paquete (por su `territorioId`). Fuente única. */
export const MUNICIPIOS_CON_ORDENANZA: readonly { territorioId: string; nombre: string }[] = [
  { territorioId: TERRITORIO_SCTF, nombre: MUNICIPIO_SCTF_NOMBRE },
];
