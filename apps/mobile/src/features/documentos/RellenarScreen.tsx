import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { renderPlantilla } from '@agente/shared';
import { useAppTheme } from '@/ui/useAppTheme';
import type { Theme } from '@/ui/theme';
import { Banner } from '@/ui/components/Banner';
import { Button } from '@/ui/components/Button';
import { getRememberedFields, rememberFields } from '@/db/userDb';
import type { CampoPlantilla } from './campos';
import { plantillaPorId } from './plantillasSeed';
import { formatearFecha, formatearHora, valoresIniciales, valoresRecordables } from './iniciales';
import { buildDocumentHtml } from './html';
import { generarPdf } from './generarPdf';
import { compartirPdf, enviarPorCorreo } from './compartir';

/**
 * Formulario de un DOCUMENTO (§4.8): el agente rellena los huecos de la plantilla y genera el PDF
 * EN EL DISPOSITIVO. Los datos de terceros se piden en una sección aparte con aviso fijo de
 * privacidad y NUNCA se memorizan ni salen del teléfono. El PDF se comparte/envía desde el propio
 * dispositivo (hoja de compartir o correo); no se sube a ningún servidor.
 */
export interface RellenarScreenProps {
  plantillaId: string;
  /** Prefill que llega de la ficha (norma, artículo, importe…). Solo campos del agente. */
  prefill?: Record<string, string> | undefined;
}

