import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {
  diaSemanaLunes0,
  indicePatron,
  inicioCicloDesdeOffset,
  offsetsCompatibles,
  PATRONES_PREDEFINIDOS,
  proyectarMes,
  resumenHorasMes,
  sumarDias,
  turnosDelPatron,
  type Cuadrante,
  type DiaProyectado,
  type FranjaNocturna,
  type PatronTurno,
  type TipoServicio,
} from '@agente/shared';
import type { ComponentType } from 'react';
import { ChevronLeft, ChevronRight, type LucideProps } from 'lucide-react-native';
import { useAppTheme } from '@/ui/useAppTheme';
import { motion, type Theme } from '@/ui/theme';
import { useReduceMotion } from '@/ui/motion';
import { useSettingsStore } from '@/store/settings';
import { Badge } from '@/ui/components/Badge';
import { Banner } from '@/ui/components/Banner';
import { Button } from '@/ui/components/Button';
import { Card } from '@/ui/components/Card';
import { hapticSelection, hapticSuccess, hapticWarning } from '@/ui/haptics';
import {
  colorServicio,
  DIAS_SEMANA_ABREV,
  MESES,
  SERVICIO_ABREV,
  SERVICIO_LABEL,
  SERVICIOS_ORDEN,
} from './servicioVisual';
import { esHoy, hoyISO } from './fechas';
import { useCuadranteStore } from './store';

/**
 * Pantalla del CUADRANTE (sección 4.9). Es un pilar de RETENCIÓN: la competencia (SPPLB)
 * la tiene rota porque pierde datos y mezcla patrón con ediciones. Aquí el modelo es de
 * dos capas y las ediciones manuales son SAGRADAS (ver `store.ts` y `@agente/shared`).
 *
 * Todo offline, local-first y compatible con Expo Go: rejilla propia (sin calendarios
 * nativos) y edición en un `Modal` de React Native. El resumen de horas va SIEMPRE arriba.
 */
export function CuadranteScreen() {
  const t = useAppTheme();
  const insets = useSafeAreaInsets();
  const cuadrante = useCuadranteStore((s) => s.cuadrante);
  const loaded = useCuadranteStore((s) => s.loaded);
  const load = useCuadranteStore((s) => s.load);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <View style={{ flex: 1, backgroundColor: t.color.bg, paddingTop: insets.top }}>
      {!loaded ? (
        <Cargando t={t} />
      ) : cuadrante ? (
        <VistaMes t={t} cuadrante={cuadrante} insets={insets} />
      ) : (
        <Onboarding t={t} insets={insets} />
      )}
    </View>
  );
}

function Cargando({ t }: { t: Theme }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: t.color.textSecondary, ...t.typography.scale.body }}>
        Cargando tu cuadrante…
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Arranque (rediseño v3): elegir patrón + "¿qué haces HOY? ¿y mañana? ¿y pasado?" hasta que
// el ciclo se ANCLA a esos días seguidos. Nada de "primer día del ciclo", de escribir fechas
// ni de elegir "1.ª/2.ª mañana" (docs/diseno/cuadrante-rediseno.md §2).
// ---------------------------------------------------------------------------

/** Nombres completos de día de semana (lunes = 0, convención del cuadrante). */
const DIAS_SEMANA_LARGO = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'] as const;

/** Número de día del mes de una fecha civil YYYY-MM-DD. */
function numeroDia(fecha: string): number {
  return Number(fecha.slice(8, 10));
}

/**
 * Etiqueta de la fila del día `i` (0 = fechaBase). Si la base es HOY: "Hoy", "Mañana",
 * "Pasado" y, del 4.º en adelante, "{díaSem} {díaMes}". Si el agente arrancó por otro día,
 * no mentimos con "Hoy": todas las filas van con "{díaSem} {díaMes}".
 */
function etiquetaDia(fechaBase: string, i: number, baseEsHoy: boolean): string {
  const fecha = sumarDias(fechaBase, i);
  const dow = DIAS_SEMANA_LARGO[diaSemanaLunes0(fecha)];
  const num = numeroDia(fecha);
  if (baseEsHoy) {
    if (i === 0) return `Hoy · ${dow} ${num}`;
    if (i === 1) return `Mañana · ${dow} ${num}`;
    if (i === 2) return `Pasado · ${dow} ${num}`;
  }
  return `${dow} ${num}`;
}

/** Nombre del día que se va a pedir a continuación (índice `i` desde fechaBase). */
function nombreSiguienteDia(fechaBase: string, i: number, baseEsHoy: boolean): string {
  if (baseEsHoy && i === 1) return 'mañana';
  if (baseEsHoy && i === 2) return 'pasado';
  return `el ${DIAS_SEMANA_LARGO[diaSemanaLunes0(sumarDias(fechaBase, i))]}`;
}

/** Índice del patrón por defecto según el cuerpo del perfil (o 0 si no hay coincidencia). */
function patronPorDefecto(cuerpo: ReturnType<typeof useSettingsStore.getState>['cuerpo']): number {
  if (!cuerpo) return 0;
  const idx = PATRONES_PREDEFINIDOS.findIndex((p) => p.cuerpo === cuerpo);
  return idx >= 0 ? idx : 0;
}

/** Una celda del preview de la semana (color + letra), ya resuelta desde los días dichos. */
interface CeldaPreview {
  fecha: string;
  servicio: TipoServicio | null;
  confirmado: boolean;
  provisional: boolean;
  esAncla: boolean;
}

