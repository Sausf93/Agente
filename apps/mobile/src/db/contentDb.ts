import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';

/**
 * Acceso al PAQUETE DE CONTENIDO (solo lectura).
 *
 * El contenido normativo llega como un fichero SQLite firmado (Ed25519) por
 * `ContentVersion` y se sustituye de forma ATÓMICA (ver ADR-010 y ESPECIFICACION §7.1):
 *
 *   1. Descarga a `content-<version>.db.tmp` en el directorio de documentos.
 *   2. Verificación de firma sobre los bytes ANTES de instalar. Si falla, se borra.
 *   3. Renombrado atómico a `content.db` (mismo sistema de ficheros) + actualización
 *      del puntero de versión. El fichero anterior se conserva hasta confirmar que el
 *      nuevo abre y consulta bien (rollback).
 *
 * Las tablas FTS5 vienen YA construidas dentro del paquete (el pipeline las crea): la
 * app NO indexa en el dispositivo, para un arranque en frío rápido. Este módulo solo
 * abre en modo lectura y expone consultas tipadas que devuelven tipos de `@agente/shared`.
 *
 * ESTADO: terreno de Fase 0. La descarga/verificación y las consultas reales
 * (buscador FTS5 + ranking) las implementa mobile-dev en la Fase 1.
 */

/** Nombre del fichero instalado del paquete de contenido. */
export const CONTENT_DB_NAME = 'content.db';

let contentDbHandle: SQLiteDatabase | null = null;

/**
 * Abre (una sola vez) el paquete de contenido instalado en modo lectura.
 * Devuelve `null` si aún no hay ningún paquete instalado.
 */
export async function openContentDb(): Promise<SQLiteDatabase | null> {
  if (contentDbHandle) return contentDbHandle;
  // TODO(mobile-dev, Fase 1): comprobar que existe el fichero instalado y su
  // ContentVersion antes de abrir; devolver null si no hay contenido todavía.
  contentDbHandle = await openDatabaseAsync(CONTENT_DB_NAME);
  return contentDbHandle;
}

/** Cierra el manejador (p. ej. antes de un swap atómico de versión). */
export async function closeContentDb(): Promise<void> {
  if (!contentDbHandle) return;
  await contentDbHandle.closeAsync();
  contentDbHandle = null;
}
