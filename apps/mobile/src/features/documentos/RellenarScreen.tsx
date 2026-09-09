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
import { CalendarClock, CircleCheck, IdCard, Lock, Plus } from 'lucide-react-native';
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
import { SeccionPlegable } from './SeccionPlegable';
import { origenDesdePrefill, resumenIdentidad, resumenLegal } from './resumen';

/**
 * Formulario de un DOCUMENTO (§4.8), rediseñado para ser ÁGIL en la calle. El documento NACE de la
 * consulta: cuando se abre desde la ficha, la app trae ya rellenado todo lo legal (norma, artículo,
 * texto/hecho, importe, puntos, gravedad) y fecha/hora. Lo que de verdad quiere el agente es
 * MANDÁRSELO/COMPARTIRLO en un gesto para imprimirlo en la oficina y allí poner la fecha y un par
 * de cosas a mano. Por eso la jerarquía se INVIERTE respecto al formulario largo de antes:
 *
 *   1. Cabecera + "Nace de:" (contexto de origen) + ACCIÓN HÉROE: "Generar y enviarme" /
 *      "Generar y compartir". Encadenan generar el PDF y abrir la hoja de compartir.
 *   2. Bloque LEGAL: plegado a un resumen de una línea si viene de la ficha (revisar de un vistazo),
 *      expandido en frío.
 *   3. Tus datos (identidad): plegado a "Cuerpo · TIP 12345" si ya están recordados, expandido la
 *      primera vez.
 *   4. Lo del servicio: fecha/hora de-enfatizadas (ya vienen puestas), Lugar como único input
 *      destacado, y el resto tras un "+ añadir" discreto.
 *   5. Datos de vehículo o persona: SIEMPRE aparte, plegados, con aviso fijo de privacidad.
 *
 * Los datos de terceros y el PDF NUNCA se memorizan ni salen a un servidor (no hay servidor): solo
 * viajan si el agente los comparte desde su móvil.
 */
export interface RellenarScreenProps {
  plantillaId: string;
  /** Prefill que llega de la ficha (norma, artículo, importe…). Solo campos del agente. */
  prefill?: Record<string, string> | undefined;
  /**
   * Título corto de la infracción de la que nace el documento, para la línea "Nace de:". Es un dato
   * del AGENTE (nombre de la infracción), NUNCA de tercero. Opcional: si no llega, "Nace de:" se
   * deriva del prefill (norma · artículo).
   */
  origenTitulo?: string | undefined;
}

