import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Stack } from 'expo-router';
import { useAppTheme } from '@/ui/useAppTheme';
import type { Theme } from '@/ui/theme';
import { Card } from '@/ui/components/Card';
import { CopyBulletinButton } from '@/ui/components/CopyBulletinButton';
import { hapticSelection } from '@/ui/haptics';
import {
  deleteCarreteraReciente,
  deleteTerminoMunicipalReciente,
  listCarreterasRecientes,
  listTerminosMunicipalesRecientes,
  recordCarreteraReciente,
  recordTerminoMunicipalReciente,
} from '@/db/userDb';
import {
  componerLocalizacion,
  localizacionValida,
  type Margen,
  type Plataforma,
  type Sentido,
} from './puntoKilometrico';

/**
 * PUNTO KILOMÉTRICO (§4.11): ayudante manual para componer la LOCALIZACIÓN exacta de una
 * intervención en carretera, lista para copiar al atestado. Sin mapa ni datos de carreteras (que
 * llegarán después): el agente teclea la vía, el p.k. y el sentido/margen y se lleva el texto. Todo
 * en el dispositivo; no guarda datos de terceros (es la localización de un punto público de la vía).
 */
export function PuntoKilometricoScreen() {
  const t = useAppTheme();
  const [carretera, setCarretera] = useState('');
  const [pk, setPk] = useState('');
  const [sentido, setSentido] = useState<Sentido | null>(null);
  const [sentidoHacia, setSentidoHacia] = useState('');
  const [margen, setMargen] = useState<Margen | null>(null);
  const [plataforma, setPlataforma] = useState<Plataforma | null>(null);
  const [terminoMunicipal, setTerminoMunicipal] = useState('');
  const [referencia, setReferencia] = useState('');
  const [recientes, setRecientes] = useState<string[]>([]);
  const [tmRecientes, setTmRecientes] = useState<string[]>([]);

  useEffect(() => {
    let vivo = true;
    void listCarreterasRecientes().then((r) => {
      if (vivo) setRecientes(r);
    });
    void listTerminosMunicipalesRecientes().then((r) => {
      if (vivo) setTmRecientes(r);
    });
    return () => {
      vivo = false;
    };
  }, []);

  const datos = {
    carretera,
    pk,
    sentido,
    sentidoHacia: sentidoHacia.trim() || null,
    margen,
    plataforma,
    terminoMunicipal: terminoMunicipal.trim() || null,
    referencia: referencia.trim() || null,
  };
  // Memoiza sobre los campos primitivos (no sobre `datos`, que se recrea en cada render).
  const texto = useMemo(
    () => componerLocalizacion(datos),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [carretera, pk, sentido, sentidoHacia, margen, plataforma, terminoMunicipal, referencia],
  );
  const valido = localizacionValida(datos);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.color.bg }}
      contentContainerStyle={{ padding: t.spacing.base, gap: t.spacing.lg }}
      keyboardShouldPersistTaps="handled"
    >
      <Stack.Screen options={{ title: 'Punto kilométrico' }} />

      <Text style={{ color: t.color.textSecondary, ...t.typography.scale.body }}>
        Compón la localización exacta de la intervención para el atestado. Teclea la vía y el punto
        kilométrico; el texto se genera abajo, listo para copiar.
      </Text>

      <Campo t={t} etiqueta="Carretera / vía">
        <Entrada
          t={t}
          value={carretera}
          onChangeText={setCarretera}
          placeholder="p. ej. TF-1"
          autoCapitalize="characters"
          accessibilityLabel="Denominación de la carretera"
        />
        {recientes.length > 0 ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.xs, marginTop: t.spacing.xxs }}>
            {recientes.map((via) => (
              <Chip
                key={via}
                t={t}
                label={via}
                onPress={() => setCarretera(via)}
                onLongPress={() => {
                  void deleteCarreteraReciente(via).then(() => listCarreterasRecientes().then(setRecientes));
                }}
              />
            ))}
          </View>
        ) : null}
      </Campo>

      <Campo t={t} etiqueta="Punto kilométrico">
        <Entrada
          t={t}
          value={pk}
          onChangeText={setPk}
          placeholder="p. ej. 12,300"
          keyboardType="numbers-and-punctuation"
          accessibilityLabel="Punto kilométrico"
        />
      </Campo>

      <Campo t={t} etiqueta="Sentido">
        <Segmento
          t={t}
          value={sentido}
          opciones={[
            { key: 'creciente', label: 'Creciente' },
            { key: 'decreciente', label: 'Decreciente' },
          ]}
          onChange={(v) => setSentido(v)}
        />
        <Text style={{ color: t.color.textTertiary, ...t.typography.scale.caption }}>
          Creciente = sube el p.k. (ascendente); decreciente = baja (descendente).
        </Text>
        <Entrada
          t={t}
          value={sentidoHacia}
          onChangeText={setSentidoHacia}
          placeholder="hacia… (opcional, p. ej. Santa Cruz)"
          accessibilityLabel="Destino del sentido, opcional"
        />
      </Campo>

      <Campo t={t} etiqueta="Margen">
        <Segmento
          t={t}
          value={margen}
          opciones={[
            { key: 'derecho', label: 'Derecho' },
            { key: 'izquierdo', label: 'Izquierdo' },
            { key: 'ambos', label: 'Ambos' },
          ]}
          onChange={(v) => setMargen(v)}
        />
      </Campo>

      <Campo t={t} etiqueta="Ubicación en la vía (opcional)">
        <Segmento
          t={t}
          value={plataforma}
          opciones={[
            { key: 'calzada', label: 'Calzada' },
            { key: 'arcen', label: 'Arcén' },
            { key: 'mediana', label: 'Mediana' },
            { key: 'via_servicio', label: 'Vía servicio' },
          ]}
          onChange={(v) => setPlataforma(v)}
        />
      </Campo>

      <Campo t={t} etiqueta="Término municipal">
        <Entrada
          t={t}
          value={terminoMunicipal}
          onChangeText={setTerminoMunicipal}
          placeholder="p. ej. Adeje"
          autoCapitalize="words"
          accessibilityLabel="Término municipal"
        />
        {tmRecientes.length > 0 ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.xs, marginTop: t.spacing.xxs }}>
            {tmRecientes.map((tm) => (
              <Chip
                key={tm}
                t={t}
                label={tm}
                onPress={() => setTerminoMunicipal(tm)}
                onLongPress={() => {
                  void deleteTerminoMunicipalReciente(tm).then(() =>
                    listTerminosMunicipalesRecientes().then(setTmRecientes),
                  );
                }}
              />
            ))}
          </View>
        ) : null}
      </Campo>

      <Campo t={t} etiqueta="Referencia (opcional)">
        <Entrada
          t={t}
          value={referencia}
          onChangeText={setReferencia}
          placeholder="p. ej. a la altura de la salida 12"
          accessibilityLabel="Referencia complementaria, opcional"
        />
      </Campo>

      <View style={{ gap: t.spacing.sm }}>
        <Text style={{ color: t.color.textPrimary, ...t.typography.scale.label }}>
          Localización para el atestado
        </Text>
        <Card>
          <Text style={{ color: valido ? t.color.textPrimary : t.color.textTertiary, ...t.typography.scale.body }}>
            {valido ? texto : 'Introduce al menos la carretera o el punto kilométrico.'}
          </Text>
        </Card>
        {valido ? (
          <CopyBulletinButton
            texto={texto}
            label="Copiar localización"
            onCopied={() => {
              // Al copiar, se recuerdan la carretera y el término municipal para ofrecerlos como
              // acceso rápido la próxima vez (uso a una mano en la misma demarcación).
              const ahora = new Date().toISOString();
              void recordCarreteraReciente(carretera, ahora).then(() =>
                listCarreterasRecientes().then(setRecientes),
              );
              void recordTerminoMunicipalReciente(terminoMunicipal, ahora).then(() =>
                listTerminosMunicipalesRecientes().then(setTmRecientes),
              );
            }}
          />
        ) : null}
      </View>

      <Text style={{ color: t.color.textTertiary, ...t.typography.scale.caption, textAlign: 'center' }}>
        Ayudante manual. El mapa con las carreteras y el p.k. automático llegarán más adelante.
      </Text>
    </ScrollView>
  );
}

