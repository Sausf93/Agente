import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';
import type { Cuadrante, Cuerpo, DiaCuadrante, Feedback, Gravedad, PoliciaAutonomica } from '@agente/shared';
import type { InfraccionSnapshot, UsoInfraccion } from '@/features/inicio/masUsadas';
import { feedbackToRow, rowToFeedback, type FeedbackRow } from '@/features/feedback/serialize';
import {
  configToRow,
  ensamblarCuadrante,
  excepcionToRow,
  type CuadranteConfigRow,
  type CuadranteExcepcionRow,
} from '@/features/cuadrante/serialize';
import { USER_DB_MIGRATIONS } from '@/db/userMigrations';

// Reexporta el contrato de migraciones para quien orquesta la base (y los tests de integración).
export { USER_DB_MIGRATIONS, USER_DB_SCHEMA_VERSION, type UserDbMigration } from '@/db/userMigrations';

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

/**
 * Migraciones idempotentes por versión de esquema. El DDL vive en `userMigrations.ts` (fuente
 * única, sin dependencias de runtime, testeable con `node:sqlite`). Aquí solo se aplica en orden
 * lo que falta y se avanza `PRAGMA user_version`. Solo añade tablas: nunca borra datos del usuario.
 */
async function migrate(db: SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const version = row?.user_version ?? 0;
  for (const migracion of USER_DB_MIGRATIONS) {
    if (version < migracion.version) {
      await db.execAsync(migracion.sql);
      // La versión es una constante numérica del propio código (no entrada de usuario): segura.
      await db.execAsync(`PRAGMA user_version = ${migracion.version};`);
    }
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
        franja_inicio, franja_fin, festivos_extra_json, ancla_json, updated_at)
     VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       patron_json = excluded.patron_json,
       inicio_ciclo = excluded.inicio_ciclo,
       jornada_ref_h = excluded.jornada_ref_h,
       computo_anual_ref_h = excluded.computo_anual_ref_h,
       franja_inicio = excluded.franja_inicio,
       franja_fin = excluded.franja_fin,
       festivos_extra_json = excluded.festivos_extra_json,
       ancla_json = excluded.ancla_json,
       updated_at = excluded.updated_at`,
    [
      row.patron_json,
      row.inicio_ciclo,
      row.jornada_ref_h,
      row.computo_anual_ref_h,
      row.franja_inicio,
      row.franja_fin,
      row.festivos_extra_json,
      row.ancla_json,
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

// ---------------------------------------------------------------------------
// Documentos (§4.8) — valores recordados de campos DEL AGENTE (nunca de terceros)
// ---------------------------------------------------------------------------

/**
 * Devuelve los valores recordados de campos del agente (p. ej. `unidad`), para prerrellenar el
 * formulario de un documento. Nunca contiene datos de terceros: la capa de documentos solo
 * llama a `rememberFields` con campos `esDatoTercero = false`.
 */
export async function getRememberedFields(): Promise<Record<string, string>> {
  const db = await openUserDb();
  const rows = await db.getAllAsync<{ clave: string; valor: string }>(
    'SELECT clave, valor FROM documento_campo_recordado',
  );
  const out: Record<string, string> = {};
  for (const r of rows) out[r.clave] = r.valor;
  return out;
}

/**
 * Recuerda (upsert) valores de campos del agente. Los valores vacíos se ignoran; no se borra lo
 * ya recordado si el agente deja el campo en blanco esta vez. `updatedAt` lo inyecta el llamante.
 *
 * PRECONDICIÓN de privacidad: el llamante DEBE filtrar y pasar solo campos que no sean datos de
 * terceros. Esta función no valida el origen; la garantía vive en la capa de documentos.
 */
export async function rememberFields(
  values: Record<string, string>,
  updatedAt: string,
): Promise<void> {
  const entradas = Object.entries(values).filter(([, v]) => v.trim().length > 0);
  if (entradas.length === 0) return;
  const db = await openUserDb();
  for (const [clave, valor] of entradas) {
    await db.runAsync(
      `INSERT INTO documento_campo_recordado (clave, valor, updated_at)
         VALUES (?, ?, ?)
       ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor, updated_at = excluded.updated_at`,
      [clave, valor.trim(), updatedAt],
    );
  }
}

// ---------------------------------------------------------------------------
// Favoritos (§4.4 acción "Favorito") — solo en el dispositivo, desnormalizados
// ---------------------------------------------------------------------------

/** Favorito tal y como se guarda/lee (snapshot desnormalizado + fecha de alta). */
export interface Favorito extends InfraccionSnapshot {
  createdAt: string;
}

interface SnapshotRow {
  infraccion_id: string;
  titulo_corto: string;
  gravedad: string;
  norma_codigo: string;
  articulo_numero: string;
  importe_eur: number | null;
}

function rowToSnapshot(r: SnapshotRow): InfraccionSnapshot {
  return {
    infraccionId: r.infraccion_id,
    tituloCorto: r.titulo_corto,
    gravedad: r.gravedad as Gravedad,
    normaCodigo: r.norma_codigo,
    articuloNumero: r.articulo_numero,
    importeEur: r.importe_eur,
  };
}

/** Lista los favoritos del dispositivo, el más reciente primero. */
export async function listFavoritos(): Promise<Favorito[]> {
  const db = await openUserDb();
  const rows = await db.getAllAsync<SnapshotRow & { created_at: string }>(
    'SELECT * FROM favorito ORDER BY created_at DESC',
  );
  return rows.map((r) => ({ ...rowToSnapshot(r), createdAt: r.created_at }));
}

/** Conjunto de ids de infracción marcados como favoritos (para pintar el estado del icono). */
export async function listFavoritoIds(): Promise<string[]> {
  const db = await openUserDb();
  const rows = await db.getAllAsync<{ infraccion_id: string }>('SELECT infraccion_id FROM favorito');
  return rows.map((r) => r.infraccion_id);
}

/** Guarda (upsert) un favorito. `createdAt` lo inyecta el llamante para poder testear. */
export async function addFavorito(snap: InfraccionSnapshot, createdAt: string): Promise<void> {
  const db = await openUserDb();
  await db.runAsync(
    `INSERT INTO favorito
       (infraccion_id, titulo_corto, gravedad, norma_codigo, articulo_numero, importe_eur, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(infraccion_id) DO UPDATE SET
       titulo_corto = excluded.titulo_corto,
       gravedad = excluded.gravedad,
       norma_codigo = excluded.norma_codigo,
       articulo_numero = excluded.articulo_numero,
       importe_eur = excluded.importe_eur`,
    [
      snap.infraccionId,
      snap.tituloCorto,
      snap.gravedad,
      snap.normaCodigo,
      snap.articuloNumero,
      snap.importeEur,
      createdAt,
    ],
  );
}

/** Quita un favorito del dispositivo. */
export async function removeFavorito(infraccionId: string): Promise<void> {
  const db = await openUserDb();
  await db.runAsync('DELETE FROM favorito WHERE infraccion_id = ?', [infraccionId]);
}

// ---------------------------------------------------------------------------
// "Tus más usadas" (§4.2 / §6.2) — contador local ANÓNIMO por infracción
// ---------------------------------------------------------------------------

/** Registra un uso de una infracción: consulta de ficha o copia de boletín. Anónimo y local. */
export async function recordUso(
  snap: InfraccionSnapshot,
  tipo: 'consulta' | 'copia',
  fecha: string,
): Promise<void> {
  const db = await openUserDb();
  const consultas = tipo === 'consulta' ? 1 : 0;
  const copias = tipo === 'copia' ? 1 : 0;
  await db.runAsync(
    `INSERT INTO uso_infraccion
       (infraccion_id, titulo_corto, gravedad, norma_codigo, articulo_numero, importe_eur,
        consultas, copias, ultima_fecha)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(infraccion_id) DO UPDATE SET
       titulo_corto = excluded.titulo_corto,
       gravedad = excluded.gravedad,
       norma_codigo = excluded.norma_codigo,
       articulo_numero = excluded.articulo_numero,
       importe_eur = excluded.importe_eur,
       consultas = consultas + excluded.consultas,
       copias = copias + excluded.copias,
       ultima_fecha = excluded.ultima_fecha`,
    [
      snap.infraccionId,
      snap.tituloCorto,
      snap.gravedad,
      snap.normaCodigo,
      snap.articuloNumero,
      snap.importeEur,
      consultas,
      copias,
      fecha,
    ],
  );
}

/** Lee todos los contadores de uso (el ranking se calcula aparte, en `masUsadas.ts`, puro). */
export async function listUsos(): Promise<UsoInfraccion[]> {
  const db = await openUserDb();
  const rows = await db.getAllAsync<
    SnapshotRow & { consultas: number; copias: number; ultima_fecha: string }
  >('SELECT * FROM uso_infraccion');
  return rows.map((r) => ({
    ...rowToSnapshot(r),
    consultas: r.consultas,
    copias: r.copias,
    ultimaFecha: r.ultima_fecha,
  }));
}

// ---------------------------------------------------------------------------
// Banderas locales de la app (clave/valor) — p. ej. "novedades vistas hasta"
// ---------------------------------------------------------------------------

/** Clave de bandera: hasta qué fecha ISO se han visto las novedades (§4.13). */
export const FLAG_NOVEDADES_VISTAS_HASTA = 'novedades_vistas_hasta';

/** Lee una bandera local, o `null` si no existe. */
export async function getAppFlag(clave: string): Promise<string | null> {
  const db = await openUserDb();
  const row = await db.getFirstAsync<{ valor: string }>(
    'SELECT valor FROM app_flag WHERE clave = ?',
    [clave],
  );
  return row?.valor ?? null;
}

/** Guarda (upsert) una bandera local. */
export async function setAppFlag(clave: string, valor: string): Promise<void> {
  const db = await openUserDb();
  await db.runAsync(
    `INSERT INTO app_flag (clave, valor) VALUES (?, ?)
     ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor`,
    [clave, valor],
  );
}
