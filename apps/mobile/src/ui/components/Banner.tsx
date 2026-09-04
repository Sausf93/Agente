import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { useAppTheme } from '@/ui/useAppTheme';

/**
 * Banner de aviso (02-ui.md §5.9): relleno tenue + **barra de acento de 3 pt a la
 * izquierda** + texto. Nunca comunica solo con color (siempre lleva texto y, cuando
 * proceda, título).
 *
 * Elección de tono importante para no agobiar: usa `info` (azul calmado) para avisos
 * neutros como el de privacidad; reserva `warning`/`danger` para lo que de verdad
 * requiere alerta (contenido caducado, error). El naranja/rojo cansa si se abusa.
 */
export type BannerTone = 'info' | 'warning' | 'success' | 'danger';

export interface BannerProps {
  tone?: BannerTone;
  title?: string;
  children: ReactNode;
}

export function Banner({ tone = 'info', title, children }: BannerProps) {
  const t = useAppTheme();
  const tones: Record<BannerTone, { bg: string; accent: string }> = {
    info: { bg: t.color.infoBg, accent: t.color.info },
    warning: { bg: t.color.warningBg, accent: t.color.warning },
    success: { bg: t.color.successBg, accent: t.color.success },
    danger: { bg: t.color.dangerBg, accent: t.color.danger },
  };
  const c = tones[tone];

  return (
    <View
      style={{
        flexDirection: 'row',
        borderRadius: t.radius.md,
        backgroundColor: c.bg,
        overflow: 'hidden',
      }}
    >
      <View style={{ width: 3, backgroundColor: c.accent }} />
      <View style={{ flex: 1, padding: t.spacing.md, gap: t.spacing.xxs }}>
        {title ? (
          <Text style={{ color: t.color.textPrimary, ...t.typography.scale.bodyStrong }}>
            {title}
          </Text>
        ) : null}
        {typeof children === 'string' ? (
          <Text style={{ color: t.color.textPrimary, ...t.typography.scale.body }}>{children}</Text>
        ) : (
          children
        )}
      </View>
    </View>
  );
}