/** Chip de acceso rápido reciente: un toque lo rellena; pulsación larga lo borra. */
function Chip({
  t,
  label,
  onPress,
  onLongPress,
}: {
  t: Theme;
  label: string;
  onPress: () => void;
  onLongPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Usar ${label}. Mantén pulsado para borrarlo.`}
      onPress={() => {
        hapticSelection();
        onPress();
      }}
      onLongPress={
        onLongPress
          ? () => {
              hapticSelection();
              onLongPress();
            }
          : undefined
      }
      style={{
        minHeight: t.touch.chipHeight,
        justifyContent: 'center',
        borderRadius: t.radius.pill,
        borderWidth: 1,
        borderColor: t.color.border,
        backgroundColor: t.color.surfaceAlt,
        paddingHorizontal: t.spacing.md,
      }}
    >
      <Text style={{ color: t.color.textSecondary, ...t.typography.scale.label }}>{label}</Text>
    </Pressable>
  );
}

function Campo({ t, etiqueta, children }: { t: Theme; etiqueta: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: t.spacing.xs }}>
      <Text style={{ color: t.color.textPrimary, ...t.typography.scale.label }}>{etiqueta}</Text>
      {children}
    </View>
  );
}

function Entrada({ t, ...props }: { t: Theme } & React.ComponentProps<typeof TextInput>) {
  return (
    <TextInput
      placeholderTextColor={t.color.textTertiary}
      maxFontSizeMultiplier={1.6}
      style={{
        minHeight: t.touch.searchHeight,
        borderRadius: t.radius.md,
        borderWidth: 1,
        borderColor: t.color.border,
        backgroundColor: t.color.surface,
        paddingHorizontal: t.spacing.md,
        color: t.color.textPrimary,
        ...t.typography.scale.bodyL,
      }}
      {...props}
    />
  );
}

/** Segmentado que permite deseleccionar (tocar la opción activa la quita). Toque ≥44, háptico. */
function Segmento<T extends string>({
  t,
  value,
  opciones,
  onChange,
}: {
  t: Theme;
  value: T | null;
  opciones: { key: T; label: string }[];
  onChange: (v: T | null) => void;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: t.spacing.xxs,
        padding: t.spacing.xxs,
        borderRadius: t.radius.md,
        backgroundColor: t.color.surfaceAlt,
      }}
    >
      {opciones.map((op) => {
        const activo = op.key === value;
        return (
          <Pressable
            key={op.key}
            accessibilityRole="button"
            accessibilityState={{ selected: activo }}
            onPress={() => {
              hapticSelection();
              onChange(activo ? null : op.key);
            }}
            style={{
              flex: 1,
              minHeight: t.touch.min,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: t.spacing.sm,
              borderRadius: t.radius.sm,
              backgroundColor: activo ? t.color.surface : 'transparent',
              ...(activo ? t.elevation.e1 : null),
            }}
          >
            <Text
              numberOfLines={1}
              maxFontSizeMultiplier={1.4}
              style={{ color: activo ? t.color.accent : t.color.textSecondary, ...t.typography.scale.label }}
            >
              {op.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
