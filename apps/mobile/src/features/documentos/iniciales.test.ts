import { describe, expect, it } from 'vitest';
import { plantillaPorId } from './plantillasSeed';
import { formatearFecha, formatearHora, valoresIniciales, valoresRecordables } from './iniciales';

const AHORA = new Date(2026, 8, 7, 9, 5); // 07/09/2026 09:05 (mes 0-based)

describe('formateo de fecha/hora', () => {
  it('formatea fecha dd/mm/aaaa y hora hh:mm con ceros a la izquierda', () => {
    expect(formatearFecha(AHORA)).toBe('07/09/2026');
    expect(formatearHora(AHORA)).toBe('09:05');
  });
});

describe('valoresIniciales', () => {
  const boletin = plantillaPorId('seed-boletin-denuncia')!;

  it('rellena fecha y hora con "ahora" por defecto', () => {
    const v = valoresIniciales(boletin, {}, {}, AHORA);
    expect(v.fecha).toBe('07/09/2026');
    expect(v.hora).toBe('09:05');
  });

  it('aplica los valores recordados a los campos del agente marcados recordar', () => {
    const v = valoresIniciales(boletin, { unidad: 'Puesto de X', cuerpo: 'Unidad Y' }, {}, AHORA);
    expect(v.unidad).toBe('Puesto de X');
    expect(v.cuerpo).toBe('Unidad Y');
  });

  it('aplica el prefill de la ficha a campos del agente (norma, artículo, importe)', () => {
    const v = valoresIniciales(
      boletin,
      {},
      { norma: 'RGC', articulo: 'art. 18', importe: '200 €' },
      AHORA,
    );
    expect(v.norma).toBe('RGC');
    expect(v.articulo).toBe('art. 18');
    expect(v.importe).toBe('200 €');
  });

  it('el documento nace de la ficha: el bloque legal (hecho, gravedad, puntos) llega relleno', () => {
    const v = valoresIniciales(
      boletin,
      {},
      { hecho: 'Circular a 150 km/h', gravedad: 'Muy grave', puntos: '6' },
      AHORA,
    );
    expect(v.hecho).toBe('Circular a 150 km/h');
    expect(v.gravedad).toBe('Muy grave');
    expect(v.puntos).toBe('6');
  });

  it('NUNCA prerrellena datos de terceros, ni desde prefill ni desde recordado', () => {
    const v = valoresIniciales(
      boletin,
      { matricula: '1234ABC', denunciado: 'Fulano' },
      { matricula: '5678XYZ', documento: '00000000X' },
      AHORA,
    );
    expect(v.matricula).toBe('');
    expect(v.denunciado).toBe('');
    expect(v.documento).toBe('');
  });
});

describe('valoresRecordables', () => {
  it('devuelve solo los campos del agente marcados recordar (cuerpo, unidad, nº TIP)', () => {
    const boletin = plantillaPorId('seed-boletin-denuncia')!;
    const recordables = valoresRecordables(boletin, {
      cuerpo: 'Unidad Y',
      unidad: 'Puesto X',
      numeroTip: '12345',
      lugar: 'Calle Mayor',
      matricula: '1234ABC',
    });
    expect(recordables).toEqual({ cuerpo: 'Unidad Y', unidad: 'Puesto X', numeroTip: '12345' });
  });

  it('nunca recuerda datos de terceros aunque llegue el nº TIP del agente', () => {
    const boletin = plantillaPorId('seed-boletin-denuncia')!;
    const recordables = valoresRecordables(boletin, {
      numeroTip: '99999',
      denunciado: 'Fulano',
      documento: '00000000X',
    });
    expect(recordables).toEqual({ numeroTip: '99999' });
  });
});
