import type { Articulo } from '@agente/shared';

/**
 * Detección de cambios por hash a nivel de artículo (sección 8.2).
 *
 * Compara dos consolidaciones de la MISMA norma (anterior vs. nueva) y clasifica cada
 * artículo. Es la base del flujo incremental: los `modificado` cierran la versión
 * anterior con `validTo` y abren una nueva con `validFrom`, y alimentan las `Novedad`
 * y la marca "requiere revisión" del panel. El emparejamiento es por `numero` (la
 * identidad legal estable del artículo); el `hash` decide si el texto cambió.
 */

export type TipoCambio = 'nuevo' | 'modificado' | 'eliminado' | 'sin_cambio';

export interface CambioArticulo {
  tipo: TipoCambio;
  numero: string;
  hashAnterior: string | null;
  hashNuevo: string | null;
}

export interface ResumenDiff {
  cambios: CambioArticulo[];
  nuevos: number;
  modificados: number;
  eliminados: number;
  sinCambio: number;
  /** `true` si hay algún cambio real (nuevo/modificado/eliminado). */
  hayCambios: boolean;
}

export function diffArticulos(anteriores: Articulo[], nuevos: Articulo[]): ResumenDiff {
  const mapaAnterior = new Map(anteriores.map((a) => [a.numero, a]));
  const mapaNuevo = new Map(nuevos.map((a) => [a.numero, a]));

  const cambios: CambioArticulo[] = [];

  for (const nuevo of nuevos) {
    const anterior = mapaAnterior.get(nuevo.numero);
    if (!anterior) {
      cambios.push({
        tipo: 'nuevo',
        numero: nuevo.numero,
        hashAnterior: null,
        hashNuevo: nuevo.hash,
      });
    } else if (anterior.hash !== nuevo.hash) {
      cambios.push({
        tipo: 'modificado',
        numero: nuevo.numero,
        hashAnterior: anterior.hash,
        hashNuevo: nuevo.hash,
      });
    } else {
      cambios.push({
        tipo: 'sin_cambio',
        numero: nuevo.numero,
        hashAnterior: anterior.hash,
        hashNuevo: nuevo.hash,
      });
    }
  }

  for (const anterior of anteriores) {
    if (!mapaNuevo.has(anterior.numero)) {
      cambios.push({
        tipo: 'eliminado',
        numero: anterior.numero,
        hashAnterior: anterior.hash,
        hashNuevo: null,
      });
    }
  }

  const cuenta = (t: TipoCambio): number => cambios.filter((c) => c.tipo === t).length;
  const nuevosN = cuenta('nuevo');
  const modificados = cuenta('modificado');
  const eliminados = cuenta('eliminado');

  return {
    cambios,
    nuevos: nuevosN,
    modificados,
    eliminados,
    sinCambio: cuenta('sin_cambio'),
    hayCambios: nuevosN + modificados + eliminados > 0,
  };
}
