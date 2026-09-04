import { Text, View } from 'react-native';
import type { Gravedad } from '@agente/shared';
import { useAppTheme } from '@/ui/useAppTheme';
import { severityFromGravedad, severityMeta } from '@/ui/theme';

/**
 * Chip de GRAVEDAD jurídica (02-ui.md §2.4, cola de componentes §4.2.1).
 *
 * Regla no negociable: la gravedad se comunica SIEMPRE con color + TEXTO (nunca solo color).
 * Toma color de fondo/texto de los tokens de `severity` del tema y la etiqueta de
 * `severityMeta`. El icono (Lucide) se añadirá cuando entre la dependencia; hasta entonces el
 * marcador textual (color + etiqueta) ya cumple la regla 2.4.
 *
 * `delito` no es una "gravedad" administrativa sino el salto a la vía penal: su etiqueta y color
 * (magenta) lo distinguen del rojo "muy grave".
 */
export interface SeverityChipProps {
  gravedad: Gravedad;
}

export function SeverityChip({ gravedad }: SeverityChipProps) {
  const t = useAppTheme();
  const key = severityFromGravedad(gravedad);
  const colors = t.severity[key];
  const meta = severityMeta[key];

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
      {/* Punto de color: refuerzo visual, nunca el ÚNICO canal (siempre va con la etiqueta). */}
      <View
        style={{
          width: 8,
          height: 8,
          borderRadius: t.radius.pill,
          backgroundColor: colors.solid,
        }}
      />
      <Text style={{ color: colors.fg, ...t.typography.scale.caption, fontWeight: '700' }}>
        {meta.label}
      </Text>
    </View>
  );
}
