import { useCallback, useEffect, useState, type ComponentType, type ReactNode } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  Bell,
  Bike,
  CalendarClock,
  CalendarX,
  ChevronRight,
  CircleParking,
  Fingerprint,
  Gauge,
  Globe,
  Hand,
  Lightbulb,
  Pill,
  RotateCcw,
  ScrollText,
  Search,
  ShieldOff,
  ShoppingBag,
  Siren,
  Smartphone,
  Sparkles,
  Star,
  TrafficCone,
  Wine,
  type LucideProps,
} from 'lucide-react-native';
import {
  proyectarDia,
  resumenHorasMes,
  type Cuadrante,
  type Cuerpo,
  type DiaProyectado,
} from '@agente/shared';
import { useAppTheme } from '@/ui/useAppTheme';
import type { Theme } from '@/ui/theme';
import { Badge } from '@/ui/components/Badge';
import { Card } from '@/ui/components/Card';
import { ListRow } from '@/ui/components/ListRow';
import { PressableScale } from '@/ui/components/PressableScale';
import { SeverityChip } from '@/ui/components/SeverityChip';
import { hapticSelection } from '@/ui/haptics';
import { formatEuros } from '@/features/ficha/format';
import { colorServicio, SERVICIO_LABEL } from '@/features/cuadrante/servicioVisual';
import { useCuadranteStore } from '@/features/cuadrante/store';
import type { Favorito } from '@/db/userDb';
import { useRecientesStore } from '@/features/buscador/recientesStore';
import { useSettingsStore } from '@/store/settings';
import { getContentRunner } from '@/db/contentDb';
import { listarCcaaConContenido } from '@/features/normas/normas';
import { accesosRapidosPara, type AccesoDestino } from './accesosRapidos';
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

/**
 * Icono por término de acceso rápido (la lista de términos por cuerpo vive en `accesosRapidos.ts`,
 * pura y testeable). Refuerza el término con un icono; si falta, cae a la lupa genérica.
 */
const ACCESO_ICON: Record<string, ComponentType<LucideProps>> = {
  'Sin seguro': ShieldOff,
  Móvil: Smartphone,
  'Faro roto': Lightbulb,
  Alcoholemia: Wine,
  'Sin ITV': CalendarX,
  'Semáforo rojo': TrafficCone,
  'Zona azul': CircleParking,
  Patinete: Bike,
  Desobediencia: Hand,
  'Drogas en vía pública': Pill,
  Hurto: ShoppingBag,
  Robo: Siren,
  'Leer derechos': ScrollText,
  Identificación: Fingerprint,
  Tacógrafo: Gauge,
  Extranjería: Globe,
  // Seguridad ciudadana (autonómica sin contenido) y ocio (autonómica con contenido).
  'Falta de respeto': Hand,
  'Armas prohibidas': ShieldOff,
  'Ocio nocturno': Wine,
  'Alcohol a menores': Wine,
  'Exceso de aforo': Siren,
  Ruidos: Bell,
  'Sin licencia': CalendarX,
};

const TOP_FAVORITAS = 3;
/** Cuántos términos recientes se muestran junto a "Repetir última". */
const TOP_RECIENTES = 3;

