import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight } from 'lucide-react-native';
import { useAppTheme } from '@/ui/useAppTheme';
import type { Theme } from '@/ui/theme';
import { Banner } from '@/ui/components/Banner';
import { ListRow } from '@/ui/components/ListRow';

/**
 * Pantalla GENÉRICA de guía rápida "orientada a la ACCIÓN": banner + tarjetas de sección donde cada
 * sección abre con un chip de ACCIÓN operativa (qué hago AHORA) y debajo el fundamento en viñetas, con
 * enlace opcional a la ficha que amplía. La usan la guía de menores, la de extranjería y cualquier
 * otra del mismo patrón, para no duplicar la pantalla (uso EN DIRECTO, escaneable). El chip de acción
 * es la diferencia con `GuiaIdentificacionScreen` (más antigua, sin acción destacada).
 */

/** Un punto (viñeta) de una sección; `fuerte` lo resalta. */
export interface PuntoGuiaAccion {
  texto: string;
  fuerte?: boolean;
}

/** Una sección de la guía: acción operativa + fundamento + enlace opcional a ficha. */
export interface SeccionGuiaAccion {
  titulo: string;
  accion: string;
  articulo: string;
  fichaId?: string;
  puntos: readonly PuntoGuiaAccion[];
}

/** Enlace a otra guía relacionada (navegación cruzada entre guías del "manual de calle"). */
export interface GuiaRelacionadaLink {
  ruta: string;
  titulo: string;
}

export interface GuiaAccionScreenProps {
  /** Título y cuerpo del banner de cabecera (aviso orientativo). */
  bannerTitulo: string;
  bannerCuerpo: string;
  secciones: readonly SeccionGuiaAccion[];
  /** Pie con fuente + fecha de actualización (regla: fuente y fecha visibles). */
  pie: string;
  /** Otras guías relacionadas, enlazadas al final (opcional). */
  guiasRelacionadas?: readonly GuiaRelacionadaLink[];
}

export function GuiaAccionScreen({
  bannerTitulo,
  bannerCuerpo,
  secciones,
  pie,
  guiasRelacionadas,
}: GuiaAccionScreenProps) {
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
      <Banner tone="info" title={bannerTitulo}>
        {bannerCuerpo}
      </Banner>

      {secciones.map((seccion) => (
        <Seccion
          key={seccion.titulo}
          t={t}
          seccion={seccion}
          onAbrir={() => {
            if (seccion.fichaId) router.push(`/ficha/${seccion.fichaId}`);
          }}
        />
      ))}

      {guiasRelacionadas && guiasRelacionadas.length > 0 ? (
        <View
          style={{
            borderRadius: t.radius.md,
            borderWidth: 1,
            borderColor: t.color.border,
            backgroundColor: t.color.surface,
            overflow: 'hidden',
          }}
        >
          <Text
            style={{
              color: t.color.textSecondary,
              ...t.typography.scale.caption,
              textTransform: 'uppercase',
              letterSpacing: 0.6,
              paddingHorizontal: t.spacing.md,
              paddingTop: t.spacing.md,
              paddingBottom: t.spacing.xs,
            }}
          >
            Guías relacionadas
          </Text>
          {guiasRelacionadas.map((g) => (
            <ListRow
              key={g.ruta}
              title={g.titulo}
              accessibilityHint="Abre la guía relacionada"
              onPress={() => router.push(g.ruta)}
              right={<ChevronRight size={20} color={t.color.textTertiary} strokeWidth={2} />}
            />
          ))}
        </View>
      ) : null}

      <Text
        style={{
          color: t.color.textTertiary,
          ...t.typography.scale.caption,
          textAlign: 'center',
          marginTop: t.spacing.sm,
        }}
      >
        {pie}
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
  seccion: SeccionGuiaAccion;
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
