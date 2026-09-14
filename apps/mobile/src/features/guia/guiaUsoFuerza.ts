import type { SeccionGuiaAccion } from './GuiaAccionScreen';

/**
 * Datos de la GUÍA RÁPIDA ORIENTATIVA DE USO DE LA FUERZA (art. 5 LO 2/1986 —principios básicos de
 * actuación—; art. 104 CE; arts. 20.4, 20.7, 15 CE, 174-175 CP; y la doctrina de la escala de uso de
 * la fuerza). Contenido de referencia ESTÁTICO, escaneable y para uso EN DIRECTO, con el patrón de las
 * demás guías (menores, extranjería, VG, ocupación): cada sección abre con una ORIENTACIÓN operativa y
 * debajo el fundamento.
 *
 * ZONA MUY SENSIBLE. Todo el texto es ESTRICTAMENTE ORIENTATIVO: describe el marco legal y los
 * principios, NUNCA ordena emplear la fuerza ni fija cuándo golpear o disparar. La decisión de emplear
 * la fuerza, su intensidad y su cese son SIEMPRE del agente en cada situación concreta y quedan
 * sometidas al control judicial. Marcada como "Borrador beta": pendiente de construir/validar CON el
 * cofundador agente y de un pase de revisor jurídico antes de darla por verificada.
 *
 * Literal cotejado en el BOE (LO 2/1986, art. quinto, leído 2026-09-14):
 *  - 5.2.c: actuar "por los principios de congruencia, oportunidad y proporcionalidad en la utilización
 *    de los medios a su alcance", con la decisión necesaria y sin demora cuando dependa evitar un daño
 *    grave, inmediato e irreparable.
 *  - 5.2.d: usar las armas "solamente" ante "un riesgo racionalmente grave para su vida, su integridad
 *    física o las de terceras personas", o "grave riesgo para la seguridad ciudadana", y conforme a los
 *    principios anteriores.
 *  - 5.3.b: velar por la vida e integridad física de los detenidos/bajo custodia y respetar su honor y
 *    dignidad. 5.6: responsabilidad personal y directa por los actos que infrinjan las normas.
 */

/** Fecha de actualización/vigencia visible (regla CLAUDE.md: fuente + fecha en todo contenido legal). */
export const ACTUALIZACION_GUIA_USO_FUERZA = 'septiembre de 2026';

