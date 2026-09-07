import { useMemo, useState } from 'react';
import { Pressable, Switch, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  SlidersHorizontal,
} from 'lucide-react-native';
import {
  evaluarDetencion,
  type EntradaDetencionNormalizada,
  type GravedadPenal,
  type TramoEdadAutor,
} from '@agente/shared';

/** Opciones del selector de gravedad de la pena (art. 33 CP), en orden ascendente. */
const GRAVEDAD_OPCIONES: readonly { valor: GravedadPenal; etiqueta: string }[] = [
  { valor: 'leve', etiqueta: 'Leve' },
  { valor: 'menos_grave', etiqueta: 'Menos grave' },
  { valor: 'grave', etiqueta: 'Grave' },
];
import { useAppTheme } from '@/ui/useAppTheme';
import type { Theme } from '@/ui/theme';
import { Button } from '@/ui/components/Button';
import { Card } from '@/ui/components/Card';
import { hapticSelection } from '@/ui/haptics';
import { useReduceMotion } from '@/ui/motion';
import {
  CIRCUNSTANCIAS_DETENCION,
  MIGRATORIO_AYUDA,
  MIGRATORIO_ETIQUETA,
  ORIENTACION_VISUAL,
  TRAMOS_EDAD,
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
  // Los controles para afinar el caso van PLEGADOS: en la calle el agente quiere LEER la
  // orientación y actuar, no ir tocando toggles. Solo despliega quien quiera modelar un caso
  // concreto (otra gravedad, sin domicilio, etc.).
  const [mostrarAfinar, setMostrarAfinar] = useState(false);

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

  function elegirGravedad(g: GravedadPenal) {
    if (entrada?.gravedadCp === g) return;
    hapticSelection();
    setEntrada((prev) => (prev ? { ...prev, gravedadCp: g } : prev));
  }

  function elegirEdad(edad: TramoEdadAutor) {
    if (entrada?.edadAutor === edad) return;
    hapticSelection();
    setEntrada((prev) => (prev ? { ...prev, edadAutor: edad } : prev));
  }

  function alternarMigratorio(valor: boolean) {
    hapticSelection();
    setEntrada((prev) => (prev ? { ...prev, soloHechoMigratorio: valor } : prev));
  }

  return (
    <View style={{ gap: t.spacing.sm }}>
      <Text style={{ color: t.color.textPrimary, ...t.typography.scale.label }}>
        Detención: qué procede
      </Text>
      <Text style={{ color: t.color.textSecondary, ...t.typography.scale.caption }}>
        Orientación para este caso según la LECrim. Léela y valórala; la decisión final es tuya y
        del juez. Si tu caso es distinto, puedes afinarlo abajo.
      </Text>

      {/* RESULTADO PRIMERO: el agente LEE la orientación y actúa. Color + texto (nunca solo color)
          + motivo + fuentes + pie de responsabilidad. */}
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
          <Icono size={24} color={tono.accent} strokeWidth={2.2} />
          <Text style={{ color: tono.accent, ...t.typography.scale.titleM }}>
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

      {/* AVISO DE MENOR destacado: especialidades del régimen del menor (art. 17 LO 5/2000) o
          protección de menores / MENA en el hecho migratorio. Solo aparece cuando el motor lo da.
          Color fijo de aviso (ámbar), con icono que refuerza el texto (nunca lo sustituye). */}
      {resultado.avisosMenor ? (
        <Animated.View
          {...(reduceMotion ? {} : { entering: FadeIn.duration(t.motion.durFast) })}
          style={{
            flexDirection: 'row',
            gap: t.spacing.sm,
            borderRadius: t.radius.md,
            borderWidth: 1,
            borderColor: t.color.warning,
            backgroundColor: t.color.warningBg,
            padding: t.spacing.md,
          }}
        >
          <AlertTriangle size={20} color={t.color.warning} strokeWidth={2.2} />
          <View style={{ flex: 1, gap: t.spacing.xxs }}>
            <Text style={{ color: t.color.warning, ...t.typography.scale.label }}>
              Especialidades del menor
            </Text>
            <Text style={{ color: t.color.textPrimary, ...t.typography.scale.body }}>
              {resultado.avisosMenor}
            </Text>
          </View>
        </Animated.View>
      ) : null}

      {/* Si la orientación es que la detención procede o puede proceder, ofrecer la lectura de
          derechos al detenido (art. 520, §4.11). Orientativo: el agente decide. */}
      {resultado.orientacion === 'procede' || resultado.orientacion === 'puede_proceder' ? (
        <Button
          title="Leer derechos al detenido (art. 520)"
          variant="secondary"
          accessibilityHint="Abre los derechos del detenido en varios idiomas para leérselos"
          onPress={() => router.push('/derechos')}
        />
      ) : null}

      {/* AFINAR EL CASO: plegado por defecto. Solo lo abre quien quiera modelar otra gravedad o
          circunstancias concretas. En la calle se lee el resultado de arriba y punto. */}
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: mostrarAfinar }}
        accessibilityLabel="Afinar el caso"
        onPress={() => {
          hapticSelection();
          setMostrarAfinar((v) => !v);
        }}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: t.spacing.sm,
          minHeight: t.touch.min,
          paddingVertical: t.spacing.xs,
        }}
      >
        <SlidersHorizontal size={18} color={t.color.textSecondary} strokeWidth={2} />
        <Text style={{ flex: 1, color: t.color.textSecondary, ...t.typography.scale.label }}>
          {mostrarAfinar ? 'Ocultar el detalle del caso' : 'Afinar el caso (otra gravedad, circunstancias)'}
        </Text>
        {mostrarAfinar ? (
          <ChevronUp size={18} color={t.color.textTertiary} strokeWidth={2} />
        ) : (
          <ChevronDown size={18} color={t.color.textTertiary} strokeWidth={2} />
        )}
      </Pressable>

      {mostrarAfinar ? (
        <View style={{ gap: t.spacing.sm }}>
          {/* EDAD del autor (3 tramos excluyentes, NO toggle): la edad puede cortocircuitar el
              árbol penal (menor de 14 = inimputable; 14-17 = régimen del menor). §1.1. */}
          <View style={{ gap: t.spacing.xs }}>
            <Text style={{ color: t.color.textPrimary, ...t.typography.scale.body }}>
              Edad del autor
            </Text>
            <View style={{ flexDirection: 'row', gap: t.spacing.xs }}>
              {TRAMOS_EDAD.map((op) => {
                const activo = entrada.edadAutor === op.valor;
                return (
                  <Pressable
                    key={op.valor}
                    accessibilityRole="button"
                    accessibilityState={{ selected: activo }}
                    accessibilityLabel={op.etiqueta}
                    accessibilityHint={op.ayuda}
                    onPress={() => elegirEdad(op.valor)}
                    style={{
                      flex: 1,
                      minHeight: t.touch.min,
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingVertical: t.spacing.xs,
                      paddingHorizontal: t.spacing.xs,
                      borderRadius: t.radius.md,
                      borderWidth: 1,
                      borderColor: activo ? t.color.accent : t.color.border,
                      backgroundColor: activo ? t.color.accentWeak : t.color.surface,
                    }}
                  >
                    <Text
                      style={{
                        color: activo ? t.color.accent : t.color.textPrimary,
                        ...t.typography.scale.caption,
                        textAlign: 'center',
                      }}
                    >
                      {op.etiqueta}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={{ color: t.color.textTertiary, ...t.typography.scale.caption }}>
              {TRAMOS_EDAD.find((op) => op.valor === entrada.edadAutor)?.ayuda}
            </Text>
          </View>

          {/* Toggle "Solo estancia irregular (sin delito)" con AYUDA ANTI-ERROR (§1.2): es un
              discriminador de rama (extranjería), NO un agravante. */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: t.spacing.md,
              minHeight: t.touch.min,
              paddingVertical: t.spacing.xs,
            }}
          >
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ color: t.color.textPrimary, ...t.typography.scale.body }}>
                {MIGRATORIO_ETIQUETA}
              </Text>
              <Text style={{ color: t.color.textTertiary, ...t.typography.scale.caption }}>
                {MIGRATORIO_AYUDA}
              </Text>
            </View>
            <Switch
              accessibilityLabel={MIGRATORIO_ETIQUETA}
              accessibilityHint={MIGRATORIO_AYUDA}
              value={entrada.soloHechoMigratorio}
              onValueChange={alternarMigratorio}
              trackColor={{ true: t.color.accent, false: t.color.surfaceAlt }}
              thumbColor={t.color.surface}
              ios_backgroundColor={t.color.surfaceAlt}
            />
          </View>

          {/* Gravedad del delito: cambia radicalmente la orientación (art. 33 CP). */}
          <View style={{ gap: t.spacing.xs }}>
            <Text style={{ color: t.color.textPrimary, ...t.typography.scale.body }}>
              Gravedad del delito
            </Text>
            <View style={{ flexDirection: 'row', gap: t.spacing.xs }}>
              {GRAVEDAD_OPCIONES.map((op) => {
                const activo = entrada.gravedadCp === op.valor;
                return (
                  <Pressable
                    key={op.valor}
                    accessibilityRole="button"
                    accessibilityState={{ selected: activo }}
                    accessibilityLabel={op.etiqueta}
                    onPress={() => elegirGravedad(op.valor)}
                    style={{
                      flex: 1,
                      minHeight: t.touch.min,
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingVertical: t.spacing.xs,
                      paddingHorizontal: t.spacing.xs,
                      borderRadius: t.radius.md,
                      borderWidth: 1,
                      borderColor: activo ? t.color.accent : t.color.border,
                      backgroundColor: activo ? t.color.accentWeak : t.color.surface,
                    }}
                  >
                    <Text
                      style={{
                        color: activo ? t.color.accent : t.color.textPrimary,
                        ...t.typography.scale.caption,
                        textAlign: 'center',
                      }}
                    >
                      {op.etiqueta}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={{ color: t.color.textTertiary, ...t.typography.scale.caption }}>
              La gravedad de la pena (art. 33 CP) cambia la orientación. Ojo: en el hurto, hasta
              400 € es leve; más de 400 €, menos grave.
            </Text>
          </View>

          {/* Circunstancias que observa el agente (cada una alimenta el motor en vivo). */}
          <Text style={{ color: t.color.textSecondary, ...t.typography.scale.caption }}>
            Marca lo que observes en este caso:
          </Text>
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
        </View>
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
