import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, SectionList, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { BookOpen, Bookmark, Building2, ChevronRight, Send } from 'lucide-react-native';
import { ccaaPorId } from '@agente/shared';
import { useAppTheme } from '@/ui/useAppTheme';
import { Badge } from '@/ui/components/Badge';
import { Banner } from '@/ui/components/Banner';
import { Button } from '@/ui/components/Button';
import { EmptyState } from '@/ui/components/EmptyState';
import { ListRow } from '@/ui/components/ListRow';
import { MonogramPill } from '@/ui/components/LeadingPill';
import { SkeletonRows } from '@/ui/components/Skeleton';
import { hapticSelection } from '@/ui/haptics';
import { getContentRunner } from '@/db/contentDb';
import { useSettingsStore } from '@/store/settings';
import { useFeedbackStore } from '@/features/feedback/store';
import { useMarcadoresStore } from './marcadoresStore';
import { construirSolicitudOrdenanza } from './solicitarOrdenanza';
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
  const ccaaId = useSettingsStore((s) => s.ccaaId);
  const provinciaId = useSettingsStore((s) => s.provinciaId);
  const municipioId = useSettingsStore((s) => s.municipioId);
  const municipioNombre = useSettingsStore((s) => s.municipioNombre);
  const cargarMarcadores = useMarcadoresStore((s) => s.cargar);
  const numMarcadores = useMarcadoresStore((s) => s.marcadores.length);

  // Cadena territorial del perfil: lo estatal se ve siempre; lo municipal solo si su territorio
  // está aquí (ADR-006/008). Se recalcula cuando cambia el territorio en Ajustes.
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

  // La ordenanza municipal del perfil se muestra en su PROPIO bloque (arriba), no en los bloques
  // temáticos estatales. Se separa de la lista general.
  const municipales = useMemo(() => normas.filter((n) => n.ambito === 'municipal'), [normas]);
  const generales = useMemo(() => normas.filter((n) => n.ambito !== 'municipal'), [normas]);
  const ordenanzaCargada = municipales.length > 0;
  // Un Local (o cualquier perfil con municipio) sin ordenanza cargada ve el estado honesto.
  const puedeSolicitar = municipioId !== null && !ordenanzaCargada;

  // El filtro por cuerpo solo aporta si REALMENTE hay normas que no son del cuerpo del agente
  // (si no, "Solo mi cuerpo" y "Todas" darían la misma lista y el control confunde: p. ej. un
  // Guardia Civil, para quien hoy todo el contenido es relevante). Solo entonces se muestra.
  const hayOtrasNormas = useMemo(
    () => cuerpo !== null && generales.some((n) => !normaRelevantePara(n.cuerpos, cuerpo)),
    [generales, cuerpo],
  );
  const filtrable = cuerpo !== null && hayOtrasNormas;
  const soloMiCuerpo = filtrable && filtro === 'mio';

  const visibles = useMemo(
    () => (soloMiCuerpo ? generales.filter((n) => normaRelevantePara(n.cuerpos, cuerpo)) : generales),
    [generales, soloMiCuerpo, cuerpo],
  );
  const secciones = useMemo(() => agruparNormasPorBloque(visibles), [visibles]);
  const ocultas = generales.length - visibles.length;

  const addFeedback = useFeedbackStore((s) => s.add);
  const enviarPendientes = useFeedbackStore((s) => s.sendPending);
  const [solicitando, setSolicitando] = useState(false);

  const cambiarFiltro = (siguiente: Filtro) => {
    if (siguiente === filtro) return;
    hapticSelection();
    setFiltro(siguiente);
  };

  // "Solicitar mi ordenanza": registra la petición (feedback local, ADR-011) y abre el compositor
  // de correo para enviar SOLO municipio + CCAA a los creadores. Nada de datos de terceros.
  async function solicitarOrdenanza() {
    if (solicitando) return;
    setSolicitando(true);
    hapticSelection();
    try {
      const ccaaNombre = ccaaId ? (ccaaPorId(ccaaId)?.nombre ?? null) : null;
      const { texto, territorio } = construirSolicitudOrdenanza(
        municipioNombre ?? 'mi municipio',
        ccaaNombre,
      );
      await addFeedback({
        tipo: 'sugerencia',
        texto,
        territorio,
        ...(cuerpo ? { cuerpo } : {}),
      });
      const resultado = await enviarPendientes();
      Alert.alert(
        'Solicitud registrada',
        resultado === 'cancelled'
          ? 'La hemos guardado. Puedes enviárnosla cuando quieras desde Más › Mis sugerencias.'
          : 'Gracias. La tendremos en cuenta para priorizar tu municipio.',
      );
    } catch {
      Alert.alert('No se pudo registrar', 'Inténtalo de nuevo en un momento.');
    } finally {
      setSolicitando(false);
    }
  }

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
            <OrdenanzaMunicipio
              t={t}
              municipioNombre={municipioNombre}
              municipales={municipales}
              puedeSolicitar={puedeSolicitar}
              solicitando={solicitando}
              onAbrir={(id) => router.push(`/normas/norma/${id}`)}
              onSolicitar={solicitarOrdenanza}
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

