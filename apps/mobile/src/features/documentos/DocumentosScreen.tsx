import type { ComponentType } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Car, ChevronRight, FileText, IdCard, type LucideProps } from 'lucide-react-native';
import type { TipoPlantilla } from '@agente/shared';
import { useAppTheme } from '@/ui/useAppTheme';
import { Banner } from '@/ui/components/Banner';
import { ListRow } from '@/ui/components/ListRow';
import { IconPill } from '@/ui/components/LeadingPill';
import { ScreenHeader } from '@/ui/components/ScreenHeader';
import { PLANTILLAS_SEED } from './plantillasSeed';

/**
 * Pestaña DOCUMENTOS (§4.8): lista de plantillas que el agente rellena y convierte en PDF EN EL
 * DISPOSITIVO. Pilar "ahorra trabajo de oficina". Todo es offline y local-first: nada de lo que
 * se teclea aquí (ni el PDF resultante) sale del teléfono.
 */

/** Icono por tipo de plantilla (pastilla `accentWeak`, patrón del hub "Más"). Objetos, no símbolos. */
const ICONO_PLANTILLA: Partial<Record<TipoPlantilla, ComponentType<LucideProps>>> = {
  boletin_denuncia: FileText,
  acta_inmovilizacion: Car,
  diligencia_identificacion: IdCard,
};

export function DocumentosScreen() {
  const t = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.color.bg }}
      contentContainerStyle={{
        paddingBottom: insets.bottom + t.spacing.xxl,
        gap: t.spacing.lg,
      }}
    >
      <ScreenHeader
        title="Documentos"
        subtitle="Rellena una plantilla y genera el PDF en tu móvil. El texto legal ya viene hecho: tú solo pones fecha, lugar y lo específico."
      />

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
            leading={<IconPill icon={ICONO_PLANTILLA[p.tipo] ?? FileText} />}
            right={<ChevronRight size={20} color={t.color.textTertiary} strokeWidth={2} />}
            accessibilityHint="Abre el formulario para rellenar y generar el PDF"
            onPress={() => router.push(`/documento/${p.id}`)}
          />
        ))}
      </View>
    </ScrollView>
  );
}