export function RellenarScreen({ plantillaId, prefill, origenTitulo }: RellenarScreenProps) {
  const t = useAppTheme();
  const insets = useSafeAreaInsets();
  const plantilla = useMemo(() => plantillaPorId(plantillaId), [plantillaId]);

  const [values, setValues] = useState<Record<string, string>>({});
  const [listo, setListo] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [pdfUri, setPdfUri] = useState<string | null>(null);
  const [textoPlano, setTextoPlano] = useState('');
  const [faltantes, setFaltantes] = useState<string[]>([]);
  // Fecha y hora ya vienen puestas: se muestran de-enfatizadas y solo se abren si hay que ajustarlas.
  const [editarFechaHora, setEditarFechaHora] = useState(false);
  // "El resto" del servicio (nº boletín, observaciones…) y los datos de tercero van plegados por
  // defecto para que la pantalla no parezca un muro de campos. Se abren con un toque.
  const [mostrarMasServicio, setMostrarMasServicio] = useState(false);
  const [mostrarTerceros, setMostrarTerceros] = useState(false);

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

  const origen = useMemo(() => origenDesdePrefill(prefill, origenTitulo), [prefill, origenTitulo]);

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

  // El servicio se reparte: fecha/hora (de-enfatizadas), lugar (único destacado) y "el resto".
  const campoFecha = camposServicio.find((c) => c.tipo === 'fecha');
  const campoHora = camposServicio.find((c) => c.tipo === 'hora');
  const campoLugar = camposServicio.find((c) => c.clave === 'lugar');
  const otrosServicio = camposServicio.filter(
    (c) => c.tipo !== 'fecha' && c.tipo !== 'hora' && c.clave !== 'lugar',
  );

  // ¿La app ya trajo lo legal relleno (viene de una ficha)? Y ¿la identidad ya está recordada?
  const resumenLeg = resumenLegal(camposLegales, values);
  const resumenId = resumenIdentidad(camposIdentidad, values);
  const legalPrerrelleno = resumenLeg.length > 0;
  const identidadRellena = resumenId.length > 0;

  function actualizar(clave: string, valor: string) {
    setValues((prev) => ({ ...prev, [clave]: valor }));
    // Cualquier edición invalida el PDF ya generado: hay que regenerarlo.
    setPdfUri(null);
  }

  /**
   * Genera el PDF EN EL DISPOSITIVO y devuelve su URI (o `null` si falla). Separado del encadenado
   * para poder reutilizarlo desde las dos acciones héroe y desde "Regenerar".
   */
  async function generar(): Promise<string | null> {
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
      hapticSuccess();
      return uri;
    } catch {
      Alert.alert('No se pudo generar el PDF', 'Inténtalo de nuevo en un dispositivo (iOS/Android).');
      return null;
    } finally {
      setGenerando(false);
    }
  }

  /** Acción héroe: genera y, en cuanto hay PDF, abre la hoja para MANDÁRSELO al propio correo. */
  async function onGenerarYEnviar() {
    const uri = await generar();
    if (uri) await abrirHojaCompartir('Enviarme a mi correo', uri);
  }

  /** Acción héroe: genera y abre la hoja de compartir (WhatsApp, Archivos, imprimir…). */
  async function onGenerarYCompartir() {
    const uri = await generar();
    if (uri) await abrirHojaCompartir('Compartir o imprimir', uri);
  }

  /**
   * Hoja de compartir con el PDF adjunto. Acepta el `uri` explícito (para encadenar justo tras
   * generar, sin esperar al re-render del estado) o cae al `pdfUri` ya en estado (reintentos).
   */
  async function abrirHojaCompartir(dialogTitle: string, uri: string | null = pdfUri) {
    if (!uri) return;
    try {
      const r = await compartirPdf(uri, dialogTitle);
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

  const fechaValor = campoFecha ? (values[campoFecha.clave] ?? '') : '';
  const horaValor = campoHora ? (values[campoHora.clave] ?? '') : '';

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
        {/* Cabecera: título + de dónde nace el documento. */}
        <View style={{ gap: t.spacing.xs }}>
          <Text
            accessibilityRole="header"
            style={{ color: t.color.textPrimary, ...t.typography.scale.titleL }}
          >
            {doc.titulo}
          </Text>
          {origen ? (
            <Text style={{ color: t.color.textSecondary, ...t.typography.scale.body }}>
              Nace de: <Text style={{ color: t.color.textPrimary }}>{origen}</Text>
            </Text>
          ) : (
            <Text style={{ color: t.color.textSecondary, ...t.typography.scale.body }}>
              Genera el PDF, mándatelo o compártelo, y lo imprimes en la oficina para terminarlo a
              mano.
            </Text>
          )}
        </View>

        {/* 1. ACCIÓN HÉROE arriba: lo que quiere el agente (generar → mándate/comparte → imprime). */}
        <View style={{ gap: t.spacing.sm }}>
          <Button
            title={generando ? 'Generando…' : 'Generar y enviarme'}
            large
            haptic="success"
            disabled={generando || !listo}
            onPress={onGenerarYEnviar}
            accessibilityHint="Crea el PDF en tu móvil y abre tu correo para mandártelo a ti mismo"
          />
          <Button
            title="Generar y compartir"
            variant="secondary"
            disabled={generando || !listo}
            onPress={onGenerarYCompartir}
            accessibilityHint="Crea el PDF en tu móvil y abre la hoja de compartir: WhatsApp, Archivos o imprimir"
          />
          <Text style={{ color: t.color.textTertiary, ...t.typography.scale.caption }}>
            Se crea en tu móvil; solo sale si tú lo compartes.
          </Text>
        </View>

        {/* Resultado tras generar: banner + faltantes + reintentos. Queda "debajo" del héroe para
            volver a mandarlo o compartirlo, y para ver los huecos que quedaron en blanco. */}
        {pdfUri ? (
          <View style={{ gap: t.spacing.md }}>
            <Banner tone="success" title="PDF listo en tu móvil">
              Ya lo tienes. Mándatelo a tu correo o compártelo; lo imprimes en la oficina y solo
              pones la fecha y un par de datos a mano.
            </Banner>
            {faltantes.length > 0 ? (
              <Banner tone="info" title="Quedan huecos por rellenar">
                Se han dejado líneas en blanco para: {faltantes.join(', ')}. Puedes rellenarlas a
                mano o completar los campos y volver a generar.
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
          </View>
        ) : null}

        {/* 2. Bloque LEGAL: plegado a un resumen si viene de la ficha; expandido en frío. */}
        {listo && camposLegales.length > 0 ? (
          <SeccionPlegable
            t={t}
            titulo={legalPrerrelleno ? 'Ya rellenado por la app' : 'Datos legales'}
            resumen={resumenLeg}
            initialOpen={!legalPrerrelleno}
            resaltado={legalPrerrelleno}
            icon={CircleCheck}
            accessibilityLabel="los datos legales"
            hint={
              legalPrerrelleno
                ? 'Norma, artículo, importe y texto vienen de la infracción. Edítalo solo si procede.'
                : 'Si abres el documento desde una infracción, la app rellena esto por ti.'
            }
          >
            {camposLegales.map((c) => (
              <CampoInput
                key={c.clave}
                t={t}
                campo={c}
                valor={values[c.clave] ?? ''}
                onChange={actualizar}
                resaltado={legalPrerrelleno}
              />
            ))}
          </SeccionPlegable>
        ) : null}

        {/* 3. Tus datos (identidad): plegado a "Cuerpo · TIP 12345" si ya se recuerdan. */}
        {listo && camposIdentidad.length > 0 ? (
          <SeccionPlegable
            t={t}
            titulo="Tus datos"
            resumen={resumenId}
            initialOpen={!identidadRellena}
            icon={IdCard}
            accessibilityLabel="tus datos de identidad"
            hint="Se recuerdan en este teléfono para la próxima vez. No son datos de terceros."
          >
            {camposIdentidad.map((c) => (
              <CampoInput key={c.clave} t={t} campo={c} valor={values[c.clave] ?? ''} onChange={actualizar} />
            ))}
          </SeccionPlegable>
        ) : null}

        {/* 4. Lo del servicio al mínimo: fecha/hora de-enfatizadas, lugar destacado, resto plegado. */}
        {listo && camposServicio.length > 0 ? (
          <View style={{ gap: t.spacing.md }}>
            <Text style={{ color: t.color.textPrimary, ...t.typography.scale.titleM }}>
              Lo del servicio
            </Text>

            {/* Fecha y hora ya puestas: fila compacta y tenue; se abre solo para ajustar. */}
            {campoFecha || campoHora ? (
              <View style={{ gap: t.spacing.sm }}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Hoy ${fechaValor} a las ${horaValor}. Tocar para editar la fecha y la hora`}
                  accessibilityState={{ expanded: editarFechaHora }}
                  onPress={() => setEditarFechaHora((v) => !v)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: t.spacing.sm,
                    minHeight: t.touch.min,
                  }}
                >
                  <CalendarClock size={18} color={t.color.textSecondary} strokeWidth={2} />
                  <Text style={{ flex: 1, color: t.color.textSecondary, ...t.typography.scale.body }}>
                    Hoy {fechaValor}
                    {horaValor ? ` · ${horaValor}` : ''}
                  </Text>
                  <Text style={{ color: t.color.brand, ...t.typography.scale.label }}>
                    {editarFechaHora ? 'Ocultar' : 'Editar'}
                  </Text>
                </Pressable>
                {editarFechaHora ? (
                  <View style={{ gap: t.spacing.md }}>
                    {campoFecha ? (
                      <CampoInput t={t} campo={campoFecha} valor={fechaValor} onChange={actualizar} />
                    ) : null}
                    {campoHora ? (
                      <CampoInput t={t} campo={campoHora} valor={horaValor} onChange={actualizar} />
                    ) : null}
                  </View>
                ) : null}
              </View>
            ) : null}

            {/* Lugar: el ÚNICO input del servicio destacado siempre visible. */}
            {campoLugar ? (
              <CampoInput
                t={t}
                campo={campoLugar}
                valor={values[campoLugar.clave] ?? ''}
                onChange={actualizar}
              />
            ) : null}

            {/* El resto del servicio (nº boletín, observaciones, causa…) tras un "+ añadir". */}
            {otrosServicio.length > 0 ? (
              mostrarMasServicio ? (
                <View style={{ gap: t.spacing.md }}>
                  {otrosServicio.map((c) => (
                    <CampoInput key={c.clave} t={t} campo={c} valor={values[c.clave] ?? ''} onChange={actualizar} />
                  ))}
                </View>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Añadir más datos del servicio: ${otrosServicio.map((c) => c.etiqueta).join(', ')}`}
                  onPress={() => setMostrarMasServicio(true)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: t.spacing.sm,
                    minHeight: t.touch.min,
                  }}
                >
                  <Plus size={18} color={t.color.brand} strokeWidth={2} />
                  <Text style={{ flex: 1, color: t.color.brand, ...t.typography.scale.label }}>
                    Añadir más datos del servicio
                  </Text>
                </Pressable>
              )
            ) : null}
          </View>
        ) : null}

        {/* 5. Datos de terceros: OPCIONALES y plegados por defecto (SIEMPRE aparte, con aviso). */}
        {listo && camposTercero.length > 0 ? (
          mostrarTerceros ? (
            <View style={{ gap: t.spacing.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm }}>
                <Lock size={20} color={t.color.warning} strokeWidth={2} />
                <Text style={{ color: t.color.textPrimary, ...t.typography.scale.titleM }}>
                  Datos de vehículo o persona
                </Text>
              </View>
              <Banner tone="warning" title="Opcional · solo en este dispositivo">
                Rellena solo lo que necesites en el documento; puedes dejarlo en blanco y ponerlo a
                mano. Matrículas, nombres y DNI no se guardan ni se envían a ningún servidor.
              </Banner>
              {camposTercero.map((c) => (
                <CampoInput key={c.clave} t={t} campo={c} valor={values[c.clave] ?? ''} onChange={actualizar} />
              ))}
            </View>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Añadir datos de vehículo o persona, opcional"
              onPress={() => setMostrarTerceros(true)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: t.spacing.sm,
                minHeight: t.touch.min,
                borderRadius: t.radius.md,
                borderWidth: 1,
                borderColor: t.color.border,
                borderStyle: 'dashed',
                backgroundColor: t.color.surface,
                paddingHorizontal: t.spacing.md,
                paddingVertical: t.spacing.sm,
              }}
            >
              <Lock size={18} color={t.color.textSecondary} strokeWidth={2} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: t.color.textPrimary, ...t.typography.scale.label }}>
                  Añadir datos de vehículo o persona
                </Text>
                <Text style={{ color: t.color.textTertiary, ...t.typography.scale.caption }}>
                  Opcional · solo si los necesitas. Se quedan en tu móvil.
                </Text>
              </View>
              <Plus size={20} color={t.color.accent} strokeWidth={2} />
            </Pressable>
          )
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
  /** Campo prerrellenado por la app (bloque legal): etiqueta "lo pone la app". */
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
