/**
 * Datos de la GUÍA RÁPIDA DE EXTRANJERÍA EN LA CALLE (LO 4/2000 de derechos y libertades de los
 * extranjeros; Ley 12/2009 de asilo). Contenido de referencia ESTÁTICO en la app (patrón de las guías
 * de identificación, alcoholemia y menores): resume, escaneable y para uso EN DIRECTO, la duda de
 * calle nº 1 de PN/GC con un extranjero —"es irregular, ¿lo detengo?"— dejando claro que la estancia
 * irregular es vía ADMINISTRATIVA (no penal), qué documentos valen, el margen de retención/detención
 * cautelar, el que ya tiene orden de expulsión, el que pide asilo, cuándo SÍ es delito y el enlace con
 * el menor extranjero (MENA).
 *
 * Cada sección abre con la ACCIÓN operativa (qué hago AHORA) y debajo el fundamento. Parte del texto
 * reutiliza el motor de detención (`@agente/shared`, rama migratoria), ya cotejado. Cotejado por el
 * revisor jurídico (2026-09): en la mera estancia irregular la sanción PREFERENTE es la MULTA, no la
 * expulsión (doctrina TS Sala 3.ª 2023); detención cautelar gubernativa máx. 72 h (art. 61); CIE lo
 * autoriza el Juez de Instrucción (art. 62). Orientativo y "Borrador beta": asilo, orden de expulsión
 * y documentos válidos quedan como orientación; la valoración final corresponde al agente y, en su
 * caso, a la autoridad administrativa o judicial.
 */

export interface PuntoGuiaExtranjeria {
  texto: string;
  /** Punto clave (se resalta). */
  fuerte?: boolean;
}

export interface SeccionGuiaExtranjeria {
  titulo: string;
  /** ACCIÓN operativa de un vistazo (qué hago AHORA), pintada como chip destacado. */
  accion: string;
  /** Artículo(s) de referencia, para el chip de fuente. */
  articulo: string;
  /** Ficha del paquete que amplía la sección (opcional). */
  fichaId?: string;
  puntos: readonly PuntoGuiaExtranjeria[];
}

/** Fecha de actualización/vigencia visible (regla CLAUDE.md: fuente + fecha en todo contenido legal). */
export const ACTUALIZACION_GUIA_EXTRANJERIA = 'septiembre de 2026';

