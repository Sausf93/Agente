import { ESQUEMA_PAQUETE_VERSION, FTS_TOKENIZER } from '@agente/shared';

/**
 * DDL del PAQUETE DE CONTENIDO SQLite (solo lectura en el dispositivo).
 *
 * Contrato compartido con `apps/mobile` (ver `CONTENT-PACKAGE.md`). Los nombres de tabla y
 * las columnas del FTS coinciden con las constantes de `@agente/shared` (`TABLAS`,
 * `FTS_COLUMNAS`, `FTS_TOKENIZER`), que son la fuente única para app y pipeline.
 *
 * Notas de diseño:
 *  - Todos los IDs son TEXT (ULID/BOE-id). Los JSON (competencia, variantes, regla) se guardan
 *    como TEXT con JSON serializado; la app los parsea con los esquemas de shared.
 *  - `estado_revision` + `nota_revision` viven en `infraccion`: el pipeline NO publica nada
 *    como "verificado"; el panel lo aprueba (§8.2/8.3). La app puede mostrar el distintivo.
 *  - El buscador es una tabla FTS5 externa por contenido propio (una fila por infracción),
 *    con `infraccion_id` UNINDEXED para recuperar la fila sin una segunda tabla.
 */

/** SQL de creación de todas las tablas (idempotente con `IF NOT EXISTS`). */
export const DDL = `
PRAGMA foreign_keys = ON;

-- Metadatos del paquete: pares clave/valor. Incluye schema_version y content_version.
CREATE TABLE IF NOT EXISTS meta (
  clave TEXT PRIMARY KEY,
  valor TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS norma (
  id                  TEXT PRIMARY KEY,
  codigo              TEXT NOT NULL,
  titulo              TEXT NOT NULL,
  tipo                TEXT NOT NULL,       -- ley|reglamento|ordenanza|codificado
  ambito              TEXT NOT NULL,       -- estatal|autonomico|municipal
  territorio_id       TEXT,
  origen              TEXT NOT NULL,       -- oficial|personal
  url_boe             TEXT,
  fecha_consolidacion TEXT,                -- YYYY-MM-DD (fuente BOE)
  cuerpos             TEXT NOT NULL DEFAULT '[]'  -- JSON: Cuerpo[] (relevancia, para filtrar)
);

CREATE TABLE IF NOT EXISTS articulo (
  id          TEXT PRIMARY KEY,
  norma_id    TEXT NOT NULL REFERENCES norma(id),
  numero      TEXT NOT NULL,               -- "18", "5 bis", "único"
  titulo      TEXT,
  texto       TEXT NOT NULL,               -- markdown consolidado
  idioma      TEXT NOT NULL DEFAULT 'es',
  orden       INTEGER NOT NULL DEFAULT 0,
  hash        TEXT NOT NULL,               -- sha256 del texto (detección de cambios)
  valid_from  TEXT NOT NULL,               -- ISO 8601 con offset
  valid_to    TEXT                         -- NULL = vigente
);
CREATE INDEX IF NOT EXISTS idx_articulo_norma ON articulo(norma_id, orden);

CREATE TABLE IF NOT EXISTS infraccion (
  id                    TEXT PRIMARY KEY,
  articulo_id           TEXT NOT NULL REFERENCES articulo(id),
  codigo_dgt            TEXT,
  titulo_corto          TEXT NOT NULL,
  gravedad              TEXT NOT NULL,     -- leve|grave|muy_grave|delito
  tipo                  TEXT NOT NULL,     -- administrativa|penal
  importe_eur           REAL,
  importe_reducido_eur  REAL,
  importe_max_eur       REAL,             -- extremo superior del tramo (horquilla); NULL si multa fija
  puntos                INTEGER,
  pena_texto            TEXT,              -- pena legible del delito (vía penal); NULL en administrativas
  gravedad_penal        TEXT,              -- leve|menos_grave|grave (art. 33 CP); NULL en administrativas
  texto_boletin         TEXT NOT NULL,
  variantes_boletin     TEXT NOT NULL DEFAULT '[]',  -- JSON: VarianteBoletin[]
  competencia           TEXT NOT NULL,               -- JSON: Competencia
  ambito                TEXT NOT NULL,
  territorio_id         TEXT,
  desplaza_id           TEXT,
  origen                TEXT NOT NULL,
  valid_from            TEXT NOT NULL,
  valid_to              TEXT,
  estado_revision       TEXT NOT NULL,     -- verificado|pendiente_revision
  nota_revision         TEXT               -- qué confirmar ("a verificar")
);
CREATE INDEX IF NOT EXISTS idx_infraccion_articulo ON infraccion(articulo_id);

CREATE TABLE IF NOT EXISTS sinonimo (
  id                  TEXT PRIMARY KEY,
  termino             TEXT NOT NULL,       -- tal cual lo redactamos ("faro roto")
  termino_normalizado TEXT NOT NULL,       -- normalizarBusqueda(termino): lookup exacto
  peso                REAL NOT NULL DEFAULT 1,
  infraccion_id       TEXT REFERENCES infraccion(id),
  articulo_id         TEXT REFERENCES articulo(id)
);
CREATE INDEX IF NOT EXISTS idx_sinonimo_norm ON sinonimo(termino_normalizado);
CREATE INDEX IF NOT EXISTS idx_sinonimo_infraccion ON sinonimo(infraccion_id);

CREATE TABLE IF NOT EXISTS consecuencia (
  id            TEXT PRIMARY KEY,
  tipo          TEXT NOT NULL,             -- detencion|inmovilizacion|deposito|...
  regla         TEXT NOT NULL DEFAULT '{}',-- JSON: condiciones
  texto_corto   TEXT NOT NULL,             -- orientativo, con fuente
  fuente        TEXT NOT NULL,             -- artículo que la sustenta
  infraccion_id TEXT REFERENCES infraccion(id),
  articulo_id   TEXT REFERENCES articulo(id)
);
CREATE INDEX IF NOT EXISTS idx_consecuencia_infraccion ON consecuencia(infraccion_id);

CREATE TABLE IF NOT EXISTS novedad (
  id              TEXT PRIMARY KEY,
  content_version TEXT NOT NULL,
  norma_id        TEXT,
  articulos       TEXT NOT NULL DEFAULT '[]',  -- JSON: string[]
  resumen         TEXT NOT NULL,
  fecha           TEXT NOT NULL
);

-- Tabla de sustancias (§4.7): umbrales orientativos consumo/tráfico (INTCF + Acuerdo Sala 2ª TS
-- 19/10/2001). Todo ORIENTATIVO; la calificación es judicial. pendiente_revision + nota_revision
-- viajan igual que en la tabla infraccion: el pipeline NO publica cifras como verificadas.
CREATE TABLE IF NOT EXISTS sustancia (
  id                       TEXT PRIMARY KEY,
  nombre                   TEXT NOT NULL,
  aliases                  TEXT NOT NULL DEFAULT '[]',  -- JSON: string[] (jerga de calle)
  umbral_consumo_diario_mg REAL NOT NULL,               -- mg de sustancia / día (orientativo)
  umbral_acopio_g          REAL NOT NULL,               -- g de acopio consumo propio (≈ diario × 5)
  notas_pureza             TEXT NOT NULL,
  indicadores_trafico      TEXT NOT NULL DEFAULT '[]',  -- JSON: string[]
  fuente                   TEXT NOT NULL,
  pendiente_revision       INTEGER NOT NULL DEFAULT 1,  -- 1 = pendiente (nada se autopublica)
  nota_revision            TEXT NOT NULL DEFAULT ''
);

-- Buscador offline (sección 4.3 y 7.1). Una fila por infracción; el ranking lo aplica la app.
CREATE VIRTUAL TABLE IF NOT EXISTS busqueda USING fts5(
  titulo_corto,
  texto_boletin,
  sinonimos,
  articulo_numero,
  infraccion_id UNINDEXED,
  tokenize = '${FTS_TOKENIZER}'
);

-- Buscador de ARTÍCULOS de la ley (§4.3, segundo nivel). Una fila por artículo vigente; cubre
-- los términos legales SIN infracción curada ("temeraria", "alejamiento") buscando en el
-- articulado consolidado del BOE. Mismo tokenizador/normalización que la tabla de infracciones.
-- articulo_id y norma_codigo van UNINDEXED (recuperar la fila y pintar el código de norma).
CREATE VIRTUAL TABLE IF NOT EXISTS busqueda_articulo USING fts5(
  articulo_numero,
  titulo,
  texto,
  articulo_id UNINDEXED,
  norma_codigo UNINDEXED,
  tokenize = '${FTS_TOKENIZER}'
);
`;

/** Versión del esquema que escribe este pipeline (debe casar con la de shared). */
export const SCHEMA_VERSION = ESQUEMA_PAQUETE_VERSION;
