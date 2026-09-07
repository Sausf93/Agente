import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';
import type { Cuadrante, DiaCuadrante, Feedback } from '@agente/shared';
import { feedbackToRow, rowToFeedback, type FeedbackRow } from '@/features/feedback/serialize';
import {
  configToRow,
  ensamblarCuadrante,
  excepcionToRow,
  type CuadranteConfigRow,
  type CuadranteExcepcionRow,
} from '@/features/cuadrante/serialize';

/**
 * Base de datos LOCAL DEL USUARIO (lectura/escritura), separada del paquete de
 * contenido (ADR-010, punto 4). Aquí viven los datos que crea el socio en el
 * dispositivo y que NUNCA salen a un servidor: por ahora, el feedback (sugerencias y
 * reportes). Más adelante convivirán aquí el cuadrante, favoritos y "mi ordenanza
 * personal".
 *
 * Persistencia con `expo-sqlite` (compatible con Expo Go). Migraciones secuenciales
 * versionadas con `PRAGMA user_version`, como exige ADR-010: los datos del usuario
 * deben sobrevivir a cualquier actualización.
 */

export const USER_DB_NAME = 'user.db';

let userDbHandle: SQLiteDatabase | null = null;

/** Migraciones idempotentes por versión de esquema. */
async function migrate(db: SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const version = row?.user_version ?? 0;

  if (version < 1) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS feedback (
        id TEXT PRIMARY KEY NOT NULL,
        created_at TEXT NOT NULL,
        tipo TEXT NOT NULL,
        texto TEXT NOT NULL,
        contexto_json TEXT NOT NULL,
        app_version TEXT NOT NULL,
        platform TEXT NOT NULL,
        cuerpo TEXT,
        territorio TEXT,
        enviado INTEGER NOT NULL DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback (created_at DESC);
      PRAGMA user_version = 1;
    `);
  }

  if (version < 2) {
    // Búsquedas SIN RESULTADO: base para ampliar el diccionario de sinónimos (§4.3). Es una
    // señal AGREGADA por término normalizado (sin datos personales) que vive SOLO en el
    // dispositivo; nunca viaja a un servidor (ADR-001). `veces` cuenta las repeticiones.
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS busqueda_sin_resultado (
        termino_normalizado TEXT PRIMARY KEY NOT NULL,
        veces INTEGER NOT NULL DEFAULT 1,
        ultima_fecha TEXT NOT NULL
      );
      PRAGMA user_version = 2;
    `);
  }

  if (version < 3) {
    // CUADRANTE en DOS CAPAS separadas (perspectivas §8, ADR-010): la config (patrón,
    // inicio de ciclo, jornada, franja, festivos) en una única fila; y las EXCEPCIONES
    // manuales, una fila por fecha. Editar un día toca SOLO su fila y cambiar el patrón
    // NUNCA borra las excepciones → no se pierde el trabajo del agente (el fallo de SPPLB).
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS cuadrante_config (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        patron_json TEXT NOT NULL,
        inicio_ciclo TEXT NOT NULL,
        jornada_ref_h REAL NOT NULL,
        computo_anual_ref_h REAL,
        franja_inicio TEXT NOT NULL,
        franja_fin TEXT NOT NULL,
        festivos_extra_json TEXT NOT NULL DEFAULT '[]',
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS cuadrante_excepcion (
        fecha TEXT PRIMARY KEY NOT NULL,
        servicio TEXT NOT NULL,
        hora_inicio TEXT,
        hora_fin TEXT,
        nota TEXT,
        alarma_min INTEGER,
        editado_el TEXT NOT NULL
      );
      PRAGMA user_version = 3;
    `);
  }
}

/** Abre (una sola vez) la base local del usuario y aplica migraciones. */
export async function openUserDb(): Promise<SQLiteDatabase> {
  if (userDbHandle) return userDbHandle;
  const db = await openDatabaseAsync(USER_DB_NAME);
  await migrate(db);
  userDbHandle = db;
  return db;
}

/** Inserta un feedback nuevo. */
export async function insertFeedback(fb: Feedback): Promise<void> {
  const db = await openUserDb();
  const row = feedbackToRow(fb);
  await db.runAsync(
    `INSERT INTO feedback
       (id, created_at, tipo, texto, contexto_json, app_version, platform, cuerpo, territorio, enviado)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      row.id,
      row.created_at,
      row.tipo,
      row.texto,
      row.contexto_json,
      row.app_version,
      row.platform,
      row.cuerpo,
      row.territorio,
      row.enviado,
    ],
  );
}

/** Devuelve todo el feedback guardado, más reciente primero. Descarta filas corruptas. */
export async function listFeedback(): Promise<Feedback[]> {
  const db = await openUserDb();
  const rows = await db.getAllAsync<FeedbackRow>(
    'SELECT * FROM feedback ORDER BY created_at DESC',
  );
  const result: Feedback[] = [];
  for (const row of rows) {
    try {
      result.push(rowToFeedback(row));
    } catch {
      // Fila corrupta (esquema antiguo o dato inválido): se ignora, no rompe la lista.
    }
  }
  return result;
}

/** Marca como enviados los feedback indicados (tras componer el correo/Share). */
export async function markFeedbackSent(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const db = await openUserDb();
  const placeholders = ids.map(() => '?').join(', ');
  await db.runAsync(`UPDATE feedback SET enviado = 1 WHERE id IN (${placeholders})`, ids);
}

