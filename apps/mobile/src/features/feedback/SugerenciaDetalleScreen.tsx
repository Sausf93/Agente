import { useEffect } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EstadoFeedback } from '@agente/shared';
import { useAppTheme } from '@/ui/useAppTheme';
import { Badge } from '@/ui/components/Badge';
import { Banner } from '@/ui/components/Banner';
import { Button } from '@/ui/components/Button';
import { Card } from '@/ui/components/Card';
import { hapticSelection } from '@/ui/haptics';
import { formatFecha } from '@/features/ficha/format';
import { ESTADO_FEEDBACK_LABEL, TIPO_FEEDBACK_LABEL } from './serialize';
import { estadoBadgeTone } from './estadoUi';
import { useFeedbackStore } from './store';

/**
 * Detalle de UNA aportación de "Mis sugerencias" (sección 4.15): texto completo, estado, fecha y
 * la RESPUESTA del equipo en el mismo apartado (petición del socio). Mientras no exista backend
 * (ADR-001/011) la respuesta llega vacía y el estado se puede marcar SOLO en local; la
 * sincronización remota (respuesta bidireccional y cambio de estado del equipo) llegará con
 * Supabase (Fase 5).
 */
export interface SugerenciaDetalleScreenProps {
  id: string;
}

const ORDEN_ESTADOS = EstadoFeedback.options;

export function SugerenciaDetalleScreen({ id }: SugerenciaDetalleScreenProps) {
  const t = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const items = useFeedbackStore((s) => s.items);
  const load = useFeedbackStore((s) => s.load);
  const loaded = useFeedbackStore((s) => s.loaded);
  const updateEstado = useFeedbackStore((s) => s.updateEstado);
  const remove = useFeedbackStore((s) => s.remove);

  useEffect(() => {
    void load();
  }, [load]);

  const fb = items.find((f) => f.id === id);

  if (!fb) {
    return (
      <View style={{ flex: 1, backgroundColor: t.color.bg, padding: t.spacing.base }}>
        <Text
          style={{
            color: t.color.textSecondary,
            marginTop: insets.top + t.spacing.base,
            ...t.typography.scale.body,
          }}
        >
          {loaded ? 'Esta aportación ya no está en tu móvil.' : 'Cargando…'}
        </Text>
      </View>
    );
  }

  function onCambiarEstado(nuevo: EstadoFeedback) {
    if (!fb || nuevo === fb.estado) return;
    hapticSelection();
    void updateEstado(fb.id, nuevo);
  }

  function onBorrar() {
    if (!fb) return;
    Alert.alert('Borrar aportación', '¿Seguro que quieres borrarla de este dispositivo?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Borrar',
        style: 'destructive',
        onPress: () => {
          void remove(fb.id);
          router.back();
        },
      },
    ]);
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.color.bg }}
      contentContainerStyle={{
        paddingTop: insets.top + t.spacing.base,
        paddingBottom: insets.bottom + t.spacing.xxl,
        paddingHorizontal: t.spacing.base,
        gap: t.spacing.lg,
      }}
    >
      <View
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <Text style={{ color: t.color.textSecondary, ...t.typography.scale.caption }}>
          {`${TIPO_FEEDBACK_LABEL[fb.tipo]} · ${formatFecha(fb.createdAt)}`}
        </Text>
        <Badge label={ESTADO_FEEDBACK_LABEL[fb.estado]} tone={estadoBadgeTone(fb.estado)} />
      </View>

      <Card>
        <Text style={{ color: t.color.textPrimary, ...t.typography.scale.body }}>{fb.texto}</Text>
      </Card>

      <View style={{ gap: t.spacing.sm }}>
        <Text
          accessibilityRole="header"
          style={{ color: t.color.textPrimary, ...t.typography.scale.titleM }}
        >
          Respuesta del equipo
        </Text>
        {fb.respuesta ? (
          <Banner tone="success" title="Respuesta">
            {fb.respuesta}
          </Banner>
        ) : (
          <Text style={{ color: t.color.textSecondary, ...t.typography.scale.body }}>
            Aún no hay respuesta. Cuando la valoremos, la verás aquí mismo.
          </Text>
        )}
      </View>

      <View style={{ gap: t.spacing.sm }}>
        <Text style={{ color: t.color.textPrimary, ...t.typography.scale.label }}>Estado</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm }}>
          {ORDEN_ESTADOS.map((op) => {
            const activo = op === fb.estado;
            return (
              <Pressable
                key={op}
                accessibilityRole="button"
                accessibilityLabel={`Marcar como ${ESTADO_FEEDBACK_LABEL[op]}`}
                accessibilityState={{ selected: activo }}
                onPress={() => onCambiarEstado(op)}
                style={{
                  minHeight: t.touch.min,
                  justifyContent: 'center',
                  borderRadius: t.radius.md,
                  borderWidth: 1,
                  borderColor: activo ? t.color.brand : t.color.border,
                  backgroundColor: activo ? t.color.accentWeak : t.color.surface,
                  paddingHorizontal: t.spacing.md,
                  paddingVertical: t.spacing.sm,
                }}
              >
                <Text
                  style={{
                    color: activo ? t.color.brand : t.color.textSecondary,
                    ...t.typography.scale.label,
                    fontWeight: activo ? '700' : '600',
                  }}
                >
                  {ESTADO_FEEDBACK_LABEL[op]}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={{ color: t.color.textTertiary, ...t.typography.scale.caption }}>
          Por ahora el estado lo marcas tú en tu móvil. Cuando tengamos servidor, lo actualizaremos
          nosotros y recibirás nuestra respuesta.
        </Text>
      </View>

      <Button
        title="Borrar de este dispositivo"
        variant="secondary"
        onPress={onBorrar}
        accessibilityHint="Elimina esta aportación de tu móvil"
      />
    </ScrollView>
  );
}
