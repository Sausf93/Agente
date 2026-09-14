/**
 * Datos de la GUÍA RÁPIDA DE OCUPACIÓN DE INMUEBLES (OKUPAS) (arts. 202, 203, 245, 172 y 255 CP; art.
 * 37.7 LO 4/2015; arts. 553 y 795.1 LECrim; art. 18.2 CE; Instrucción 6/2020 SES y 1/2020 FGE).
 * Contenido de referencia ESTÁTICO en la app (patrón de las guías de menores, extranjería y VG):
 * resuelve, escaneable y para uso EN DIRECTO, la duda de calle nº 1 con una ocupación —¿es delito y
 * cuál?, ¿puedo actuar ya o va por el juzgado?, ¿y si es inquilino que no paga?— a partir de la
 * distinción clave: ¿es MORADA o no?
 *
 * Cada sección abre con la ACCIÓN operativa (qué hago AHORA) y debajo el fundamento. Reutiliza el
 * contenido ya cotejado de las fichas `del-allanamiento-morada` (202), `del-usurpacion` (245),
 * `del-allanamiento-establecimiento` (203) y `sc-ocupacion-inmueble` (37.7 LOSC). Cotejado por el
 * revisor jurídico (2026-09). Orientativo y "Borrador beta": la flagrancia, el desalojo y los delitos
 * conexos (255, 172, 455 CP) quedan a verificar en el caso; la calificación y las medidas las acuerda
 * la AUTORIDAD JUDICIAL y la valoración final corresponde al agente.
 */

export interface PuntoGuiaOcupacion {
  texto: string;
  /** Punto clave (se resalta). */
  fuerte?: boolean;
}

export interface SeccionGuiaOcupacion {
  titulo: string;
  /** ACCIÓN operativa de un vistazo (qué hago AHORA), pintada como chip destacado. */
  accion: string;
  /** Artículo(s) de referencia, para el chip de fuente. */
  articulo: string;
  /** Ficha del paquete que amplía la sección (opcional). */
  fichaId?: string;
  puntos: readonly PuntoGuiaOcupacion[];
}

/** Fecha de actualización/vigencia visible (regla CLAUDE.md: fuente + fecha en todo contenido legal). */
export const ACTUALIZACION_GUIA_OCUPACION = 'septiembre de 2026';

