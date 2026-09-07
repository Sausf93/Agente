import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import {
  normalizarBusqueda,
  validarImporte,
  validarMinimosPublicacion,
  type Articulo,
  type Norma,
  type Sustancia,
} from '@agente/shared';
import { DatabaseSync } from './sqlite.js';
import { DDL, SCHEMA_VERSION } from './schema.js';
import { construirManifiesto, type ManifiestoPaquete } from './manifest.js';
import type { InfraccionSeed, SeedContenido } from '../seed/traficoSeed.js';

/**
 * CONSTRUCTOR del paquete de contenido SQLite + FTS5 (sección 8.2, paso "build").
 *
 * Toma el contenido ya validado (normas + artículos + infracciones con sus sinónimos y
 * consecuencias) y genera un fichero `.sqlite` de SOLO LECTURA con las tablas y el índice FTS
 * poblados, más un manifiesto (`ContentVersion`) con hash e (por ahora) hueco de firma.
 *
 * Antes de insertar aplica los validadores de `@agente/shared` (rangos de importe y mínimos de
 * publicación, §8.3): si una infracción los incumple, LANZA y no se genera el paquete. El
 * estado editorial (`pendiente_revision`) es ortogonal: viaja en el paquete para que el panel
 * y la app lo muestren, pero no es un fallo de validación.
 */

/** El contenido a empaquetar tiene la misma forma que el seed. */
export type ContenidoParaEmpaquetar = SeedContenido;

export interface OpcionesBuild {
  /** Ruta del fichero `.sqlite` a generar (se sobrescribe si existe). */
  rutaSalida: string;
  /** Versión de CONTENIDO en semver (X.Y.Z). */
  version: string;
  /** Fecha de publicación (ISO 8601 con offset). Por defecto, ahora. */
  fecha?: string;
  /** Resumen de cambios para el manifiesto y la `Novedad`. */
  changelog?: Record<string, unknown>;
  /** Clave privada Ed25519 para firmar (ausente en Fase 1 → firma null). */
  clavePrivada?: string;
}

export interface ResumenBuild {
  normas: number;
  articulos: number;
  infracciones: number;
  sinonimos: number;
  consecuencias: number;
  pendientesRevision: number;
  /** Sustancias de la tabla §4.7 empaquetadas. */
  sustancias: number;
}

export interface ResultadoBuild {
  rutaSqlite: string;
  rutaManifiesto: string;
  manifiesto: ManifiestoPaquete;
  resumen: ResumenBuild;
}

/** Marco de importe → nombre legible para el mensaje de error de validación. */
function validarInfraccion(item: InfraccionSeed): string[] {
  const problemas = [
    ...validarImporte(item.infraccion, item.marcoImporte),
    ...validarMinimosPublicacion(item.infraccion, item.sinonimos.length),
  ];
  return problemas.map((p) => `${item.infraccion.id} · ${p.campo}: ${p.mensaje}`);
}

/** Valida todo el contenido; lanza con el detalle si algo incumple §8.3. */
export function validarContenido(contenido: ContenidoParaEmpaquetar): void {
  const errores = contenido.infracciones.flatMap(validarInfraccion);
  if (errores.length > 0) {
    throw new Error(
      `El contenido no supera la validación de calidad (§8.3):\n- ${errores.join('\n- ')}`,
    );
  }
}

