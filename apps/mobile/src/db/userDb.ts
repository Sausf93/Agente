import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';
import type { Cuadrante, Cuerpo, DiaCuadrante, Feedback, PoliciaAutonomica } from '@agente/shared';
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

  if (version < 4) {
    // PERFIL LOCAL del agente (cuerpo, territorio y preferencia de tema), fijado en el
    // onboarding y editable en Ajustes. Una única fila. Vive SOLO en el dispositivo (ADR-001,
    // local-first, sin login): nada de esto viaja a un servidor. `onboarded` marca que el
    // onboarding se completó (gate de primera apertura).
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS perfil (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        cuerpo TEXT,
        policia_autonomica TEXT,
        ccaa_id TEXT,
        provincia_id TEXT,
        municipio_id TEXT,
        municipio_nombre TEXT,
        tema TEXT NOT NULL DEFAULT 'system',
        onboarded INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL
      );
      PRAGMA user_version = 4;
    `);
  }

  if (version < 5) {
    // MARCADORES de artículos (§4.5): el agente guarda un artículo del articulado para volver a
    // él. Local-first (ADR-001): viven SOLO en el dispositivo, separados del paquete de contenido
    // (ADR-010, punto 4). Se DESNORMALIZAN el código de norma, el número y el título del artículo
    // para poder pintar "mis marcadores" sin abrir el paquete y para que el marcador sobreviva a
    // un cambio de versión de contenido (aunque el id de artículo cambie de forma).
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS marcador_articulo (
        articulo_id TEXT PRIMARY KEY NOT NULL,
        norma_id TEXT NOT NULL,
        norma_codigo TEXT NOT NULL,
        articulo_numero TEXT NOT NULL,
        articulo_titulo TEXT,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_marcador_created_at ON marcador_articulo (created_at DESC);
      PRAGMA user_version = 5;
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

// ---------------------------------------------------------------------------
// Perfil local (cuerpo, territorio, tema, onboarding) — una sola fila, solo en el dispositivo
// ---------------------------------------------------------------------------

/** Preferencia de tema persistida: sigue el sistema o se fuerza claro/oscuro. */
export type ThemePreference = 'system' | 'light' | 'dark';

/** Perfil local tal y como se guarda/lee del dispositivo. Todos los campos son nullables salvo tema. */
export interface PerfilLocal {
  cuerpo: Cuerpo | null;
  policiaAutonomica: PoliciaAutonomica | null;
  ccaaId: string | null;
  provinciaId: string | null;
  municipioId: string | null;
  municipioNombre: string | null;
  tema: ThemePreference;
  onboarded: boolean;
}

interface PerfilRow {
  cuerpo: string | null;
  policia_autonomica: string | null;
  ccaa_id: string | null;
  provincia_id: string | null;
  municipio_id: string | null;
  municipio_nombre: string | null;
  tema: string;
  onboarded: number;
}

/** Carga el perfil local, o `null` si aún no existe (primera apertura → onboarding). */
export async function loadPerfil(): Promise<PerfilLocal | null> {
  const db = await openUserDb();
  const row = await db.getFirstAsync<PerfilRow>('SELECT * FROM perfil WHERE id = 1');
  if (!row) return null;
  return {
    cuerpo: (row.cuerpo as Cuerpo | null) ?? null,
    policiaAutonomica: (row.policia_autonomica as PoliciaAutonomica | null) ?? null,
    ccaaId: row.ccaa_id,
    provinciaId: row.provincia_id,
    municipioId: row.municipio_id,
    municipioNombre: row.municipio_nombre,
    tema: (['system', 'light', 'dark'].includes(row.tema) ? row.tema : 'system') as ThemePreference,
    onboarded: row.onboarded === 1,
  };
}

/** Guarda (upsert) el perfil local de forma atómica en su única fila. */
export async function savePerfil(perfil: PerfilLocal, updatedAt: string): Promise<void> {
  const db = await openUserDb();
  await db.runAsync(
    `INSERT INTO perfil
       (id, cuerpo, policia_autonomica, ccaa_id, provincia_id, municipio_id, municipio_nombre,
        tema, onboarded, updated_at)
     VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       cuerpo = excluded.cuerpo,
       policia_autonomica = excluded.policia_autonomica,
       ccaa_id = excluded.ccaa_id,
       provincia_id = excluded.provincia_id,
       municipio_id = excluded.municipio_id,
       municipio_nombre = excluded.municipio_nombre,
       tema = excluded.tema,
       onboarded = excluded.onboarded,
       updated_at = excluded.updated_at`,
    [
      perfil.cuerpo,
      perfil.policiaAutonomica,
      perfil.ccaaId,
      perfil.provinciaId,
      perfil.municipioId,
      perfil.municipioNombre,
      perfil.tema,
      perfil.onboarded ? 1 : 0,
      updatedAt,
    ],
  );
}

// ---------------------------------------------------------------------------
// Marcadores de artículos (§4.5) — solo en el dispositivo, separados del paquete
// ---------------------------------------------------------------------------

/** Marcador de un artículo tal y como se guarda/lee del dispositivo (datos desnormalizados). */
export interface Marcador {
  articuloId: string;
  normaId: string;
  normaCodigo: string;
  articuloNumero: string;
  articuloTitulo: string | null;
  createdAt: string;
}

interface MarcadorRow {
  articulo_id: string;
  norma_id: string;
  norma_codigo: string;
  articulo_numero: string;
  articulo_titulo: string | null;
  created_at: string;
}

/** Lista los marcadores del dispositivo, el más reciente primero. */
export async function listMarcadores(): Promise<Marcador[]> {
  const db = await openUserDb();
  const rows = await db.getAllAsync<MarcadorRow>(
    'SELECT * FROM marcador_articulo ORDER BY created_at DESC',
  );
  return rows.map((r) => ({
    articuloId: r.articulo_id,
    normaId: r.norma_id,
    normaCodigo: r.norma_codigo,
    articuloNumero: r.articulo_numero,
    articuloTitulo: r.articulo_titulo,
    createdAt: r.created_at,
  }));
}

/** Devuelve el conjunto de ids de artículo marcados (para pintar el estado del icono). */
export async function listMarcadorIds(): Promise<string[]> {
  const db = await openUserDb();
  const rows = await db.getAllAsync<{ articulo_id: string }>(
    'SELECT articulo_id FROM marcador_articulo',
  );
  return rows.map((r) => r.articulo_id);
}

/** Guarda (upsert) un marcador. `createdAt` lo inyecta el llamante para poder testear. */
export async function addMarcador(marcador: Omit<Marcador, 'createdAt'>, createdAt: string): Promise<void> {
  const db = await openUserDb();
  await db.runAsync(
    `INSERT INTO marcador_articulo
       (articulo_id, norma_id, norma_codigo, articulo_numero, articulo_titulo, created_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(articulo_id) DO UPDATE SET
       norma_id = excluded.norma_id,
       norma_codigo = excluded.norma_codigo,
       articulo_numero = excluded.articulo_numero,
       articulo_titulo = excluded.articulo_titulo`,
    [
      marcador.articuloId,
      marcador.normaId,
      marcador.normaCodigo,
      marcador.articuloNumero,
      marcador.articuloTitulo,
      createdAt,
    ],
  );
}

/** Borra un marcador del dispositivo. */
export async function removeMarcador(articuloId: string): Promise<void> {
  const db = await openUserDb();
  await db.runAsync('DELETE FROM marcador_articulo WHERE articulo_id = ?', [articuloId]);
}
