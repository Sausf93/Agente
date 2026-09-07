import { useCallback, type ComponentType, type ReactNode } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Bell, CalendarClock, ChevronRight, Sparkles, Star, type LucideProps } from 'lucide-react-native';
import {
  proyectarDia,
  resumenHorasMes,
  type Cuadrante,
  type DiaProyectado,
} from '@agente/shared';
import { useAppTheme } from '@/ui/useAppTheme';
import type { Theme } from '@/ui/theme';
import { Badge } from '@/ui/components/Badge';
import { Card } from '@/ui/components/Card';
import { ListRow } from '@/ui/components/ListRow';
import { SeverityChip } from '@/ui/components/SeverityChip';
import { formatEuros } from '@/features/ficha/format';
import { colorServicio, SERVICIO_LABEL } from '@/features/cuadrante/servicioVisual';
import { useCuadranteStore } from '@/features/cuadrante/store';
import type { Favorito } from '@/db/userDb';
import { useFavoritosStore } from './favoritosStore';
import { useInicioStore } from './inicioStore';
import type { InfraccionSnapshot, UsoInfraccion } from './masUsadas';

/**
 * Contenido de INICIO (§4.2) que se muestra bajo el buscador cuando NO hay búsqueda activa.
 *
 * Orden (§4.2): accesos rápidos → tarjeta de turno → Tus favoritas → Tus más usadas → aviso de
 * novedades. Todo LOCAL y OFFLINE (ADR-001): favoritos y contadores viven en `user.db`; las
 * novedades salen del paquete de contenido. Se refresca al enfocar la pantalla (los contadores y
 * favoritos cambian mientras se usa la app). Componentes del sistema visual v2 (Card/ListRow/…).
 */
export interface HomeInicioProps {
  /** Rellena el buscador con un término (accesos rápidos). */
  onQuickSearch: (termino: string) => void;
  /** Abre la ficha de una infracción. */
  onAbrirFicha: (infraccionId: string) => void;
  paddingBottom: number;
}

/** Accesos rápidos por defecto (§4.2). Términos de calle que el buscador resuelve por sinónimo. */
const ACCESOS_RAPIDOS = [
  'Sin seguro',
  'Móvil',
  'Faro roto',
  'Alcoholemia',
  'Sin ITV',
  'Semáforo rojo',
] as const;

const TOP_FAVORITAS = 3;

export function HomeInicio({ onQuickSearch, onAbrirFicha, paddingBottom }: HomeInicioProps) {
  const t = useAppTheme();
  const router = useRouter();

  const favoritos = useFavoritosStore((s) => s.favoritos);
  const cargarFavoritos = useFavoritosStore((s) => s.cargar);
  const masUsadas = useInicioStore((s) => s.masUsadas);
  const novedadesNuevas = useInicioStore((s) => s.novedadesNuevas);
  const totalNovedades = useInicioStore((s) => s.novedades.length);
  const cargarInicio = useInicioStore((s) => s.cargar);

  const cuadrante = useCuadranteStore((s) => s.cuadrante);
  const cuadranteLoaded = useCuadranteStore((s) => s.loaded);
  const cargarCuadrante = useCuadranteStore((s) => s.load);

  // Al enfocar Inicio, refrescar lo local (favoritos y contadores cambian mientras se usa la app).
  useFocusEffect(
    useCallback(() => {
      void cargarFavoritos();
      void cargarInicio();
      if (!cuadranteLoaded) void cargarCuadrante();
    }, [cargarFavoritos, cargarInicio, cuadranteLoaded, cargarCuadrante]),
  );

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{
        paddingHorizontal: t.spacing.base,
        paddingTop: t.spacing.md,
        paddingBottom,
        gap: t.spacing.xl,
      }}
      keyboardShouldPersistTaps="handled"
    >
      <AccesosRapidos t={t} onQuickSearch={onQuickSearch} />

      <TarjetaTurno t={t} cuadrante={cuadrante} onConfigurar={() => router.push('/cuadrante')} />

      <Seccion
        t={t}
        titulo="Tus favoritas"
        verTodas={favoritos.length > TOP_FAVORITAS ? () => router.push('/favoritos') : undefined}
      >
        {favoritos.length === 0 ? (
          <Vacio
            t={t}
            icon={Star}
            texto="Guarda una infracción con la estrella de su ficha para tenerla a mano."
          />
        ) : (
          favoritos.slice(0, TOP_FAVORITAS).map((f) => (
            <FilaInfraccion key={f.infraccionId} t={t} item={f} onPress={onAbrirFicha} />
          ))
        )}
      </Seccion>

      <Seccion t={t} titulo="Tus más usadas">
        {masUsadas.length === 0 ? (
          <Vacio
            t={t}
            icon={Sparkles}
            texto="Aquí aparecerán las que más consultas y copias, para llegar antes en el siguiente servicio."
          />
        ) : (
          masUsadas.map((u) => (
            <FilaInfraccion key={u.infraccionId} t={t} item={u} onPress={onAbrirFicha} />
          ))
        )}
      </Seccion>

      <AvisoNovedades
        t={t}
        nuevas={novedadesNuevas}
        total={totalNovedades}
        onAbrir={() => router.push('/novedades')}
      />
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Accesos rápidos
// ---------------------------------------------------------------------------

