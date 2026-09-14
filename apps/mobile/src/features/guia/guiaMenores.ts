/**
 * Datos de la GUÍA RÁPIDA DE MENORES (LO 5/2000 de responsabilidad penal del menor y LO 1/1996 de
 * protección jurídica del menor). Contenido de referencia ESTÁTICO en la app (patrón de las guías de
 * identificación y alcoholemia): resume, escaneable y para uso EN DIRECTO, la duda de calle más
 * frecuente con un menor —"es menor, ¿qué hago?"— separando el inimputable (< 14) del régimen penal
 * del menor (14-17) y sus garantías, y cubriendo la vía administrativa (alcohol, tabaco, drogas), la
 * entrega, la duda sobre la edad, el MENA y el menor fugado.
 *
 * Cada sección abre con la ACCIÓN operativa (qué hago AHORA), y debajo el fundamento. El contenido
 * reutiliza el texto ya cotejado del MOTOR DE DETENCIÓN (`@agente/shared`, avisos del menor). Los
 * plazos del art. 17 LO 5/2000 están COTEJADOS (24 h, art. 17.4; resolución del Fiscal en 48 h,
 * art. 17.5). Orientativo y "Borrador beta": la vía administrativa del menor (quién responde en las
 * sanciones de alcohol/tabaco/drogas) queda marcada "a verificar"; la valoración final corresponde al
 * agente, al Ministerio Fiscal de Menores y, en su caso, a la autoridad judicial.
 */

export interface PuntoGuiaMenores {
  texto: string;
  /** Punto clave (se resalta). */
  fuerte?: boolean;
}

export interface SeccionGuiaMenores {
  titulo: string;
  /**
   * ACCIÓN operativa de un vistazo (qué hago AHORA). Se pinta como chip destacado arriba de la
   * sección: es lo que el agente necesita en el momento caliente, antes que la calificación jurídica.
   */
  accion: string;
  /** Artículo(s) de referencia, para el chip de fuente. */
  articulo: string;
  /** Ficha del paquete que amplía la sección (opcional: la mayoría de bloques no tiene ficha). */
  fichaId?: string;
  puntos: readonly PuntoGuiaMenores[];
}

/** Fecha de actualización/vigencia visible (regla CLAUDE.md: fuente + fecha en todo contenido legal). */
export const ACTUALIZACION_GUIA_MENORES = 'septiembre de 2026';

