import { useEffect, useRef } from 'react';
import { FlatList, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AlertTriangle, BookOpen, ChevronRight, SearchX, Sparkles } from 'lucide-react-native';
import type { Cuerpo } from '@agente/shared';
import { useAppTheme } from '@/ui/useAppTheme';
import type { Theme } from '@/ui/theme';
import { SearchBar } from '@/ui/components/SearchBar';
import { ScreenHeader } from '@/ui/components/ScreenHeader';
import { PressableScale } from '@/ui/components/PressableScale';
import { SeverityChip } from '@/ui/components/SeverityChip';
import { Badge } from '@/ui/components/Badge';
import { SkeletonRows } from '@/ui/components/Skeleton';
import { Button } from '@/ui/components/Button';
import { useReduceMotion } from '@/ui/motion';
import { CONSECUENCIA_LABEL, formatEuros } from '@/features/ficha/format';
import { HomeInicio } from '@/features/inicio/HomeInicio';
import { accesosRapidosPara } from '@/features/inicio/accesosRapidos';
import { useSettingsStore } from '@/store/settings';
import { useBuscadorStore } from './store';
import { useRecientesStore } from './recientesStore';
import { resaltarCoincidencia } from './resaltar';
import type { ResultadoArticulo, ResultadoBusqueda } from './search';

/**
 * Pestaña BUSCAR (§4.3) — la home y el núcleo del producto.
 *
 * Offline: consulta el paquete de contenido en el dispositivo. Debounce de ~180 ms. Los
 * resultados llegan VIVOS (mejoras-usabilidad P0-4): el término buscado se resalta en cada fila,
 * se muestra un chip con la consecuencia determinante (grúa/inmovilización/detención) y las filas
 * entran con un barrido escalonado; mientras busca, un SKELETON en vez de spinner. Estado vacío
 * diferenciado: "aún no has buscado" vs "sin resultados".
 */
const DEBOUNCE_MS = 180;
/** Tope del escalonado de entrada (P0-4): ~20 ms por fila, máx. 240 ms en total. */
const STAGGER_MS = 20;
const STAGGER_MAX_MS = 240;

