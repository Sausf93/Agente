import { useMemo, useState } from 'react';
import { Switch, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { ShieldAlert, ShieldCheck, ShieldX } from 'lucide-react-native';
import {
  evaluarDetencion,
  type EntradaDetencionNormalizada,
} from '@agente/shared';
import { useAppTheme } from '@/ui/useAppTheme';
import type { Theme } from '@/ui/theme';
import { Button } from '@/ui/components/Button';
import { Card } from '@/ui/components/Card';
import { hapticSelection } from '@/ui/haptics';
import { useReduceMotion } from '@/ui/motion';
import {
  CIRCUNSTANCIAS_DETENCION,
  ORIENTACION_VISUAL,
  parseReglaDetencion,
  type CampoCircunstancia,
  type TonoOrientacion,
} from './detencion';

/**
 * ÁRBOL DE DETENCIÓN INTERACTIVO (§4.6). Para las consecuencias de tipo `detencion`: el agente
 * activa las circunstancias que observa (flagrancia, indicios, riesgo de incomparecencia…) y el
 * panel llama EN VIVO a `evaluarDetencion` (motor puro de `@agente/shared`, ya testeado) para
 * mostrar la orientación con COLOR + TEXTO (verde procede / ámbar puede / rojo no procede), el
 * motivo, las fuentes (artículos) y el PIE de responsabilidad fijo.
 *
 * Contenido sensible: SIEMPRE orientativo, nunca imperativo. El estado inicial es el
 * `escenarioBase` que trae la `regla` de la consecuencia (misma fuente de verdad que la ficha).
 */
export interface DetencionTreeProps {
  regla: Record<string, unknown> | null;
}

/** Devuelve el panel, o `null` si la regla no es un árbol de detención válido. */
export function DetencionTree({ regla }: DetencionTreeProps) {
  const t = useAppTheme();
  const router = useRouter();
  const reduceMotion = useReduceMotion();
  const base = useMemo(() => parseReglaDetencion(regla), [regla]);
  const [entrada, setEntrada] = useState<EntradaDetencionNormalizada | null>(base);

  if (!base || !entrada) return null;

  const resultado = evaluarDetencion(entrada);
  const visual = ORIENTACION_VISUAL[resultado.orientacion];
  const tono = tonoColores(t, visual.tono);
  const Icono =
    visual.icono === 'shield-check'
      ? ShieldCheck
      : visual.icono === 'shield-alert'
        ? ShieldAlert
        : ShieldX;

  function alternar(campo: CampoCircunstancia, valor: boolean) {
    hapticSelection();
    setEntrada((prev) => (prev ? { ...prev, [campo]: valor } : prev));
  }

  return (
    <View style={{ gap: t.spacing.sm }}>
      <Text style={{ color: t.color.textPrimary, ...t.typography.scale.label }}>
        Valorar la detención
      </Text>
      <Text style={{ color: t.color.textSecondary, ...t.typography.scale.caption }}>
        Marca lo que observes. La orientación se recalcula al momento.
      </Text>

      {/* Toggles por circunstancia (cada uno alimenta el motor en vivo). */}
      <Card>
        {CIRCUNSTANCIAS_DETENCION.map((c, i) => (
          <View
            key={c.campo}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: t.spacing.md,
              minHeight: t.touch.min,
              paddingVertical: t.spacing.xs,
              borderTopWidth: i === 0 ? 0 : 1,
              borderTopColor: t.color.border,
            }}
          >
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ color: t.color.textPrimary, ...t.typography.scale.body }}>
                {c.etiqueta}
              </Text>
              <Text style={{ color: t.color.textTertiary, ...t.typography.scale.caption }}>
                {c.ayuda}
              </Text>
            </View>
            <Switch
              accessibilityLabel={c.etiqueta}
              accessibilityHint={c.ayuda}
              value={Boolean(entrada[c.campo])}
              onValueChange={(v) => alternar(c.campo, v)}
              trackColor={{ true: t.color.accent, false: t.color.surfaceAlt }}
              thumbColor={t.color.surface}
              ios_backgroundColor={t.color.surfaceAlt}
            />
          </View>
        ))}
      </Card>

      {/* Resultado orientativo: COLOR + TEXTO (nunca solo color) + motivo + fuentes + pie. */}
      <Animated.View
        // Fundido suave al recalcular (clave por orientación). Se desactiva con reduce-motion.
        key={resultado.orientacion}
        {...(reduceMotion ? {} : { entering: FadeIn.duration(t.motion.durFast) })}
        style={{
          borderRadius: t.radius.md,
          borderWidth: 1,
          borderColor: tono.accent,
          backgroundColor: tono.bg,
          padding: t.spacing.md,
          gap: t.spacing.sm,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm }}>
          <Icono size={22} color={tono.accent} strokeWidth={2.2} />
          <Text style={{ color: tono.accent, ...t.typography.scale.bodyStrong }}>
            {visual.etiqueta}
          </Text>
        </View>
        <Text style={{ color: t.color.textPrimary, ...t.typography.scale.bodyStrong }}>
          {resultado.titulo}
        </Text>
        <Text style={{ color: t.color.textPrimary, ...t.typography.scale.body }}>
          {resultado.motivo}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.xs }}>
          {resultado.fuentes.map((f) => (
            <View
              key={f}
              style={{
                borderRadius: t.radius.pill,
                borderWidth: 1,
                borderColor: t.color.border,
                backgroundColor: t.color.surface,
                paddingHorizontal: t.spacing.sm,
                paddingVertical: t.spacing.xxs,
              }}
            >
              <Text style={{ color: t.color.textSecondary, ...t.typography.scale.caption }}>{f}</Text>
            </View>
          ))}
        </View>
        <Text style={{ color: t.color.textTertiary, ...t.typography.scale.caption }}>
          {resultado.pie}
        </Text>
      </Animated.View>

      {/* Si la orientación es que la detención procede o puede proceder, ofrecer la lectura de
          derechos al detenido (art. 520, §4.11). Orientativo: el agente decide. */}
      {resultado.orientacion !== 'no_procede_salvo' ? (
        <Button
          title="Leer derechos al detenido (art. 520)"
          variant="secondary"
          accessibilityHint="Abre los derechos del detenido en varios idiomas para leérselos"
          onPress={() => router.push('/derechos')}
        />
      ) : null}
    </View>
  );
}

/** Traduce el tono de la orientación a los colores semánticos del tema (verde/ámbar/rojo). */
function tonoColores(t: Theme, tono: TonoOrientacion): { accent: string; bg: string } {
  switch (tono) {
    case 'procede':
      return { accent: t.color.success, bg: t.color.successBg };
    case 'puede':
      return { accent: t.color.warning, bg: t.color.warningBg };
    case 'noProcede':
      return { accent: t.color.danger, bg: t.color.dangerBg };
  }
}
