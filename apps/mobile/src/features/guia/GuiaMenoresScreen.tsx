import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight } from 'lucide-react-native';
import { useAppTheme } from '@/ui/useAppTheme';
import type { Theme } from '@/ui/theme';
import { Banner } from '@/ui/components/Banner';
import { ListRow } from '@/ui/components/ListRow';
import {
  ACTUALIZACION_GUIA_MENORES,
  GUIA_MENORES,
  type SeccionGuiaMenores,
} from './guiaMenores';

/**
 * GUÍA RÁPIDA DE MENORES (LO 5/2000 y LO 1/1996), para uso EN DIRECTO en la intervención: la duda de
 * calle "es menor, ¿qué hago?" separando el inimputable (< 14) del régimen penal del menor (14-17) y
 * sus garantías, la duda sobre la edad y el MENA. Escaneable (puntos clave resaltados). Orientativo y
 * "Borrador beta": la valoración final es del agente, el Ministerio Fiscal de Menores y, en su caso,
 * la autoridad judicial.
 */
export function GuiaMenoresScreen() {
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
        Menor de 14 años inimputable; de 14 a 17 responde por la LO 5/2000 con garantías del art. 17.
        La valoración final corresponde al agente, al Ministerio Fiscal de Menores y, en su caso, a la
        autoridad judicial.
      </Banner>

      {GUIA_MENORES.map((seccion) => (
        <Seccion
          key={seccion.titulo}
          t={t}
          seccion={seccion}
          onAbrir={() => {
            if (seccion.fichaId) router.push(`/ficha/${seccion.fichaId}`);
          }}
        />
      ))}

      <Text
        style={{
          color: t.color.textTertiary,
          ...t.typography.scale.caption,
          textAlign: 'center',
          marginTop: t.spacing.sm,
        }}
      >
        Fuente: LO 5/2000 (arts. 1.1, 3 y 17), LO 1/1996 de protección jurídica del menor y art. 35
        LO 4/2000. Actualizado: {ACTUALIZACION_GUIA_MENORES}. Orientativo, a verificar.
      </Text>
    </ScrollView>
  );
}

function Seccion({
  t,
  seccion,
  onAbrir,
}: {
  t: Theme;
  seccion: SeccionGuiaMenores;
  onAbrir: () => void;
}) {
  return (
    <View
      style={{
        borderRadius: t.radius.md,
        borderWidth: 1,
        borderColor: t.color.border,
        backgroundColor: t.color.surface,
        overflow: 'hidden',
      }}
    >
      <View style={{ paddingHorizontal: t.spacing.md, paddingTop: t.spacing.md, gap: t.spacing.xxs }}>
        <Text style={{ color: t.color.textPrimary, ...t.typography.scale.bodyStrong }}>
          {seccion.titulo}
        </Text>
        <Text style={{ color: t.color.accent, ...t.typography.scale.caption }}>{seccion.articulo}</Text>
      </View>

      {/* ACCIÓN operativa destacada (validación de calle): lo que hago AHORA, antes que la
          calificación jurídica. Fondo de acento suave para que salte a la vista en directo. */}
      <View
        style={{
          marginHorizontal: t.spacing.md,
          marginTop: t.spacing.sm,
          paddingVertical: t.spacing.xs,
          paddingHorizontal: t.spacing.sm,
          borderRadius: t.radius.sm,
          backgroundColor: t.color.accentWeak,
        }}
      >
        <Text style={{ color: t.color.accent, ...t.typography.scale.bodyStrong }}>
          {seccion.accion}
        </Text>
      </View>

      <View style={{ paddingHorizontal: t.spacing.md, paddingVertical: t.spacing.sm, gap: t.spacing.sm }}>
        {seccion.puntos.map((p) => (
          <View key={p.texto} style={{ flexDirection: 'row', gap: t.spacing.sm }}>
            <Text style={{ color: p.fuerte ? t.color.accent : t.color.textTertiary }}>•</Text>
            <Text
              style={{
                flex: 1,
                color: p.fuerte ? t.color.textPrimary : t.color.textSecondary,
                ...t.typography.scale.body,
                fontWeight: p.fuerte ? '600' : '400',
              }}
            >
              {p.texto}
            </Text>
          </View>
        ))}
      </View>

      {seccion.fichaId ? (
        <ListRow
          title="Ver la ficha completa"
          accessibilityHint="Abre la ficha con el detalle"
          onPress={onAbrir}
          right={<ChevronRight size={20} color={t.color.textTertiary} strokeWidth={2} />}
        />
      ) : null}
    </View>
  );
}
