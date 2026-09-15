import {
  Articulo,
  Consecuencia,
  Infraccion,
  Norma,
  Sinonimo,
  type Cuerpo,
  type CuerpoCompetente,
  type EstadoRevision,
  type MarcoImporte,
} from '@agente/shared';
import { hashTexto } from '../parsers/boe-xml/hash.js';
import type { InfraccionSeed, SeedContenido } from './traficoSeed.js';

/**
 * SEED de SEGURIDAD PRIVADA — Ley 5/2014, de 4 de abril (BOE-A-2014-3649). ESTATAL.
 *
 * Hueco de GUARDIA CIVIL y POLICÍA NACIONAL: el control de la seguridad privada (vigilantes,
 * escoltas, empresas, detectives) lo ejercen la Unidad Central de Seguridad Privada (Policía
 * Nacional) y la Guardia Civil en su ámbito. Faltaban fichas de calle para la intervención típica:
 * el vigilante sin habilitación, la empresa sin autorización, la negativa a auxiliar/identificarse
 * ante los agentes, el exceso de funciones y la falta de uniformidad/TIP.
 *
 * Reglas aplicadas (CLAUDE.md y nota legal):
 *  - Textos de artículo y de boletín REDACTADOS POR NOSOTROS (resúmenes neutros, no copiados).
 *  - Toda infracción lleva su artículo fuente; la fecha visible la aporta el `ContentVersion`.
 *  - Lenguaje ORIENTATIVO ("procede/puede", nunca imperativo).
 *  - Importes COTEJADOS contra el BOE (arts. 61 empresas y 62 personal, leídos en el navegador
 *    2026-09-15): son horquillas en euros, así que se marcan `verificado`. Marco `seguridad_privada`
 *    (coherencia; el rango exacto —distinto para empresa y personal— va en la propia ficha).
 */

/** Fecha de curación de este seed (la que verá el agente como "Actualizado el…"). */
const FECHA_ACTUALIZACION = '2026-09-15';
const VALID_FROM = `${FECHA_ACTUALIZACION}T00:00:00.000Z`;

const ID_LSP = 'BOE-A-2014-3649'; // Ley 5/2014, de 4 de abril, de Seguridad Privada

/**
 * Cuerpos que controlan la seguridad privada: Policía Nacional (Unidad Central de Seguridad
 * Privada) y Guardia Civil en su ámbito. NO es competencia de oficio de la policía local. Relevancia
 * (no restringe el acceso), columna `cuerpos` del paquete.
 */
const CUERPOS_SEGPRIV: Cuerpo[] = ['policia_nacional', 'guardia_civil'];
const COMPETENCIA_SEGPRIV: CuerpoCompetente[] = ['policia_nacional', 'guardia_civil'];

export const NORMAS_SEGURIDAD_PRIVADA_SEED: Norma[] = [
  Norma.parse({
    id: ID_LSP,
    codigo: 'LSP',
    titulo: 'Ley de Seguridad Privada (Ley 5/2014, de 4 de abril)',
    tipo: 'ley',
    ambito: 'estatal',
    territorioId: null,
    origen: 'oficial',
    urlBoe: `https://www.boe.es/buscar/act.php?id=${ID_LSP}`,
    fechaConsolidacion: null,
    cuerpos: CUERPOS_SEGPRIV,
  }),
];

