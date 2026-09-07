import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Car, ExternalLink } from 'lucide-react-native';
import { useAppTheme } from '@/ui/useAppTheme';
import type { Theme } from '@/ui/theme';
import { Badge } from '@/ui/components/Badge';
import { Banner } from '@/ui/components/Banner';
import { Card } from '@/ui/components/Card';
import { EmptyState } from '@/ui/components/EmptyState';
import { hapticSelection } from '@/ui/haptics';
import {
  AVISO_VEHICULOS,
  getCategoriaVehiculos,
  type BloqueLista,
  type EnlaceRecurso,
  type SeccionVehiculos,
} from './contenido';

/**
 * Detalle de una categoría de "Vehículos" (§4.12): despliega sus secciones (qué comprobar,
 * indicios de falsedad, enlaces públicos) con lenguaje orientativo y su fuente cuando la hay.
 * Los enlaces se abren con `Linking`; si aún no hay URL fija, se marca "Enlace pendiente" (TODO
 * del cofundador). No se persiste ni se envía ningún dato.
 */
export interface CategoriaScreenProps {
  categoriaId: string | undefined;
}

export function CategoriaScreen({ categoriaId }: CategoriaScreenProps) {
  const t = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const categoria = getCategoriaVehiculos(categoriaId);

  if (!categoria) {
    return (
      <View style={{ flex: 1, backgroundColor: t.color.bg, paddingTop: insets.top }}>
        <EmptyState
          icon={Car}
          title="Categoría no encontrada"
          message="No hemos encontrado esta sección de Vehículos."
          actionLabel="Volver"
          onAction={() => router.back()}
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.color.bg }}
      contentContainerStyle={{
        paddingTop: t.spacing.lg,
        paddingBottom: insets.bottom + t.spacing.xxl,
        paddingHorizontal: t.spacing.base,
        gap: t.spacing.lg,
      }}
    >
      <Text style={{ color: t.color.textSecondary, ...t.typography.scale.body }}>
        {categoria.resumen}
      </Text>

      {categoria.secciones.map((seccion) => (
        <SeccionCard key={seccion.id} t={t} seccion={seccion} />
      ))}

      <Banner tone="info" title="Aviso">
        {AVISO_VEHICULOS}
      </Banner>
    </ScrollView>
  );
}

/** Tarjeta de una sección: título + estado, descripción, listas y enlaces, y fuente al pie. */
function SeccionCard({ t, seccion }: { t: Theme; seccion: SeccionVehiculos }) {
  return (
    <View style={{ gap: t.spacing.sm }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: t.spacing.sm,
          flexWrap: 'wrap',
        }}
      >
        <Text
          accessibilityRole="header"
          style={{ color: t.color.textPrimary, ...t.typography.scale.titleM }}
        >
          {seccion.titulo}
        </Text>
        {seccion.estado === 'pendiente' ? (
          <Badge label="Pendiente" tone="warning" />
        ) : (
          <Badge label="Orientativo" tone="info" />
        )}
      </View>

      <Text style={{ color: t.color.textSecondary, ...t.typography.scale.body }}>
        {seccion.descripcion}
      </Text>

      {seccion.comprobaciones ? <ListaBloque t={t} bloque={seccion.comprobaciones} /> : null}
      {seccion.indicios ? <ListaBloque t={t} bloque={seccion.indicios} /> : null}

      {seccion.enlaces && seccion.enlaces.length > 0 ? (
        <View style={{ gap: t.spacing.sm, marginTop: t.spacing.xxs }}>
          {seccion.enlaces.map((enlace) => (
            <FilaEnlace key={enlace.etiqueta} t={t} enlace={enlace} />
          ))}
        </View>
      ) : null}

      {seccion.fuente ? (
        <Text style={{ color: t.color.textTertiary, ...t.typography.scale.caption }}>
          Fuente: {seccion.fuente}
        </Text>
      ) : null}
    </View>
  );
}

/** Lista con título ("Qué conviene comprobar" / "Posibles indicios") con viñetas. */
function ListaBloque({ t, bloque }: { t: Theme; bloque: BloqueLista }) {
  return (
    <Card>
      <Text style={{ color: t.color.textPrimary, ...t.typography.scale.label }}>{bloque.titulo}</Text>
      <View style={{ gap: t.spacing.xs, marginTop: t.spacing.xxs }}>
        {bloque.items.map((item, i) => (
          <View key={i} style={{ flexDirection: 'row', gap: t.spacing.sm }}>
            <Text style={{ color: t.color.textTertiary, ...t.typography.scale.body }}>•</Text>
            <Text
              style={{ flex: 1, color: t.color.textPrimary, ...t.typography.scale.body }}
              maxFontSizeMultiplier={1.6}
            >
              {item}
            </Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

/**
 * Enlace a un recurso público. Si hay `url`, es pulsable y abre con `Linking`; si no, se muestra
 * como "Enlace pendiente" con su referencia genérica (lo aportará el cofundador). Toque ≥ 44.
 */
function FilaEnlace({ t, enlace }: { t: Theme; enlace: EnlaceRecurso }) {
  const disponible = enlace.url !== null;

  const contenido = (
    <View style={{ flex: 1, gap: t.spacing.xxs }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm }}>
        <Text style={{ flex: 1, color: t.color.textPrimary, ...t.typography.scale.bodyStrong }}>
          {enlace.etiqueta}
        </Text>
        {disponible ? (
          <ExternalLink size={18} color={t.color.brand} strokeWidth={2} />
        ) : (
          <Badge label="Pendiente" tone="warning" />
        )}
      </View>
      <Text style={{ color: t.color.textSecondary, ...t.typography.scale.caption }}>
        {enlace.descripcion}
      </Text>
      <Text style={{ color: t.color.textTertiary, ...t.typography.scale.caption }}>
        {enlace.referencia}
      </Text>
    </View>
  );

  const estilo = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: t.spacing.md,
    minHeight: t.touch.min,
    borderRadius: t.radius.md,
    borderWidth: 1,
    borderColor: t.color.border,
    backgroundColor: t.color.surface,
    padding: t.spacing.md,
  };

  if (!disponible) {
    return (
      <View accessibilityRole="text" style={{ ...estilo, opacity: 0.85 }}>
        {contenido}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={enlace.etiqueta}
      accessibilityHint="Abre el recurso público en el navegador"
      onPress={() => {
        hapticSelection();
        void Linking.openURL(enlace.url as string);
      }}
      style={estilo}
    >
      {contenido}
    </Pressable>
  );
}
