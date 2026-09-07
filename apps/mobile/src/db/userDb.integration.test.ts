import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import { USER_DB_MIGRATIONS, USER_DB_SCHEMA_VERSION } from './userMigrations';

/**
 * Test de INTEGRACIÓN de las migraciones de la base LOCAL del usuario (`user.db`) contra un
 * motor SQLite real (`node:sqlite`, el mismo que usa el resto de tests de integración). No abre
 * `expo-sqlite` (no existe fuera del dispositivo): aplica el DDL REAL exportado por `userDb.ts`
 * (`USER_DB_MIGRATIONS`) replicando el bucle de `migrate()`, de modo que se prueba el mismo SQL
 * que corre en el teléfono.
 *
 * Objetivo: blindar el punto de dolor de SPPLB — que una actualización de la app NO pierda datos
 * del usuario (feedback, cuadrante, favoritos, perfil) y que las EXCEPCIONES manuales del
 * cuadrante sobrevivan a reescribir la configuración (cambiar patrón/jornada/franja).
 */

const require = createRequire(import.meta.url);
const { DatabaseSync } = require('node:sqlite') as typeof import('node:sqlite');

type Db = InstanceType<typeof DatabaseSync>;

/** Aplica las migraciones pendientes, igual que `migrate()` en el dispositivo. Idempotente. */
function migrar(db: Db): void {
  const row = db.prepare('PRAGMA user_version').get() as { user_version: number } | undefined;
  const version = row?.user_version ?? 0;
  for (const m of USER_DB_MIGRATIONS) {
    if (version < m.version) {
      db.exec(m.sql);
      db.exec(`PRAGMA user_version = ${m.version};`);
    }
  }
}

function versionDe(db: Db): number {
  return (db.prepare('PRAGMA user_version').get() as { user_version: number }).user_version;
}

function tablas(db: Db): Set<string> {
  const filas = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all() as {
    name: string;
  }[];
  return new Set(filas.map((f) => f.name));
}

const TABLAS_ESPERADAS = [
  'feedback',
  'busqueda_sin_resultado',
  'cuadrante_config',
  'cuadrante_excepcion',
  'perfil',
  'marcador_articulo',
  'documento_campo_recordado',
  'favorito',
  'uso_infraccion',
  'app_flag',
];

describe('migraciones de user.db (idempotencia y no pérdida de datos)', () => {
  it('desde cero crea todas las tablas y fija la versión objetivo', () => {
    const db = new DatabaseSync(':memory:');
    migrar(db);
    expect(versionDe(db)).toBe(USER_DB_SCHEMA_VERSION);
    const t = tablas(db);
    for (const tabla of TABLAS_ESPERADAS) expect(t.has(tabla)).toBe(true);
    db.close();
  });

  it('re-ejecutar las migraciones es IDEMPOTENTE y no toca los datos existentes', () => {
    const db = new DatabaseSync(':memory:');
    migrar(db);

    // Datos de usuario de varias capas.
    db.exec(`
      INSERT INTO feedback (id, created_at, tipo, texto, contexto_json, app_version, platform, enviado)
        VALUES ('fb1', '2026-09-01T10:00:00.000Z', 'sugerencia', 'Estaría bien un buscador por voz', '{}', '0.1.0', 'ios', 0);
      INSERT INTO perfil (id, cuerpo, tema, onboarded, updated_at)
        VALUES (1, 'guardia_civil', 'dark', 1, '2026-09-01T10:00:00.000Z');
      INSERT INTO favorito (infraccion_id, titulo_corto, gravedad, norma_codigo, articulo_numero, importe_eur, created_at)
        VALUES ('inf-movil', 'Uso del móvil', 'grave', 'RGC', '18', 200, '2026-09-01T10:00:00.000Z');
    `);

    // Segunda apertura de la app: migrar de nuevo NO debe fallar ni recrear/borrar nada.
    migrar(db);
    migrar(db);

    expect(versionDe(db)).toBe(USER_DB_SCHEMA_VERSION);
    const fb = db.prepare('SELECT texto FROM feedback WHERE id = ?').get('fb1') as { texto: string };
    expect(fb.texto).toContain('buscador por voz');
    const perfil = db.prepare('SELECT cuerpo, onboarded FROM perfil WHERE id = 1').get() as {
      cuerpo: string;
      onboarded: number;
    };
    expect(perfil.cuerpo).toBe('guardia_civil');
    expect(perfil.onboarded).toBe(1);
    const fav = db.prepare('SELECT COUNT(*) AS n FROM favorito').get() as { n: number };
    expect(fav.n).toBe(1);
    db.close();
  });

  it('migra desde una versión antigua conservando los datos ya guardados', () => {
    const db = new DatabaseSync(':memory:');
    // Simula una instalación vieja: solo hasta la v2 (feedback + búsquedas sin resultado).
    db.exec(USER_DB_MIGRATIONS[0]!.sql);
    db.exec(USER_DB_MIGRATIONS[1]!.sql);
    db.exec('PRAGMA user_version = 2;');
    db.exec(`
      INSERT INTO feedback (id, created_at, tipo, texto, contexto_json, app_version, platform, enviado)
        VALUES ('viejo', '2026-01-01T00:00:00.000Z', 'error_contenido', 'Importe mal en art. 3', '{}', '0.0.9', 'android', 1);
    `);

    // Actualización de la app: se aplican las migraciones 3..7.
    migrar(db);

    expect(versionDe(db)).toBe(USER_DB_SCHEMA_VERSION);
    for (const tabla of TABLAS_ESPERADAS) expect(tablas(db).has(tabla)).toBe(true);
    // El feedback de la versión antigua sigue ahí.
    const fb = db.prepare('SELECT enviado FROM feedback WHERE id = ?').get('viejo') as {
      enviado: number;
    };
    expect(fb.enviado).toBe(1);
    db.close();
  });
});

