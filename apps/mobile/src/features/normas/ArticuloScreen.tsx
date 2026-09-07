import { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { useAppTheme } from '@/ui/useAppTheme';
import { Banner } from '@/ui/components/Banner';
import { SkeletonLine } from '@/ui/components/Skeleton';
import { Markdown } from '@/ui/markdown/Markdown';
import { formatFecha } from '@/features/ficha/format';
import { getContentRunner } from '@/db/contentDb';
import { BookmarkToggle } from './BookmarkToggle';
import { useMarcadoresStore } from './marcadoresStore';
import { cargarArticulo, estadoCambio, type ArticuloDetalle } from './normas';

/**
 * NORMAS (§4.5), nivel 3: texto consolidado de un artículo. Renderiza el Markdown de forma
 * legible (cuerpo ≥16 pt, seleccionable), con número y título; marcador local; aviso de "resumen
 * orientativo" si el texto es del seed; indicador de "cambió el dd/mm" si la versión es reciente;
 * y pie con la fuente (BOE / actualizado) + enlace a la norma consolidada.
 */
type Estado = 'cargando' | 'ok' | 'no-encontrado' | 'sin-contenido';

export function ArticuloScreen({ articuloId }: { articuloId: string }) {
  const t = useAppTheme();
  const insets = useSafeAreaInsets();

  const [estado, setEstado] = useState<Estado>('cargando');
  const [articulo, setArticulo] = useState<ArticuloDetalle | null>(null);

  const cargarMarcadores = useMarcadoresStore((s) => s.cargar);

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
      const a = await cargarArticulo(runner, articuloId);
      if (!vivo) return;
      if (!a) {
        setEstado('no-encontrado');
        return;
      }
      setArticulo(a);
      setEstado('ok');
    })();
    return () => {
      vivo = false;
    };
  }, [articuloId]);

  if (estado === 'cargando') {
    // Esqueleto de lectura (cabecera + párrafos) en vez de un spinner que "salta" (P1-10).
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: t.color.bg,
          padding: t.spacing.base,
          paddingTop: insets.top + t.spacing.base,
          gap: t.spacing.md,
        }}
      >
        <Stack.Screen options={{ title: 'Artículo' }} />
        <SkeletonLine width="45%" height={16} />
        <SkeletonLine width="75%" height={24} />
        <View style={{ gap: t.spacing.sm, marginTop: t.spacing.sm }}>
          <SkeletonLine width="100%" height={14} />
          <SkeletonLine width="96%" height={14} />
          <SkeletonLine width="98%" height={14} />
          <SkeletonLine width="60%" height={14} />
        </View>
      </View>
    );
  }

  if (estado !== 'ok' || !articulo) {
    return (
      <View style={{ flex: 1, backgroundColor: t.color.bg, padding: t.spacing.base, gap: t.spacing.sm }}>
        <Stack.Screen options={{ title: 'Artículo' }} />
        <Text style={{ color: t.color.textPrimary, ...t.typography.scale.titleM }}>
          {estado === 'sin-contenido' ? 'Contenido no disponible' : 'Artículo no encontrado'}
        </Text>
        <Text style={{ color: t.color.textSecondary, ...t.typography.scale.body }}>
          {estado === 'sin-contenido'
            ? 'El articulado necesita el paquete de contenido, disponible en la app móvil.'
            : 'No hemos encontrado este artículo en el contenido instalado.'}
        </Text>
      </View>
    );
  }

  const cambio = estadoCambio(articulo.validFrom, articulo.actualizadoEn);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.color.bg }}
      contentContainerStyle={{
        padding: t.spacing.base,
        paddingBottom: insets.bottom + t.spacing.xxl,
        gap: t.spacing.lg,
      }}
    >
      <Stack.Screen
        options={{
          title: `${articulo.normaCodigo} · art. ${articulo.numero}`,
          headerRight: () => (
            <BookmarkToggle
              articuloId={articulo.id}
              normaId={articulo.normaId}
              normaCodigo={articulo.normaCodigo}
              articuloNumero={articulo.numero}
              articuloTitulo={articulo.titulo}
            />
          ),
        }}
      />

      {/* Cabecera: norma, número y título del artículo. */}
      <View style={{ gap: t.spacing.xs }}>
        <Text style={{ color: t.color.textSecondary, ...t.typography.scale.bodyStrong }}>
          {articulo.normaCodigo} · art. {articulo.numero}
        </Text>
        {articulo.titulo ? (
          <Text
            accessibilityRole="header"
            maxFontSizeMultiplier={1.6}
            style={{ color: t.color.textPrimary, ...t.typography.scale.titleL }}
          >
            {articulo.titulo}
          </Text>
        ) : null}
      </View>

      {/* Indicador "cambió el dd/mm" / próxima entrada en vigor (§4.5). */}
      {cambio === 'reciente' ? (
        <Banner tone="info" title="Cambió recientemente">
          {`Esta versión entró en vigor el ${formatFecha(articulo.validFrom)}.`}
        </Banner>
      ) : null}
      {cambio === 'futuro' ? (
        <Banner tone="info" title="Próxima entrada en vigor">
          {`Esta redacción entra en vigor el ${formatFecha(articulo.validFrom)}.`}
        </Banner>
      ) : null}

      {/* Aviso de resumen orientativo (textos de seed, §4.5). */}
      {articulo.esResumen ? (
        <Banner tone="warning" title="Resumen orientativo">
          Este texto es un resumen orientativo, no el texto consolidado completo. Consulta la norma
          en el BOE para el detalle literal.
        </Banner>
      ) : null}

      {/* Texto del artículo (Markdown). */}
      <Markdown>{articulo.texto}</Markdown>

      {/* Pie: fuente + enlace al BOE. */}
      <View style={{ gap: t.spacing.sm, marginTop: t.spacing.sm }}>
        {articulo.actualizadoEn ? (
          <Text style={{ color: t.color.textTertiary, ...t.typography.scale.caption }}>
            Fuente: BOE · actualizado el {formatFecha(articulo.actualizadoEn)}
          </Text>
        ) : (
          <Text style={{ color: t.color.textTertiary, ...t.typography.scale.caption }}>
            Fuente: BOE
          </Text>
        )}
        {articulo.urlBoe ? (
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Abrir la norma consolidada en el BOE"
            onPress={() => void Linking.openURL(articulo.urlBoe as string)}
            style={{ minHeight: t.touch.min, justifyContent: 'center' }}
          >
            <Text style={{ color: t.color.brand, ...t.typography.scale.label }}>Abrir en el BOE ↗</Text>
          </Pressable>
        ) : null}
      </View>
    </ScrollView>
  );
}