function Onboarding({ t, insets }: { t: Theme; insets: { bottom: number } }) {
  const crear = useCuadranteStore((s) => s.crear);
  const cuerpo = useSettingsStore((s) => s.cuerpo);

  const [patronIdx, setPatronIdx] = useState(() => patronPorDefecto(cuerpo));
  // `turnos` = lo que el agente dice hacer en días SEGUIDOS desde `fechaBase` (hoy, mañana…).
  const [turnos, setTurnos] = useState<TipoServicio[]>([]);
  const [fechaBase, setFechaBase] = useState(hoyISO());
  const [avisoExcepcion, setAvisoExcepcion] = useState(false);
  const [ajustesAbiertos, setAjustesAbiertos] = useState(false);
  const [jornada, setJornada] = useState('37.5');
  const [franjaInicio, setFranjaInicio] = useState('22:00');
  const [franjaFin, setFranjaFin] = useState('06:00');
  const [creando, setCreando] = useState(false);

  const patron = PATRONES_PREDEFINIDOS[patronIdx] as PatronTurno;
  const turnosPatron = useMemo(() => turnosDelPatron(patron), [patron]);
  const baseEsHoy = fechaBase === hoyISO();

  // El motor de todo el flujo: cuántas posiciones del ciclo siguen encajando con lo dicho.
  const compatibles = useMemo(
    () => offsetsCompatibles(patron, fechaBase, turnos),
    [patron, fechaBase, turnos],
  );
  const cuadra = compatibles.length === 1;
  const ambiguo = compatibles.length > 1;
  const noEncaja = turnos.length > 0 && compatibles.length === 0;

  const jornadaNum = Number(jornada.replace(',', '.'));
  const jornadaOk = Number.isFinite(jornadaNum) && jornadaNum > 0;

  // Nº de filas de día: las contestadas + la activa mientras siga habiendo ambigüedad (>1).
  // Con 0 turnos, `ambiguo` es cierto (encajan todos los desfases) → se muestra solo "Hoy".
  const filasDia = turnos.length + (ambiguo ? 1 : 0);

  // Vista previa de la semana que contiene `fechaBase`. Los días dichos van CONFIRMADOS; el
  // resto se proyecta desde el primer desfase compatible (PROVISIONAL) hasta que cuadre.
  const previewSemana = useMemo<CeldaPreview[] | null>(() => {
    if (turnos.length === 0) return null;
    const offset = compatibles[0];
    const { secuencia } = patron;
    const L = secuencia.length;
    const dowBase = diaSemanaLunes0(fechaBase); // 0 = lunes
    const lunes = sumarDias(fechaBase, -dowBase);
    const celdas: CeldaPreview[] = [];
    for (let i = 0; i < 7; i++) {
      const fecha = sumarDias(lunes, i);
      const iRel = i - dowBase; // posición del día respecto a fechaBase (negativa antes del ancla)
      const confirmado = iRel >= 0 && iRel < turnos.length;
      let servicio: TipoServicio | null = null;
      if (confirmado) servicio = turnos[iRel] ?? null;
      else if (offset !== undefined) {
        const inicio = inicioCicloDesdeOffset(fechaBase, offset);
        servicio = secuencia[indicePatron(inicio, fecha, L)] ?? null;
      }
      celdas.push({ fecha, servicio, confirmado, provisional: !confirmado && ambiguo, esAncla: fecha === fechaBase });
    }
    return celdas;
  }, [patron, fechaBase, turnos, compatibles, ambiguo]);

  const puedeCrear = cuadra && !creando;

  function reiniciarDias() {
    setTurnos([]);
    setAvisoExcepcion(false);
  }

  function elegirPatron(i: number) {
    hapticSelection();
    setPatronIdx(i);
    reiniciarDias(); // los botones (turnos del patrón) cambian: la secuencia dicha se reinicia.
  }

  function responderDia(indice: number, servicio: TipoServicio) {
    hapticSelection();
    setAvisoExcepcion(false);
    // Re-contestar un día trunca los posteriores (la secuencia debe ser consecutiva).
    setTurnos((prev) => {
      const siguiente = [...prev.slice(0, indice), servicio];
      // Aviso háptico si con este día deja de encajar (caso 0): es un estado de conversación.
      if (offsetsCompatibles(patron, fechaBase, siguiente).length === 0) hapticWarning();
      return siguiente;
    });
  }

  function corregirUltimoDia() {
    hapticSelection();
    setAvisoExcepcion(false);
    setTurnos((prev) => prev.slice(0, -1));
  }

  function marcarExcepcion() {
    hapticSelection();
    // Ese día no cuenta para deducir el ciclo (se podrá marcar como excepción en el mes).
    setTurnos((prev) => prev.slice(0, -1));
    setAvisoExcepcion(true);
  }

  function moverDia(delta: number) {
    hapticSelection();
    setFechaBase((f) => sumarDias(f, delta));
    reiniciarDias();
  }

  function volverAHoy() {
    hapticSelection();
    setFechaBase(hoyISO());
    reiniciarDias();
  }

  async function onCrear() {
    if (!puedeCrear) return;
    setCreando(true);
    try {
      const franjaOk = RE_HORA.test(franjaInicio) && RE_HORA.test(franjaFin);
      await crear({
        patron,
        ancla: { fechaBase, turnos },
        ...(jornadaOk ? { jornadaRefHorasSemana: jornadaNum } : {}),
        ...(ajustesAbiertos && franjaOk ? { franjaNocturna: { inicio: franjaInicio, fin: franjaFin } } : {}),
      });
      hapticSuccess();
    } catch {
      Alert.alert('No se pudo crear', 'Vuelve a intentarlo.');
      setCreando(false);
    }
  }

  return (
    <ScrollView
      contentContainerStyle={{
        paddingHorizontal: t.spacing.base,
        paddingBottom: insets.bottom + t.spacing.xxl,
        gap: t.spacing.lg,
      }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={{ gap: t.spacing.xs, marginTop: t.spacing.base }}>
        <Text accessibilityRole="header" style={{ color: t.color.textPrimary, ...t.typography.scale.titleXL }}>
          Tu cuadrante
        </Text>
        <Text style={{ color: t.color.textSecondary, ...t.typography.scale.body }}>
          Dime qué haces estos días y lo cuadro yo solo.
        </Text>
      </View>

      <Banner tone="success" title="No se pierde">
        Funciona sin cobertura y sobrevive a las actualizaciones. Tus ediciones a mano mandan
        sobre el patrón.
      </Banner>

      {/* ① Patrón, con mini-tira del ciclo pintada */}
      <View style={{ gap: t.spacing.sm }}>
        <Text style={{ color: t.color.textPrimary, ...t.typography.scale.label }}>¿Qué turnos haces?</Text>
        {PATRONES_PREDEFINIDOS.map((p, i) => {
          const activo = i === patronIdx;
          return (
            <Pressable
              key={p.nombre}
              accessibilityRole="button"
              accessibilityState={{ selected: activo }}
              accessibilityLabel={`${p.nombre}. Ciclo de ${p.secuencia.length} días`}
              onPress={() => elegirPatron(i)}
              style={{
                minHeight: t.touch.min,
                borderRadius: t.radius.md,
                borderWidth: activo ? 2 : 1,
                borderColor: activo ? t.color.accent : t.color.border,
                backgroundColor: activo ? t.color.accentWeak : t.color.surface,
                padding: t.spacing.md,
                gap: t.spacing.sm,
              }}
            >
              <Text style={{ color: t.color.textPrimary, ...t.typography.scale.bodyStrong }}>
                {p.nombre}
              </Text>
              <Text style={{ color: t.color.textSecondary, ...t.typography.scale.caption }}>
                Ciclo de {p.secuencia.length} días · punto de partida editable
              </Text>
              {activo ? <MiniTira t={t} secuencia={p.secuencia} /> : null}
            </Pressable>
          );
        })}
        <Text style={{ color: t.color.textTertiary, ...t.typography.scale.caption }}>
          Es un punto de partida: luego ajustas los días sueltos que no encajen.
        </Text>
      </View>

      {/* ② ¿Qué haces estos días? — filas que se revelan una a una, empezando por hoy */}
      <View style={{ gap: t.spacing.sm }}>
        <Text style={{ color: t.color.textPrimary, ...t.typography.scale.label }}>
          ¿Qué haces estos días?
        </Text>
        {Array.from({ length: filasDia }).map((_, i) => {
          const activa = i === turnos.length && !cuadra;
          const contestado = i < turnos.length;
          return (
            <FilaDia
              key={`${fechaBase}-${i}`}
              t={t}
              etiqueta={etiquetaDia(fechaBase, i, baseEsHoy)}
              turnosPatron={turnosPatron}
              seleccionado={contestado ? (turnos[i] ?? null) : null}
              activa={activa}
              onElegir={(s) => responderDia(i, s)}
            />
          );
        })}

        {/* Estado honesto: contador de posiciones (>1), "ya cuadra" (1) o aviso "no encaja" (0). */}
        {ambiguo && turnos.length > 0 ? (
          <Banner tone="info">
            Encajan {compatibles.length} posiciones del ciclo · dime qué haces{' '}
            {nombreSiguienteDia(fechaBase, turnos.length, baseEsHoy)} para afinar.
          </Banner>
        ) : null}
        {cuadra ? <Banner tone="success">✓ Ya cuadra con tu turno.</Banner> : null}
        {noEncaja ? (
          <View style={{ gap: t.spacing.sm }}>
            <Banner tone="warning">
              Esto no encaja con este patrón. ¿Seguro que es tu patrón? ¿O ese día fue una
              excepción (un cambio con un compañero, un refuerzo…)?
            </Banner>
            <View style={{ flexDirection: 'row', gap: t.spacing.sm, flexWrap: 'wrap' }}>
              <Button title="Corregir el último día" variant="secondary" onPress={corregirUltimoDia} />
              <Button title="Ese día fue una excepción" variant="secondary" onPress={marcarExcepcion} />
            </View>
          </View>
        ) : null}
        {avisoExcepcion ? (
          <Text style={{ color: t.color.textSecondary, ...t.typography.scale.caption }}>
            Ese día no cuenta para deducir el ciclo. Podrás marcarlo como excepción en el mes.
            Sigue diciéndome qué haces el día siguiente.
          </Text>
        ) : null}

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm, flexWrap: 'wrap' }}>
          <Text style={{ color: t.color.textSecondary, ...t.typography.scale.caption }}>
            ¿Hoy libras o es un día raro?
          </Text>
          <SelectorDia t={t} fecha={fechaBase} esHoy={baseEsHoy} onMover={moverDia} onHoy={volverAHoy} />
        </View>
      </View>

      {/* Vista previa en vivo de la semana */}
      {previewSemana ? (
        <View style={{ gap: t.spacing.sm }}>
          <Text style={{ color: t.color.textSecondary, ...t.typography.scale.caption, fontWeight: '700' }}>
            VISTA PREVIA · ESTA SEMANA{ambiguo ? ' (estimado hasta que cuadre)' : ''}
          </Text>
          <PreviewSemana t={t} celdas={previewSemana} firma={`${patronIdx}-${fechaBase}-${turnos.join(',')}`} />
        </View>
      ) : null}

      {/* Ajustes finos (acordeón): no bloquean el alta */}
      <View style={{ gap: t.spacing.sm }}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: ajustesAbiertos }}
          accessibilityLabel="Ajustes finos: jornada y franja nocturna"
          onPress={() => { hapticSelection(); setAjustesAbiertos((v) => !v); }}
          style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.xs, minHeight: t.touch.min }}
        >
          <ChevronRight
            size={20}
            color={t.color.textSecondary}
            strokeWidth={2.2}
            style={{ transform: [{ rotate: ajustesAbiertos ? '90deg' : '0deg' }] }}
          />
          <Text style={{ color: t.color.textPrimary, ...t.typography.scale.label }}>
            Ajustes finos (jornada, franja nocturna)
          </Text>
        </Pressable>

        {ajustesAbiertos ? (
          <View style={{ gap: t.spacing.md, paddingLeft: t.spacing.lg }}>
            <View style={{ gap: t.spacing.xs }}>
              <Text style={{ color: t.color.textPrimary, ...t.typography.scale.label }}>
                Jornada de referencia (h/semana)
              </Text>
              <TextInput
                accessibilityLabel="Jornada de referencia en horas por semana"
                value={jornada}
                onChangeText={setJornada}
                keyboardType="decimal-pad"
                placeholder="37.5"
                placeholderTextColor={t.color.textTertiary}
                style={campoStyle(t, jornadaOk)}
              />
              <Text style={{ color: t.color.textTertiary, ...t.typography.scale.caption }}>
                El exceso se calcula sobre esta cifra. No todos los cuerpos son 37,5 h.
              </Text>
            </View>
            <View style={{ gap: t.spacing.xs }}>
              <Text style={{ color: t.color.textPrimary, ...t.typography.scale.label }}>Franja nocturna</Text>
              <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
                <TextInput
                  accessibilityLabel="Inicio de la franja nocturna, formato HH:MM"
                  value={franjaInicio}
                  onChangeText={setFranjaInicio}
                  placeholder="22:00"
                  placeholderTextColor={t.color.textTertiary}
                  style={[campoStyle(t, RE_HORA.test(franjaInicio)), { flex: 1 }]}
                />
                <TextInput
                  accessibilityLabel="Fin de la franja nocturna, formato HH:MM"
                  value={franjaFin}
                  onChangeText={setFranjaFin}
                  placeholder="06:00"
                  placeholderTextColor={t.color.textTertiary}
                  style={[campoStyle(t, RE_HORA.test(franjaFin)), { flex: 1 }]}
                />
              </View>
            </View>
          </View>
        ) : null}
      </View>

      <Button title="Empezar a usarlo" onPress={onCrear} disabled={!puedeCrear} />
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Piezas del arranque: mini-tira del ciclo, fila de día, botón de turno, selector, preview
// ---------------------------------------------------------------------------

