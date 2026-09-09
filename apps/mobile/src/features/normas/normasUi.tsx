import { useEffect, useMemo, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { Building2, ChevronRight, Landmark, Send } from 'lucide-react-native';
import { ccaaPorId } from '@agente/shared';
import { useAppTheme } from '@/ui/useAppTheme';
import { Banner } from '@/ui/components/Banner';
import { Button } from '@/ui/components/Button';
import { ListRow } from '@/ui/components/ListRow';
import { MonogramPill } from '@/ui/components/LeadingPill';
import { hapticSelection } from '@/ui/haptics';
import { useSettingsStore } from '@/store/settings';
import { useFeedbackStore } from '@/features/feedback/store';
import {
  construirSolicitudNormativaAutonomica,
  construirSolicitudOrdenanza,
} from './solicitarOrdenanza';
import {
  articulosLabel,
  NORMA_AMBITO_LABEL,
  NORMA_TIPO_LABEL,
  type NormaResumen,
} from './normas';

type Theme = ReturnType<typeof useAppTheme>;

/**
 * Fila de una norma (código en pastilla + tipo · ámbito · nº de artículos). Compartida por la
 * pantalla de detalle de materia y por la franja territorial "solicítala". Tocar abre el articulado
 * de la norma (ruta existente, sin cambios).
 */
export function FilaNorma({
  item,
  onPress,
}: {
  item: NormaResumen;
  onPress: (id: string) => void;
}) {
  const t = useAppTheme();
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

/**
 * Franja de HONESTIDAD territorial (§4.5, capas autonómica y municipal, ADR-006/008/011). En la
 * navegación por materia, la normativa autonómica/municipal CARGADA vive DENTRO de su materia; esta
 * franja aparece SOLO cuando el CCAA/municipio del perfil aún NO tiene contenido, para no fingir un
 * vacío mudo: avisa y ofrece "solicítala". Autocontenida (lee el perfil y registra la petición como
 * feedback local; solo viaja el nombre del territorio, nada de datos de terceros).
 */
export function FranjaTerritorial({
  hayAutonomica,
  hayMunicipal,
}: {
  hayAutonomica: boolean;
  hayMunicipal: boolean;
}) {
  const t = useAppTheme();
  const cuerpo = useSettingsStore((s) => s.cuerpo);
  const ccaaId = useSettingsStore((s) => s.ccaaId);
  const municipioId = useSettingsStore((s) => s.municipioId);
  const municipioNombre = useSettingsStore((s) => s.municipioNombre);
  const addFeedback = useFeedbackStore((s) => s.add);
  const feedbackItems = useFeedbackStore((s) => s.items);
  const feedbackLoaded = useFeedbackStore((s) => s.loaded);
  const loadFeedback = useFeedbackStore((s) => s.load);

  // Las peticiones se guardan como feedback LOCAL; cargamos la lista para no duplicar y para poder
  // mostrar el estado "en lista de espera".
  useEffect(() => {
    if (!feedbackLoaded) void loadFeedback();
  }, [feedbackLoaded, loadFeedback]);

  const ccaaNombre = useMemo(() => (ccaaId ? (ccaaPorId(ccaaId)?.nombre ?? null) : null), [ccaaId]);

  // La normativa autonómica/municipal la trabajan los cuerpos TERRITORIALES: a Guardia Civil y
  // Policía Nacional (marco estatal) esta franja les sería ruido, así que NO se muestra (feedback
  // coincidente de los tres cuerpos). Lo municipal es propio del Local.
  const cuerpoTrabajaAutonomica = cuerpo === 'policia_local' || cuerpo === 'policia_autonomica';
  const puedeSolicitarAutonomica = cuerpoTrabajaAutonomica && ccaaId !== null && !hayAutonomica;
  const puedeSolicitarMunicipal =
    cuerpo === 'policia_local' && municipioId !== null && !hayMunicipal;

  const territorioAutonomico = ccaaNombre?.trim() || 'mi comunidad';
  const territorioMunicipal = municipioNombre?.trim() || 'mi municipio';
  const yaEnListaAutonomica = feedbackItems.some(
    (f) => f.tipo === 'sugerencia' && f.territorio === territorioAutonomico,
  );
  const yaEnListaMunicipal = feedbackItems.some(
    (f) => f.tipo === 'sugerencia' && (f.territorio ?? '').startsWith(territorioMunicipal),
  );

  const [solicitandoAutonomica, setSolicitandoAutonomica] = useState(false);
  const [solicitandoMunicipal, setSolicitandoMunicipal] = useState(false);

  // IMPORTANTE: la petición se REGISTRA en el dispositivo y NO se envía a nadie (nada de mailto ni
  // de hoja de compartir a terceros, que confundía —"se lo puedo mandar a quien sea"—). El envío
  // opcional a los creadores vive aparte, en Más › Mis sugerencias.
  async function solicitarNormativaAutonomica() {
    if (solicitandoAutonomica || yaEnListaAutonomica) return;
    setSolicitandoAutonomica(true);
    hapticSelection();
    try {
      const { texto, territorio } = construirSolicitudNormativaAutonomica(territorioAutonomico);
      await addFeedback({ tipo: 'sugerencia', texto, territorio, ...(cuerpo ? { cuerpo } : {}) });
      Alert.alert(
        'Anotado en tu móvil',
        `Cuando ampliemos ${territorio}, lo verás en la app. Puedes gestionarlo en Más › Mis sugerencias. No se envía nada a nadie.`,
      );
    } catch {
      Alert.alert('No se pudo anotar', 'Inténtalo de nuevo en un momento.');
    } finally {
      setSolicitandoAutonomica(false);
    }
  }

  async function solicitarOrdenanza() {
    if (solicitandoMunicipal || yaEnListaMunicipal) return;
    setSolicitandoMunicipal(true);
    hapticSelection();
    try {
      const { texto, territorio } = construirSolicitudOrdenanza(territorioMunicipal, ccaaNombre);
      await addFeedback({ tipo: 'sugerencia', texto, territorio, ...(cuerpo ? { cuerpo } : {}) });
      Alert.alert(
        'Anotado en tu móvil',
        `Cuando carguemos ${territorio}, lo verás en la app. Puedes gestionarlo en Más › Mis sugerencias. No se envía nada a nadie.`,
      );
    } catch {
      Alert.alert('No se pudo anotar', 'Inténtalo de nuevo en un momento.');
    } finally {
      setSolicitandoMunicipal(false);
    }
  }

  if (!puedeSolicitarAutonomica && !puedeSolicitarMunicipal) return null;

  return (
    <View style={{ paddingTop: t.spacing.lg }}>
      {puedeSolicitarAutonomica ? (
        <BloqueSolicitud
          t={t}
          icon={<Landmark size={18} color={t.color.accent} strokeWidth={2.2} />}
          encabezado={`Tu comunidad: ${territorioAutonomico}`}
          titulo={
            yaEnListaAutonomica
              ? `Anotada · te avisaremos cuando esté ${territorioAutonomico}`
              : `La normativa de ${territorioAutonomico} aún no está cargada`
          }
          mensaje={
            yaEnListaAutonomica
              ? 'Ya está en tu lista. Cuando la publiquemos, aparecerá aquí. Puedes gestionarla en Más › Mis sugerencias.'
              : 'Estamos ampliando comunidad a comunidad. Anótala y la priorizaremos; se guarda en tu móvil, no se envía a nadie.'
          }
          boton={
            yaEnListaAutonomica
              ? 'En lista de espera ✓'
              : solicitandoAutonomica
                ? 'Anotando…'
                : 'Avísame cuando esté disponible'
          }
          enviando={solicitandoAutonomica || yaEnListaAutonomica}
          onSolicitar={solicitarNormativaAutonomica}
        />
      ) : null}
      {puedeSolicitarMunicipal ? (
        <BloqueSolicitud
          t={t}
          icon={<Building2 size={18} color={t.color.accent} strokeWidth={2.2} />}
          encabezado={`Tu municipio: ${territorioMunicipal}`}
          titulo={
            yaEnListaMunicipal
              ? `Anotada · te avisaremos cuando esté ${territorioMunicipal}`
              : `La ordenanza de ${territorioMunicipal} aún no está cargada`
          }
          mensaje={
            yaEnListaMunicipal
              ? 'Ya está en tu lista. Cuando la carguemos, aparecerá aquí. Puedes gestionarla en Más › Mis sugerencias.'
              : 'Estamos ampliando municipio a municipio. Anótalo y lo priorizaremos; se guarda en tu móvil, no se envía a nadie.'
          }
          boton={
            yaEnListaMunicipal
              ? 'En lista de espera ✓'
              : solicitandoMunicipal
                ? 'Anotando…'
                : 'Avísame cuando esté disponible'
          }
          enviando={solicitandoMunicipal || yaEnListaMunicipal}
          onSolicitar={solicitarOrdenanza}
        />
      ) : null}
    </View>
  );
}

/** Bloque "solicítala" (encabezado + banner honesto + botón), reutilizado por ambas capas. */
function BloqueSolicitud({
  t,
  icon,
  encabezado,
  titulo,
  mensaje,
  boton,
  enviando,
  onSolicitar,
}: {
  t: Theme;
  icon: React.ReactNode;
  encabezado: string;
  titulo: string;
  mensaje: string;
  boton: string;
  enviando: boolean;
  onSolicitar: () => void;
}) {
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
        {icon}
        <Text
          style={{
            color: t.color.textSecondary,
            ...t.typography.scale.label,
            textTransform: 'uppercase',
            letterSpacing: 0.6,
          }}
        >
          {encabezado}
        </Text>
      </View>
      <View style={{ paddingHorizontal: t.spacing.base, gap: t.spacing.md, paddingTop: t.spacing.xs }}>
        <Banner tone="info" title={titulo}>
          {mensaje}
        </Banner>
        <Button
          title={boton}
          variant="secondary"
          onPress={onSolicitar}
          disabled={enviando}
          icon={Send}
        />
      </View>
    </View>
  );
}
