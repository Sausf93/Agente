import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { useAppTheme } from '@/ui/useAppTheme';

/**
 * Barra de búsqueda (02-ui.md §5.1, cola de componentes §4.2.3).
 *
 * El buscador ES el producto: nace como primitiva, no dentro de la pantalla. Alto 56
 * (`touch.searchHeight`), foco con anillo de 2 pt (`focusRing`), y un botón "limpiar" de
 * 44×44 cuando hay texto. La lupa y el micrófono (dictado nativo, §4.3) son textuales hasta
 * que entre el set de iconos Lucide; el hueco y la a11y ya quedan preparados.
 */
export interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onSubmit?: () => void;
  autoFocus?: boolean;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Busca una infracción, artículo o palabra…',
  onSubmit,
  autoFocus = false,
}: SearchBarProps) {
  const t = useAppTheme();
  const [focused, setFocused] = useState(false);

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
      <TextInput
        accessibilityLabel="Campo de búsqueda"
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onSubmitEditing={onSubmit}
        placeholder={placeholder}
        placeholderTextColor={t.color.textTertiary}
        autoFocus={autoFocus}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        clearButtonMode="never"
        maxFontSizeMultiplier={1.6}
        style={{
          flex: 1,
          color: t.color.textPrimary,
          paddingVertical: t.spacing.sm,
          ...t.typography.scale.bodyL,
        }}
      />
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
      ) : null}
    </View>
  );
}