/** Borra un feedback del dispositivo. */
export async function deleteFeedback(id: string): Promise<void> {
  const db = await openUserDb();
  await db.runAsync('DELETE FROM feedback WHERE id = ?', [id]);
}

/**
 * Registra (o incrementa) una búsqueda SIN RESULTADO por término normalizado. Solo local: es la
 * materia prima para que el cofundador agente amplíe el diccionario de sinónimos (§4.3). El
 * término ya viene normalizado (`normalizarBusqueda`), sin datos personales.
 */
export async function recordSearchMiss(terminoNormalizado: string): Promise<void> {
  const termino = terminoNormalizado.trim();
  if (termino.length === 0) return;
  const db = await openUserDb();
  await db.runAsync(
    `INSERT INTO busqueda_sin_resultado (termino_normalizado, veces, ultima_fecha)
       VALUES (?, 1, ?)
     ON CONFLICT(termino_normalizado)
       DO UPDATE SET veces = veces + 1, ultima_fecha = excluded.ultima_fecha`,
    [termino, new Date().toISOString()],
  );
}

/** Término sin resultado con su recuento, para depurar el diccionario. */
export interface SearchMiss {
  termino: string;
  veces: number;
  ultimaFecha: string;
}

/** Lista las búsquedas sin resultado, las más repetidas primero. */
export async function listSearchMisses(): Promise<SearchMiss[]> {
  const db = await openUserDb();
  const rows = await db.getAllAsync<{
    termino_normalizado: string;
    veces: number;
    ultima_fecha: string;
  }>('SELECT * FROM busqueda_sin_resultado ORDER BY veces DESC, ultima_fecha DESC');
  return rows.map((r) => ({
    termino: r.termino_normalizado,
    veces: r.veces,
    ultimaFecha: r.ultima_fecha,
  }));
}

// ---------------------------------------------------------------------------
// Cuadrante (sección 4.9) — dos capas: config (1 fila) + excepciones (1 fila/fecha)
// ---------------------------------------------------------------------------

/**
 * Carga el cuadrante del dispositivo, o `null` si aún no está configurado. Reensambla
 * config + excepciones y valida con Zod (fuente única). Las excepciones corruptas se
 * descartan una a una: nunca tumban el cuadrante entero (proteger el activo de retención).
 */
export async function loadCuadrante(): Promise<Cuadrante | null> {
  const db = await openUserDb();
  const config = await db.getFirstAsync<CuadranteConfigRow>(
    'SELECT * FROM cuadrante_config WHERE id = 1',
  );
  if (!config) return null;
  const excepciones = await db.getAllAsync<CuadranteExcepcionRow>(
    'SELECT * FROM cuadrante_excepcion ORDER BY fecha ASC',
  );
  return ensamblarCuadrante(config, excepciones);
}

/**
 * Guarda la CONFIG del cuadrante (patrón, inicio, jornada, franja, festivos) de forma
 * ATÓMICA. NO toca la tabla de excepciones: cambiar el patrón conserva las ediciones
 * manuales (excepciones sagradas). `updatedAt` lo inyecta el llamante para poder testear.
 */
export async function saveCuadranteConfig(cuadrante: Cuadrante, updatedAt: string): Promise<void> {
  const db = await openUserDb();
  const row = configToRow(cuadrante, updatedAt);
  await db.runAsync(
    `INSERT INTO cuadrante_config
       (id, patron_json, inicio_ciclo, jornada_ref_h, computo_anual_ref_h,
        franja_inicio, franja_fin, festivos_extra_json, updated_at)
     VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       patron_json = excluded.patron_json,
       inicio_ciclo = excluded.inicio_ciclo,
       jornada_ref_h = excluded.jornada_ref_h,
       computo_anual_ref_h = excluded.computo_anual_ref_h,
       franja_inicio = excluded.franja_inicio,
       franja_fin = excluded.franja_fin,
       festivos_extra_json = excluded.festivos_extra_json,
       updated_at = excluded.updated_at`,
    [
      row.patron_json,
      row.inicio_ciclo,
      row.jornada_ref_h,
      row.computo_anual_ref_h,
      row.franja_inicio,
      row.franja_fin,
      row.festivos_extra_json,
      row.updated_at,
    ],
  );
}

/**
 * Inserta o actualiza UNA excepción manual (edición de un día). Toca solo su fila:
 * es la operación más frecuente del cuadrante y la que debe ser indestructible.
 */
export async function upsertExcepcion(dia: DiaCuadrante): Promise<void> {
  const db = await openUserDb();
  const row = excepcionToRow(dia);
  await db.runAsync(
    `INSERT INTO cuadrante_excepcion
       (fecha, servicio, hora_inicio, hora_fin, nota, alarma_min, editado_el)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(fecha) DO UPDATE SET
       servicio = excluded.servicio,
       hora_inicio = excluded.hora_inicio,
       hora_fin = excluded.hora_fin,
       nota = excluded.nota,
       alarma_min = excluded.alarma_min,
       editado_el = excluded.editado_el`,
    [row.fecha, row.servicio, row.hora_inicio, row.hora_fin, row.nota, row.alarma_min, row.editado_el],
  );
}

/** Borra la excepción de una fecha (el día vuelve a proyectarse desde el patrón). */
export async function deleteExcepcion(fecha: string): Promise<void> {
  const db = await openUserDb();
  await db.runAsync('DELETE FROM cuadrante_excepcion WHERE fecha = ?', [fecha]);
}
