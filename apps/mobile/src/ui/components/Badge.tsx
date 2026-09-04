import { Text, View } from 'react-native';
import { useAppTheme } from '@/ui/useAppTheme';

/**
 * Pastilla de estado (02-ui.md §2.4): color + SIEMPRE texto. Para estados de UI
 * genéricos (Pendiente/Enviado, etc.). NO para la gravedad jurídica: esa usará un
 * `SeverityChip` propio con icono (regla color + texto + icono), pendiente de Lucide.
 */
export type BadgeTone = 'info' | 'success' | 'warning' | 'danger' | 'neutral';

export interface BadgeProps {
  label: string;
  tone?: BadgeTone;
}

export function Badge({ label, tone = 'neutral' }: BadgeProps) {
  const t = useAppTheme();
  const tones: Record<BadgeTone, { bg: string; fg: string }> = {
    info: { bg: t.color.infoBg, fg: t.color.info },
    success: { bg: t.color.successBg, fg: t.color.success },
    warning: { bg: t.color.warningBg, fg: t.color.warning },
    danger: { bg: t.color.dangerBg, fg: t.color.danger },
    neutral: { bg: t.color.surfaceAlt, fg: t.color.textSecondary },
  };
  const c = tones[tone];
  return (
    <View
      style={{
        borderRadius: t.radius.pill,
        backgroundColor: c.bg,
        paddingHorizontal: t.spacing.sm,
        paddingVertical: t.spacing.xxs,
      }}
    >
      <Text style={{ color: c.fg, ...t.typography.scale.caption, fontWeight: '700' }}>{label}</Text>
    </View>
  );
}
