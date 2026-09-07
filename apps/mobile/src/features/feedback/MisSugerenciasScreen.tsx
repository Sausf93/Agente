import { useEffect } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MessageSquarePlus } from 'lucide-react-native';
import { useAppTheme } from '@/ui/useAppTheme';
import { Badge } from '@/ui/components/Badge';
import { Button } from '@/ui/components/Button';
import { EmptyState } from '@/ui/components/EmptyState';
import { ListRow } from '@/ui/components/ListRow';
import { formatFecha } from '@/features/ficha/format';
import { ESTADO_FEEDBACK_LABEL, TIPO_FEEDBACK_LABEL } from './serialize';
import { estadoBadgeTone } from './estadoUi';
import { useFeedbackStore } from './store';

/**
 * "Mis sugerencias" (sección 4.15): el registro LOCAL de todo lo que el socio ha enviado, con
 * su ESTADO (chip de color + texto) y fecha, lo más reciente primero. Al tocar una fila se abre
 * su detalle (texto completo + estado + respuesta del equipo, si la hay).
 *
 * Local-first (ADR-001): la lista vive en el dispositivo (`user.db`). El estado y la respuesta
 * del equipo se gestionan HOY solo en local; la sincronización remota llegará con Supabase
 * (Fase 5, ADR-011). Sin red, sin login.
 */
export function MisSugerenciasScreen() {
  const t = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const items = useFeedbackStore((s) => s.items);
  const load = useFeedbackStore((s) => s.load);
  const sendPending = useFeedbackStore((s) => s.sendPending);

  useEffect(() => {
    void load();
  }, [load]);

  const pendientes = items.filter((fb) => !fb.enviado);

  async function onEnviar() {
    if (pendientes.length === 0) return;
    try {
      const result = await sendPending();
      if (result === 'cancelled') return;
      Alert.alert('Gracias', 'Tu aportación se ha preparado para enviar a los fundadores.');
    } catch {
      Alert.alert('No se pudo abrir el correo', 'Prueba a compartirlo por otra vía.');
    }
  }

  if (items.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: t.color.bg }}>
        <EmptyState
          icon={MessageSquarePlus}
          title="Aún no has enviado nada"
          message="Cuando dejes una sugerencia o reportes un problema, aparecerá aquí con su estado y podrás ver nuestra respuesta."
          actionLabel="Escribir una sugerencia"
          onAction={() => router.replace('/feedback')}
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.color.bg }}
      contentContainerStyle={{
        paddingTop: insets.top + t.spacing.base,
        paddingBottom: insets.bottom + t.spacing.xxl,
        gap: t.spacing.md,
      }}
    >
      <Text
        style={{
          color: t.color.textSecondary,
          paddingHorizontal: t.spacing.base,
          ...t.typography.scale.caption,
        }}
      >
        Todo lo que has enviado se guarda en tu móvil. Toca una para ver el detalle y nuestra
        respuesta.
      </Text>

      <View style={{ borderTopWidth: 1, borderTopColor: t.color.border }}>
        {items.map((fb) => (
          <ListRow
            key={fb.id}
            title={fb.texto}
            meta={`${TIPO_FEEDBACK_LABEL[fb.tipo]} · ${formatFecha(fb.createdAt)}`}
            right={<Badge label={ESTADO_FEEDBACK_LABEL[fb.estado]} tone={estadoBadgeTone(fb.estado)} />}
            accessibilityLabel={`${TIPO_FEEDBACK_LABEL[fb.tipo]}, estado ${ESTADO_FEEDBACK_LABEL[fb.estado]}`}
            accessibilityHint="Abre el detalle de esta aportación"
            onPress={() => router.push(`/sugerencia/${fb.id}`)}
          />
        ))}
      </View>

      {pendientes.length > 0 ? (
        <View style={{ paddingHorizontal: t.spacing.base }}>
          <Button
            title={`Enviar a los fundadores (${pendientes.length})`}
            variant="secondary"
            onPress={onEnviar}
            accessibilityHint="Abre el correo o la hoja de compartir para mandar lo pendiente"
          />
        </View>
      ) : null}
    </ScrollView>
  );
}
