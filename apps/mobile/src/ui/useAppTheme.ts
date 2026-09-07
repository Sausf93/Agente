import { useColorScheme } from 'react-native';
import { useSettingsStore } from '@/store/settings';
import { resolveTheme, type Theme } from './theme';

// Helper puro reexportado por comodidad (su implementación vive en theme.ts,
// sin dependencia de React Native, para poder testearlo con Vitest).
export { severityFromGravedad } from './theme';

/**
 * Hook de tema de la app. Resuelve el tema ACTIVO = `mode` (claro/oscuro) × `cuerpo`:
 *
 *  - `mode` sale de la preferencia del perfil (`tema`): 'system' sigue `useColorScheme()`
 *    del teléfono; 'light'/'dark' lo fuerzan. Por defecto, 'system' (oscuro de noche lo
 *    aporta el propio sistema).
 *  - `cuerpo` (elegido en el onboarding, persistido en el perfil) determina el ACENTO que
 *    sustituye a `brand`. Sin cuerpo aún, el acento es la marca neutra (arranque neutro).
 *
 * `resolveTheme` es lógica pura y testeable; aquí solo se conecta con el estado reactivo.
 */
export function useAppTheme(): Theme {
  const system = useColorScheme();
  const tema = useSettingsStore((s) => s.tema);
  const cuerpo = useSettingsStore((s) => s.cuerpo);
  const policiaAutonomica = useSettingsStore((s) => s.policiaAutonomica);
  const mode: 'light' | 'dark' = tema === 'system' ? (system === 'dark' ? 'dark' : 'light') : tema;
  return resolveTheme(mode, cuerpo, policiaAutonomica);
}
