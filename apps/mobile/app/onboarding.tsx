import { useMemo, useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Check } from 'lucide-react-native';
import {
  CCAA_DE_AUTONOMICA,
  COMUNIDADES,
  provinciasDeCcaa,
  slugMunicipio,
  type Cuerpo,
  type PoliciaAutonomica,
} from '@agente/shared';
import { useAppTheme } from '@/ui/useAppTheme';
import type { Theme } from '@/ui/theme';
import { accentByCuerpo, accentKeyFromCuerpo } from '@/ui/theme';
import { Button } from '@/ui/components/Button';
import { Banner } from '@/ui/components/Banner';
import { PressableScale } from '@/ui/components/PressableScale';
import { SelectField, type SelectOption } from '@/ui/components/SelectField';
import { hapticSelection } from '@/ui/haptics';
import { useSettingsStore } from '@/store/settings';

/**
 * ONBOARDING de primera apertura (sistema visual v2, §6; ADR-001 local-first, sin login).
 * Dos pasos: (1) cuerpo → fija el ACENTO y tiñe la app al instante; (2) territorio → filtra el
 * contenido. Municipio obligatorio SOLO para Policía Local. Sin permisos en seco: la ubicación
 * y las notificaciones se pedirán en contexto. Todo es cambiable luego en Ajustes.
 */

const CUERPOS: { value: Cuerpo; label: string }[] = [
  { value: 'guardia_civil', label: 'Guardia Civil' },
  { value: 'policia_nacional', label: 'Policía Nacional' },
  { value: 'policia_local', label: 'Policía Local' },
  { value: 'policia_autonomica', label: 'Policía Autonómica' },
];

const AUTONOMICAS: { value: PoliciaAutonomica; label: string; comunidad: string }[] = [
  { value: 'ertzaintza', label: 'Ertzaintza', comunidad: 'País Vasco' },
  { value: 'mossos', label: "Mossos d'Esquadra", comunidad: 'Cataluña' },
  { value: 'policia_foral', label: 'Policía Foral', comunidad: 'Navarra' },
  { value: 'policia_canaria', label: 'Policía Canaria', comunidad: 'Canarias' },
];

/** Color de acento (según el modo) para el swatch de cada tarjeta de cuerpo. */
function swatchColor(t: Theme, cuerpo: Cuerpo): string {
  const key = accentKeyFromCuerpo(cuerpo);
  if (!key) return t.color.accent;
  return accentByCuerpo[key][t.mode].accent;
}

