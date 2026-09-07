import { useEffect, useState } from 'react';
import { FlatList, View } from 'react-native';
import { useRouter } from 'expo-router';
import { BookOpen, Bookmark, ChevronRight } from 'lucide-react-native';
import { useAppTheme } from '@/ui/useAppTheme';
import { Badge } from '@/ui/components/Badge';
import { EmptyState } from '@/ui/components/EmptyState';
import { ListRow } from '@/ui/components/ListRow';
import { MonogramPill } from '@/ui/components/LeadingPill';
import { SkeletonRows } from '@/ui/components/Skeleton';
import { getContentRunner } from '@/db/contentDb';
import { useMarcadoresStore } from './marcadoresStore';
import {
  listarNormas,
  NORMA_AMBITO_LABEL,
  NORMA_TIPO_LABEL,
  type NormaResumen,
} from './normas';

/**
 * Pestaña NORMAS (§4.5), nivel 1: lista de normas del paquete de contenido (RGC, LSV, RGV,
 * LRCSCVM, CP…). Offline. Arriba, acceso rápido a "mis marcadores". Cada norma abre su articulado.
 */
type Estado = 'cargando' | 'ok' | 'sin-contenido';

export function NormasListScreen() {
  const t = useAppTheme();
  const router = useRouter();

  const [estado, setEstado] = useState<Estado>('cargando');
  const [normas, setNormas] = useState<NormaResumen[]>([]);

  const cargarMarcadores = useMarcadoresStore((s) => s.cargar);
  const numMarcadores = useMarcadoresStore((s) => s.marcadores.length);

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
      const lista = await listarNormas(runner);
      if (!vivo) return;
      setNormas(lista);
      setEstado('ok');
    })();
    return () => {
      vivo = false;
    };
  }, []);

  if (estado === 'cargando') {
    // Esqueleto a juego con la lista (no un spinner que "salta"). P1-10.
    return (
      <View style={{ flex: 1, backgroundColor: t.color.bg }}>
        <SkeletonRows count={8} />
      </View>
    );
  }

  if (estado === 'sin-contenido') {
    return (
      <View style={{ flex: 1, backgroundColor: t.color.bg }}>
        <EmptyState
          icon={BookOpen}
          title="Contenido no disponible aquí"
          message="El articulado consolidado viaja en la app móvil (iOS/Android). En web todavía no está el paquete de contenido."
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.color.bg }}>
      <FlatList
        data={normas}
        keyExtractor={(n) => n.id}
        ListHeaderComponent={
          <ListRow
            title="Mis marcadores"
            meta="Artículos que has guardado"
            accessibilityHint="Abre tus artículos marcados"
            onPress={() => router.push('/normas/marcadores')}
            leading={<MarcadoresPill t={t} />}
            right={
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm }}>
                {numMarcadores > 0 ? <Badge label={String(numMarcadores)} tone="info" /> : null}
                <ChevronRight size={20} color={t.color.textTertiary} strokeWidth={2} />
              </View>
            }
          />
        }
        renderItem={({ item }) => <FilaNorma t={t} item={item} onPress={(id) => router.push(`/normas/norma/${id}`)} />}
      />
    </View>
  );
}

/** Pastilla de "Mis marcadores": icono `bookmark` sobre `accentWeak`, como el hub "Más". */
function MarcadoresPill({ t }: { t: ReturnType<typeof useAppTheme> }) {
  return (
    <View
      style={{
        width: 40,
        height: 40,
        borderRadius: t.radius.md,
        backgroundColor: t.color.accentWeak,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Bookmark size={22} color={t.color.accent} strokeWidth={2} />
    </View>
  );
}

function FilaNorma({
  t,
  item,
  onPress,
}: {
  t: ReturnType<typeof useAppTheme>;
  item: NormaResumen;
  onPress: (id: string) => void;
}) {
  return (
    <ListRow
      title={item.titulo}
      meta={`${NORMA_TIPO_LABEL[item.tipo]} · ${NORMA_AMBITO_LABEL[item.ambito]} · ${item.numArticulos} art.`}
      accessibilityLabel={`${item.codigo}. ${item.titulo}`}
      accessibilityHint="Abre el articulado de la norma"
      onPress={() => onPress(item.id)}
      leading={<MonogramPill label={item.codigo} />}
      right={<ChevronRight size={20} color={t.color.textTertiary} strokeWidth={2} />}
    />
  );
}