/**
 * Bloque "Ordenanza de {municipio}" (§4.5, capa municipal). Dos estados HONESTOS:
 *  - Con ordenanza cargada: encabezado con el municipio + sus ordenanzas (tocar → articulado).
 *  - Sin cargar (Local cuyo municipio aún no está publicado): aviso claro + "Solicitar mi ordenanza".
 * Si el perfil no tiene municipio, no se pinta nada.
 */
function OrdenanzaMunicipio({
  t,
  municipioNombre,
  municipales,
  puedeSolicitar,
  solicitando,
  onAbrir,
  onSolicitar,
}: {
  t: ReturnType<typeof useAppTheme>;
  municipioNombre: string | null;
  municipales: NormaResumen[];
  puedeSolicitar: boolean;
  solicitando: boolean;
  onAbrir: (id: string) => void;
  onSolicitar: () => void;
}) {
  const hayOrdenanza = municipales.length > 0;
  if (!hayOrdenanza && !puedeSolicitar) return null;
  const nombre = municipioNombre?.trim() || 'tu municipio';

  return (
    <View style={{ paddingTop: t.spacing.sm }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: t.spacing.sm,
          paddingHorizontal: t.spacing.base,
          paddingTop: t.spacing.lg,
          paddingBottom: t.spacing.xs,
        }}
      >
        <Building2 size={18} color={t.color.accent} strokeWidth={2.2} />
        <Text
          style={{
            color: t.color.textSecondary,
            ...t.typography.scale.label,
            textTransform: 'uppercase',
            letterSpacing: 0.6,
          }}
        >
          {hayOrdenanza ? `Ordenanza de ${nombre}` : `Tu municipio: ${nombre}`}
        </Text>
      </View>

      {hayOrdenanza ? (
        municipales.map((item) => <FilaNorma key={item.id} t={t} item={item} onPress={onAbrir} />)
      ) : (
        <View style={{ paddingHorizontal: t.spacing.base, gap: t.spacing.md, paddingTop: t.spacing.xs }}>
          <Banner tone="info" title={`La ordenanza de ${nombre} aún no está cargada`}>
            Estamos ampliando municipio a municipio. Pídenos el tuyo y lo priorizaremos; solo
            enviaremos el municipio y la comunidad, nada más.
          </Banner>
          <Button
            title={solicitando ? 'Enviando…' : 'Solicitar mi ordenanza'}
            variant="secondary"
            onPress={onSolicitar}
            disabled={solicitando}
            icon={Send}
          />
        </View>
      )}
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
      subtitle={`${NORMA_TIPO_LABEL[item.tipo]} · ${NORMA_AMBITO_LABEL[item.ambito]} · ${articulosLabel(item.numArticulos)}`}
      leading={<MonogramPill label={item.codigo} />}
      accessibilityLabel={`${item.codigo}. ${item.titulo}. ${articulosLabel(item.numArticulos)}`}
      accessibilityHint="Abre el articulado de la norma"
      onPress={() => onPress(item.id)}
      right={<ChevronRight size={20} color={t.color.textTertiary} strokeWidth={2} />}
    />
  );
}