function AccesosRapidos({ t, onQuickSearch }: { t: Theme; onQuickSearch: (term: string) => void }) {
  return (
    <View style={{ gap: t.spacing.sm }}>
      <TituloSeccion t={t} titulo="Accesos rápidos" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm }}>
        {ACCESOS_RAPIDOS.map((term) => (
          <Pressable
            key={term}
            accessibilityRole="button"
            accessibilityLabel={`Buscar ${term}`}
            onPress={() => onQuickSearch(term)}
            style={({ pressed }) => ({
              minHeight: t.touch.min,
              justifyContent: 'center',
              borderRadius: t.radius.pill,
              borderWidth: 1,
              borderColor: t.color.border,
              backgroundColor: pressed ? t.color.surfaceAlt : t.color.surface,
              paddingHorizontal: t.spacing.base,
            })}
          >
            <Text style={{ color: t.color.textPrimary, ...t.typography.scale.label }}>{term}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Tarjeta de turno (del cuadrante, si está configurado)
// ---------------------------------------------------------------------------

function hoyISO(): string {
  const d = new Date();
  const y = d.getFullYear().toString().padStart(4, '0');
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const da = d.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${da}`;
}

function TarjetaTurno({
  t,
  cuadrante,
  onConfigurar,
}: {
  t: Theme;
  cuadrante: Cuadrante | null;
  onConfigurar: () => void;
}) {
  if (!cuadrante) {
    return (
      <Pressable accessibilityRole="button" accessibilityLabel="Configurar tu cuadrante" onPress={onConfigurar}>
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.md }}>
            <CalendarClock size={24} color={t.color.accent} strokeWidth={2} />
            <View style={{ flex: 1, gap: t.spacing.xxs }}>
              <Text style={{ color: t.color.textPrimary, ...t.typography.scale.bodyStrong }}>
                Configura tu cuadrante
              </Text>
              <Text style={{ color: t.color.textSecondary, ...t.typography.scale.caption }}>
                Elige tu patrón de turnos y lleva el contador de horas del mes.
              </Text>
            </View>
            <ChevronRight size={20} color={t.color.textTertiary} strokeWidth={2} />
          </View>
        </Card>
      </Pressable>
    );
  }

  const hoy = hoyISO();
  const dia: DiaProyectado = proyectarDia(cuadrante, hoy);
  const anio = Number(hoy.slice(0, 4));
  const mes = Number(hoy.slice(5, 7));
  const resumen = resumenHorasMes(cuadrante, anio, mes);
  const c = colorServicio(t, dia.servicio);
  const trabaja = dia.computaPresencia && dia.horaInicio && dia.horaFin;
  const franja = trabaja ? `${dia.horaInicio}–${dia.horaFin}` : null;
  const a11y = `Hoy, ${SERVICIO_LABEL[dia.servicio]}${franja ? ` de ${dia.horaInicio} a ${dia.horaFin}` : ''}. Este mes, ${resumen.horasTotales} horas.`;

  return (
    <Card style={{ gap: t.spacing.sm }}>
      <View
        accessible
        accessibilityLabel={a11y}
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <View style={{ gap: t.spacing.xxs }}>
          <Text style={{ color: t.color.textSecondary, ...t.typography.scale.caption }}>Hoy</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm }}>
            <View
              style={{
                borderRadius: t.radius.sm,
                backgroundColor: c.bg,
                paddingHorizontal: t.spacing.sm,
                paddingVertical: t.spacing.xxs,
              }}
            >
              <Text style={{ color: c.fg, ...t.typography.scale.label }}>
                {SERVICIO_LABEL[dia.servicio]}
              </Text>
            </View>
            {franja ? (
              <Text
                style={{
                  color: t.color.textPrimary,
                  ...t.typography.scale.bodyStrong,
                  fontVariant: ['tabular-nums'],
                }}
              >
                {franja}
              </Text>
            ) : null}
          </View>
        </View>
        <View style={{ alignItems: 'flex-end', gap: t.spacing.xxs }}>
          <Text style={{ color: t.color.textSecondary, ...t.typography.scale.caption }}>Este mes</Text>
          <Text
            style={{
              color: t.color.textPrimary,
              ...t.typography.scale.titleL,
              fontVariant: ['tabular-nums'],
            }}
          >
            {resumen.horasTotales} h
          </Text>
        </View>
      </View>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Aviso de novedades
// ---------------------------------------------------------------------------

function AvisoNovedades({
  t,
  nuevas,
  total,
  onAbrir,
}: {
  t: Theme;
  nuevas: number;
  total: number;
  onAbrir: () => void;
}) {
  const hayNuevas = nuevas > 0;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        hayNuevas ? `Novedades normativas, ${nuevas} sin leer` : 'Novedades normativas'
      }
      onPress={onAbrir}
    >
      <Card
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: t.spacing.md,
          ...(hayNuevas
            ? { borderColor: t.color.info, backgroundColor: t.color.infoBg }
            : null),
        }}
      >
        <Bell size={22} color={hayNuevas ? t.color.info : t.color.textSecondary} strokeWidth={2} />
        <View style={{ flex: 1, gap: t.spacing.xxs }}>
          <Text style={{ color: t.color.textPrimary, ...t.typography.scale.bodyStrong }}>
            Novedades normativas
          </Text>
          <Text style={{ color: t.color.textSecondary, ...t.typography.scale.caption }}>
            {hayNuevas
              ? `${nuevas} ${nuevas === 1 ? 'novedad nueva' : 'novedades nuevas'} desde tu última visita.`
              : total > 0
                ? 'Al día. Consulta el histórico de cambios.'
                : 'Aquí verás qué normas cambian en cada actualización.'}
          </Text>
        </View>
        {hayNuevas ? <Badge label={String(nuevas)} tone="info" /> : (
          <ChevronRight size={20} color={t.color.textTertiary} strokeWidth={2} />
        )}
      </Card>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Piezas compartidas
// ---------------------------------------------------------------------------

function TituloSeccion({ t, titulo }: { t: Theme; titulo: string }) {
  return (
    <Text accessibilityRole="header" style={{ color: t.color.textPrimary, ...t.typography.scale.titleM }}>
      {titulo}
    </Text>
  );
}

function Seccion({
  t,
  titulo,
  verTodas,
  children,
}: {
  t: Theme;
  titulo: string;
  verTodas?: (() => void) | undefined;
  children: ReactNode;
}) {
  return (
    <View style={{ gap: t.spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <TituloSeccion t={t} titulo={titulo} />
        {verTodas ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Ver todas: ${titulo}`}
            onPress={verTodas}
            hitSlop={8}
            style={{ minHeight: t.touch.min, justifyContent: 'center' }}
          >
            <Text style={{ color: t.color.accent, ...t.typography.scale.label }}>Ver todas</Text>
          </Pressable>
        ) : null}
      </View>
      <Card style={{ padding: 0, gap: 0, overflow: 'hidden' }}>{children}</Card>
    </View>
  );
}

