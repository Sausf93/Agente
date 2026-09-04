import {
  Articulo,
  Consecuencia,
  Infraccion,
  Norma,
  Sinonimo,
  type EstadoRevision,
  type MarcoImporte,
} from '@agente/shared';
import { hashTexto } from '../parsers/boe-xml/hash.js';

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
const FECHA_ACTUALIZACION = '2026-09-04';
const VALID_FROM = `${FECHA_ACTUALIZACION}T00:00:00.000Z`;

// --- Identificadores de norma (BOE, legislación consolidada) --------------------------------
const ID_RGC = 'BOE-A-2003-23514'; // RD 1428/2003, Reglamento General de Circulación
const ID_LSV = 'BOE-A-2015-11722'; // RDL 6/2015, texto refundido de la Ley de Tráfico (LSV)
const ID_RGV = 'BOE-A-1999-1826'; // RD 2822/1998, Reglamento General de Vehículos
const ID_LRCSCVM = 'BOE-A-2004-18911'; // RDL 8/2004, seguro obligatorio (LRCSCVM)

const urlBoe = (id: string): string => `https://www.boe.es/buscar/act.php?id=${id}`;

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
  }),
  Norma.parse({
    id: ID_LSV,
    codigo: 'LSV',
    titulo: 'Texto refundido de la Ley sobre Tráfico, Circulación y Seguridad Vial (RDL 6/2015)',
    tipo: 'ley',
    ambito: 'estatal',
    urlBoe: urlBoe(ID_LSV),
    fechaConsolidacion: null,
  }),
  Norma.parse({
    id: ID_RGV,
    codigo: 'RGV',
    titulo: 'Reglamento General de Vehículos (RD 2822/1998)',
    tipo: 'reglamento',
    ambito: 'estatal',
    urlBoe: urlBoe(ID_RGV),
    fechaConsolidacion: null,
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

export const ARTICULOS_SEED: Articulo[] = [
  ART_RGC_99,
  ART_RGC_18,
  ART_RGC_117,
  ART_RGC_118,
  ART_RGC_146,
  ART_RGV_10,
  ART_LRCSCVM_3,
  ART_LSV_104,
  ART_LSV_105,
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
  importeEur: number;
  importeReducidoEur: number | null;
  puntos: number;
  textoBoletin: string;
  terminos: string[];
  consecuencias?: Array<{ tipo: Consecuencia['tipo']; textoCorto: string; fuente: string }>;
  marcoImporte: MarcoImporte;
  notaRevision: string;
}

/** Competencia por defecto para tráfico: Guardia Civil (interurbano), Local (urbano) y Tráfico. */
const COMPETENCIA_TRAFICO = {
  cuerpos: ['guardia_civil', 'policia_local', 'trafico'] as const,
  via: 'ambas' as const,
};

function construirInfraccion(input: InfraccionSeedInput): InfraccionSeed {
  const infraccion = Infraccion.parse({
    id: input.id,
    articuloId: input.articulo.id,
    codigoDgt: input.codigoDgt ?? null,
    tituloCorto: input.tituloCorto,
    gravedad: input.gravedad,
    tipo: 'administrativa',
    importeEur: input.importeEur,
    importeReducidoEur: input.importeReducidoEur,
    puntos: input.puntos,
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
    revision: 'pendiente_revision',
    notaRevision: input.notaRevision,
  };
}

export const INFRACCIONES_SEED: InfraccionSeed[] = [
  construirInfraccion({
    id: 'inf-alumbrado-deficiente',
    articulo: ART_RGC_99,
    tituloCorto: 'Alumbrado deficiente',
    gravedad: 'grave',
    importeEur: 200,
    importeReducidoEur: 100,
    puntos: 0,
    textoBoletin:
      'Circular con el sistema de alumbrado en deficientes condiciones (luz fundida, faro roto o ' +
      'mal reglado) que impide alumbrar la vía o ser visto por el resto de usuarios.',
    terminos: ['faro roto', 'luz fundida', 'faro fundido', 'sin luces', 'luces fundidas'],
    marcoImporte: 'trafico',
    notaRevision:
      'A VERIFICAR gravedad y cuantía: puede ser leve o grave según sea alumbrado obligatorio y ' +
      'conducción nocturna/escasa visibilidad (RGC arts. 98-104 y RGV). Contrastar con el ' +
      'codificado DGT antes de publicar.',
  }),
  construirInfraccion({
    id: 'inf-sin-seguro',
    articulo: ART_LRCSCVM_3,
    tituloCorto: 'Conducir sin seguro obligatorio',
    gravedad: 'muy_grave',
    importeEur: 601,
    importeReducidoEur: null,
    puntos: 0,
    textoBoletin:
      'Circular con un vehículo a motor careciendo del seguro obligatorio de responsabilidad ' +
      'civil en vigor que cubra la circulación.',
    terminos: ['sin seguro', 'sin poliza', 'seguro caducado', 'conducir sin seguro'],
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
    terminos: ['sin itv', 'itv caducada', 'itv pasada', 'sin pasar la itv'],
    marcoImporte: 'trafico',
    notaRevision:
      'Importe 200 € (grave) verificado; no detrae puntos. A VERIFICAR: si el retraso supera un ' +
      'año la infracción pasa a muy grave (500 €). Considerar modelarlo como variante.',
  }),
  construirInfraccion({
    id: 'inf-sin-cinturon',
    articulo: ART_RGC_117,
    tituloCorto: 'No usar el cinturón de seguridad',
    gravedad: 'grave',
    importeEur: 200,
    importeReducidoEur: 100,
    puntos: 3,
    textoBoletin:
      'Circular sin hacer uso del cinturón de seguridad o de los sistemas de retención ' +
      'homologados estando el vehículo dotado de ellos.',
    terminos: ['sin cinturon', 'sin cinto', 'no llevar cinturon'],
    marcoImporte: 'trafico',
    notaRevision:
      'A VERIFICAR puntos: importe 200 € consolidado; los puntos (históricamente 3) pueden ' +
      'cambiar con la reforma del RGC de octubre de 2026 (fuentes citan 3, 4 o sin puntos). ' +
      'Confirmar con el codificado DGT vigente.',
  }),
  construirInfraccion({
    id: 'inf-sin-casco',
    articulo: ART_RGC_118,
    tituloCorto: 'Circular sin casco homologado',
    gravedad: 'grave',
    importeEur: 200,
    importeReducidoEur: 100,
    puntos: 3,
    textoBoletin:
      'Conducir o viajar en motocicleta o ciclomotor sin el casco de protección homologado y ' +
      'correctamente abrochado.',
    terminos: ['sin casco', 'moto sin casco', 'circular sin casco'],
    marcoImporte: 'trafico',
    notaRevision:
      'A VERIFICAR puntos: importe 200 € consolidado; los puntos (históricamente 3) pueden ' +
      'cambiar con la reforma del RGC de octubre de 2026. Confirmar con el codificado DGT vigente.',
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
    terminos: ['saltarse el semaforo', 'semaforo en rojo', 'pasarse el rojo', 'saltarse un rojo'],
    marcoImporte: 'trafico',
    notaRevision:
      'Importe 200 € (grave) y 4 puntos verificados (RGC art. 146). Pendiente de visto bueno del ' +
      'revisor.',
  }),
];

/** Estructura completa del seed lista para el constructor del paquete. */
export interface SeedContenido {
  normas: Norma[];
  articulos: Articulo[];
  infracciones: InfraccionSeed[];
}

export const SEED_TRAFICO: SeedContenido = {
  normas: NORMAS_SEED,
  articulos: ARTICULOS_SEED,
  infracciones: INFRACCIONES_SEED,
};
