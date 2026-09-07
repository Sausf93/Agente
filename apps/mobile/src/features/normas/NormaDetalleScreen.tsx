import { useEffect, useMemo, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SearchX } from 'lucide-react-native';
import { useAppTheme } from '@/ui/useAppTheme';
import { Badge } from '@/ui/components/Badge';
import { ListRow } from '@/ui/components/ListRow';
import { SearchBar } from '@/ui/components/SearchBar';
import { SkeletonLine, SkeletonRows } from '@/ui/components/Skeleton';
import { BookmarkToggle } from './BookmarkToggle';
import { getContentRunner } from '@/db/contentDb';
import { useMarcadoresStore } from './marcadoresStore';
import {
  filtrarArticulos,
  listarArticulos,
  listarNormas,
  type ArticuloResumen,
  type NormaResumen,
} from './normas';

/**
 * NORMAS (§4.5), nivel 2: articulado de una norma con BUSCADOR DENTRO de la norma (filtra por
 * número o texto, en memoria y sin red). Cada fila abre el artículo y permite marcarlo. La
 * cabecera del stack toma el código de la norma.
 */
type Estado = 'cargando' | 'ok' | 'sin-contenido';

export function NormaDetalleScreen({ normaId }: { normaId: string }) {
  const t = useAppTheme();
  const router = useRouter();

  const [estado, setEstado] = useState<Estado>('cargando');
  const [norma, setNorma] = useState<NormaResumen | null>(null);
  const [articulos, setArticulos] = useState<ArticuloResumen[]>([]);
  const [consulta, setConsulta] = useState('');

  const cargarMarcadores = useMarcadoresStore((s) => s.cargar);

  useEffect(() => {
    void cargarMarcadores();
  }, [cargarMarcadores]);

  useEffect(() => {
    let vivo = true;
    (async () => {
      const runner = await getContentRunner();
      if (!vivo) return;
      if (!runner) {
        setEstado('sin-contenido');
        return;
      }
      const [lista, todas] = await Promise.all([
        listarArticulos(runner, normaId),
        listarNormas(runner),
      ]);
      if (!vivo) return;
      setArticulos(lista);
      setNorma(todas.find((n) => n.id === normaId) ?? null);
      setEstado('ok');
    })();
    return () => {
      vivo = false;
    };
  }, [normaId]);

  const filtrados = useMemo(() => filtrarArticulos(articulos, consulta), [articulos, consulta]);

  const titulo = norma?.codigo ?? 'Norma';

  if (estado === 'cargando') {
    // Esqueleto del articulado en vez de un spinner que "salta" (P1-10).
    return (
      <View style={{ flex: 1, backgroundColor: t.color.bg }}>
        <Stack.Screen options={{ title: titulo }} />
        <View style={{ padding: t.spacing.base }}>
          <SkeletonLine width="70%" height={18} />
        </View>
        <SkeletonRows count={8} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.color.bg }}>
      <Stack.Screen options={{ title: titulo }} />

      <View style={{ padding: t.spacing.base, gap: t.spacing.sm }}>
        {norma ? (
          <Text style={{ color: t.color.textSecondary, ...t.typography.scale.body }}>
            {norma.titulo}
          </Text>
        ) : null}
        <SearchBar
          value={consulta}
          onChangeText={setConsulta}
          placeholder="Busca por número o texto en esta norma…"
        />
      </View>

      <FlatList
        data={filtrados}
        keyExtractor={(a) => a.id}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        renderItem={({ item }) => (
          <FilaArticulo
            t={t}
            item={item}
            normaId={normaId}
            normaCodigo={norma?.codigo ?? ''}
            onPress={(id) => router.push(`/normas/articulo/${encodeURIComponent(id)}`)}
          />
        )}
        ListEmptyComponent={
          <View style={{ paddingTop: t.spacing.xxl, paddingHorizontal: t.spacing.xl, alignItems: 'center', gap: t.spacing.md }}>
            <SearchX size={44} color={t.color.textTertiary} strokeWidth={1.75} />
            <Text style={{ color: t.color.textPrimary, ...t.typography.scale.titleM, textAlign: 'center' }}>
              Sin artículos para esto
            </Text>
            <Text style={{ color: t.color.textSecondary, ...t.typography.scale.body, textAlign: 'center' }}>
              Prueba con el número del artículo (p. ej. "18") o una palabra del texto.
            </Text>
          </View>
        }
      />
    </View>
  );
}

function FilaArticulo({
  t,
  item,
  normaId,
  normaCodigo,
  onPress,
}: {
  t: ReturnType<typeof useAppTheme>;
  item: ArticuloResumen;
  normaId: string;
  normaCodigo: string;
  onPress: (id: string) => void;
}) {
  return (
    <ListRow
      title={`Art. ${item.numero}${item.titulo ? ` · ${item.titulo}` : ''}`}
      accessibilityLabel={`Artículo ${item.numero}${item.titulo ? `, ${item.titulo}` : ''}`}
      accessibilityHint="Abre el texto del artículo"
      onPress={() => onPress(item.id)}
      right={
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm }}>
          {item.esResumen ? <Badge label="Resumen" tone="warning" /> : null}
          <BookmarkToggle
            articuloId={item.id}
            normaId={normaId}
            normaCodigo={normaCodigo}
            articuloNumero={item.numero}
            articuloTitulo={item.titulo}
          />
        </View>
      }
    />
  );
}
