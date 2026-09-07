import { Platform } from 'react-native';
import { Asset } from 'expo-asset';
import { Directory, File } from 'expo-file-system';
import { defaultDatabaseDirectory, openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';
import { fromSQLiteDatabase, type SqlRunner } from './sqlRunner';
// El paquete de contenido viaja EMPAQUETADO como asset de la app (Fase 1, sin CDN todavía).
// Se distribuye con extensión `.db` porque Metro ya la trata como asset por defecto.
import contentDbAsset from '../../assets/content/contenido-0.1.0.db';

/**
 * Acceso al PAQUETE DE CONTENIDO (solo lectura).
 *
 * El contenido normativo llega como un fichero SQLite firmado (Ed25519) por
 * `ContentVersion` y se sustituye de forma ATÓMICA (ver ADR-010 y ESPECIFICACION §7.1).
 * En Fase 1 aún no hay CDN: el paquete viaja EMPAQUETADO como asset de la app para poder
 * probar el buscador y la ficha sobre datos REALES. La descarga/verificación de firma y el
 * swap atómico desde red llegan en una fase posterior; el contrato de consulta ya es el bueno.
 *
 * Instalación (una vez por versión de contenido):
 *   1. `expo-asset` resuelve el asset empaquetado y lo deja en caché local.
 *   2. Se copia al directorio de bases de datos de `expo-sqlite` como `content.db`, junto a un
 *      marcador de versión. Si la versión empaquetada cambia (nueva build de la app), se
 *      reemplaza; si no, se reutiliza el ya instalado (arranque en frío rápido).
 *   3. Se abre en modo lectura y se fija `PRAGMA query_only = ON` (el paquete no se escribe).
 *
 * Las tablas FTS5 vienen YA construidas dentro del paquete (el pipeline las crea): la app NO
 * indexa en el dispositivo. Este módulo solo abre y expone un `SqlRunner` para las consultas.
 */

/** Nombre del fichero instalado del paquete de contenido. */
export const CONTENT_DB_NAME = 'content.db';

/** Marcador con la versión de contenido ya instalada (para decidir si hay que reemplazar). */
const CONTENT_VERSION_MARKER = 'content.version';

/**
 * Versión de contenido EMPAQUETADA con esta build de la app. Debe coincidir con el nombre del
 * asset importado arriba. Para regenerar el paquete, ver `apps/mobile/src/features/buscador/README.md`.
 */
export const BUNDLED_CONTENT_VERSION = '0.1.0';

let contentDbHandle: SQLiteDatabase | null = null;
let contentRunner: SqlRunner | null = null;
let installPromise: Promise<boolean> | null = null;

/**
 * Copia el paquete empaquetado al directorio de bases de datos de `expo-sqlite`, si aún no está
 * instalado o si la versión cambió. Devuelve `false` en web (expo-sqlite no soporta abrir un
 * paquete de asset en web en Fase 1). Idempotente y protegido contra llamadas concurrentes.
 */
function ensureContentInstalled(): Promise<boolean> {
  if (installPromise) return installPromise;
  installPromise = (async () => {
    // Web: el buscador sobre el paquete SQLite no está soportado en Fase 1 (ver README).
    if (Platform.OS === 'web') return false;

    const asset = Asset.fromModule(contentDbAsset);
    if (!asset.downloaded) await asset.downloadAsync();
    const localUri = asset.localUri ?? asset.uri;
    if (!localUri) return false;

    const dir = new Directory(defaultDatabaseDirectory as string);
    if (!dir.exists) dir.create({ intermediates: true });

    const target = new File(dir, CONTENT_DB_NAME);
    const marker = new File(dir, CONTENT_VERSION_MARKER);
    const instalada = marker.exists ? marker.textSync().trim() : null;

    // Firma de instalación = versión + HASH del asset. El hash cambia SIEMPRE que cambia el
    // contenido del `.db`, aunque no subamos el número de versión (durante la beta el contenido
    // crece bajo la misma 0.1.0). Así el paquete del dispositivo se reemplaza cuando de verdad
    // cambió el contenido, y no se queda con uno viejo (bug: "no salen los robos/hurto").
    const firma = `${BUNDLED_CONTENT_VERSION}:${asset.hash ?? 'sin-hash'}`;

    if (!target.exists || instalada !== firma) {
      if (target.exists) target.delete();
      new File(localUri).copy(target);
      if (marker.exists) marker.delete();
      marker.create();
      marker.write(firma);
    }
    return true;
  })();
  return installPromise;
}

/**
 * Abre (una sola vez) el paquete de contenido instalado en modo lectura.
 * Devuelve `null` si no hay paquete disponible en la plataforma (p. ej. web en Fase 1).
 */
export async function openContentDb(): Promise<SQLiteDatabase | null> {
  if (contentDbHandle) return contentDbHandle;
  const instalado = await ensureContentInstalled();
  if (!instalado) return null;
  const db = await openDatabaseAsync(CONTENT_DB_NAME);
  // El paquete es de SOLO LECTURA: cualquier intento de escritura debe fallar.
  await db.execAsync('PRAGMA query_only = ON;');
  contentDbHandle = db;
  return db;
}

/**
 * Devuelve un `SqlRunner` sobre el paquete de contenido (o `null` si no hay paquete).
 * Es lo que consumen el buscador y la ficha; ninguno depende de `expo-sqlite` directamente.
 */
export async function getContentRunner(): Promise<SqlRunner | null> {
  if (contentRunner) return contentRunner;
  const db = await openContentDb();
  if (!db) return null;
  contentRunner = fromSQLiteDatabase(db);
  return contentRunner;
}

/** Cierra el manejador (p. ej. antes de un swap atómico de versión). */
export async function closeContentDb(): Promise<void> {
  if (!contentDbHandle) return;
  await contentDbHandle.closeAsync();
  contentDbHandle = null;
  contentRunner = null;
}
