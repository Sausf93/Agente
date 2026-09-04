/**
 * theme.ts — Design tokens de "Agente".
 *
 * Fuente: `docs/perspectivas/02-ui.md` (sistema visual). Español en el dominio,
 * inglés en los identificadores de código.
 *
 * Reglas de diseño que estos tokens hacen cumplir:
 *  - La gravedad NUNCA se comunica solo con color: siempre color + texto + icono
 *    (ver `severity` y `severityMeta`).
 *  - Modo oscuro por defecto de noche (sigue `Appearance` del sistema; Ajustes
 *    puede forzar claro/oscuro — ver `useAppTheme` en `useAppTheme.ts`).
 *  - Cuerpo mínimo 16 pt, toque mínimo 44 pt (contexto de calle/coche/guantes).
 *
 * Uso: `import { lightTheme, darkTheme, type Theme } from '@/ui/theme';`
 */

import type { Gravedad } from '@agente/shared';

export const palette = {
  // Neutros (grises fríos, ligerísimo tinte azul para armonizar con la marca)
  neutral0: '#FFFFFF',
  neutral50: '#F6F7F9',
  neutral100: '#ECEEF2',
  neutral200: '#DBDFE6',
  neutral300: '#C2C8D2',
  neutral400: '#98A1B0',
  neutral500: '#6B7482',
  neutral600: '#4A515D',
  neutral700: '#333A45',
  neutral800: '#1E232B',
  neutral900: '#12151A',
  neutral950: '#0A0C10',

  // Marca (azul pizarra desaturado — serio, no institucional)
  brand300: '#8FB0E6',
  brand400: '#5C86D6',
  brand500: '#2E5AAC',
  brand600: '#254A8F',
  brand700: '#1B3A73',

  // Semánticos de estado
  success: '#1E7F4F',
  successDark: '#3FBE83',
  info: '#2E5AAC',
  infoDark: '#8FB0E6',
  warning: '#C25E00',
  warningDark: '#F08A24',
  danger: '#C1272D',
  dangerDark: '#F0555B',
} as const;

/** Gravedad: siempre color + texto + icono (NUNCA solo color). */
export const severity = {
  leve: {
    light: { solid: '#B8860B', fg: '#6B4E00', bg: '#FFF4D6' },
    dark: { solid: '#E0A82E', fg: '#F4D58A', bg: '#3A2E0A' },
  },
  grave: {
    light: { solid: '#C25E00', fg: '#7A3B00', bg: '#FFE7D1' },
    dark: { solid: '#F08A24', fg: '#FBC38A', bg: '#3A2410' },
  },
  muyGrave: {
    light: { solid: '#C1272D', fg: '#7A1418', bg: '#FCE0E1' },
    dark: { solid: '#F0555B', fg: '#FBB0B3', bg: '#3A1113' },
  },
  delito: {
    light: { solid: '#8E1B4E', fg: '#5C0E33', bg: '#F7DBE8' },
    dark: { solid: '#D6558C', fg: '#F2AFCC', bg: '#33101F' },
  },
} as const;

/**
 * Clave visual de gravedad usada por la UI. Coincide 1:1 con el enum de dominio
 * `Gravedad` de `@agente/shared` (`leve | grave | muy_grave | delito`) salvo el
 * camelCase de `muyGrave`. La conversión vive en `severityFromGravedad`.
 */
export type Severity = keyof typeof severity;

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  huge: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const touch = {
  min: 44, // suelo táctil
  primaryHeight: 52,
  searchHeight: 56,
  chipHeight: 32,
  tabHeight: 56,
} as const;

/** Tipografía — tamaños en pt (dp). Cuerpo mínimo 16. */
export const typography = {
  fontFamily: undefined as string | undefined, // hereda del sistema (SF / Roboto)
  numeric: { fontVariant: ['tabular-nums' as const] },
  scale: {
    displayL: { fontSize: 34, fontWeight: '700', lineHeight: 40 },
    titleXL: { fontSize: 28, fontWeight: '700', lineHeight: 34 },
    titleL: { fontSize: 22, fontWeight: '600', lineHeight: 28 },
    titleM: { fontSize: 20, fontWeight: '600', lineHeight: 26 },
    bodyL: { fontSize: 18, fontWeight: '400', lineHeight: 26 },
    body: { fontSize: 16, fontWeight: '400', lineHeight: 24 }, // mínimo
    bodyStrong: { fontSize: 16, fontWeight: '600', lineHeight: 24 },
    label: { fontSize: 15, fontWeight: '600', lineHeight: 20 },
    caption: { fontSize: 14, fontWeight: '400', lineHeight: 18 },
  },
} as const;

