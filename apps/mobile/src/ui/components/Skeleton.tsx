import { useEffect } from 'react';
import { View, type DimensionValue } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useAppTheme } from '@/ui/useAppTheme';
import { useReduceMotion } from '@/ui/motion';

/**
 * Bloque de CARGA con brillo suave (mejoras-usabilidad P1-10). Sustituye a los spinners que
 * "saltan": mientras llega el contenido se ve su ESQUELETO y la transición a contenido real es
 * un fundido, no un salto brusco.
 *
 * El brillo es un pulso de opacidad en bucle (solo `opacity`, barato). Con "reducir movimiento"
 * activo el pulso se detiene y queda un bloque estático (sigue comunicando "cargando").
 */
export interface SkeletonLineProps {
  width?: DimensionValue;
  height?: number;
  radius?: number;
}

export function SkeletonLine({ width = '100%', height = 14, radius }: SkeletonLineProps) {
  const t = useAppTheme();
  const reduceMotion = useReduceMotion();
  const brillo = useSharedValue(reduceMotion ? 0.6 : 0.35);

  useEffect(() => {
    if (reduceMotion) {
      brillo.value = 0.6;
      return;
    }
    brillo.value = withRepeat(
      withTiming(0.75, { duration: 700, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [reduceMotion, brillo]);

  const estilo = useAnimatedStyle(() => ({ opacity: brillo.value }));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: radius ?? t.radius.sm,
          backgroundColor: t.color.surfaceAlt,
        },
        estilo,
      ]}
    />
  );
}

/** Esqueleto de una fila de resultado (título + metadato), a juego con `ListRow`. */
export function SkeletonRow() {
  const t = useAppTheme();
  return (
    <View
      style={{
        paddingVertical: t.spacing.md,
        paddingHorizontal: t.spacing.base,
        borderBottomWidth: 1,
        borderBottomColor: t.color.border,
        backgroundColor: t.color.surface,
        gap: t.spacing.sm,
      }}
    >
      <SkeletonLine width="62%" height={16} />
      <SkeletonLine width="38%" height={12} />
    </View>
  );
}

/** Lista de esqueletos de fila (para la carga del buscador y las listas). */
export function SkeletonRows({ count = 6 }: { count?: number }) {
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </View>
  );
}
