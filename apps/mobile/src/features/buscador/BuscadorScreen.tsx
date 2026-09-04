import { useEffect, useRef } from 'react';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/ui/useAppTheme';
import { SearchBar } from '@/ui/components/SearchBar';
import { ListRow } from '@/ui/components/ListRow';
import { SeverityChip } from '@/ui/components/SeverityChip';
import { formatEuros } from '@/features/ficha/format';
import { useBuscadorStore } from './store';
import type { ResultadoBusqueda } from './search';

/**
 * Pestaña BUSCAR (§4.3) — la home y el núcleo del producto.
 *
 * Offline: consulta el paquete de contenido en el dispositivo. Debounce de ~180 ms para no
 * disparar una consulta por tecla y mantenerse por debajo de los 300 ms percibidos. Cada
 * resultado muestra título, gravedad (color + texto vía `SeverityChip`) e importe, y abre la
 * ficha al tocarlo. Estado vacío diferenciado: "aún no has buscado" vs "sin resultados".
 */
const DEBOUNCE_MS = 180;

export function BuscadorScreen() {
  const t = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const consulta = useBuscadorStore((s) => s.consulta);
  const resultados = useBuscadorStore((s) => s.resultados);
  const buscando = useBuscadorStore((s) => s.buscando);
  const buscado = useBuscadorStore((s) => s.buscado);
  const sinContenido = useBuscadorStore((s) => s.sinContenido);
  const setConsulta = useBuscadorStore((s) => s.setConsulta);
  const buscar = useBuscadorStore((s) => s.buscar);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce: se ejecuta la búsqueda un poco después de la última tecla.
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      void buscar(consulta);
    }, DEBOUNCE_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [consulta, buscar]);

  function abrirFicha(id: string) {
    router.push(`/ficha/${id}`);
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: t.color.bg,
        paddingTop: insets.top + t.spacing.md,
      }}
    >
      <View style={{ paddingHorizontal: t.spacing.base, gap: t.spacing.md }}>
        <Text
          accessibilityRole="header"
          style={{ color: t.color.textPrimary, ...t.typography.scale.titleXL }}
        >
          Buscar
        </Text>
        <SearchBar value={consulta} onChangeText={setConsulta} />
      </View>

      <FlatList
        data={resultados}
        keyExtractor={(r) => r.infraccionId}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        style={{ marginTop: t.spacing.md }}
        contentContainerStyle={{ paddingBottom: insets.bottom + t.spacing.xxl }}
        renderItem={({ item }) => <FilaResultado t={t} item={item} onPress={abrirFicha} />}
        ListEmptyComponent={
          <EstadoVacio
            t={t}
            buscando={buscando}
            buscado={buscado}
            sinContenido={sinContenido}
            consulta={consulta}
          />
        }
      />
    </View>
  );
}

function FilaResultado({
  t,
  item,
  onPress,
}: {
  t: ReturnType<typeof useAppTheme>;
  item: ResultadoBusqueda;
  onPress: (id: string) => void;
}) {
  const importe = formatEuros(item.importeEur);
  return (
    <ListRow
      title={item.tituloCorto}
      meta={`${item.normaCodigo} art. ${item.articuloNumero}`}
      accessibilityHint="Abre la ficha de la infracción"
      onPress={() => onPress(item.infraccionId)}
      right={
        <>
          <SeverityChip gravedad={item.gravedad} />
          {item.importeEur !== null ? (
            <Text
              style={{
                color: t.color.textPrimary,
                ...t.typography.scale.bodyStrong,
                fontVariant: ['tabular-nums'],
              }}
            >
              {importe}
            </Text>
          ) : null}
        </>
      }
    />
  );
}

function EstadoVacio({
  t,
  buscando,
  buscado,
  sinContenido,
  consulta,
}: {
  t: ReturnType<typeof useAppTheme>;
  buscando: boolean;
  buscado: boolean;
  sinContenido: boolean;
  consulta: string;
}) {
  if (buscando && consulta.trim().length > 0) {
    return (
      <View style={{ paddingTop: t.spacing.xxl, alignItems: 'center' }}>
        <ActivityIndicator color={t.color.brand} />
      </View>
    );
  }

  let titulo: string;
  let detalle: string;
  if (sinContenido) {
    titulo = 'Contenido no disponible aquí';
    detalle =
      'El buscador funciona en la app móvil (iOS/Android). En web todavía no está el paquete de contenido.';
  } else if (consulta.trim().length === 0) {
    titulo = 'Busca en el lenguaje de la calle';
    detalle = 'Prueba con "faro roto", "sin seguro", "móvil" o un artículo como "RGC 18".';
  } else if (buscado) {
    titulo = 'Sin resultados';
    detalle = 'No encontramos ninguna infracción. Lo hemos anotado para mejorar el buscador.';
  } else {
    return null;
  }

  return (
    <View style={{ paddingTop: t.spacing.xxl, paddingHorizontal: t.spacing.base, gap: t.spacing.sm }}>
      <Text style={{ color: t.color.textPrimary, ...t.typography.scale.titleM }}>{titulo}</Text>
      <Text style={{ color: t.color.textSecondary, ...t.typography.scale.body }}>{detalle}</Text>
    </View>
  );
}