export const GUIA_USO_FUERZA: readonly SeccionGuiaAccion[] = [
  {
    titulo: 'Los tres principios que lo rigen todo',
    accion: 'Filtro antes de emplear la fuerza: congruencia, oportunidad y proporcionalidad.',
    articulo: 'art. 5.2.c LO 2/1986',
    puntos: [
      {
        texto:
          'Marco constitucional: el art. 104 CE encomienda a las Fuerzas y Cuerpos de Seguridad proteger el libre ejercicio de los derechos y libertades y garantizar la seguridad ciudadana; su desarrollo son los principios de actuación del art. 5 LO 2/1986.',
      },
      {
        texto:
          'La ley exige actuar "por los principios de congruencia, oportunidad y proporcionalidad en la utilización de los medios a su alcance" (art. 5.2.c LO 2/1986). Son el filtro de CUALQUIER uso de la fuerza.',
        fuerte: true,
      },
      {
        texto:
          'CONGRUENCIA: el medio empleado debe ser el adecuado al fin legítimo perseguido (no vale un medio ajeno al objetivo).',
      },
      {
        texto:
          'OPORTUNIDAD: emplearlo cuando es necesario y en el momento en que lo es; si hay una vía menos lesiva igual de eficaz, esa es la procedente.',
      },
      {
        texto:
          'PROPORCIONALIDAD: la intensidad de la fuerza debe guardar relación con la gravedad de la situación y la resistencia o el riesgo reales; a menor amenaza, menor fuerza.',
        fuerte: true,
      },
      {
        texto:
          'La misma norma pide actuar "con la decisión necesaria, y sin demora cuando de ello dependa evitar un daño grave, inmediato e irreparable" (art. 5.2.c). Firmeza y contención no se excluyen.',
      },
    ],
  },
  {
    titulo: 'La escala de la fuerza (orientativa)',
    accion: 'Orientación: subir solo lo justo y bajar en cuanto cesa la resistencia o el riesgo.',
    articulo: 'modelo doctrinal de formación policial (fuente concreta a verificar) · principios del art. 5.2.c LO 2/1986',
    puntos: [
      {
        texto:
          'Modelo de graduación usado habitualmente en la formación policial (fuente concreta a verificar), de menor a mayor: (1) presencia policial; (2) verbalización/diálogo y advertencia; (3) control físico o reducción (técnicas de sujeción, grilletes/esposas); (4) medios coactivos reglamentarios (defensa/porra extensible o tonfa, spray/aerosol de defensa; el táser donde esté autorizado); (5) arma de fuego como ÚLTIMO recurso.',
        fuerte: true,
      },
      {
        texto:
          'Ejemplos orientativos para reconocer el nivel: una persona que forcejea al ser esposada → control físico (nivel 3); quien se abalanza o amenaza con un objeto contundente → medios coactivos (nivel 4); quien amenaza de muerte con un arma blanca o de fuego → el nivel extremo, con el listón del art. 5.2.d. Son ejemplos, no reglas: manda el riesgo real y los tres principios.',
      },
      {
        texto:
          'La escala es ORIENTATIVA, no un guion rígido: no siempre se recorre peldaño a peldaño; el nivel adecuado lo marca el riesgo real de cada situación bajo los tres principios.',
      },
      {
        texto:
          'La orientación general es emplear el nivel mínimo eficaz y REDUCIRLO o cesar en cuanto la resistencia o el peligro disminuyen o desaparecen. Mantener fuerza sobre una persona ya controlada deja de estar amparado.',
        fuerte: true,
      },
      {
        texto:
          'Cada medio coactivo tiene su propia habilitación y formación; su empleo se rige, además, por la normativa e instrucciones internas de cada cuerpo (a verificar en tu unidad).',
      },
    ],
  },
  {
    titulo: 'El arma de fuego: solo el límite extremo',
    accion: 'Listón legal del arma: riesgo racionalmente grave para la vida o integridad, propia o ajena.',
    articulo: 'art. 5.2.d LO 2/1986',
    puntos: [
      {
        texto:
          'La ley reserva el arma "solamente" para "las situaciones en que exista un riesgo racionalmente grave para su vida, su integridad física o las de terceras personas", o ante "un grave riesgo para la seguridad ciudadana" (art. 5.2.d LO 2/1986).',
        fuerte: true,
      },
      {
        texto:
          'Y siempre "de conformidad con los principios" de congruencia, oportunidad y proporcionalidad (art. 5.2.d en relación con el 5.2.c): el arma no es un peldaño más automático.',
        fuerte: true,
      },
      {
        texto:
          'La valoración del "riesgo racionalmente grave" y de la respuesta es del agente en la situación concreta y queda sometida a control judicial. Esta guía NO fija cuándo disparar.',
      },
    ],
  },
  {
    titulo: 'La cobertura legal (y sus requisitos)',
    accion: 'La eximente no es automática: exige necesidad y proporción; sin ellas, no ampara.',
    articulo: 'arts. 20.7 y 20.4 CP',
    puntos: [
      {
        texto:
          'El uso legítimo de la fuerza puede ampararse en el CUMPLIMIENTO DE UN DEBER o ejercicio legítimo del cargo (art. 20.7 CP) y, cuando concurran sus requisitos, en la LEGÍTIMA DEFENSA propia o de terceros (art. 20.4 CP).',
        fuerte: true,
      },
      {
        texto:
          'La eximente del art. 20.7 CP (obrar en cumplimiento de un deber o en el ejercicio legítimo de un derecho, oficio o cargo) exige, según la interpretación habitual de los tribunales (a verificar con jurisprudencia concreta), que el agente actúe en el ejercicio de su cargo, con un fin lícito, y que el uso de la fuerza sea NECESARIO y PROPORCIONADO. Si falta la proporción, puede quedar como eximente incompleta (art. 21.1 CP), atenuando, no eximiendo.',
        fuerte: true,
      },
      {
        texto:
          'La legítima defensa (art. 20.4 CP) requiere agresión ilegítima, necesidad racional del medio empleado para impedirla o repelerla y falta de provocación suficiente.',
      },
      {
        texto:
          'La calificación final de si la actuación estuvo amparada corresponde a la AUTORIDAD JUDICIAL. Orientación basada en la normativa citada.',
      },
    ],
  },
  {
    titulo: 'Después de emplear la fuerza',
    accion: 'Orientación inmediata: asegurar, auxiliar/asistencia sanitaria y documentar lo ocurrido.',
    articulo: 'art. 5.3.b LO 2/1986',
    puntos: [
      {
        texto:
          'La ley obliga a "velar por la vida e integridad física" de las personas detenidas o bajo custodia y a respetar su honor y dignidad (art. 5.3.b LO 2/1986): tras reducir a alguien, procede valorar de inmediato la asistencia sanitaria si hay lesión o riesgo.',
        fuerte: true,
      },
      {
        texto:
          'Procede reflejar en el atestado/informe, con objetividad, la resistencia o amenaza afrontada, los medios empleados, las advertencias hechas y las lesiones o incidencias, para dejar constancia de la necesidad y proporción.',
        fuerte: true,
      },
      {
        texto:
          'Si tu cuerpo dispone de cámara individual (bodycam), procede activarla/preservar la grabación según la normativa interna: documenta la intervención y protege tanto a la ciudadanía como al propio agente. A verificar el protocolo de tu unidad/territorio.',
      },
      {
        texto:
          'Datos de terceros (lesionados, testigos, partes médicos) se manejan según la normativa de protección de datos y NO se comparten fuera de los cauces del procedimiento. La app no envía nada de eso a ningún servidor.',
      },
    ],
  },
  {
    titulo: 'Los límites infranqueables',
    accion: 'Nunca ampara nada la tortura ni el trato degradante; la responsabilidad es personal.',
    articulo: 'arts. 15 CE, 174-175 CP; art. 5.6 LO 2/1986',
    puntos: [
      {
        texto:
          'Está absolutamente prohibida la tortura y el trato inhumano o degradante (art. 15 CE), tipificados como delito (arts. 174-175 CP). Ninguna orden ni circunstancia lo ampara.',
        fuerte: true,
      },
      {
        texto:
          'La obediencia debida "en ningún caso" puede amparar órdenes que manifiestamente constituyan delito o sean contrarias a la Constitución o a las leyes (art. 5.1.d LO 2/1986).',
        fuerte: true,
      },
      {
        texto:
          'El agente es responsable "personal y directamente" por los actos que, en su actuación profesional, infrinjan las normas legales o reglamentarias y los principios anteriores (art. 5.6 LO 2/1986).',
      },
      {
        texto:
          'Orientación basada en la normativa citada; la valoración de cada intervención y su calificación corresponden al agente y, en su caso, a la autoridad judicial.',
      },
    ],
  },
];
