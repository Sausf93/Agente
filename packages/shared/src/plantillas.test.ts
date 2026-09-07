import { describe, expect, it } from 'vitest';
import { extraerVariables, renderPlantilla } from './plantillas.js';

describe('extraerVariables', () => {
  it('extrae las claves en orden de aparición y sin repetir', () => {
    const md = 'En {{lugar}}, a {{fecha}} a las {{hora}}. Lugar: {{lugar}}.';
    expect(extraerVariables(md)).toEqual(['lugar', 'fecha', 'hora']);
  });

  it('tolera espacios dentro de las llaves', () => {
    expect(extraerVariables('Hola {{  nombre  }}')).toEqual(['nombre']);
  });

  it('acepta claves con punto, guion y guion bajo', () => {
    expect(extraerVariables('{{art.numero}} {{norma-codigo}} {{unidad_texto}}')).toEqual([
      'art.numero',
      'norma-codigo',
      'unidad_texto',
    ]);
  });

  it('devuelve vacío si no hay variables', () => {
    expect(extraerVariables('Texto legal fijo, sin huecos.')).toEqual([]);
  });
});

describe('renderPlantilla', () => {
  it('sustituye las variables por sus valores', () => {
    const { texto, camposFaltantes } = renderPlantilla(
      'Denuncia en {{lugar}} el {{fecha}}.',
      { lugar: 'Murcia', fecha: '2026-09-07' },
    );
    expect(texto).toBe('Denuncia en Murcia el 2026-09-07.');
    expect(camposFaltantes).toEqual([]);
  });

  it('tolera espacios en las llaves y acepta números', () => {
    const { texto } = renderPlantilla('Importe: {{ importe }} €', { importe: 200 });
    expect(texto).toBe('Importe: 200 €');
  });

  it('marca los campos faltantes con el marcador y los reporta (sin repetir)', () => {
    const { texto, camposFaltantes } = renderPlantilla(
      'A las {{hora}} en {{lugar}}. Confirmar {{lugar}}.',
      { hora: '' },
    );
    expect(texto).toBe('A las __________ en __________. Confirmar __________.');
    expect(camposFaltantes).toEqual(['hora', 'lugar']);
  });

  it('trata null y undefined como huecos vacíos', () => {
    const { camposFaltantes } = renderPlantilla('{{a}}{{b}}', { a: null, b: undefined });
    expect(camposFaltantes).toEqual(['a', 'b']);
  });

  it('permite personalizar el marcador vacío', () => {
    const { texto } = renderPlantilla('Firma: {{firma}}', {}, '');
    expect(texto).toBe('Firma: ');
  });

  it('NO reescanea el valor inyectado (escape): un valor con {{...}} se imprime literal', () => {
    const { texto, camposFaltantes } = renderPlantilla('Nota: {{nota}}', {
      nota: 'ver {{lugar}} y {{fecha}}',
    });
    expect(texto).toBe('Nota: ver {{lugar}} y {{fecha}}');
    // No aparece "lugar"/"fecha" como faltante: no se han vuelto a interpretar.
    expect(camposFaltantes).toEqual([]);
  });

  it('una sola pasada: dos variables no se pisan entre sí', () => {
    const { texto } = renderPlantilla('{{x}}-{{y}}', { x: '{{y}}', y: 'Z' });
    expect(texto).toBe('{{y}}-Z');
  });
});