export function BuscadorScreen() {
  const t = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const reduceMotion = useReduceMotion();

  const consulta = useBuscadorStore((s) => s.consulta);
  const resultados = useBuscadorStore((s) => s.resultados);
  const articulos = useBuscadorStore((s) => s.articulos);
  const buscando = useBuscadorStore((s) => s.buscando);
  const buscado = useBuscadorStore((s) => s.buscado);
  const sinContenido = useBuscadorStore((s) => s.sinContenido);
  const setConsulta = useBuscadorStore((s) => s.setConsulta);
  const buscar = useBuscadorStore((s) => s.buscar);
  const registrarReciente = useRecientesStore((s) => s.registrar);
  // Cuerpo y municipio del perfil: adaptan las sugerencias del estado vacío y el distintivo de
  // ámbito de un resultado municipal (ordenanza del propio municipio del agente).
  const cuerpo = useSettingsStore((s) => s.cuerpo);
  const municipioNombre = useSettingsStore((s) => s.municipioNombre);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Autofoco solo en arranque en frío (sin texto previo). No se re-enfoca al volver de una ficha.
  const autoFocusInicial = useRef(consulta.trim().length === 0).current;

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
    // Abrir una ficha desde un resultado marca la búsqueda como "útil": se recuerda el término tal
    // cual para poder repetirlo (§6.1). Con el buscador vacío (favoritas/más usadas) es un no-op.
    registrarReciente(consulta);
    router.push(`/ficha/${id}`);
  }

  function abrirArticulo(id: string) {
    // Un artículo de la sección "En la ley" abre su pantalla en Normas (§4.5). Cuenta igual como
    // búsqueda útil: se recuerda el término para repetirlo.
    registrarReciente(consulta);
    router.push(`/normas/articulo/${encodeURIComponent(id)}`);
  }

  // Inicio (§4.2) cuando NO hay búsqueda activa: accesos rápidos, turno, favoritas, más usadas y
  // novedades. En cuanto el agente escribe algo, la pantalla pasa a los resultados del buscador.
  const enInicio = consulta.trim().length === 0;

  return (
    <View style={{ flex: 1, backgroundColor: t.color.bg }}>
      <ScreenHeader title="Buscar">
        {/* Sin micrófono en la beta: la búsqueda por voz aún no existe (P2-15) y prometerla resta. */}
        <SearchBar
          value={consulta}
          onChangeText={setConsulta}
          autoFocus={autoFocusInicial}
        />
      </ScreenHeader>

      {enInicio ? (
        <HomeInicio
          onQuickSearch={setConsulta}
          onAbrirFicha={abrirFicha}
          paddingBottom={insets.bottom + t.spacing.xxl}
        />
      ) : (
        <FlatList
          data={resultados}
          keyExtractor={(r) => r.infraccionId}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          style={{ marginTop: t.spacing.md }}
          contentContainerStyle={{ paddingBottom: insets.bottom + t.spacing.xxl }}
          renderItem={({ item, index }) => (
            <FilaResultado
              t={t}
              item={item}
              consulta={consulta}
              index={index}
              reduceMotion={reduceMotion}
              municipioNombre={municipioNombre}
              onPress={abrirFicha}
            />
          )}
          ListFooterComponent={
            articulos.length > 0 ? (
              <SeccionArticulos
                t={t}
                articulos={articulos}
                consulta={consulta}
                reduceMotion={reduceMotion}
                hayInfracciones={resultados.length > 0}
                onPress={abrirArticulo}
              />
            ) : null
          }
          ListEmptyComponent={
            <EstadoVacio
              t={t}
              buscando={buscando}
              buscado={buscado}
              sinContenido={sinContenido}
              consulta={consulta}
              cuerpo={cuerpo}
              hayArticulos={articulos.length > 0}
              onReportar={() => router.push('/feedback')}
            />
          }
        />
      )}
    </View>
  );
}

/** Cabecera + filas de la sección "En la ley" (§4.3, segundo nivel del buscador). */
function SeccionArticulos({
  t,
  articulos,
  consulta,
  reduceMotion,
  hayInfracciones,
  onPress,
}: {
  t: Theme;
  articulos: ResultadoArticulo[];
  consulta: string;
  reduceMotion: boolean;
  hayInfracciones: boolean;
  onPress: (id: string) => void;
}) {
  return (
    <View style={{ marginTop: hayInfracciones ? t.spacing.lg : 0 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: t.spacing.sm,
          paddingHorizontal: t.spacing.base,
          paddingTop: t.spacing.sm,
          paddingBottom: t.spacing.xs,
        }}
      >
        <BookOpen size={16} color={t.color.textSecondary} strokeWidth={2} />
        <Text
          style={{
            color: t.color.textSecondary,
            ...t.typography.scale.caption,
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}
        >
          En la ley
        </Text>
      </View>
      {articulos.map((item, index) => (
        <FilaArticulo
          key={item.articuloId}
          t={t}
          item={item}
          consulta={consulta}
          index={index}
          reduceMotion={reduceMotion}
          onPress={onPress}
        />
      ))}
    </View>
  );
}

function FilaArticulo({
  t,
  item,
  consulta,
  index,
  reduceMotion,
  onPress,
}: {
  t: Theme;
  item: ResultadoArticulo;
  consulta: string;
  index: number;
  reduceMotion: boolean;
  onPress: (id: string) => void;
}) {
  const encabezado = item.titulo
    ? `${item.normaCodigo} art. ${item.numero} · ${item.titulo}`
    : `${item.normaCodigo} art. ${item.numero}`;
  const segmentos = resaltarCoincidencia(encabezado, consulta);
  const delay = Math.min(index * STAGGER_MS, STAGGER_MAX_MS);

  return (
    <Animated.View
      {...(reduceMotion ? {} : { entering: FadeInDown.duration(t.motion.durBase).delay(delay) })}
    >
      <PressableScale
        accessibilityLabel={encabezado}
        accessibilityHint="Abre el texto del artículo en Normas"
        onPress={() => onPress(item.articuloId)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: t.spacing.md,
          minHeight: t.touch.min + 8,
          paddingVertical: t.spacing.md,
          paddingHorizontal: t.spacing.base,
          borderBottomWidth: 1,
          borderBottomColor: t.color.border,
          backgroundColor: t.color.surface,
        }}
      >
        <View style={{ flex: 1, gap: t.spacing.xxs }}>
          <Text numberOfLines={2} maxFontSizeMultiplier={1.6} style={t.typography.scale.bodyStrong}>
            {segmentos.map((s, i) => (
              <Text
                key={i}
                style={{
                  color: s.match ? t.color.accent : t.color.textPrimary,
                  ...(s.match
                    ? { backgroundColor: t.color.accentWeak, fontWeight: '700' as const }
                    : null),
                }}
              >
                {s.texto}
              </Text>
            ))}
          </Text>
          <Text
            numberOfLines={2}
            style={{ color: t.color.textSecondary, ...t.typography.scale.caption }}
          >
            {item.extracto}
          </Text>
        </View>
        <ChevronRight size={20} color={t.color.textTertiary} strokeWidth={2} />
      </PressableScale>
    </Animated.View>
  );
}

