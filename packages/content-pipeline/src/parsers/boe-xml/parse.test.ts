import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { Articulo, Norma } from '@agente/shared';
import { CATALOGO_TRAFICO } from '../../catalogo.js';
import { extraerNumeroTitulo, parseMetadatos, parseNormaConsolidada } from './parse.js';

/**
 * Tests DETERMINISTAS del parser BOE con fixture local (NO tocan la red).
 * El fixture `rgc-fragmento.xml` es XML real del RGC recortado a unos pocos preceptos.
 */

const AQUI = dirname(fileURLToPath(import.meta.url));
const FIXTURES = resolve(AQUI, '..', '..', '..', 'fixtures');
const textoXml = readFileSync(resolve(FIXTURES, 'rgc-fragmento.xml'), 'utf8');
const metaXml = readFileSync(resolve(FIXTURES, 'rgc-meta.xml'), 'utf8');
const RGC = CATALOGO_TRAFICO.RGC!;

// Fecha de referencia fija → resultado reproducible independiente de "hoy".
const REF = '20260731';

function parsear() {
  return parseNormaConsolidada(textoXml, metaXml, RGC, { fechaReferenciaYmd: REF });
}

describe('parseMetadatos', () => {
  it('extrae identificador, título, URL y fecha de consolidación', () => {
    const meta = parseMetadatos(metaXml);
    expect(meta.idBoe).toBe('BOE-A-2003-23514');
    expect(meta.titulo).toContain('Reglamento General de Circulación');
    expect(meta.fechaConsolidacion).toBe('2026-07-31');
    expect(meta.urlBoe).toContain('BOE-A-2003-23514');
  });
});

describe('parseNormaConsolidada — norma', () => {
  it('produce una Norma válida con fuente y fecha', () => {
    const { norma } = parsear();
    expect(() => Norma.parse(norma)).not.toThrow();
    expect(norma.codigo).toBe('RGC');
    expect(norma.tipo).toBe('reglamento');
    expect(norma.ambito).toBe('estatal');
    expect(norma.id).toBe('BOE-A-2003-23514');
    expect(norma.fechaConsolidacion).toBe('2026-07-31');
  });

  it('propaga los cuerpos de la entrada del catálogo a la Norma (tráfico, sin PN)', () => {
    const { norma } = parsear();
    expect(norma.cuerpos).toEqual(RGC.cuerpos);
    expect(norma.cuerpos).toContain('guardia_civil');
    expect(norma.cuerpos).toContain('policia_local');
    expect(norma.cuerpos).not.toContain('policia_nacional');
  });
});

describe('parseNormaConsolidada — artículos', () => {
  it('solo convierte preceptos: ignora preámbulo y encabezados', () => {
    const { articulos } = parsear();
    // El fixture tiene 4 preceptos: artículo único, art. 1, art. 5, art. 48.
    expect(articulos.length).toBe(4);
    const numeros = articulos.map((a) => a.numero);
    expect(numeros).toEqual(['único', '1', '5', '48']);
  });

  it('cada artículo pasa el esquema Articulo de @agente/shared', () => {
    const { articulos } = parsear();
    for (const a of articulos) {
      expect(() => Articulo.parse(a)).not.toThrow();
    }
  });

  it('numeración y título: separa número de rúbrica', () => {
    const { articulos } = parsear();
    const art1 = articulos.find((a) => a.numero === '1')!;
    expect(art1.titulo).toBe('Ámbito de aplicación');
    const art5 = articulos.find((a) => a.numero === '5')!;
    expect(art5.titulo).toBe('Señalización de obstáculos y peligros');
  });

  it('el texto no está vacío y no incluye el encabezado del artículo', () => {
    const { articulos } = parsear();
    for (const a of articulos) {
      expect(a.texto.trim().length).toBeGreaterThan(0);
      expect(a.texto).not.toMatch(/^Art[íi]culo\s/);
    }
  });

  it('orden estable y consecutivo desde 0', () => {
    const { articulos } = parsear();
    expect(articulos.map((a) => a.orden)).toEqual([0, 1, 2, 3]);
  });

  it('id determinista por identificador BOE + bloque', () => {
    const { articulos } = parsear();
    expect(articulos.find((a) => a.numero === '5')!.id).toBe('BOE-A-2003-23514:a5');
  });
});

describe('selección de versión vigente', () => {
  it('elige la redacción vigente (2025) del art. 5, no la original de 2004', () => {
    const { articulos } = parsear();
    const art5 = articulos.find((a) => a.numero === '5')!;
    expect(art5.validFrom).toBe('2025-07-01T00:00:00.000Z');
    // La redacción de 2025 remite al "anexo XI del Reglamento General de Vehículos".
    expect(art5.texto).toContain('anexo XI del Reglamento General de Vehículos');
  });

  it('con fecha de referencia anterior a 2025, elige la redacción original de 2004', () => {
    const { articulos } = parseNormaConsolidada(textoXml, metaXml, RGC, {
      fechaReferenciaYmd: '20240101',
    });
    const art5 = articulos.find((a) => a.numero === '5')!;
    expect(art5.validFrom).toBe('2004-01-23T00:00:00.000Z');
    expect(art5.texto).toContain('artículos 130.3, 140 y 173');
  });

  it('descarta la nota editorial de la modificación (no es texto legal)', () => {
    const { articulos } = parsear();
    const art5 = articulos.find((a) => a.numero === '5')!;
    expect(art5.texto).not.toContain('Se modifica el apartado');
    expect(art5.texto).not.toContain('Ref. BOE');
  });
});

describe('conversión de tablas a Markdown', () => {
  it('el art. 48 (velocidades) contiene una tabla Markdown', () => {
    const { articulos } = parsear();
    const art48 = articulos.find((a) => a.numero === '48')!;
    expect(art48.texto).toContain('| --- |');
    expect(art48.texto).toContain('Autopista y autovía');
    expect(art48.texto).toContain('120');
  });
});

describe('hash reproducible', () => {
  it('dos parseos del mismo XML dan el mismo hash por artículo', () => {
    const a = parsear().articulos;
    const b = parsear().articulos;
    expect(a.map((x) => x.hash)).toEqual(b.map((x) => x.hash));
  });
});

describe('extraerNumeroTitulo', () => {
  it('artículo numerado con rúbrica', () => {
    expect(extraerNumeroTitulo('Artículo 11. Uso obligatorio.', 'Artículo 11')).toEqual({
      numero: '11',
      titulo: 'Uso obligatorio',
    });
  });
  it('artículo único', () => {
    expect(
      extraerNumeroTitulo('Artículo único. Aprobación del Reglamento.', 'Artículo único'),
    ).toEqual({ numero: 'único', titulo: 'Aprobación del Reglamento' });
  });
  it('disposición sin prefijo "Artículo"', () => {
    expect(
      extraerNumeroTitulo(
        'Disposición final primera. Título competencial.',
        'Disposición final primera',
      ),
    ).toEqual({ numero: 'Disposición final primera', titulo: 'Título competencial' });
  });
  it('sin línea de artículo: usa el atributo título', () => {
    expect(extraerNumeroTitulo('', 'Artículo 7')).toEqual({ numero: '7', titulo: null });
  });
});
