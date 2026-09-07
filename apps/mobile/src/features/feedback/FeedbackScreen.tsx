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
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight, MessageSquareText } from 'lucide-react-native';
import type { ContextoFeedback, TipoFeedback } from '@agente/shared';
import { useAppTheme } from '@/ui/useAppTheme';
import { Banner } from '@/ui/components/Banner';
import { Button } from '@/ui/components/Button';
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
  const router = useRouter();

  const items = useFeedbackStore((s) => s.items);
  const load = useFeedbackStore((s) => s.load);
  const add = useFeedbackStore((s) => s.add);
  const sendPending = useFeedbackStore((s) => s.sendPending);

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
      // PRIMERO se REGISTRA en el dispositivo (queda en "Mis sugerencias" con estado). El envío a
      // los fundadores es un paso aparte y opcional: nunca bloquea el registro.
      await add({ tipo, texto: texto.trim(), contexto: contextoInicial });
      setTexto('');
      setTipo(tipoInicial ?? 'sugerencia');
      Alert.alert(
        'Guardada',
        'Tu aportación ha quedado registrada en "Mis sugerencias". Podrás seguir su estado y ver nuestra respuesta ahí.',
      );
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

        {/* Acceso a "Mis sugerencias": el registro de todo lo enviado, con su estado y la
            respuesta del equipo. La lista completa vive en su propia pantalla. */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            items.length > 0
              ? `Mis sugerencias, ${items.length} guardadas`
              : 'Mis sugerencias'
          }
          accessibilityHint="Abre el registro de tus aportaciones con su estado"
          onPress={() => router.push('/mis-sugerencias')}
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
            <MessageSquareText size={22} color={t.color.accent} strokeWidth={2} />
          </View>
          <View style={{ flex: 1, gap: t.spacing.xxs }}>
            <Text style={{ color: t.color.textPrimary, ...t.typography.scale.bodyStrong }}>
              Mis sugerencias{items.length > 0 ? ` (${items.length})` : ''}
            </Text>
            <Text style={{ color: t.color.textSecondary, ...t.typography.scale.caption }}>
              Mira su estado y nuestra respuesta.
            </Text>
          </View>
          <ChevronRight size={20} color={t.color.textTertiary} strokeWidth={2} />
        </Pressable>

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