function FilaResultado({
  t,
  item,
  consulta,
  index,
  reduceMotion,
  municipioNombre,
  onPress,
}: {
  t: Theme;
  item: ResultadoBusqueda;
  consulta: string;
  index: number;
  reduceMotion: boolean;
  municipioNombre: string | null;
  onPress: (id: string) => void;
}) {
  const importe = formatEuros(item.importeEur);
  const segmentos = resaltarCoincidencia(item.tituloCorto, consulta);
  const delay = Math.min(index * STAGGER_MS, STAGGER_MAX_MS);
  // Un resultado MUNICIPAL (ordenanza) se distingue de lo estatal con un distintivo de ámbito: el
  // nombre del municipio del perfil (siempre el propio, por el filtro territorial) o "Municipal".
  const esMunicipal = item.ambito === 'municipal';
  const ambitoLabel = esMunicipal ? (municipioNombre ?? 'Municipal') : null;

  return (
    <Animated.View
      {...(reduceMotion
        ? {}
        : { entering: FadeInDown.duration(t.motion.durBase).delay(delay) })}
    >
      <PressableScale
        accessibilityLabel={item.tituloCorto}
        accessibilityHint="Abre la ficha de la infracción"
        onPress={() => onPress(item.infraccionId)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: t.spacing.md,
          minHeight: t.touch.min + 8,
          paddingVertical: t.spacing.md,
          paddingHorizontal: t.spacing.base,
          borderBottomWidth: 1,
          borderBottomColor: t.color.border,
          backgroundColor: t.color.surface,
        }}
      >
        <View style={{ flex: 1, gap: t.spacing.xxs }}>
          <Text numberOfLines={2} maxFontSizeMultiplier={1.6} style={t.typography.scale.bodyStrong}>
            {segmentos.map((s, i) => (
              <Text
                key={i}
                style={{
                  color: s.match ? t.color.accent : t.color.textPrimary,
                  ...(s.match
                    ? { backgroundColor: t.color.accentWeak, fontWeight: '700' as const }
                    : null),
                }}
              >
                {s.texto}
              </Text>
            ))}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.xs, flexWrap: 'wrap' }}>
            <Text numberOfLines={1} style={{ color: t.color.textSecondary, ...t.typography.scale.caption }}>
              {item.normaCodigo} art. {item.articuloNumero}
            </Text>
            {ambitoLabel ? <Badge label={ambitoLabel} tone="info" /> : null}
          </View>
          {item.pista ? (
            <View
              style={{
                flexDirection: 'row',
                alignSelf: 'flex-start',
                alignItems: 'center',
                gap: t.spacing.xxs,
                marginTop: t.spacing.xxs,
                borderRadius: t.radius.pill,
                borderWidth: 1,
                borderColor: item.pista.peligro ? t.color.danger : t.color.border,
                backgroundColor: t.color.surfaceAlt,
                paddingHorizontal: t.spacing.sm,
                paddingVertical: 2,
              }}
            >
              <AlertTriangle
                size={12}
                color={item.pista.peligro ? t.color.danger : t.color.textSecondary}
                strokeWidth={2.2}
              />
              <Text
                style={{
                  color: item.pista.peligro ? t.color.danger : t.color.textSecondary,
                  ...t.typography.scale.caption,
                  fontWeight: '600',
                }}
              >
                {CONSECUENCIA_LABEL[item.pista.tipo]}
              </Text>
            </View>
          ) : null}
        </View>
        <View style={{ alignItems: 'flex-end', gap: t.spacing.xxs }}>
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
        </View>
      </PressableScale>
    </Animated.View>
  );
}

