import { create } from 'zustand';

/**
 * Estado de AJUSTES locales (ADR-001: todo vive en el dispositivo, sin login).
 *
 * Terreno mínimo para Fase 0. mobile-dev lo persistirá (p. ej. con
 * `expo-sqlite` o almacenamiento seguro) y añadirá cuerpo/territorio del perfil,
 * favoritos, etc. De momento solo lo imprescindible para pintar el tema.
 */

/** Preferencia de tema: sigue el sistema o se fuerza. */
export type ThemePreference = 'system' | 'light' | 'dark';

interface SettingsState {
  /** Preferencia de tema elegida en Ajustes (por defecto, la del sistema). */
  themePreference: ThemePreference;
  /** Feedback háptico activado (algunos agentes lo desactivan — ver UX §4.6). */
  hapticsEnabled: boolean;
  setThemePreference: (preference: ThemePreference) => void;
  setHapticsEnabled: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  themePreference: 'system',
  hapticsEnabled: true,
  setThemePreference: (themePreference) => set({ themePreference }),
  setHapticsEnabled: (hapticsEnabled) => set({ hapticsEnabled }),
}));
