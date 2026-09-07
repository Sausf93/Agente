/**
 * contenido.ts — Contenido de la sección "Vehículos" (§4.12).
 *
 * Caja de herramientas práctica para la calle: enlaces curados y utilidades de consulta de
 * vehículos y documentación, organizados por categoría (documentación española, vehículos y
 * permisos extranjeros, comprobaciones y falsedad documental). Es contenido HEREDADO y depurado
 * de SPPLB (enlaces públicos y utilidades), reorganizado. NO es normativa (eso vive en "Normas"
 * y en el paquete SQLite): esto es un RECURSO BUNDLADO en la app, igual que la lectura de
 * derechos, para estar SIEMPRE disponible sin red y sin tocar el `.db`.
 *
 * Reglas de contenido (CLAUDE.md):
 *  - Lenguaje ORIENTATIVO, nunca imperativo ("conviene comprobar", no "comprueba").
 *  - Toda afirmación verificable se marca (`estado: 'orientativo' | 'pendiente'`) y cita la
 *    fuente cuando la hay.
 *  - NO se inventan URLs: cuando no hay un enlace fijo verificado, `url` es `null` y se cita el
 *    recurso público de forma genérica (`referencia`). El cofundador aporta las URLs buenas
 *    (ver `README.md`, apartado "Pendiente por que lo aporte el cofundador").
 *  - Ningún dato de terceros (matrículas, DNI, nombres) se guarda ni se envía: estas pantallas
 *    solo abren recursos públicos.
 *
 * Español en el dominio; inglés en los identificadores.
 */

/** Clave de icono (Lucide) de cada categoría. Se traduce a componente en la pantalla. */
export type IconoCategoria = 'documento' | 'extranjero' | 'comprobacion' | 'falsedad';

/** Fiabilidad del bloque: texto de apoyo orientativo, o pendiente de aportar/verificar. */
export type EstadoContenido = 'orientativo' | 'pendiente';

/**
 * Enlace o utilidad pública. Si `url` es `null`, el recurso existe pero aún no tiene una URL
 * fija verificada en la app: se muestra la `referencia` genérica y queda como TODO del cofundador.
 */
export interface EnlaceRecurso {
  etiqueta: string;
  descripcion: string;
  url: string | null;
  /** Recurso público citado de forma genérica (p. ej. "sede electrónica de la DGT"). */
  referencia: string;
}

/** Lista con título: "qué conviene comprobar" o "posibles indicios de falsedad". */
export interface BloqueLista {
  titulo: string;
  items: readonly string[];
}

export interface SeccionVehiculos {
  id: string;
  titulo: string;
  descripcion: string;
  /** Qué conviene mirar / qué se puede exigir (orientativo). */
  comprobaciones?: BloqueLista;
  /** Posibles indicios de manipulación o falsedad (orientativo). */
  indicios?: BloqueLista;
  /** Enlaces y utilidades públicas asociadas a la sección. */
  enlaces?: readonly EnlaceRecurso[];
  /** Fuente citada cuando la hay (norma, organismo). */
  fuente?: string;
  estado: EstadoContenido;
}

export interface CategoriaVehiculos {
  id: string;
  titulo: string;
  resumen: string;
  icono: IconoCategoria;
  secciones: readonly SeccionVehiculos[];
}

/**
 * Aviso fijo al pie de la sección: refuerza que es apoyo, no sustituye la valoración del agente,
 * y que conviene contrastar en la fuente oficial. Se muestra en el hub y en cada categoría.
 */
export const AVISO_VEHICULOS =
  'Información de apoyo, orientativa y heredada de recursos públicos. No sustituye la valoración ' +
  'del agente ni la comprobación en la fuente oficial. Ningún dato que introduzcas o consultes ' +
  'se guarda ni se envía.';

