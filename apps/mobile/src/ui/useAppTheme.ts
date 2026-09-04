import { useColorScheme } from 'react-native';
import { useSettingsStore } from '@/store/settings';
import { darkTheme, lightTheme, type Theme } from './theme';

// Helper puro reexportado por comodidad (su implementación vive en theme.ts,
// sin dependencia de React Native, para poder testearlo con Vitest).
export { severityFromGravedad } from './theme';

/**
 * Hook de tema de la app. Sigue el esquema del sistema (`useColorScheme`) salvo
 * que Ajustes fuerce claro/oscuro. Por defecto, oscuro de noche lo aporta el
 * propio sistema; si no hay dato, caemos a claro.
 */
export function useAppTheme(): Theme {
  const system = useColorScheme();
  const preference = useSettingsStore((s) => s.themePreference);
  const mode = preference === 'system' ? (system ?? 'light') : preference;
  return mode === 'dark' ? darkTheme : lightTheme;
}
