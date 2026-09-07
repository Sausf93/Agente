import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Languages } from 'lucide-react-native';
import { useAppTheme } from '@/ui/useAppTheme';
import type { Theme } from '@/ui/theme';
import { Banner } from '@/ui/components/Banner';
import { Card } from '@/ui/components/Card';
import { CopyBulletinButton } from '@/ui/components/CopyBulletinButton';
import { hapticSelection } from '@/ui/haptics';
import {
  APARTADOS_520,
  ETIQUETAS_APARTADOS,
  IDIOMAS_DERECHOS,
  IDIOMAS_META,
  derechosPorIdioma,
  textoCompleto,
  type IdiomaDerechos,
} from './derechos';

/**
 * LECTURA DE DERECHOS DEL DETENIDO (§4.11): el art. 520.2 LECrim en varios idiomas para leérselo
 * al detenido en el suyo. Selector de idioma por chips (con háptico), texto GRANDE y legible
 * pensado para leer en voz alta (respeta RTL en árabe) y botón para COPIAR el texto completo.
 *
 * Contenido bundlado y offline (no depende del paquete SQLite). Español revisado (literal del
 * BOE); el resto son traducciones fieles PENDIENTES de cotejo (aviso visible). Aviso fijo de que
 * es información de apoyo y la valoración final corresponde al agente y, en su caso, al juez.
 */
export function DerechosScreen() {
  const t = useAppTheme();
  const insets = useSafeAreaInsets();
  const [idioma, setIdioma] = useState<IdiomaDerechos>('es');

  const texto = useMemo(() => derechosPorIdioma(idioma), [idioma]);
  const meta = IDIOMAS_META[idioma];
  const completo = useMemo(() => textoCompleto(texto), [texto]);

  function elegir(nuevo: IdiomaDerechos) {
    if (nuevo === idioma) return;
    hapticSelection();
    setIdioma(nuevo);
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.color.bg }}
      contentContainerStyle={{
        padding: t.spacing.base,
        paddingBottom: insets.bottom + t.spacing.xxl,
        gap: t.spacing.lg,
      }}
    >
      {/* Cabecera. */}
      <View style={{ gap: t.spacing.xs }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm }}>
          <Languages size={22} color={t.color.accent} strokeWidth={2.2} />
          <Text
            accessibilityRole="header"
            style={{ color: t.color.textPrimary, ...t.typography.scale.titleXL }}
          >
            Lectura de derechos
          </Text>
        </View>
        <Text style={{ color: t.color.textSecondary, ...t.typography.scale.bodyStrong }}>
          Derechos del detenido · art. 520.2 LECrim
        </Text>
      </View>

      {/* Aviso orientativo fijo (contenido sensible, nunca imperativo). */}
      <Banner tone="info" title="Información de apoyo">
        Lee estos derechos al detenido en su idioma. Es información de apoyo; la valoración final
        de la detención y de su información corresponde al agente y, en su caso, a la autoridad
        judicial.
      </Banner>

      {/* Selector de idioma por chips (endónimo + nombre en español). */}
      <View style={{ gap: t.spacing.sm }}>
        <Text style={{ color: t.color.textPrimary, ...t.typography.scale.label }}>Idioma</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm }}>
          {IDIOMAS_DERECHOS.map((codigo) => {
            const m = IDIOMAS_META[codigo];
            const activo = codigo === idioma;
            return (
              <Pressable
                key={codigo}
                accessibilityRole="button"
                accessibilityState={{ selected: activo }}
                accessibilityLabel={`${m.nombre} (${m.endonimo})`}
                onPress={() => elegir(codigo)}
                style={{
                  minHeight: t.touch.min,
                  justifyContent: 'center',
                  borderRadius: t.radius.pill,
                  borderWidth: 1,
                  borderColor: activo ? t.color.accent : t.color.border,
                  backgroundColor: activo ? t.color.accentWeak : t.color.surface,
                  paddingHorizontal: t.spacing.md,
                  paddingVertical: t.spacing.xs,
                }}
              >
                <Text
                  style={{
                    color: activo ? t.color.accent : t.color.textPrimary,
                    ...t.typography.scale.bodyStrong,
                  }}
                >
                  {m.endonimo}
                </Text>
                <Text
                  style={{
                    color: activo ? t.color.accent : t.color.textTertiary,
                    ...t.typography.scale.caption,
                  }}
                >
                  {m.nombre}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Aviso de traducción pendiente de cotejo (todos los idiomas salvo el español). */}
      {!texto.revisado && texto.nota ? (
        <Banner tone="warning" title="Traducción pendiente de cotejo">
          {texto.nota}
        </Banner>
      ) : null}

      {/* Copiar el texto completo del idioma elegido (para pegar en un acta o compartir). */}
      <CopyBulletinButton
        texto={completo}
        label="Copiar derechos"
      />

      {/* Los apartados, uno a uno: etiqueta en español + texto GRANDE en el idioma nativo. */}
      <View style={{ gap: t.spacing.md }}>
        {APARTADOS_520.map((clave) => (
          <Apartado
            key={clave}
            t={t}
            etiqueta={ETIQUETAS_APARTADOS[clave]}
            textoNativo={texto.textoNativo[clave]}
            textoEs={idioma === 'es' ? null : texto.textoEs[clave]}
            rtl={meta.rtl}
          />
        ))}
      </View>

      {/* Pie con la fuente. */}
      <Text style={{ color: t.color.textTertiary, ...t.typography.scale.caption }}>
        Fuente: art. 520.2 LECrim. La detención durará el tiempo estrictamente necesario para el
        esclarecimiento de los hechos.
      </Text>
    </ScrollView>
  );
}

/** Un derecho: encabezado (siempre en español, para el agente) + texto grande a leer en voz alta. */
function Apartado({
  t,
  etiqueta,
  textoNativo,
  textoEs,
  rtl,
}: {
  t: Theme;
  etiqueta: string;
  textoNativo: string;
  textoEs: string | null;
  rtl: boolean;
}) {
  return (
    <Card>
      <Text style={{ color: t.color.textSecondary, ...t.typography.scale.label }}>{etiqueta}</Text>
      <Text
        maxFontSizeMultiplier={2}
        style={{
          color: t.color.textPrimary,
          ...t.typography.scale.bodyL,
          textAlign: rtl ? 'right' : 'left',
          writingDirection: rtl ? 'rtl' : 'ltr',
        }}
      >
        {textoNativo}
      </Text>
      {/* Referencia en español bajo la traducción, para que el agente sepa qué está leyendo. */}
      {textoEs ? (
        <Text style={{ color: t.color.textTertiary, ...t.typography.scale.caption }}>
          {textoEs}
        </Text>
      ) : null}
    </Card>
  );
}
