import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, SectionList, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { BookOpen, Bookmark, ChevronRight } from 'lucide-react-native';
import { useAppTheme } from '@/ui/useAppTheme';
import { Badge } from '@/ui/components/Badge';
import { EmptyState } from '@/ui/components/EmptyState';
import { ListRow } from '@/ui/components/ListRow';
import { hapticSelection } from '@/ui/haptics';
import { getContentRunner } from '@/db/contentDb';
import { useSettingsStore } from '@/store/settings';
import { useMarcadoresStore } from './marcadoresStore';
import {
  agruparNormasPorBloque,
  articulosLabel,
  listarNormas,
  normaRelevantePara,
  normasOcultasLabel,
  NORMA_AMBITO_LABEL,
  NORMA_TIPO_LABEL,
  type NormaResumen,
} from './normas';

/**
 * Pestaña NORMAS (§4.5), nivel 1: lista de normas del paquete de contenido (RGC, LSV, RGV,
 * LRCSCVM, CP, LECrim, LOSC…). Offline. Arriba, acceso rápido a "mis marcadores".
 *
 * La lista se FILTRA por el cuerpo del agente (perfil local, `useSettingsStore`): por defecto solo
 * muestra las normas que ese cuerpo consulta habitualmente (campo `cuerpos` del paquete; las no
 * etiquetadas se ven siempre). El control "Solo mi cuerpo / Todas las normas" revela el resto. Sin
 * cuerpo en el perfil, se muestran todas. Dentro, las normas se agrupan por bloque temático.
 */
type Estado = 'cargando' | 'ok' | 'sin-contenido';
type Filtro = 'mio' | 'todas';

export function NormasListScreen() {
  const t = useAppTheme();
  const router = useRouter();

  const [estado, setEstado] = useState<Estado>('cargando');
  const [normas, setNormas] = useState<NormaResumen[]>([]);
  const [filtro, setFiltro] = useState<Filtro>('mio');

  const cuerpo = useSettingsStore((s) => s.cuerpo);
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

  // Sin cuerpo en el perfil no hay a quién filtrar: se ven todas y se oculta el control.
  const filtrable = cuerpo !== null;
  const soloMiCuerpo = filtrable && filtro === 'mio';

  const visibles = useMemo(
    () => (soloMiCuerpo ? normas.filter((n) => normaRelevantePara(n.cuerpos, cuerpo)) : normas),
    [normas, soloMiCuerpo, cuerpo],
  );
  const secciones = useMemo(() => agruparNormasPorBloque(visibles), [visibles]);
  const ocultas = normas.length - visibles.length;

  const cambiarFiltro = (siguiente: Filtro) => {
    if (siguiente === filtro) return;
    hapticSelection();
    setFiltro(siguiente);
  };

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
          icon={BookOpen}
          title="Contenido no disponible aquí"
          message="El articulado consolidado viaja en la app móvil (iOS/Android). En web todavía no está el paquete de contenido."
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.color.bg }}>
      <SectionList
        sections={secciones}
        keyExtractor={(n) => n.id}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          <View>
            <ListRow
              title="Mis marcadores"
              meta="Artículos que has guardado"
              accessibilityHint="Abre tus artículos marcados"
              onPress={() => router.push('/normas/marcadores')}
              right={
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm }}>
                  {numMarcadores > 0 ? <Badge label={String(numMarcadores)} tone="info" /> : null}
                  <Bookmark size={20} color={t.color.textTertiary} strokeWidth={2} />
                </View>
              }
            />
            {filtrable ? (
              <FiltroCuerpo t={t} value={filtro} onChange={cambiarFiltro} />
            ) : null}
          </View>
        }
        renderSectionHeader={({ section }) => (
          <View
            style={{
              paddingHorizontal: t.spacing.base,
              paddingTop: t.spacing.lg,
              paddingBottom: t.spacing.xs,
              backgroundColor: t.color.bg,
            }}
          >
            <Text
              style={{
                color: t.color.textSecondary,
                ...t.typography.scale.label,
                textTransform: 'uppercase',
                letterSpacing: 0.6,
              }}
            >
              {section.titulo}
            </Text>
          </View>
        )}
        renderItem={({ item }) => (
          <FilaNorma t={t} item={item} onPress={(id) => router.push(`/normas/norma/${id}`)} />
        )}
        ListFooterComponent={
          soloMiCuerpo && ocultas > 0 ? (
            <VerTodas t={t} ocultas={ocultas} onPress={() => cambiarFiltro('todas')} />
          ) : null
        }
      />
    </View>
  );
}

/** Segmentado "Solo mi cuerpo / Todas las normas" (toque ≥44, háptico al cambiar). */
function FiltroCuerpo({
  t,
  value,
  onChange,
}: {
  t: ReturnType<typeof useAppTheme>;
  value: Filtro;
  onChange: (f: Filtro) => void;
}) {
  const opciones: { key: Filtro; label: string }[] = [
    { key: 'mio', label: 'Solo mi cuerpo' },
    { key: 'todas', label: 'Todas las normas' },
  ];
  return (
    <View
      accessibilityRole="tablist"
      style={{
        flexDirection: 'row',
        gap: t.spacing.xxs,
        margin: t.spacing.base,
        padding: t.spacing.xxs,
        borderRadius: t.radius.md,
        backgroundColor: t.color.surfaceAlt,
      }}
    >
      {opciones.map((op) => {
        const activo = op.key === value;
        return (
          <Pressable
            key={op.key}
            accessibilityRole="button"
            accessibilityState={{ selected: activo }}
            accessibilityHint={
              op.key === 'mio' ? 'Muestra solo las normas de tu cuerpo' : 'Muestra todas las normas'
            }
            onPress={() => onChange(op.key)}
            style={{
              flex: 1,
              minHeight: t.touch.min,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: t.spacing.sm,
              borderRadius: t.radius.sm,
              backgroundColor: activo ? t.color.surface : 'transparent',
              ...(activo ? t.elevation.e1 : null),
            }}
          >
            <Text
              numberOfLines={1}
              maxFontSizeMultiplier={1.4}
              style={{
                color: activo ? t.color.accent : t.color.textSecondary,
                ...t.typography.scale.label,
              }}
            >
              {op.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Pie tenue que revela lo escondido por el filtro y lleva a "Todas las normas". */
function VerTodas({
  t,
  ocultas,
  onPress,
}: {
  t: ReturnType<typeof useAppTheme>;
  ocultas: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Ver todas las normas. ${normasOcultasLabel(ocultas)}.`}
      accessibilityHint="Quita el filtro por cuerpo"
      onPress={onPress}
      style={{
        minHeight: t.touch.min,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: t.spacing.lg,
        paddingHorizontal: t.spacing.base,
      }}
    >
      <Text style={{ color: t.color.textTertiary, ...t.typography.scale.caption, textAlign: 'center' }}>
        {normasOcultasLabel(ocultas)} —{' '}
        <Text style={{ color: t.color.accent, fontWeight: '600' }}>Ver todas</Text>
      </Text>
    </Pressable>
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
      title={item.codigo}
      subtitle={item.titulo}
      meta={`${NORMA_TIPO_LABEL[item.tipo]} · ${NORMA_AMBITO_LABEL[item.ambito]} · ${articulosLabel(item.numArticulos)}`}
      accessibilityLabel={`${item.codigo}. ${item.titulo}. ${articulosLabel(item.numArticulos)}`}
      accessibilityHint="Abre el articulado de la norma"
      onPress={() => onPress(item.id)}
      right={<ChevronRight size={20} color={t.color.textTertiary} strokeWidth={2} />}
    />
  );
}
