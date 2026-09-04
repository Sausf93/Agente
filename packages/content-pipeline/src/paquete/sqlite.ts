import { createRequire } from 'node:module';
import type { DatabaseSync as DatabaseSyncType, StatementSync as StatementSyncType } from 'node:sqlite';

/**
 * Puente a `node:sqlite` (builtin de Node ≥ 22.5, con FTS5 incluido).
 *
 * Se carga con `createRequire` en vez de `import ... from 'node:sqlite'` porque Vite/Vitest
 * (vite-node) todavía no reconoce este builtin y, al transformar el módulo, le quita el
 * prefijo `node:` e intenta resolver un paquete `sqlite` inexistente. Cargándolo por `require`
 * nativo se evita esa transformación y funciona igual en `tsx`, en Node y en los tests.
 */
const require = createRequire(import.meta.url);
const sqlite = require('node:sqlite') as typeof import('node:sqlite');

export const DatabaseSync = sqlite.DatabaseSync;
export type DatabaseSync = DatabaseSyncType;
export type StatementSync = StatementSyncType;