// --- Artículos citados (resúmenes neutros propios) ------------------------------------------
function articuloSeed(numero: string, titulo: string, texto: string): Articulo {
  return Articulo.parse({
    id: `${ID_LSP}:seed-a${numero.replace(/\s+/g, '')}`,
    normaId: ID_LSP,
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

const ART_LSP_57 = articuloSeed(
  '57',
  'Infracciones de las empresas de seguridad privada',
  'Tipifica las infracciones de las empresas de seguridad privada, sus representantes legales, los ' +
    'despachos de detectives y las centrales de alarma de uso propio (muy graves, graves y leves). Entre ' +
    'las MUY GRAVES, la prestación de servicios de seguridad privada a terceros careciendo de autorización ' +
    'o sin haber presentado la declaración responsable exigible (art. 57.1.a). Resumen orientativo; ' +
    'consúltese el texto consolidado en el BOE.',
);

const ART_LSP_58 = articuloSeed(
  '58',
  'Infracciones del personal de seguridad privada',
  'Tipifica las infracciones del personal que desempeña funciones de seguridad privada (vigilantes, ' +
    'escoltas, detectives, etc.). MUY GRAVES (art. 58.1): ejercer funciones de seguridad privada sin la ' +
    'habilitación necesaria (a); el incumplimiento sobre tenencia y uso de armas fuera de servicio (b); la ' +
    'negativa a auxiliar o colaborar con las Fuerzas y Cuerpos de Seguridad (d); la negativa a ' +
    'identificarse profesionalmente ante la autoridad o sus agentes (e); el ejercicio abusivo de sus ' +
    'funciones (h). GRAVES (art. 58.2): realizar funciones que excedan de la habilitación obtenida (a). ' +
    'LEVES (art. 58.3): actuar sin la uniformidad, medios, distintivos o documentación profesional ' +
    'exigibles (a). Resumen orientativo; consúltese el texto consolidado en el BOE.',
);

const ART_LSP_61 = articuloSeed(
  '61',
  'Sanciones a las empresas de seguridad privada',
  'Fija las multas de las infracciones del art. 57: muy graves de 30.001 a 600.000 € (con extinción de ' +
    'la autorización o cierre); graves de 3.001 a 30.000 € (con suspensión temporal); leves, ' +
    'apercibimiento o multa de 300 a 3.000 €. Resumen orientativo; consúltese el texto consolidado en el BOE.',
);

const ART_LSP_62 = articuloSeed(
  '62',
  'Sanciones al personal de seguridad privada',
  'Fija las multas de las infracciones del art. 58: muy graves de 6.001 a 30.000 € (con extinción de la ' +
    'habilitación); graves de 1.001 a 6.000 € (con suspensión temporal de la habilitación); leves, ' +
    'apercibimiento o multa de 300 a 1.000 €. Resumen orientativo; consúltese el texto consolidado en el BOE.',
);

export const ARTICULOS_SEGURIDAD_PRIVADA_SEED: Articulo[] = [
  ART_LSP_57,
  ART_LSP_58,
  ART_LSP_61,
  ART_LSP_62,
];

// --- Constructor de una infracción de seguridad privada -------------------------------------
interface SegPrivInput {
  id: string;
  articulo: Articulo;
  tituloCorto: string;
  gravedad: Infraccion['gravedad'];
  importeEur: number;
  importeMaxEur: number;
  textoBoletin: string;
  terminos: string[];
  notaRevision: string;
  /** Consecuencia operativa opcional (p. ej. identificación del vigilante). */
  consecuencias?: Array<{ tipo: Consecuencia['tipo']; textoCorto: string; fuente: string }>;
}

function construirInfraccion(input: SegPrivInput): InfraccionSeed {
  const infraccion = Infraccion.parse({
    id: input.id,
    articuloId: input.articulo.id,
    codigoDgt: null,
    tituloCorto: input.tituloCorto,
    gravedad: input.gravedad,
    tipo: 'administrativa',
    importeEur: input.importeEur,
    importeReducidoEur: null,
    importeMaxEur: input.importeMaxEur,
    puntos: null,
    textoBoletin: input.textoBoletin,
    variantesBoletin: [],
    competencia: { cuerpos: COMPETENCIA_SEGPRIV, via: 'ambas' },
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
    // Importes cotejados contra el BOE (arts. 61/62, euros): se publican `verificado`. Marco de
    // coherencia `seguridad_privada` (empresa y personal tienen horquillas distintas, van en la ficha).
    marcoImporte: 'seguridad_privada' satisfies MarcoImporte,
    revision: 'verificado' satisfies EstadoRevision,
    notaRevision: input.notaRevision,
  };
}

export const INFRACCIONES_SEGURIDAD_PRIVADA_SEED: InfraccionSeed[] = [
  construirInfraccion({
    id: 'segpriv-sin-habilitacion',
    articulo: ART_LSP_58,
    tituloCorto: 'Vigilante o personal sin habilitación',
    gravedad: 'muy_grave',
    importeEur: 6001,
    importeMaxEur: 30000,
    textoBoletin:
      'Ejercer funciones de seguridad privada para terceros (vigilancia, protección, escolta) careciendo ' +
      'de la HABILITACIÓN o acreditación necesaria es infracción MUY GRAVE del art. 58.1.a de la Ley ' +
      '5/2014 (multa de 6.001 a 30.000 €, art. 62.1, con posible extinción de la habilitación). Si quien ' +
      'presta el servicio es una EMPRESA sin autorización, ver segpriv-empresa-sin-autorizacion (art. ' +
      '57.1.a). La valoración final corresponde a la autoridad competente.',
    terminos: [
      'vigilante sin habilitacion',
      'vigilante sin tip',
      'seguridad sin licencia',
      'vigilante sin acreditacion',
      'guarda sin habilitacion',
      'segurata sin habilitacion',
      'falso vigilante',
      'vigilante no habilitado',
      'escolta sin habilitacion',
      'vigilante jurado',
      'jurado sin habilitacion',
      'segurata',
      'guarda jurado',
      'portero de discoteca',
      'controlador de acceso',
      'gorila',
      'gorila de discoteca',
      'portero que cachea',
      'vigilante del super',
      'vigilante del centro comercial',
      'guardaespaldas',
      'guardaespaldas sin habilitacion',
    ],
    consecuencias: [
      {
        tipo: 'identificacion',
        textoCorto:
          'Procede identificar a la persona y comprobar su habilitación en el Registro Nacional de ' +
          'Seguridad Privada; poner los hechos en conocimiento de la Unidad de Seguridad Privada competente.',
        fuente: 'Ley 5/2014 (control de la seguridad privada)',
      },
    ],
    notaRevision:
      'COTEJADO contra el BOE (Ley 5/2014, BOE-A-2014-3649, arts. 58.1.a y 62.1, leído 2026-09-15): ' +
      'ejercer funciones de seguridad privada sin habilitación es MUY GRAVE, multa de 6.001 a 30.000 € ' +
      '(art. 62.1). Deslinde con el intrusismo y con la empresa sin autorización (art. 57). Segundo ' +
      'revisor humano para el cierre.',
  }),
  construirInfraccion({
    id: 'segpriv-empresa-sin-autorizacion',
    articulo: ART_LSP_57,
    tituloCorto: 'Empresa de seguridad privada sin autorización',
    gravedad: 'muy_grave',
    importeEur: 30001,
    importeMaxEur: 600000,
    textoBoletin:
      'Prestar servicios de seguridad privada a terceros careciendo de autorización o sin haber ' +
      'presentado la declaración responsable exigible es infracción MUY GRAVE del art. 57.1.a de la Ley ' +
      '5/2014 (multa de 30.001 a 600.000 €, art. 61.1, con extinción de la autorización o cierre). Si quien ' +
      'presta el servicio sin habilitación es una PERSONA (no una empresa), ver segpriv-sin-habilitacion ' +
      '(art. 58.1.a, multa de 6.001 a 30.000 €). La valoración final corresponde a la autoridad competente.',
    terminos: [
      'empresa de seguridad sin autorizacion',
      'empresa de seguridad ilegal',
      'seguridad privada sin autorizacion',
      'empresa de vigilancia sin licencia',
      'central de alarmas ilegal',
      'empresa seguridad no registrada',
      'empresa de seguridad pirata',
      'vigilancia sin papeles',
      'empresa de seguratas ilegal',
    ],
    consecuencias: [
      {
        tipo: 'identificacion',
        textoCorto:
          'Procede comprobar la autorización o declaración responsable de la empresa en el Registro de ' +
          'empresas de seguridad privada y poner los hechos en conocimiento de la Unidad Central de ' +
          'Seguridad Privada (Policía Nacional) o la unidad competente.',
        fuente: 'Ley 5/2014 (registro y control de empresas de seguridad privada)',
      },
    ],
    notaRevision:
      'COTEJADO contra el BOE (Ley 5/2014, arts. 57.1.a y 61.1, leído 2026-09-15): prestar servicios de ' +
      'seguridad privada sin autorización/declaración responsable es MUY GRAVE, multa de 30.001 a 600.000 € ' +
      '(art. 61.1). Segundo revisor humano para el cierre.',
  }),
  construirInfraccion({
    id: 'segpriv-negativa-auxilio-fcs',
    articulo: ART_LSP_58,
    tituloCorto: 'Vigilante que niega auxilio o colaboración a las FCS',
    gravedad: 'muy_grave',
    importeEur: 6001,
    importeMaxEur: 30000,
    textoBoletin:
      'La negativa del personal de seguridad privada a prestar auxilio o colaboración a las Fuerzas y ' +
      'Cuerpos de Seguridad, cuando proceda, en la investigación y persecución de delitos, en la ' +
      'detención de delincuentes o en las funciones de inspección o control, es infracción MUY GRAVE del ' +
      'art. 58.1.d de la Ley 5/2014 (multa de 6.001 a 30.000 €, art. 62.1). La valoración final ' +
      'corresponde a la autoridad competente.',
    terminos: [
      'vigilante no colabora',
      'vigilante niega auxilio',
      'seguridad no colabora con la policia',
      'vigilante no ayuda a la policia',
      'segurata no colabora',
      'segurata no colabora en la detencion',
      'vigilante obstaculiza a la policia',
      'vigilante pasa de la policia',
      'vigilante no da las camaras',
      'vigilante no facilita grabaciones',
    ],
    consecuencias: [
      {
        tipo: 'identificacion',
        textoCorto:
          'Procede identificar al personal de seguridad y valorar, según la conducta, la desobediencia ' +
          '(LO 4/2015 art. 36.6 o art. 556 CP, a verificar por el revisor); no aplicar ambas a los mismos ' +
          'hechos (non bis in idem).',
        fuente: 'Ley 5/2014 art. 58.1.d; LO 4/2015 art. 36.6 / CP 556 (a verificar)',
      },
    ],
    notaRevision:
      'COTEJADO contra el BOE (Ley 5/2014, arts. 58.1.d y 62.1, leído 2026-09-15): la negativa a auxiliar ' +
      'o colaborar con las FCS es MUY GRAVE, multa de 6.001 a 30.000 €. Deslinde con la desobediencia (LO ' +
      '4/2015 art. 36.6 / art. 556 CP): no acumular ambas por el mismo hecho. Segundo revisor humano.',
  }),
  construirInfraccion({
    id: 'segpriv-negativa-identificarse',
    articulo: ART_LSP_58,
    tituloCorto: 'Vigilante que se niega a identificarse ante los agentes',
    gravedad: 'muy_grave',
    importeEur: 6001,
    importeMaxEur: 30000,
    textoBoletin:
      'La negativa del personal de seguridad privada a identificarse profesionalmente, en el ejercicio de ' +
      'sus funciones, ante la autoridad o sus agentes cuando sea requerido, es infracción MUY GRAVE del ' +
      'art. 58.1.e de la Ley 5/2014 (multa de 6.001 a 30.000 €, art. 62.1). La valoración final ' +
      'corresponde a la autoridad competente.',
    terminos: [
      'vigilante no se identifica',
      'vigilante niega identificarse',
      'segurata no se identifica',
      'vigilante no ensena la tip',
      'no muestra la tarjeta de vigilante',
      'vigilante sin identificarse',
      'vigilante no da el numero de tip',
      'no ensena la placa',
      'segurata sin placa',
    ],
    consecuencias: [
      {
        tipo: 'identificacion',
        textoCorto:
          'Procede requerir la identificación profesional (TIP) y personal; la negativa, en el ejercicio ' +
          'de sus funciones, es la propia infracción muy grave (art. 58.1.e).',
        fuente: 'Ley 5/2014 art. 58.1.e',
      },
    ],
    notaRevision:
      'COTEJADO contra el BOE (Ley 5/2014, arts. 58.1.e y 62.1, leído 2026-09-15): negarse a identificarse ' +
      'profesionalmente ante la autoridad/agentes es MUY GRAVE, multa de 6.001 a 30.000 €. Deslinde con la ' +
      'desobediencia (LO 4/2015 art. 36.6 o art. 556 CP): son planos distintos; NO acumular ambas por el ' +
      'mismo hecho (non bis in idem). Lo cierra el revisor. Segundo revisor humano.',
  }),
  construirInfraccion({
    id: 'segpriv-exceso-funciones',
    articulo: ART_LSP_58,
    tituloCorto: 'Vigilante que excede las funciones de su habilitación',
    gravedad: 'grave',
    importeEur: 1001,
    importeMaxEur: 6000,
    textoBoletin:
      'Realizar funciones de seguridad privada que EXCEDAN de la habilitación obtenida (por ejemplo, un ' +
      'vigilante que actúa fuera del inmueble que protege, o que asume funciones propias de la policía) es ' +
      'infracción GRAVE del art. 58.2.a de la Ley 5/2014 (multa de 1.001 a 6.000 €, art. 62.2). SALTO A LO ' +
      'PENAL (a valorar por el instructor): retener o esposar a una persona → detención ilegal por ' +
      'particular (arts. 163/165 CP); cacheo o expulsión coactiva → coacciones (art. 172 CP); hacerse pasar ' +
      'por policía → usurpación de funciones (art. 402 CP). OJO: retener a quien acaba de cometer un delito ' +
      'flagrante puede ser una detención LÍCITA de particular (art. 490 LECrim), no infracción. La ' +
      'valoración final corresponde a la autoridad competente.',
    terminos: [
      'vigilante se extralimita',
      'vigilante fuera de su sitio',
      'vigilante hace de policia',
      'exceso de funciones vigilante',
      'vigilante actua en la via publica',
      'segurata se pasa de funciones',
      'vigilante retiene a un cliente',
      'vigilante esposa',
      'vigilante cachea',
      'vigilante expulsa a la fuerza',
      'segurata agrede',
      'vigilante del super retiene al ladron',
    ],
    consecuencias: [
      {
        tipo: 'identificacion',
        textoCorto:
          'Procede identificar al vigilante y comprobar su habilitación; si ha retenido, esposado, cacheado ' +
          'o expulsado coactivamente, valorar la vía PENAL (detención ilegal arts. 163/165, coacciones 172, ' +
          'usurpación de funciones 402 CP, a verificar) y poner los hechos en conocimiento de la Unidad de ' +
          'Seguridad Privada.',
        fuente: 'Ley 5/2014 art. 58.2.a; CP 163/165, 172, 402 (a verificar)',
      },
    ],
    notaRevision:
      'COTEJADO contra el BOE (Ley 5/2014, arts. 58.2.a y 62.2, leído 2026-09-15): exceder las funciones ' +
      'de la habilitación es GRAVE, multa de 1.001 a 6.000 €. El SALTO PENAL (detención ilegal 163/165, ' +
      'coacciones 172, usurpación de funciones 402 CP) y el matiz de la detención lícita de particular ' +
      '(art. 490 LECrim) van "a verificar" por el revisor. Segundo revisor humano.',
  }),
  construirInfraccion({
    id: 'segpriv-sin-uniforme-tip',
    articulo: ART_LSP_58,
    tituloCorto: 'Vigilante sin uniforme, distintivos o TIP',
    gravedad: 'leve',
    importeEur: 300,
    importeMaxEur: 1000,
    textoBoletin:
      'Actuar sin la debida uniformidad o medios reglamentarios, o sin portar los distintivos o la ' +
      'documentación profesional (TIP), incluida la del arma de fuego usada en el servicio, es infracción ' +
      'LEVE del art. 58.3.a de la Ley 5/2014 (apercibimiento o multa de 300 a 1.000 €, art. 62.3). La ' +
      'valoración final corresponde a la autoridad competente.',
    terminos: [
      'vigilante sin uniforme',
      'vigilante sin tip encima',
      'vigilante sin distintivos',
      'vigilante de paisano',
      'sin tarjeta de identidad profesional',
      'vigilante sin documentacion profesional',
      'vigilante de particular',
      'sin chapa',
      'sin placa de vigilante',
    ],
    consecuencias: [
      {
        tipo: 'identificacion',
        textoCorto:
          'Procede identificar al vigilante y requerir la tarjeta de identidad profesional (TIP) y, en su ' +
          'caso, la documentación del arma; comprobar su habilitación en el registro.',
        fuente: 'Ley 5/2014 art. 58.3.a',
      },
    ],
    notaRevision:
      'COTEJADO contra el BOE (Ley 5/2014, arts. 58.3.a y 62.3, leído 2026-09-15): actuar sin uniformidad, ' +
      'distintivos o documentación profesional (TIP) es LEVE, apercibimiento o multa de 300 a 1.000 €. ' +
      'Segundo revisor humano.',
  }),
  construirInfraccion({
    id: 'segpriv-arma-fuera-servicio',
    articulo: ART_LSP_58,
    tituloCorto: 'Vigilante: arma fuera de servicio o uso indebido',
    gravedad: 'muy_grave',
    importeEur: 6001,
    importeMaxEur: 30000,
    textoBoletin:
      'El incumplimiento por el personal de seguridad privada de las previsiones sobre TENENCIA de armas ' +
      'de fuego fuera del servicio y sobre su UTILIZACIÓN es infracción MUY GRAVE del art. 58.1.b de la ' +
      'Ley 5/2014 (multa de 6.001 a 30.000 €, art. 62.1). El vigilante solo porta el arma en acto de ' +
      'servicio y en los supuestos previstos; llevarla fuera de servicio o usarla indebidamente incumple la ' +
      'ley (sin perjuicio de la responsabilidad PENAL si hay disparo o amenaza, que se valora aparte). La ' +
      'valoración final corresponde a la autoridad competente.',
    terminos: [
      'vigilante con pistola',
      'vigilante armado',
      'arma de vigilante',
      'segurata con arma',
      'vigilante saca la pistola',
      'vigilante con el arma fuera de servicio',
      'uso indebido arma vigilante',
      'intervenir arma vigilante',
    ],
    consecuencias: [
      {
        tipo: 'decomiso',
        textoCorto:
          'Procede valorar la intervención/retirada del arma y comprobar la guía y la habilitación del ' +
          'vigilante; poner los hechos en conocimiento de la Intervención de Armas (Guardia Civil) y de la ' +
          'Unidad de Seguridad Privada. La valoración final corresponde a la autoridad competente.',
        fuente: 'Ley 5/2014 art. 58.1.b; normativa de armas (Guardia Civil)',
      },
    ],
    notaRevision:
      'COTEJADO contra el BOE (Ley 5/2014, arts. 58.1.b y 62.1, leído 2026-09-15): incumplir las ' +
      'previsiones sobre tenencia fuera de servicio y uso del arma es MUY GRAVE, multa de 6.001 a 30.000 €. ' +
      'Si hay disparo, amenaza o lesión, valorar la vía PENAL aparte. Segundo revisor humano.',
  }),
];

/** Estructura completa del seed lista para combinar con el resto de contenido. */
export const SEED_SEGURIDAD_PRIVADA: SeedContenido = {
  normas: NORMAS_SEGURIDAD_PRIVADA_SEED,
  articulos: ARTICULOS_SEGURIDAD_PRIVADA_SEED,
  infracciones: INFRACCIONES_SEGURIDAD_PRIVADA_SEED,
};