export const CATEGORIAS_VEHICULOS: readonly CategoriaVehiculos[] = [
  {
    id: 'documentacion-espanola',
    titulo: 'Documentación española',
    resumen: 'Permiso de circulación, ficha técnica/ITV y permiso de conducir: qué mirar.',
    icono: 'documento',
    secciones: [
      {
        id: 'permiso-circulacion',
        titulo: 'Permiso de circulación',
        descripcion:
          'Acredita la titularidad administrativa del vehículo. Conviene contrastar sus datos ' +
          'con la placa de matrícula y con el número de bastidor (VIN) del vehículo.',
        comprobaciones: {
          titulo: 'Qué conviene comprobar',
          items: [
            'Que la matrícula del documento coincide con la placa del vehículo.',
            'Que el número de bastidor (VIN) del documento coincide con el troquelado del vehículo.',
            'Marca, modelo y color frente a lo que se observa.',
            'Titular y fecha de primera matriculación.',
          ],
        },
        fuente: 'RD 2822/1998 Reglamento General de Vehículos (documentación del vehículo).',
        estado: 'orientativo',
      },
      {
        id: 'ficha-tecnica-itv',
        titulo: 'Ficha técnica (tarjeta ITV) e inspección',
        descripcion:
          'La tarjeta de inspección técnica (ficha técnica) recoge las características del ' +
          'vehículo y el sellado de las inspecciones periódicas (ITV). Permite verificar la ' +
          'vigencia de la última inspección favorable.',
        comprobaciones: {
          titulo: 'Qué conviene comprobar',
          items: [
            'Vigencia de la ITV: fecha de la próxima inspección y sellos de la estación.',
            'Reformas anotadas y su homologación.',
            'Coincidencia de características (neumáticos, masas, plazas) con el vehículo real.',
            'Correspondencia del bastidor (VIN) con el permiso de circulación.',
          ],
        },
        fuente: 'RD 920/2017 (inspección técnica de vehículos) y RGV.',
        estado: 'orientativo',
      },
      {
        id: 'permiso-conducir',
        titulo: 'Permiso de conducir',
        descripcion:
          'Habilita para conducir según sus clases (AM, A1, A2, A, B, C, D…). Conviene verificar ' +
          'vigencia, clases y la correspondencia de la fotografía y los datos con la persona.',
        comprobaciones: {
          titulo: 'Qué conviene comprobar',
          items: [
            'Vigencia del permiso y de cada clase (fechas de caducidad por categoría).',
            'Que las clases habilitan para el vehículo conducido.',
            'Correspondencia de fotografía, firma y datos con la persona.',
            'Códigos y restricciones (p. ej. uso de gafas).',
          ],
        },
        indicios: {
          titulo: 'Posibles indicios a valorar',
          items: [
            'Fotografía despegada, resellada o que no corresponde con la persona.',
            'Tipografía, hologramas o soporte que difieren del modelo oficial.',
            'Datos raspados, tachados o sobreimpresos.',
          ],
        },
        fuente: 'RD 818/2009 Reglamento General de Conductores.',
        estado: 'orientativo',
      },
    ],
  },
  {
    id: 'extranjeros',
    titulo: 'Vehículos y permisos extranjeros',
    resumen: 'Equivalencias, qué se puede exigir y canje de permisos de conducir.',
    icono: 'extranjero',
    secciones: [
      {
        id: 'vehiculos-extranjeros',
        titulo: 'Vehículos con matrícula extranjera',
        descripcion:
          'La documentación puede presentarse en el formato del país de origen. En la UE el ' +
          'permiso de circulación sigue un modelo armonizado con campos codificados por letras.',
        comprobaciones: {
          titulo: 'Qué conviene tener presente',
          items: [
            'Documentación de circulación y seguro con validez en España (carta verde o equivalente).',
            'En permisos UE, los campos armonizados (A: matrícula, D: marca/modelo, E: bastidor…).',
            'Plazos de permanencia y de obligación de matriculación si el titular reside en España.',
          ],
        },
        fuente: 'Directiva 1999/37/CE (permiso de circulación armonizado en la UE).',
        estado: 'orientativo',
      },
      {
        id: 'permisos-conducir-extranjeros',
        titulo: 'Permisos de conducir extranjeros y canje',
        descripcion:
          'La validez para conducir en España depende del país emisor y del tiempo de residencia. ' +
          'Puede requerir permiso internacional o traducción, y en su caso canje.',
        comprobaciones: {
          titulo: 'Qué conviene tener presente',
          items: [
            'Permisos UE/EEE: en general válidos en España según sus condiciones.',
            'Permisos de terceros países: puede exigirse permiso internacional y/o traducción oficial.',
            'Residentes: existe un plazo tras el que procede el canje por permiso español.',
            'Equivalencia de categorías del país emisor con las clases españolas.',
          ],
        },
        fuente:
          'RD 818/2009 (canje y validez de permisos extranjeros). Convenios de Viena/Ginebra de circulación vial.',
        estado: 'orientativo',
      },
    ],
  },
  {
    id: 'comprobaciones',
    titulo: 'Comprobaciones',
    resumen: 'Accesos a recursos públicos: DGT, matrícula/ITV y bastidor (VIN).',
    icono: 'comprobacion',
    secciones: [
      {
        id: 'consulta-vehiculo',
        titulo: 'Consulta de vehículo (matrícula / ITV)',
        descripcion:
          'Recursos públicos para comprobar datos e historial de un vehículo (situación de ITV, ' +
          'informes de vehículo). El acceso y el alcance dependen del organismo.',
        enlaces: [
          {
            etiqueta: 'Sede electrónica de la DGT',
            descripcion:
              'Trámites y consultas de vehículos y conductores. La ruta exacta la aporta el cofundador.',
            url: null,
            referencia: 'Sede electrónica de la DGT (dgt.es / sede.dgt.gob.es).',
          },
          {
            etiqueta: 'Informe de vehículo (DGT)',
            descripcion:
              'Informe con datos técnicos, cargas y situación administrativa del vehículo.',
            url: null,
            referencia: 'Servicio de informe de vehículo de la DGT.',
          },
        ],
        estado: 'pendiente',
      },
      {
        id: 'bastidor-vin',
        titulo: 'Bastidor / VIN',
        descripcion:
          'El número de identificación del vehículo (VIN, 17 caracteres) permite contrastar la ' +
          'identidad del vehículo con su documentación y detectar posibles duplicidades o adulteraciones.',
        comprobaciones: {
          titulo: 'Qué conviene comprobar',
          items: [
            'Que el VIN troquelado coincide con el del permiso de circulación y la ficha técnica.',
            'Estado del troquelado: regrabados, soldaduras, chapas remachadas o repintados.',
            'Coherencia del VIN con marca, modelo y año (estructura del código).',
          ],
        },
        enlaces: [
          {
            etiqueta: 'Consulta / descodificación de VIN',
            descripcion: 'Recurso público de descodificación del bastidor. Enlace pendiente de aportar.',
            url: null,
            referencia: 'Recurso oficial de comprobación de VIN (pendiente de concretar).',
          },
        ],
        estado: 'pendiente',
      },
    ],
  },
  {
    id: 'falsedad',
    titulo: 'Falsedad documental',
    resumen: 'Guía orientativa de indicios de manipulación en documentos de vehículo.',
    icono: 'falsedad',
    secciones: [
      {
        id: 'indicios-generales',
        titulo: 'Indicios generales a valorar',
        descripcion:
          'Señales que, en conjunto y según el caso, pueden apuntar a una manipulación. Son ' +
          'orientativas: la calificación de falsedad corresponde, en su caso, a la autoridad judicial.',
        indicios: {
          titulo: 'Posibles indicios',
          items: [
            'Soporte, gramaje o tacto del papel/plástico distintos del modelo oficial.',
            'Hologramas, marcas de agua o elementos de seguridad ausentes o mal reproducidos.',
            'Tipografía irregular, alineaciones o tamaños de fuente inconsistentes.',
            'Fotografía despegada, resellada o con bordes manipulados.',
            'Datos raspados, tachados, sobreimpresos o con tintas distintas.',
            'Numeración o códigos que no siguen el patrón esperado.',
          ],
        },
        fuente:
          'Orientativo. La falsedad documental se tipifica en los arts. 390 y ss. del Código Penal; la calificación es judicial.',
        estado: 'orientativo',
      },
      {
        id: 'falsedad-conducir',
        titulo: 'Documentos de conducir y de vehículo',
        descripcion:
          'Al valorar permiso de conducir, permiso de circulación o ficha técnica, conviene ' +
          'contrastar entre sí los documentos y con el propio vehículo.',
        indicios: {
          titulo: 'Qué conviene contrastar',
          items: [
            'Coincidencia de bastidor (VIN) entre permiso de circulación, ficha técnica y vehículo.',
            'Coherencia de fechas (primera matriculación, ITV, expedición del permiso).',
            'Correspondencia de fotografía y firma con la persona identificada.',
            'Elementos de seguridad propios de cada documento oficial.',
          ],
        },
        estado: 'orientativo',
      },
    ],
  },
] as const;

/** Devuelve la categoría por su `id`, o `undefined` si no existe (ruta con id inválido). */
export function getCategoriaVehiculos(id: string | undefined): CategoriaVehiculos | undefined {
  if (!id) return undefined;
  return CATEGORIAS_VEHICULOS.find((c) => c.id === id);
}
