import type { ComponentType } from 'react';
import { Text, View } from 'react-native';
import { Gavel, Info, TriangleAlert, type LucideProps } from 'lucide-react-native';
import type { Gravedad } from '@agente/shared';
import { useAppTheme } from '@/ui/useAppTheme';
import { severityFromGravedad, severityMeta } from '@/ui/theme';

/**
 * Chip de GRAVEDAD jurídica (02-ui.md §2.4, cola de componentes §4.2.1).
 *
 * Regla no negociable: la gravedad se comunica SIEMPRE con color + TEXTO + ICONO (nunca solo
 * color). Toma color de fondo/texto de los tokens de `severity` del tema, la etiqueta de
 * `severityMeta` y su icono Lucide. El icono va DELANTE de la etiqueta (16, color `fg`) y hace
 * que un chip "Leve" y uno "Grave" se distingan de un vistazo también con daltonismo o reflejos.
 *
 * `delito` no es una "gravedad" administrativa sino el salto a la vía penal: su etiqueta, su icono
 * (`gavel`) y su color (magenta) lo distinguen del rojo "muy grave".
 */
export interface SeverityChipProps {
  gravedad: Gravedad;
}

/**
 * Traduce el nombre de icono de `severityMeta` (kebab-case, fuente única) a su componente Lucide.
 * Mantenerlo aquí evita duplicar el nombre del icono y respeta que `severityMeta.icon` sea la
 * verdad del dominio.
 */
const SEVERITY_ICON: Record<string, ComponentType<LucideProps>> = {
  info: Info,
  'triangle-alert': TriangleAlert,
  gavel: Gavel,
};

export function SeverityChip({ gravedad }: SeverityChipProps) {
  const t = useAppTheme();
  const key = severityFromGravedad(gravedad);
  const colors = t.severity[key];
  const meta = severityMeta[key];
  const Icon = SEVERITY_ICON[meta.icon] ?? Info;

  return (
    <View
      accessible
      accessibilityLabel={meta.a11y}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: t.spacing.xs,
        borderRadius: t.radius.pill,
        backgroundColor: colors.bg,
        paddingHorizontal: t.spacing.sm,
        paddingVertical: t.spacing.xxs,
        minHeight: t.touch.chipHeight,
      }}
    >
      {/* Icono de gravedad: refuerzo visual (color + texto + icono, regla 2.4). Nunca canal único. */}
      <Icon size={16} color={colors.fg} strokeWidth={2.2} />
      <Text
        maxFontSizeMultiplier={1.6}
        style={{ color: colors.fg, ...t.typography.scale.caption, fontWeight: '700' }}
      >
        {meta.label}
      </Text>
    </View>
  );
}
