import type { ComponentType } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Car,
  ChevronRight,
  FileText,
  Globe,
  SearchCheck,
  ShieldAlert,
  type LucideProps,
} from 'lucide-react-native';
import { useAppTheme } from '@/ui/useAppTheme';
import type { Theme } from '@/ui/theme';
import { Banner } from '@/ui/components/Banner';
import { hapticSelection } from '@/ui/haptics';
import {
  AVISO_VEHICULOS,
  CATEGORIAS_VEHICULOS,
  type CategoriaVehiculos,
  type IconoCategoria,
} from './contenido';

/**
 * Hub de "Vehículos" (§4.12): lista navegable de categorías (documentación española, vehículos y
 * permisos extranjeros, comprobaciones y falsedad documental). Es una caja de herramientas de
 * apoyo, no normativa. Todo el contenido es un recurso bundlado (offline) y orientativo.
 *
 * Privacidad: aquí no se introduce ni se persiste ningún dato de terceros; solo se abren recursos
 * públicos. El aviso fijo lo recuerda.
 */
export function VehiculosHubScreen() {
  const t = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.color.bg }}
      contentContainerStyle={{
        paddingTop: t.spacing.lg,
        paddingBottom: insets.bottom + t.spacing.xxl,
        paddingHorizontal: t.spacing.base,
        gap: t.spacing.md,
      }}
    >
      <Text style={{ color: t.color.textSecondary, ...t.typography.scale.body }}>
        Enlaces y utilidades de apoyo para consultar vehículos y documentación. Contenido
        orientativo, disponible sin conexión.
      </Text>

      <View style={{ gap: t.spacing.sm, marginTop: t.spacing.xs }}>
        {CATEGORIAS_VEHICULOS.map((categoria) => (
          <FilaCategoria
            key={categoria.id}
            t={t}
            categoria={categoria}
            onPress={() => {
              hapticSelection();
              router.push({
                pathname: '/vehiculos/[categoriaId]',
                params: { categoriaId: categoria.id },
              });
            }}
          />
        ))}
      </View>

      <View style={{ marginTop: t.spacing.sm }}>
        <Banner tone="info" title="Aviso">
          {AVISO_VEHICULOS}
        </Banner>
      </View>
    </ScrollView>
  );
}

/** Traduce la clave de icono del contenido a componente Lucide (metáforas, jamás escudos). */
const ICONO: Record<IconoCategoria, ComponentType<LucideProps>> = {
  documento: FileText,
  extranjero: Globe,
  comprobacion: SearchCheck,
  falsedad: ShieldAlert,
};

/** Fila pulsable de categoría del hub (mismo patrón visual que "Más"). Toque ≥ 44. */
function FilaCategoria({
  t,
  categoria,
  onPress,
}: {
  t: Theme;
  categoria: CategoriaVehiculos;
  onPress: () => void;
}) {
  const Icon = ICONO[categoria.icono] ?? Car;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={categoria.titulo}
      accessibilityHint={categoria.resumen}
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
        <Text style={{ color: t.color.textPrimary, ...t.typography.scale.bodyStrong }}>
          {categoria.titulo}
        </Text>
        <Text style={{ color: t.color.textSecondary, ...t.typography.scale.caption }}>
          {categoria.resumen}
        </Text>
      </View>
      <ChevronRight size={20} color={t.color.textTertiary} strokeWidth={2} />
    </Pressable>
  );
}