/**
 * Ejemplos de búsqueda ADAPTADOS AL CUERPO (§4.3): las sugerencias no deben oler a tráfico para
 * quien no lo trabaja. Se toman de los accesos rápidos del cuerpo (fuente única), en formato de
 * frase entrecomillada. Un token extra ("RGC 18"/"LOSC 16") recuerda que también se busca por artículo.
 */
function ejemplosBusquedaPara(cuerpo: Cuerpo | null): string {
  const terminos = accesosRapidosPara(cuerpo)
    .filter((a) => a.destino.tipo === 'buscar')
    .slice(0, 3)
    .map((a) => `"${a.label}"`);
  const porArticulo = cuerpo === 'policia_nacional' ? '"LOSC 16"' : '"RGC 18"';
  return `Prueba con ${terminos.join(', ')} o un artículo como ${porArticulo}.`;
}

function EstadoVacio({
  t,
  buscando,
  buscado,
  sinContenido,
  consulta,
  cuerpo,
  hayArticulos,
  onReportar,
}: {
  t: Theme;
  buscando: boolean;
  buscado: boolean;
  sinContenido: boolean;
  consulta: string;
  cuerpo: Cuerpo | null;
  hayArticulos: boolean;
  onReportar: () => void;
}) {
  // Si no hay infracciones pero SÍ artículos, no hay "vacío": lo pinta el footer "En la ley".
  if (hayArticulos) return null;

  // Mientras busca con texto: SKELETON de filas en vez de un spinner que salta (P1-10).
  if (buscando && consulta.trim().length > 0) {
    return <SkeletonRows count={6} />;
  }

  let titulo: string;
  let detalle: string;
  let sinResultados = false;
  if (sinContenido) {
    titulo = 'Contenido no disponible aquí';
    detalle =
      'El buscador funciona en la app móvil (iOS/Android). En web todavía no está el paquete de contenido.';
  } else if (consulta.trim().length === 0) {
    titulo = 'Busca en el lenguaje de la calle';
    detalle = ejemplosBusquedaPara(cuerpo);
  } else if (buscado) {
    titulo = 'Nada exacto para esto';
    detalle =
      'No encontramos ninguna infracción ni artículo de la ley. Lo hemos anotado para mejorar el buscador. ' +
      ejemplosBusquedaPara(cuerpo);
    sinResultados = true;
  } else {
    return null;
  }

  const Icono = sinResultados ? SearchX : Sparkles;

  return (
    <View
      style={{
        paddingTop: t.spacing.xxl,
        paddingHorizontal: t.spacing.xl,
        gap: t.spacing.md,
        alignItems: 'center',
      }}
    >
      <Icono size={44} color={t.color.textTertiary} strokeWidth={1.75} />
      <Text style={{ color: t.color.textPrimary, ...t.typography.scale.titleM, textAlign: 'center' }}>
        {titulo}
      </Text>
      <Text style={{ color: t.color.textSecondary, ...t.typography.scale.body, textAlign: 'center' }}>
        {detalle}
      </Text>
      {sinResultados ? (
        <View style={{ alignSelf: 'stretch', marginTop: t.spacing.sm }}>
          <Button title="Reportar que falta esto" variant="secondary" onPress={onReportar} />
        </View>
      ) : null}
    </View>
  );
}
