import type { ReactNode } from 'react';
import type { ViewStyle } from 'react-native';
import { View } from 'react-native';
import { useAppTheme } from '@/ui/useAppTheme';

/**
 * Tarjeta base (02-ui.md §4.3, §5). Superficie con borde y radio consistentes en
 * toda la app.
 *
 * PROFUNDIDAD según el modo: en CLARO se añade la sombra sutil `elevation.e1` para dar el aire
 * "premium" y evitar la planitud de "formulario de 2015"; en OSCURO las sombras no se ven sobre
 * negro, así que la separación la sigue dando el borde. Un único componente reviste toda la app.
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
        // Sombra sutil solo en claro (en oscuro no se percibe y ensuciaría el borde).
        ...(t.mode === 'light' ? t.elevation.e1 : null),
        ...style,
      }}
    >
      {children}
    </View>
  );
}
