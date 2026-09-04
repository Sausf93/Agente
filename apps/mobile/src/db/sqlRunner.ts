import type { SQLiteBindValue, SQLiteDatabase } from 'expo-sqlite';

/** Valores admitidos como parámetros de una consulta (los que usa el paquete de contenido). */
export type SqlBindValue = SQLiteBindValue;

/**
 * Interfaz MÍNIMA de ejecución de SQL, agnóstica del motor.
 *
 * El buscador (`features/buscador/search.ts`) y la ficha (`features/ficha/ficha.ts`)
 * dependen SOLO de esta interfaz, no de `expo-sqlite`. Así el MISMO SQL corre:
 *  - en el dispositivo, sobre `expo-sqlite` (adaptador `fromSQLiteDatabase`);
 *  - en los tests de integración, sobre `node:sqlite` (adaptador propio del test),
 *    contra el `.sqlite` REAL que genera el pipeline.
 *
 * Es la costura que permite validar las consultas sin necesidad de un dispositivo.
 */
export interface SqlRunner {
  getAll<T = Record<string, unknown>>(sql: string, params?: readonly SqlBindValue[]): Promise<T[]>;
  getFirst<T = Record<string, unknown>>(
    sql: string,
    params?: readonly SqlBindValue[],
  ): Promise<T | null>;
}

/** Envuelve una base `expo-sqlite` como `SqlRunner` (solo lectura por convención). */
export function fromSQLiteDatabase(db: SQLiteDatabase): SqlRunner {
  return {
    getAll: <T = Record<string, unknown>>(sql: string, params: readonly SqlBindValue[] = []) =>
      db.getAllAsync<T>(sql, [...params]),
    getFirst: <T = Record<string, unknown>>(sql: string, params: readonly SqlBindValue[] = []) =>
      db.getFirstAsync<T>(sql, [...params]),
  };
}
