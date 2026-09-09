import { useEffect, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Mic, Search, X } from 'lucide-react-native';
import { useAppTheme } from '@/ui/useAppTheme';
import { hapticSelection } from '@/ui/haptics';
import { useReduceMotion } from '@/ui/motion';

/**
 * Barra de búsqueda (02-ui.md §5.1) — el buscador ES el producto (mejoras-usabilidad P0-3).
 *
 * Novedades de dinamismo:
 *  - `autoFocus` OPCIONAL (por defecto `false`): la app NO sube el teclado sola al abrirse; el foco
 *    solo se produce cuando el agente toca la barra. Se puede activar por prop donde tenga sentido.
 *  - PLACEHOLDER rotatorio con ejemplos "de calle" (fade cada ~3 s; estático con reduce-motion).
 *  - Botón de MICRÓFONO OCULTO por defecto: la voz llega en un dev build (P2-15). En la beta no se
 *    pinta para no prometer algo que no está (promete-y-no-está resta). Se activa con `showMic`
 *    (más `onMicPress`) el día que la búsqueda por voz exista de verdad.
 *
 * Alto 56 (`touch.searchHeight`), foco con anillo de 2 pt (`focusRing`) y botón "limpiar" 44×44.
 */
export interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  /** Ejemplos que rotan como placeholder cuando el campo está vacío (01-ux §6.1). */
  examples?: string[];
  onSubmit?: () => void;
  autoFocus?: boolean;
  /** Muestra el botón de micrófono (voz). Desactivado en la beta: la voz aún no existe (P2-15). */
  showMic?: boolean;
  /** Acción del micrófono. Solo relevante cuando `showMic` está activo. */
  onMicPress?: () => void;
}

const EJEMPLOS_CALLE = ['faro roto', 'sin seguro', '0,60 mg', 'art. 36.6', 'móvil conduciendo'];
const ROTACION_MS = 3000;

export function SearchBar({
  value,
  onChangeText,
  placeholder,
  examples = EJEMPLOS_CALLE,
  onSubmit,
  autoFocus = false,
  showMic = false,
  onMicPress,
}: SearchBarProps) {
  const t = useAppTheme();
  const reduceMotion = useReduceMotion();
  const [focused, setFocused] = useState(false);
  const [idx, setIdx] = useState(0);
  const phOpacity = useSharedValue(1);

  const rotar = placeholder === undefined && value.length === 0 && examples.length > 1;

  // Rotación del placeholder con fundido. Con reduce-motion se queda estático en el primero.
  useEffect(() => {
    if (!rotar || reduceMotion) return;
    const id = setInterval(() => {
      phOpacity.value = withTiming(0, { duration: t.motion.durFast }, () => {
        phOpacity.value = withTiming(1, { duration: t.motion.durFast });
      });
      setIdx((i) => (i + 1) % examples.length);
    }, ROTACION_MS);
    return () => clearInterval(id);
  }, [rotar, reduceMotion, examples.length, phOpacity, t.motion.durFast]);

  const phStyle = useAnimatedStyle(() => ({ opacity: phOpacity.value }));

  // Placeholder mostrado: fijo si viene por prop; si no, el ejemplo rotatorio actual.
  const ejemploActual = examples[idx] ?? examples[0] ?? '';
  const textoPlaceholder = placeholder ?? (reduceMotion ? examples[0] : ejemploActual) ?? '';

  function onMic() {
    hapticSelection();
    onMicPress?.();
  }

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: t.touch.searchHeight,
        borderRadius: t.radius.md,
        borderWidth: focused ? 2 : 1,
        borderColor: focused ? t.color.focusRing : t.color.border,
        backgroundColor: t.color.surface,
        paddingHorizontal: t.spacing.md,
        gap: t.spacing.sm,
      }}
    >
      <Search size={20} color={focused ? t.color.accent : t.color.textSecondary} strokeWidth={2} />
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <TextInput
          accessibilityLabel="Campo de búsqueda"
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onSubmitEditing={onSubmit}
          // Placeholder nativo vacío cuando rota: lo pinta el overlay animado de abajo.
          placeholder={rotar ? '' : textoPlaceholder}
          placeholderTextColor={t.color.textTertiary}
          autoFocus={autoFocus}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          clearButtonMode="never"
          maxFontSizeMultiplier={1.6}
          style={{
            color: t.color.textPrimary,
            paddingVertical: t.spacing.sm,
            ...t.typography.scale.bodyL,
          }}
        />
        {rotar ? (
          <Animated.Text
            numberOfLines={1}
            style={[
              {
                position: 'absolute',
                left: 0,
                right: 0,
                color: t.color.textTertiary,
                pointerEvents: 'none',
                ...t.typography.scale.bodyL,
              },
              phStyle,
            ]}
          >
            {textoPlaceholder}
          </Animated.Text>
        ) : null}
      </View>
      {value.length > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Borrar la búsqueda"
          onPress={() => onChangeText('')}
          hitSlop={8}
          style={{
            minWidth: t.touch.min,
            minHeight: t.touch.min,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View
            style={{
              width: 22,
              height: 22,
              borderRadius: t.radius.pill,
              backgroundColor: t.color.surfaceAlt,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={14} color={t.color.textSecondary} strokeWidth={2.4} />
          </View>
        </Pressable>
      ) : showMic ? (
        // Micrófono OCULTO en la beta (voz aún no disponible): solo se pinta con `showMic`.
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Búsqueda por voz"
          onPress={onMic}
          hitSlop={8}
          style={{
            minWidth: t.touch.min,
            minHeight: t.touch.min,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Mic size={20} color={t.color.textTertiary} strokeWidth={2} />
        </Pressable>
      ) : null}
    </View>
  );
}
