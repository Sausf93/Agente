import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Pressable, Text, type ViewStyle } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Check, Copy } from 'lucide-react-native';
import { useAppTheme } from '@/ui/useAppTheme';

/**
 * Botón "Copiar boletín" — la ACCIÓN ESTRELLA de la app (ADR-004, §8.2 del sistema visual).
 *
 * Copia al portapapeles con `expo-clipboard` (compatible con Expo Go) y confirma SIEMPRE: el
 * usuario tiene que creerse que la acción ocurrió. El ciclo de éxito muta el botón a "Copiado"
 * ~1,2 s y lo anuncia por accesibilidad (`announceForAccessibility`). El háptico
 * `notificationSuccess` se sumará cuando entre `expo-haptics` (respeta `hapticsEnabled`).
 *
 * Va SOBRE EL PLIEGUE en la ficha: es lo primero que el agente busca hacer.
 */
export interface CopyBulletinButtonProps {
  /** Texto del boletín a copiar (ya compuesto, con la variante elegida si aplica). */
  texto: string;
  /** Etiqueta del estado normal. */
  label?: string;
  onCopied?: () => void;
}

const DURACION_EXITO_MS = 1200;

export function CopyBulletinButton({
  texto,
  label = 'Copiar boletín',
  onCopied,
}: CopyBulletinButtonProps) {
  const t = useAppTheme();
  const [copiado, setCopiado] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  async function onPress() {
    await Clipboard.setStringAsync(texto);
    setCopiado(true);
    AccessibilityInfo.announceForAccessibility('Boletín copiado al portapapeles');
    onCopied?.();
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopiado(false), DURACION_EXITO_MS);
  }

  const base: ViewStyle = {
    minHeight: 54, // acción estrella: algo más alta que un botón normal (§4 del sistema visual)
    borderRadius: t.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: t.spacing.sm,
    paddingHorizontal: t.spacing.base,
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={copiado ? 'Boletín copiado' : label}
      accessibilityHint="Copia el texto del boletín al portapapeles"
      onPress={onPress}
      style={({ pressed }): ViewStyle => ({
        ...base,
        backgroundColor: copiado
          ? t.color.success
          : pressed
            ? t.color.brandPressed
            : t.color.brand,
      })}
    >
      {copiado ? (
        <Check size={22} color={t.color.textOnBrand} strokeWidth={2.4} />
      ) : (
        <Copy size={22} color={t.color.textOnBrand} strokeWidth={2} />
      )}
      <Text
        maxFontSizeMultiplier={1.6}
        style={{ color: t.color.textOnBrand, ...t.typography.scale.bodyStrong }}
      >
        {copiado ? 'Copiado' : label}
      </Text>
    </Pressable>
  );
}