/**
 * Fila de un día del arranque: etiqueta ("Hoy · lun 7"), y los turnos del patrón como botones
 * grandes (≥56 dp, color + letra + nombre). La fila ACTIVA (la primera sin contestar) se resalta
 * con el acento; las ya contestadas muestran el turno elegido marcado.
 */
function FilaDia({
  t,
  etiqueta,
  turnosPatron,
  seleccionado,
  activa,
  onElegir,
}: {
  t: Theme;
  etiqueta: string;
  turnosPatron: readonly TipoServicio[];
  seleccionado: TipoServicio | null;
  activa: boolean;
  onElegir: (servicio: TipoServicio) => void;
}) {
  return (
    <View
      style={{
        borderRadius: t.radius.md,
        borderWidth: activa ? 2 : 1,
        borderColor: activa ? t.color.accent : t.color.border,
        backgroundColor: activa ? t.color.accentWeak : t.color.surface,
        padding: t.spacing.md,
        gap: t.spacing.sm,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm }}>
        <Text style={{ color: t.color.textPrimary, ...t.typography.scale.bodyStrong }}>{etiqueta}</Text>
        {seleccionado ? (
          <View style={{ marginLeft: 'auto' }}>
            <Badge label={SERVICIO_LABEL[seleccionado]} tone="info" />
          </View>
        ) : null}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm }}>
        {turnosPatron.map((s) => (
          <BotonTurno key={s} t={t} servicio={s} activo={s === seleccionado} onPress={() => onElegir(s)} />
        ))}
      </View>
    </View>
  );
}

