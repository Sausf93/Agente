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

import type { Cuerpo, Gravedad, PoliciaAutonomica } from '@agente/shared';

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
  // Acento por cuerpo (elegido en onboarding). Por defecto = marca neutra. `resolveTheme`
  // sobrescribe brand/brandPressed/textOnBrand/focusRing + estos tres con el acento activo,
  // de modo que TODO componente que ya lee `color.brand` hereda el acento sin cambios.
  accent: palette.brand500,
  accentWeak: '#E4ECF9',
  accentOn: '#FFFFFF',
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
  accent: palette.brand300,
  accentWeak: '#132338',
  accentOn: palette.neutral950,
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

// ---------------------------------------------------------------------------
// Acento por cuerpo (sistema visual v2, §1.2) — NO toca la gravedad ni los neutros.
// ---------------------------------------------------------------------------

/** Trio de acento para un modo: color de acción, estado presionado y color del texto encima. */
export interface AccentTokens {
  accent: string;
  pressed: string;
  on: string;
}

/**
 * Clave interna de acento por cuerpo (camelCase, propia del tema). Las cuatro `autonomica*`
 * son MATICES dentro de la misma familia violeta (§1.2): cada cuerpo autonómico ve un tono
 * propio pero reconociblemente "autonómico". `autonomica` (genérico) es el fallback cuando
 * aún no se ha elegido la autonómica concreta.
 */
export type CuerpoAccent =
  | 'guardiaCivil'
  | 'policiaNacional'
  | 'policiaLocal'
  | 'autonomica'
  | 'autonomicaMossos'
  | 'autonomicaErtzaintza'
  | 'autonomicaForal'
  | 'autonomicaCanaria';

/**
 * Tabla de acentos por cuerpo (claro y oscuro), tomada de `docs/diseno/sistema-visual.md`
 * §1.2. Tonos SOBRIOS y desaturados, deliberadamente distintos del color institucional exacto
 * (restricción legal: la app no puede parecer oficial). Contraste AA verificado en la tabla.
 * Las autonómicas comparten familia violeta con matices de tono (magenta, violeta, ciruela,
 * azul-violeta) para distinguir cuerpos sin romper la coherencia del sistema.
 */
export const accentByCuerpo: Record<CuerpoAccent, { light: AccentTokens; dark: AccentTokens }> = {
  guardiaCivil: {
    light: { accent: '#2E6A4E', pressed: '#245840', on: '#FFFFFF' },
    dark: { accent: '#6FC79B', pressed: '#4FA97D', on: '#0A0C10' },
  },
  policiaNacional: {
    light: { accent: '#1F3A63', pressed: '#172C4B', on: '#FFFFFF' },
    dark: { accent: '#7FA4D6', pressed: '#4E79B5', on: '#0A0C10' },
  },
  policiaLocal: {
    light: { accent: '#0B7597', pressed: '#095E79', on: '#FFFFFF' },
    dark: { accent: '#4FC4E6', pressed: '#2AA6C8', on: '#0A0C10' },
  },
  // Genérico autonómico (fallback sin autonómica concreta): violeta neutro.
  autonomica: {
    light: { accent: '#6A4E9C', pressed: '#574080', on: '#FFFFFF' },
    dark: { accent: '#B49BE8', pressed: '#8F79CC', on: '#0A0C10' },
  },
  // Matices por cuerpo autonómico (misma familia violeta; AA verificado).
  autonomicaMossos: {
    light: { accent: '#9A3F7E', pressed: '#7F3268', on: '#FFFFFF' },
    dark: { accent: '#E294C6', pressed: '#C877B0', on: '#0A0C10' },
  },
  autonomicaErtzaintza: {
    light: { accent: '#5A45A0', pressed: '#493784', on: '#FFFFFF' },
    dark: { accent: '#B79BEC', pressed: '#9C7FD6', on: '#0A0C10' },
  },
  autonomicaForal: {
    light: { accent: '#7E4A6E', pressed: '#663B58', on: '#FFFFFF' },
    dark: { accent: '#CF9BC4', pressed: '#B87FAC', on: '#0A0C10' },
  },
  autonomicaCanaria: {
    light: { accent: '#3D5AA0', pressed: '#314A84', on: '#FFFFFF' },
    dark: { accent: '#8FA4EA', pressed: '#7488D0', on: '#0A0C10' },
  },
};

