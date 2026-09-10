import { useEffect, useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { BookOpen } from 'lucide-react-native';
import { useAppTheme } from '@/ui/useAppTheme';
import { EmptyState } from '@/ui/components/EmptyState';
import { SkeletonRows } from '@/ui/components/Skeleton';
import { getContentRunner } from '@/db/contentDb';
import { useSettingsStore } from '@/store/settings';
import { FilaInfraccion } from './normasUi';
import {
  agruparPorSubtema,
  listarInfraccionesDeMateria,
  SUBTEMA_INFO,
  type InfraccionResumen,
  type Materia,
} from './normas';

/**
 * Pestaña NORMAS, nivel 3: FICHAS de un SUB-TEMA (flujo materia → sub-tema → lista → ficha, estilo
 * SPPLB). Carga las fichas de la materia y aplica la MISMA agrupación anti-vacío que el índice de
 * sub-temas, para quedarse con las del sub-tema elegido. Tocar una abre su ficha. Offline.
 */
type Estado = 'cargando' | 'ok' | 'sin-contenido';

export function SubTemaFichasScreen({ materia, subtema }: { materia: Materia; subtema: string }) {
  const t = useAppTheme();
  const router = useRouter();

  const [estado, setEstado] = useState<Estado>('cargando');
  const [fichas, setFichas] = useState<InfraccionResumen[]>([]);

  const ccaaId = useSettingsStore((s) => s.ccaaId);
  const provinciaId = useSettingsStore((s) => s.provinciaId);
  const municipioId = useSettingsStore((s) => s.municipioId);
  const cadena = useMemo(
    () => [ccaaId, provinciaId, municipioId].filter((x): x is string => !!x),
    [ccaaId, provinciaId, municipioId],
  );

  const titulo = SUBTEMA_INFO[subtema]?.label ?? 'Sub-tema';

  useEffect(() => {
    let vivo = true;
    (async () => {
      const runner = await getContentRunner();
      if (!vivo) return;
      if (!runner) {
        setEstado('sin-contenido');
        return;
      }
      const todas = await listarInfraccionesDeMateria(runner, materia, cadena);
      if (!vivo) return;
      const grupo = agruparPorSubtema(todas, materia).find((g) => g.key === subtema);
      setFichas(grupo?.fichas ?? []);
      setEstado('ok');
    })();
    return () => {
      vivo = false;
    };
  }, [cadena, materia, subtema]);

  if (estado === 'cargando') {
    return (
      <View style={{ flex: 1, backgroundColor: t.color.bg, paddingTop: t.spacing.md }}>
        <Stack.Screen options={{ title: titulo }} />
        <SkeletonRows count={6} />
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
          message="El paquete de contenido viaja en la app móvil (iOS/Android)."
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.color.bg }}>
      <Stack.Screen options={{ title: titulo }} />
      <FlatList
        data={fichas}
        keyExtractor={(f) => f.id}
        renderItem={({ item }) => (
          <FilaInfraccion item={item} onPress={(id) => router.push(`/ficha/${id}`)} />
        )}
        contentContainerStyle={{ paddingBottom: t.spacing.xxl, paddingTop: t.spacing.sm }}
        ListEmptyComponent={
          <View style={{ paddingTop: t.spacing.xxl }}>
            <EmptyState
              icon={BookOpen}
              title="Sin fichas"
              message="Este sub-tema no tiene fichas para tu territorio."
            />
          </View>
        }
      />
    </View>
  );
}
