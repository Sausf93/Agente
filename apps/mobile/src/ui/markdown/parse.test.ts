import { describe, expect, it } from 'vitest';
import { parseInline, parseMarkdown } from './parse';

describe('parseInline', () => {
  it('texto plano es un único span sin énfasis', () => {
    expect(parseInline('hola mundo')).toEqual([{ text: 'hola mundo' }]);
  });

  it('detecta negrita, cursiva y código, conservando el texto alrededor', () => {
    expect(parseInline('a **negrita** b')).toEqual([
      { text: 'a ' },
      { text: 'negrita', bold: true },
      { text: ' b' },
    ]);
    expect(parseInline('un *matiz* y `art. 5`')).toEqual([
      { text: 'un ' },
      { text: 'matiz', italic: true },
      { text: ' y ' },
      { text: 'art. 5', code: true },
    ]);
  });

  it('cadena vacía devuelve un span vacío (no rompe el renderer)', () => {
    expect(parseInline('')).toEqual([{ text: '' }]);
  });
});

describe('parseMarkdown', () => {
  it('separa párrafos por línea en blanco y une líneas contiguas', () => {
    const bloques = parseMarkdown('Primera\nlínea.\n\nSegundo párrafo.');
    expect(bloques).toHaveLength(2);
    expect(bloques[0]).toMatchObject({ type: 'paragraph' });
    expect(bloques[1]).toMatchObject({ type: 'paragraph' });
  });

  it('parsea encabezados con su nivel', () => {
    const bloques = parseMarkdown('# Título\n## Sub\n### Menor');
    expect(bloques.map((b) => b.type)).toEqual(['heading', 'heading', 'heading']);
    expect(bloques[0]).toMatchObject({ type: 'heading', level: 1 });
    expect(bloques[1]).toMatchObject({ type: 'heading', level: 2 });
    expect(bloques[2]).toMatchObject({ type: 'heading', level: 3 });
  });

  it('agrupa listas con viñeta y numeradas', () => {
    const conViñeta = parseMarkdown('- uno\n- dos\n- tres');
    expect(conViñeta).toHaveLength(1);
    expect(conViñeta[0]).toMatchObject({ type: 'list', ordered: false });
    if (conViñeta[0].type === 'list') expect(conViñeta[0].items).toHaveLength(3);

    const numerada = parseMarkdown('1. primero\n2. segundo');
    expect(numerada[0]).toMatchObject({ type: 'list', ordered: true });
  });

  it('parsea una tabla de tubería con cabecera y filas', () => {
    const bloques = parseMarkdown('| Tramo | Multa |\n| --- | --- |\n| 0-20 | 100 € |\n| 21-40 | 300 € |');
    expect(bloques).toHaveLength(1);
    const tabla = bloques[0];
    expect(tabla.type).toBe('table');
    if (tabla.type === 'table') {
      expect(tabla.header).toHaveLength(2);
      expect(tabla.rows).toHaveLength(2);
      expect(tabla.rows[0][1][0].text).toBe('100 €');
    }
  });

  it('parsea citas en bloque', () => {
    const bloques = parseMarkdown('> Aviso importante\n> en dos líneas.');
    expect(bloques).toHaveLength(1);
    expect(bloques[0]).toMatchObject({ type: 'quote' });
  });

  it('mezcla encabezado + párrafo + lista sin confundirlos', () => {
    const bloques = parseMarkdown('# Artículo 5\n\nEl conductor debe:\n\n- ir atento\n- respetar la señal');
    expect(bloques.map((b) => b.type)).toEqual(['heading', 'paragraph', 'list']);
  });
});
