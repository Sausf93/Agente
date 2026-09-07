import { describe, expect, it } from 'vitest';
import {
  buildDocumentHtml,
  escapeHtml,
  inlineToHtml,
  markdownToHtml,
  nombreArchivoSeguro,
} from './html';

describe('nombreArchivoSeguro', () => {
  it('quita acentos, pasa a minúsculas y usa guiones', () => {
    expect(nombreArchivoSeguro('Boletín de Denuncia')).toBe('boletin-de-denuncia');
  });

  it('colapsa símbolos y recorta guiones de los extremos', () => {
    expect(nombreArchivoSeguro('  Acta / inmovilización!! ')).toBe('acta-inmovilizacion');
  });

  it('cae a "documento" si no queda nada utilizable', () => {
    expect(nombreArchivoSeguro('¿?¡!')).toBe('documento');
  });
});

describe('escapeHtml', () => {
  it('escapa los caracteres peligrosos', () => {
    expect(escapeHtml('a & b < c > d " e \' f')).toBe(
      'a &amp; b &lt; c &gt; d &quot; e &#39; f',
    );
  });
});

describe('inlineToHtml', () => {
  it('escapa y aplica negrita', () => {
    expect(inlineToHtml('Importe **200 €** & tasas')).toBe(
      'Importe <strong>200 €</strong> &amp; tasas',
    );
  });

  it('escapa un intento de inyección de marcado del dato del agente', () => {
    expect(inlineToHtml('<script>alert(1)</script>')).toBe(
      '&lt;script&gt;alert(1)&lt;/script&gt;',
    );
  });
});

describe('markdownToHtml', () => {
  it('convierte encabezados de nivel 1 a 3', () => {
    expect(markdownToHtml('# Uno\n## Dos\n### Tres')).toBe(
      '<h1>Uno</h1>\n<h2>Dos</h2>\n<h3>Tres</h3>',
    );
  });

  it('agrupa items de lista en un <ul>', () => {
    expect(markdownToHtml('- Matrícula: 1234\n- Modelo: X')).toBe(
      '<ul><li>Matrícula: 1234</li><li>Modelo: X</li></ul>',
    );
  });

  it('separa párrafos por línea en blanco y respeta saltos con <br/>', () => {
    expect(markdownToHtml('línea uno\nlínea dos\n\notro párrafo')).toBe(
      '<p>línea uno<br/>línea dos</p>\n<p>otro párrafo</p>',
    );
  });

  it('convierte --- en una regla', () => {
    expect(markdownToHtml('texto\n\n---\n\nmás')).toBe('<p>texto</p>\n<hr/>\n<p>más</p>');
  });

  it('escapa el contenido dentro de los bloques', () => {
    expect(markdownToHtml('- <b>x</b> & y')).toBe('<ul><li>&lt;b&gt;x&lt;/b&gt; &amp; y</li></ul>');
  });
});

describe('buildDocumentHtml', () => {
  const html = buildDocumentHtml({
    titulo: 'Boletín & prueba',
    markdown: '# Título\n\nCuerpo con **negrita**.',
    generadoEn: '07/09/2026 10:30',
  });

  it('es un documento HTML completo con el título escapado', () => {
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<title>Boletín &amp; prueba</title>');
  });

  it('incrusta el cuerpo convertido', () => {
    expect(html).toContain('<h1>Título</h1>');
    expect(html).toContain('<strong>negrita</strong>');
  });

  it('incluye el pie fijo de privacidad (device-only) con la fecha', () => {
    expect(html).toContain('no se han enviado a ningún');
    expect(html).toContain('07/09/2026 10:30');
    expect(html).toContain('sin carácter oficial');
  });
});