/** Mini-tira del ciclo: una celda por posición de la secuencia (color + letra). */
function MiniTira({ t, secuencia }: { t: Theme; secuencia: readonly TipoServicio[] }) {
  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={`Ciclo: ${secuencia.map((s) => SERVICIO_LABEL[s]).join(', ')}`}
      style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.xxs }}
    >
      {secuencia.map((s, i) => {
        const c = colorServicio(t, s);
        return (
          <View
            key={`${s}-${i}`}
            style={{
              width: 22,
              height: 22,
              borderRadius: t.radius.sm,
              backgroundColor: c.bg,
              borderWidth: 1,
              borderColor: t.color.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: c.fg, fontSize: 11, fontWeight: '700' }}>{SERVICIO_ABREV[s]}</Text>
          </View>
        );
      })}
    </View>
  );
}

/** Botón grande de turno (≥56 dp) con color + letra + nombre. */
function BotonTurno({
  t,
  servicio,
  activo,
  onPress,
}: {
  t: Theme;
  servicio: TipoServicio;
  activo: boolean;
  onPress: () => void;
}) {
  const c = colorServicio(t, servicio);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: activo }}
      accessibilityLabel={SERVICIO_LABEL[servicio]}
      onPress={onPress}
      style={{
        minWidth: 84,
        minHeight: 56,
        flexGrow: 1,
        borderRadius: t.radius.md,
        borderWidth: activo ? 2 : 1,
        borderColor: activo ? t.color.accent : t.color.border,
        backgroundColor: activo ? t.color.accentWeak : t.color.surface,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        paddingHorizontal: t.spacing.sm,
        paddingVertical: t.spacing.sm,
      }}
    >
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: t.radius.sm,
          backgroundColor: c.bg,
          borderWidth: 1,
          borderColor: t.color.border,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: c.fg, fontSize: 13, fontWeight: '700' }}>{SERVICIO_ABREV[servicio]}</Text>
      </View>
      <Text
        style={{
          color: activo ? t.color.accent : t.color.textSecondary,
          ...t.typography.scale.caption,
          fontWeight: activo ? '700' : '600',
        }}
      >
        {SERVICIO_LABEL[servicio]}
      </Text>
    </Pressable>
  );
}

