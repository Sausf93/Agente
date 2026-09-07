import { describe, expect, it } from 'vitest';
import {
  CATEGORIAS_VEHICULOS,
  getCategoriaVehiculos,
  type SeccionVehiculos,
} from './contenido';

/**
 * Tests de estructura y contrato del contenido de "Vehículos" (§4.12). No es normativa, pero
 * se blinda su forma: ids únicos, las cuatro categorías esperadas, marca de fiabilidad presente,
 * enlaces coherentes (URL fija o referencia genérica) y lenguaje orientativo (sin imperativos).
 */

const todasSecciones: SeccionVehiculos[] = CATEGORIAS_VEHICULOS.flatMap((c) => c.secciones);

describe('CATEGORIAS_VEHICULOS', () => {
  it('incluye las cuatro categorías del alcance', () => {
    const ids = CATEGORIAS_VEHICULOS.map((c) => c.id);
    expect(ids).toEqual([
      'documentacion-espanola',
      'extranjeros',
      'comprobaciones',
      'falsedad',
    ]);
  });

  it('tiene ids de categoría únicos y con secciones', () => {
    const ids = CATEGORIAS_VEHICULOS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const c of CATEGORIAS_VEHICULOS) {
      expect(c.titulo.length).toBeGreaterThan(0);
      expect(c.resumen.length).toBeGreaterThan(0);
      expect(c.secciones.length).toBeGreaterThan(0);
    }
  });

  it('tiene ids de sección únicos en toda la sección', () => {
    const ids = todasSecciones.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('cada sección declara su estado de fiabilidad (orientativo | pendiente)', () => {
    for (const s of todasSecciones) {
      expect(['orientativo', 'pendiente']).toContain(s.estado);
    }
  });

  it('todo enlace tiene referencia genérica cuando no hay URL fija (nada inventado)', () => {
    for (const s of todasSecciones) {
      for (const e of s.enlaces ?? []) {
        expect(e.referencia.length).toBeGreaterThan(0);
        if (e.url !== null) {
          expect(e.url).toMatch(/^https:\/\//);
        }
      }
    }
  });

  it('las secciones con enlaces sin URL fija se marcan como pendientes', () => {
    for (const s of todasSecciones) {
      const tieneEnlacePendiente = (s.enlaces ?? []).some((e) => e.url === null);
      if (tieneEnlacePendiente) {
        expect(s.estado).toBe('pendiente');
      }
    }
  });

  it('usa lenguaje orientativo, sin imperativos de mando en las descripciones', () => {
    // Ojo: "para" es preposición, no se incluye. Solo formas imperativas de mando inequívocas.
    const imperativosProhibidos = /\b(detén|exige|comprueba|retira|inmoviliza|sanciona)\b/i;
    for (const s of todasSecciones) {
      expect(s.descripcion).not.toMatch(imperativosProhibidos);
    }
  });
});

describe('getCategoriaVehiculos', () => {
  it('devuelve la categoría por id', () => {
    expect(getCategoriaVehiculos('falsedad')?.titulo).toBe('Falsedad documental');
  });

  it('devuelve undefined para id desconocido o vacío', () => {
    expect(getCategoriaVehiculos('no-existe')).toBeUndefined();
    expect(getCategoriaVehiculos(undefined)).toBeUndefined();
  });
});
