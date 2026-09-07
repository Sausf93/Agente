import { useCallback } from 'react';
import { FlatList, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Star } from 'lucide-react-native';
import { useAppTheme } from '@/ui/useAppTheme';
import { EmptyState } from '@/ui/components/EmptyState';
import { useFavoritosStore } from './favoritosStore';
import { FilaInfraccion } from './HomeInicio';

/**
 * Lista completa de "Tus favoritas" (§4.2/§4.4). Local-first (ADR-001): sale de `user.db`. Cada
 * favorito abre su ficha. Estado vacío con gracia si aún no hay ninguno.
 */
export function FavoritosScreen() {
  const t = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const favoritos = useFavoritosStore((s) => s.favoritos);
  const cargar = useFavoritosStore((s) => s.cargar);

  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar]),
  );

  return (
    <View style={{ flex: 1, backgroundColor: t.color.bg }}>
      <FlatList
        data={favoritos}
        keyExtractor={(f) => f.infraccionId}
        contentContainerStyle={
          favoritos.length === 0
            ? { flex: 1 }
            : { paddingVertical: t.spacing.sm, paddingBottom: insets.bottom + t.spacing.xxl }
        }
        renderItem={({ item }) => (
          <FilaInfraccion t={t} item={item} onPress={(id) => router.push(`/ficha/${id}`)} />
        )}
        ListEmptyComponent={
          <EmptyState
            icon={Star}
            title="Aún no tienes favoritas"
            message="Abre una infracción y toca la estrella para guardarla aquí y llegar antes la próxima vez."
          />
        }
      />
    </View>
  );
}
