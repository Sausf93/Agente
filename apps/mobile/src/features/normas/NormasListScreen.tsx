import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, SectionList, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { BookOpen, Bookmark, Building2, ChevronRight, Landmark, Send } from 'lucide-react-native';
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
import {
  construirSolicitudNormativaAutonomica,
  construirSolicitudOrdenanza,
} from './solicitarOrdenanza';
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

  // Las capas por TERRITORIO (autonómica y municipal) se muestran en su PROPIO bloque (arriba), no
  // en los bloques temáticos estatales. Se separan de la lista general (misma mecánica para ambas).
  const municipales = useMemo(() => normas.filter((n) => n.ambito === 'municipal'), [normas]);
  const autonomicas = useMemo(() => normas.filter((n) => n.ambito === 'autonomico'), [normas]);
  const generales = useMemo(
    () => normas.filter((n) => n.ambito !== 'municipal' && n.ambito !== 'autonomico'),
    [normas],
  );
  const ordenanzaCargada = municipales.length > 0;
  // Un Local (o cualquier perfil con municipio) sin ordenanza cargada ve el estado honesto.
  const puedeSolicitar = municipioId !== null && !ordenanzaCargada;

  // Capa AUTONÓMICA (ADR-006/008): honestidad para las CCAA sin contenido, igual que la municipal.
  // Un Mosso/Ertzaintza/Foral (o cualquier perfil con CCAA) ve su normativa autonómica cargada o,
  // si aún no está, el banner "no disponible" + "Solicitar la normativa de mi comunidad".
  const normativaAutonomicaCargada = autonomicas.length > 0;
  const puedeSolicitarAutonomica = ccaaId !== null && !normativaAutonomicaCargada;
  const ccaaNombre = useMemo(() => (ccaaId ? (ccaaPorId(ccaaId)?.nombre ?? null) : null), [ccaaId]);

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
  const [solicitandoAutonomica, setSolicitandoAutonomica] = useState(false);

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

  // "Solicitar la normativa de mi comunidad": mismo mecanismo honesto que la ordenanza municipal
  // (ADR-011). Se envía SOLO el nombre de la CCAA (segmento no identificativo); nada de terceros.
  async function solicitarNormativaAutonomica() {
    if (solicitandoAutonomica) return;
    setSolicitandoAutonomica(true);
    hapticSelection();
    try {
      const { texto, territorio } = construirSolicitudNormativaAutonomica(
        ccaaNombre ?? 'mi comunidad',
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
          : 'Gracias. La tendremos en cuenta para priorizar tu comunidad.',
      );
    } catch {
      Alert.alert('No se pudo registrar', 'Inténtalo de nuevo en un momento.');
    } finally {
      setSolicitandoAutonomica(false);
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
            <NormativaAutonomica
              t={t}
              ccaaNombre={ccaaNombre}
              autonomicas={autonomicas}
              puedeSolicitar={puedeSolicitarAutonomica}
              solicitando={solicitandoAutonomica}
              onAbrir={(id) => router.push(`/normas/norma/${id}`)}
              onSolicitar={solicitarNormativaAutonomica}
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

/**
 * Bloque "Normativa autonómica de {CCAA}" (§4.5, capa autonómica, ADR-006/008). Dos estados
 * HONESTOS, igual que la municipal:
 *  - Con normativa cargada: encabezado con la comunidad + sus normas autonómicas (tocar → articulado).
 *  - Sin cargar (CCAA aún no publicada): aviso claro + "Solicitar la normativa de mi comunidad".
 * Si el perfil no tiene CCAA, no se pinta nada.
 */
function NormativaAutonomica({
  t,
  ccaaNombre,
  autonomicas,
  puedeSolicitar,
  solicitando,
  onAbrir,
  onSolicitar,
}: {
  t: ReturnType<typeof useAppTheme>;
  ccaaNombre: string | null;
  autonomicas: NormaResumen[];
  puedeSolicitar: boolean;
  solicitando: boolean;
  onAbrir: (id: string) => void;
  onSolicitar: () => void;
}) {
  const hayNormativa = autonomicas.length > 0;
  if (!hayNormativa && !puedeSolicitar) return null;
  const nombre = ccaaNombre?.trim() || 'tu comunidad';

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
        <Landmark size={18} color={t.color.accent} strokeWidth={2.2} />
        <Text
          style={{
            color: t.color.textSecondary,
            ...t.typography.scale.label,
            textTransform: 'uppercase',
            letterSpacing: 0.6,
          }}
        >
          {hayNormativa ? `Normativa autonómica de ${nombre}` : `Tu comunidad: ${nombre}`}
        </Text>
      </View>

      {hayNormativa ? (
        autonomicas.map((item) => <FilaNorma key={item.id} t={t} item={item} onPress={onAbrir} />)
      ) : (
        <View style={{ paddingHorizontal: t.spacing.base, gap: t.spacing.md, paddingTop: t.spacing.xs }}>
          <Banner tone="info" title={`La normativa de ${nombre} aún no está cargada`}>
            Estamos ampliando comunidad a comunidad. Pídenos la tuya y la priorizaremos; solo
            enviaremos el nombre de la comunidad, nada más.
          </Banner>
          <Button
            title={solicitando ? 'Enviando…' : 'Solicitar la normativa de mi comunidad'}
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
