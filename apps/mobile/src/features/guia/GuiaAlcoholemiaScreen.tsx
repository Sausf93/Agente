import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight } from 'lucide-react-native';
import { useAppTheme } from '@/ui/useAppTheme';
import type { Theme } from '@/ui/theme';
import { Banner } from '@/ui/components/Banner';
import { ListRow } from '@/ui/components/ListRow';
import { FICHAS_ALCOHOL, PASOS_ALCOHOLEMIA, TASAS_ALCOHOL } from './guiaAlcoholemia';

/**
 * GUÍA RÁPIDA DE ALCOHOLEMIA (petición del GC de Tráfico): las tasas y la frontera penal JUNTAS en
 * una pantalla escaneable, con recordatorio de procedimiento y enlaces a las fichas del paquete que
 * amplían cada supuesto. Contenido de referencia estático (patrón de los derechos), orientativo y
 * "Borrador beta": la valoración final es del agente/juez.
 */
export function GuiaAlcoholemiaScreen() {
  const t = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.color.bg }}
      contentContainerStyle={{
        padding: t.spacing.base,
        paddingBottom: insets.bottom + t.spacing.xxl,
        gap: t.spacing.md,
      }}
    >
      <Banner tone="info" title="Guía rápida orientativa (Borrador beta)">
        Resumen de las tasas y la frontera penal. Los valores están a verificar; la valoración final
        del caso corresponde al agente y a la autoridad judicial.
      </Banner>

      <View
        style={{
          borderRadius: t.radius.md,
          borderWidth: 1,
          borderColor: t.color.border,
          overflow: 'hidden',
        }}
      >
        {TASAS_ALCOHOL.map((fila, i) => (
          <View
            key={fila.supuesto}
            style={{
              padding: t.spacing.md,
              gap: t.spacing.xxs,
              backgroundColor: fila.penal ? t.color.accentWeak : t.color.surface,
              borderTopWidth: i === 0 ? 0 : 1,
              borderTopColor: t.color.border,
            }}
          >
            <Text style={{ color: t.color.textPrimary, ...t.typography.scale.bodyStrong }}>
              {fila.supuesto}
            </Text>
            <Text
              style={{
                color: fila.penal ? t.color.accent : t.color.textSecondary,
                ...t.typography.scale.titleM,
              }}
            >
              {fila.aire}
            </Text>
            <Text style={{ color: t.color.textSecondary, ...t.typography.scale.caption }}>
              {fila.consecuencia}
            </Text>
          </View>
        ))}
      </View>

      <SeccionTitulo t={t} texto="Procedimiento" />
      <View style={{ gap: t.spacing.sm }}>
        {PASOS_ALCOHOLEMIA.map((paso, i) => (
          <View key={paso} style={{ flexDirection: 'row', gap: t.spacing.sm }}>
            <Text style={{ color: t.color.accent, ...t.typography.scale.bodyStrong }}>{i + 1}.</Text>
            <Text style={{ flex: 1, color: t.color.textSecondary, ...t.typography.scale.body }}>
              {paso}
            </Text>
          </View>
        ))}
      </View>

      <SeccionTitulo t={t} texto="Fichas relacionadas" />
      <View style={{ borderRadius: t.radius.md, overflow: 'hidden' }}>
        {FICHAS_ALCOHOL.map((f) => (
          <ListRow
            key={f.id}
            title={f.label}
            accessibilityHint="Abre la ficha de la infracción"
            onPress={() => router.push(`/ficha/${f.id}`)}
            right={<ChevronRight size={20} color={t.color.textTertiary} strokeWidth={2} />}
          />
        ))}
      </View>

      <Text
        style={{
          color: t.color.textTertiary,
          ...t.typography.scale.caption,
          textAlign: 'center',
          marginTop: t.spacing.sm,
        }}
      >
        Fuente: art. 20 y ss. RGC (tasas) y art. 379.2 CP (delito). Contenido orientativo, a verificar.
      </Text>
    </ScrollView>
  );
}

/** Etiqueta de sección (mayúsculas, tenue), coherente con el resto de la app. */
function SeccionTitulo({ t, texto }: { t: Theme; texto: string }) {
  return (
    <Text
      style={{
        color: t.color.textSecondary,
        ...t.typography.scale.label,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        marginTop: t.spacing.sm,
      }}
    >
      {texto}
    </Text>
  );
}
