import { Link } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/ui/useAppTheme';
import type { Theme } from '@/ui/theme';

/**
 * Hub "Más": accesos a lo que no es pestaña de nivel 1 (mapa/PK, lectura de derechos,
 * sustancias, vehículos, ajustes, suscripción) y a "Sugerencias / reportar problema".
 *
 * De momento solo la fila de feedback es funcional; el resto son marcadores de sitio
 * que irán activando sus features. La navegación real la resuelve Expo Router.
 */
export default function MasScreen() {
  const t = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.color.bg }}
      contentContainerStyle={{
        paddingTop: insets.top + t.spacing.xl,
        paddingBottom: insets.bottom + t.spacing.xxl,
        paddingHorizontal: t.spacing.base,
        gap: t.spacing.md,
      }}
    >
      <Text style={{ color: t.color.textPrimary, ...t.typography.scale.titleXL }}>Más</Text>

      <View style={{ gap: t.spacing.sm, marginTop: t.spacing.sm }}>
        <Link href="/feedback" asChild>
          <FilaMas
            t={t}
            titulo="Sugerencias / reportar problema"
            descripcion="Cuéntanos qué mejorarías o qué falla. Se guarda en tu móvil."
          />
        </Link>
      </View>

      <Text
        style={{
          color: t.color.textTertiary,
          marginTop: t.spacing.base,
          ...t.typography.scale.caption,
        }}
      >
        Próximamente: mapa/PK, lectura de derechos, sustancias, vehículos, ajustes y suscripción.
      </Text>
    </ScrollView>
  );
}

/** Fila pulsable del hub. `asChild` de Link le pasa el onPress. */
function FilaMas({
  t,
  titulo,
  descripcion,
  onPress,
}: {
  t: Theme;
  titulo: string;
  descripcion: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={{
        minHeight: t.touch.min,
        borderRadius: t.radius.md,
        borderWidth: 1,
        borderColor: t.color.border,
        backgroundColor: t.color.surface,
        padding: t.spacing.md,
        gap: t.spacing.xxs,
      }}
    >
      <Text style={{ color: t.color.textPrimary, ...t.typography.scale.bodyStrong }}>{titulo}</Text>
      <Text style={{ color: t.color.textSecondary, ...t.typography.scale.caption }}>
        {descripcion}
      </Text>
    </Pressable>
  );
}
