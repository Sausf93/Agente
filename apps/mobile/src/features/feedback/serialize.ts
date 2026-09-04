import { Feedback, type TipoFeedback } from '@agente/shared';

/**
 * Lógica PURA de la feature de feedback (sin runtime de React Native ni SQLite).
 *
 * Aquí vive todo lo determinista y testeable con Vitest: el mapeo fila SQLite ↔
 * `Feedback`, el texto del correo que se manda a los fundadores y la generación de
 * id. La capa de persistencia (`db/userDb.ts`) y el envío (`send.ts`) solo orquestan
 * estas funciones con las APIs nativas. Ver ADR-010 (tests scoped a lógica pura).
 */

/** Etiquetas de tipo en español para la UI y el correo. */
export const TIPO_FEEDBACK_LABEL: Record<TipoFeedback, string> = {
  sugerencia: 'Sugerencia',
  error_contenido: 'Error de contenido',
  error_tecnico: 'Error técnico',
};

/** Fila tal cual se guarda en la tabla `feedback` de la base local del usuario. */
export interface FeedbackRow {
  id: string;
  created_at: string;
  tipo: string;
  texto: string;
  contexto_json: string;
  app_version: string;
  platform: string;
  cuerpo: string | null;
  territorio: string | null;
  /** 0/1: SQLite no tiene booleano nativo. */
  enviado: number;
}

/** Serializa un `Feedback` de dominio a la fila de SQLite. */
export function feedbackToRow(fb: Feedback): FeedbackRow {
  return {
    id: fb.id,
    created_at: fb.createdAt,
    tipo: fb.tipo,
    texto: fb.texto,
    contexto_json: JSON.stringify(fb.contexto),
    app_version: fb.appVersion,
    platform: fb.platform,
    cuerpo: fb.cuerpo,
    territorio: fb.territorio,
    enviado: fb.enviado ? 1 : 0,
  };
}

/**
 * Deserializa una fila de SQLite a `Feedback`, VALIDANDO con Zod (fuente única de
 * verdad). Si la fila está corrupta, Zod lanza y la capa superior la descarta.
 */
export function rowToFeedback(row: FeedbackRow): Feedback {
  return Feedback.parse({
    id: row.id,
    createdAt: row.created_at,
    tipo: row.tipo,
    texto: row.texto,
    contexto: JSON.parse(row.contexto_json),
    appVersion: row.app_version,
    platform: row.platform,
    cuerpo: row.cuerpo,
    territorio: row.territorio,
    enviado: row.enviado === 1,
  });
}

/**
 * Genera un id de feedback. Se le inyectan el tiempo y un aleatorio para poder
 * testearlo sin depender del reloj ni de `Math.random` reales.
 */
export function makeFeedbackId(timeMs: number, random: number): string {
  const rand = Math.floor(random * 1e9)
    .toString(36)
    .padStart(6, '0');
  return `fb_${timeMs.toString(36)}_${rand}`;
}

const MAX_ASUNTO = 78;

/**
 * Compone el correo/Share que el socio manda a los fundadores con el feedback
 * PENDIENTE (no enviado). Es texto plano y determinista: no incluye nada que la app
 * no tenga ya (el `texto` lo escribió el propio socio). No hay capturas automáticas.
 */
export function composeEmailBody(pendientes: Feedback[]): { subject: string; body: string } {
  const n = pendientes.length;
  const subject =
    n === 1
      ? `Agente · ${TIPO_FEEDBACK_LABEL[pendientes[0]!.tipo]}`.slice(0, MAX_ASUNTO)
      : `Agente · ${n} aportaciones de la beta`;

  const bloques = pendientes.map((fb, i) => {
    const partes = [
      `#${i + 1} · ${TIPO_FEEDBACK_LABEL[fb.tipo]}`,
      `Fecha: ${fb.createdAt}`,
      `App: ${fb.appVersion} (${fb.platform})`,
    ];
    if (fb.cuerpo) partes.push(`Cuerpo: ${fb.cuerpo}`);
    if (fb.territorio) partes.push(`Territorio: ${fb.territorio}`);
    if (fb.contexto.pantalla) partes.push(`Pantalla: ${fb.contexto.pantalla}`);
    if (fb.contexto.articuloId) partes.push(`Artículo: ${fb.contexto.articuloId}`);
    if (fb.contexto.infraccionId) partes.push(`Infracción: ${fb.contexto.infraccionId}`);
    partes.push('', fb.texto);
    return partes.join('\n');
  });

  const body = [
    'Feedback de la beta de Agente (enviado desde el dispositivo del socio).',
    '',
    bloques.join('\n\n----------------------------------------\n\n'),
  ].join('\n');

  return { subject, body };
}
