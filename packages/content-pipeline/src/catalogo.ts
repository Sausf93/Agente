import type { Ambito, Cuerpo, TipoNorma } from '@agente/shared';

/**
 * Catálogo de normas a ingerir del BOE, por fases (sección 4.5 y plan de fases).
 *
 * Cada entrada fija la identidad estable de la norma en nuestro sistema (`codigo`,
 * `tipo`, `ambito`, `cuerpos`) y su identificador BOE. El título, la URL y la fecha de
 * consolidación NO se ponen aquí: los rellena el parser desde los metadatos oficiales,
 * para que siempre reflejen la fuente primaria.
 */
export interface EntradaCatalogo {
  /** Código estable interno, p. ej. "RGC". Es el `Norma.codigo`. */
  codigo: string;
  /** Identificador BOE de la legislación consolidada, p. ej. "BOE-A-2003-23514". */
  idBoe: string;
  tipo: TipoNorma;
  ambito: Ambito;
  /**
   * Cuerpos que consultan esta norma habitualmente (relevancia, para filtrar la lista de
   * Normas). NO restringe el acceso: solo prioriza. Viaja hasta la columna `cuerpos` del
   * paquete SQLite.
   */
  cuerpos: Cuerpo[];
  /** Marca de implementación: `true` cuando el parser ya se ha validado con esta norma. */
  implementada: boolean;
}

/**
 * Relevancia de TRÁFICO: la consultan la Guardia Civil (Agrupación de Tráfico), las policías
 * locales (tráfico urbano) y las autonómicas con competencia en la materia. La Policía Nacional
 * no la lleva de oficio (solo aparece en búsqueda expresa), por eso NO se etiqueta aquí.
 */
const CUERPOS_TRAFICO: Cuerpo[] = ['guardia_civil', 'policia_local', 'policia_autonomica'];

/** Relevancia GENERAL (penal, procesal y seguridad ciudadana): la consultan todos los cuerpos. */
const CUERPOS_TODOS: Cuerpo[] = [
  'guardia_civil',
  'policia_nacional',
  'policia_local',
  'policia_autonomica',
];

/**
 * Fase 1 — codificado de tráfico (LSV, RGC, RGV).
 * El RGC fue la primera norma parseada de extremo a extremo; LSV y RGV se ingieren con el mismo
 * cliente y parser.
 */
export const CATALOGO_TRAFICO: Record<string, EntradaCatalogo> = {
  RGC: {
    codigo: 'RGC',
    idBoe: 'BOE-A-2003-23514',
    tipo: 'reglamento',
    ambito: 'estatal',
    cuerpos: CUERPOS_TRAFICO,
    implementada: true,
  },
  LSV: {
    // Texto refundido de la Ley sobre Tráfico (RDL 6/2015).
    codigo: 'LSV',
    idBoe: 'BOE-A-2015-11722',
    tipo: 'ley',
    ambito: 'estatal',
    cuerpos: CUERPOS_TRAFICO,
    implementada: true,
  },
  RGV: {
    // Reglamento General de Vehículos (RD 2822/1998).
    codigo: 'RGV',
    idBoe: 'BOE-A-1999-1826',
    tipo: 'reglamento',
    ambito: 'estatal',
    cuerpos: CUERPOS_TRAFICO,
    implementada: true,
  },
};

/**
 * Fase 1 — normativa penal, procesal y de seguridad ciudadana. La consultan TODOS los cuerpos.
 * Los códigos coinciden con los que ya declaran los seeds penal (CP) y de seguridad ciudadana
 * (LOSC): al enriquecer se deduplica por `id` (ver `enriquecerConNorma`).
 */
export const CATALOGO_PENAL: Record<string, EntradaCatalogo> = {
  CP: {
    // Código Penal (LO 10/1995).
    codigo: 'CP',
    idBoe: 'BOE-A-1995-25444',
    tipo: 'ley',
    ambito: 'estatal',
    cuerpos: CUERPOS_TODOS,
    implementada: true,
  },
  LECrim: {
    // Ley de Enjuiciamiento Criminal (RD de 14 de septiembre de 1882).
    codigo: 'LECrim',
    idBoe: 'BOE-A-1882-6036',
    tipo: 'ley',
    ambito: 'estatal',
    cuerpos: CUERPOS_TODOS,
    implementada: true,
  },
  LOSC: {
    // LO 4/2015, de protección de la seguridad ciudadana.
    codigo: 'LOSC',
    idBoe: 'BOE-A-2015-3442',
    tipo: 'ley',
    ambito: 'estatal',
    cuerpos: CUERPOS_TODOS,
    implementada: true,
  },
};

/**
 * Normas que el build enriquece con el TEXTO CONSOLIDADO REAL del BOE (bucle de ingesta).
 * Orden estable: primero tráfico, luego penal/procesal/seguridad ciudadana. Cada una cae a su
 * propio fallback si su descarga o parseo fallan (el resto se ingiere igualmente).
 */
export const ENTRADAS_A_ENRIQUECER: EntradaCatalogo[] = [
  CATALOGO_TRAFICO.RGC!,
  CATALOGO_TRAFICO.LSV!,
  CATALOGO_TRAFICO.RGV!,
  CATALOGO_PENAL.CP!,
  CATALOGO_PENAL.LECrim!,
  CATALOGO_PENAL.LOSC!,
];
