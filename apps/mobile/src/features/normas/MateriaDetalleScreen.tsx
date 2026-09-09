import { useEffect, useMemo, useState } from 'react';
import { SectionList, Text, View } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { BookOpen } from 'lucide-react-native';
import { ccaaPorId } from '@agente/shared';
import { useAppTheme } from '@/ui/useAppTheme';
import { EmptyState } from '@/ui/components/EmptyState';
import { SkeletonRows } from '@/ui/components/Skeleton';
import { getContentRunner } from '@/db/contentDb';
import { useSettingsStore } from '@/store/settings';
import { FilaNorma } from './normasUi';
import {
  agruparPorAmbito,
  listarNormas,
  materiaDeNorma,
  normaRelevantePara,
  MATERIA_INFO,
  type Materia,
  type NormaResumen,
} from './normas';

/**
 * Pestaña NORMAS (§4.5), nivel 1b: DETALLE de una materia. Muestra TODAS las normas de la materia
 * elegida (estilo SPPLB), agrupadas por ámbito (Estatal → En {CCAA} → En {municipio}). Offline.
 * Tocar una norma abre su articulado (ruta existente, sin cambios). Respeta el filtro por cuerpo con
 * el que se navegó desde el índice (`filtro=mio|todas`) para que el recuento de la tarjeta cuadre.
 */
type Estado = 'cargando' | 'ok' | 'sin-contenido';

export function MateriaDetalleScreen({
  materia,
  filtro,
}: {
  materia: Materia;
  filtro: 'mio' | 'todas';
}) {
  const t = useAppTheme();
  const router = useRouter();

  const [estado, setEstado] = useState<Estado>('cargando');
  const [normas, setNormas] = useState<NormaResumen[]>([]);

  const cuerpo = useSettingsStore((s) => s.cuerpo);
  const ccaaId = useSettingsStore((s) => s.ccaaId);
  const provinciaId = useSettingsStore((s) => s.provinciaId);
  const municipioId = useSettingsStore((s) => s.municipioId);
  const municipioNombre = useSettingsStore((s) => s.municipioNombre);

  const cadena = useMemo(
    () => [ccaaId, provinciaId, municipioId].filter((x): x is string => !!x),
    [ccaaId, provinciaId, municipioId],
  );
  const ccaaNombre = useMemo(() => (ccaaId ? (ccaaPorId(ccaaId)?.nombre ?? null) : null), [ccaaId]);

  const titulo = MATERIA_INFO[materia]?.label ?? 'Materia';

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

  // Normas de ESTA materia, respetando el filtro por cuerpo con el que se navegó (coincide con el
  // recuento de la tarjeta del índice). Con `todas` no se filtra por cuerpo.
  const deLaMateria = useMemo(() => {
    const soloMiCuerpo = filtro === 'mio' && cuerpo !== null;
    return normas.filter(
      (n) =>
        materiaDeNorma(n.codigo) === materia &&
        (!soloMiCuerpo || normaRelevantePara(n.cuerpos, cuerpo)),
    );
  }, [normas, materia, filtro, cuerpo]);

  const secciones = useMemo(() => {
    return agruparPorAmbito(deLaMateria).map((s) => {
      let label = s.titulo;
      if (s.ambito === 'autonomico') label = `En ${ccaaNombre?.trim() || 'tu comunidad'}`;
      else if (s.ambito === 'municipal') label = `En ${municipioNombre?.trim() || 'tu municipio'}`;
      return { ...s, titulo: label };
    });
  }, [deLaMateria, ccaaNombre, municipioNombre]);

  if (estado === 'cargando') {
    return (
      <View style={{ flex: 1, backgroundColor: t.color.bg, paddingTop: t.spacing.md }}>
        <Stack.Screen options={{ title: titulo }} />
        <SkeletonRows count={7} />
      </View>
    );
  }

  if (estado === 'sin-contenido') {
    return (
      <View style={{ flex: 1, backgroundColor: t.color.bg }}>
        <Stack.Screen options={{ title: titulo }} />
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
      <Stack.Screen options={{ title: titulo }} />
      <SectionList
        sections={secciones}
        keyExtractor={(n) => n.id}
        stickySectionHeadersEnabled={false}
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
          <FilaNorma item={item} onPress={(id) => router.push(`/normas/norma/${id}`)} />
        )}
        ListEmptyComponent={
          <View style={{ paddingTop: t.spacing.xxl }}>
            <EmptyState
              icon={BookOpen}
              title="Sin normas en esta materia"
              message="Aún no hay normas cargadas para esta materia en tu territorio."
            />
          </View>
        }
      />
    </View>
  );
}
