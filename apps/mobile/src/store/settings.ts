import { create } from 'zustand';
import type { Cuerpo, PoliciaAutonomica } from '@agente/shared';
import {
  getAppFlag,
  loadPerfil,
  savePerfil,
  setAppFlag,
  type PerfilLocal,
  type ThemePreference,
} from '@/db/userDb';

/** Clave de bandera local para el toggle "Vibración" de Ajustes (persistente, ADR-010). */
const FLAG_HAPTICS = 'haptics_enabled';

/**
 * Estado del PERFIL y los AJUSTES locales (ADR-001: todo vive en el dispositivo, sin login).
 *
 * Reúne el perfil (cuerpo, territorio) y las preferencias (tema, háptico) porque juntos definen
 * la apariencia: `useAppTheme` resuelve el tema activo = `mode` (de `tema`) × `cuerpo`. Se
 * hidrata desde SQLite (`userDb`, tabla `perfil`) al arrancar y se persiste en cada cambio, de
 * forma que sobrevive a reinicios y actualizaciones (ADR-010). El flag `onboarded` es el gate de
 * la primera apertura. Nada de esto viaja nunca a un servidor.
 */

export type { ThemePreference };

/** Datos que fija el onboarding al terminar. */
export interface OnboardingData {
  cuerpo: Cuerpo;
  policiaAutonomica: PoliciaAutonomica | null;
  ccaaId: string | null;
  provinciaId: string | null;
  municipioId: string | null;
  municipioNombre: string | null;
}

interface SettingsState extends PerfilLocal {
  /** ¿Se ha hidratado ya el perfil desde el dispositivo? Evita parpadeos de tema/gate. */
  loaded: boolean;
  /** Feedback háptico activado (algunos agentes lo desactivan — ver UX §4.6). */
  hapticsEnabled: boolean;

  hydrate: () => Promise<void>;
  setThemePreference: (tema: ThemePreference) => Promise<void>;
  setHapticsEnabled: (enabled: boolean) => void;
  /** Cambia el cuerpo (y, si aplica, la autonómica concreta). Re-tiñe la app en caliente. */
  setCuerpo: (cuerpo: Cuerpo, policiaAutonomica?: PoliciaAutonomica | null) => Promise<void>;
  /** Cambia el territorio (CCAA/provincia/municipio) desde Ajustes. */
  setTerritorio: (t: {
    ccaaId: string | null;
    provinciaId: string | null;
    municipioId: string | null;
    municipioNombre: string | null;
  }) => Promise<void>;
  /** Cierra el onboarding: guarda todo el perfil y marca `onboarded`. */
  completeOnboarding: (data: OnboardingData) => Promise<void>;
}

/** Perfil por defecto (antes de hidratar / sin datos): neutro, sin cuerpo, tema del sistema. */
const PERFIL_VACIO: PerfilLocal = {
  cuerpo: null,
  policiaAutonomica: null,
  ccaaId: null,
  provinciaId: null,
  municipioId: null,
  municipioNombre: null,
  tema: 'system',
  onboarded: false,
};

/** Extrae la parte persistible (PerfilLocal) del estado actual. */
function perfilDe(s: SettingsState): PerfilLocal {
  return {
    cuerpo: s.cuerpo,
    policiaAutonomica: s.policiaAutonomica,
    ccaaId: s.ccaaId,
    provinciaId: s.provinciaId,
    municipioId: s.municipioId,
    municipioNombre: s.municipioNombre,
    tema: s.tema,
    onboarded: s.onboarded,
  };
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...PERFIL_VACIO,
  loaded: false,
  hapticsEnabled: true,

  hydrate: async () => {
    const [perfil, hapticsFlag] = await Promise.all([loadPerfil(), getAppFlag(FLAG_HAPTICS)]);
    // La háptica está activada por defecto; solo se apaga si el agente lo guardó explícitamente.
    const hapticsEnabled = hapticsFlag !== '0';
    if (perfil) {
      set({ ...perfil, hapticsEnabled, loaded: true });
    } else {
      set({ hapticsEnabled, loaded: true });
    }
  },

  setThemePreference: async (tema) => {
    set({ tema });
    await savePerfil(perfilDe(get()), new Date().toISOString());
  },

  setHapticsEnabled: (hapticsEnabled) => {
    set({ hapticsEnabled });
    void setAppFlag(FLAG_HAPTICS, hapticsEnabled ? '1' : '0');
  },

  setCuerpo: async (cuerpo, policiaAutonomica = null) => {
    set({ cuerpo, policiaAutonomica: cuerpo === 'policia_autonomica' ? policiaAutonomica : null });
    await savePerfil(perfilDe(get()), new Date().toISOString());
  },

  setTerritorio: async (territorio) => {
    set(territorio);
    await savePerfil(perfilDe(get()), new Date().toISOString());
  },

  completeOnboarding: async (data) => {
    set({
      cuerpo: data.cuerpo,
      policiaAutonomica: data.policiaAutonomica,
      ccaaId: data.ccaaId,
      provinciaId: data.provinciaId,
      municipioId: data.municipioId,
      municipioNombre: data.municipioNombre,
      onboarded: true,
    });
    await savePerfil(perfilDe(get()), new Date().toISOString());
  },
}));
