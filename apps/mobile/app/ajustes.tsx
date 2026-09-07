import { useMemo } from 'react';
import { Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { Banner } from '@/ui/components/Banner';
import { SelectField, type SelectOption } from '@/ui/components/SelectField';
import { hapticSelection } from '@/ui/haptics';
import { useSettingsStore, type ThemePreference } from '@/store/settings';

/**
 * AJUSTES (§4 del sistema visual v2). Cambiar cuerpo/territorio y tema, con el aviso fijo de que
 * la app no es oficial. Cambiar el cuerpo RE-TIÑE la app en caliente (el store actualiza el tema
 * y todo lo que lee `color.brand`/`accent` se repinta). Todo local, sin red (ADR-001).
 */

const CUERPO_OPTIONS: SelectOption[] = [
  { value: 'guardia_civil', label: 'Guardia Civil' },
  { value: 'policia_nacional', label: 'Policía Nacional' },
  { value: 'policia_local', label: 'Policía Local' },
  { value: 'policia_autonomica', label: 'Policía Autonómica' },
];

const AUTONOMICA_OPTIONS: SelectOption[] = [
  { value: 'ertzaintza', label: 'Ertzaintza (País Vasco)' },
  { value: 'mossos', label: "Mossos d'Esquadra (Cataluña)" },
  { value: 'policia_foral', label: 'Policía Foral (Navarra)' },
  { value: 'policia_canaria', label: 'Policía Canaria (Canarias)' },
];

const TEMA_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'Sistema' },
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Oscuro' },
];

