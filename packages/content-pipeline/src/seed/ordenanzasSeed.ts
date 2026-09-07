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

const URL_OM_CIRC = 'https://sede.santacruzdetenerife.es/sede/normativa/n647';
const URL_OM_ANIM = 'https://sede.santacruzdetenerife.es/sede/normativa/n513';
const URL_OM_RUIDO =
  'https://sede.santacruzdetenerife.es/fileadmin/user_upload/Sede/normativas/Ordenanzas_municipales/OMRuidosyVibraciones.pdf';

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
    titulo: 'Ordenanza municipal de circulación (Santa Cruz de Tenerife)',
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

const ART_CIRC_ESTAC = articuloSeed({
  normaId: ID_OM_CIRC,
  numero: 'EST',
  titulo: 'Estacionamiento en zona de estacionamiento regulado (zona azul/ORA)',
  texto:
    'Regula el estacionamiento en las zonas de estacionamiento regulado del municipio (zona azul y ' +
    'zona verde de residentes). Obliga a obtener y exhibir el título habilitante (ticket o ' +
    'distintivo) durante el tiempo autorizado y prohíbe estacionar sin él o rebasando el tiempo ' +
    'abonado. Resumen orientativo; consúltese la ordenanza y su ordenanza fiscal en la sede ' +
    'electrónica del Ayuntamiento.',
});

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

export const ARTICULOS_ORDENANZAS_SEED: Articulo[] = [
  ART_CIRC_VMP,
  ART_CIRC_ESTAC,
  ART_ANIM_VIA,
  ART_ANIM_CENSO,
  ART_RUIDO_CONV,
];

// --- Constructor de una infracción MUNICIPAL con sus sinónimos y consecuencias --------------
interface InfraccionSeedInput {
  id: string;
  articulo: Articulo;
  tituloCorto: string;
  gravedad: Infraccion['gravedad'];
  importeEur: number;
  importeReducidoEur: number | null;
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
    // El marco de validación de una ordenanza es `municipal`: sin rango legal único (varía por
    // ordenanza), solo se valida la coherencia (importe presente y reducido ≤ base). §8.3.
    marcoImporte: 'municipal' satisfies MarcoImporte,
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
    ],
    notaRevision:
      'A VERIFICAR importe y clasificación: circular con VMP por acera/zona peatonal está prohibido ' +
      'por la Ordenanza municipal de circulación (campaña municipal "las 7 reglas del patinete" cita ' +
      'hasta 200 €). Confirmar el artículo exacto, la cuantía y si hay pronto pago (reducido) con el ' +
      'texto consolidado en la sede electrónica y con el revisor jurídico antes de publicar.',
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
  construirInfraccion({
    id: 'ord-sctf-zona-azul',
    articulo: ART_CIRC_ESTAC,
    tituloCorto: 'Zona azul: estacionar sin ticket o rebasando el tiempo',
    gravedad: 'leve',
    importeEur: 60,
    importeReducidoEur: 30,
    textoBoletin:
      'Estacionar en una zona de estacionamiento regulado (zona azul) sin obtener y exhibir el título ' +
      'habilitante, o permaneciendo estacionado una vez rebasado el tiempo abonado, incumpliendo la ' +
      'ordenanza reguladora del estacionamiento.',
    terminos: [
      'zona azul',
      'zona azul tenerife',
      'zona azul santa cruz',
      'ora',
      'sin ticket zona azul',
      'zona azul sin pagar',
      'aparcar zona azul',
      'estacionamiento regulado',
      'tiempo excedido zona azul',
    ],
    notaRevision:
      'A VERIFICAR con MÁXIMA cautela: Santa Cruz de Tenerife IMPLANTA el estacionamiento regulado ' +
      '(zona azul/verde) a lo largo de 2026; a la fecha del seed puede NO estar plenamente en vigor. ' +
      'La cuantía (importe base y pronto pago) la fija la ORDENANZA REGULADORA y su ordenanza fiscal; ' +
      'los 60/30 € son ORIENTATIVOS de referencia, NO confirmados. Confirmar vigencia, artículo y ' +
      'cuantía con la sede electrónica y el revisor jurídico ANTES de publicar.',
  }),
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
    tituloCorto: 'Perro sin identificar (microchip) o sin censar',
    gravedad: 'leve',
    importeEur: 100,
    importeReducidoEur: 50,
    textoBoletin:
      'Tener un perro sin identificar mediante microchip o sin inscribir en el censo municipal de ' +
      'animales, incumpliendo la ordenanza municipal de protección y tenencia de animales.',
    terminos: [
      'perro sin censar',
      'perro sin chip',
      'perro sin microchip',
      'perro sin registrar',
      'sin censo animal',
      'perro no identificado',
    ],
    notaRevision:
      'A VERIFICAR importe y clasificación: no identificar (microchip) ni censar al animal es infracción ' +
      'de la Ordenanza de protección y tenencia de animales. El importe (100/50 €) es ORIENTATIVO; ' +
      'confirmar artículo, tramo y cuantía con el texto consolidado y el revisor jurídico.',
  }),
  construirInfraccion({
    id: 'ord-sctf-ruido-convivencia',
    articulo: ART_RUIDO_CONV,
    tituloCorto: 'Ruido y molestias vecinales (música, escándalo)',
    gravedad: 'grave',
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
      'vibraciones (tramos leve/grave/muy grave). El importe (300/150 €) es ORIENTATIVO; confirmar ' +
      'artículo, tramo y cuantía con el texto consolidado y el revisor jurídico. Puede requerir medición ' +
      'sonométrica para acreditar el exceso.',
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
