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
const FECHA_ACTUALIZACION = '2026-09-07';
const VALID_FROM = `${FECHA_ACTUALIZACION}T00:00:00.000Z`;

// --- Identificadores de norma (BOE, legislación consolidada) --------------------------------
const ID_RGC = 'BOE-A-2003-23514'; // RD 1428/2003, Reglamento General de Circulación
const ID_LSV = 'BOE-A-2015-11722'; // RDL 6/2015, texto refundido de la Ley de Tráfico (LSV)
const ID_RGV = 'BOE-A-1999-1826'; // RD 2822/1998, Reglamento General de Vehículos
const ID_LRCSCVM = 'BOE-A-2004-18911'; // RDL 8/2004, seguro obligatorio (LRCSCVM)
const ID_CP = 'BOE-A-1995-25444'; // LO 10/1995, Código Penal (delitos contra la seguridad vial)

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

export const ARTICULOS_SEED: Articulo[] = [
  ART_RGC_99,
  ART_RGC_18,
  ART_RGC_117,
  ART_RGC_118,
  ART_RGC_146,
  ART_RGC_48,
  ART_RGC_94,
  ART_RGC_121,
  ART_RGV_10,
  ART_LRCSCVM_3,
  ART_LSV_104,
  ART_LSV_105,
  ART_LSV_14,
  ART_LSV_77,
  ART_CP_383,
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
  puntos: number | null;
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
    tipo: input.tipo ?? 'administrativa',
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
    ],
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
    // Cuadro graduado (LSV): 100 € sin puntos → 300/400/500/600 € con 2/4/6 puntos. Se
    // sitúa un tramo intermedio (300 € / 2 puntos) como valor de referencia de la ficha; el
    // cuadro completo va en el texto del boletín y en la nota de revisión.
    importeEur: 300,
    importeReducidoEur: 150,
    puntos: 2,
    textoBoletin:
      'Circular a velocidad superior a la permitida en la vía. La sanción se gradúa por el exceso ' +
      'sobre el límite: 100 € (sin puntos), 300 € (2 puntos), 400 € (4 puntos), 500 € (6 puntos) y ' +
      '600 € (6 puntos) en el tramo más alto. Superar el límite en más de 60 km/h en vía urbana o ' +
      'en más de 80 km/h en vía interurbana puede ser delito (art. 379.1 CP).',
    terminos: [
      'exceso de velocidad',
      'iba muy rapido',
      'corriendo',
      'a toda pastilla',
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
      'según el límite de la vía) contra el cuadro de la LSV y el codificado DGT: la ficha muestra ' +
      'un tramo de referencia (300 €/2 puntos). Confirmar también la frontera penal del art. 379.1 ' +
      'CP (60 km/h urbana / 80 km/h interurbana sobre el límite). No publicar sin desglose por tramos.',
  }),
  construirInfraccion({
    id: 'inf-alcoholemia',
    articulo: ART_LSV_14,
    tituloCorto: 'Conducir bajo los efectos del alcohol',
    gravedad: 'muy_grave',
    // Cuadro DGT: 500 € (0,25–0,50 mg/l, 4 puntos) o 1.000 € (>0,50 mg/l, reincidencia o
    // conductor profesional/novel, 6 puntos). Se toma el tramo bajo como referencia.
    importeEur: 500,
    importeReducidoEur: 250,
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
      'ocupantes. Circular por la acera o sin alumbrado nocturno se sanciona con 200 €; llevar dos ' +
      'personas, con 100 €. El VMP no detrae puntos porque no requiere permiso de conducción.',
    terminos: [
      'patinete',
      'patinete electrico',
      'vmp',
      'patinete en la acera',
      'patinete sin luces',
      'dos en un patinete',
      'patinete dos personas',
      'patinete de noche',
    ],
    marcoImporte: 'trafico',
    notaRevision:
      'A VERIFICAR: los VMP se regulan por el RGC (reforma del RD 970/2020) Y por la ordenanza ' +
      'municipal, que puede endurecer o matizar (casco, chaleco, zonas). Los importes citados ' +
      '(200 €/100 €) proceden de criterios DGT; confirmar por supuesto y advertir de la variación ' +
      'municipal. Alcohol y drogas en VMP se rigen por sus propias tasas. No detrae puntos. Revisar.',
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
