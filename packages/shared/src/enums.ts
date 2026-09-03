import { z } from 'zod';

/**
 * Enumeraciones del dominio.
 *
 * Convención: los valores son cadenas estables en español (se persisten en base
 * de datos y viajan en el paquete de contenido). No renombrar sin migración.
 */

/** Cuerpo policial al que pertenece el agente (sección 2.1 de la especificación). */
export const Cuerpo = z.enum([
  'guardia_civil',
  'policia_nacional',
  'policia_local',
  'policia_autonomica',
]);
export type Cuerpo = z.infer<typeof Cuerpo>;

/** Policías autonómicas con normativa propia. */
export const PoliciaAutonomica = z.enum([
  'ertzaintza',
  'mossos',
  'policia_foral',
  'policia_canaria',
]);
export type PoliciaAutonomica = z.infer<typeof PoliciaAutonomica>;

/** Ámbito territorial de una norma o infracción. */
export const Ambito = z.enum(['estatal', 'autonomico', 'municipal']);
export type Ambito = z.infer<typeof Ambito>;

/** Tipo de norma. */
export const TipoNorma = z.enum(['ley', 'reglamento', 'ordenanza', 'codificado']);
export type TipoNorma = z.infer<typeof TipoNorma>;

/**
 * Gravedad de una infracción.
 * `delito` marca el salto de la vía administrativa a la penal.
 */
export const Gravedad = z.enum(['leve', 'grave', 'muy_grave', 'delito']);
export type Gravedad = z.infer<typeof Gravedad>;

/** Vía sancionadora. */
export const TipoInfraccion = z.enum(['administrativa', 'penal']);
export type TipoInfraccion = z.infer<typeof TipoInfraccion>;

/** Tipos de consecuencia asociada a una infracción (capa de consecuencias, sección 4.6). */
export const TipoConsecuencia = z.enum([
  'detencion',
  'inmovilizacion',
  'deposito',
  'decomiso',
  'retirada_permiso',
  'identificacion',
]);
export type TipoConsecuencia = z.infer<typeof TipoConsecuencia>;

/** Gravedad penal derivada de la pena (art. 33 CP), usada por el árbol de detención. */
export const GravedadPenal = z.enum(['leve', 'menos_grave', 'grave']);
export type GravedadPenal = z.infer<typeof GravedadPenal>;

/** Tipo de territorio en el catálogo (jerarquía INE). */
export const TipoTerritorio = z.enum(['ccaa', 'provincia', 'municipio']);
export type TipoTerritorio = z.infer<typeof TipoTerritorio>;

/**
 * Origen del contenido. `oficial` = curado y publicado en el paquete firmado.
 * `personal` = "mi ordenanza personal" que el agente carga en su dispositivo; nunca
 * viaja al servidor ni al paquete oficial (puente hasta que su municipio esté curado).
 */
export const OrigenContenido = z.enum(['oficial', 'personal']);
export type OrigenContenido = z.infer<typeof OrigenContenido>;

/**
 * Vocabulario cerrado de "quién puede denunciar" (competencia, solo aviso orientativo).
 * No modela el árbol completo por CCAA (sobre-ingeniería en v1): el filtro territorial ya
 * garantiza que el chip `policia_autonomica` solo lo ve quien está en esa comunidad.
 */
export const CuerpoCompetente = z.enum([
  'guardia_civil',
  'policia_nacional',
  'policia_local',
  'policia_autonomica',
  'trafico', // subrol de Tráfico (competencia interurbana específica)
]);
export type CuerpoCompetente = z.infer<typeof CuerpoCompetente>;

/** Ámbito de un festivo. */
export const AmbitoFestivo = z.enum(['nacional', 'ccaa', 'municipio']);
export type AmbitoFestivo = z.infer<typeof AmbitoFestivo>;

/** Plataforma de compra de la suscripción. */
export const Plataforma = z.enum(['ios', 'android']);
export type Plataforma = z.infer<typeof Plataforma>;

/** Estado de la suscripción (sincronizado desde RevenueCat). */
export const EstadoSuscripcion = z.enum([
  'activa',
  'en_prueba',
  'en_gracia',
  'cancelada',
  'caducada',
  'beta', // acceso otorgado por allowlist beta, sin pasar por la tienda
]);
export type EstadoSuscripcion = z.infer<typeof EstadoSuscripcion>;

/** Tipo de evento de uso anónimo (sección 6.2). */
export const TipoEventoUso = z.enum(['busqueda', 'consulta', 'copia', 'pdf', 'sin_resultado']);
export type TipoEventoUso = z.infer<typeof TipoEventoUso>;

/** Tipos de plantilla de documento (sección 4.8). */
export const TipoPlantilla = z.enum([
  'boletin_denuncia',
  'acta_inmovilizacion',
  'acta_intervencion_sustancias',
  'diligencia_identificacion',
  'acta_lectura_derechos',
  'acta_informacion_victima',
]);
export type TipoPlantilla = z.infer<typeof TipoPlantilla>;

/** Tipos de servicio del cuadrante (sección 4.9; ampliado con disponibilidad/servicio_extra). */
export const TipoServicio = z.enum([
  'manana',
  'tarde',
  'noche',
  'saliente',
  'libre',
  'disponibilidad', // retén/localización: no computa como presencia efectiva
  'servicio_extra', // horas extra / refuerzo
  'vacaciones',
  'asuntos_propios',
  'baja',
  'curso',
  'otros',
]);
export type TipoServicio = z.infer<typeof TipoServicio>;

/** Clase de un tipo de servicio, para el cómputo de horas. */
export const ClaseServicio = z.enum(['trabajo', 'descanso', 'ausencia', 'disponibilidad']);
export type ClaseServicio = z.infer<typeof ClaseServicio>;