export default function OnboardingScreen() {
  const t = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const setCuerpoStore = useSettingsStore((s) => s.setCuerpo);
  const completeOnboarding = useSettingsStore((s) => s.completeOnboarding);
  const cuerpo = useSettingsStore((s) => s.cuerpo);
  const autonomica = useSettingsStore((s) => s.policiaAutonomica);

  const [paso, setPaso] = useState<1 | 2>(1);
  const [ccaaId, setCcaaId] = useState<string | null>(null);
  const [provinciaId, setProvinciaId] = useState<string | null>(null);
  const [municipio, setMunicipio] = useState('');

  const esAutonomica = cuerpo === 'policia_autonomica';
  const esLocal = cuerpo === 'policia_local';

  // El cuerpo autonómico fija su comunidad; si no, se elige libremente.
  const ccaaFijada = esAutonomica && autonomica ? CCAA_DE_AUTONOMICA[autonomica] : null;
  const ccaaActual = ccaaFijada ?? ccaaId;

  const ccaaOptions: SelectOption[] = useMemo(
    () => COMUNIDADES.map((c) => ({ value: c.id, label: c.nombre })),
    [],
  );
  const provinciaOptions: SelectOption[] = useMemo(
    () => (ccaaActual ? provinciasDeCcaa(ccaaActual).map((p) => ({ value: p.id, label: p.nombre })) : []),
    [ccaaActual],
  );

  // Habilitación de cada paso.
  const puedeContinuar = cuerpo !== null && (!esAutonomica || autonomica !== null);
  const municipioOk = !esLocal || municipio.trim().length > 0;
  const puedeTerminar = ccaaActual !== null && provinciaId !== null && municipioOk;

  function elegirCuerpo(c: Cuerpo) {
    hapticSelection();
    // Al elegir, la app se tiñe al instante (setCuerpo actualiza el tema en caliente).
    void setCuerpoStore(c, c === 'policia_autonomica' ? autonomica : null);
    if (c !== 'policia_autonomica') {
      // Salir de autonómica limpia la comunidad fijada.
      setCcaaId(null);
      setProvinciaId(null);
    }
  }

  function elegirAutonomica(a: PoliciaAutonomica) {
    hapticSelection();
    void setCuerpoStore('policia_autonomica', a);
    setProvinciaId(null);
  }

  async function terminar() {
    if (!puedeTerminar || cuerpo === null) return;
    const nombre = municipio.trim();
    await completeOnboarding({
      cuerpo,
      policiaAutonomica: esAutonomica ? autonomica : null,
      ccaaId: ccaaActual,
      provinciaId,
      municipioId: esLocal && nombre ? slugMunicipio(nombre) : null,
      municipioNombre: esLocal && nombre ? nombre : null,
    });
    router.replace('/');
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.color.bg }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + t.spacing.xl,
          paddingBottom: insets.bottom + t.spacing.huge + t.touch.primaryHeight,
          paddingHorizontal: t.spacing.base,
          gap: t.spacing.lg,
        }}
      >
        <Progreso t={t} paso={paso} />

        {paso === 1 ? (
          <Paso1
            t={t}
            cuerpo={cuerpo}
            autonomica={autonomica}
            onElegirCuerpo={elegirCuerpo}
            onElegirAutonomica={elegirAutonomica}
          />
        ) : (
          <Paso2
            t={t}
            esLocal={esLocal}
            ccaaFijada={ccaaFijada}
            ccaaActual={ccaaActual}
            provinciaId={provinciaId}
            ccaaOptions={ccaaOptions}
            provinciaOptions={provinciaOptions}
            municipio={municipio}
            onCcaa={(v) => {
              setCcaaId(v);
              setProvinciaId(null);
            }}
            onProvincia={setProvinciaId}
            onMunicipio={setMunicipio}
          />
        )}
      </ScrollView>

      {/* Barra de acción fija abajo (pulgar). */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: t.spacing.base,
          paddingTop: t.spacing.md,
          paddingBottom: insets.bottom + t.spacing.md,
          backgroundColor: t.color.bg,
          borderTopWidth: 1,
          borderTopColor: t.color.border,
        }}
      >
        {paso === 1 ? (
          <Button title="Continuar" onPress={() => setPaso(2)} disabled={!puedeContinuar} />
        ) : (
          <View style={{ gap: t.spacing.sm }}>
            <Button title="Empezar a usar Agente" onPress={terminar} disabled={!puedeTerminar} />
            <Button title="Atrás" variant="secondary" onPress={() => setPaso(1)} />
          </View>
        )}
      </View>
    </View>
  );
}

function Progreso({ t, paso }: { t: Theme; paso: 1 | 2 }) {
  return (
    <View style={{ gap: t.spacing.sm }}>
      <View style={{ flexDirection: 'row', gap: t.spacing.xs }}>
        {[1, 2].map((n) => (
          <View
            key={n}
            style={{
              flex: 1,
              height: 4,
              borderRadius: t.radius.pill,
              backgroundColor: n <= paso ? t.color.accent : t.color.border,
            }}
          />
        ))}
      </View>
      <Text style={{ color: t.color.textSecondary, ...t.typography.scale.caption }}>
        Paso {paso} de 2
      </Text>
    </View>
  );
}

function Paso1({
  t,
  cuerpo,
  autonomica,
  onElegirCuerpo,
  onElegirAutonomica,
}: {
  t: Theme;
  cuerpo: Cuerpo | null;
  autonomica: PoliciaAutonomica | null;
  onElegirCuerpo: (c: Cuerpo) => void;
  onElegirAutonomica: (a: PoliciaAutonomica) => void;
}) {
  return (
    <View style={{ gap: t.spacing.lg }}>
      <View style={{ gap: t.spacing.xs }}>
        <Text accessibilityRole="header" style={{ color: t.color.textPrimary, ...t.typography.scale.titleXL }}>
          ¿A qué cuerpo perteneces?
        </Text>
        <Text style={{ color: t.color.textSecondary, ...t.typography.scale.body }}>
          Personaliza el contenido y el color de la app. Podrás cambiarlo en Ajustes.
        </Text>
      </View>

      <View style={{ gap: t.spacing.sm }}>
        {CUERPOS.map((c) => {
          const activo = cuerpo === c.value;
          return (
            <TarjetaCuerpo
              key={c.value}
              t={t}
              label={c.label}
              swatch={swatchColor(t, c.value)}
              activo={activo}
              onPress={() => onElegirCuerpo(c.value)}
            />
          );
        })}
      </View>

      {cuerpo === 'policia_autonomica' ? (
        <View style={{ gap: t.spacing.sm }}>
          <Text style={{ color: t.color.textPrimary, ...t.typography.scale.label }}>
            ¿Cuál en concreto?
          </Text>
          {AUTONOMICAS.map((a) => {
            const activo = autonomica === a.value;
            return (
              <TarjetaCuerpo
                key={a.value}
                t={t}
                label={a.label}
                sub={a.comunidad}
                swatch={swatchColor(t, 'policia_autonomica')}
                activo={activo}
                onPress={() => onElegirAutonomica(a.value)}
              />
            );
          })}
        </View>
      ) : null}

      <Banner tone="info" title="Herramienta independiente">
        Agente no es una app oficial de ningún cuerpo ni está asociada a ellos. El color es solo una
        personalización tuya.
      </Banner>
    </View>
  );
}

