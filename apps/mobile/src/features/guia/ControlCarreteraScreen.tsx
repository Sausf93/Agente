import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle2, ChevronRight, Circle, RotateCcw } from 'lucide-react-native';
import { useAppTheme } from '@/ui/useAppTheme';
import type { Theme } from '@/ui/theme';
import { hapticSelection } from '@/ui/haptics';
import {
  CONTROL_CARRETERA,
  TOTAL_COMPROBACIONES,
  type Comprobacion,
} from './controlCarretera';

/**
 * "CONTROL DE CARRETERA": checklist INTERACTIVO para uso en directo (petición del GC de Tráfico). El
 * agente marca cada comprobación con un toque mientras la hace, y abre la ficha/guía de la que dude
 * sin teclear. Estado EFÍMERO (se reinicia en cada control; no persiste ni guarda datos de terceros).
 */
export function ControlCarreteraScreen() {
  const t = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [marcadas, setMarcadas] = useState<ReadonlySet<string>>(new Set());

  const toggle = (id: string) => {
    hapticSelection();
    setMarcadas((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const abrir = (item: Comprobacion) => {
    if (item.ruta) router.push(item.ruta as never);
    else if (item.fichaId) router.push(`/ficha/${item.fichaId}`);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.color.bg }}
      contentContainerStyle={{ paddingBottom: insets.bottom + t.spacing.xxl }}
    >
      {/* Barra de progreso + reinicio (uso en directo: siempre visible arriba). */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: t.spacing.base,
          paddingVertical: t.spacing.md,
        }}
      >
        <Text style={{ color: t.color.textPrimary, ...t.typography.scale.bodyStrong }}>
          {marcadas.size} / {TOTAL_COMPROBACIONES} comprobado
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Reiniciar el control"
          onPress={() => {
            hapticSelection();
            setMarcadas(new Set());
          }}
          disabled={marcadas.size === 0}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: t.spacing.xs,
            minHeight: t.touch.min,
            paddingHorizontal: t.spacing.sm,
            opacity: marcadas.size === 0 ? 0.4 : 1,
          }}
        >
          <RotateCcw size={18} color={t.color.accent} strokeWidth={2} />
          <Text style={{ color: t.color.accent, ...t.typography.scale.label }}>Reiniciar</Text>
        </Pressable>
      </View>

      {CONTROL_CARRETERA.map((grupo) => (
        <View key={grupo.titulo}>
          <Text
            style={{
              color: t.color.textSecondary,
              ...t.typography.scale.label,
              textTransform: 'uppercase',
              letterSpacing: 0.6,
              paddingHorizontal: t.spacing.base,
              paddingTop: t.spacing.lg,
              paddingBottom: t.spacing.xs,
            }}
          >
            {grupo.titulo}
          </Text>
          {grupo.items.map((item) => (
            <FilaComprobacion
              key={item.id}
              t={t}
              item={item}
              marcada={marcadas.has(item.id)}
              onToggle={() => toggle(item.id)}
              onAbrir={() => abrir(item)}
            />
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

/** Fila: casilla marcable (izq.) + etiqueta que abre la ficha (der.). Dos toques diferenciados. */
function FilaComprobacion({
  t,
  item,
  marcada,
  onToggle,
  onAbrir,
}: {
  t: Theme;
  item: Comprobacion;
  marcada: boolean;
  onToggle: () => void;
  onAbrir: () => void;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: t.color.border,
        backgroundColor: t.color.surface,
      }}
    >
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: marcada }}
        accessibilityLabel={item.label}
        onPress={onToggle}
        style={{
          width: 52,
          minHeight: t.touch.primaryHeight,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {marcada ? (
          <CheckCircle2 size={24} color={t.color.accent} strokeWidth={2} />
        ) : (
          <Circle size={24} color={t.color.textTertiary} strokeWidth={2} />
        )}
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityHint="Abre la ficha o la guía"
        onPress={onAbrir}
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          minHeight: t.touch.primaryHeight,
          paddingRight: t.spacing.base,
          gap: t.spacing.sm,
        }}
      >
        <View style={{ flex: 1, gap: 2 }}>
          <Text
            style={{
              color: t.color.textPrimary,
              ...t.typography.scale.body,
              textDecorationLine: marcada ? 'line-through' : 'none',
              opacity: marcada ? 0.6 : 1,
            }}
          >
            {item.label}
          </Text>
          {item.detalle ? (
            <Text style={{ color: t.color.textSecondary, ...t.typography.scale.caption }}>
              {item.detalle}
            </Text>
          ) : null}
        </View>
        <ChevronRight size={20} color={t.color.textTertiary} strokeWidth={2} />
      </Pressable>
    </View>
  );
}