describe('cuadrante: las excepciones manuales son SAGRADAS (el fallo de SPPLB)', () => {
  it('reescribir la config (cambiar patrón/jornada) NO borra las excepciones', () => {
    const db = new DatabaseSync(':memory:');
    migrar(db);

    // Config inicial + tres ediciones manuales del agente (excepciones).
    db.exec(`
      INSERT INTO cuadrante_config
        (id, patron_json, inicio_ciclo, jornada_ref_h, computo_anual_ref_h, franja_inicio, franja_fin, festivos_extra_json, updated_at)
        VALUES (1, '{"nombre":"6+S+3"}', '2026-09-01', 37.5, NULL, '22:00', '06:00', '[]', '2026-09-01T10:00:00.000Z');
      INSERT INTO cuadrante_excepcion (fecha, servicio, hora_inicio, hora_fin, nota, alarma_min, editado_el)
        VALUES ('2026-09-05', 'libre', NULL, NULL, 'Cambio con compañero', NULL, '2026-09-01T10:00:00.000Z');
      INSERT INTO cuadrante_excepcion (fecha, servicio, hora_inicio, hora_fin, nota, alarma_min, editado_el)
        VALUES ('2026-09-12', 'vacaciones', NULL, NULL, NULL, NULL, '2026-09-01T10:00:00.000Z');
      INSERT INTO cuadrante_excepcion (fecha, servicio, hora_inicio, hora_fin, nota, alarma_min, editado_el)
        VALUES ('2026-09-20', 'servicio_extra', '09:00', '15:00', 'Refuerzo fiestas', 30, '2026-09-01T10:00:00.000Z');
    `);

    // UPSERT de la config (espejo de `saveCuadranteConfig`): cambia patrón, jornada y franja.
    // La clave del diseño de dos capas: toca SOLO la fila de config, jamás las excepciones.
    db.prepare(
      `INSERT INTO cuadrante_config
         (id, patron_json, inicio_ciclo, jornada_ref_h, computo_anual_ref_h, franja_inicio, franja_fin, festivos_extra_json, updated_at)
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
    ).run('{"nombre":"7x7"}', '2026-09-01', 40, 1642, '23:00', '07:00', '[]', '2026-09-02T09:00:00.000Z');

    // La config cambió...
    const config = db.prepare('SELECT jornada_ref_h, franja_inicio FROM cuadrante_config WHERE id = 1').get() as {
      jornada_ref_h: number;
      franja_inicio: string;
    };
    expect(config.jornada_ref_h).toBe(40);
    expect(config.franja_inicio).toBe('23:00');

    // ...pero las TRES excepciones manuales siguen intactas.
    const exc = db.prepare('SELECT COUNT(*) AS n FROM cuadrante_excepcion').get() as { n: number };
    expect(exc.n).toBe(3);
    const extra = db
      .prepare('SELECT servicio, hora_inicio, nota FROM cuadrante_excepcion WHERE fecha = ?')
      .get('2026-09-20') as { servicio: string; hora_inicio: string; nota: string };
    expect(extra.servicio).toBe('servicio_extra');
    expect(extra.hora_inicio).toBe('09:00');
    expect(extra.nota).toBe('Refuerzo fiestas');
    db.close();
  });

  it('borrar una excepción no afecta a las demás ni a la config', () => {
    const db = new DatabaseSync(':memory:');
    migrar(db);
    db.exec(`
      INSERT INTO cuadrante_config
        (id, patron_json, inicio_ciclo, jornada_ref_h, computo_anual_ref_h, franja_inicio, franja_fin, festivos_extra_json, updated_at)
        VALUES (1, '{}', '2026-09-01', 37.5, NULL, '22:00', '06:00', '[]', '2026-09-01T10:00:00.000Z');
      INSERT INTO cuadrante_excepcion (fecha, servicio, editado_el)
        VALUES ('2026-09-05', 'libre', '2026-09-01T10:00:00.000Z');
      INSERT INTO cuadrante_excepcion (fecha, servicio, editado_el)
        VALUES ('2026-09-06', 'vacaciones', '2026-09-01T10:00:00.000Z');
    `);
    db.prepare('DELETE FROM cuadrante_excepcion WHERE fecha = ?').run('2026-09-05');
    const restantes = db.prepare('SELECT fecha FROM cuadrante_excepcion').all() as { fecha: string }[];
    expect(restantes.map((r) => r.fecha)).toEqual(['2026-09-06']);
    const config = db.prepare('SELECT COUNT(*) AS n FROM cuadrante_config').get() as { n: number };
    expect(config.n).toBe(1);
    db.close();
  });
});