export function HomeInicio({ onQuickSearch, onAbrirFicha, paddingBottom }: HomeInicioProps) {
  const t = useAppTheme();
  const router = useRouter();

  // Los accesos rápidos se adaptan al cuerpo del perfil (tráfico vs seguridad ciudadana/penal).
  const cuerpo = useSettingsStore((s) => s.cuerpo);
  const ccaaId = useSettingsStore((s) => s.ccaaId);

  // ¿La CCAA del perfil trae normativa autonómica cargada? Decide los accesos de una AUTONÓMICA:
  // ocio/actividades clasificadas si hay contenido; si no, seguridad ciudadana (nunca tráfico).
  const [tieneContenidoAutonomico, setTieneContenidoAutonomico] = useState(false);
  useEffect(() => {
    if (cuerpo !== 'policia_autonomica' || !ccaaId) {
      setTieneContenidoAutonomico(false);
      return;
    }
    let vivo = true;
    (async () => {
      const runner = await getContentRunner();
      if (!vivo || !runner) return;
      const ccaas = await listarCcaaConContenido(runner);
      if (vivo) setTieneContenidoAutonomico(ccaas.includes(ccaaId));
    })();
    return () => {
      vivo = false;
    };
  }, [cuerpo, ccaaId]);

  const favoritos = useFavoritosStore((s) => s.favoritos);
  const cargarFavoritos = useFavoritosStore((s) => s.cargar);
  const masUsadas = useInicioStore((s) => s.masUsadas);
  const novedadesNuevas = useInicioStore((s) => s.novedadesNuevas);
  const totalNovedades = useInicioStore((s) => s.novedades.length);
  const cargarInicio = useInicioStore((s) => s.cargar);

  const cuadrante = useCuadranteStore((s) => s.cuadrante);
  const cuadranteLoaded = useCuadranteStore((s) => s.loaded);
  const cargarCuadrante = useCuadranteStore((s) => s.load);

  const recientes = useRecientesStore((s) => s.recientes);
  const cargarRecientes = useRecientesStore((s) => s.cargar);

  // Al enfocar Inicio, refrescar lo local (favoritos y contadores cambian mientras se usa la app).
  useFocusEffect(
    useCallback(() => {
      void cargarFavoritos();
      void cargarInicio();
      void cargarRecientes();
      if (!cuadranteLoaded) void cargarCuadrante();
    }, [cargarFavoritos, cargarInicio, cargarRecientes, cuadranteLoaded, cargarCuadrante]),
  );

  // Cada acceso rápido actúa según su DESTINO: `buscar` teclea en el buscador; `ruta` abre una
  // pantalla directa (p. ej. "Leer derechos" → /derechos). Así ningún acceso de cabecera intenta
  // una búsqueda que devolvería "nada exacto".
  const irAAcceso = useCallback(
    (destino: AccesoDestino) => {
      hapticSelection();
      if (destino.tipo === 'ruta') router.push(destino.valor);
      else onQuickSearch(destino.valor);
    },
    [router, onQuickSearch],
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
      <AccesosRapidos
        t={t}
        cuerpo={cuerpo}
        tieneContenidoAutonomico={tieneContenidoAutonomico}
        onAcceso={irAAcceso}
      />

      {recientes.length > 0 ? (
        <Recientes t={t} recientes={recientes} onQuickSearch={onQuickSearch} />
      ) : null}

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

function AccesosRapidos({
  t,
  cuerpo,
  tieneContenidoAutonomico,
  onAcceso,
}: {
  t: Theme;
  cuerpo: Cuerpo | null;
  tieneContenidoAutonomico: boolean;
  onAcceso: (destino: AccesoDestino) => void;
}) {
  const accesos = accesosRapidosPara(cuerpo, tieneContenidoAutonomico);
  return (
    <View style={{ gap: t.spacing.sm }}>
      <TituloSeccion t={t} titulo="Accesos rápidos" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm }}>
        {accesos.map((acceso) => {
          const Icon = ACCESO_ICON[acceso.label] ?? Search;
          const esRuta = acceso.destino.tipo === 'ruta';
          return (
          <PressableScale
            key={acceso.label}
            accessibilityRole="button"
            accessibilityLabel={esRuta ? acceso.label : `Buscar ${acceso.label}`}
            onPress={() => onAcceso(acceso.destino)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: t.spacing.xs,
              minHeight: t.touch.min,
              justifyContent: 'center',
              borderRadius: t.radius.pill,
              borderWidth: 1,
              borderColor: t.color.border,
              backgroundColor: t.color.surfaceAlt,
              paddingHorizontal: t.spacing.base,
            }}
          >
            <Icon size={16} color={t.color.textSecondary} strokeWidth={2} />
            <Text style={{ color: t.color.textPrimary, ...t.typography.scale.label }}>
              {acceso.label}
            </Text>
          </PressableScale>
          );
        })}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Recientes (§6.1: "Repetir última / Recientes")
// ---------------------------------------------------------------------------

function Recientes({
  t,
  recientes,
  onQuickSearch,
}: {
  t: Theme;
  recientes: string[];
  onQuickSearch: (term: string) => void;
}) {
  const ultima = recientes[0];
  if (!ultima) return null;
  // Junto a "Repetir última" mostramos los siguientes términos (sin repetir el primero).
  const resto = recientes.slice(1, 1 + TOP_RECIENTES);
  return (
    <View style={{ gap: t.spacing.sm }}>
      <TituloSeccion t={t} titulo="Recientes" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm }}>
        <PressableScale
          accessibilityLabel={`Repetir última búsqueda: ${ultima}`}
          onPress={() => {
            hapticSelection();
            onQuickSearch(ultima);
          }}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: t.spacing.xs,
            minHeight: t.touch.min,
            justifyContent: 'center',
            borderRadius: t.radius.pill,
            borderWidth: 1,
            borderColor: t.color.accent,
            backgroundColor: t.color.accentWeak,
            paddingHorizontal: t.spacing.base,
          }}
        >
          <RotateCcw size={16} color={t.color.accent} strokeWidth={2.2} />
          <Text style={{ color: t.color.accent, ...t.typography.scale.label }}>
            Repetir última
          </Text>
        </PressableScale>
        {resto.map((termino) => (
          <PressableScale
            key={termino}
            accessibilityLabel={`Buscar ${termino}`}
            onPress={() => {
              hapticSelection();
              onQuickSearch(termino);
            }}
            style={{
              minHeight: t.touch.min,
              justifyContent: 'center',
              borderRadius: t.radius.pill,
              borderWidth: 1,
              borderColor: t.color.border,
              backgroundColor: t.color.surface,
              paddingHorizontal: t.spacing.base,
            }}
          >
            <Text numberOfLines={1} style={{ color: t.color.textPrimary, ...t.typography.scale.label }}>
              {termino}
            </Text>
          </PressableScale>
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
      <PressableScale accessibilityLabel="Configurar tu cuadrante" onPress={onConfigurar}>
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
      </PressableScale>
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
    <PressableScale
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
    </PressableScale>
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