export function RellenarScreen({ plantillaId, prefill }: RellenarScreenProps) {
  const t = useAppTheme();
  const insets = useSafeAreaInsets();
  const plantilla = useMemo(() => plantillaPorId(plantillaId), [plantillaId]);

  const [values, setValues] = useState<Record<string, string>>({});
  const [listo, setListo] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [pdfUri, setPdfUri] = useState<string | null>(null);
  const [textoPlano, setTextoPlano] = useState('');
  const [faltantes, setFaltantes] = useState<string[]>([]);

  useEffect(() => {
    let vivo = true;
    (async () => {
      if (!plantilla) {
        setListo(true);
        return;
      }
      const recordado = await getRememberedFields().catch(() => ({}));
      if (!vivo) return;
      setValues(valoresIniciales(plantilla, recordado, prefill ?? {}, new Date()));
      setListo(true);
    })();
    return () => {
      vivo = false;
    };
  }, [plantilla, prefill]);

  if (!plantilla) {
    return (
      <View style={{ flex: 1, backgroundColor: t.color.bg, padding: t.spacing.base, paddingTop: insets.top + t.spacing.xl }}>
        <Text style={{ color: t.color.textPrimary, ...t.typography.scale.titleM }}>
          Plantilla no encontrada
        </Text>
      </View>
    );
  }

  // `plantilla` queda estrechado a no-nulo por el early return de arriba; se fija en `doc` para
  // que ese estrechamiento se conserve dentro de los callbacks asíncronos (TS no lo arrastra).
  const doc = plantilla;
  const camposAgente = doc.campos.filter((c) => !c.esDatoTercero);
  const camposTercero = doc.campos.filter((c) => c.esDatoTercero);

  function actualizar(clave: string, valor: string) {
    setValues((prev) => ({ ...prev, [clave]: valor }));
    // Cualquier edición invalida el PDF ya generado: hay que regenerarlo.
    setPdfUri(null);
  }

  async function onGenerar() {
    setGenerando(true);
    try {
      const { texto, camposFaltantes } = renderPlantilla(doc.markdownConVariables, values);
      const ahora = new Date();
      const generadoEn = `${formatearFecha(ahora)} ${formatearHora(ahora)}`;
      const html = buildDocumentHtml({ titulo: doc.titulo, markdown: texto, generadoEn });
      const uri = await generarPdf(html, doc.titulo);
      // Memorizar SOLO los campos del agente marcados recordar (nunca datos de terceros).
      await rememberFields(valoresRecordables(doc, values), ahora.toISOString()).catch(() => {});
      setTextoPlano(texto);
      setFaltantes(camposFaltantes);
      setPdfUri(uri);
    } catch {
      Alert.alert('No se pudo generar el PDF', 'Inténtalo de nuevo en un dispositivo (iOS/Android).');
    } finally {
      setGenerando(false);
    }
  }

  async function onCompartir() {
    if (!pdfUri) return;
    try {
      const r = await compartirPdf(pdfUri);
      if (r === 'no-disponible') {
        Alert.alert('Compartir no disponible', 'Este dispositivo no permite compartir archivos.');
      }
    } catch {
      Alert.alert('No se pudo compartir', 'Inténtalo de nuevo.');
    }
  }

  async function onCorreo() {
    try {
      const ok = await enviarPorCorreo(doc.titulo, textoPlano);
      if (!ok) Alert.alert('Sin cliente de correo', 'No hay una app de correo configurada.');
    } catch {
      Alert.alert('No se pudo abrir el correo', 'Prueba con "Compartir o enviar".');
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: t.color.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{
          padding: t.spacing.base,
          paddingBottom: insets.bottom + t.spacing.xxl,
          gap: t.spacing.lg,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ gap: t.spacing.xs }}>
          <Text
            accessibilityRole="header"
            style={{ color: t.color.textPrimary, ...t.typography.scale.titleL }}
          >
            {plantilla.titulo}
          </Text>
          <Text style={{ color: t.color.textSecondary, ...t.typography.scale.body }}>
            El texto legal ya está redactado. Completa lo específico y genera el PDF en tu móvil.
          </Text>
        </View>

        {/* Sección: datos del agente (cuándo, dónde, referencias legales). */}
        <View style={{ gap: t.spacing.md }}>
          <Text style={{ color: t.color.textPrimary, ...t.typography.scale.titleM }}>
            Datos del servicio
          </Text>
          {listo
            ? camposAgente.map((c) => (
                <CampoInput key={c.clave} t={t} campo={c} valor={values[c.clave] ?? ''} onChange={actualizar} />
              ))
            : null}
        </View>

        {/* Sección: datos de terceros, con aviso fijo y solo-dispositivo. */}
        {camposTercero.length > 0 ? (
          <View style={{ gap: t.spacing.md }}>
            <Text style={{ color: t.color.textPrimary, ...t.typography.scale.titleM }}>
              Datos de terceros
            </Text>
            <Banner tone="warning" title="Solo en este dispositivo">
              Matrículas, nombres y DNI no se guardan como borrador ni se envían a ningún servidor.
              Escríbelos solo si los necesitas en el documento.
            </Banner>
            {listo
              ? camposTercero.map((c) => (
                  <CampoInput key={c.clave} t={t} campo={c} valor={values[c.clave] ?? ''} onChange={actualizar} />
                ))
              : null}
          </View>
        ) : null}

        <Button
          title={generando ? 'Generando…' : pdfUri ? 'Regenerar PDF' : 'Generar PDF'}
          onPress={onGenerar}
          disabled={generando}
          accessibilityHint="Crea el PDF en este dispositivo"
        />

        {pdfUri ? (
          <View style={{ gap: t.spacing.md }}>
            {faltantes.length > 0 ? (
              <Banner tone="info" title="Quedan huecos por rellenar">
                Se han dejado líneas en blanco para: {faltantes.join(', ')}. Puedes rellenarlas a
                mano o completar los campos y regenerar.
              </Banner>
            ) : null}
            <Button title="Compartir o enviar" onPress={onCompartir} accessibilityHint="Abre la hoja de compartir con el PDF adjunto" />
            <Button
              title="Enviar por correo (texto)"
              variant="secondary"
              onPress={onCorreo}
              accessibilityHint="Abre el correo con una copia en texto del documento"
            />
            <Text style={{ color: t.color.textTertiary, ...t.typography.scale.caption }}>
              El PDF se ha creado en tu móvil. Solo saldrá de aquí si tú lo compartes.
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function CampoInput({
  t,
  campo,
  valor,
  onChange,
}: {
  t: Theme;
  campo: CampoPlantilla;
  valor: string;
  onChange: (clave: string, valor: string) => void;
}) {
  const multilinea = campo.tipo === 'multilinea';
  return (
    <View style={{ gap: t.spacing.xs }}>
      <Text style={{ color: t.color.textPrimary, ...t.typography.scale.label }}>{campo.etiqueta}</Text>
      <TextInput
        accessibilityLabel={campo.etiqueta}
        value={valor}
        onChangeText={(v) => onChange(campo.clave, v)}
        placeholder={campo.placeholder}
        placeholderTextColor={t.color.textTertiary}
        multiline={multilinea}
        autoCapitalize={campo.tipo === 'texto' || multilinea ? 'sentences' : 'none'}
        maxFontSizeMultiplier={1.6}
        style={{
          minHeight: multilinea ? 96 : t.touch.primaryHeight,
          borderRadius: t.radius.md,
          borderWidth: 1,
          borderColor: t.color.border,
          backgroundColor: t.color.surface,
          color: t.color.textPrimary,
          paddingHorizontal: t.spacing.md,
          paddingVertical: t.spacing.sm,
          textAlignVertical: multilinea ? 'top' : 'center',
          ...t.typography.scale.body,
        }}
      />
      {campo.hint ? (
        <Text style={{ color: t.color.textTertiary, ...t.typography.scale.caption }}>{campo.hint}</Text>
      ) : null}
    </View>
  );
}
