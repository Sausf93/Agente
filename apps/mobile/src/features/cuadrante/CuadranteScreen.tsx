import { useEffect, useMemo, useState } from 'react';
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
import {
  diaSemanaLunes0,
  PATRONES_PREDEFINIDOS,
  proyectarMes,
  resumenHorasMes,
  type Cuadrante,
  type DiaProyectado,
  type PatronTurno,
  type TipoServicio,
} from '@agente/shared';
import type { ComponentType } from 'react';
import { ChevronLeft, ChevronRight, type LucideProps } from 'lucide-react-native';
import { useAppTheme } from '@/ui/useAppTheme';
import type { Theme } from '@/ui/theme';
import { Badge } from '@/ui/components/Badge';
import { Banner } from '@/ui/components/Banner';
import { Button } from '@/ui/components/Button';
import { Card } from '@/ui/components/Card';
import { hapticSelection, hapticSuccess } from '@/ui/haptics';
import {
  colorServicio,
  DIAS_SEMANA_ABREV,
  MESES,
  SERVICIO_ABREV,
  SERVICIO_LABEL,
  SERVICIOS_ORDEN,
} from './servicioVisual';
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
// Onboarding: elegir patrón + fecha de inicio + jornada de referencia
// ---------------------------------------------------------------------------

function hoyISO(): string {
  const d = new Date();
  const y = d.getFullYear().toString().padStart(4, '0');
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const da = d.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${da}`;
}

const RE_FECHA = /^\d{4}-\d{2}-\d{2}$/;

function Onboarding({ t, insets }: { t: Theme; insets: { bottom: number } }) {
  const crear = useCuadranteStore((s) => s.crear);
  const [patronIdx, setPatronIdx] = useState(0);
  const [inicio, setInicio] = useState(hoyISO());
  const [jornada, setJornada] = useState('37.5');
  const [creando, setCreando] = useState(false);

  const jornadaNum = Number(jornada.replace(',', '.'));
  const fechaOk = RE_FECHA.test(inicio);
  const jornadaOk = Number.isFinite(jornadaNum) && jornadaNum > 0;
  const puedeCrear = fechaOk && jornadaOk && !creando;

  async function onCrear() {
    if (!puedeCrear) return;
    setCreando(true);
    try {
      await crear({
        patron: PATRONES_PREDEFINIDOS[patronIdx] as PatronTurno,
        inicioCiclo: inicio,
        jornadaRefHorasSemana: jornadaNum,
      });
    } catch {
      Alert.alert('No se pudo crear', 'Revisa la fecha (AAAA-MM-DD) y la jornada.');
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
    >
      <View style={{ gap: t.spacing.xs, marginTop: t.spacing.base }}>
        <Text accessibilityRole="header" style={{ color: t.color.textPrimary, ...t.typography.scale.titleXL }}>
          Tu cuadrante
        </Text>
        <Text style={{ color: t.color.textSecondary, ...t.typography.scale.body }}>
          Elige tu patrón de turnos y desde cuándo. Podrás ajustar días sueltos después: tus
          cambios a mano se guardan y nunca se pierden.
        </Text>
      </View>

      <Banner tone="success" title="No se borra">
        Se guarda en tu móvil, funciona sin cobertura y sobrevive a las actualizaciones. Tus
        ediciones manuales mandan sobre el patrón.
      </Banner>

      <View style={{ gap: t.spacing.sm }}>
        <Text style={{ color: t.color.textPrimary, ...t.typography.scale.label }}>Patrón</Text>
        {PATRONES_PREDEFINIDOS.map((p, i) => {
          const activo = i === patronIdx;
          return (
            <Pressable
              key={p.nombre}
              accessibilityRole="button"
              accessibilityState={{ selected: activo }}
              accessibilityLabel={`${p.nombre}. ${SERVICIO_LABEL[p.secuencia[0] as TipoServicio]}…`}
              onPress={() => {
                hapticSelection();
                setPatronIdx(i);
              }}
              style={{
                minHeight: t.touch.min,
                borderRadius: t.radius.md,
                borderWidth: activo ? 2 : 1,
                borderColor: activo ? t.color.accent : t.color.border,
                backgroundColor: activo ? t.color.accentWeak : t.color.surface,
                padding: t.spacing.md,
                gap: t.spacing.xxs,
              }}
            >
              <Text style={{ color: t.color.textPrimary, ...t.typography.scale.bodyStrong }}>
                {p.nombre}
              </Text>
              <Text style={{ color: t.color.textSecondary, ...t.typography.scale.caption }}>
                Ciclo de {p.secuencia.length} días · punto de partida editable
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{ gap: t.spacing.sm }}>
        <Text style={{ color: t.color.textPrimary, ...t.typography.scale.label }}>
          Primer día del ciclo
        </Text>
        <TextInput
          accessibilityLabel="Fecha de inicio del ciclo, formato año-mes-día"
          value={inicio}
          onChangeText={setInicio}
          placeholder="AAAA-MM-DD"
          placeholderTextColor={t.color.textTertiary}
          autoCapitalize="none"
          style={campoStyle(t, fechaOk)}
        />
      </View>

      <View style={{ gap: t.spacing.sm }}>
        <Text style={{ color: t.color.textPrimary, ...t.typography.scale.label }}>
          Jornada de referencia (horas/semana)
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
          Configúrala según tu cuerpo (no todos son 37,5 h). El exceso se calcula sobre esta cifra.
        </Text>
      </View>

      <Button title="Crear cuadrante" onPress={onCrear} disabled={!puedeCrear} />
    </ScrollView>
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
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth() + 1); // 1-12
  const [diaEditando, setDiaEditando] = useState<DiaProyectado | null>(null);

  const dias = useMemo(() => proyectarMes(cuadrante, anio, mes), [cuadrante, anio, mes]);
  const resumen = useMemo(() => resumenHorasMes(cuadrante, anio, mes), [cuadrante, anio, mes]);

  const primerDia = dias[0];
  const blancosIniciales = primerDia ? diaSemanaLunes0(primerDia.fecha) : 0;

  function irMes(delta: number) {
    let m = mes + delta;
    let a = anio;
    if (m < 1) {
      m = 12;
      a -= 1;
    } else if (m > 12) {
      m = 1;
      a += 1;
    }
    setMes(m);
    setAnio(a);
  }

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
        <ResumenHoras t={t} resumen={resumen} />

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <FlechaMes t={t} etiqueta="Mes anterior" Icono={ChevronLeft} onPress={() => irMes(-1)} />
          <Text style={{ color: t.color.textPrimary, ...t.typography.scale.titleM }}>
            {MESES[mes - 1]} {anio}
          </Text>
          <FlechaMes t={t} etiqueta="Mes siguiente" Icono={ChevronRight} onPress={() => irMes(1)} />
        </View>

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
            <CeldaDia key={dia.fecha} t={t} dia={dia} tam={celda} onPress={() => setDiaEditando(dia)} />
          ))}
        </View>

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
      onPress={() => {
        hapticSelection();
        onPress();
      }}
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

function ResumenHoras({ t, resumen }: { t: Theme; resumen: ReturnType<typeof resumenHorasMes> }) {
  const signo = resumen.exceso > 0 ? '+' : '';
  const excesoTone = resumen.exceso > 0 ? 'warning' : 'success';
  return (
    <Card>
      <Text style={{ color: t.color.textSecondary, ...t.typography.scale.caption }}>Este mes</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.lg, marginTop: t.spacing.xxs }}>
        <Cifra t={t} valor={`${resumen.horasTotales} h`} etiqueta="Total" />
        <Cifra t={t} valor={`${resumen.horasNocturnas} h`} etiqueta="Nocturnas" />
        <Cifra t={t} valor={`${resumen.horasFestivas} h`} etiqueta="Festivas" />
        <Cifra t={t} valor={`${resumen.noches}`} etiqueta="Noches" />
      </View>
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
    </Card>
  );
}

function Cifra({ t, valor, etiqueta }: { t: Theme; valor: string; etiqueta: string }) {
  return (
    <View style={{ gap: 2 }}>
      <Text
        style={{
          color: t.color.textPrimary,
          ...t.typography.scale.titleL,
          fontVariant: ['tabular-nums'],
        }}
      >
        {valor}
      </Text>
      <Text style={{ color: t.color.textSecondary, ...t.typography.scale.caption }}>{etiqueta}</Text>
    </View>
  );
}

function CeldaDia({
  t,
  dia,
  tam,
  onPress,
}: {
  t: Theme;
  dia: DiaProyectado;
  tam: number;
  onPress: () => void;
}) {
  const c = colorServicio(t, dia.servicio);
  const numDia = Number(dia.fecha.slice(8, 10));
  const abrev = SERVICIO_ABREV[dia.servicio];
  const a11y = [
    `Día ${numDia}`,
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
