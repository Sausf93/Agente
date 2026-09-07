import type { ComponentType } from 'react';
import { Pressable, Text, View, type ViewStyle } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import type { LucideProps } from 'lucide-react-native';
import { useAppTheme } from '@/ui/useAppTheme';
import { motion } from '@/ui/theme';
import { useReduceMotion } from '@/ui/motion';
import { hapticSelection, hapticSuccess } from '@/ui/haptics';

/**
 * Botón base del sistema visual (02-ui.md §5.6).
 *
 * - `primary`: acción principal, fondo de marca, texto sobre marca.
 * - `secondary`: acción secundaria, contorno de marca sobre superficie (no compite
 *   con la primaria; p. ej. "Enviar a los fundadores" frente a "Guardar").
 *
 * DINAMISMO (alineado con `PressableScale`/`CopyBulletinButton`): al pulsar "se hunde" con una
 * micro-escala (0.97) y vira el color de fondo con una transición corta (`durInstant`), y dispara
 * un háptico SOBRIO (`selection` por defecto; `success` para confirmaciones). Con "reducir
 * movimiento" activo no escala (mantiene el cambio de color y el háptico esencial no depende del
 * movimiento). Acepta un `icon` Lucide opcional a la izquierda del texto (20, `strokeWidth 2`).
 *
 * Alto mínimo 52 pt (`touch.primaryHeight`) para uso con guantes/prisa.
 */
export type ButtonVariant = 'primary' | 'secondary';

export interface ButtonProps {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
  variant?: ButtonVariant;
  /** Icono Lucide opcional a la izquierda del texto (p. ej. `FileDown` en "Generar documento"). */
  icon?: ComponentType<LucideProps>;
  /** Háptico al pulsar: `selection` (por defecto), `success` (confirmaciones) o `none`. */
  haptic?: 'selection' | 'success' | 'none';
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Button({
  title,
  onPress,
  disabled = false,
  variant = 'primary',
  icon: Icon,
  haptic = 'selection',
  accessibilityLabel,
  accessibilityHint,
}: ButtonProps) {
  const t = useAppTheme();
  const reduceMotion = useReduceMotion();
  const isPrimary = variant === 'primary';
  const press = useSharedValue(0);

  const textColor = isPrimary
    ? disabled
      ? t.color.textTertiary
      : t.color.textOnBrand
    : disabled
      ? t.color.textTertiary
      : t.color.brand;

  const animStyle = useAnimatedStyle(() => {
    const scale = reduceMotion || disabled ? 1 : 1 - press.value * 0.03;
    if (isPrimary) {
      return {
        transform: [{ scale }],
        backgroundColor: disabled
          ? t.color.surfaceAlt
          : interpolateColor(press.value, [0, 1], [t.color.brand, t.color.brandPressed]),
      };
    }
    return {
      transform: [{ scale }],
      backgroundColor: interpolateColor(press.value, [0, 1], [t.color.surface, t.color.surfaceAlt]),
    };
  });

  const base: ViewStyle = {
    minHeight: t.touch.primaryHeight,
    borderRadius: t.radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: t.spacing.sm,
    paddingHorizontal: t.spacing.base,
    ...(isPrimary
      ? null
      : { borderWidth: 1, borderColor: disabled ? t.color.border : t.color.brand }),
  };

  function handlePress() {
    if (haptic === 'success') hapticSuccess();
    else if (haptic === 'selection') hapticSelection();
    onPress?.();
  }

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={handlePress}
      onPressIn={() => {
        press.value = withTiming(1, { duration: motion.durInstant });
      }}
      onPressOut={() => {
        press.value = withTiming(0, { duration: motion.durInstant });
      }}
      style={[base, animStyle]}
    >
      {Icon ? (
        <View style={{ marginLeft: -t.spacing.xxs }}>
          <Icon size={20} color={textColor} strokeWidth={2} />
        </View>
      ) : null}
      <Text maxFontSizeMultiplier={1.6} style={{ color: textColor, ...t.typography.scale.bodyStrong }}>
        {title}
      </Text>
    </AnimatedPressable>
  );
}
