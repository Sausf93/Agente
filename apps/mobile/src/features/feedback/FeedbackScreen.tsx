import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ContextoFeedback, Feedback, TipoFeedback } from '@agente/shared';
import { useAppTheme } from '@/ui/useAppTheme';
import type { Theme } from '@/ui/theme';
import { Badge } from '@/ui/components/Badge';
import { Banner } from '@/ui/components/Banner';
import { Button } from '@/ui/components/Button';
import { Card } from '@/ui/components/Card';
import { TIPO_FEEDBACK_LABEL } from './serialize';
import { useFeedbackStore } from './store';

/**
 * Pantalla de SUGERENCIAS / REPORTAR PROBLEMA (sección 4.15).
 *
 * Local-first y anónima (ADR-011): guarda en el dispositivo y permite mandar el
 * pendiente a los fundadores con el compositor nativo. Sin login, sin red.
 *
 * `contextoInicial` prerrellena el tipo y el contexto cuando se abre desde una ficha
 * (gancho "reportar error"); desde "Más" llega vacío.
 */
export interface FeedbackScreenProps {
  tipoInicial?: TipoFeedback | undefined;
  contextoInicial?: Partial<ContextoFeedback> | undefined;
}

const ORDEN_TIPOS: TipoFeedback[] = ['sugerencia', 'error_contenido', 'error_tecnico'];

/**
 * Etiqueta corta para el selector segmentado (3 columnas): la larga
 * ("Error de contenido") se parte en varias líneas y descuadra. La larga
 * se conserva como `accessibilityLabel` para el lector de pantalla.
 */
const TIPO_FEEDBACK_CORTO: Record<TipoFeedback, string> = {
  sugerencia: 'Sugerencia',
  error_contenido: 'Contenido',
  error_tecnico: 'Técnico',
};

