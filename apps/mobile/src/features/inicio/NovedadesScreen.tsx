import { useEffect } from 'react';
import { FlatList, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell } from 'lucide-react-native';
import { useAppTheme } from '@/ui/useAppTheme';
import type { Theme } from '@/ui/theme';
import { Card } from '@/ui/components/Card';
import { EmptyState } from '@/ui/components/EmptyState';
import { formatFecha } from '@/features/ficha/format';
import { useInicioStore } from './inicioStore';
import type { Novedad } from './novedades';

/**
 * Pantalla "Novedades" (§4.13): histórico de cambios normativos que trae el paquete de contenido
 * (una entrada por `ContentVersion`: qué norma, resumen y fecha). Al abrirla se marca todo como
 * VISTO, de modo que el aviso (badge) de Inicio desaparece hasta la próxima actualización. Si el
 * paquete aún no trae novedades, estado vacío con gracia. Todo offline.
 */
export function NovedadesScreen() {
  const t = useAppTheme();
  const insets = useSafeAreaInsets();

  const novedades = useInicioStore((s) => s.novedades);
  const loaded = useInicioStore((s) => s.loaded);
  const cargar = useInicioStore((s) => s.cargar);
  const marcarNovedadesVistas = useInicioStore((s) => s.marcarNovedadesVistas);

  useEffect(() => {
    (async () => {
      if (!loaded) await cargar();
      await marcarNovedadesVistas();
    })();
  }, [loaded, cargar, marcarNovedadesVistas]);

  return (
    <View style={{ flex: 1, backgroundColor: t.color.bg }}>
      <FlatList
        data={novedades}
        keyExtractor={(n) => n.id}
        contentContainerStyle={
          novedades.length === 0
            ? { flex: 1 }
            : {
                padding: t.spacing.base,
                gap: t.spacing.md,
                paddingBottom: insets.bottom + t.spacing.xxl,
              }
        }
        renderItem={({ item }) => <FilaNovedad t={t} item={item} />}
        ListEmptyComponent={
          <EmptyState
            icon={Bell}
            title="Sin novedades por ahora"
            message="Cuando una norma cambie, aquí verás qué se ha actualizado y desde cuándo."
          />
        }
      />
    </View>
  );
}

function FilaNovedad({ t, item }: { t: Theme; item: Novedad }) {
  return (
    <Card style={{ gap: t.spacing.xs }}>
      <Text style={{ color: t.color.textSecondary, ...t.typography.scale.caption }}>
        {formatFecha(item.fecha)} · versión {item.contentVersion}
      </Text>
      <Text style={{ color: t.color.textPrimary, ...t.typography.scale.body }}>{item.resumen}</Text>
      {item.articulos.length > 0 ? (
        <Text style={{ color: t.color.textTertiary, ...t.typography.scale.caption }}>
          {item.articulos.length}{' '}
          {item.articulos.length === 1 ? 'artículo afectado' : 'artículos afectados'}
        </Text>
      ) : null}
    </Card>
  );
}
