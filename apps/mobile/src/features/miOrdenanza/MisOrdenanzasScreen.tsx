import { useEffect } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ChevronRight, SquareParking } from 'lucide-react-native';
import { useAppTheme } from '@/ui/useAppTheme';
import type { Theme } from '@/ui/theme';
import { PressableScale } from '@/ui/components/PressableScale';
import { formatEuros } from '@/features/ficha/format';
import { useSettingsStore } from '@/store/settings';
import { CONCEPTOS_APARCAMIENTO } from './conceptosAparcamiento';
import { useOrdenanzaPropiaStore } from './ordenanzaPropiaStore';

/**
 * "MIS ORDENANZAS" (§4.5): pantalla de gestión desde "Más". Lista los conceptos de aparcamiento
 * regulado (zona azul, carga y descarga, vado, PMR) con el importe que el agente ya guardó para SU
 * municipio, y permite editarlos o darlos de alta sin tener que buscarlos. Local-first (ADR-001).
 */
export function MisOrdenanzasScreen() {
  const t = useAppTheme();
  const router = useRouter();
  const municipioNombre = useSettingsStore((s) => s.municipioNombre);
  const cargar = useOrdenanzaPropiaStore((s) => s.cargar);
  const loaded = useOrdenanzaPropiaStore((s) => s.loaded);
  const registros = useOrdenanzaPropiaStore((s) => s.registros);

  useEffect(() => {
    if (!loaded) void cargar();
  }, [loaded, cargar]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.color.bg }}
      contentContainerStyle={{ padding: t.spacing.base, gap: t.spacing.md }}
    >
      <Stack.Screen options={{ title: 'Mi ordenanza' }} />

      <View style={{ gap: t.spacing.xs }}>
        <Text style={{ color: t.color.textSecondary, ...t.typography.scale.body }}>
          El importe del aparcamiento regulado lo fija la ordenanza de tu municipio
          {municipioNombre ? ` (${municipioNombre})` : ''} y no viaja en la app. Guarda aquí TUS
          importes: se quedan solo en tu móvil y aparecen al buscar («zona azul», «sin ticket»…) con
          el boletín listo para copiar.
        </Text>
      </View>

      <View style={{ gap: t.spacing.sm }}>
        {CONCEPTOS_APARCAMIENTO.map((c) => {
          const r = registros[c.id] ?? null;
          return (
            <PressableScale
              key={c.id}
              accessibilityRole="button"
              accessibilityLabel={`${c.label}. ${r ? `Importe ${formatEuros(r.importeEur)}` : 'Sin definir'}.`}
              accessibilityHint="Edita o define el importe de tu ordenanza"
              onPress={() => router.push(`/mi-ordenanza/${c.id}`)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: t.spacing.md,
                borderRadius: t.radius.md,
                borderWidth: 1,
                borderColor: r ? t.color.accent : t.color.border,
                backgroundColor: t.color.surface,
                padding: t.spacing.md,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: t.radius.md,
                  backgroundColor: r ? t.color.accentWeak : t.color.surfaceAlt,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <SquareParking size={22} color={r ? t.color.accent : t.color.textSecondary} strokeWidth={2} />
              </View>
              <View style={{ flex: 1, gap: t.spacing.xxs }}>
                <Text style={{ color: t.color.textPrimary, ...t.typography.scale.bodyStrong }}>
                  {c.label}
                </Text>
                <Text style={{ color: t.color.textSecondary, ...t.typography.scale.caption }}>
                  {r
                    ? `${formatEuros(r.importeEur)}${r.importeReducidoEur !== null ? ` · ${formatEuros(r.importeReducidoEur)}` : ''}${r.articulo ? ` · art. ${r.articulo}` : ''}`
                    : 'Sin definir — toca para poner tu importe'}
                </Text>
              </View>
              <ChevronRight size={20} color={t.color.textTertiary} strokeWidth={2} />
            </PressableScale>
          );
        })}
      </View>

      <Text style={{ color: t.color.textTertiary, ...t.typography.scale.caption, textAlign: 'center' }}>
        Datos guardados solo en este dispositivo. No se envían a ningún servidor.
      </Text>
    </ScrollView>
  );
}
