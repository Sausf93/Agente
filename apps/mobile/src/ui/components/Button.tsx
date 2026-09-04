import type { ViewStyle } from 'react-native';
import { Pressable, Text } from 'react-native';
import { useAppTheme } from '@/ui/useAppTheme';

/**
 * Botón base del sistema visual (02-ui.md §5.6).
 *
 * - `primary`: acción principal, fondo de marca, texto sobre marca.
 * - `secondary`: acción secundaria, contorno de marca sobre superficie (no compite
 *   con la primaria; p. ej. "Enviar a los fundadores" frente a "Guardar").
 *
 * Alto mínimo 52 pt (`touch.primaryHeight`) para uso con guantes/prisa. El estado
 * `pressed` muta el color (feedback inmediato) y `disabled` baja a superficie tenue.
 * mobile-dev añadirá el háptico de éxito y el icono (Lucide) cuando lleguen.
 */
export type ButtonVariant = 'primary' | 'secondary';

export interface ButtonProps {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
  variant?: ButtonVariant;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export function Button({
  title,
  onPress,
  disabled = false,
  variant = 'primary',
  accessibilityLabel,
  accessibilityHint,
}: ButtonProps) {
  const t = useAppTheme();
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }): ViewStyle => {
        const base: ViewStyle = {
          minHeight: t.touch.primaryHeight,
          borderRadius: t.radius.md,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: t.spacing.base,
        };
        if (isPrimary) {
          return {
            ...base,
            backgroundColor: disabled
              ? t.color.surfaceAlt
              : pressed
                ? t.color.brandPressed
                : t.color.brand,
          };
        }
        return {
          ...base,
          borderWidth: 1,
          borderColor: disabled ? t.color.border : t.color.brand,
          backgroundColor: pressed ? t.color.surfaceAlt : t.color.surface,
        };
      }}
    >
      <Text
        style={{
          color: isPrimary
            ? disabled
              ? t.color.textTertiary
              : t.color.textOnBrand
            : disabled
              ? t.color.textTertiary
              : t.color.brand,
          ...t.typography.scale.bodyStrong,
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}
