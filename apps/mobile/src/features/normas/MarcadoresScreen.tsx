import { useEffect } from 'react';
import { FlatList, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Bookmark } from 'lucide-react-native';
import { useAppTheme } from '@/ui/useAppTheme';
import { EmptyState } from '@/ui/components/EmptyState';
import { ListRow } from '@/ui/components/ListRow';
import { BookmarkToggle } from './BookmarkToggle';
import { useMarcadoresStore } from './marcadoresStore';

/**
 * NORMAS (§4.5): "mis marcadores". Lista los artículos guardados en el dispositivo (desnormalizados
 * en `user.db`, sin abrir el paquete). Cada fila abre el artículo y permite quitarlo del marcador.
 */
export function MarcadoresScreen() {
  const t = useAppTheme();
  const router = useRouter();

  const marcadores = useMarcadoresStore((s) => s.marcadores);
  const cargar = useMarcadoresStore((s) => s.cargar);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  if (marcadores.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: t.color.bg }}>
        <EmptyState
          icon={Bookmark}
          title="Aún no tienes marcadores"
          message="Guarda un artículo con el icono de marcador para tenerlo a mano. Vive solo en tu dispositivo."
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.color.bg }}>
      <FlatList
        data={marcadores}
        keyExtractor={(m) => m.articuloId}
        renderItem={({ item }) => (
          <ListRow
            title={`${item.normaCodigo} · art. ${item.articuloNumero}`}
            {...(item.articuloTitulo ? { subtitle: item.articuloTitulo } : {})}
            accessibilityLabel={`${item.normaCodigo} artículo ${item.articuloNumero}${item.articuloTitulo ? `, ${item.articuloTitulo}` : ''}`}
            accessibilityHint="Abre el texto del artículo"
            onPress={() => router.push(`/normas/articulo/${encodeURIComponent(item.articuloId)}`)}
            right={
              <BookmarkToggle
                articuloId={item.articuloId}
                normaId={item.normaId}
                normaCodigo={item.normaCodigo}
                articuloNumero={item.articuloNumero}
                articuloTitulo={item.articuloTitulo}
              />
            }
          />
        )}
      />
    </View>
  );
}
