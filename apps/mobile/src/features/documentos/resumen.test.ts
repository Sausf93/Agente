import { describe, expect, it } from 'vitest';
import { plantillaPorId } from './plantillasSeed';
import { seccionDe } from './campos';
import { origenDesdePrefill, resumenIdentidad, resumenLegal } from './resumen';

const boletin = plantillaPorId('seed-boletin-denuncia')!;
const camposLegales = boletin.campos.filter((c) => !c.esDatoTercero && seccionDe(c) === 'legal');
const camposIdentidad = boletin.campos.filter((c) => !c.esDatoTercero && seccionDe(c) === 'identidad');

describe('resumenLegal', () => {
  it('prerrelleno: resume norma · artículo · gravedad · importe · texto ✓', () => {
    const values = {
      norma: 'RGC',
      articulo: 'art. 18',
      gravedad: 'Muy grave',
      importe: '200 €',
      hecho: 'Circular a 150 km/h',
    };
    expect(resumenLegal(camposLegales, values)).toBe('RGC · art. 18 · Muy grave · 200 € · texto ✓');
  });

  it('vacío (entrada en frío): devuelve cadena vacía', () => {
    expect(resumenLegal(camposLegales, {})).toBe('');
  });

  it('sin texto de hecho: no añade "texto ✓"', () => {
    const values = { norma: 'LSV', articulo: 'art. 77' };
    expect(resumenLegal(camposLegales, values)).toBe('LSV · art. 77');
  });

  it('respeta el orden crítico aunque los valores lleguen desordenados', () => {
    const values = { importe: '500 €', norma: 'LSV', gravedad: 'Grave', articulo: 'art. 65' };
    expect(resumenLegal(camposLegales, values)).toBe('LSV · art. 65 · Grave · 500 €');
  });

  it('solo un campo legal (p. ej. acta con solo precepto) resume ese valor', () => {
    const inmovilizacion = plantillaPorId('seed-acta-inmovilizacion')!;
    const legalesInmov = inmovilizacion.campos.filter(
      (c) => !c.esDatoTercero && seccionDe(c) === 'legal',
    );
    expect(resumenLegal(legalesInmov, { articulo: 'art. 104 LSV' })).toBe('art. 104 LSV');
  });
});

describe('resumenIdentidad', () => {
  it('recordado: resume cuerpo · TIP', () => {
    const values = { cuerpo: 'USC', unidad: 'Puesto de X', numeroTip: '12345' };
    expect(resumenIdentidad(camposIdentidad, values)).toBe('USC · TIP 12345');
  });

  it('cae a la unidad si no hay cuerpo', () => {
    const values = { unidad: 'Puesto de X', numeroTip: '12345' };
    expect(resumenIdentidad(camposIdentidad, values)).toBe('Puesto de X · TIP 12345');
  });

  it('vacío (primera vez): devuelve cadena vacía', () => {
    expect(resumenIdentidad(camposIdentidad, {})).toBe('');
  });

  it('solo cuerpo, sin TIP', () => {
    expect(resumenIdentidad(camposIdentidad, { cuerpo: 'USC' })).toBe('USC');
  });
});

describe('origenDesdePrefill', () => {
  it('prioriza el título corto de la infracción cuando llega', () => {
    expect(origenDesdePrefill({ norma: 'RGC', articulo: 'art. 18' }, 'Exceso de velocidad')).toBe(
      'Exceso de velocidad',
    );
  });

  it('deriva norma · artículo del prefill (vía administrativa)', () => {
    expect(origenDesdePrefill({ norma: 'RGC', articulo: 'art. 18' })).toBe('RGC · art. 18');
  });

  it('usa el amparo en la vía penal (sin norma/artículo)', () => {
    expect(origenDesdePrefill({ amparo: 'LO 4/2015 art. 16' })).toBe('LO 4/2015 art. 16');
  });

  it('sin prefill ni título (entrada en frío): devuelve null', () => {
    expect(origenDesdePrefill(undefined)).toBeNull();
    expect(origenDesdePrefill({})).toBeNull();
  });

  it('ignora un título en blanco y cae al prefill', () => {
    expect(origenDesdePrefill({ norma: 'LSV' }, '   ')).toBe('LSV');
  });
});
