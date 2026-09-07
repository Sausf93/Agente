import {
  Competencia,
  VarianteBoletin,
  type EstadoRevision,
  type Gravedad,
  type TipoConsecuencia,
  type TipoInfraccion,
} from '@agente/shared';
import type { SqlRunner } from '@/db/sqlRunner';

/**
 * Carga de la FICHA de infracción (§4.4), agnóstica del motor SQLite.
 *
 * Compone lo que la pantalla necesita EN EL ORDEN del §4.4: cabecera (título, norma+artículo,
 * gravedad/tipo), importes/puntos, texto de boletín, consecuencias con su fuente (§4.6,
 * lenguaje orientativo), competencia, artículo completo (desplegable) y el pie
 * "Actualizado el… · Fuente". Incluye `estadoRevision`/`notaRevision` para el distintivo
 * "pendiente de revisión / a verificar" que exige el contrato del pipeline.
 */

export interface ConsecuenciaFicha {
  tipo: TipoConsecuencia;
  textoCorto: string;
  fuente: string;
  /** Regla estructurada (JSON del paquete). En `detencion` alimenta el árbol interactivo (§4.6). */
  regla: Record<string, unknown> | null;
}

export interface FichaInfraccion {
  infraccionId: string;
  tituloCorto: string;
  gravedad: Gravedad;
  tipo: TipoInfraccion;
  importeEur: number | null;
  importeReducidoEur: number | null;
  puntos: number | null;
  textoBoletin: string;
  variantesBoletin: VarianteBoletin[];
  competencia: Competencia;
  estadoRevision: EstadoRevision;
  notaRevision: string | null;
  /** Fuente visible (§4.4 pie): código de norma + nº de artículo + enlace al BOE. */
  normaCodigo: string;
  articuloNumero: string;
  urlBoe: string | null;
  /** Texto del artículo (desplegable) y su título. */
  articuloTitulo: string | null;
  articuloTexto: string;
  consecuencias: ConsecuenciaFicha[];
  /** "Actualizado el…" — sale de `meta.fecha` (ISO 8601). */
  actualizadoEn: string | null;
}

interface FilaFicha {
  infraccion_id: string;
  titulo_corto: string;
  gravedad: Gravedad;
  tipo: TipoInfraccion;
  importe_eur: number | null;
  importe_reducido_eur: number | null;
  puntos: number | null;
  texto_boletin: string;
  variantes_boletin: string;
  competencia: string;
  estado_revision: EstadoRevision;
  nota_revision: string | null;
  norma_codigo: string;
  url_boe: string | null;
  articulo_numero: string;
  articulo_titulo: string | null;
  articulo_texto: string;
}

interface FilaConsecuencia {
  tipo: TipoConsecuencia;
  texto_corto: string;
  fuente: string;
  regla: string;
}

/** Parseo tolerante del JSON de `regla` de una consecuencia (defensivo ante contenido inesperado). */
function parseRegla(json: string): Record<string, unknown> | null {
  try {
    const obj = JSON.parse(json);
    return obj && typeof obj === 'object' ? (obj as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** Parseo tolerante del JSON de competencia (defensivo ante contenido inesperado). */
function parseCompetencia(json: string): Competencia {
  try {
    return Competencia.parse(JSON.parse(json));
  } catch {
    return Competencia.parse({ cuerpos: [], via: 'ambas' });
  }
}

/** Parseo tolerante del JSON de variantes de boletín. */
function parseVariantes(json: string): VarianteBoletin[] {
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr.map((v) => VarianteBoletin.parse(v)) : [];
  } catch {
    return [];
  }
}

/**
 * Carga la ficha completa de una infracción. Devuelve `null` si el id no existe en el paquete.
 */
export async function cargarFicha(
  runner: SqlRunner,
  infraccionId: string,
): Promise<FichaInfraccion | null> {
  const fila = await runner.getFirst<FilaFicha>(
    `SELECT i.id AS infraccion_id, i.titulo_corto, i.gravedad, i.tipo, i.importe_eur,
            i.importe_reducido_eur, i.puntos, i.texto_boletin, i.variantes_boletin,
            i.competencia, i.estado_revision, i.nota_revision,
            n.codigo AS norma_codigo, n.url_boe,
            a.numero AS articulo_numero, a.titulo AS articulo_titulo, a.texto AS articulo_texto
       FROM infraccion i
       JOIN articulo a ON a.id = i.articulo_id
       JOIN norma    n ON n.id = a.norma_id
      WHERE i.id = ?`,
    [infraccionId],
  );
  if (!fila) return null;

  const consecuencias = await runner.getAll<FilaConsecuencia>(
    `SELECT tipo, texto_corto, fuente, regla
       FROM consecuencia
      WHERE infraccion_id = ?`,
    [infraccionId],
  );

  const meta = await runner.getFirst<{ valor: string }>(
    `SELECT valor FROM meta WHERE clave = 'fecha'`,
  );

  return {
    infraccionId: fila.infraccion_id,
    tituloCorto: fila.titulo_corto,
    gravedad: fila.gravedad,
    tipo: fila.tipo,
    importeEur: fila.importe_eur,
    importeReducidoEur: fila.importe_reducido_eur,
    puntos: fila.puntos,
    textoBoletin: fila.texto_boletin,
    variantesBoletin: parseVariantes(fila.variantes_boletin),
    competencia: parseCompetencia(fila.competencia),
    estadoRevision: fila.estado_revision,
    notaRevision: fila.nota_revision,
    normaCodigo: fila.norma_codigo,
    articuloNumero: fila.articulo_numero,
    urlBoe: fila.url_boe,
    articuloTitulo: fila.articulo_titulo,
    articuloTexto: fila.articulo_texto,
    consecuencias: consecuencias.map((c) => ({
      tipo: c.tipo,
      textoCorto: c.texto_corto,
      fuente: c.fuente,
      regla: parseRegla(c.regla),
    })),
    actualizadoEn: meta?.valor ?? null,
  };
}
