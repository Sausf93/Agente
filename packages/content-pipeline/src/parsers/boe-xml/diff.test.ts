import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Articulo } from '@agente/shared';
import { CATALOGO_TRAFICO } from '../../catalogo.js';
import { parseNormaConsolidada } from './parse.js';
import { diffArticulos } from './diff.js';

const AQUI = dirname(fileURLToPath(import.meta.url));
const FIXTURES = resolve(AQUI, '..', '..', '..', 'fixtures');
const textoXml = readFileSync(resolve(FIXTURES, 'rgc-fragmento.xml'), 'utf8');
const metaXml = readFileSync(resolve(FIXTURES, 'rgc-meta.xml'), 'utf8');
const RGC = CATALOGO_TRAFICO.RGC!;

function articulosEn(refYmd: string): Articulo[] {
  return parseNormaConsolidada(textoXml, metaXml, RGC, { fechaReferenciaYmd: refYmd }).articulos;
}

describe('diffArticulos', () => {
  it('sin cambios cuando se compara una consolidación consigo misma', () => {
    const a = articulosEn('20260731');
    const resumen = diffArticulos(a, a);
    expect(resumen.hayCambios).toBe(false);
    expect(resumen.modificados).toBe(0);
    expect(resumen.sinCambio).toBe(a.length);
  });

  it('detecta el art. 5 como modificado entre la redacción de 2004 y la de 2025', () => {
    const anteriores = articulosEn('20240101'); // art. 5 en redacción original
    const nuevos = articulosEn('20260731'); // art. 5 en redacción vigente
    const resumen = diffArticulos(anteriores, nuevos);

    expect(resumen.hayCambios).toBe(true);
    expect(resumen.modificados).toBe(1);
    const cambioArt5 = resumen.cambios.find((c) => c.numero === '5');
    expect(cambioArt5?.tipo).toBe('modificado');
    expect(cambioArt5?.hashAnterior).not.toBe(cambioArt5?.hashNuevo);
  });

  it('clasifica altas y bajas por número de artículo', () => {
    const base = articulosEn('20260731');
    const sinPrimero = base.slice(1); // "elimina" el artículo único
    const resumen = diffArticulos(base, sinPrimero);
    expect(resumen.eliminados).toBe(1);
    expect(resumen.cambios.find((c) => c.tipo === 'eliminado')?.numero).toBe('único');

    const resumenInverso = diffArticulos(sinPrimero, base);
    expect(resumenInverso.nuevos).toBe(1);
    expect(resumenInverso.cambios.find((c) => c.tipo === 'nuevo')?.numero).toBe('único');
  });
});
