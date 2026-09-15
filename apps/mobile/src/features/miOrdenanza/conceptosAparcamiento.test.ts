import { describe, expect, it } from 'vitest';
import {
  CONCEPTOS_APARCAMIENTO,
  conceptoDeConsulta,
  conceptoPorId,
} from './conceptosAparcamiento';

describe('conceptoDeConsulta (mi ordenanza: aparcamiento regulado)', () => {
  it('empareja las búsquedas estrella del Local con su concepto', () => {
    expect(conceptoDeConsulta('zona azul')?.id).toBe('zona-azul');
    expect(conceptoDeConsulta('ORA')?.id).toBe('zona-azul');
    expect(conceptoDeConsulta('sin ticket')?.id).toBe('zona-azul');
    expect(conceptoDeConsulta('ticket caducado')?.id).toBe('zona-azul');
    expect(conceptoDeConsulta('carga y descarga')?.id).toBe('carga-descarga');
    expect(conceptoDeConsulta('vado permanente')?.id).toBe('vado');
    expect(conceptoDeConsulta('plaza de minusvalidos')?.id).toBe('reservado-pmr');
  });

  it('es tolerante a tildes/mayúsculas y a tecleo parcial', () => {
    expect(conceptoDeConsulta('ZÓNA AZÚL')?.id).toBe('zona-azul');
    expect(conceptoDeConsulta('zona az')?.id).toBe('zona-azul'); // parcial
    expect(conceptoDeConsulta('aparcar en carga y descarga')?.id).toBe('carga-descarga'); // frase
  });

  it('no empareja consultas ajenas ni demasiado cortas', () => {
    expect(conceptoDeConsulta('alcoholemia')).toBeNull();
    expect(conceptoDeConsulta('movil')).toBeNull();
    expect(conceptoDeConsulta('a')).toBeNull();
  });

  it('conceptoPorId recupera el concepto o null', () => {
    expect(conceptoPorId('zona-azul')?.label).toContain('Zona azul');
    expect(conceptoPorId('inexistente')).toBeNull();
  });
});

describe('boletín orientativo de la ordenanza', () => {
  const zonaAzul = CONCEPTOS_APARCAMIENTO.find((c) => c.id === 'zona-azul')!;

  it('compone la línea con municipio, artículo e importe', () => {
    const texto = zonaAzul.boletin({ importeEur: 30, articulo: '5.2', municipio: 'Santa Cruz de Tenerife' });
    expect(texto).toContain('Santa Cruz de Tenerife');
    expect(texto).toContain('art. 5.2');
    expect(texto).toContain('30 €');
    expect(texto.toLowerCase()).toContain('zona azul');
  });

  it('funciona sin municipio ni artículo (genérico)', () => {
    const texto = zonaAzul.boletin({ importeEur: 200, articulo: null, municipio: null });
    expect(texto).toContain('la ordenanza municipal aplicable');
    expect(texto).toContain('200 €');
    expect(texto).not.toContain('art. ');
  });
});
