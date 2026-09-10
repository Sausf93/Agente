import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight } from 'lucide-react-native';
import { useAppTheme } from '@/ui/useAppTheme';
import type { Theme } from '@/ui/theme';
import { Banner } from '@/ui/components/Banner';
import { ListRow } from '@/ui/components/ListRow';
import {
  ACTUALIZACION_GUIA_IDENTIFICACION,
  GUIA_IDENTIFICACION,
  type SeccionGuiaIdentificacion,
} from './guiaIdentificacion';

/**
 * GUÍA RÁPIDA DE IDENTIFICACIÓN Y CACHEO (LOSC 16/20), para uso EN DIRECTO en la intervención: cuándo
 * puedo identificar, garantías del cacheo/registro, vehículo/domicilio y qué hacer ante la negativa.
 * Escaneable (puntos clave resaltados) con enlace a la ficha que amplía cada bloque. Orientativo y
 * "Borrador beta": la valoración final es del agente/juez.
 */
export function GuiaIdentificacionScreen() {
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
        Puntos clave de identificación (art. 16) y cacheo/registro (art. 20). La valoración final del
        caso corresponde al agente y, en su caso, a la autoridad judicial.
      </Banner>

      {GUIA_IDENTIFICACION.map((seccion) => (
        <Seccion key={seccion.titulo} t={t} seccion={seccion} onAbrir={() => router.push(`/ficha/${seccion.fichaId}`)} />
      ))}

      <Text
        style={{
          color: t.color.textTertiary,
          ...t.typography.scale.caption,
          textAlign: 'center',
          marginTop: t.spacing.sm,
        }}
      >
        Fuente: LO 4/2015 (arts. 16, 20 y 36.6), arts. 550-551 y 556 CP, arts. 490/492 y 545 y ss.
        LECrim y art. 18.2 CE. Actualizado: {ACTUALIZACION_GUIA_IDENTIFICACION}. Orientativo, a verificar.
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
  seccion: SeccionGuiaIdentificacion;
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

      <ListRow
        title="Ver la ficha completa"
        accessibilityHint="Abre la ficha con el detalle"
        onPress={onAbrir}
        right={<ChevronRight size={20} color={t.color.textTertiary} strokeWidth={2} />}
      />
    </View>
  );
}
