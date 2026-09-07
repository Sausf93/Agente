import { describe, expect, it } from 'vitest';
import {
  APARTADOS_520,
  DERECHOS_520,
  ETIQUETAS_APARTADOS,
  IDIOMAS_DERECHOS,
  IDIOMAS_META,
  derechosPorIdioma,
  textoCompleto,
  type ApartadoDerechos520,
  type IdiomaDerechos,
} from './derechos.js';

/**
 * Tests de COHERENCIA del contenido de la lectura de derechos (§4.11). No juzgan la calidad de la
 * traducción (eso es cotejo humano, `revisado: false`), sino que la estructura sea completa: todos
 * los idiomas con todos los apartados, sin huecos, y el estado de revisión coherente.
 */

describe('DERECHOS_520 — estructura', () => {
  it('cubre exactamente los idiomas de la entrega', () => {
    expect(Object.keys(DERECHOS_520).sort()).toEqual([...IDIOMAS_DERECHOS].sort());
  });

  it('cada idioma tiene TODOS los apartados del art. 520.2, sin huecos', () => {
    for (const idioma of IDIOMAS_DERECHOS) {
      const texto = DERECHOS_520[idioma];
      const claves = Object.keys(texto.textoNativo).sort();
      expect(claves).toEqual([...APARTADOS_520].sort());
      for (const clave of APARTADOS_520) {
        expect(texto.textoNativo[clave].trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('cada apartado tiene una etiqueta en español', () => {
    for (const clave of APARTADOS_520) {
      expect(ETIQUETAS_APARTADOS[clave].trim().length).toBeGreaterThan(0);
    }
    expect(Object.keys(ETIQUETAS_APARTADOS).sort()).toEqual([...APARTADOS_520].sort());
  });

  it('no hay claves de apartado repetidas', () => {
    expect(new Set(APARTADOS_520).size).toBe(APARTADOS_520.length);
  });

  it('todas las entradas son del art. 520 y su idioma coincide con la clave', () => {
    for (const idioma of IDIOMAS_DERECHOS) {
      expect(DERECHOS_520[idioma].articulo).toBe('520');
      expect(DERECHOS_520[idioma].idioma).toBe(idioma);
    }
  });
});

describe('DERECHOS_520 — lenguas cooficiales (ca/eu/gl)', () => {
  const COOFICIALES: IdiomaDerechos[] = ['ca', 'eu', 'gl'];

  it('incluye català, euskara y galego en la entrega', () => {
    for (const idioma of COOFICIALES) {
      expect(IDIOMAS_DERECHOS).toContain(idioma);
    }
  });

  it('coloca las cooficiales en lugar visible: justo tras el castellano', () => {
    // Orden pensado para intervención (§4.11): es → cooficiales → resto.
    expect(IDIOMAS_DERECHOS.slice(0, 4)).toEqual(['es', 'ca', 'eu', 'gl']);
  });

  it('cada cooficial tiene TODOS los apartados y va pendiente de cotejo', () => {
    for (const idioma of COOFICIALES) {
      const texto = DERECHOS_520[idioma];
      expect(Object.keys(texto.textoNativo).sort()).toEqual([...APARTADOS_520].sort());
      for (const clave of APARTADOS_520) {
        expect(texto.textoNativo[clave].trim().length).toBeGreaterThan(0);
      }
      expect(texto.revisado).toBe(false);
      expect(texto.nota).not.toBeNull();
    }
  });

  it('cada cooficial tiene metadatos (nombre en español y endónimo) y no es RTL', () => {
    for (const idioma of COOFICIALES) {
      const meta = IDIOMAS_META[idioma];
      expect(meta.nombre.trim().length).toBeGreaterThan(0);
      expect(meta.endonimo.trim().length).toBeGreaterThan(0);
      expect(meta.rtl).toBe(false);
    }
  });
});

describe('DERECHOS_520 — ampliación (zh/ru/pt/it/uk)', () => {
  const NUEVOS: IdiomaDerechos[] = ['zh', 'ru', 'pt', 'it', 'uk'];

  it('incluye chino, ruso, portugués, italiano y ucraniano en la entrega', () => {
    for (const idioma of NUEVOS) {
      expect(IDIOMAS_DERECHOS).toContain(idioma);
    }
  });

  it('los coloca tras es/cooficiales y los europeos frecuentes (no entre los 4 primeros)', () => {
    for (const idioma of NUEVOS) {
      expect(IDIOMAS_DERECHOS.indexOf(idioma)).toBeGreaterThanOrEqual(4);
    }
  });

  it('cada idioma nuevo tiene TODOS los apartados, sin huecos, y va pendiente de cotejo', () => {
    for (const idioma of NUEVOS) {
      const texto = DERECHOS_520[idioma];
      expect(Object.keys(texto.textoNativo).sort()).toEqual([...APARTADOS_520].sort());
      for (const clave of APARTADOS_520) {
        expect(texto.textoNativo[clave].trim().length).toBeGreaterThan(0);
      }
      expect(texto.revisado).toBe(false);
      expect(texto.nota).not.toBeNull();
      expect((texto.nota ?? '').toLowerCase()).toContain('oficial');
    }
  });

  it('cada idioma nuevo tiene metadatos (nombre en español y endónimo) y no es RTL', () => {
    for (const idioma of NUEVOS) {
      const meta = IDIOMAS_META[idioma];
      expect(meta.codigo).toBe(idioma);
      expect(meta.nombre.trim().length).toBeGreaterThan(0);
      expect(meta.endonimo.trim().length).toBeGreaterThan(0);
      expect(meta.rtl).toBe(false);
    }
  });

  it('el texto nativo del idioma nuevo NO es idéntico al español (traducción real, no copia)', () => {
    for (const idioma of NUEVOS) {
      expect(DERECHOS_520[idioma].textoNativo).not.toEqual(DERECHOS_520.es.textoNativo);
    }
  });

  it('usa la escritura esperada en cirílico (ru/uk) y en chino (zh)', () => {
    const CIRILICO = /[Ѐ-ӿ]/;
    const HAN = /[一-鿿]/;
    for (const idioma of ['ru', 'uk'] as IdiomaDerechos[]) {
      expect(CIRILICO.test(DERECHOS_520[idioma].textoNativo.informacion)).toBe(true);
    }
    expect(HAN.test(DERECHOS_520.zh.textoNativo.informacion)).toBe(true);
  });
});

describe('DERECHOS_520 — referencia en español', () => {
  it('todas las entradas incluyen la referencia en español completa', () => {
    for (const idioma of IDIOMAS_DERECHOS) {
      const texto = DERECHOS_520[idioma];
      expect(Object.keys(texto.textoEs).sort()).toEqual([...APARTADOS_520].sort());
      for (const clave of APARTADOS_520) {
        expect(texto.textoEs[clave].trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('la referencia en español es la misma para todos los idiomas (fuente única)', () => {
    const refEs = DERECHOS_520.es.textoNativo;
    for (const idioma of IDIOMAS_DERECHOS) {
      expect(DERECHOS_520[idioma].textoEs).toEqual(refEs);
    }
  });

  it('en español, el texto nativo coincide con la referencia en español', () => {
    expect(DERECHOS_520.es.textoNativo).toEqual(DERECHOS_520.es.textoEs);
  });
});

describe('DERECHOS_520 — estado de revisión', () => {
  it('el español va revisado y sin nota (literal del BOE)', () => {
    expect(DERECHOS_520.es.revisado).toBe(true);
    expect(DERECHOS_520.es.nota).toBeNull();
  });

  it('el resto de idiomas van SIN revisar y con nota de cotejo pendiente', () => {
    const pendientes = IDIOMAS_DERECHOS.filter((i) => i !== 'es');
    for (const idioma of pendientes) {
      const texto = DERECHOS_520[idioma];
      expect(texto.revisado).toBe(false);
      expect(texto.nota).not.toBeNull();
      expect((texto.nota ?? '').toLowerCase()).toContain('oficial');
    }
    // De momento SOLO el español está revisado (dato de estado explícito de esta entrega).
    expect(IDIOMAS_DERECHOS.filter((i) => DERECHOS_520[i].revisado)).toEqual(['es']);
  });
});

describe('IDIOMAS_META', () => {
  it('tiene metadatos para cada idioma con nombre y endónimo no vacíos', () => {
    for (const idioma of IDIOMAS_DERECHOS) {
      const meta = IDIOMAS_META[idioma];
      expect(meta.codigo).toBe(idioma);
      expect(meta.nombre.trim().length).toBeGreaterThan(0);
      expect(meta.endonimo.trim().length).toBeGreaterThan(0);
    }
  });

  it('marca el árabe como RTL y el resto como LTR', () => {
    expect(IDIOMAS_META.ar.rtl).toBe(true);
    for (const idioma of IDIOMAS_DERECHOS.filter((i) => i !== 'ar')) {
      expect(IDIOMAS_META[idioma].rtl).toBe(false);
    }
  });
});

describe('helpers', () => {
  it('derechosPorIdioma devuelve el idioma pedido', () => {
    for (const idioma of IDIOMAS_DERECHOS) {
      expect(derechosPorIdioma(idioma).idioma).toBe(idioma);
    }
  });

  it('derechosPorIdioma cae al español ante un código desconocido', () => {
    // Fuerza un código fuera del conjunto para probar el fallback defensivo.
    const desconocido = 'xx' as IdiomaDerechos;
    expect(derechosPorIdioma(desconocido).idioma).toBe('es');
  });

  it('textoCompleto une todos los apartados en orden y sin perder ninguno', () => {
    for (const idioma of IDIOMAS_DERECHOS) {
      const texto = DERECHOS_520[idioma];
      const completo = textoCompleto(texto);
      for (const clave of APARTADOS_520) {
        expect(completo).toContain(texto.textoNativo[clave]);
      }
      // El orden se respeta: el primer apartado aparece antes que el último.
      const primero = texto.textoNativo[APARTADOS_520[0] as ApartadoDerechos520];
      const ultimo = texto.textoNativo[APARTADOS_520[APARTADOS_520.length - 1] as ApartadoDerechos520];
      expect(completo.indexOf(primero)).toBeLessThan(completo.indexOf(ultimo));
    }
  });
});