function insertarNormas(db: DatabaseSync, normas: Norma[]): void {
  const stmt = db.prepare(
    `INSERT INTO norma (id, codigo, titulo, tipo, ambito, territorio_id, origen, url_boe, fecha_consolidacion)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  for (const n of normas) {
    stmt.run(
      n.id,
      n.codigo,
      n.titulo,
      n.tipo,
      n.ambito,
      n.territorioId,
      n.origen,
      n.urlBoe,
      n.fechaConsolidacion,
    );
  }
}

function insertarArticulos(db: DatabaseSync, articulos: Articulo[]): void {
  const stmt = db.prepare(
    `INSERT INTO articulo (id, norma_id, numero, titulo, texto, idioma, orden, hash, valid_from, valid_to)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  for (const a of articulos) {
    stmt.run(a.id, a.normaId, a.numero, a.titulo, a.texto, a.idioma, a.orden, a.hash, a.validFrom, a.validTo);
  }
}

function insertarInfracciones(
  db: DatabaseSync,
  infracciones: InfraccionSeed[],
  articuloPorId: Map<string, Articulo>,
  codigoNormaPorId: Map<string, string>,
): void {
  const stmtInf = db.prepare(
    `INSERT INTO infraccion (
       id, articulo_id, codigo_dgt, titulo_corto, gravedad, tipo, importe_eur, importe_reducido_eur,
       puntos, texto_boletin, variantes_boletin, competencia, ambito, territorio_id, desplaza_id,
       origen, valid_from, valid_to, estado_revision, nota_revision
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const stmtSin = db.prepare(
    `INSERT INTO sinonimo (id, termino, termino_normalizado, peso, infraccion_id, articulo_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
  );
  const stmtCons = db.prepare(
    `INSERT INTO consecuencia (id, tipo, regla, texto_corto, fuente, infraccion_id, articulo_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  );
  const stmtFts = db.prepare(
    `INSERT INTO busqueda (titulo_corto, texto_boletin, sinonimos, articulo_numero, infraccion_id)
     VALUES (?, ?, ?, ?, ?)`,
  );

  for (const item of infracciones) {
    const inf = item.infraccion;
    stmtInf.run(
      inf.id,
      inf.articuloId,
      inf.codigoDgt,
      inf.tituloCorto,
      inf.gravedad,
      inf.tipo,
      inf.importeEur,
      inf.importeReducidoEur,
      inf.puntos,
      inf.textoBoletin,
      JSON.stringify(inf.variantesBoletin),
      JSON.stringify(inf.competencia),
      inf.ambito,
      inf.territorioId,
      inf.desplazaId,
      inf.origen,
      inf.validFrom,
      inf.validTo,
      item.revision,
      item.notaRevision,
    );

    for (const s of item.sinonimos) {
      stmtSin.run(s.id, s.termino, normalizarBusqueda(s.termino), s.peso, s.infraccionId, s.articuloId);
    }
    for (const c of item.consecuencias) {
      stmtCons.run(c.id, c.tipo, JSON.stringify(c.regla), c.textoCorto, c.fuente, c.infraccionId, c.articuloId);
    }

    // Fila del buscador: texto normalizado por columna (título, boletín, sinónimos, artículo).
    const articulo = articuloPorId.get(inf.articuloId);
    const numeroArticulo = articulo
      ? `${codigoNormaPorId.get(articulo.normaId) ?? ''} ${articulo.numero}`
      : '';
    stmtFts.run(
      normalizarBusqueda(inf.tituloCorto),
      normalizarBusqueda(inf.textoBoletin),
      normalizarBusqueda(item.sinonimos.map((s) => s.termino).join(' ')),
      normalizarBusqueda(numeroArticulo),
      inf.id,
    );
  }
}

function insertarSustancias(db: DatabaseSync, sustancias: Sustancia[]): void {
  const stmt = db.prepare(
    `INSERT INTO sustancia (
       id, nombre, aliases, umbral_consumo_diario_mg, umbral_acopio_g, notas_pureza,
       indicadores_trafico, fuente, pendiente_revision, nota_revision
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  for (const s of sustancias) {
    stmt.run(
      s.id,
      s.nombre,
      JSON.stringify(s.aliases),
      s.umbralConsumoDiarioMg,
      s.umbralAcopioG,
      s.notasPureza,
      JSON.stringify(s.indicadoresTrafico),
      s.fuente,
      s.pendienteRevision ? 1 : 0,
      s.notaRevision,
    );
  }
}

function insertarMeta(
  db: DatabaseSync,
  entradas: Record<string, string>,
): void {
  const stmt = db.prepare(`INSERT OR REPLACE INTO meta (clave, valor) VALUES (?, ?)`);
  for (const [clave, valor] of Object.entries(entradas)) {
    stmt.run(clave, valor);
  }
}

function insertarNovedadInicial(
  db: DatabaseSync,
  version: string,
  fecha: string,
  resumen: string,
): void {
  db.prepare(
    `INSERT INTO novedad (id, content_version, norma_id, articulos, resumen, fecha)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(`novedad-${version}`, version, null, '[]', resumen, fecha);
}

/**
 * Construye el paquete `.sqlite` + su manifiesto. Devuelve rutas, manifiesto y un resumen.
 */
export function construirPaquete(
  contenido: ContenidoParaEmpaquetar,
  opciones: OpcionesBuild,
): ResultadoBuild {
  validarContenido(contenido);

  const fecha = opciones.fecha ?? new Date().toISOString();
  const rutaManifiesto = opciones.rutaSalida.replace(/\.sqlite$/i, '') + '.manifest.json';

  // Fichero limpio (y sus posibles ficheros WAL/SHM) antes de construir.
  for (const sufijo of ['', '-wal', '-shm', '-journal']) {
    const f = opciones.rutaSalida + sufijo;
    if (existsSync(f)) rmSync(f);
  }
  const dir = dirname(opciones.rutaSalida);
  if (dir && !existsSync(dir)) mkdirSync(dir, { recursive: true });

  const db = new DatabaseSync(opciones.rutaSalida);
  try {
    db.exec(DDL);

    const articuloPorId = new Map(contenido.articulos.map((a) => [a.id, a]));
    const codigoNormaPorId = new Map(contenido.normas.map((n) => [n.id, n.codigo]));

    db.exec('BEGIN');
    insertarNormas(db, contenido.normas);
    insertarArticulos(db, contenido.articulos);
    insertarInfracciones(db, contenido.infracciones, articuloPorId, codigoNormaPorId);
    insertarSustancias(db, contenido.sustancias ?? []);
    insertarMeta(db, {
      schema_version: String(SCHEMA_VERSION),
      content_version: opciones.version,
      fecha,
      generado_en: new Date().toISOString(),
      firma_algoritmo: 'ed25519',
    });
    insertarNovedadInicial(
      db,
      opciones.version,
      fecha,
      typeof opciones.changelog?.resumen === 'string'
        ? opciones.changelog.resumen
        : 'Carga inicial del codificado de tráfico (seed de infracciones de calle).',
    );
    db.exec('COMMIT');

    // Optimiza el índice FTS (mejora el tamaño y la consulta en el dispositivo).
    db.exec(`INSERT INTO busqueda(busqueda) VALUES('optimize')`);
  } catch (error) {
    try {
      db.exec('ROLLBACK');
    } catch {
      // ROLLBACK puede fallar si no había transacción abierta; se ignora.
    }
    db.close();
    throw error;
  }
  db.close();

  const bytes = readFileSync(opciones.rutaSalida);
  const manifiesto = construirManifiesto(bytes, {
    version: opciones.version,
    fecha,
    schemaVersion: SCHEMA_VERSION,
    ...(opciones.changelog ? { changelog: opciones.changelog } : {}),
    ...(opciones.clavePrivada ? { clavePrivada: opciones.clavePrivada } : {}),
  });
  writeFileSync(rutaManifiesto, JSON.stringify(manifiesto, null, 2) + '\n', 'utf8');

  const sinonimos = contenido.infracciones.reduce((n, i) => n + i.sinonimos.length, 0);
  const consecuencias = contenido.infracciones.reduce((n, i) => n + i.consecuencias.length, 0);
  const pendientesRevision = contenido.infracciones.filter(
    (i) => i.revision === 'pendiente_revision',
  ).length;

  return {
    rutaSqlite: opciones.rutaSalida,
    rutaManifiesto,
    manifiesto,
    resumen: {
      normas: contenido.normas.length,
      articulos: contenido.articulos.length,
      infracciones: contenido.infracciones.length,
      sinonimos,
      consecuencias,
      pendientesRevision,
      sustancias: contenido.sustancias?.length ?? 0,
    },
  };
}
