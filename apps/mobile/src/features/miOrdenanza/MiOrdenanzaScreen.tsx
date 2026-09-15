import { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { FileWarning, Trash2 } from 'lucide-react-native';
import { useAppTheme } from '@/ui/useAppTheme';
import type { Theme } from '@/ui/theme';
import { Button } from '@/ui/components/Button';
import { Card } from '@/ui/components/Card';
import { EmptyState } from '@/ui/components/EmptyState';
import { CopyBulletinButton } from '@/ui/components/CopyBulletinButton';
import { hapticSelection } from '@/ui/haptics';
import { useSettingsStore } from '@/store/settings';
import { conceptoPorId } from './conceptosAparcamiento';
import { useOrdenanzaPropiaStore } from './ordenanzaPropiaStore';

/**
 * Pantalla "MI ORDENANZA" (§4.5): el agente fija, para SU municipio, el importe y el artículo de un
 * concepto de aparcamiento regulado (zona azul, carga y descarga, vado, PMR) que NO viaja en el
 * paquete (varía por ayuntamiento). Se guarda SOLO en el dispositivo (ADR-001) y se reutiliza en el
 * boletín. NO es dato de tercero (es la tarifa pública de la ordenanza que el agente conoce).
 */
export function MiOrdenanzaScreen({ conceptoId }: { conceptoId: string }) {
  const t = useAppTheme();
  const router = useRouter();
  const concepto = conceptoPorId(conceptoId);

  const municipioNombre = useSettingsStore((s) => s.municipioNombre);
  const cargar = useOrdenanzaPropiaStore((s) => s.cargar);
  const guardar = useOrdenanzaPropiaStore((s) => s.guardar);
  const borrar = useOrdenanzaPropiaStore((s) => s.borrar);
  const loaded = useOrdenanzaPropiaStore((s) => s.loaded);
  const registro = useOrdenanzaPropiaStore((s) =>
    concepto ? (s.registros[concepto.id] ?? null) : null,
  );

  const [importeStr, setImporteStr] = useState('');
  const [reducidoStr, setReducidoStr] = useState('');
  const [articulo, setArticulo] = useState('');
  const [prefilled, setPrefilled] = useState(false);

  useEffect(() => {
    if (!loaded) void cargar();
  }, [loaded, cargar]);

  // Prefill (una vez) con lo ya guardado cuando el store se hidrata.
  useEffect(() => {
    if (prefilled || !loaded) return;
    if (registro) {
      setImporteStr(String(registro.importeEur));
      setReducidoStr(registro.importeReducidoEur !== null ? String(registro.importeReducidoEur) : '');
      setArticulo(registro.articulo ?? '');
    }
    setPrefilled(true);
  }, [prefilled, loaded, registro]);

  // Convierte "12,50" o "12.50" a número; NaN si no es válido.
  const importeEur = parseImporte(importeStr);
  const importeReducidoEur = reducidoStr.trim() ? parseImporte(reducidoStr) : null;
  const importeValido = Number.isFinite(importeEur) && importeEur > 0;
  const reducidoValido =
    importeReducidoEur === null ||
    (Number.isFinite(importeReducidoEur) && importeReducidoEur <= importeEur);

  const boletin = useMemo(() => {
    if (!concepto || !importeValido) return '';
    return concepto.boletin({
      importeEur,
      articulo: articulo.trim() || null,
      municipio: municipioNombre,
    });
  }, [concepto, importeValido, importeEur, articulo, municipioNombre]);

  if (!concepto) {
    return (
      <View style={{ flex: 1, backgroundColor: t.color.bg }}>
        <Stack.Screen options={{ title: 'Mi ordenanza' }} />
        <EmptyState
          icon={FileWarning}
          title="Concepto no reconocido"
          message="Este concepto de aparcamiento no está disponible."
          actionLabel="Volver"
          onAction={() => router.back()}
        />
      </View>
    );
  }

  const onGuardar = async () => {
    if (!importeValido || !reducidoValido) return;
    hapticSelection();
    await guardar({
      concepto: concepto.id,
      importeEur,
      importeReducidoEur: importeReducidoEur !== null && Number.isFinite(importeReducidoEur) ? importeReducidoEur : null,
      articulo: articulo.trim() || null,
      municipio: municipioNombre,
      updatedAt: new Date().toISOString(),
    });
    router.back();
  };

  const onBorrar = async () => {
    hapticSelection();
    await borrar(concepto.id);
    router.back();
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.color.bg }}
      contentContainerStyle={{ padding: t.spacing.base, gap: t.spacing.lg }}
      keyboardShouldPersistTaps="handled"
    >
      <Stack.Screen options={{ title: 'Mi ordenanza' }} />

      <View style={{ gap: t.spacing.xs }}>
        <Text style={{ color: t.color.textPrimary, ...t.typography.scale.titleL }}>
          {concepto.label}
        </Text>
        <Text style={{ color: t.color.textSecondary, ...t.typography.scale.body }}>
          {concepto.descripcion}
        </Text>
        <Text style={{ color: t.color.textSecondary, ...t.typography.scale.caption }}>
          Su cuantía depende de tu ordenanza municipal
          {municipioNombre ? ` (${municipioNombre})` : ''} y por eso no viaja en la app. Pon aquí el
          importe y el artículo de TU ordenanza: se guarda SOLO en tu móvil y lo reutilizas en el
          boletín.
        </Text>
      </View>

      <Campo t={t} etiqueta="Importe (€)">
        <Entrada
          t={t}
          value={importeStr}
          onChangeText={setImporteStr}
          placeholder="p. ej. 30"
          keyboardType="decimal-pad"
          accessibilityLabel="Importe de la sanción en euros"
        />
      </Campo>

      <Campo t={t} etiqueta="Importe con pronto pago (opcional)">
        <Entrada
          t={t}
          value={reducidoStr}
          onChangeText={setReducidoStr}
          placeholder="p. ej. 15"
          keyboardType="decimal-pad"
          accessibilityLabel="Importe reducido por pronto pago, opcional"
        />
        {!reducidoValido ? (
          <Text style={{ color: t.color.danger, ...t.typography.scale.caption }}>
            El importe con pronto pago no puede ser mayor que el importe.
          </Text>
        ) : null}
      </Campo>

      <Campo t={t} etiqueta="Artículo de tu ordenanza (opcional)">
        <Entrada
          t={t}
          value={articulo}
          onChangeText={setArticulo}
          placeholder="p. ej. 12.3"
          autoCapitalize="none"
          accessibilityLabel="Artículo de la ordenanza, opcional"
        />
      </Campo>

      {boletin ? (
        <View style={{ gap: t.spacing.sm }}>
          <Text style={{ color: t.color.textPrimary, ...t.typography.scale.label }}>
            Texto para el boletín
          </Text>
          <Card>
            <Text style={{ color: t.color.textPrimary, ...t.typography.scale.body }}>{boletin}</Text>
          </Card>
          <CopyBulletinButton texto={boletin} label="Copiar boletín" />
        </View>
      ) : null}

      <Button
        title={registro ? 'Guardar cambios' : 'Guardar mi ordenanza'}
        onPress={onGuardar}
        disabled={!importeValido || !reducidoValido}
        accessibilityHint="Guarda el importe en tu móvil para reutilizarlo"
      />

      {registro ? (
        <Button
          title="Borrar"
          variant="secondary"
          icon={Trash2}
          onPress={onBorrar}
          accessibilityHint="Elimina esta tarifa de tu móvil"
        />
      ) : null}

      <Text style={{ color: t.color.textTertiary, ...t.typography.scale.caption, textAlign: 'center' }}>
        Dato guardado solo en este dispositivo. No se envía a ningún servidor.
      </Text>
    </ScrollView>
  );
}

/** Convierte una cadena "12,50" / "12.50" a número (NaN si no es válida). */
function parseImporte(s: string): number {
  const limpio = s.trim().replace(/\s/g, '').replace(',', '.');
  if (limpio.length === 0) return Number.NaN;
  return Number(limpio);
}

function Campo({ t, etiqueta, children }: { t: Theme; etiqueta: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: t.spacing.xs }}>
      <Text style={{ color: t.color.textPrimary, ...t.typography.scale.label }}>{etiqueta}</Text>
      {children}
    </View>
  );
}

function Entrada({
  t,
  ...props
}: { t: Theme } & React.ComponentProps<typeof TextInput>) {
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
