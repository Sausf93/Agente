import { z } from 'zod';
import {
  ClaseServicio,
  Cuerpo,
  EstadoSuscripcion,
  Plataforma,
  PoliciaAutonomica,
  TipoEventoUso,
  TipoServicio,
} from './enums.js';

/**
 * Modelo de DATOS DE USUARIO (sección 6.2 de la especificación).
 *
 * DECISIÓN DE ARQUITECTURA v1 (ver docs/DECISIONES.md, a confirmar por el fundador):
 * la app es LOCAL-FIRST y SIN cuenta. El perfil, los favoritos y el cuadrante viven
 * en el dispositivo. Los pagos van por la tienda (RevenueCat con id anónimo). Por eso
 * `Usuario` aquí modela un PERFIL LOCAL sin email ni contraseña. Si más adelante se
 * añade backup/sincronización, se ampliará con una identidad opcional.
 *
 * NUNCA se envían al servidor: matrículas, nombres, DNI, contenido de PDFs generados,
 * ni notas personales sobre intervenciones.
 */

const Id = z.string().min(1);
const FechaISO = z.string().datetime({ offset: true });
const FechaCivil = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato esperado YYYY-MM-DD');

/** Preferencias de interfaz, guardadas en el dispositivo. */
export const Preferencias = z.object({
  tema: z.enum(['sistema', 'claro', 'oscuro']).default('sistema'),
  tamanoTexto: z.enum(['normal', 'grande', 'muy_grande']).default('normal'),
  accesosRapidos: z.array(z.string()).default([]), // ids de infracción/sección fijados
});
export type Preferencias = z.infer<typeof Preferencias>;

/**
 * Perfil local del agente. Determina qué contenido se prioriza (sección 2.2).
 * `municipioId` es obligatorio para Policía Local; opcional para el resto.
 */
export const PerfilUsuario = z
  .object({
    id: Id,
    cuerpo: Cuerpo,
    /** Cuál autonómica, obligatorio solo si cuerpo === 'policia_autonomica'. */
    policiaAutonomica: PoliciaAutonomica.nullable().default(null),
    ccaaId: Id,
    provinciaId: Id,
    municipioId: Id.nullable().default(null),
    unidad: z.string().nullable().default(null), // texto libre: "Tráfico", "Seguridad Ciudadana"
    preferencias: Preferencias.default({}),
    createdAt: FechaISO,
  })
  .refine((p) => p.cuerpo !== 'policia_local' || p.municipioId !== null, {
    message: 'El municipio es obligatorio para Policía Local',
    path: ['municipioId'],
  })
  .refine((p) => p.cuerpo !== 'policia_autonomica' || p.policiaAutonomica !== null, {
    message: 'Indica qué policía autonómica (Mossos, Ertzaintza, Foral, Canaria)',
    path: ['policiaAutonomica'],
  });
export type PerfilUsuario = z.infer<typeof PerfilUsuario>;

/**
 * Estado de suscripción sincronizado desde RevenueCat.
 * En local-first no hay usuario en servidor: la clave es el id anónimo de RevenueCat.
 */
export const Suscripcion = z.object({
  appUserId: z.string().min(1), // id anónimo de RevenueCat
  plataforma: Plataforma,
  estado: EstadoSuscripcion,
  productoId: z.string().min(1), // "pro_mensual" | "pro_anual"
  renuevaEl: FechaISO.nullable().default(null),
  originalTransactionId: z.string().nullable().default(null),
});
export type Suscripcion = z.infer<typeof Suscripcion>;

/** Favorito, guardado en el dispositivo. Referencia una infracción o un artículo. */
export const Favorito = z
  .object({
    infraccionId: Id.nullable().default(null),
    articuloId: Id.nullable().default(null),
    createdAt: FechaISO,
  })
  .refine((f) => Boolean(f.infraccionId) !== Boolean(f.articuloId), {
    message: 'Un favorito referencia una infracción O un artículo',
  });
export type Favorito = z.infer<typeof Favorito>;

// ---------------------------------------------------------------------------
// Cuadrante (sección 4.9) — vive en el dispositivo; backup opcional cifrado
// ---------------------------------------------------------------------------

const HoraHHMM = z.string().regex(/^\d{2}:\d{2}$/, 'Formato esperado HH:MM');

/**
 * Definición de un tipo de servicio DENTRO de un patrón (no una constante global):
 * horas y franja horaria por defecto, y si computa como presencia efectiva. Permite
 * calcular nocturnidad y turnos que cruzan medianoche (una "noche" no son "8 h" a secas,
 * son 22:00→06:00 con X horas en franja nocturna).
 */
