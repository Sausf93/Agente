import { createHash } from 'node:crypto';

/**
 * Manifiesto (`ContentVersion`) y FIRMA del paquete de contenido (sección 7.4 y 8.2).
 *
 * El paquete `.sqlite` viaja acompañado de un manifiesto JSON con: versión (semver), fecha,
 * hash de integridad del fichero y firma. La app verifica la firma sobre los BYTES antes de
 * instalar y sustituye de forma atómica (ADR-010, punto 5).
 *
 * La firma Ed25519 queda como STUB documentado hasta que existan las claves: se deja el hueco
 * (`firmarPaquete`) y el manifiesto marca `firma: null` + `algoritmo`. NADA en el pipeline
 * debe asumir que un paquete sin firma es instalable en producción: es responsabilidad del
 * publicador firmar antes de subir al CDN.
 */

export interface ManifiestoPaquete {
  /** Semver de la versión de CONTENIDO (no del esquema). */
  version: string;
  /** Fecha de publicación, ISO 8601 con offset. */
  fecha: string;
  /** Versión del esquema del paquete (para el acoplamiento app↔contenido, ADR-010). */
  schemaVersion: number;
  /** SHA-256 en hex de los bytes del fichero `.sqlite`. */
  hash: string;
  /** Tamaño del fichero en bytes. */
  tamanoBytes: number;
  /** Algoritmo de firma previsto. */
  algoritmoFirma: 'ed25519';
  /** Firma en base64 de los bytes, o `null` si aún no hay clave (stub). */
  firma: string | null;
  /** Resumen de cambios de esta versión. */
  changelog: Record<string, unknown>;
}

/** SHA-256 en hex de un buffer de bytes (integridad del paquete). */
export function hashPaquete(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}

/**
 * STUB de firma Ed25519. Cuando exista la clave privada del publicador, aquí se firmará el
 * hash (o los bytes) y se devolverá la firma en base64. De momento devuelve `null` y deja
 * constancia de que el paquete NO está firmado.
 *
 * @param _hashHex hash del paquete que se firmaría.
 * @param _clavePrivada clave privada Ed25519 (PEM/base64). Ausente en Fase 1.
 */
export function firmarPaquete(_hashHex: string, _clavePrivada?: string): string | null {
  // TODO(Fase de lanzamiento): firmar con crypto.sign(null, Buffer.from(hashHex,'hex'), key).
  return null;
}

/** Construye el manifiesto a partir de los bytes del paquete y los metadatos de versión. */
export function construirManifiesto(
  bytes: Uint8Array,
  opciones: {
    version: string;
    fecha: string;
    schemaVersion: number;
    changelog?: Record<string, unknown>;
    clavePrivada?: string;
  },
): ManifiestoPaquete {
  const hash = hashPaquete(bytes);
  return {
    version: opciones.version,
    fecha: opciones.fecha,
    schemaVersion: opciones.schemaVersion,
    hash,
    tamanoBytes: bytes.byteLength,
    algoritmoFirma: 'ed25519',
    firma: firmarPaquete(hash, opciones.clavePrivada),
    changelog: opciones.changelog ?? {},
  };
}
