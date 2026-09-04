import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';
import type { Feedback } from '@agente/shared';
import { feedbackToRow, rowToFeedback, type FeedbackRow } from '@/features/feedback/serialize';

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
