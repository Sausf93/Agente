import type { Ambito, TipoNorma } from '@agente/shared';

/**
 * Catálogo de normas a ingerir del BOE, por fases (sección 4.5 y plan de fases).
 *
 * Cada entrada fija la identidad estable de la norma en nuestro sistema (`codigo`,
 * `tipo`, `ambito`) y su identificador BOE. El título, la URL y la fecha de
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
  /** Marca de implementación: `true` cuando el parser ya se ha validado con esta norma. */
  implementada: boolean;
}

/**
 * Fase 1 — codificado de tráfico (LSV, RGC, RGV).
 * El RGC es la primera norma parseada de extremo a extremo; LSV y RGV quedan
 * declaradas y se activarán reutilizando el mismo cliente y parser.
 */
export const CATALOGO_TRAFICO: Record<string, EntradaCatalogo> = {
  RGC: {
    codigo: 'RGC',
    idBoe: 'BOE-A-2003-23514',
    tipo: 'reglamento',
    ambito: 'estatal',
    implementada: true,
  },
  LSV: {
    // Texto refundido de la Ley sobre Tráfico (RDL 6/2015).
    codigo: 'LSV',
    idBoe: 'BOE-A-2015-11722',
    tipo: 'ley',
    ambito: 'estatal',
    implementada: false,
  },
  RGV: {
    // Reglamento General de Vehículos (RD 2822/1998).
    codigo: 'RGV',
    idBoe: 'BOE-A-1999-1826',
    tipo: 'reglamento',
    ambito: 'estatal',
    implementada: false,
  },
};
