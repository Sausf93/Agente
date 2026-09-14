/**
 * Datos de la GUÍA RÁPIDA DE VIOLENCIA DE GÉNERO Y DOMÉSTICA (arts. 153, 173.2, 147/148 y 153.3 CP;
 * arts. 490/492, 544 bis y 544 ter LECrim; art. 468 CP; sistema VioGén / valoración policial del
 * riesgo). Contenido de referencia ESTÁTICO en la app (patrón de las guías de menores y extranjería):
 * resume, escaneable y para uso EN DIRECTO, la intervención más delicada y frecuente para los tres
 * cuerpos, con la PROTECCIÓN de la víctima primero y los escenarios que descolocan en la calle (la
 * víctima que no quiere denunciar, las denuncias cruzadas, el agresor que ya no está).
 *
 * Cada sección abre con la ACCIÓN operativa (qué hago AHORA) y debajo el fundamento. Reutiliza el
 * contenido ya cotejado de la ficha `del-violencia-genero`. CONTENIDO MUY SENSIBLE: todo es
 * ORIENTATIVO, nunca imperativo; la detención y las medidas cautelares las acuerda o ratifica la
 * AUTORIDAD JUDICIAL y la valoración final del caso corresponde al agente y, en su caso, al juez.
 * Cotejado por el revisor jurídico (2026-09) contra el BOE consolidado.
 */

export interface PuntoGuiaViolenciaGenero {
  texto: string;
  /** Punto clave (se resalta). */
  fuerte?: boolean;
}

export interface SeccionGuiaViolenciaGenero {
  titulo: string;
  /** ACCIÓN operativa de un vistazo (qué hago AHORA), pintada como chip destacado. */
  accion: string;
  /** Artículo(s) de referencia, para el chip de fuente. */
  articulo: string;
  /** Ficha del paquete que amplía la sección (opcional). */
  fichaId?: string;
  puntos: readonly PuntoGuiaViolenciaGenero[];
}

/** Fecha de actualización/vigencia visible (regla CLAUDE.md: fuente + fecha en todo contenido legal). */
export const ACTUALIZACION_GUIA_VIOLENCIA_GENERO = 'septiembre de 2026';

