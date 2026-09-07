import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { useAppTheme } from '@/ui/useAppTheme';
import { PressableScale } from './PressableScale';

/**
 * Fila de lista PULSABLE (cola de componentes §4.2.5): resultados de búsqueda, hubs, listados.
 *
 * Resuelve el caso que hoy impide reutilizar `Card` con `Link asChild` (una `Card` es un `View`,
 * no admite `onPress`). Toque ≥ 44, estado `pressed`, y separación por borde inferior (en oscuro
 * la sombra no se ve). `title` es la línea principal; `subtitle`/`meta` son secundarias; `right`
 * ocupa el borde derecho (p. ej. el importe o un chip de gravedad).
 */
export interface ListRowProps {
  title: string;
  subtitle?: string;
  /** Nodo a la derecha (chip de gravedad, importe…). */
  right?: ReactNode;
  /** Metadato bajo el título (norma+artículo, etc.). */
  meta?: string;
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export function ListRow({
  title,
  subtitle,
  right,
  meta,
  onPress,
  accessibilityLabel,
  accessibilityHint,
}: ListRowProps) {
  const t = useAppTheme();
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: t.spacing.md,
        minHeight: t.touch.min + 8,
        paddingVertical: t.spacing.md,
        paddingHorizontal: t.spacing.base,
        borderBottomWidth: 1,
        borderBottomColor: t.color.border,
        backgroundColor: t.color.surface,
      }}
    >
      <View style={{ flex: 1, gap: t.spacing.xxs }}>
        <Text
          numberOfLines={2}
          maxFontSizeMultiplier={1.6}
          style={{ color: t.color.textPrimary, ...t.typography.scale.bodyStrong }}
        >
          {title}
        </Text>
        {meta ? (
          <Text
            numberOfLines={1}
            style={{ color: t.color.textSecondary, ...t.typography.scale.caption }}
          >
            {meta}
          </Text>
        ) : null}
        {subtitle ? (
          <Text
            numberOfLines={1}
            style={{ color: t.color.textSecondary, ...t.typography.scale.caption }}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ? <View style={{ alignItems: 'flex-end', gap: t.spacing.xxs }}>{right}</View> : null}
    </PressableScale>
  );
}