export const GUIA_EXTRANJERIA: readonly SeccionGuiaExtranjeria[] = [
  {
    titulo: 'Estancia irregular: NO es delito',
    accion: 'Vía ADMINISTRATIVA, no penal: identifica e incoa; no detención penal por ese motivo.',
    articulo: 'art. 53.1.a LO 4/2000',
    fichaId: 'ext-estancia-irregular',
    puntos: [
      {
        texto:
          'La estancia irregular en España es una infracción administrativa GRAVE, no un delito (art. 53.1.a LO 4/2000): no procede detención penal por ese motivo.',
        fuerte: true,
      },
      {
        texto:
          'Procede la identificación y, en su caso, la incoación del procedimiento administrativo sancionador de extranjería.',
      },
      {
        texto:
          'En la MERA estancia irregular la sanción PREFERENTE es la MULTA (art. 55.1); la expulsión (art. 57, con prohibición de entrada del art. 58) exige circunstancias agravantes añadidas y resolución motivada (doctrina del Tribunal Supremo, Sala 3.ª, 2023). Lo decide el procedimiento administrativo.',
        fuerte: true,
      },
    ],
  },
  {
    titulo: 'Documentación: qué me vale',
    accion: 'Pide identificación; no portarla no es, por sí solo, estancia irregular.',
    articulo: 'art. 4 LO 4/2000',
    fichaId: 'ext-no-portar-documentacion',
    puntos: [
      {
        texto:
          'El extranjero tiene el derecho y el deber de documentar su identidad y su situación (art. 4 LO 4/2000).',
        fuerte: true,
      },
      {
        texto:
          'Documentos que, en principio, acreditan situación (a verificar caso a caso): pasaporte (con visado si procede), TIE (tarjeta de identidad de extranjero), certificado de registro de ciudadano de la Unión o tarjeta de residencia de familiar de ciudadano de la UE, resguardo de solicitud en trámite y tarjeta roja del solicitante de asilo.',
      },
      {
        texto:
          'No portar la documentación en ese momento NO equivale, por sí solo, a estancia irregular: es una cosa la falta de documento encima y otra la situación real, que se comprueba. Si no puede acreditarla, cabe la identificación por otros medios o el traslado a dependencias para identificar (art. 16 LO 4/2015).',
        fuerte: true,
      },
    ],
  },
  {
    titulo: 'Ya tiene orden de expulsión o devolución',
    accion: 'Comprueba si hay orden ejecutable y actúa conforme a ella (a verificar).',
    articulo: 'arts. 57, 58 y 64 LO 4/2000',
    puntos: [
      {
        texto:
          'Si ya existe una orden de expulsión/devolución EJECUTABLE, la actuación no es la de la mera estancia irregular: se actúa conforme a la orden y a las instrucciones de la autoridad competente (a verificar en cada caso).',
        fuerte: true,
      },
      {
        texto:
          'Comprueba en las aplicaciones policiales si consta orden vigente, prohibición de entrada o requisitoria antes de decidir.',
      },
      {
        texto:
          'Regresar tras una expulsión con prohibición de entrada vigente puede tener consecuencias añadidas; la calificación (administrativa o, en su caso, penal), a verificar.',
      },
    ],
  },
  {
    titulo: 'Pide asilo o protección internacional',
    accion: 'Si manifiesta que pide asilo, NO es expulsable mientras se tramita: canalízalo.',
    articulo: 'arts. 5 y 19 Ley 12/2009 de asilo',
    puntos: [
      {
        texto:
          'Basta con que MANIFIESTE su voluntad de solicitar protección internacional (asilo): a partir de ahí, con carácter general, NO es expulsable ni devolvible mientras se tramita la solicitud (principio de no devolución; art. 19.1 Ley 12/2009), salvo las excepciones tasadas de la propia ley.',
        fuerte: true,
      },
      {
        texto:
          'El solicitante en trámite se acredita con el resguardo de solicitud o la "tarjeta roja". Procede canalizarlo por el procedimiento de asilo ante la autoridad competente, no por la vía de expulsión.',
        fuerte: true,
      },
      {
        texto: 'Detalles del procedimiento y excepciones, a verificar con la unidad competente.',
      },
    ],
  },
  {
    titulo: 'Retención y detención cautelar',
    accion: 'No es "no se puede retener": detención cautelar gubernativa máx. 72 h para la expulsión.',
    articulo: 'arts. 61 y 62 LO 4/2000',
    puntos: [
      {
        texto:
          'Que no haya detención penal NO equivale a "no se puede retener": cabe la identificación y las diligencias del procedimiento.',
        fuerte: true,
      },
      {
        texto:
          'Cabe la DETENCIÓN CAUTELAR gubernativa por un máximo de 72 HORAS, previa a la solicitud de internamiento, para asegurar la expulsión (art. 61 LO 4/2000).',
        fuerte: true,
      },
      {
        texto:
          'El internamiento en CIE es una medida cautelar DISTINTA, que autoriza el JUEZ DE INSTRUCCIÓN a instancia de la Administración (art. 62 LO 4/2000): no es una detención penal policial.',
      },
    ],
  },
  {
    titulo: 'Cuándo SÍ es vía penal',
    accion: 'Delito solo en supuestos concretos (favorecimiento, trata), no la mera estancia irregular.',
    articulo: 'arts. 318 bis y 177 bis CP',
    puntos: [
      {
        texto:
          'La MERA estancia irregular del extranjero nunca es delito. La vía penal aparece en conductas distintas y más graves.',
        fuerte: true,
      },
      {
        texto:
          'Favorecimiento de la inmigración ilegal / tráfico de personas (art. 318 bis CP) y trata de seres humanos (art. 177 bis CP): ahí sí procede la vía penal.',
        fuerte: true,
      },
      {
        texto:
          'La documentación falsa (pasaporte o tarjeta falsificados) es falsedad documental, otra vía penal distinta.',
      },
    ],
  },
  {
    titulo: 'Si es menor (MENA)',
    accion: 'Protección, no sanción: a la Entidad de Protección y aviso a Fiscalía.',
    articulo: 'art. 35 LO 4/2000 · LO 1/1996',
    fichaId: 'sc-mena-consulta',
    puntos: [
      {
        texto:
          'Un menor extranjero no acompañado es, ante todo, un MENOR en desamparo: tratamiento de PROTECCIÓN, no sancionador; rige el interés superior del menor.',
        fuerte: true,
      },
      {
        texto:
          'Puesta a disposición de la Entidad Pública de protección de menores y comunicación inmediata a la Fiscalía de Menores (art. 35 LO 4/2000). En ningún caso calabozo por ser menor o extranjero.',
        fuerte: true,
      },
      {
        texto:
          'Si dice ser menor y aparenta ser adulto (o al revés), la determinación de la edad la acuerda el Ministerio Fiscal por el procedimiento previsto (art. 35.3): no la valora el agente. Mientras no se determine con seguridad, se le da tratamiento de MENOR (atención de protección).',
      },
    ],
  },
];