export default function AjustesScreen() {
  const t = useAppTheme();
  const insets = useSafeAreaInsets();

  const cuerpo = useSettingsStore((s) => s.cuerpo);
  const autonomica = useSettingsStore((s) => s.policiaAutonomica);
  const ccaaId = useSettingsStore((s) => s.ccaaId);
  const provinciaId = useSettingsStore((s) => s.provinciaId);
  const municipioNombre = useSettingsStore((s) => s.municipioNombre);
  const tema = useSettingsStore((s) => s.tema);
  const hapticsEnabled = useSettingsStore((s) => s.hapticsEnabled);
  const setCuerpo = useSettingsStore((s) => s.setCuerpo);
  const setTerritorio = useSettingsStore((s) => s.setTerritorio);
  const setThemePreference = useSettingsStore((s) => s.setThemePreference);
  const setHapticsEnabled = useSettingsStore((s) => s.setHapticsEnabled);

  const esAutonomica = cuerpo === 'policia_autonomica';
  const esLocal = cuerpo === 'policia_local';
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

  function cambiarCuerpo(v: string) {
    const c = v as Cuerpo;
    void setCuerpo(c, c === 'policia_autonomica' ? autonomica : null);
    if (c === 'policia_autonomica' && autonomica) {
      // Reajusta la comunidad a la fijada por la autonómica.
      void setTerritorio({
        ccaaId: CCAA_DE_AUTONOMICA[autonomica],
        provinciaId: null,
        municipioId: null,
        municipioNombre: null,
      });
    }
  }

  function cambiarAutonomica(v: string) {
    const a = v as PoliciaAutonomica;
    void setCuerpo('policia_autonomica', a);
    void setTerritorio({
      ccaaId: CCAA_DE_AUTONOMICA[a],
      provinciaId: null,
      municipioId: null,
      municipioNombre: null,
    });
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.color.bg }}
      contentContainerStyle={{
        paddingTop: t.spacing.lg,
        paddingBottom: insets.bottom + t.spacing.xxl,
        paddingHorizontal: t.spacing.base,
        gap: t.spacing.xl,
      }}
    >
      {/* Apariencia */}
      <View style={{ gap: t.spacing.md }}>
        <Text style={{ color: t.color.textPrimary, ...t.typography.scale.titleM }}>Apariencia</Text>
        <View style={{ gap: t.spacing.xs }}>
          <Text style={{ color: t.color.textPrimary, ...t.typography.scale.label }}>Tema</Text>
          <Segmented
            t={t}
            value={tema}
            options={TEMA_OPTIONS}
            onChange={(v) => void setThemePreference(v)}
          />
          <Text style={{ color: t.color.textTertiary, ...t.typography.scale.caption }}>
            "Sistema" sigue el ajuste de tu teléfono (oscuro de noche).
          </Text>
        </View>

        {/* Vibración (feedback háptico). Al activarla, un toque de confirmación (P0-1). */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: t.spacing.md,
            minHeight: t.touch.min,
          }}
        >
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ color: t.color.textPrimary, ...t.typography.scale.label }}>Vibración</Text>
            <Text style={{ color: t.color.textTertiary, ...t.typography.scale.caption }}>
              Feedback al copiar, marcar favoritos y cambiar de pestaña.
            </Text>
          </View>
          <Switch
            accessibilityLabel="Vibración"
            value={hapticsEnabled}
            onValueChange={(v) => {
              setHapticsEnabled(v);
              if (v) hapticSelection(); // confirma con un toque al activarla
            }}
            trackColor={{ true: t.color.accent, false: t.color.surfaceAlt }}
            thumbColor={t.color.surface}
            ios_backgroundColor={t.color.surfaceAlt}
          />
        </View>
      </View>

      {/* Cuerpo */}
      <View style={{ gap: t.spacing.md }}>
        <Text style={{ color: t.color.textPrimary, ...t.typography.scale.titleM }}>Tu cuerpo</Text>
        <SelectField label="Cuerpo" value={cuerpo} options={CUERPO_OPTIONS} onChange={cambiarCuerpo} />
        {esAutonomica ? (
          <SelectField
            label="Policía autonómica"
            value={autonomica}
            options={AUTONOMICA_OPTIONS}
            onChange={cambiarAutonomica}
          />
        ) : null}
      </View>

      {/* Territorio */}
      <View style={{ gap: t.spacing.md }}>
        <Text style={{ color: t.color.textPrimary, ...t.typography.scale.titleM }}>Tu territorio</Text>
        <SelectField
          label="Comunidad autónoma"
          value={ccaaActual}
          options={ccaaOptions}
          disabled={ccaaFijada !== null}
          hint={ccaaFijada !== null ? 'La fija tu cuerpo autonómico.' : undefined}
          onChange={(v) =>
            void setTerritorio({
              ccaaId: v,
              provinciaId: null,
              municipioId: municipioNombre ? slugMunicipio(municipioNombre) : null,
              municipioNombre,
            })
          }
        />
        <SelectField
          label="Provincia"
          value={provinciaId}
          options={provinciaOptions}
          placeholder={ccaaActual ? 'Selecciona provincia…' : 'Elige antes la comunidad'}
          disabled={!ccaaActual}
          onChange={(v) =>
            void setTerritorio({
              ccaaId: ccaaActual,
              provinciaId: v,
              municipioId: municipioNombre ? slugMunicipio(municipioNombre) : null,
              municipioNombre,
            })
          }
        />
        <View style={{ gap: t.spacing.xs }}>
          <Text style={{ color: t.color.textPrimary, ...t.typography.scale.label }}>
            Municipio {esLocal ? '' : '(opcional)'}
          </Text>
          <TextInput
            accessibilityLabel="Municipio"
            defaultValue={municipioNombre ?? ''}
            onEndEditing={(e) => {
              const nombre = e.nativeEvent.text.trim();
              void setTerritorio({
                ccaaId: ccaaActual,
                provinciaId,
                municipioId: nombre ? slugMunicipio(nombre) : null,
                municipioNombre: nombre || null,
              });
            }}
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
            Solo obligatorio para Policía Local.
          </Text>
        </View>
      </View>

      <Banner tone="info" title="Herramienta independiente">
        Agente no es una app oficial de ningún cuerpo ni está asociada a ellos. El acento de color
        es solo una personalización tuya.
      </Banner>
    </ScrollView>
  );
}

function Segmented({
  t,
  value,
  options,
  onChange,
}: {
  t: Theme;
  value: ThemePreference;
  options: { value: ThemePreference; label: string }[];
  onChange: (v: ThemePreference) => void;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        borderRadius: t.radius.md,
        borderWidth: 1,
        borderColor: t.color.border,
        backgroundColor: t.color.surfaceAlt,
        padding: t.spacing.xxs,
        gap: t.spacing.xxs,
      }}
    >
      {options.map((o) => {
        const activo = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="button"
            accessibilityState={{ selected: activo }}
            onPress={() => onChange(o.value)}
            style={{
              flex: 1,
              minHeight: t.touch.min,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: t.radius.sm,
              backgroundColor: activo ? t.color.accent : 'transparent',
            }}
          >
            <Text
              style={{
                color: activo ? t.color.accentOn : t.color.textSecondary,
                ...t.typography.scale.label,
              }}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