function TarjetaCuerpo({
  t,
  label,
  sub,
  swatch,
  activo,
  onPress,
}: {
  t: Theme;
  label: string;
  sub?: string;
  swatch: string;
  activo: boolean;
  onPress: () => void;
}) {
  return (
    <PressableScale
      accessibilityState={{ selected: activo }}
      accessibilityLabel={sub ? `${label}, ${sub}` : label}
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: t.spacing.md,
        minHeight: t.touch.min + 16,
        borderRadius: t.radius.lg,
        borderWidth: activo ? 2 : 1,
        borderColor: activo ? t.color.accent : t.color.border,
        backgroundColor: activo ? t.color.accentWeak : t.color.surface,
        padding: t.spacing.md,
      }}
    >
      <View style={{ width: 28, height: 28, borderRadius: t.radius.pill, backgroundColor: swatch }} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: t.color.textPrimary, ...t.typography.scale.bodyStrong }}>{label}</Text>
        {sub ? (
          <Text style={{ color: t.color.textSecondary, ...t.typography.scale.caption }}>{sub}</Text>
        ) : null}
      </View>
      {activo ? <Check size={22} color={t.color.accent} strokeWidth={2.4} /> : null}
    </PressableScale>
  );
}

function Paso2({
  t,
  esLocal,
  ccaaFijada,
  ccaaActual,
  provinciaId,
  ccaaOptions,
  provinciaOptions,
  municipio,
  onCcaa,
  onProvincia,
  onMunicipio,
}: {
  t: Theme;
  esLocal: boolean;
  ccaaFijada: string | null;
  ccaaActual: string | null;
  provinciaId: string | null;
  ccaaOptions: SelectOption[];
  provinciaOptions: SelectOption[];
  municipio: string;
  onCcaa: (v: string) => void;
  onProvincia: (v: string) => void;
  onMunicipio: (v: string) => void;
}) {
  return (
    <View style={{ gap: t.spacing.lg }}>
      <View style={{ gap: t.spacing.xs }}>
        <Text accessibilityRole="header" style={{ color: t.color.textPrimary, ...t.typography.scale.titleXL }}>
          ¿Dónde trabajas?
        </Text>
        <Text style={{ color: t.color.textSecondary, ...t.typography.scale.body }}>
          Nos sirve para mostrarte la normativa de tu territorio. Podrás cambiarlo en Ajustes.
        </Text>
      </View>

      <SelectField
        label="Comunidad autónoma"
        value={ccaaActual}
        options={ccaaOptions}
        disabled={ccaaFijada !== null}
        hint={ccaaFijada !== null ? 'La fija tu cuerpo autonómico.' : undefined}
        onChange={onCcaa}
      />

      <SelectField
        label="Provincia"
        value={provinciaId}
        options={provinciaOptions}
        placeholder={ccaaActual ? 'Selecciona provincia…' : 'Elige antes la comunidad'}
        disabled={!ccaaActual}
        onChange={onProvincia}
      />

      <View style={{ gap: t.spacing.xs }}>
        <Text style={{ color: t.color.textPrimary, ...t.typography.scale.label }}>
          Municipio {esLocal ? '' : '(opcional)'}
        </Text>
        <TextInput
          accessibilityLabel="Municipio"
          value={municipio}
          onChangeText={onMunicipio}
          placeholder="Escribe tu municipio"
          placeholderTextColor={t.color.textTertiary}
          autoCapitalize="words"
          style={{
            minHeight: t.touch.primaryHeight,
            borderRadius: t.radius.md,
            borderWidth: 1,
            borderColor: t.color.border,
            backgroundColor: t.color.surface,
            color: t.color.textPrimary,
            paddingHorizontal: t.spacing.md,
            ...t.typography.scale.body,
          }}
        />
        <Text style={{ color: t.color.textTertiary, ...t.typography.scale.caption }}>
          {esLocal
            ? 'Obligatorio para Policía Local. Guardamos tu municipio para activar sus ordenanzas en cuanto estén disponibles (próximamente).'
            : 'Solo obligatorio para Policía Local.'}
        </Text>
      </View>
    </View>
  );
}
