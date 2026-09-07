import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CircleCheck, Lock } from 'lucide-react-native';
import { renderPlantilla } from '@agente/shared';
import { useAppTheme } from '@/ui/useAppTheme';
import type { Theme } from '@/ui/theme';
import { Banner } from '@/ui/components/Banner';
import { Button } from '@/ui/components/Button';
import { hapticSuccess } from '@/ui/haptics';
import { getRememberedFields, rememberFields } from '@/db/userDb';
import { seccionDe, type CampoPlantilla } from './campos';
import { plantillaPorId } from './plantillasSeed';
import { formatearFecha, formatearHora, valoresIniciales, valoresRecordables } from './iniciales';
import { buildDocumentHtml } from './html';
import { generarPdf } from './generarPdf';
import { compartirPdf, enviarPorCorreo } from './compartir';

/**
 * Formulario de un DOCUMENTO (§4.8). El documento NACE de la consulta: cuando se abre desde la
 * ficha, la app trae ya rellenado todo lo legal (norma, artículo, texto/hecho, importe, puntos,
 * gravedad) y el agente solo pone lo específico. La pantalla se agrupa por lo que significa cada
 * hueco:
 *
 *   1. "Ya rellenado por la app" — lo legal, que el agente NO reescribe (solo edita si procede).
 *   2. "Tus datos" — cuerpo, unidad y nº TIP; se recuerdan para no teclearlos cada vez.
 *   3. "Lo del servicio" — fecha, hora, lugar/PK y lo propio del acta. Lo mínimo a mano.
 *   4. "Datos de vehículo o persona" — SIEMPRE aparte, con aviso fijo: solo en este dispositivo.
 *
 * Tras generar el PDF, lo grande es "Enviarme a mi correo" y "Compartir": el agente se lo manda o
 * lo comparte y lo imprime luego en la oficina. Los datos de terceros y el PDF NUNCA se memorizan
 * ni salen a un servidor (no hay servidor): solo viajan si el agente los comparte desde su móvil.
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
  // Agrupación por sección (los terceros van SIEMPRE aparte, ignorando su categoría).
  const camposLegales = doc.campos.filter((c) => !c.esDatoTercero && seccionDe(c) === 'legal');
  const camposIdentidad = doc.campos.filter((c) => !c.esDatoTercero && seccionDe(c) === 'identidad');
  const camposServicio = doc.campos.filter((c) => !c.esDatoTercero && seccionDe(c) === 'servicio');
  const camposTercero = doc.campos.filter((c) => c.esDatoTercero);

  // ¿La app ya trajo lo legal relleno (viene de una ficha)? Cambia el tono del bloque legal.
  const legalPrerrelleno = camposLegales.some((c) => (values[c.clave] ?? '').trim().length > 0);

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
      // Feedback inmediato: el PDF ya está en el móvil. No abrimos nada automáticamente; el agente
      // decide si se lo manda a su correo, lo comparte o lo imprime (botones grandes de abajo).
      hapticSuccess();
    } catch {
      Alert.alert('No se pudo generar el PDF', 'Inténtalo de nuevo en un dispositivo (iOS/Android).');
    } finally {
      setGenerando(false);
    }
  }

  /** Hoja de compartir con el PDF adjunto. El título adapta la hoja al gesto del agente. */
  async function abrirHojaCompartir(dialogTitle: string) {
    if (!pdfUri) return;
    try {
      const r = await compartirPdf(pdfUri, dialogTitle);
      if (r === 'no-disponible') {
        Alert.alert('Compartir no disponible', 'Este dispositivo no permite compartir archivos.');
      }
    } catch {
      Alert.alert('No se pudo compartir', 'Inténtalo de nuevo.');
    }
  }

  async function onCorreoTexto() {
    try {
      const ok = await enviarPorCorreo(doc.titulo, textoPlano);
      if (!ok) Alert.alert('Sin cliente de correo', 'No hay una app de correo configurada.');
    } catch {
      Alert.alert('No se pudo abrir el correo', 'Prueba con "Enviarme a mi correo".');
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
        {/* Cabecera: título + el FLUJO que quiere el agente (genera → mándate/comparte → imprime). */}
        <View style={{ gap: t.spacing.xs }}>
          <Text
            accessibilityRole="header"
            style={{ color: t.color.textPrimary, ...t.typography.scale.titleL }}
          >
            {doc.titulo}
          </Text>
          <Text style={{ color: t.color.textSecondary, ...t.typography.scale.body }}>
            Genera aquí el PDF, mándatelo a tu correo o compártelo, y lo imprimes en la oficina para
            poner la fecha y un par de datos a mano.
          </Text>
        </View>

        {/* 1. Bloque LEGAL: lo rellena la app desde la infracción. El agente no lo reescribe. */}
        {camposLegales.length > 0 ? (
          <View
            style={{
              gap: t.spacing.md,
              borderRadius: t.radius.md,
              borderWidth: 1,
              borderColor: legalPrerrelleno ? t.color.accent : t.color.border,
              backgroundColor: legalPrerrelleno ? t.color.accentWeak : t.color.surface,
              padding: t.spacing.md,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm }}>
              <CircleCheck size={20} color={t.color.accent} strokeWidth={2} />
              <Text style={{ color: t.color.textPrimary, ...t.typography.scale.titleM }}>
                {legalPrerrelleno ? 'Ya rellenado por la app' : 'Datos legales'}
              </Text>
            </View>
            <Text style={{ color: t.color.textSecondary, ...t.typography.scale.caption }}>
              {legalPrerrelleno
                ? 'Norma, artículo, importe y texto vienen de la infracción. Edítalo solo si procede.'
                : 'Si abres el documento desde una infracción, la app rellena esto por ti.'}
            </Text>
            {listo
              ? camposLegales.map((c) => (
                  <CampoInput
                    key={c.clave}
                    t={t}
                    campo={c}
                    valor={values[c.clave] ?? ''}
                    onChange={actualizar}
                    resaltado={legalPrerrelleno}
                  />
                ))
              : null}
          </View>
        ) : null}

        {/* 2. Tus datos (cuerpo, unidad, nº TIP): se recuerdan para no reescribirlos cada vez. */}
        {camposIdentidad.length > 0 ? (
          <View style={{ gap: t.spacing.md }}>
            <View style={{ gap: t.spacing.xxs }}>
              <Text style={{ color: t.color.textPrimary, ...t.typography.scale.titleM }}>
                Tus datos
              </Text>
              <Text style={{ color: t.color.textSecondary, ...t.typography.scale.caption }}>
                Se recuerdan en este teléfono para la próxima vez. No son datos de terceros.
              </Text>
            </View>
            {listo
              ? camposIdentidad.map((c) => (
                  <CampoInput key={c.clave} t={t} campo={c} valor={values[c.clave] ?? ''} onChange={actualizar} />
                ))
              : null}
          </View>
        ) : null}

        {/* 3. Lo del servicio (fecha, hora, lugar/PK y lo propio del acta): lo mínimo a mano. */}
        {camposServicio.length > 0 ? (
          <View style={{ gap: t.spacing.md }}>
            <View style={{ gap: t.spacing.xxs }}>
              <Text style={{ color: t.color.textPrimary, ...t.typography.scale.titleM }}>
                Lo del servicio
              </Text>
              <Text style={{ color: t.color.textSecondary, ...t.typography.scale.caption }}>
                Fecha y hora ya vienen puestas; ajústalas y añade el lugar. Puedes dejar huecos y
                terminarlos a mano sobre el papel.
              </Text>
            </View>
            {listo
              ? camposServicio.map((c) => (
                  <CampoInput key={c.clave} t={t} campo={c} valor={values[c.clave] ?? ''} onChange={actualizar} />
                ))
              : null}
          </View>
        ) : null}

        {/* 4. Datos de terceros: SIEMPRE aparte, con aviso fijo y solo-dispositivo. */}
        {camposTercero.length > 0 ? (
          <View style={{ gap: t.spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm }}>
              <Lock size={20} color={t.color.warning} strokeWidth={2} />
              <Text style={{ color: t.color.textPrimary, ...t.typography.scale.titleM }}>
                Datos de vehículo o persona
              </Text>
            </View>
            <Banner tone="warning" title="Solo en este dispositivo, no se envía">
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
            <Banner tone="success" title="PDF listo en tu móvil">
              Ya lo tienes. Mándatelo a tu correo o compártelo; lo imprimes en la oficina y solo
              pones la fecha y un par de datos a mano.
            </Banner>
            {faltantes.length > 0 ? (
              <Banner tone="info" title="Quedan huecos por rellenar">
                Se han dejado líneas en blanco para: {faltantes.join(', ')}. Puedes rellenarlas a
                mano o completar los campos y regenerar.
              </Banner>
            ) : null}
            <Button
              title="Enviarme a mi correo"
              onPress={() => abrirHojaCompartir('Enviarme a mi correo')}
              accessibilityHint="Abre tu correo con el PDF adjunto para mandártelo a ti mismo"
            />
            <Button
              title="Compartir o imprimir"
              variant="secondary"
              onPress={() => abrirHojaCompartir('Compartir o imprimir')}
              accessibilityHint="Abre la hoja de compartir: WhatsApp, AirDrop, Archivos o imprimir"
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Enviar solo el texto por correo, sin el PDF"
              onPress={onCorreoTexto}
              style={{ minHeight: t.touch.min, justifyContent: 'center' }}
            >
              <Text style={{ color: t.color.brand, ...t.typography.scale.label }}>
                Enviar solo el texto (sin PDF)
              </Text>
            </Pressable>
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
  resaltado = false,
}: {
  t: Theme;
  campo: CampoPlantilla;
  valor: string;
  onChange: (clave: string, valor: string) => void;
  /** Campo prerrellenado por la app (bloque legal): fondo tenue y etiqueta "lo pone la app". */
  resaltado?: boolean;
}) {
  const multilinea = campo.tipo === 'multilinea';
  return (
    <View style={{ gap: t.spacing.xs }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm }}>
        <Text style={{ color: t.color.textPrimary, ...t.typography.scale.label }}>{campo.etiqueta}</Text>
        {resaltado ? (
          <Text style={{ color: t.color.accent, ...t.typography.scale.caption }}>· lo pone la app</Text>
        ) : null}
      </View>
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
          // Dentro del bloque legal (fondo tenue), el campo en `surface` resalta como editable.
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