export const GUIA_OCUPACION: readonly SeccionGuiaOcupacion[] = [
  {
    titulo: 'La pregunta clave: ¿es morada?',
    accion: '¿Vive alguien ahí? Sí → allanamiento (art. 202); no → usurpación (art. 245).',
    articulo: 'arts. 202 y 245 CP',
    puntos: [
      {
        texto:
          'Lo primero que decide todo: ¿el inmueble es MORADA (espacio donde alguien desarrolla su vida privada) o NO lo es (piso realmente vacío, local, nave)?',
        fuerte: true,
      },
      {
        texto:
          'Es MORADA → allanamiento de morada (art. 202 CP), más grave. NO es morada → usurpación (art. 245 CP), o incluso solo infracción administrativa.',
        fuerte: true,
      },
      {
        texto:
          'Criterio rápido: ¿hay enseres, signos de uso y de vida privada? tiende a MORADA. ¿Realmente vacío y sin uso? tiende a NO morada. Caso a caso; la calificación final es judicial.',
      },
    ],
  },
  {
    titulo: 'Es morada (vive alguien dentro)',
    accion: 'Entrar o permanecer en morada ajena: delito (art. 202); valora la flagrancia.',
    articulo: 'art. 202 CP',
    fichaId: 'del-allanamiento-morada',
    puntos: [
      {
        texto:
          'Entrar en morada ajena, o mantenerse en ella contra la voluntad del morador, por quien no la habita: allanamiento de morada (art. 202.1 CP).',
        fuerte: true,
      },
      {
        texto: 'Con violencia o intimidación, la pena es mayor (art. 202.2 CP).',
      },
      {
        texto:
          'Incluye la segunda vivienda mientras conserve su uso como espacio de vida privada del titular (morada), aunque no se habite de forma permanente; si está realmente abandonada/deshabitada tiende a usurpación (art. 245). A verificar en el caso.',
      },
    ],
  },
  {
    titulo: 'No es morada (piso vacío, local, nave)',
    accion: 'Ocupar un inmueble ajeno que no es morada: usurpación (art. 245); local/nave: art. 203.',
    articulo: 'arts. 245 y 203 CP',
    fichaId: 'del-usurpacion',
    puntos: [
      {
        texto:
          'Ocupar sin autorización, o mantenerse contra la voluntad del titular, un inmueble/vivienda/edificio ajenos que NO son morada (ocupación pacífica): usurpación del art. 245.2 CP.',
        fuerte: true,
      },
      {
        texto: 'Con violencia o intimidación en las personas: art. 245.1 CP (más grave).',
      },
      {
        texto:
          'El LOCAL, oficina, nave o establecimiento (fuera de las horas de apertura) tiene su propio tipo: allanamiento del art. 203 CP.',
        fuerte: true,
      },
    ],
  },
  {
    titulo: 'Flagrancia y desalojo',
    accion: 'En flagrancia procede valorar la intervención; la ocupación consolidada va por el juzgado.',
    articulo: 'arts. 553 y 795.1 LECrim · 18.2 CE · Instrucción 6/2020 SES (a verificar)',
    puntos: [
      {
        texto:
          'Si se sorprende la ocupación EN CURSO (flagrancia, arts. 553 y 795.1 LECrim), procede valorar la intervención policial para hacerla cesar y, en su caso, la detención.',
        fuerte: true,
      },
      {
        texto:
          'En allanamiento de morada (art. 202), delito permanente, la flagrancia puede prolongarse mientras dura la ocupación (Instrucción 6/2020 SES). En usurpación (art. 245) la flagrancia se aprecia de forma MÁS RESTRICTIVA; consolidada la ocupación, el desalojo se pide como medida cautelar al juzgado (Instrucción 1/2020 FGE). Punto sensible: a verificar en el caso.',
        fuerte: true,
      },
      {
        texto:
          'La entrada en el inmueble ocupado como morada exige autorización judicial (art. 18.2 CE), salvo delito flagrante o consentimiento del titular del derecho.',
      },
      {
        texto:
          'Orientación basada en la normativa citada; la valoración de los indicios y la calificación final corresponden al agente y, en su caso, a la autoridad judicial.',
      },
    ],
  },
  {
    titulo: 'El inquilino que no paga (inquiokupa)',
    accion: 'Entró con contrato y deja de pagar: NO es okupación; va por vía civil (desahucio).',
    articulo: 'vía civil (a verificar)',
    puntos: [
      {
        texto:
          'Quien entró con contrato o permiso del titular y luego deja de pagar o no se va NO comete, por ese solo hecho, allanamiento ni usurpación: es un incumplimiento CIVIL que se resuelve por desahucio ante el juzgado.',
        fuerte: true,
      },
      {
        texto:
          'La policía, con carácter general, no desaloja en estos casos: se orienta al propietario hacia la vía civil. A verificar en el caso (puede haber hechos añadidos que sí sean delito).',
      },
      {
        texto:
          'Distinto es quien NUNCA tuvo un título válido (contrato simulado, entrada por engaño): ahí la calificación puede cambiar. A verificar en el caso.',
      },
    ],
  },
  {
    titulo: 'El propietario no puede tomarse la justicia por su mano',
    accion: 'Conviene avisar al dueño: entrar por su cuenta o cortar suministros puede ser delito.',
    articulo: 'arts. 455, 172 y 255 CP (a verificar)',
    puntos: [
      {
        texto:
          'El propietario que entra por su cuenta —con fuerza, violencia o intimidación— a echar a los ocupantes, o los amenaza, puede incurrir en realización arbitraria del propio derecho (art. 455 CP) o coacciones (art. 172 CP): la actuación corresponde al agente y al juzgado.',
        fuerte: true,
      },
      {
        texto:
          'Cortar el agua, la luz o el gas para forzar la salida puede ser coacciones (art. 172 CP). A verificar en el caso.',
      },
      {
        texto:
          'El enganche o pinchazo ilegal por los ocupantes puede ser defraudación (art. 255 CP), que abarca electricidad, gas, agua y telecomunicaciones; es delito si el valor supera los 400 € (por debajo, delito leve). Delito autónomo que a veces da el título de intervención. Ojo también a delitos concurrentes (drogas, armas, menores) que sí habilitan actuación inmediata.',
      },
      {
        texto:
          'Orientación basada en la normativa citada; la valoración de los indicios y la calificación final corresponden al agente y, en su caso, a la autoridad judicial.',
      },
    ],
  },
  {
    titulo: 'Cuándo es solo administrativo',
    accion: 'La ocupación que no llega a delito: infracción administrativa (art. 37.7 LOSC).',
    articulo: 'art. 37.7 LO 4/2015',
    fichaId: 'sc-ocupacion-inmueble',
    puntos: [
      {
        texto:
          'La ocupación de un inmueble, vivienda o edificio ajenos, o la permanencia en ellos, contra la voluntad del titular, cuando NO sea constitutiva de delito, es infracción administrativa (art. 37.7 LO 4/2015).',
        fuerte: true,
      },
      {
        texto:
          'También cubre la ocupación de la vía pública contra la ley o la decisión de la autoridad competente (incluida la venta ambulante no autorizada). Si hay marca falsificada, puede escalar al art. 274 CP. Según el caso.',
      },
    ],
  },
];