export function FeedbackScreen({ tipoInicial, contextoInicial }: FeedbackScreenProps) {
  const t = useAppTheme();
  const insets = useSafeAreaInsets();

  const items = useFeedbackStore((s) => s.items);
  const load = useFeedbackStore((s) => s.load);
  const add = useFeedbackStore((s) => s.add);
  const sendPending = useFeedbackStore((s) => s.sendPending);
  const remove = useFeedbackStore((s) => s.remove);

  const [tipo, setTipo] = useState<TipoFeedback>(tipoInicial ?? 'sugerencia');
  const [texto, setTexto] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    void load();
  }, [load]);

  const pendientes = useMemo(() => items.filter((fb) => !fb.enviado), [items]);
  const puedeGuardar = texto.trim().length >= 3 && !guardando;

  async function onGuardar() {
    if (!puedeGuardar) return;
    setGuardando(true);
    try {
      await add({ tipo, texto: texto.trim(), contexto: contextoInicial });
      setTexto('');
      setTipo(tipoInicial ?? 'sugerencia');
    } catch {
      Alert.alert('No se pudo guardar', 'Inténtalo de nuevo.');
    } finally {
      setGuardando(false);
    }
  }

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

  function onBorrar(fb: Feedback) {
    Alert.alert('Borrar aportación', '¿Seguro que quieres borrarla de este dispositivo?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Borrar', style: 'destructive', onPress: () => void remove(fb.id) },
    ]);
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: t.color.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + t.spacing.base,
          paddingBottom: insets.bottom + t.spacing.xxl,
          paddingHorizontal: t.spacing.base,
          gap: t.spacing.lg,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View>
          <Text
            accessibilityRole="header"
            style={{ color: t.color.textPrimary, ...t.typography.scale.titleXL }}
          >
            Sugerencias y reportes
          </Text>
          <Text
            style={{
              color: t.color.textSecondary,
              marginTop: t.spacing.xs,
              ...t.typography.scale.body,
            }}
          >
            Cuéntanos qué mejorarías o qué falla. Se guarda en tu móvil; tú decides cuándo
            enviárnoslo.
          </Text>
        </View>

        <Banner tone="info" title="Privacidad">
          No incluyas matrículas, nombres, DNI ni datos de intervenciones. Es anónimo y no se hacen
          capturas.
        </Banner>

        <View style={{ gap: t.spacing.sm }}>
          <Text style={{ color: t.color.textPrimary, ...t.typography.scale.label }}>Tipo</Text>
          <View style={{ flexDirection: 'row', gap: t.spacing.sm }}>
            {ORDEN_TIPOS.map((op) => {
              const activo = op === tipo;
              return (
                <Pressable
                  key={op}
                  accessibilityRole="button"
                  accessibilityLabel={TIPO_FEEDBACK_LABEL[op]}
                  accessibilityState={{ selected: activo }}
                  onPress={() => setTipo(op)}
                  style={{
                    flex: 1,
                    minHeight: t.touch.min,
                    borderRadius: t.radius.md,
                    borderWidth: 1,
                    borderColor: activo ? t.color.brand : t.color.border,
                    backgroundColor: activo ? t.color.infoBg : t.color.surface,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: t.spacing.xs,
                    paddingVertical: t.spacing.sm,
                  }}
                >
                  <Text
                    numberOfLines={1}
                    style={{
                      color: activo ? t.color.brand : t.color.textSecondary,
                      textAlign: 'center',
                      ...t.typography.scale.label,
                      fontWeight: activo ? '700' : '600',
                    }}
                  >
                    {TIPO_FEEDBACK_CORTO[op]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={{ gap: t.spacing.sm }}>
          <Text style={{ color: t.color.textPrimary, ...t.typography.scale.label }}>
            Tu mensaje
          </Text>
          <TextInput
            accessibilityLabel="Tu mensaje"
            value={texto}
            onChangeText={setTexto}
            multiline
            placeholder="Escribe aquí tu sugerencia o el problema que has visto…"
            placeholderTextColor={t.color.textTertiary}
            maxLength={2000}
            style={{
              minHeight: 120,
              borderRadius: t.radius.md,
              borderWidth: 1,
              borderColor: t.color.border,
              backgroundColor: t.color.surface,
              color: t.color.textPrimary,
              padding: t.spacing.md,
              textAlignVertical: 'top',
              ...t.typography.scale.body,
            }}
          />
        </View>

        <Button
          title="Guardar"
          onPress={onGuardar}
          disabled={!puedeGuardar}
          accessibilityHint="Guarda la aportación en este dispositivo"
        />

        <View style={{ gap: t.spacing.sm, marginTop: t.spacing.sm }}>
          <Text
            accessibilityRole="header"
            style={{ color: t.color.textPrimary, ...t.typography.scale.titleM }}
          >
            Mis aportaciones
          </Text>

          {items.length === 0 ? (
            <Text style={{ color: t.color.textSecondary, ...t.typography.scale.body }}>
              Aún no has guardado ninguna.
            </Text>
          ) : (
            items.map((fb) => <TarjetaFeedback key={fb.id} t={t} fb={fb} onBorrar={onBorrar} />)
          )}
        </View>

        {pendientes.length > 0 && (
          <Button
            title={`Enviar a los fundadores (${pendientes.length})`}
            variant="secondary"
            onPress={onEnviar}
            accessibilityHint="Abre el correo o la hoja de compartir para mandar lo pendiente"
          />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function TarjetaFeedback({
  t,
  fb,
  onBorrar,
}: {
  t: Theme;
  fb: Feedback;
  onBorrar: (fb: Feedback) => void;
}) {
  return (
    <Card>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ color: t.color.textSecondary, ...t.typography.scale.caption }}>
          {TIPO_FEEDBACK_LABEL[fb.tipo]}
        </Text>
        <Badge label={fb.enviado ? 'Enviado' : 'Pendiente'} tone={fb.enviado ? 'success' : 'info'} />
      </View>
      <Text style={{ color: t.color.textPrimary, ...t.typography.scale.body }}>{fb.texto}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Borrar esta aportación"
        onPress={() => onBorrar(fb)}
        hitSlop={8}
        style={{ minHeight: t.touch.min, justifyContent: 'center' }}
      >
        <Text style={{ color: t.color.danger, ...t.typography.scale.caption }}>Borrar</Text>
      </Pressable>
    </Card>
  );
}