export const motion = {
  durInstant: 100,
  durFast: 180,
  durBase: 240,
  easeStd: [0.2, 0, 0, 1] as const,
  easeOut: [0, 0, 0, 1] as const,
} as const;

/** Elevación (iOS shadow + Android elevation). En oscuro se apoya en borde+superficie. */
export const elevation = {
  e1: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  e2: { shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  e3: { shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 24, shadowOffset: { width: 0, height: 10 }, elevation: 12 },
} as const;

/** Tokens semánticos por modo (lo que consumen los componentes). */
const lightSemantic = {
  bg: palette.neutral50,
  surface: palette.neutral0,
  surfaceAlt: palette.neutral100,
  border: palette.neutral200,
  textPrimary: palette.neutral800,
  textSecondary: palette.neutral500,
  textTertiary: palette.neutral400,
  brand: palette.brand500,
  brandPressed: palette.brand600,
  textOnBrand: '#FFFFFF',
  focusRing: palette.brand500,
  success: palette.success,
  successBg: '#DAF3E6',
  info: palette.info,
  infoBg: '#E4ECF9',
  warning: palette.warning,
  warningBg: '#FDEBD8',
  danger: palette.danger,
  dangerBg: '#FCE0E1',
} as const;

const darkSemantic = {
  bg: palette.neutral900,
  surface: palette.neutral800,
  surfaceAlt: '#252B34',
  border: '#2C333D',
  textPrimary: '#F2F4F7',
  textSecondary: palette.neutral400,
  textTertiary: palette.neutral500,
  brand: palette.brand300,
  brandPressed: palette.brand400,
  textOnBrand: palette.neutral950,
  focusRing: palette.brand300,
  success: palette.successDark,
  successBg: '#0F2E20',
  info: palette.infoDark,
  infoBg: '#132338',
  warning: palette.warningDark,
  warningBg: '#3A2410',
  danger: palette.dangerDark,
  dangerBg: '#3A1113',
} as const;

type SeverityColors = { solid: string; fg: string; bg: string };

function severityForMode(mode: 'light' | 'dark'): Record<Severity, SeverityColors> {
  return {
    leve: severity.leve[mode],
    grave: severity.grave[mode],
    muyGrave: severity.muyGrave[mode],
    delito: severity.delito[mode],
  };
}

/**
 * Forma del tema que consumen los componentes. Los literales de color se ensanchan
 * a `string` para que claro y oscuro compartan tipo; el resto de tokens conservan
 * sus tipos precisos (p. ej. `fontWeight` que React Native exige literal).
 */
export interface Theme {
  mode: 'light' | 'dark';
  color: Record<keyof typeof lightSemantic, string>;
  severity: Record<Severity, SeverityColors>;
  palette: typeof palette;
  spacing: typeof spacing;
  radius: typeof radius;
  touch: typeof touch;
  typography: typeof typography;
  motion: typeof motion;
  elevation: typeof elevation;
}

export const lightTheme: Theme = {
  mode: 'light',
  color: lightSemantic,
  severity: severityForMode('light'),
  palette,
  spacing,
  radius,
  touch,
  typography,
  motion,
  elevation,
};

export const darkTheme: Theme = {
  mode: 'dark',
  color: darkSemantic,
  severity: severityForMode('dark'),
  palette,
  spacing,
  radius,
  touch,
  typography,
  motion,
  elevation,
};

/**
 * Puente entre el enum de dominio `Gravedad` (@agente/shared, snake_case) y la
 * clave visual `Severity` (camelCase) del tema. Único punto de conversión. Es
 * lógica pura (sin React Native), por eso vive aquí y no en el hook.
 */
export function severityFromGravedad(gravedad: Gravedad): Severity {
  return gravedad === 'muy_grave' ? 'muyGrave' : gravedad;
}

/** Etiquetas e iconos por gravedad — refuerzan que NUNCA es solo color (regla UI 2.4). */
export const severityMeta: Record<Severity, { label: string; icon: string; a11y: string }> = {
  leve: { label: 'Leve', icon: 'info', a11y: 'Gravedad: leve' },
  grave: { label: 'Grave', icon: 'triangle-alert', a11y: 'Gravedad: grave' },
  muyGrave: { label: 'Muy grave', icon: 'triangle-alert', a11y: 'Gravedad: muy grave' },
  delito: { label: 'Delito', icon: 'gavel', a11y: 'Tipo: delito, vía penal' },
};
