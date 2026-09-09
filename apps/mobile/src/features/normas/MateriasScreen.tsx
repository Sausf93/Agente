import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  BookOpen,
  Bookmark,
  Car,
  Crosshair,
  Gavel,
  Globe,
  HeartHandshake,
  PartyPopper,
  PawPrint,
  ShieldAlert,
  Users,
  type LucideIcon,
} from 'lucide-react-native';
import { useAppTheme } from '@/ui/useAppTheme';
import { Badge } from '@/ui/components/Badge';
import { EmptyState } from '@/ui/components/EmptyState';
import { ListRow } from '@/ui/components/ListRow';
import { PressableScale } from '@/ui/components/PressableScale';
import { SkeletonRows } from '@/ui/components/Skeleton';
import { hapticSelection } from '@/ui/haptics';
import { getContentRunner } from '@/db/contentDb';
import { useSettingsStore } from '@/store/settings';
import { useMarcadoresStore } from './marcadoresStore';
import { FranjaTerritorial } from './normasUi';
import {
  contarPorMateria,
  listarNormas,
  normaRelevantePara,
  normasOcultasLabel,
  type ConteoMateria,
  type NormaResumen,
} from './normas';

/**
 * Pestaña NORMAS (§4.5), nivel 1 rediseñado: navegación POR MATERIA (estilo SPPLB). En vez de una
 * lista de leyes sueltas, un ÍNDICE de materias (Tráfico, Seguridad ciudadana, Penal…) en un grid
 * de tarjetas; al tocar una materia salen TODAS sus normas agrupadas por ámbito. Offline.
 *
 * El recuento (y qué materias salen) se FILTRA por el cuerpo del agente (perfil local): por defecto
 * solo cuenta las normas que ese cuerpo consulta habitualmente; el control "Solo mi cuerpo / Todas"
 * revela el resto. La normativa autonómica/municipal CARGADA vive dentro de su materia; si aún no
 * hay contenido para el CCAA/municipio del perfil, la franja territorial de abajo ofrece "solicítala".
 */
type Estado = 'cargando' | 'ok' | 'sin-contenido';
type Filtro = 'mio' | 'todas';

/** Icono lucide por nombre (el que guarda la taxonomía en `MATERIA_INFO.icono`). */
const ICONO_POR_NOMBRE: Record<string, LucideIcon> = {
  Car,
  ShieldAlert,
  Gavel,
  Globe,
  Crosshair,
  PawPrint,
  PartyPopper,
  HeartHandshake,
  Users,
  BookOpen,
};

/** "3 normas" / "1 norma" — recuento con plural correcto para la tarjeta de materia. */
function normasLabel(n: number): string {
  return `${n} ${n === 1 ? 'norma' : 'normas'}`;
}

