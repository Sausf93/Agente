import type { ReactNode } from 'react';
import type { ViewStyle } from 'react-native';
import { View } from 'react-native';
import { useAppTheme } from '@/ui/useAppTheme';

/**
 * Tarjeta base (02-ui.md §4.3, §5). Superficie con borde y radio consistentes en
 * toda la app. En oscuro la separación la da el borde (las sombras no se ven sobre
 * negro), por eso el borde es parte del componente y no una sombra.
 */
export interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
}

export function Card({ children, style }: CardProps) {
  const t = useAppTheme();
  return (
    <View
      style={{
        borderRadius: t.radius.md,
        borderWidth: 1,
        borderColor: t.color.border,
        backgroundColor: t.color.surface,
        padding: t.spacing.md,
        gap: t.spacing.xs,
        ...style,
      }}
    >
      {children}
    </View>
  );
}
