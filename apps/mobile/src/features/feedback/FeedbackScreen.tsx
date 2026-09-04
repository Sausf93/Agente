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
          <Text style={{ color: t.color.textPrimary, ...t.typography.scale.titleXL }}>
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

        <AvisoPrivacidad t={t} />

        <View style={{ gap: t.spacing.sm }}>
          <Text style={{ color: t.color.textPrimary, ...t.typography.scale.label }}>Tipo</Text>
          <View style={{ flexDirection: 'row', gap: t.spacing.sm }}>
            {ORDEN_TIPOS.map((op) => {
              const activo = op === tipo;
              return (
                <Pressable
                  key={op}
                  accessibilityRole="button"
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
                    style={{
                      color: activo ? t.color.brand : t.color.textSecondary,
                      textAlign: 'center',
                      ...t.typography.scale.caption,
                      fontWeight: activo ? '700' : '600',
                    }}
                  >
                    {TIPO_FEEDBACK_LABEL[op]}
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

        <Pressable
          accessibilityRole="button"
          disabled={!puedeGuardar}
          onPress={onGuardar}
          style={{
            minHeight: t.touch.primaryHeight,
            borderRadius: t.radius.md,
            backgroundColor: puedeGuardar ? t.color.brand : t.color.surfaceAlt,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              color: puedeGuardar ? t.color.textOnBrand : t.color.textTertiary,
              ...t.typography.scale.bodyStrong,
            }}
          >
            Guardar
          </Text>
        </Pressable>

        <View style={{ gap: t.spacing.sm, marginTop: t.spacing.sm }}>
          <Text style={{ color: t.color.textPrimary, ...t.typography.scale.titleM }}>
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
          <Pressable
            accessibilityRole="button"
            onPress={onEnviar}
            style={{
              minHeight: t.touch.primaryHeight,
              borderRadius: t.radius.md,
              borderWidth: 1,
              borderColor: t.color.brand,
              backgroundColor: t.color.surface,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: t.color.brand, ...t.typography.scale.bodyStrong }}>
              Enviar a los fundadores ({pendientes.length})
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/** Aviso FIJO de privacidad (regla CLAUDE.md): nada de datos de terceros. */
function AvisoPrivacidad({ t }: { t: Theme }) {
  return (
    <View
      style={{
        borderRadius: t.radius.md,
        backgroundColor: t.color.warningBg,
        borderWidth: 1,
        borderColor: t.color.warning,
        padding: t.spacing.md,
      }}
    >
      <Text style={{ color: t.color.textPrimary, ...t.typography.scale.bodyStrong }}>
        Privacidad
      </Text>
      <Text
        style={{ color: t.color.textPrimary, marginTop: t.spacing.xs, ...t.typography.scale.body }}
      >
        No incluyas matrículas, nombres, DNI ni datos de intervenciones. El feedback es anónimo y
        no se hacen capturas automáticas.
      </Text>
    </View>
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
    <View
      style={{
        borderRadius: t.radius.md,
        borderWidth: 1,
        borderColor: t.color.border,
        backgroundColor: t.color.surface,
        padding: t.spacing.md,
        gap: t.spacing.xs,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ color: t.color.textSecondary, ...t.typography.scale.caption }}>
          {TIPO_FEEDBACK_LABEL[fb.tipo]}
        </Text>
        <EstadoBadge t={t} enviado={fb.enviado} />
      </View>
      <Text style={{ color: t.color.textPrimary, ...t.typography.scale.body }}>{fb.texto}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => onBorrar(fb)}
        hitSlop={8}
        style={{ minHeight: t.touch.min, justifyContent: 'center' }}
      >
        <Text style={{ color: t.color.danger, ...t.typography.scale.caption }}>Borrar</Text>
      </Pressable>
    </View>
  );
}

/** Estado con texto + color (nunca solo color, regla UI 2.4). */
function EstadoBadge({ t, enviado }: { t: Theme; enviado: boolean }) {
  const bg = enviado ? t.color.successBg : t.color.infoBg;
  const fg = enviado ? t.color.success : t.color.info;
  return (
    <View
      style={{
        borderRadius: t.radius.pill,
        backgroundColor: bg,
        paddingHorizontal: t.spacing.sm,
        paddingVertical: t.spacing.xxs,
      }}
    >
      <Text style={{ color: fg, ...t.typography.scale.caption, fontWeight: '700' }}>
        {enviado ? 'Enviado' : 'Pendiente'}
      </Text>
    </View>
  );
}