export function MateriasScreen() {
  const t = useAppTheme();
  const router = useRouter();

  const [estado, setEstado] = useState<Estado>('cargando');
  const [normas, setNormas] = useState<NormaResumen[]>([]);
  const [filtro, setFiltro] = useState<Filtro>('mio');

  const cuerpo = useSettingsStore((s) => s.cuerpo);
  const ccaaId = useSettingsStore((s) => s.ccaaId);
  const provinciaId = useSettingsStore((s) => s.provinciaId);
  const municipioId = useSettingsStore((s) => s.municipioId);
  const cargarMarcadores = useMarcadoresStore((s) => s.cargar);
  const numMarcadores = useMarcadoresStore((s) => s.marcadores.length);

  // Cadena territorial del perfil: lo estatal se ve siempre; lo autonómico/municipal solo si su
  // territorio está aquí (ADR-006/008). Se recalcula cuando cambia el territorio en Ajustes.
  const cadena = useMemo(
    () => [ccaaId, provinciaId, municipioId].filter((x): x is string => !!x),
    [ccaaId, provinciaId, municipioId],
  );

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
      const lista = await listarNormas(runner, cadena);
      if (!vivo) return;
      setNormas(lista);
      setEstado('ok');
    })();
    return () => {
      vivo = false;
    };
  }, [cadena]);

  // El filtro por cuerpo solo aporta si REALMENTE hay normas que no son del cuerpo del agente (si no,
  // "Solo mi cuerpo" y "Todas" darían el mismo índice y el control confunde). Solo entonces se muestra.
  const hayOtrasNormas = useMemo(
    () => cuerpo !== null && normas.some((n) => !normaRelevantePara(n.cuerpos, cuerpo)),
    [normas, cuerpo],
  );
  const filtrable = cuerpo !== null && hayOtrasNormas;
  const soloMiCuerpo = filtrable && filtro === 'mio';

  const visibles = useMemo(
    () => (soloMiCuerpo ? normas.filter((n) => normaRelevantePara(n.cuerpos, cuerpo)) : normas),
    [normas, soloMiCuerpo, cuerpo],
  );
  const materias = useMemo(() => contarPorMateria(visibles), [visibles]);
  const ocultas = normas.length - visibles.length;

  // La normativa autonómica/municipal cargada ya vive dentro de su materia; la franja territorial
  // solo aparece si el CCAA/municipio del perfil AÚN no tiene contenido (estado "solicítala").
  const hayAutonomica = useMemo(() => normas.some((n) => n.ambito === 'autonomico'), [normas]);
  const hayMunicipal = useMemo(() => normas.some((n) => n.ambito === 'municipal'), [normas]);

  const cambiarFiltro = (siguiente: Filtro) => {
    if (siguiente === filtro) return;
    hapticSelection();
    setFiltro(siguiente);
  };

  if (estado === 'cargando') {
    return (
      <View style={{ flex: 1, backgroundColor: t.color.bg, paddingTop: t.spacing.md }}>
        <SkeletonRows count={7} />
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
        data={materias}
        keyExtractor={(m) => m.materia}
        numColumns={2}
        columnWrapperStyle={{ gap: t.spacing.md, paddingHorizontal: t.spacing.base }}
        contentContainerStyle={{ gap: t.spacing.md, paddingBottom: t.spacing.xxl }}
        ListHeaderComponent={
          <View style={{ paddingBottom: t.spacing.sm }}>
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
            ) : (
              <View style={{ height: t.spacing.sm }} />
            )}
          </View>
        }
        renderItem={({ item }) => (
          <MateriaCard
            t={t}
            item={item}
            onPress={() =>
              router.push({
                pathname: '/normas/materia/[materia]',
                params: { materia: item.materia, filtro: soloMiCuerpo ? 'mio' : 'todas' },
              })
            }
          />
        )}
        ListFooterComponent={
          <View>
            <FranjaTerritorial hayAutonomica={hayAutonomica} hayMunicipal={hayMunicipal} />
            {soloMiCuerpo && ocultas > 0 ? (
              <VerTodas t={t} ocultas={ocultas} onPress={() => cambiarFiltro('todas')} />
            ) : null}
          </View>
        }
      />
    </View>
  );
}

/** Tarjeta de materia (icono 28 + etiqueta + "N normas"). Toda la tarjeta es tocable (alto ≥88). */
function MateriaCard({
  t,
  item,
  onPress,
}: {
  t: ReturnType<typeof useAppTheme>;
  item: ConteoMateria;
  onPress: () => void;
}) {
  const Icono = ICONO_POR_NOMBRE[item.icono] ?? BookOpen;
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`${item.label}. ${normasLabel(item.count)}.`}
      accessibilityHint="Abre las normas de esta materia"
      onPress={onPress}
      style={{
        flex: 1,
        minHeight: 88,
        justifyContent: 'space-between',
        gap: t.spacing.sm,
        borderRadius: t.radius.md,
        borderWidth: 1,
        borderColor: t.color.border,
        backgroundColor: t.color.surface,
        padding: t.spacing.base,
        ...(t.mode === 'light' ? t.elevation.e1 : null),
      }}
    >
      <Icono size={28} color={t.color.accent} strokeWidth={2} />
      <View style={{ gap: t.spacing.xxs }}>
        <Text
          numberOfLines={2}
          maxFontSizeMultiplier={1.6}
          style={{ color: t.color.textPrimary, ...t.typography.scale.bodyStrong }}
        >
          {item.label}
        </Text>
        <Text
          numberOfLines={1}
          style={{ color: t.color.textSecondary, ...t.typography.scale.caption }}
        >
          {normasLabel(item.count)}
        </Text>
      </View>
    </PressableScale>
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
