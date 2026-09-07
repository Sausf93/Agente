import { useEffect, useRef } from 'react';
import { Alert, FlatList, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AlertTriangle, SearchX, Sparkles } from 'lucide-react-native';
import { useAppTheme } from '@/ui/useAppTheme';
import type { Theme } from '@/ui/theme';
import { SearchBar } from '@/ui/components/SearchBar';
import { ScreenHeader } from '@/ui/components/ScreenHeader';
import { PressableScale } from '@/ui/components/PressableScale';
import { SeverityChip } from '@/ui/components/SeverityChip';
import { SkeletonRows } from '@/ui/components/Skeleton';
import { Button } from '@/ui/components/Button';
import { useReduceMotion } from '@/ui/motion';
import { CONSECUENCIA_LABEL, formatEuros } from '@/features/ficha/format';
import { HomeInicio } from '@/features/inicio/HomeInicio';
import { useBuscadorStore } from './store';
import { useRecientesStore } from './recientesStore';
import { resaltarCoincidencia } from './resaltar';
import type { ResultadoBusqueda } from './search';

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
  const buscando = useBuscadorStore((s) => s.buscando);
  const buscado = useBuscadorStore((s) => s.buscado);
  const sinContenido = useBuscadorStore((s) => s.sinContenido);
  const setConsulta = useBuscadorStore((s) => s.setConsulta);
  const buscar = useBuscadorStore((s) => s.buscar);
  const registrarReciente = useRecientesStore((s) => s.registrar);

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

  function avisoVoz() {
    Alert.alert('Búsqueda por voz', 'Llega en la próxima versión. De momento, escribe tu búsqueda.');
  }

  // Inicio (§4.2) cuando NO hay búsqueda activa: accesos rápidos, turno, favoritas, más usadas y
  // novedades. En cuanto el agente escribe algo, la pantalla pasa a los resultados del buscador.
  const enInicio = consulta.trim().length === 0;

  return (
    <View style={{ flex: 1, backgroundColor: t.color.bg }}>
      <ScreenHeader title="Buscar">
        <SearchBar
          value={consulta}
          onChangeText={setConsulta}
          autoFocus={autoFocusInicial}
          onMicPress={avisoVoz}
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
              onPress={abrirFicha}
            />
          )}
          ListEmptyComponent={
            <EstadoVacio
              t={t}
              buscando={buscando}
              buscado={buscado}
              sinContenido={sinContenido}
              consulta={consulta}
              onReportar={() => router.push('/feedback')}
            />
          }
        />
      )}
    </View>
  );
}

function FilaResultado({
  t,
  item,
  consulta,
  index,
  reduceMotion,
  onPress,
}: {
  t: Theme;
  item: ResultadoBusqueda;
  consulta: string;
  index: number;
  reduceMotion: boolean;
  onPress: (id: string) => void;
}) {
  const importe = formatEuros(item.importeEur);
  const segmentos = resaltarCoincidencia(item.tituloCorto, consulta);
  const delay = Math.min(index * STAGGER_MS, STAGGER_MAX_MS);

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
          <Text numberOfLines={1} style={{ color: t.color.textSecondary, ...t.typography.scale.caption }}>
            {item.normaCodigo} art. {item.articuloNumero}
          </Text>
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

function EstadoVacio({
  t,
  buscando,
  buscado,
  sinContenido,
  consulta,
  onReportar,
}: {
  t: Theme;
  buscando: boolean;
  buscado: boolean;
  sinContenido: boolean;
  consulta: string;
  onReportar: () => void;
}) {
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
    detalle = 'Prueba con "faro roto", "sin seguro", "móvil" o un artículo como "RGC 18".';
  } else if (buscado) {
    titulo = 'Nada exacto para esto';
    detalle = 'No encontramos ninguna infracción. Lo hemos anotado para mejorar el buscador.';
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
