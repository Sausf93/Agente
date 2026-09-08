import { useCallback, useEffect, useRef, useState } from 'react';
import * as Speech from 'expo-speech';
import type { IdiomaDerechos } from './derechos.js';
import type { ApartadoDerechos520 } from './derechos.js';
import { ttsLang } from './ttsLang.js';

/**
 * AUDIO DE APOYO de la lectura de derechos (§4.11): texto a voz ON-DEVICE con `expo-speech` (TTS
 * del SO, incluido en Expo Go, sin dev build ni ficheros de audio).
 *
 * Este hook AÍSLA todo el trato con expo-speech para que la pantalla no dependa de sus detalles y
 * para centralizar las reglas de robustez:
 *  - Solo puede sonar UNA cosa a la vez: al arrancar una lectura se detiene la anterior.
 *  - Se DETIENE el habla al desmontar la pantalla, al cambiar de idioma y al pulsar "Detener".
 *  - La disponibilidad de voz DEPENDE del dispositivo (euskera, gallego, catalán, árabe pueden no
 *    tener voz instalada): si el motor falla, `onError` resetea el estado sin romper nada.
 *
 * El identificador `SpeechId` distingue si suena el texto COMPLETO (`'todo'`) o un apartado
 * concreto, para que la UI marque el botón activo. Español en el dominio; inglés en el código.
 */
export type SpeechId = 'todo' | ApartadoDerechos520;

export interface DerechosSpeech {
  /** Qué se está reproduciendo ahora (`'todo'` o una clave de apartado), o `null` si nada suena. */
  readonly activo: SpeechId | null;
  /** Arranca (o reinicia) la lectura en voz alta de `texto` en `idioma`, etiquetada con `id`. */
  readonly hablar: (id: SpeechId, texto: string, idioma: IdiomaDerechos) => void;
  /** Detiene cualquier habla en curso. */
  readonly detener: () => void;
}

/**
 * @param idioma Idioma actualmente seleccionado. Al cambiar, se detiene el habla en curso (evita
 *   leer en una voz que ya no corresponde al idioma mostrado).
 */
export function useDerechosSpeech(idioma: IdiomaDerechos): DerechosSpeech {
  const [activo, setActivo] = useState<SpeechId | null>(null);
  // Guarda del último id lanzado: los callbacks de expo-speech pueden llegar tarde; solo aplican
  // si siguen correspondiendo a la reproducción vigente.
  const idActual = useRef<SpeechId | null>(null);

  const detener = useCallback(() => {
    idActual.current = null;
    setActivo(null);
    // `stop()` puede rechazar si no había nada sonando; es inocuo.
    Speech.stop().catch(() => {});
  }, []);

  const hablar = useCallback((id: SpeechId, texto: string, idiomaHabla: IdiomaDerechos) => {
    // Corta lo que hubiera sonando antes de empezar la nueva lectura.
    Speech.stop().catch(() => {});
    idActual.current = id;
    setActivo(id);

    const limpiar = (soloSi: SpeechId) => {
      // Solo apaga el estado si el callback corresponde a la reproducción aún vigente.
      if (idActual.current === soloSi) {
        idActual.current = null;
        setActivo(null);
      }
    };

    Speech.speak(texto, {
      language: ttsLang(idiomaHabla),
      onDone: () => limpiar(id),
      onStopped: () => limpiar(id),
      // Sin voz para ese idioma / error del motor: no rompe, solo vuelve al estado de reposo.
      onError: () => limpiar(id),
    });
  }, []);

  // Detener al cambiar de idioma (no leer en una voz que ya no corresponde a lo mostrado).
  useEffect(() => {
    detener();
    // Solo debe dispararse cuando cambia el idioma.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idioma]);

  // Detener al desmontar la pantalla (no dejar voz sonando al salir).
  useEffect(() => {
    return () => {
      Speech.stop().catch(() => {});
    };
  }, []);

  return { activo, hablar, detener };
}