/** Acento concreto por cuerpo autonómico (matiz propio dentro de la familia violeta). */
const ACCENT_KEY_BY_AUTONOMICA: Record<PoliciaAutonomica, CuerpoAccent> = {
  mossos: 'autonomicaMossos',
  ertzaintza: 'autonomicaErtzaintza',
  policia_foral: 'autonomicaForal',
  policia_canaria: 'autonomicaCanaria',
};

/** Acento por DEFECTO (antes de elegir cuerpo o tras un reset): la marca neutra azul pizarra. */
export const accentDefault: { light: AccentTokens; dark: AccentTokens } = {
  light: { accent: palette.brand500, pressed: palette.brand600, on: '#FFFFFF' },
  dark: { accent: palette.brand300, pressed: palette.brand400, on: palette.neutral950 },
};

/**
 * Traduce el enum de dominio `Cuerpo` (@agente/shared, snake_case) a la clave de acento del
 * tema, SIN distinguir la autonómica concreta: `policia_autonomica` → `autonomica` (genérico).
 * Para diferenciar Mossos/Ertzaintza/Foral/Canaria, usa `accentKeyFor`. `null`/desconocido →
 * sin acento (marca neutra por defecto).
 */
export function accentKeyFromCuerpo(cuerpo: Cuerpo | null | undefined): CuerpoAccent | null {
  switch (cuerpo) {
    case 'guardia_civil':
      return 'guardiaCivil';
    case 'policia_nacional':
      return 'policiaNacional';
    case 'policia_local':
      return 'policiaLocal';
    case 'policia_autonomica':
      return 'autonomica';
    default:
      return null;
  }
}

/**
 * Clave de acento teniendo en cuenta la autonómica CONCRETA: si el cuerpo es `policia_autonomica`
 * y se conoce cuál (Mossos, Ertzaintza, Foral, Canaria), devuelve su matiz propio; si no se sabe,
 * cae al violeta genérico `autonomica`. Para el resto de cuerpos, igual que `accentKeyFromCuerpo`.
 */
export function accentKeyFor(
  cuerpo: Cuerpo | null | undefined,
  policiaAutonomica: PoliciaAutonomica | null | undefined,
): CuerpoAccent | null {
  if (cuerpo === 'policia_autonomica' && policiaAutonomica) {
    return ACCENT_KEY_BY_AUTONOMICA[policiaAutonomica];
  }
  return accentKeyFromCuerpo(cuerpo);
}

/**
 * Mezcla dos colores hex `#RRGGBB`. `ratioA` es la proporción del primero (0..1). Pura y sin
 * dependencias de RN, para poder testearla y precalcular `accentWeak` (tinte de la pastilla de
 * la pestaña activa) sin recurrir a canales alfa.
 */
export function mixHex(a: string, b: string, ratioA: number): string {
  const clamp = Math.max(0, Math.min(1, ratioA));
  const pa = parseHex(a);
  const pb = parseHex(b);
  const mix = (x: number, y: number) => Math.round(x * clamp + y * (1 - clamp));
  const to2 = (n: number) => n.toString(16).padStart(2, '0');
  return `#${to2(mix(pa[0], pb[0]))}${to2(mix(pa[1], pb[1]))}${to2(mix(pa[2], pb[2]))}`.toUpperCase();
}

function parseHex(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

/**
 * Resuelve el tema ACTIVO = `mode` (claro/oscuro) × `cuerpo`. Devuelve el tema base neutro con
 * `brand`/`brandPressed`/`textOnBrand`/`focusRing` (y `accent`/`accentWeak`/`accentOn`)
 * sobrescritos por el acento del cuerpo. La GRAVEDAD, los neutros, la tipografía y el espaciado
 * NO cambian nunca con el cuerpo (regla innegociable del sistema visual §1.3).
 */
export function resolveTheme(
  mode: 'light' | 'dark',
  cuerpo: Cuerpo | null,
  policiaAutonomica: PoliciaAutonomica | null = null,
): Theme {
  const base = mode === 'dark' ? darkTheme : lightTheme;
  const key = accentKeyFor(cuerpo, policiaAutonomica);
  const a = key ? accentByCuerpo[key][mode] : accentDefault[mode];
  // Tinte débil = mezcla del acento con la superficie (14 % claro / 22 % oscuro).
  const accentWeak = mixHex(a.accent, base.color.surface, mode === 'dark' ? 0.22 : 0.14);
  return {
    ...base,
    color: {
      ...base.color,
      brand: a.accent,
      brandPressed: a.pressed,
      textOnBrand: a.on,
      focusRing: a.accent,
      accent: a.accent,
      accentWeak,
      accentOn: a.on,
    },
  };
}
