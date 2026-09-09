import { type ComponentType, type ReactNode, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ChevronDown, ChevronRight, type LucideProps } from 'lucide-react-native';
import type { Theme } from '@/ui/theme';

/**
 * Sección PLEGABLE del formulario de documentos (§4.8, rediseño "ágil en la calle"). Cuando un
 * bloque ya viene relleno (lo legal desde la ficha, la identidad recordada) se muestra plegado a
 * un resumen de una línea con lo crítico, y un "Editar ▸" lo expande a los inputs de siempre. Así
 * el agente revisa de un vistazo (un importe erróneo se ve sin abrir) y solo teclea si hace falta.
 *
 * El estado abierto/plegado es interno; `initialOpen` fija el arranque (montar la sección solo
 * cuando los valores ya están cargados garantiza que el arranque sea el correcto).
 */
export interface SeccionPlegableProps {
  t: Theme;
  /** Título del bloque (p. ej. "Ya rellenado por la app"). */
  titulo: string;
  /** Resumen de una línea que se ve cuando está plegado (valores críticos). */
  resumen: string;
  /** Estado inicial: abierto (entrada en frío) o plegado (ya viene relleno). */
  initialOpen: boolean;
  /** Estilo destacado (borde y fondo de acento) para el bloque legal prerrelleno. */
  resaltado?: boolean;
  /** Icono Lucide opcional a la izquierda del título. */
  icon?: ComponentType<LucideProps>;
  /** Texto de ayuda bajo el título cuando está abierto (p. ej. el hint del bloque legal en frío). */
  hint?: string;
  /** Etiqueta accesible del control de plegado (p. ej. "el bloque legal"). */
  accessibilityLabel?: string;
  children: ReactNode;
}

export function SeccionPlegable({
  t,
  titulo,
  resumen,
  initialOpen,
  resaltado = false,
  icon: Icon,
  hint,
  accessibilityLabel,
  children,
}: SeccionPlegableProps) {
  const [abierto, setAbierto] = useState(initialOpen);
  const Chevron = abierto ? ChevronDown : ChevronRight;
  const iconColor = resaltado ? t.color.accent : t.color.textSecondary;

  return (
    <View
      style={{
        gap: t.spacing.md,
        borderRadius: t.radius.md,
        borderWidth: 1,
        borderColor: resaltado ? t.color.accent : t.color.border,
        backgroundColor: resaltado ? t.color.accentWeak : t.color.surface,
        padding: t.spacing.md,
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${abierto ? 'Ocultar' : 'Editar'} ${accessibilityLabel ?? titulo}`}
        accessibilityState={{ expanded: abierto }}
        onPress={() => setAbierto((v) => !v)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: t.spacing.sm,
          minHeight: t.touch.min,
        }}
      >
        {Icon ? <Icon size={20} color={iconColor} strokeWidth={2} /> : null}
        <View style={{ flex: 1, gap: t.spacing.xxs }}>
          <Text style={{ color: t.color.textPrimary, ...t.typography.scale.titleM }}>{titulo}</Text>
          {/* El resumen solo tiene sentido plegado: abierto se ven ya los inputs con sus valores. */}
          {!abierto && resumen.length > 0 ? (
            <Text style={{ color: t.color.textPrimary, ...t.typography.scale.body }}>{resumen}</Text>
          ) : null}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.xxs }}>
          <Text style={{ color: t.color.brand, ...t.typography.scale.label }}>
            {abierto ? 'Ocultar' : 'Editar'}
          </Text>
          <Chevron size={18} color={t.color.brand} strokeWidth={2} />
        </View>
      </Pressable>

      {abierto ? (
        <View style={{ gap: t.spacing.md }}>
          {hint ? (
            <Text style={{ color: t.color.textSecondary, ...t.typography.scale.caption }}>
              {hint}
            </Text>
          ) : null}
          {children}
        </View>
      ) : null}
    </View>
  );
}
