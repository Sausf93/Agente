/**
 * DDL de las migraciones de la base LOCAL del usuario (`user.db`).
 *
 * Vive en un módulo APARTE, SIN dependencias de runtime (ni `expo-sqlite` ni alias `@/`), para
 * ser la FUENTE ÚNICA del esquema y poder probarlo con `node:sqlite` fuera del dispositivo
 * (ver `userDb.integration.test.ts`). `userDb.ts` lo consume para migrar en el teléfono.
 *
 * REGLA (ADR-010): cada migración solo AÑADE tablas/índices (`IF NOT EXISTS`); nunca borra ni
 * recrea datos existentes. Los datos del usuario deben sobrevivir a cualquier actualización.
 */

/** Una migración de esquema: la versión a la que lleva y su DDL (sin el `PRAGMA user_version`). */
export interface UserDbMigration {
  version: number;
  sql: string;
}

/** Migraciones en ORDEN e idempotentes. Fuente única del DDL de `user.db`. */
export const USER_DB_MIGRATIONS: readonly UserDbMigration[] = [
  {
    version: 1,
    sql: `
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
    `,
  },
  {
    // Búsquedas SIN RESULTADO: base para ampliar el diccionario de sinónimos (§4.3). Es una
    // señal AGREGADA por término normalizado (sin datos personales) que vive SOLO en el
    // dispositivo; nunca viaja a un servidor (ADR-001). `veces` cuenta las repeticiones.
    version: 2,
    sql: `
      CREATE TABLE IF NOT EXISTS busqueda_sin_resultado (
        termino_normalizado TEXT PRIMARY KEY NOT NULL,
        veces INTEGER NOT NULL DEFAULT 1,
        ultima_fecha TEXT NOT NULL
      );
    `,
  },
  {
    // CUADRANTE en DOS CAPAS separadas (perspectivas §8, ADR-010): la config (patrón,
    // inicio de ciclo, jornada, franja, festivos) en una única fila; y las EXCEPCIONES
    // manuales, una fila por fecha. Editar un día toca SOLO su fila y cambiar el patrón
    // NUNCA borra las excepciones → no se pierde el trabajo del agente (el fallo de SPPLB).
    version: 3,
    sql: `
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
    `,
  },
  {
    // PERFIL LOCAL del agente (cuerpo, territorio y preferencia de tema), fijado en el
    // onboarding y editable en Ajustes. Una única fila. Vive SOLO en el dispositivo (ADR-001,
    // local-first, sin login): nada de esto viaja a un servidor. `onboarded` marca que el
    // onboarding se completó (gate de primera apertura).
    version: 4,
    sql: `
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
    `,
  },
  {
    // MARCADORES de artículos (§4.5): el agente guarda un artículo del articulado para volver a
    // él. Local-first (ADR-001): viven SOLO en el dispositivo, separados del paquete de contenido
    // (ADR-010, punto 4). Se DESNORMALIZAN el código de norma, el número y el título del artículo
    // para poder pintar "mis marcadores" sin abrir el paquete y para que el marcador sobreviva a
    // un cambio de versión de contenido (aunque el id de artículo cambie de forma).
    version: 5,
    sql: `
      CREATE TABLE IF NOT EXISTS marcador_articulo (
        articulo_id TEXT PRIMARY KEY NOT NULL,
        norma_id TEXT NOT NULL,
        norma_codigo TEXT NOT NULL,
        articulo_numero TEXT NOT NULL,
        articulo_titulo TEXT,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_marcador_created_at ON marcador_articulo (created_at DESC);
    `,
  },
  {
    // DOCUMENTOS (§4.8): valores RECORDADOS de campos DEL AGENTE entre documentos (p. ej. su
    // unidad), para no reescribir lo mismo cada vez. Local-first (ADR-001) y separado del paquete.
    // REGLA CRÍTICA: aquí NUNCA se guardan datos de terceros (matrículas, nombres, DNI): la capa
    // de documentos solo persiste campos con `esDatoTercero = false`. El PDF tampoco se guarda.
    version: 6,
    sql: `
      CREATE TABLE IF NOT EXISTS documento_campo_recordado (
        clave TEXT PRIMARY KEY NOT NULL,
        valor TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `,
  },
  {
    // INICIO (§4.2): FAVORITOS, "TUS MÁS USADAS" y marca de NOVEDADES vistas. Todo local-first
    // (ADR-001) y ANÓNIMO (§6.2: sin usuario_id ni identificador de dispositivo), separado del
    // paquete de contenido (ADR-010, punto 4). Nunca sale del teléfono.
    //
    //  - `favorito`: infracciones que el agente marca en la ficha (§4.4). Datos DESNORMALIZADOS
    //    (título, gravedad, norma…) para pintar "tus favoritas" sin abrir el paquete y para que
    //    el favorito SOBREVIVA a un cambio de versión de contenido.
    //  - `uso_infraccion`: contador local por infracción (consultas de ficha + copias de boletín)
    //    para "tus más usadas". El agregado "más usadas EN TU CUERPO" (entre usuarios) es de
    //    servidor (§6.2) y queda para cuando exista backend.
    //  - `app_flag`: clave/valor de banderas locales de la app (p. ej. "novedades vistas hasta").
    version: 7,
    sql: `
      CREATE TABLE IF NOT EXISTS favorito (
        infraccion_id TEXT PRIMARY KEY NOT NULL,
        titulo_corto TEXT NOT NULL,
        gravedad TEXT NOT NULL,
        norma_codigo TEXT NOT NULL,
        articulo_numero TEXT NOT NULL,
        importe_eur REAL,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_favorito_created_at ON favorito (created_at DESC);
      CREATE TABLE IF NOT EXISTS uso_infraccion (
        infraccion_id TEXT PRIMARY KEY NOT NULL,
        titulo_corto TEXT NOT NULL,
        gravedad TEXT NOT NULL,
        norma_codigo TEXT NOT NULL,
        articulo_numero TEXT NOT NULL,
        importe_eur REAL,
        consultas INTEGER NOT NULL DEFAULT 0,
        copias INTEGER NOT NULL DEFAULT 0,
        ultima_fecha TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS app_flag (
        clave TEXT PRIMARY KEY NOT NULL,
        valor TEXT NOT NULL
      );
    `,
  },
  {
    // ANCLA del cuadrante (rediseño del arranque, docs/diseno/cuadrante-rediseno.md §1.3): el
    // dato REAL con el que el agente configura el ciclo ("el {fecha} hago {servicio}"), del que
    // se DERIVA `inicio_ciclo`. Se guarda para recomputar el desfase si cambia de patrón sin
    // volver a preguntar. Migración ADITIVA: columna nueva NULL en la fila de config existente;
    // los cuadrantes previos siguen funcionando (ya tienen `inicio_ciclo`). Solo se ejecuta una
    // vez (protegida por `user_version`), así que ADD COLUMN es seguro.
    version: 8,
    sql: `
      ALTER TABLE cuadrante_config ADD COLUMN ancla_json TEXT;
    `,
  },
  {
    // FEEDBACK con ESTADO y RESPUESTA (petición del socio: que las sugerencias queden
    // REGISTRADAS en la app con un estado, no que se pierdan en un correo). Migración ADITIVA
    // sobre la tabla `feedback` de la v1:
    //  - `estado`: ciclo de vida de la aportación (enviada → en_estudio → aplicada/descartada).
    //    NOT NULL con DEFAULT constante 'enviada', así las filas antiguas quedan como 'enviada'.
    //  - `respuesta`: texto del equipo que el socio ve en "Mis sugerencias" (NULL mientras no
    //    haya backend). HOY el estado se gestiona SOLO en el dispositivo (ADR-001); el cambio de
    //    estado remoto y la respuesta bidireccional llegarán con Supabase (Fase 5, ver ADR-011).
    // Solo se ejecuta una vez (protegida por `user_version`): ADD COLUMN es seguro y no borra nada.
    version: 9,
    sql: `
      ALTER TABLE feedback ADD COLUMN estado TEXT NOT NULL DEFAULT 'enviada';
      ALTER TABLE feedback ADD COLUMN respuesta TEXT;
    `,
  },
];

/** Versión de esquema objetivo de la base local (la mayor de las migraciones). */
export const USER_DB_SCHEMA_VERSION =
  USER_DB_MIGRATIONS[USER_DB_MIGRATIONS.length - 1]!.version;
