import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Check, ChevronDown } from 'lucide-react-native';
import { useAppTheme } from '@/ui/useAppTheme';

/**
 * Campo de SELECCIÓN (una opción de una lista) que abre una hoja inferior con la lista, en un
 * `Modal` de React Native (compatible con Expo Go, sin pickers nativos). Toque ≥ 44, opción
 * activa marcada con check + acento (no solo color). Usado en onboarding y Ajustes para CCAA y
 * provincia.
 */
export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectFieldProps {
  label: string;
  value: string | null;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  /** Nota bajo el campo (p. ej. "solo obligatorio para Policía Local"). */
  hint?: string | undefined;
  onChange: (value: string) => void;
}

export function SelectField({
  label,
  value,
  options,
  placeholder = 'Selecciona…',
  disabled = false,
  hint,
  onChange,
}: SelectFieldProps) {
  const t = useAppTheme();
  const [abierto, setAbierto] = useState(false);
  const seleccion = options.find((o) => o.value === value) ?? null;

  return (
    <View style={{ gap: t.spacing.xs }}>
      <Text style={{ color: t.color.textPrimary, ...t.typography.scale.label }}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled, expanded: abierto }}
        accessibilityLabel={`${label}. ${seleccion ? seleccion.label : placeholder}`}
        disabled={disabled}
        onPress={() => setAbierto(true)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: t.touch.primaryHeight,
          borderRadius: t.radius.md,
          borderWidth: 1,
          borderColor: t.color.border,
          backgroundColor: disabled ? t.color.surfaceAlt : t.color.surface,
          paddingHorizontal: t.spacing.md,
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <Text
          numberOfLines={1}
          style={{
            flex: 1,
            color: seleccion ? t.color.textPrimary : t.color.textTertiary,
            ...t.typography.scale.body,
          }}
        >
          {seleccion ? seleccion.label : placeholder}
        </Text>
        <ChevronDown size={20} color={t.color.textSecondary} strokeWidth={2} />
      </Pressable>
      {hint ? (
        <Text style={{ color: t.color.textTertiary, ...t.typography.scale.caption }}>{hint}</Text>
      ) : null}

      <Modal visible={abierto} transparent animationType="slide" onRequestClose={() => setAbierto(false)}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cerrar"
          onPress={() => setAbierto(false)}
          style={{ flex: 1, backgroundColor: '#00000066', justifyContent: 'flex-end' }}
        >
          <Pressable
            onPress={() => {}}
            style={{
              backgroundColor: t.color.surface,
              borderTopLeftRadius: t.radius.xl,
              borderTopRightRadius: t.radius.xl,
              paddingVertical: t.spacing.base,
              maxHeight: '80%',
            }}
          >
            <Text
              accessibilityRole="header"
              style={{
                color: t.color.textPrimary,
                ...t.typography.scale.titleM,
                paddingHorizontal: t.spacing.base,
                marginBottom: t.spacing.sm,
              }}
            >
              {label}
            </Text>
            <ScrollView>
              {options.map((o) => {
                const activo = o.value === value;
                return (
                  <Pressable
                    key={o.value}
                    accessibilityRole="button"
                    accessibilityState={{ selected: activo }}
                    onPress={() => {
                      onChange(o.value);
                      setAbierto(false);
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      minHeight: t.touch.min + 6,
                      paddingHorizontal: t.spacing.base,
                      paddingVertical: t.spacing.sm,
                      backgroundColor: activo ? t.color.accentWeak : t.color.surface,
                    }}
                  >
                    <Text
                      style={{
                        color: activo ? t.color.accent : t.color.textPrimary,
                        ...t.typography.scale.body,
                        fontWeight: activo ? '700' : '400',
                      }}
                    >
                      {o.label}
                    </Text>
                    {activo ? <Check size={20} color={t.color.accent} strokeWidth={2.4} /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
