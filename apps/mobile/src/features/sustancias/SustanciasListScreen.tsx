import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight, FlaskConical } from 'lucide-react-native';
import { useAppTheme } from '@/ui/useAppTheme';
import { Badge } from '@/ui/components/Badge';
import { EmptyState } from '@/ui/components/EmptyState';
import { ListRow } from '@/ui/components/ListRow';
import { SearchBar } from '@/ui/components/SearchBar';
import { getContentRunner } from '@/db/contentDb';
import {
  aliasesLabel,
  filtrarSustancias,
  listarSustancias,
  type SustanciaResumen,
} from './sustancias';

/**
 * Pantalla SUSTANCIAS (§4.7), nivel 1: lista buscable de sustancias del paquete de contenido, con
 * su jerga de calle. Offline. Al tocar una, se abre su ficha con umbrales orientativos, indicadores
 * de tráfico y el orientador consumo/tráfico.
 *
 * El buscador entiende el lenguaje de la calle (aliases): "farlopa" → Cocaína, "maría" → Cannabis.
 * No se introduce ni se persiste ningún dato de terceros.
 */
type Estado = 'cargando' | 'ok' | 'sin-contenido';

const EJEMPLOS_CALLE = ['cocaína', 'maría', 'farlopa', 'caballo', 'speed'];

export function SustanciasListScreen() {
  const t = useAppTheme();
  const router = useRouter();

  const [estado, setEstado] = useState<Estado>('cargando');
  const [sustancias, setSustancias] = useState<SustanciaResumen[]>([]);
  const [consulta, setConsulta] = useState('');

  useEffect(() => {
    let vivo = true;
    (async () => {
      const runner = await getContentRunner();
      if (!vivo) return;
      if (!runner) {
        setEstado('sin-contenido');
        return;
      }
      const lista = await listarSustancias(runner);
      if (!vivo) return;
      setSustancias(lista);
      setEstado('ok');
    })();
    return () => {
      vivo = false;
    };
  }, []);

  const visibles = useMemo(
    () => filtrarSustancias(sustancias, consulta),
    [sustancias, consulta],
  );

  if (estado === 'cargando') {
    return (
      <View style={{ flex: 1, backgroundColor: t.color.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={t.color.accent} />
      </View>
    );
  }

  if (estado === 'sin-contenido') {
    return (
      <View style={{ flex: 1, backgroundColor: t.color.bg }}>
        <EmptyState
          icon={FlaskConical}
          title="Contenido no disponible aquí"
          message="La tabla de sustancias viaja en la app móvil (iOS/Android). En web todavía no está el paquete de contenido."
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.color.bg }}>
      <View style={{ padding: t.spacing.base, gap: t.spacing.sm }}>
        <SearchBar
          value={consulta}
          onChangeText={setConsulta}
          examples={EJEMPLOS_CALLE}
        />
      </View>
      <FlatList
        data={visibles}
        keyExtractor={(s) => s.id}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        renderItem={({ item }) => (
          <FilaSustancia t={t} item={item} onPress={(id) => router.push(`/sustancias/${id}`)} />
        )}
        ListEmptyComponent={
          <View style={{ paddingTop: t.spacing.xxl }}>
            <EmptyState
              icon={FlaskConical}
              title="Sin resultados"
              message="No hay ninguna sustancia que coincida. Prueba con otro nombre o con la jerga de calle."
            />
          </View>
        }
      />
    </View>
  );
}

function FilaSustancia({
  t,
  item,
  onPress,
}: {
  t: ReturnType<typeof useAppTheme>;
  item: SustanciaResumen;
  onPress: (id: string) => void;
}) {
  const alias = aliasesLabel(item.aliases);
  return (
    <ListRow
      title={item.nombre}
      {...(alias ? { subtitle: alias } : {})}
      accessibilityLabel={`${item.nombre}.${alias ? ` ${alias}.` : ''}`}
      accessibilityHint="Abre los umbrales y el orientador de consumo o tráfico"
      onPress={() => onPress(item.id)}
      right={
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm }}>
          {item.pendienteRevision ? <Badge label="Pendiente" tone="warning" /> : null}
          <ChevronRight size={20} color={t.color.textTertiary} strokeWidth={2} />
        </View>
      }
    />
  );
}
