import { Pressable } from 'react-native';
import { Bookmark } from 'lucide-react-native';
import { useAppTheme } from '@/ui/useAppTheme';
import { useMarcadoresStore } from './marcadoresStore';

/**
 * Botón de MARCADOR de un artículo (§4.5). Alterna guardar/quitar en `user.db` (local-first). El
 * estado se refleja rellenando el icono (relleno = marcado) además del color: dos señales, no solo
 * color. Área táctil ≥ 44 con `hitSlop`.
 */
export interface BookmarkToggleProps {
  articuloId: string;
  normaId: string;
  normaCodigo: string;
  articuloNumero: string;
  articuloTitulo: string | null;
}

export function BookmarkToggle(props: BookmarkToggleProps) {
  const t = useAppTheme();
  const marcado = useMarcadoresStore((s) => s.ids.has(props.articuloId));
  const alternar = useMarcadoresStore((s) => s.alternar);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={marcado ? 'Quitar de marcadores' : 'Guardar en marcadores'}
      accessibilityState={{ selected: marcado }}
      hitSlop={12}
      onPress={() => {
        void alternar({
          articuloId: props.articuloId,
          normaId: props.normaId,
          normaCodigo: props.normaCodigo,
          articuloNumero: props.articuloNumero,
          articuloTitulo: props.articuloTitulo,
        });
      }}
      style={{
        minWidth: t.touch.min,
        minHeight: t.touch.min,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Bookmark
        size={22}
        color={marcado ? t.color.accent : t.color.textTertiary}
        fill={marcado ? t.color.accent : 'transparent'}
        strokeWidth={2}
      />
    </Pressable>
  );
}
