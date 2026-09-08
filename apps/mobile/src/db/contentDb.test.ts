import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * ROBUSTEZ DE PRIMER ARRANQUE (bloqueante para la beta): si falla la instalación/apertura del
 * paquete de contenido (p. ej. no se puede copiar el asset o crear el directorio en el primer
 * arranque), `getContentRunner()` debe resolver a `null` —NO rechazar—, para que ficha, normas y
 * sustancias caigan a su estado "sin contenido / no encontrada" en lugar de quedarse cargando.
 *
 * Además comprueba que un fallo NO deja una promesa RECHAZADA cacheada en el módulo: una segunda
 * llamada debe REINTENTAR la instalación (y volver a intentar copiar el asset).
 */

// El spy de `copy` se declara con `vi.hoisted` para poder referenciarlo dentro de las factorías de
// `vi.mock` (que vitest eleva por encima de los imports).
const { mockCopy } = vi.hoisted(() => ({ mockCopy: vi.fn() }));

// `expo-sqlite` es un módulo nativo: en Node se sustituye por un doble mínimo.
vi.mock('expo-sqlite', () => ({
  defaultDatabaseDirectory: '/mock/databases',
  openDatabaseAsync: vi.fn(async () => ({
    execAsync: vi.fn(async () => {}),
    getAllAsync: vi.fn(async () => []),
    getFirstAsync: vi.fn(async () => null),
    closeAsync: vi.fn(async () => {}),
  })),
}));

// La plataforma NO es web (en web `ensureContentInstalled` devuelve false por diseño).
vi.mock('react-native', () => ({ Platform: { OS: 'ios' } }));

// El asset del paquete resuelve, pero la COPIA al directorio de bases fallará (ver `File.copy`).
vi.mock('expo-asset', () => ({
  Asset: {
    fromModule: () => ({
      downloaded: true,
      localUri: 'file:///mock/cache/contenido-0.1.0.db',
      uri: 'file:///mock/cache/contenido-0.1.0.db',
      hash: 'deadbeef',
      downloadAsync: vi.fn(async () => {}),
    }),
  },
}));

vi.mock('expo-file-system', () => {
  class Directory {
    exists = true;
    create(): void {}
  }
  class File {
    exists = false;
    constructor(..._args: unknown[]) {}
    textSync(): string {
      return '';
    }
    delete(): void {}
    create(): void {}
    write(): void {}
    copy(): void {
      // Simula un fallo real de instalación en el primer arranque (p. ej. disco lleno / permisos).
      mockCopy();
      throw new Error('EACCES: no se pudo copiar el paquete de contenido');
    }
  }
  return { Directory, File };
});

// El paquete `.db` viaja como asset importado; en Node se sustituye por un módulo trivial.
vi.mock('../../assets/content/contenido-0.1.0.db', () => ({ default: 1 }));

import { getContentRunner } from './contentDb';

describe('contentDb · getContentRunner (robustez de instalación)', () => {
  beforeEach(() => {
    mockCopy.mockClear();
  });

  it('si copiar el asset LANZA, getContentRunner resuelve a null (no rechaza)', async () => {
    await expect(getContentRunner()).resolves.toBeNull();
    expect(mockCopy).toHaveBeenCalledTimes(1);
  });

  it('no cachea una promesa RECHAZADA: una segunda llamada REINTENTA la instalación', async () => {
    // Primer intento: falla y devuelve null.
    await expect(getContentRunner()).resolves.toBeNull();
    // Segundo intento: si el caché hubiera quedado con una promesa rechazada, no volvería a copiar.
    await expect(getContentRunner()).resolves.toBeNull();
    // La copia se intentó de nuevo → el caché de instalación se reseteó tras el fallo.
    expect(mockCopy).toHaveBeenCalledTimes(2);
  });
});
