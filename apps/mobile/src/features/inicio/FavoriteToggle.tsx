import { useEffect } from 'react';
import { Pressable, Text } from 'react-native';
import { Star } from 'lucide-react-native';
import { useAppTheme } from '@/ui/useAppTheme';
import { useFavoritosStore } from './favoritosStore';
import type { InfraccionSnapshot } from './masUsadas';

/**
 * Botón de FAVORITO de una infracción, para la ficha (§4.4 acción "Favorito"). Alterna
 * guardar/quitar en `user.db` (local-first, ADR-001). Refleja el estado con DOS señales, no solo
 * color: la estrella se rellena (relleno = favorita) además de teñirse de acento; y el texto pasa
 * de "Guardar en favoritos" a "En favoritos". Área táctil ≥ 44.
 */
export interface FavoriteToggleProps {
  snapshot: InfraccionSnapshot;
}

export function FavoriteToggle({ snapshot }: FavoriteToggleProps) {
  const t = useAppTheme();
  const favorita = useFavoritosStore((s) => s.ids.has(snapshot.infraccionId));
  const loaded = useFavoritosStore((s) => s.loaded);
  const cargar = useFavoritosStore((s) => s.cargar);
  const alternar = useFavoritosStore((s) => s.alternar);

  useEffect(() => {
    if (!loaded) void cargar();
  }, [loaded, cargar]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={favorita ? 'Quitar de favoritos' : 'Guardar en favoritos'}
      accessibilityState={{ selected: favorita }}
      onPress={() => void alternar(snapshot)}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: t.spacing.sm,
        minHeight: t.touch.primaryHeight,
        borderRadius: t.radius.md,
        borderWidth: 1,
        borderColor: favorita ? t.color.accent : t.color.border,
        backgroundColor: pressed ? t.color.surfaceAlt : t.color.surface,
        paddingHorizontal: t.spacing.base,
      })}
    >
      <Star
        size={22}
        color={favorita ? t.color.accent : t.color.textSecondary}
        fill={favorita ? t.color.accent : 'transparent'}
        strokeWidth={2}
      />
      <Text
        style={{
          color: favorita ? t.color.accent : t.color.textSecondary,
          ...t.typography.scale.bodyStrong,
        }}
      >
        {favorita ? 'En favoritos' : 'Guardar en favoritos'}
      </Text>
    </Pressable>
  );
}