function Vacio({
  t,
  icon: Icon,
  texto,
}: {
  t: Theme;
  icon: ComponentType<LucideProps>;
  texto: string;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.md, padding: t.spacing.md }}>
      <Icon size={22} color={t.color.textTertiary} strokeWidth={1.75} />
      <Text style={{ flex: 1, color: t.color.textSecondary, ...t.typography.scale.body }}>
        {texto}
      </Text>
    </View>
  );
}

/** Fila de infracción (favorita o más usada). Mismo lenguaje visual que un resultado de búsqueda. */
export function FilaInfraccion({
  t,
  item,
  onPress,
}: {
  t: Theme;
  item: Favorito | UsoInfraccion | InfraccionSnapshot;
  onPress: (id: string) => void;
}) {
  return (
    <ListRow
      title={item.tituloCorto}
      meta={`${item.normaCodigo} art. ${item.articuloNumero}`}
      accessibilityHint="Abre la ficha de la infracción"
      onPress={() => onPress(item.infraccionId)}
      right={
        <>
          <SeverityChip gravedad={item.gravedad} />
          {item.importeEur !== null ? (
            <Text
              style={{
                color: t.color.textPrimary,
                ...t.typography.scale.bodyStrong,
                fontVariant: ['tabular-nums'],
              }}
            >
              {formatEuros(item.importeEur)}
            </Text>
          ) : null}
        </>
      }
    />
  );
}
