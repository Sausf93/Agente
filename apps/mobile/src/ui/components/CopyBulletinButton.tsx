import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import * as Clipboard from 'expo-clipboard';
import { Check, Copy } from 'lucide-react-native';
import { useAppTheme } from '@/ui/useAppTheme';
import { hapticSuccess } from '@/ui/haptics';
import { useReduceMotion } from '@/ui/motion';

/**
 * Botón "Copiar boletín" — la ACCIÓN ESTRELLA de la app (ADR-004, §8.2 del sistema visual).
 *
 * Copia al portapapeles con `expo-clipboard` (Expo Go) y confirma SIEMPRE con TRES señales
 * redundantes (mejoras-usabilidad P0-1/P0-2): (1) háptico de éxito, (2) micro-escala al pulsar +
 * cruce suave del contenido normal→"Copiado" con el fondo virando a `success`, (3) texto e icono
 * que cambian y se anuncian por accesibilidad. A los ~1,2 s vuelve con un fundido.
 *
 * Con "reducir movimiento" activo no anima (cambio instantáneo), pero mantiene háptico y texto: el
 * feedback nunca depende solo del movimiento. Va SOBRE EL PLIEGUE en la ficha.
 */
export interface CopyBulletinButtonProps {
  /** Texto del boletín a copiar (ya compuesto, con la variante elegida si aplica). */
  texto: string;
  /** Etiqueta del estado normal. */
  label?: string;
  onCopied?: () => void;
}

const DURACION_EXITO_MS = 1200;

export function CopyBulletinButton({
  texto,
  label = 'Copiar boletín',
  onCopied,
}: CopyBulletinButtonProps) {
  const t = useAppTheme();
  const reduceMotion = useReduceMotion();
  const [copiado, setCopiado] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const exito = useSharedValue(0); // 0 = normal, 1 = copiado
  const press = useSharedValue(0); // 0 = suelto, 1 = presionado

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const durExito = reduceMotion ? 0 : t.motion.durFast;

  const contenedorStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(exito.value, [0, 1], [t.color.brand, t.color.success]),
    transform: [{ scale: reduceMotion ? 1 : 1 - press.value * 0.02 }],
  }));
  const capaNormalStyle = useAnimatedStyle(() => ({ opacity: 1 - exito.value }));
  const capaExitoStyle = useAnimatedStyle(() => ({ opacity: exito.value }));

  async function onPress() {
    await Clipboard.setStringAsync(texto);
    hapticSuccess();
    setCopiado(true);
    exito.value = withTiming(1, { duration: durExito });
    AccessibilityInfo.announceForAccessibility('Boletín copiado al portapapeles');
    onCopied?.();
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setCopiado(false);
      exito.value = withTiming(0, { duration: durExito });
    }, DURACION_EXITO_MS);
  }

  const base: ViewStyle = {
    minHeight: 54, // acción estrella: algo más alta que un botón normal (§4 del sistema visual)
    borderRadius: t.radius.md,
    overflow: 'hidden',
    justifyContent: 'center',
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={copiado ? 'Boletín copiado' : label}
      accessibilityHint="Copia el texto del boletín al portapapeles"
      onPress={onPress}
      onPressIn={() => {
        press.value = withTiming(1, { duration: t.motion.durInstant });
      }}
      onPressOut={() => {
        press.value = withTiming(0, { duration: t.motion.durInstant });
      }}
    >
      <Animated.View style={[base, contenedorStyle]}>
        {/* Capa NORMAL. */}
        <Animated.View style={[styles.capa, capaNormalStyle]}>
          <Copy size={22} color={t.color.textOnBrand} strokeWidth={2} />
          <Text
            maxFontSizeMultiplier={1.6}
            style={{ color: t.color.textOnBrand, ...t.typography.scale.bodyStrong }}
          >
            {label}
          </Text>
        </Animated.View>
        {/* Capa ÉXITO (cruce suave por encima). */}
        <Animated.View style={[styles.capa, capaExitoStyle]}>
          <Check size={22} color={t.color.textOnBrand} strokeWidth={2.4} />
          <Text
            maxFontSizeMultiplier={1.6}
            style={{ color: t.color.textOnBrand, ...t.typography.scale.bodyStrong }}
          >
            Copiado
          </Text>
        </Animated.View>
        {/* Espaciador invisible que fija la altura del contenido (las capas van absolutas). */}
        <View style={styles.espaciador} pointerEvents="none">
          <Text style={t.typography.scale.bodyStrong}> </Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  capa: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  espaciador: { alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
});