/** Selector compacto de día alternativo (‹ / ›), por debajo del camino principal. */
function SelectorDia({
  t,
  fecha,
  esHoy,
  onMover,
  onHoy,
}: {
  t: Theme;
  fecha: string;
  esHoy: boolean;
  onMover: (delta: number) => void;
  onHoy: () => void;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.xs }}>
      <FlechaMes t={t} etiqueta="Día anterior" Icono={ChevronLeft} onPress={() => onMover(-1)} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Día del ancla: ${fecha}. Tocar para volver a hoy`}
        onPress={onHoy}
        style={{
          minHeight: t.touch.min,
          justifyContent: 'center',
          paddingHorizontal: t.spacing.sm,
          borderRadius: t.radius.md,
          borderWidth: 1,
          borderColor: esHoy ? t.color.border : t.color.accent,
          backgroundColor: esHoy ? t.color.surface : t.color.accentWeak,
        }}
      >
        <Text style={{ color: t.color.textPrimary, ...t.typography.scale.caption, fontWeight: '600' }}>
          {DIAS_SEMANA_LARGO[diaSemanaLunes0(fecha)]} {numeroDia(fecha)}
        </Text>
      </Pressable>
      <FlechaMes t={t} etiqueta="Día siguiente" Icono={ChevronRight} onPress={() => onMover(1)} />
    </View>
  );
}

/**
 * Vista previa de la semana (L–D) con el día del ancla resaltado. Los días que el agente ya
 * ha dicho van CONFIRMADOS (tilde); el resto se proyecta PROVISIONAL (atenuado) mientras el
 * ciclo sigue siendo ambiguo. Re-pinta con transición ≤240 ms (respeta reduce-motion).
 */
function PreviewSemana({ t, celdas, firma }: { t: Theme; celdas: CeldaPreview[]; firma: string }) {
  const reduce = useReduceMotion();
  const progreso = useSharedValue(1);

  useEffect(() => {
    if (reduce) {
      progreso.value = 1;
      return;
    }
    progreso.value = 0;
    progreso.value = withTiming(1, { duration: motion.durBase });
  }, [firma, reduce, progreso]);

  const estilo = useAnimatedStyle(() => ({
    opacity: reduce ? 1 : progreso.value,
    transform: [{ translateY: reduce ? 0 : (1 - progreso.value) * 8 }],
  }));

  return (
    <Animated.View style={estilo}>
      <View style={{ flexDirection: 'row', gap: t.spacing.xxs, marginBottom: t.spacing.xxs }}>
        {DIAS_SEMANA_ABREV.map((d, i) => (
          <View key={`${d}-${i}`} style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ color: t.color.textTertiary, ...t.typography.scale.caption, fontWeight: '700' }}>
              {d}
            </Text>
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: t.spacing.xxs }}>
        {celdas.map((celda) => {
          const c = celda.servicio ? colorServicio(t, celda.servicio) : null;
          const estado = celda.confirmado ? ', confirmado' : celda.provisional ? ', estimado' : '';
          return (
            <View
              key={celda.fecha}
              accessibilityLabel={`${numeroDia(celda.fecha)}${
                celda.servicio ? ` ${SERVICIO_LABEL[celda.servicio]}` : ''
              }${celda.esAncla ? ', día de referencia' : ''}${estado}`}
              style={{
                flex: 1,
                aspectRatio: 0.82,
                borderRadius: t.radius.sm,
                borderWidth: celda.esAncla ? 2 : 1,
                borderColor: celda.esAncla ? t.color.accent : t.color.border,
                backgroundColor: c ? c.bg : t.color.surface,
                opacity: celda.provisional ? 0.5 : 1,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
              }}
            >
              <Text style={{ color: t.color.textSecondary, fontSize: 11, fontVariant: ['tabular-nums'] }}>
                {numeroDia(celda.fecha)}
              </Text>
              <Text style={{ color: c ? c.fg : t.color.textTertiary, fontSize: 15, fontWeight: '700' }}>
                {celda.servicio ? SERVICIO_ABREV[celda.servicio] : '·'}
              </Text>
              <Text style={{ color: t.color.success, fontSize: 9, fontWeight: '800', minHeight: 11 }}>
                {celda.confirmado ? '✓' : ''}
              </Text>
            </View>
          );
        })}
      </View>
    </Animated.View>
  );
}

function campoStyle(t: Theme, ok: boolean) {
  return {
    minHeight: t.touch.primaryHeight,
    borderRadius: t.radius.md,
    borderWidth: 1,
    borderColor: ok ? t.color.border : t.color.danger,
    backgroundColor: t.color.surface,
    color: t.color.textPrimary,
    paddingHorizontal: t.spacing.md,
    ...t.typography.scale.body,
  };
}

// ---------------------------------------------------------------------------
// Vista de mes: resumen (arriba) + navegación + rejilla
// ---------------------------------------------------------------------------

function VistaMes({
  t,
  cuadrante,
  insets,
}: {
  t: Theme;
  cuadrante: Cuadrante;
  insets: { bottom: number };
}) {
  const hoy = new Date();
  // Un único cursor {anio, mes} para poder avanzar/retroceder de forma atómica (swipe/flechas).
  const [cursor, setCursor] = useState({ anio: hoy.getFullYear(), mes: hoy.getMonth() + 1 });
  const { anio, mes } = cursor;
  const [diaEditando, setDiaEditando] = useState<DiaProyectado | null>(null);
  const reduce = useReduceMotion();
  const progreso = useSharedValue(1);

  const dias = useMemo(() => proyectarMes(cuadrante, anio, mes), [cuadrante, anio, mes]);
  const resumen = useMemo(() => resumenHorasMes(cuadrante, anio, mes), [cuadrante, anio, mes]);

  // HOY, para "de un vistazo": solo tiene sentido cuando el mes visible es el actual. Se
  // deriva de los días proyectados (así el turno de hoy respeta las excepciones manuales).
  const hoyStr = hoyISO();
  const esMesActual = anio === hoy.getFullYear() && mes === hoy.getMonth() + 1;
  const diaDeHoy = esMesActual ? dias.find((d) => esHoy(d.fecha, hoyStr)) : undefined;

  const primerDia = dias[0];
  const blancosIniciales = primerDia ? diaSemanaLunes0(primerDia.fecha) : 0;

  const irMes = useCallback((delta: number) => {
    setCursor((c) => {
      let m = c.mes + delta;
      let a = c.anio;
      if (m < 1) {
        m = 12;
        a -= 1;
      } else if (m > 12) {
        m = 1;
        a += 1;
      }
      return { anio: a, mes: m };
    });
  }, []);

  // Deslizar entre meses (gesto grande, apto para guantes): se activa solo con intención
  // HORIZONTAL (`activeOffsetX`) para no pelear con el scroll vertical de la lista.
  const cambiarMes = useCallback(
    (delta: number) => {
      hapticSelection();
      irMes(delta);
      if (!reduce) {
        progreso.value = 0;
        progreso.value = withTiming(1, { duration: motion.durBase });
      }
    },
    [irMes, reduce, progreso],
  );

  const swipe = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-24, 24])
        .failOffsetY([-16, 16])
        .onEnd((e) => {
          if (e.translationX <= -48) runOnJS(cambiarMes)(1);
          else if (e.translationX >= 48) runOnJS(cambiarMes)(-1);
        }),
    [cambiarMes],
  );

  const estiloMes = useAnimatedStyle(() => ({
    opacity: reduce ? 1 : progreso.value,
  }));

  const ancho = Dimensions.get('window').width;
  const gap = t.spacing.xxs;
  const disponible = ancho - t.spacing.base * 2 - gap * 6;
  const celda = Math.floor(disponible / 7);

  return (
    <>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: t.spacing.base,
          paddingBottom: insets.bottom + t.spacing.xxl,
          gap: t.spacing.md,
        }}
      >
        <ResumenHoras t={t} resumen={resumen} franja={cuadrante.franjaNocturna} />

        {diaDeHoy ? <LineaHoy t={t} servicio={diaDeHoy.servicio} /> : null}

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <FlechaMes t={t} etiqueta="Mes anterior" Icono={ChevronLeft} onPress={() => cambiarMes(-1)} />
          <Text
            accessibilityRole="header"
            accessibilityHint="Desliza a los lados para cambiar de mes"
            style={{ color: t.color.textPrimary, ...t.typography.scale.titleM }}
          >
            {MESES[mes - 1]} {anio}
          </Text>
          <FlechaMes t={t} etiqueta="Mes siguiente" Icono={ChevronRight} onPress={() => cambiarMes(1)} />
        </View>

        <GestureDetector gesture={swipe}>
          <Animated.View style={[{ gap: t.spacing.md }, estiloMes]}>
            <View style={{ flexDirection: 'row', gap }}>
              {DIAS_SEMANA_ABREV.map((d, i) => (
                <View key={`${d}-${i}`} style={{ width: celda, alignItems: 'center' }}>
                  <Text style={{ color: t.color.textTertiary, ...t.typography.scale.caption, fontWeight: '700' }}>
                    {d}
                  </Text>
                </View>
              ))}
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap }}>
              {Array.from({ length: blancosIniciales }).map((_, i) => (
                <View key={`b-${i}`} style={{ width: celda, height: celda }} />
              ))}
              {dias.map((dia) => (
                <CeldaDia
                  key={dia.fecha}
                  t={t}
                  dia={dia}
                  tam={celda}
                  esHoy={esMesActual && esHoy(dia.fecha, hoyStr)}
                  onPress={() => setDiaEditando(dia)}
                />
              ))}
            </View>
          </Animated.View>
        </GestureDetector>

        <Leyenda t={t} />
      </ScrollView>

      {diaEditando ? (
        <EditorDia t={t} dia={diaEditando} onCerrar={() => setDiaEditando(null)} />
      ) : null}
    </>
  );
}

function FlechaMes({
  t,
  etiqueta,
  Icono,
  onPress,
}: {
  t: Theme;
  etiqueta: string;
  Icono: ComponentType<LucideProps>;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      onPress={onPress}
      hitSlop={8}
      style={{
        width: t.touch.min,
        height: t.touch.min,
        borderRadius: t.radius.md,
        borderWidth: 1,
        borderColor: t.color.border,
        backgroundColor: t.color.surface,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icono size={24} color={t.color.accent} strokeWidth={2.2} />
    </Pressable>
  );
}

function ResumenHoras({
  t,
  resumen,
  franja,
}: {
  t: Theme;
  resumen: ReturnType<typeof resumenHorasMes>;
  franja: FranjaNocturna;
}) {
  const signo = resumen.exceso > 0 ? '+' : '';
  const excesoTone = resumen.exceso > 0 ? 'warning' : 'success';
  // Franja nocturna en uso (config del cuadrante; default 22:00–06:00 del esquema). Etiqueta
  // la cifra de nocturnas para que el agente sepa QUÉ tramo se está contando en su nómina.
  const inicio = franja?.inicio ?? '22:00';
  const fin = franja?.fin ?? '06:00';
  return (
    <Card>
      <Text style={{ color: t.color.textSecondary, ...t.typography.scale.caption }}>Este mes</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.lg, marginTop: t.spacing.xxs }}>
        <Cifra t={t} valor={`${resumen.horasTotales} h`} etiqueta="Total" />
        <Cifra
          t={t}
          valor={`${resumen.horasNocturnas} h`}
          etiqueta={`Nocturnas · ${inicio}–${fin}`}
          destacado
        />
        <Cifra t={t} valor={`${resumen.horasFestivas} h`} etiqueta="Festivas" />
        <Cifra t={t} valor={`${resumen.noches}`} etiqueta="Noches" />
      </View>
      <Text style={{ color: t.color.textTertiary, ...t.typography.scale.caption, marginTop: t.spacing.xs }}>
        Nocturnas: horas trabajadas dentro de tu franja nocturna.
      </Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: t.spacing.sm,
          paddingTop: t.spacing.sm,
          borderTopWidth: 1,
          borderTopColor: t.color.border,
        }}
      >
        <Text style={{ color: t.color.textSecondary, ...t.typography.scale.caption }}>
          Exceso sobre {resumen.horasReferencia} h de referencia
        </Text>
        <Badge label={`${signo}${resumen.exceso} h`} tone={excesoTone} />
      </View>
      {resumen.horasDisponibilidad > 0 ? (
        <View
          style={{
            marginTop: t.spacing.sm,
            paddingTop: t.spacing.sm,
            borderTopWidth: 1,
            borderTopColor: t.color.border,
            gap: t.spacing.xxs,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Text style={{ color: t.color.textSecondary, ...t.typography.scale.caption }}>
              Disponibilidad / retén
            </Text>
            <Badge label={`${resumen.horasDisponibilidad} h`} tone="neutral" />
          </View>
          <Text style={{ color: t.color.textTertiary, ...t.typography.scale.caption }}>
            A efectos propios: no cuenta como jornada presencial ni se suma al total.
          </Text>
        </View>
      ) : null}
    </Card>
  );
}

/**
 * Una cifra del resumen. `destacado` da algo más de peso a la métrica (color de acento +
 * etiqueta reforzada): se usa en NOCTURNAS, que es lo que el agente revisa para cobrar. No
 * cambia el cálculo ni la maquetación de las cuatro cifras, solo su presentación.
 */
function Cifra({
  t,
  valor,
  etiqueta,
  destacado = false,
}: {
  t: Theme;
  valor: string;
  etiqueta: string;
  destacado?: boolean;
}) {
  return (
    <View style={{ gap: 2 }}>
      <Text
        style={{
          color: destacado ? t.color.accent : t.color.textPrimary,
          ...t.typography.scale.titleL,
          fontVariant: ['tabular-nums'],
        }}
      >
        {valor}
      </Text>
      <Text
        style={{
          color: destacado ? t.color.accent : t.color.textSecondary,
          ...t.typography.scale.caption,
          fontWeight: destacado ? '700' : '400',
        }}
      >
        {etiqueta}
      </Text>
    </View>
  );
}

/**
 * Badge compacto "Hoy · {turno}" con el color del servicio: responde de un vistazo "¿qué
 * turno tengo hoy?". Solo se pinta cuando el mes visible es el actual (lo decide `VistaMes`).
 */
function LineaHoy({ t, servicio }: { t: Theme; servicio: TipoServicio }) {
  const c = colorServicio(t, servicio);
  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={`Hoy tienes turno de ${SERVICIO_LABEL[servicio]}`}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: t.spacing.sm,
        alignSelf: 'flex-start',
        minHeight: t.touch.min,
        paddingVertical: t.spacing.xs,
        paddingHorizontal: t.spacing.md,
        borderRadius: t.radius.pill,
        borderWidth: 1,
        borderColor: t.color.accent,
        backgroundColor: t.color.accentWeak,
      }}
    >
      <View
        style={{
          width: 26,
          height: 26,
          borderRadius: t.radius.sm,
          backgroundColor: c.bg,
          borderWidth: 1,
          borderColor: t.color.border,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: c.fg, fontSize: 13, fontWeight: '700' }}>{SERVICIO_ABREV[servicio]}</Text>
      </View>
      <Text style={{ color: t.color.textPrimary, ...t.typography.scale.bodyStrong }}>
        Hoy · {SERVICIO_LABEL[servicio]}
      </Text>
    </View>
  );
}

function CeldaDia({
  t,
  dia,
  tam,
  esHoy: hoy,
  onPress,
}: {
  t: Theme;
  dia: DiaProyectado;
  tam: number;
  esHoy: boolean;
  onPress: () => void;
}) {
  const c = colorServicio(t, dia.servicio);
  const numDia = Number(dia.fecha.slice(8, 10));
  const abrev = SERVICIO_ABREV[dia.servicio];
  const a11y = [
    `Día ${numDia}`,
    hoy ? 'hoy' : null,
    SERVICIO_LABEL[dia.servicio],
    dia.esFestivo ? 'festivo' : null,
    dia.origen === 'manual' ? 'editado a mano' : null,
    dia.nota ? 'con nota' : null,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11y}
      accessibilityHint="Toca para editar este día"
      onPress={onPress}
      style={{
        width: tam,
        height: tam,
        borderRadius: t.radius.sm,
        borderWidth: dia.origen === 'manual' ? 2 : 1,
        borderColor: dia.origen === 'manual' ? t.color.brand : t.color.border,
        backgroundColor: c.bg,
        padding: 4,
        justifyContent: 'space-between',
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        {hoy ? (
          // HOY: número en un badge de acento. Es independiente del borde "editado a mano"
          // (color brand), así ambos estados conviven sin pelearse ni romper la rejilla.
          <View
            style={{
              minWidth: 18,
              height: 18,
              paddingHorizontal: 3,
              borderRadius: t.radius.sm,
              backgroundColor: t.color.accent,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                color: t.color.accentOn,
                fontSize: 12,
                fontWeight: '800',
                fontVariant: ['tabular-nums'],
              }}
            >
              {numDia}
            </Text>
          </View>
        ) : (
          <Text
            style={{
              color: dia.esFestivo ? t.color.danger : t.color.textSecondary,
              fontSize: 12,
              fontWeight: dia.esFestivo ? '700' : '400',
              textDecorationLine: dia.esFestivo ? 'underline' : 'none',
              fontVariant: ['tabular-nums'],
            }}
          >
            {numDia}
          </Text>
        )}
        {dia.esFestivo ? (
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: t.color.danger }} />
        ) : null}
      </View>
      <Text style={{ color: c.fg, fontSize: 15, fontWeight: '700', textAlign: 'center' }}>
        {abrev}
      </Text>
      <View style={{ flexDirection: 'row', gap: 3, justifyContent: 'center', minHeight: 6 }}>
        {dia.nota ? (
          <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: t.color.textSecondary }} />
        ) : null}
        {dia.alarmaMinutosAntes != null ? (
          <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: t.color.brand }} />
        ) : null}
      </View>
    </Pressable>
  );
}

function Leyenda({ t }: { t: Theme }) {
  const items: TipoServicio[] = ['manana', 'tarde', 'noche', 'saliente', 'libre'];
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.md, marginTop: t.spacing.xs }}>
      {items.map((s) => {
        const c = colorServicio(t, s);
        return (
          <View key={s} style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.xxs }}>
            <View
              style={{
                width: 18,
                height: 18,
                borderRadius: t.radius.sm,
                backgroundColor: c.bg,
                borderWidth: 1,
                borderColor: t.color.border,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: c.fg, fontSize: 11, fontWeight: '700' }}>{SERVICIO_ABREV[s]}</Text>
            </View>
            <Text style={{ color: t.color.textSecondary, ...t.typography.scale.caption }}>
              {SERVICIO_LABEL[s]}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Editor de un día (excepción manual sagrada), en Modal compatible con Expo Go
// ---------------------------------------------------------------------------

const RE_HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

function EditorDia({ t, dia, onCerrar }: { t: Theme; dia: DiaProyectado; onCerrar: () => void }) {
  const editarDia = useCuadranteStore((s) => s.editarDia);
  const borrarExcepcion = useCuadranteStore((s) => s.borrarExcepcion);
  const alternarFestivo = useCuadranteStore((s) => s.alternarFestivo);

  const [servicio, setServicio] = useState<TipoServicio>(dia.servicio);
  const [horaInicio, setHoraInicio] = useState(dia.horaInicio ?? '');
  const [horaFin, setHoraFin] = useState(dia.horaFin ?? '');
  const [nota, setNota] = useState(dia.nota ?? '');
  const [festivo, setFestivo] = useState(dia.esFestivo);
  const [guardando, setGuardando] = useState(false);

  const horaInicioOk = horaInicio === '' || RE_HORA.test(horaInicio);
  const horaFinOk = horaFin === '' || RE_HORA.test(horaFin);
  const puedeGuardar = horaInicioOk && horaFinOk && !guardando;

  const numDia = Number(dia.fecha.slice(8, 10));

  async function onGuardar() {
    if (!puedeGuardar) return;
    setGuardando(true);
    try {
      if (festivo !== dia.esFestivo) await alternarFestivo(dia.fecha);
      await editarDia({
        fecha: dia.fecha,
        servicio,
        horaInicio: horaInicio.trim() === '' ? null : horaInicio.trim(),
        horaFin: horaFin.trim() === '' ? null : horaFin.trim(),
        nota: nota.trim() === '' ? null : nota.trim(),
      });
      hapticSuccess(); // el día quedó guardado (edición manual sagrada)
      onCerrar();
    } catch {
      Alert.alert('No se pudo guardar', 'Revisa las horas (formato HH:MM).');
      setGuardando(false);
    }
  }

  async function onQuitarEdicion() {
    try {
      await borrarExcepcion(dia.fecha);
      onCerrar();
    } catch {
      Alert.alert('No se pudo quitar', 'Inténtalo de nuevo.');
    }
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onCerrar}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Cerrar"
        onPress={onCerrar}
        style={{ flex: 1, backgroundColor: '#00000066', justifyContent: 'flex-end' }}
      >
        <Pressable
          onPress={() => {}}
          style={{
            backgroundColor: t.color.surface,
            borderTopLeftRadius: t.radius.xl,
            borderTopRightRadius: t.radius.xl,
            padding: t.spacing.base,
            gap: t.spacing.md,
            maxHeight: '88%',
          }}
        >
          <ScrollView contentContainerStyle={{ gap: t.spacing.md }} keyboardShouldPersistTaps="handled">
            <Text accessibilityRole="header" style={{ color: t.color.textPrimary, ...t.typography.scale.titleM }}>
              Día {numDia} · {SERVICIO_LABEL[dia.servicio]}
            </Text>
            {dia.origen === 'manual' ? (
              <Badge label="Editado a mano" tone="info" />
            ) : (
              <Text style={{ color: t.color.textSecondary, ...t.typography.scale.caption }}>
                Viene del patrón. Al guardar quedará como edición manual.
              </Text>
            )}

            <Text style={{ color: t.color.textPrimary, ...t.typography.scale.label }}>Servicio</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm }}>
              {SERVICIOS_ORDEN.map((s) => {
                const activo = s === servicio;
                return (
                  <Pressable
                    key={s}
                    accessibilityRole="button"
                    accessibilityLabel={SERVICIO_LABEL[s]}
                    accessibilityState={{ selected: activo }}
                    onPress={() => {
                      hapticSelection();
                      setServicio(s);
                    }}
                    style={{
                      minHeight: t.touch.chipHeight,
                      paddingHorizontal: t.spacing.md,
                      paddingVertical: t.spacing.sm,
                      borderRadius: t.radius.pill,
                      borderWidth: 1,
                      borderColor: activo ? t.color.accent : t.color.border,
                      backgroundColor: activo ? t.color.accentWeak : t.color.surface,
                    }}
                  >
                    <Text
                      style={{
                        color: activo ? t.color.accent : t.color.textSecondary,
                        ...t.typography.scale.caption,
                        fontWeight: activo ? '700' : '600',
                      }}
                    >
                      {SERVICIO_LABEL[s]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
              <View style={{ flex: 1, gap: t.spacing.xs }}>
                <Text style={{ color: t.color.textPrimary, ...t.typography.scale.label }}>Entrada</Text>
                <TextInput
                  accessibilityLabel="Hora de entrada, formato HH:MM"
                  value={horaInicio}
                  onChangeText={setHoraInicio}
                  placeholder="HH:MM"
                  placeholderTextColor={t.color.textTertiary}
                  style={campoStyle(t, horaInicioOk)}
                />
              </View>
              <View style={{ flex: 1, gap: t.spacing.xs }}>
                <Text style={{ color: t.color.textPrimary, ...t.typography.scale.label }}>Salida</Text>
                <TextInput
                  accessibilityLabel="Hora de salida, formato HH:MM"
                  value={horaFin}
                  onChangeText={setHoraFin}
                  placeholder="HH:MM"
                  placeholderTextColor={t.color.textTertiary}
                  style={campoStyle(t, horaFinOk)}
                />
              </View>
            </View>
            <Text style={{ color: t.color.textTertiary, ...t.typography.scale.caption }}>
              Déjalas en blanco para usar las horas del turno. Una noche cruza la medianoche.
            </Text>

            <Text style={{ color: t.color.textPrimary, ...t.typography.scale.label }}>Nota</Text>
            <TextInput
              accessibilityLabel="Nota del día"
              value={nota}
              onChangeText={setNota}
              placeholder="Ej.: cambié la noche por la libranza de un compañero"
              placeholderTextColor={t.color.textTertiary}
              multiline
              maxLength={500}
              style={{
                minHeight: 80,
                borderRadius: t.radius.md,
                borderWidth: 1,
                borderColor: t.color.border,
                backgroundColor: t.color.surface,
                color: t.color.textPrimary,
                padding: t.spacing.md,
                textAlignVertical: 'top',
                ...t.typography.scale.body,
              }}
            />

            <Pressable
              accessibilityRole="switch"
              accessibilityState={{ checked: festivo }}
              accessibilityLabel="Marcar como festivo local"
              onPress={() => setFestivo((v) => !v)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                minHeight: t.touch.min,
                borderRadius: t.radius.md,
                borderWidth: 1,
                borderColor: festivo ? t.color.danger : t.color.border,
                backgroundColor: festivo ? t.color.dangerBg : t.color.surface,
                paddingHorizontal: t.spacing.md,
              }}
            >
              <Text style={{ color: t.color.textPrimary, ...t.typography.scale.body }}>
                Festivo (local / autonómico)
              </Text>
              <Badge label={festivo ? 'Sí' : 'No'} tone={festivo ? 'danger' : 'neutral'} />
            </Pressable>

            <Button title="Guardar" onPress={onGuardar} disabled={!puedeGuardar} />
            {dia.origen === 'manual' ? (
              <Button
                title="Quitar edición (volver al patrón)"
                variant="secondary"
                onPress={onQuitarEdicion}
              />
            ) : null}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
