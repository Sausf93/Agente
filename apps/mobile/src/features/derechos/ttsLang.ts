/**
 * MAPEO de nuestro código de idioma (`IdiomaDerechos`, ISO 639-1) al tag BCP-47 que espera el
 * motor de texto a voz (TTS) del sistema operativo (§4.11 — audio de apoyo de la lectura de
 * derechos).
 *
 * El TTS del SO (`expo-speech` → AVSpeechSynthesizer en iOS, TextToSpeech en Android) selecciona
 * la voz por un tag de idioma con región (p. ej. `es-ES`, `zh-CN`). Nuestros códigos son de dos
 * letras sin región; aquí se les asigna la región MÁS ADECUADA para el habla peninsular/europea
 * (castellano de España, portugués de Portugal, chino mandarín, etc.).
 *
 * Módulo PURO (sin React Native ni expo-speech): función determinista, testeable con Vitest.
 * Español en el dominio; identificadores en inglés.
 */

import type { IdiomaDerechos } from './derechos.js';

/**
 * Tag BCP-47 (`idioma-REGIÓN`) por cada idioma de la entrega. La región es la preferente para
 * cada lengua en el contexto de intervención en España:
 *  - `es-ES`/`ca-ES`/`eu-ES`/`gl-ES`: castellano y cooficiales, variante de España.
 *  - `pt-PT`: portugués europeo (no brasileño).
 *  - `zh-CN`: chino mandarín simplificado (el texto está en `中文` simplificado).
 *  - `ar-SA`: árabe estándar moderno.
 */
const TTS_LANG_BY_IDIOMA: Readonly<Record<IdiomaDerechos, string>> = {
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

/**
 * Devuelve el tag BCP-47 del TTS para un idioma de la lectura de derechos. Cae a `es-ES` ante un
 * código desconocido (mismo criterio defensivo que `derechosPorIdioma`): el habla nunca queda sin
 * un idioma válido. La disponibilidad REAL de la voz depende del dispositivo (la UI lo advierte).
 */
export function ttsLang(idioma: IdiomaDerechos): string {
  return TTS_LANG_BY_IDIOMA[idioma] ?? 'es-ES';
}
