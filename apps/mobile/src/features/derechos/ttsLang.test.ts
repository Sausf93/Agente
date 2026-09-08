import { describe, expect, it } from 'vitest';
import { IDIOMAS_DERECHOS, type IdiomaDerechos } from './derechos.js';
import { ttsLang } from './ttsLang.js';

/**
 * Tests del MAPEO idioma → tag BCP-47 del TTS (§4.11 — audio de la lectura de derechos). Fijan el
 * tag esperado para los 14 idiomas de la entrega y la coherencia del formato. No prueban el habla
 * en sí (eso requiere dispositivo): esto es lógica pura y determinista.
 */

describe('ttsLang — mapeo idioma → BCP-47', () => {
  const ESPERADO: Readonly<Record<IdiomaDerechos, string>> = {
    es: 'es-ES',
    ca: 'ca-ES',
    eu: 'eu-ES',
    gl: 'gl-ES',
    en: 'en-US',
    fr: 'fr-FR',
    de: 'de-DE',
    it: 'it-IT',
    pt: 'pt-PT',
    ro: 'ro-RO',
    ru: 'ru-RU',
    uk: 'uk-UA',
    zh: 'zh-CN',
    ar: 'ar-SA',
  };

  it('fija el tag exacto de cada uno de los 14 idiomas', () => {
    for (const idioma of IDIOMAS_DERECHOS) {
      expect(ttsLang(idioma)).toBe(ESPERADO[idioma]);
    }
  });

  it('cubre TODOS los idiomas de la entrega, sin huecos', () => {
    expect(Object.keys(ESPERADO).sort()).toEqual([...IDIOMAS_DERECHOS].sort());
    for (const idioma of IDIOMAS_DERECHOS) {
      expect(ttsLang(idioma).length).toBeGreaterThan(0);
    }
  });

  it('todos los tags tienen forma idioma-REGIÓN (BCP-47 con región)', () => {
    for (const idioma of IDIOMAS_DERECHOS) {
      expect(ttsLang(idioma)).toMatch(/^[a-z]{2}-[A-Z]{2}$/);
    }
  });

  it('las cooficiales usan la región de España (es/ca/eu/gl → *-ES)', () => {
    for (const idioma of ['es', 'ca', 'eu', 'gl'] as IdiomaDerechos[]) {
      expect(ttsLang(idioma).endsWith('-ES')).toBe(true);
    }
  });

  it('usa portugués europeo y chino mandarín simplificado, no otras variantes', () => {
    expect(ttsLang('pt')).toBe('pt-PT');
    expect(ttsLang('zh')).toBe('zh-CN');
  });

  it('cae a es-ES ante un código desconocido (defensivo, como derechosPorIdioma)', () => {
    const desconocido = 'xx' as IdiomaDerechos;
    expect(ttsLang(desconocido)).toBe('es-ES');
  });
});
