import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FileText } from 'lucide-react-native';
import { useAppTheme } from '@/ui/useAppTheme';
import { Banner } from '@/ui/components/Banner';
import { ListRow } from '@/ui/components/ListRow';
import { PLANTILLAS_SEED } from './plantillasSeed';

/**
 * Pestaña DOCUMENTOS (§4.8): lista de plantillas que el agente rellena y convierte en PDF EN EL
 * DISPOSITIVO. Pilar "ahorra trabajo de oficina". Todo es offline y local-first: nada de lo que
 * se teclea aquí (ni el PDF resultante) sale del teléfono.
 */
export function DocumentosScreen() {
  const t = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.color.bg }}
      contentContainerStyle={{
        paddingTop: insets.top + t.spacing.base,
        paddingBottom: insets.bottom + t.spacing.xxl,
        gap: t.spacing.lg,
      }}
    >
      <View style={{ paddingHorizontal: t.spacing.base, gap: t.spacing.xs }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm }}>
          <FileText size={24} color={t.color.accent} strokeWidth={2} />
          <Text
            accessibilityRole="header"
            style={{ color: t.color.textPrimary, ...t.typography.scale.titleXL }}
          >
            Documentos
          </Text>
        </View>
        <Text style={{ color: t.color.textSecondary, ...t.typography.scale.body }}>
          Rellena una plantilla y genera el PDF en tu móvil. El texto legal ya viene hecho: tú solo
          pones fecha, lugar y lo específico.
        </Text>
      </View>

      <View style={{ paddingHorizontal: t.spacing.base }}>
        <Banner tone="info" title="Solo en este dispositivo">
          Las matrículas, nombres y DNI que escribas viven únicamente en tu teléfono. Ni esos datos
          ni el PDF se envían a ningún servidor.
        </Banner>
      </View>

      <View>
        {PLANTILLAS_SEED.map((p) => (
          <ListRow
            key={p.id}
            title={p.titulo}
            subtitle={p.descripcion}
            accessibilityHint="Abre el formulario para rellenar y generar el PDF"
            onPress={() => router.push(`/documento/${p.id}`)}
          />
        ))}
      </View>
    </ScrollView>
  );
}
