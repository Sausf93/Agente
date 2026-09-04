import { z } from 'zod';
import { Cuerpo, Plataforma, TipoFeedback } from './enums.js';

/**
 * Modelo de FEEDBACK del socio (sugerencias y reportes) — sección 4.15.
 *
 * DECISIÓN DE ARQUITECTURA (ver docs/DECISIONES.md, ADR-011): el feedback es
 * LOCAL-FIRST, OFFLINE y ANÓNIMO. Se guarda SOLO en el dispositivo y NO se envía a
 * ningún servidor. El socio puede pulsar "Enviar a los fundadores", que compone un
 * correo/Share desde el propio dispositivo (compositor nativo) con el texto pendiente
 * y lo marca como `enviado`. La sincronización con Supabase llegará después; este
 * esquema deja el terreno preparado (`enviado`) sin implementarla.
 *
 * REGLA DE PRIVACIDAD (CLAUDE.md): el `texto` es libre y lo escribe el socio; la UI
 * avisa de forma fija de NO incluir matrículas, nombres, DNI ni datos de intervención.
 * El resto de campos son NO identificativos a propósito: `cuerpo` y `territorio` dan
 * contexto de segmento (para priorizar mejoras), nunca identifican a la persona. Aquí
 * NUNCA se guardan datos personales ni de terceros.
 */

const Id = z.string().min(1);
const FechaISO = z.string().datetime({ offset: true });

/**
 * Contexto opcional desde dónde se dejó el feedback. Sirve para el gancho
 * "reportar error" desde una ficha (prerrellena `articuloId`/`infraccionId`) y para
 * saber en qué pantalla estaba el socio. Solo ids de contenido oficial, nunca datos
 * personales.
 */
export const ContextoFeedback = z
  .object({
    /** Pantalla o ruta desde la que se abrió el formulario (p. ej. "ficha", "mas"). */
    pantalla: z.string().nullable().default(null),
    /** Artículo al que se refiere el reporte (cuando exista la ficha). */
    articuloId: Id.nullable().default(null),
    /** Infracción a la que se refiere el reporte (cuando exista la ficha). */
    infraccionId: Id.nullable().default(null),
  })
  .default({});
export type ContextoFeedback = z.infer<typeof ContextoFeedback>;

/**
 * Una entrada de feedback guardada en el dispositivo.
 * `enviado` indica si ya se compuso el correo/Share con los fundadores.
 */
export const Feedback = z.object({
  id: Id,
  createdAt: FechaISO,
  tipo: TipoFeedback,
  /** Texto libre del socio. Mínimo 3 caracteres para descartar toques accidentales. */
  texto: z.string().trim().min(3, 'Escribe al menos unas palabras').max(2000),
  contexto: ContextoFeedback,
  /** Versión de la app (p. ej. "0.1.0"), para reproducir errores técnicos. */
  appVersion: z.string().min(1),
  platform: Plataforma,
  /** Contexto de segmento NO identificativo (del perfil local). */
  cuerpo: Cuerpo.nullable().default(null),
  /** Territorio del perfil como etiqueta/ccaaId no identificativa (nunca municipio+persona). */
  territorio: z.string().nullable().default(null),
  /** true cuando el socio ya lo mandó a los fundadores desde el dispositivo. */
  enviado: z.boolean().default(false),
});
export type Feedback = z.infer<typeof Feedback>;

/**
 * Datos necesarios para CREAR un feedback (lo que aporta la UI). El `id`, `createdAt`
 * y `enviado` los pone la capa de persistencia. Útil para tipar el formulario.
 */
export const NuevoFeedback = Feedback.pick({
  tipo: true,
  texto: true,
  contexto: true,
  appVersion: true,
  platform: true,
  cuerpo: true,
  territorio: true,
});
export type NuevoFeedback = z.infer<typeof NuevoFeedback>;