export const DefinicionServicio = z.object({
  tipo: TipoServicio,
  horaInicioDefecto: HoraHHMM.nullable().default(null),
  horaFinDefecto: HoraHHMM.nullable().default(null),
  cruzaMedianoche: z.boolean().default(false),
  /** 'disponibilidad'/'reten' → false: cuentan aparte, no como presencia efectiva. */
  computaPresencia: z.boolean().default(true),
  clase: ClaseServicio.default('trabajo'),
});
export type DefinicionServicio = z.infer<typeof DefinicionServicio>;

/** Patrón de turno: ciclo repetitivo por cuerpo (p. ej. 6 servicios + saliente + 3 libres). */
export const PatronTurno = z.object({
  nombre: z.string().min(1),
  cuerpo: Cuerpo,
  /** Secuencia de tipos de servicio que se repite. */
  secuencia: z.array(TipoServicio).min(1),
  /** Definición (horas/franja) de cada tipo usado en la secuencia. */
  definiciones: z.array(DefinicionServicio).default([]),
  /** Los presets se clonan y editan; nunca se muta el preset original. */
  editable: z.boolean().default(true),
});
export type PatronTurno = z.infer<typeof PatronTurno>;

/**
 * Un día del cuadrante. SOLO se guarda si es EXCEPCIÓN manual (edición del agente):
 * los días no listados se proyectan desde el patrón al vuelo. Las excepciones son
 * "sagradas": la regeneración del patrón NUNCA las pisa.
 */
export const DiaCuadrante = z.object({
  fecha: FechaCivil,
  servicio: TipoServicio,
  horaInicio: HoraHHMM.nullable().default(null),
  horaFin: HoraHHMM.nullable().default(null),
  nota: z.string().nullable().default(null),
  alarmaMinutosAntes: z.number().int().nonnegative().nullable().default(null),
  /** Marca de excepción sagrada. */
  origen: z.literal('manual').default('manual'),
  /** Para resolver conflictos de respaldo (last-write-wins por campo). */
  editadoEl: FechaISO,
});
export type DiaCuadrante = z.infer<typeof DiaCuadrante>;

/** Franja horaria nocturna (configurable; nocturnidad se computa por solape real). */
export const FranjaNocturna = z.object({
  inicio: HoraHHMM.default('22:00'),
  fin: HoraHHMM.default('06:00'),
});
export type FranjaNocturna = z.infer<typeof FranjaNocturna>;

export const Cuadrante = z.object({
  /** Versión de esquema para migraciones seguras y no destructivas. */
  schemaVersion: z.number().int().positive().default(1),
  patron: PatronTurno,
  inicioCiclo: FechaCivil,
  /** Jornada de referencia CONFIGURABLE por cuerpo (no un 37,5 fijo como verdad). */
  jornadaRefHorasSemana: z.number().positive(),
  /** Cómputo anual de referencia (p. ej. 1.400–1.700 h/año), opcional. */
  computoAnualRefHoras: z.number().positive().nullable().default(null),
  franjaNocturna: FranjaNocturna.default({}),
  /** SOLO excepciones manuales; los demás días se proyectan del patrón. */
  dias: z.array(DiaCuadrante).default([]),
  /** Festivos locales añadidos por el agente (además de los del territorio). */
  festivosExtra: z.array(FechaCivil).default([]),
});
export type Cuadrante = z.infer<typeof Cuadrante>;

/**
 * Copia de seguridad del cuadrante en servidor (OPCIONAL, opt-in).
 * El contenido va CIFRADO con clave del dispositivo: el servidor no puede leerlo.
 */
export const CuadranteBackup = z.object({
  deviceId: z.string().min(1),
  blobCifrado: z.string().min(1),
  actualizadoEl: FechaISO,
});
export type CuadranteBackup = z.infer<typeof CuadranteBackup>;

// ---------------------------------------------------------------------------
// Analítica anónima (sección 6.2) — sin id de usuario ni de dispositivo persistente
// ---------------------------------------------------------------------------
export const EventoUso = z.object({
  cuerpo: Cuerpo,
  ccaaId: Id,
  tipo: TipoEventoUso,
  terminoNormalizado: z.string(), // término de búsqueda normalizado, sin datos personales
  fecha: FechaISO,
});
export type EventoUso = z.infer<typeof EventoUso>;
