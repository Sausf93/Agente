/**
 * Datos de la GUÍA RÁPIDA DE IDENTIFICACIÓN Y CACHEO (LOSC arts. 16 y 20). Contenido de referencia
 * ESTÁTICO en la app (patrón de los derechos y de la guía de alcoholemia): resume, escaneable y para
 * uso EN DIRECTO, los puntos que hoy viven en prosa en las fichas del paquete
 * (`sc-identificacion-requerimiento`, `sc-cacheo-registro`, `sc-negativa-identificarse`).
 *
 * Orientativo y "Borrador beta": los datos están pendientes de verificación por el revisor jurídico
 * (igual que las fichas fuente) y la valoración final del caso corresponde al agente/juez.
 *
 * Orden de las secciones = orden de la consulta REAL en la calle (validación de calle): identifico →
 * si no colabora o se niega, ¿qué hago? → cacheo (rama de objetos peligrosos) → vehículo/domicilio.
 * Revisado por `revisor-juridico` contra el BOE consolidado de la LO 4/2015 (BOE-A-2015-3442).
 */

/** Fecha de actualización/vigencia visible (regla CLAUDE.md: fuente + fecha en todo contenido legal). */
export const ACTUALIZACION_GUIA_IDENTIFICACION = 'septiembre de 2026';

export interface PuntoGuia {
  texto: string;
  /** Punto clave (se resalta). */
  fuerte?: boolean;
}

export interface SeccionGuiaIdentificacion {
  titulo: string;
  /** Artículo(s) de referencia, para el chip de fuente. */
  articulo: string;
  /** Ficha del paquete que amplía la sección. */
  fichaId: string;
  puntos: readonly PuntoGuia[];
}

export const GUIA_IDENTIFICACION: readonly SeccionGuiaIdentificacion[] = [
  {
    titulo: 'Identificación de personas',
    articulo: 'art. 16 LOSC',
    fichaId: 'sc-identificacion-requerimiento',
    puntos: [
      {
        texto:
          'Procede con INDICIOS de participación en una infracción, o cuando sea necesario para PREVENIR un delito.',
        fuerte: true,
      },
      { texto: 'Requisitos: motivo concreto y comprobaciones en el propio lugar.' },
      {
        texto:
          'Solo si no se logra de otro modo y es necesario: traslado a DEPENDENCIAS, por el tiempo imprescindible, MÁX. 6 HORAS (art. 16.2).',
        fuerte: true,
      },
      {
        texto:
          'El traslado NO es una detención: no se leen los derechos del 520 LECrim; queda constancia en el libro-registro (causa, identidad, tiempo) (art. 16.3).',
      },
    ],
  },
  {
    titulo: 'Si no lleva DNI o se niega',
    articulo: 'arts. 16 y 36.6 LOSC · arts. 550-551 y 556 CP',
    fichaId: 'sc-negativa-identificarse',
    puntos: [
      {
        texto:
          'NO llevar la documentación encima NO es, por sí solo, infracción: se identifica por otros medios (filiación manifestada, testigos, consulta a bases).',
        fuerte: true,
      },
      {
        texto:
          'NEGARSE a identificarse a requerimiento, o dar datos falsos o inexactos, SÍ es infracción GRAVE (art. 36.6).',
        fuerte: true,
      },
      {
        texto:
          'Si no se logra la identificación de otro modo y es necesario: valorar el traslado a dependencias (art. 16), máx. 6 horas.',
      },
      {
        texto:
          'Si a la negativa se suma DESOBEDIENCIA GRAVE o RESISTENCIA no violenta a los agentes, puede pasar a la vía penal (art. 556 CP). Si concurre VIOLENCIA o INTIMIDACIÓN GRAVE, el hecho sería ATENTADO (arts. 550-551 CP), más grave. En ambos casos, valorar la detención conforme a la LECrim (arts. 490 y 492) según el caso. La valoración de los indicios y la calificación final corresponden al agente y, en su caso, al juez.',
        fuerte: true,
      },
    ],
  },
  {
    titulo: 'Cacheo y registro corporal',
    articulo: 'art. 20 LOSC',
    fichaId: 'sc-cacheo-registro',
    puntos: [
      {
        texto:
          'Cacheo SUPERFICIAL (palpación): con indicios racionales de hallar objetos relevantes (art. 20.1).',
        fuerte: true,
      },
      {
        texto:
          'Con dignidad, por agente del MISMO SEXO (salvo urgencia por riesgo grave), motivación e informando de las razones (art. 20.2).',
        fuerte: true,
      },
      {
        texto:
          'Si obliga a dejar a la vista partes cubiertas por la ropa: en LUGAR RESERVADO y con constancia escrita (art. 20.2).',
        fuerte: true,
      },
      {
        texto: 'DESNUDO integral: EXCEPCIONAL, con garantías reforzadas (doctrina del TC); nunca rutinario.',
      },
    ],
  },
  {
    titulo: 'Vehículo y domicilio',
    articulo: 'art. 18.2 CE · arts. 545 y ss. LECrim',
    fichaId: 'sc-cacheo-registro',
    puntos: [
      {
        texto:
          'Vehículo ORDINARIO: no es domicilio → registro superficial con indicios y garantías, sin autorización judicial.',
        fuerte: true,
      },
      {
        texto:
          'Vehículo-VIVIENDA (camper habitada) o DOMICILIO: requiere RESOLUCIÓN JUDICIAL, salvo consentimiento del titular o delito FLAGRANTE (art. 18.2 CE; arts. 545 y ss. LECrim).',
        fuerte: true,
      },
    ],
  },
];
