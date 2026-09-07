import type { ComponentType } from 'react';
import { Text, View } from 'react-native';
import type { LucideProps } from 'lucide-react-native';
import { useAppTheme } from '@/ui/useAppTheme';
import { Button } from './Button';

/**
 * Estado VACÍO con gracia (sistema visual v2, §5): nunca una pantalla en blanco. Icono grande y
 * tenue + título + frase honesta + acción opcional. Centrado y con aire. El icono se pasa como
 * componente Lucide (metáfora de objeto/acción; jamás escudos ni símbolos oficiales).
 */
export interface EmptyStateProps {
  icon: ComponentType<LucideProps>;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon, title, message, actionLabel, onAction }: EmptyStateProps) {
  const t = useAppTheme();
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: t.spacing.xl,
        gap: t.spacing.md,
      }}
    >
      <Icon size={48} color={t.color.textTertiary} strokeWidth={1.75} />
      <Text
        accessibilityRole="header"
        style={{ color: t.color.textPrimary, ...t.typography.scale.titleM, textAlign: 'center' }}
      >
        {title}
      </Text>
      <Text
        style={{
          color: t.color.textSecondary,
          ...t.typography.scale.body,
          textAlign: 'center',
        }}
      >
        {message}
      </Text>
      {actionLabel && onAction ? (
        <View style={{ marginTop: t.spacing.sm, alignSelf: 'stretch' }}>
          <Button title={actionLabel} variant="secondary" onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
}
