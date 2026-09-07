import type { ReactNode } from 'react';
import type { AccessibilityRole, ViewStyle } from 'react-native';
import { Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { motion } from '@/ui/theme';
import { useReduceMotion } from '@/ui/motion';

/**
 * Superficie pulsable con FEEDBACK de pulsado global (mejoras-usabilidad P0-5): al presionar
 * "se hunde" levemente (escala 0.97 + baja de opacidad), con una transición muy corta
 * (`durInstant`). Reutilizable en filas y tarjetas para que TODO reaccione al dedo de forma
 * consistente.
 *
 * Anima solo `transform`/`opacity` (barato, en el hilo de UI). Con "reducir movimiento" activo
 * no escala: mantiene la pulsación pero sin desplazamiento (el `Pressable` sigue dando su
 * feedback de estado). No sustituye nunca al feedback visual del contenido.
 */
export interface PressableScaleProps {
  children: ReactNode;
  onPress?: (() => void) | undefined;
  style?: ViewStyle | undefined;
  disabled?: boolean | undefined;
  accessibilityRole?: AccessibilityRole | undefined;
  accessibilityLabel?: string | undefined;
  accessibilityHint?: string | undefined;
  accessibilityState?: { selected?: boolean; disabled?: boolean; expanded?: boolean } | undefined;
  /** Escala mínima al presionar (por defecto 0.97). */
  activeScale?: number | undefined;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function PressableScale({
  children,
  onPress,
  style,
  disabled = false,
  accessibilityRole = 'button',
  accessibilityLabel,
  accessibilityHint,
  accessibilityState,
  activeScale = 0.97,
}: PressableScaleProps) {
  const reduceMotion = useReduceMotion();
  const presionado = useSharedValue(0);

  const estiloAnimado = useAnimatedStyle(() => {
    const escala = reduceMotion ? 1 : 1 - presionado.value * (1 - activeScale);
    return {
      transform: [{ scale: escala }],
      opacity: 1 - presionado.value * 0.08,
    };
  });

  return (
    <AnimatedPressable
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={accessibilityState}
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => {
        presionado.value = withTiming(1, { duration: motion.durInstant });
      }}
      onPressOut={() => {
        presionado.value = withTiming(0, { duration: motion.durInstant });
      }}
      style={[style, estiloAnimado]}
    >
      {children}
    </AnimatedPressable>
  );
}