export const GUIA_VIOLENCIA_GENERO: readonly SeccionGuiaViolenciaGenero[] = [
  {
    titulo: 'Lo primero: proteger a la víctima',
    accion: 'Prioridad: proteger a la víctima; comprueba VioGén (¿caso activo?) y valora el riesgo.',
    articulo: 'VPR · sistema VioGén',
    fichaId: 'del-violencia-genero',
    puntos: [
      {
        texto:
          'Antes que la calificación jurídica: separar a las partes, atender y proteger a la víctima (y a los menores presentes) y garantizar su seguridad.',
        fuerte: true,
      },
      {
        texto:
          'Comprueba de entrada en las aplicaciones policiales / VioGén si ya hay CASO ACTIVO o MEDIDA VIGENTE: cambia el riesgo, el quebrantamiento y la actuación.',
        fuerte: true,
      },
      {
        texto:
          'Realiza la VALORACIÓN POLICIAL DEL RIESGO (VPR y, en violencia de género de pareja, sistema VioGén) y activa el seguimiento y los recursos asistenciales según su resultado.',
      },
      {
        texto:
          'Informa a la víctima de sus derechos y del ofrecimiento de acciones (Estatuto de la víctima, Ley 4/2015), del teléfono 016 y de los recursos (traslado a centro médico con parte de lesiones, ATENPRO, casa de acogida). Si es extranjera o hay barrera idiomática: derecho a intérprete; su situación administrativa NO condiciona la protección ni la denuncia.',
      },
    ],
  },
  {
    titulo: 'Aunque no quiera denunciar',
    accion: 'No depende de que ella denuncie: se persigue de oficio; protege y documenta igual.',
    articulo: 'arts. 153 y 173.2 CP',
    puntos: [
      {
        texto:
          'La violencia de género y doméstica (arts. 153 y 173.2 CP) se persigue DE OFICIO: no es delito privado, no depende de que la víctima denuncie ni de que "retire" la denuncia.',
        fuerte: true,
      },
      {
        texto:
          'En flagrancia, la detención puede proceder aunque la víctima no quiera denunciar; la valoración de los indicios y del riesgo es del agente y la ratifica la autoridad judicial.',
        fuerte: true,
      },
      {
        texto:
          'Distinto de no denunciar es que la víctima, como pariente, se acoja a la DISPENSA de no declarar (art. 416 LECrim): eso afecta a SU declaración, no a la perseguibilidad del delito ni a la protección. El atestado y los demás indicios (parte de lesiones, testigos, VPR) siguen su curso.',
      },
      {
        texto:
          'Aunque no denuncie: documenta el hecho (lesiones, testigos, contexto), protege a la víctima y remite el atestado con la VPR.',
      },
    ],
  },
  {
    titulo: '¿Quién es víctima y quién agresor?',
    accion: 'Denuncias cruzadas: no procede detener en automático a ambos; valora el agresor principal.',
    articulo: 'valoración de indicios',
    puntos: [
      {
        texto:
          'Si los dos presentan marcas o se acusan mutuamente (denuncias cruzadas), NO se detiene en automático a ambos: procede valorar quién es el agresor principal.',
        fuerte: true,
      },
      {
        texto:
          'Ayudan a valorarlo: el contexto de dominación/habitualidad, quién teme a quién, la entidad y la compatibilidad de las lesiones (defensa frente a agresión) y los antecedentes en VioGén.',
      },
      {
        texto:
          'Recoge con cuidado indicios y declaraciones por separado; la calificación final corresponde a la autoridad judicial.',
      },
    ],
  },
  {
    titulo: '¿Qué delito es?',
    accion: 'Un acto: art. 153; violencia habitual: art. 173.2; lesión con tratamiento: 147/148.',
    articulo: 'arts. 153, 173.2 y 147/148 CP',
    puntos: [
      {
        texto:
          'Maltrato de obra o lesión de MENOR entidad sobre pareja/expareja mujer: art. 153.1 CP; sobre otras personas del ámbito familiar (art. 173.2): art. 153.2 CP.',
        fuerte: true,
      },
      {
        texto:
          'Violencia física o psíquica HABITUAL en el ámbito familiar: art. 173.2 CP (se valora la reiteración, no solo el último hecho).',
        fuerte: true,
      },
      {
        texto:
          'Si la lesión requiere tratamiento médico o quirúrgico, se persigue por los arts. 147/148 CP (lesiones), con sus agravantes.',
      },
    ],
  },
  {
    titulo: 'Detención (y si el agresor ya no está)',
    accion: 'En flagrancia PROCEDE la detención (arts. 490 y 492 LECrim); la ratifica el juez.',
    articulo: 'arts. 490 y 492 LECrim',
    puntos: [
      {
        texto:
          'Los tipos citados (153, 173.2, 147/148) son delitos MENOS GRAVES: en flagrancia procede la detención conforme a los arts. 490 y 492 LECrim. Orientación, no orden.',
        fuerte: true,
      },
      {
        texto:
          'Si el AGRESOR YA NO ESTÁ cuando llegas (lo más habitual): no hay flagrancia estricta; procede documentar el hecho, proteger a la víctima y localizar al autor. La detención fuera de flagrancia y las medidas las valora/acuerda la autoridad judicial.',
        fuerte: true,
      },
      {
        texto:
          'La valoración de los indicios y del riesgo corresponde al agente; la detención y las medidas cautelares las acuerda o ratifica la autoridad judicial.',
      },
    ],
  },
  {
    titulo: 'Armas',
    accion: 'Por seguridad, valora asegurar/retirar el arma; la privación es pena en sentencia.',
    articulo: 'arts. 153 y 173.2 CP',
    puntos: [
      {
        texto:
          'Seguridad primero: ante la presencia de un arma (frecuente en el ámbito rural: escopetas, licencias de caza), valora asegurarla o aprehenderla cautelarmente según los indicios y el riesgo.',
        fuerte: true,
      },
      {
        texto:
          'En los delitos de los arts. 153 y 173.2 CP la condena lleva EN TODO CASO, como pena que impone el tribunal en sentencia, la privación del derecho a la tenencia y porte de armas (distinto de la aprehensión cautelar en la intervención).',
      },
    ],
  },
  {
    titulo: 'Orden de protección y medidas',
    accion: 'Procede instar la orden de protección (art. 544 ter); la acuerda la autoridad judicial.',
    articulo: 'arts. 544 bis y 544 ter LECrim',
    puntos: [
      {
        texto:
          'Procede instar de forma PRIORITARIA la ORDEN DE PROTECCIÓN de la víctima (art. 544 ter LECrim), que acuerda la autoridad judicial y puede incluir medidas penales y civiles.',
        fuerte: true,
      },
      {
        texto:
          'La prohibición de aproximación y comunicación (medida cautelar) se ampara en el art. 544 bis LECrim.',
      },
      {
        texto:
          'Documenta la intervención y remite el atestado con la solicitud de orden de protección y el resultado de la VPR.',
      },
    ],
  },
  {
    titulo: 'Si ya había una orden y la quebranta',
    accion: 'Quebrantar una orden/medida vigente es delito de quebrantamiento (art. 468 CP).',
    articulo: 'art. 468 CP',
    fichaId: 'del-quebrantamiento',
    puntos: [
      {
        texto:
          'Si ya existe una orden de alejamiento o medida cautelar vigente y el autor la incumple, es un delito de QUEBRANTAMIENTO (art. 468 CP), añadido a los hechos nuevos.',
        fuerte: true,
      },
      {
        texto:
          'Comprueba en las aplicaciones policiales / VioGén si consta una medida vigente antes de decidir.',
      },
    ],
  },
  {
    titulo: 'Agravantes',
    accion: 'Agravantes del art. 153.3 CP: menores presentes, domicilio común, armas, quebrantamiento.',
    articulo: 'art. 153.3 CP',
    puntos: [
      {
        texto:
          'Circunstancias que agravan (imponen la pena en su mitad superior, art. 153.3 CP; en la violencia habitual, art. 173.2, párr. 2.º) y conviene reflejar en el atestado: presencia de menores, uso de armas, comisión en el domicilio común o de la víctima y el quebrantamiento de una pena o medida del art. 48 CP.',
        fuerte: true,
      },
      {
        texto:
          'Los menores presentes son víctimas/testigos: valora su protección y a cargo de quién quedan. Recoge indicios (fotografías de lesiones, testigos, partes médicos): sostienen la protección y el atestado.',
      },
    ],
  },
];
