import type { ComponentType } from 'react';
import { Link } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronRight,
  MessageSquarePlus,
  MessageSquareText,
  Settings,
  type LucideProps,
} from 'lucide-react-native';
import { useAppTheme } from '@/ui/useAppTheme';
import type { Theme } from '@/ui/theme';

/**
 * Hub "Más": accesos a lo que no es pestaña de nivel 1 (ajustes, mapa/PK, lectura de derechos,
 * sustancias, vehículos, suscripción) y a "Sugerencias / reportar problema".
 *
 * Ajustes y feedback ya son funcionales; el resto se irá activando. La navegación la resuelve
 * Expo Router.
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
        <Link href="/ajustes" asChild>
          <FilaMas
            t={t}
            icon={Settings}
            titulo="Ajustes"
            descripcion="Cuerpo, territorio y tema (claro/oscuro)."
          />
        </Link>
        <Link href="/feedback" asChild>
          <FilaMas
            t={t}
            icon={MessageSquarePlus}
            titulo="Sugerencias / reportar problema"
            descripcion="Cuéntanos qué mejorarías o qué falla. Se guarda en tu móvil."
          />
        </Link>
        <Link href="/mis-sugerencias" asChild>
          <FilaMas
            t={t}
            icon={MessageSquareText}
            titulo="Mis sugerencias"
            descripcion="Lo que has enviado, con su estado y nuestra respuesta."
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
        Próximamente: mapa/PK, lectura de derechos, sustancias, vehículos y suscripción.
      </Text>
    </ScrollView>
  );
}

/** Fila pulsable del hub. `asChild` de Link le pasa el onPress. */
function FilaMas({
  t,
  icon: Icon,
  titulo,
  descripcion,
  onPress,
}: {
  t: Theme;
  icon: ComponentType<LucideProps>;
  titulo: string;
  descripcion: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: t.spacing.md,
        minHeight: t.touch.min + 8,
        borderRadius: t.radius.md,
        borderWidth: 1,
        borderColor: t.color.border,
        backgroundColor: t.color.surface,
        padding: t.spacing.md,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: t.radius.md,
          backgroundColor: t.color.accentWeak,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={22} color={t.color.accent} strokeWidth={2} />
      </View>
      <View style={{ flex: 1, gap: t.spacing.xxs }}>
        <Text style={{ color: t.color.textPrimary, ...t.typography.scale.bodyStrong }}>{titulo}</Text>
        <Text style={{ color: t.color.textSecondary, ...t.typography.scale.caption }}>
          {descripcion}
        </Text>
      </View>
      <ChevronRight size={20} color={t.color.textTertiary} strokeWidth={2} />
    </Pressable>
  );
}
