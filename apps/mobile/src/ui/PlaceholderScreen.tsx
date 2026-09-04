import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from './useAppTheme';

/**
 * Pantalla vacía de Fase 0: solo demuestra tema, safe-area y navegación.
 * Cada feature real la sustituye mobile-dev. Sin lógica de negocio aquí.
 */
export function PlaceholderScreen({ title, hint }: { title: string; hint: string }) {
  const t = useAppTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: t.color.bg,
        paddingTop: insets.top + t.spacing.xl,
        paddingHorizontal: t.spacing.base,
      }}
    >
      <Text style={{ color: t.color.textPrimary, ...t.typography.scale.titleXL }}>{title}</Text>
      <Text
        style={{
          color: t.color.textSecondary,
          marginTop: t.spacing.sm,
          ...t.typography.scale.body,
        }}
      >
        {hint}
      </Text>
    </View>
  );
}
