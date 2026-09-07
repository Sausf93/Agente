import type { ComponentType } from 'react';
import { Text, View } from 'react-native';
import type { LucideProps } from 'lucide-react-native';
import { useAppTheme } from '@/ui/useAppTheme';

/**
 * Pastillas de ANCLA visual para el lado izquierdo de una fila (`ListRow.leading`). Dan ritmo y
 * escaneo a las listas que antes eran texto plano (Documentos, Normas), copiando el patrón del hub
 * "Más". Nunca inventan símbolos oficiales: son un icono neutro (`IconPill`) o un monograma de
 * texto (`MonogramPill`, p. ej. la abreviatura de la norma).
 */
const PILL_SIZE = 40;

/** Pastilla con icono Lucide sobre `accentWeak` (mismo lenguaje que el hub "Más"). */
export function IconPill({ icon: Icon }: { icon: ComponentType<LucideProps> }) {
  const t = useAppTheme();
  return (
    <View
      style={{
        width: PILL_SIZE,
        height: PILL_SIZE,
        borderRadius: t.radius.md,
        backgroundColor: t.color.accentWeak,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon size={22} color={t.color.accent} strokeWidth={2} />
    </View>
  );
}

/** Pastilla-monograma de texto (abreviatura) sobre `surfaceAlt`. Para códigos de norma (RGC, CP…). */
export function MonogramPill({ label }: { label: string }) {
  const t = useAppTheme();
  return (
    <View
      style={{
        minWidth: PILL_SIZE,
        height: PILL_SIZE,
        paddingHorizontal: t.spacing.xs,
        borderRadius: t.radius.md,
        backgroundColor: t.color.surfaceAlt,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        numberOfLines={1}
        maxFontSizeMultiplier={1.3}
        style={{ color: t.color.textSecondary, ...t.typography.scale.label }}
      >
        {label}
      </Text>
    </View>
  );
}
