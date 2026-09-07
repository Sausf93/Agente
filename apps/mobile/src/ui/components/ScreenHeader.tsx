import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/ui/useAppTheme';

/**
 * Cabecera COMÚN de pantalla (auditoría de pulido, T2). Unifica el ritmo vertical de todas las
 * pestañas/pantallas, que antes resolvían la cabecera a mano y con `paddingTop` distinto (el
 * título "bailaba" al navegar entre pestañas).
 *
 * Reglas fijas: `paddingTop = safe-area + spacing.md`, `paddingBottom = spacing.md`, padding
 * horizontal `spacing.base`, título `titleXL`. `subtitle` opcional en `textSecondary`. `right`
 * ocupa el borde derecho (una acción/insignia). `children` se apila bajo el título dentro del
 * mismo margen horizontal (p. ej. la barra de búsqueda de Buscar o el buscador interno de una
 * norma), para no romper el ritmo.
 */
export interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  /** Nodo a la derecha del título (acción/insignia). */
  right?: ReactNode;
  /** Contenido bajo el título dentro del mismo margen (barra de búsqueda, filtros…). */
  children?: ReactNode;
}

export function ScreenHeader({ title, subtitle, right, children }: ScreenHeaderProps) {
  const t = useAppTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        paddingTop: insets.top + t.spacing.md,
        paddingBottom: t.spacing.md,
        paddingHorizontal: t.spacing.base,
        gap: t.spacing.md,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: t.spacing.md }}>
        <View style={{ flex: 1, gap: t.spacing.xxs }}>
          <Text
            accessibilityRole="header"
            maxFontSizeMultiplier={1.6}
            style={{ color: t.color.textPrimary, ...t.typography.scale.titleXL }}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              maxFontSizeMultiplier={1.6}
              style={{ color: t.color.textSecondary, ...t.typography.scale.body }}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
        {right ? <View style={{ paddingTop: t.spacing.xxs }}>{right}</View> : null}
      </View>
      {children}
    </View>
  );
}