export const GUIA_MENORES: readonly SeccionGuiaMenores[] = [
  {
    titulo: 'Menor de 14 años: inimputable',
    accion: 'Entrega a los padres; si no se hacen cargo, a la Entidad de Protección.',
    articulo: 'arts. 1.1 y 3 LO 5/2000',
    puntos: [
      {
        texto:
          'NO se le aplica el régimen penal ni cabe detención penal: es penalmente inimputable (arts. 1.1 y 3 LO 5/2000).',
        fuerte: true,
      },
      { texto: 'Identifícalo con las cautelas propias de un menor.' },
      {
        texto:
          'Entrega a sus representantes legales o, en su defecto, puesta a disposición de la Entidad Pública de protección de menores de la comunidad autónoma.',
        fuerte: true,
      },
      {
        texto:
          'Comunicación al Ministerio Fiscal (art. 3 LO 5/2000, en relación con la LO 1/1996 de protección del menor).',
      },
    ],
  },
  {
    titulo: 'De 14 a 17 años: régimen penal del menor',
    accion: 'Responde por la LO 5/2000: avisa a los padres y al Fiscal de Menores.',
    articulo: 'arts. 1.1 y 17 LO 5/2000',
    puntos: [
      {
        texto:
          'SÍ responde penalmente, pero por la LO 5/2000 (no por el régimen de adultos): interviene el Ministerio Fiscal de Menores, no el juzgado de instrucción ordinario.',
        fuerte: true,
      },
      {
        texto:
          'Información inmediata de los hechos y de sus derechos, y notificación de la detención y del lugar de custodia a sus representantes legales y al Ministerio Fiscal de Menores (art. 17.1).',
        fuerte: true,
      },
      {
        texto:
          'Pasos de calle: identifícalo, instruye diligencias, valora si procede o no la detención (proporcionalidad), avisa a padres y Fiscal de Menores y cierra con la entrega.',
      },
    ],
  },
  {
    titulo: 'Si detienes al menor de 14 a 17',
    accion: 'Máx. 24 h · custodia separada · nunca en calabozo común.',
    articulo: 'art. 17.3-17.5 LO 5/2000',
    puntos: [
      {
        texto:
          'La detención policial no puede exceder de 24 HORAS: dentro de ese plazo se pone al menor en libertad o a disposición del Ministerio Fiscal (art. 17.4). El Fiscal resuelve dentro de las 48 horas siguientes a la detención (art. 17.5).',
        fuerte: true,
      },
      {
        texto:
          'Custodia en dependencias ADECUADAS y SEPARADAS de las de los mayores de edad (art. 17.3): no procede el calabozo común.',
        fuerte: true,
      },
      {
        texto:
          'Si el menor es extranjero, comunicación a las autoridades consulares (art. 520.2 LECrim, aplicable por el régimen de garantías del detenido que reconoce el art. 17 LO 5/2000).',
      },
    ],
  },
  {
    titulo: 'Conductas del menor por la vía administrativa',
    accion: 'Sanción administrativa (a verificar quién responde: menor o padres/tutores).',
    articulo: 'a verificar (LO 4/2015, Ley 42/2010, normativa autonómica)',
    puntos: [
      {
        texto:
          'No todo con un menor es penal ni protección: beber en la vía/botellón, fumar o el consumo o tenencia de drogas en lugar público son, con carácter general, infracciones ADMINISTRATIVAS. Ojo: la tenencia con indicios de destino al tráfico deja de ser administrativa y pasa a la vía penal; la calificación final es judicial.',
        fuerte: true,
      },
      {
        texto:
          'Alcohol y botellón: suele regularse por normativa autonómica de menores y por ordenanza; en varios territorios la responsabilidad recae en los padres o tutores. Quién responde y la cuantía, a verificar según tu comunidad y ordenanza.',
      },
      {
        texto:
          'Tabaco: prohibición de venta y suministro a menores de 18 años (Ley 28/2005, modificada por la Ley 42/2010, a verificar).',
      },
      {
        texto:
          'Drogas en vía pública: consumo o tenencia en lugar público (art. 36.16 LO 4/2015, infracción grave); el tratamiento cuando el infractor es menor, a verificar. La intervención/aprehensión de la sustancia, conforme a las medidas provisionales y facultades de registro de la LO 4/2015 (artículo concreto a verificar).',
      },
    ],
  },
  {
    titulo: 'Entrega del menor',
    accion: 'Acta de entrega a los padres; si no se hacen cargo, Entidad de Protección.',
    articulo: 'LO 1/1996 · art. 3 LO 5/2000',
    puntos: [
      {
        texto:
          'Cierra casi toda intervención con menor: entrega a los representantes legales, dejando constancia (acta de entrega) de a quién y cuándo se entregó.',
        fuerte: true,
      },
      {
        texto:
          'Si los padres o tutores NO aparecen o NO se hacen cargo, puesta a disposición de la Entidad Pública de protección de menores de la comunidad autónoma (situación de desamparo, LO 1/1996).',
        fuerte: true,
      },
    ],
  },
  {
    titulo: 'Si hay dudas sobre la edad',
    accion: 'Lo determina la Fiscalía; mientras tanto, trátalo como menor.',
    articulo: 'art. 35.3 LO 4/2000 (extranjero indocumentado); proc. general a verificar',
    puntos: [
      {
        texto:
          'La determinación de la minoría de edad, cuando hay dudas, la acuerda la AUTORIDAD COMPETENTE (Ministerio Fiscal) por el procedimiento previsto: NO la valora el agente ni la app.',
        fuerte: true,
      },
      {
        texto:
          'Extranjero indocumentado cuya minoría no puede establecerse con seguridad: comunicación inmediata al Ministerio Fiscal, que dispondrá la determinación de la edad (art. 35.3 LO 4/2000).',
      },
      {
        texto:
          'Mientras se determina, se trata a la persona con las cautelas del posible menor (protección, no sanción).',
      },
    ],
  },
  {
    titulo: 'Menor extranjero no acompañado (MENA)',
    accion: 'Protección, no sanción: a la Entidad de Protección y aviso a Fiscalía.',
    articulo: 'art. 35.3 y 35.4 LO 4/2000 · LO 1/1996',
    fichaId: 'sc-mena-consulta',
    puntos: [
      {
        texto:
          'Es, ante todo, un MENOR en situación de desamparo: su tratamiento es de PROTECCIÓN, no sancionador; rige el interés superior del menor.',
        fuerte: true,
      },
      {
        texto:
          'Comunicación inmediata al Ministerio Fiscal (art. 35.3 LO 4/2000) y puesta a disposición de los servicios competentes de protección de menores de la comunidad autónoma (art. 35.4 LO 4/2000).',
        fuerte: true,
      },
      {
        texto:
          'En ningún caso procede el calabozo ni el internamiento como adulto por su condición de menor o de extranjero.',
      },
    ],
  },
  {
    titulo: 'Menor fugado o desaparecido',
    accion: 'Protección y localización; no es un delito de fuga.',
    articulo: 'LO 1/1996 (protección del menor)',
    puntos: [
      {
        texto:
          'La fuga de un menor (también la de un centro de protección) NO es delito: es un asunto de protección y localización, no sancionador para el menor.',
        fuerte: true,
      },
      {
        texto:
          'Localizado, se comunica y se pone a disposición de quien tenga su guarda (representantes legales o Entidad Pública de protección) y del Ministerio Fiscal de Menores.',
      },
    ],
  },
];
