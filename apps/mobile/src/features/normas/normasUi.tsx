import { useMemo, useState } from 'react';
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
  const enviarPendientes = useFeedbackStore((s) => s.sendPending);

  const ccaaNombre = useMemo(() => (ccaaId ? (ccaaPorId(ccaaId)?.nombre ?? null) : null), [ccaaId]);

  const puedeSolicitarAutonomica = ccaaId !== null && !hayAutonomica;
  const puedeSolicitarMunicipal = municipioId !== null && !hayMunicipal;

  const [solicitandoAutonomica, setSolicitandoAutonomica] = useState(false);
  const [solicitandoMunicipal, setSolicitandoMunicipal] = useState(false);

  async function solicitarNormativaAutonomica() {
    if (solicitandoAutonomica) return;
    setSolicitandoAutonomica(true);
    hapticSelection();
    try {
      const { texto, territorio } = construirSolicitudNormativaAutonomica(
        ccaaNombre ?? 'mi comunidad',
      );
      await addFeedback({ tipo: 'sugerencia', texto, territorio, ...(cuerpo ? { cuerpo } : {}) });
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

  async function solicitarOrdenanza() {
    if (solicitandoMunicipal) return;
    setSolicitandoMunicipal(true);
    hapticSelection();
    try {
      const { texto, territorio } = construirSolicitudOrdenanza(
        municipioNombre ?? 'mi municipio',
        ccaaNombre,
      );
      await addFeedback({ tipo: 'sugerencia', texto, territorio, ...(cuerpo ? { cuerpo } : {}) });
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
          encabezado={`Tu comunidad: ${ccaaNombre?.trim() || 'tu comunidad'}`}
          titulo={`La normativa de ${ccaaNombre?.trim() || 'tu comunidad'} aún no está cargada`}
          mensaje="Estamos ampliando comunidad a comunidad. Pídenos la tuya y la priorizaremos; solo enviaremos el nombre de la comunidad, nada más."
          boton={solicitandoAutonomica ? 'Enviando…' : 'Solicitar la normativa de mi comunidad'}
          enviando={solicitandoAutonomica}
          onSolicitar={solicitarNormativaAutonomica}
        />
      ) : null}
      {puedeSolicitarMunicipal ? (
        <BloqueSolicitud
          t={t}
          icon={<Building2 size={18} color={t.color.accent} strokeWidth={2.2} />}
          encabezado={`Tu municipio: ${municipioNombre?.trim() || 'tu municipio'}`}
          titulo={`La ordenanza de ${municipioNombre?.trim() || 'tu municipio'} aún no está cargada`}
          mensaje="Estamos ampliando municipio a municipio. Pídenos el tuyo y lo priorizaremos; solo enviaremos el municipio y la comunidad, nada más."
          boton={solicitandoMunicipal ? 'Enviando…' : 'Solicitar mi ordenanza'}
          enviando={solicitandoMunicipal}
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
