import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FlaskConical, Info, Scale } from 'lucide-react-native';
import { useAppTheme } from '@/ui/useAppTheme';
import type { Theme } from '@/ui/theme';
import { Badge } from '@/ui/components/Badge';
import { Banner } from '@/ui/components/Banner';
import { Card } from '@/ui/components/Card';
import { EmptyState } from '@/ui/components/EmptyState';
import { formatFecha } from '@/features/ficha/format';
import { getContentRunner } from '@/db/contentDb';
import {
  AVISO_PUREZA_BRUTO,
  AVISO_PUREZA_PURO,
  acopioLabel,
  aliasesLabel,
  calcularOrientacion,
  cargarSustancia,
  consumoDiarioLabel,
  parseCantidadG,
  parsePurezaPct,
  type OrientacionCalculada,
  type SustanciaDetalle,
} from './sustancias';

/**
 * Ficha de una SUSTANCIA (§4.7): umbrales orientativos (consumo diario y acopio para consumo
 * propio), indicadores de tráfico, fuente (INTCF + Acuerdo Sala 2ª TS 19/10/2001) y fecha, más el
 * ORIENTADOR consumo/tráfico.
 *
 * El orientador NO es una calculadora tajante: a partir de la cantidad aprehendida (y, en las
 * sustancias de peso puro, del porcentaje de pureza) muestra una ORIENTACIÓN ("probable consumo" /
 * "indicios de tráfico") con lenguaje orientativo, el aviso destacado de pureza y SIEMPRE el pie de
 * responsabilidad (la calificación final es judicial). Nada de lo que introduzca el agente se
 * guarda ni se envía.
 */
export interface SustanciaDetalleScreenProps {
  sustanciaId: string | undefined;
}

type Estado = 'cargando' | 'ok' | 'no-encontrada';

export function SustanciaDetalleScreen({ sustanciaId }: SustanciaDetalleScreenProps) {
  const t = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [estado, setEstado] = useState<Estado>('cargando');
  const [sustancia, setSustancia] = useState<SustanciaDetalle | null>(null);

  useEffect(() => {
    let vivo = true;
    (async () => {
      const runner = await getContentRunner();
      if (!vivo) return;
      if (!runner || !sustanciaId) {
        setEstado('no-encontrada');
        return;
      }
      const s = await cargarSustancia(runner, sustanciaId);
      if (!vivo) return;
      setSustancia(s);
      setEstado(s ? 'ok' : 'no-encontrada');
    })();
    return () => {
      vivo = false;
    };
  }, [sustanciaId]);

  if (estado === 'cargando') {
    return (
      <View style={{ flex: 1, backgroundColor: t.color.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={t.color.accent} />
      </View>
    );
  }

  if (estado === 'no-encontrada' || !sustancia) {
    return (
      <View style={{ flex: 1, backgroundColor: t.color.bg, paddingTop: insets.top }}>
        <EmptyState
          icon={FlaskConical}
          title="Sustancia no encontrada"
          message="No hemos encontrado esta sustancia en el paquete de contenido."
          actionLabel="Volver"
          onAction={() => router.back()}
        />
      </View>
    );
  }

  const alias = aliasesLabel(sustancia.aliases);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.color.bg }}
      contentContainerStyle={{
        paddingTop: t.spacing.lg,
        paddingBottom: insets.bottom + t.spacing.xxl,
        paddingHorizontal: t.spacing.base,
        gap: t.spacing.lg,
      }}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    >
      {/* Cabecera: nombre, jerga de calle y distintivo de revisión pendiente. */}
      <View style={{ gap: t.spacing.xs }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm, flexWrap: 'wrap' }}>
          <Text
            accessibilityRole="header"
            style={{ color: t.color.textPrimary, ...t.typography.scale.titleXL }}
          >
            {sustancia.nombre}
          </Text>
          {sustancia.pendienteRevision ? <Badge label="Pendiente de revisión" tone="warning" /> : null}
        </View>
        {alias ? (
          <Text style={{ color: t.color.textSecondary, ...t.typography.scale.body }}>{alias}</Text>
        ) : null}
      </View>

      {/* Umbrales orientativos. */}
      <View style={{ gap: t.spacing.sm }}>
        <Text accessibilityRole="header" style={{ color: t.color.textPrimary, ...t.typography.scale.titleM }}>
          Umbrales orientativos
        </Text>
        <Card>
          <DatoUmbral t={t} etiqueta="Consumo diario" valor={consumoDiarioLabel(sustancia.umbralConsumoDiarioMg)} />
          <View style={{ height: 1, backgroundColor: t.color.border, marginVertical: t.spacing.xs }} />
          <DatoUmbral
            t={t}
            etiqueta="Acopio para consumo propio"
            valor={acopioLabel(sustancia.umbralAcopioG)}
            nota="≈ consumo diario × 5 días (doctrina TS 19/10/2001)."
          />
        </Card>
      </View>

      {/* Aviso de pureza destacado (peso puro) o informativo (peso bruto). */}
      {sustancia.basePeso === 'puro' ? (
        <Banner tone="warning" title="Reduce a la pureza antes de comparar">
          {AVISO_PUREZA_PURO}
        </Banner>
      ) : (
        <Banner tone="info" title="Peso bruto">
          {AVISO_PUREZA_BRUTO}
        </Banner>
      )}

      {/* Orientador consumo/tráfico. */}
      <Orientador t={t} sustancia={sustancia} />

      {/* Indicadores de tráfico. */}
      {sustancia.indicadoresTrafico.length > 0 ? (
        <View style={{ gap: t.spacing.sm }}>
          <Text accessibilityRole="header" style={{ color: t.color.textPrimary, ...t.typography.scale.titleM }}>
            Indicadores de tráfico
          </Text>
          <Card>
            <Text style={{ color: t.color.textSecondary, ...t.typography.scale.caption }}>
              A valorar en conjunto; ninguno decide por sí solo.
            </Text>
            <View style={{ gap: t.spacing.xs, marginTop: t.spacing.xs }}>
              {sustancia.indicadoresTrafico.map((ind, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: t.spacing.sm }}>
                  <Text style={{ color: t.color.textTertiary, ...t.typography.scale.body }}>•</Text>
                  <Text
                    style={{ flex: 1, color: t.color.textPrimary, ...t.typography.scale.body }}
                    maxFontSizeMultiplier={1.6}
                  >
                    {ind}
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        </View>
      ) : null}

      {/* Notas de pureza (dato del paquete). */}
      {sustancia.notasPureza ? (
        <View style={{ gap: t.spacing.xs }}>
          <Text style={{ color: t.color.textPrimary, ...t.typography.scale.label }}>Pureza</Text>
          <Text style={{ color: t.color.textSecondary, ...t.typography.scale.body }}>
            {sustancia.notasPureza}
          </Text>
        </View>
      ) : null}

      {/* Distintivo "pendiente de revisión" con la nota de qué falta confirmar. */}
      {sustancia.pendienteRevision && sustancia.notaRevision ? (
        <Banner tone="info" title="Pendiente de revisión jurídica">
          {sustancia.notaRevision}
        </Banner>
      ) : null}

      {/* Fuente y fecha. */}
      <Text style={{ color: t.color.textTertiary, ...t.typography.scale.caption }}>
        Fuente: {sustancia.fuente}
        {sustancia.actualizadoEn ? ` · actualizado el ${formatFecha(sustancia.actualizadoEn)}` : ''}
      </Text>
    </ScrollView>
  );
}

/** Fila de un umbral: etiqueta + valor destacado + nota opcional. */
function DatoUmbral({
  t,
  etiqueta,
  valor,
  nota,
}: {
  t: Theme;
  etiqueta: string;
  valor: string;
  nota?: string;
}) {
  return (
    <View style={{ gap: t.spacing.xxs }}>
      <Text style={{ color: t.color.textSecondary, ...t.typography.scale.caption }}>{etiqueta}</Text>
      <Text style={{ color: t.color.textPrimary, ...t.typography.scale.titleM, fontVariant: ['tabular-nums'] }}>
        {valor}
      </Text>
      {nota ? (
        <Text style={{ color: t.color.textTertiary, ...t.typography.scale.caption }}>{nota}</Text>
      ) : null}
    </View>
  );
}

/**
 * ORIENTADOR (no calculadora): campo de cantidad aprehendida (g) y, en peso puro, de pureza (%).
 * Muestra la orientación con lenguaje orientativo, el pie de responsabilidad y, si el peso es puro
 * y aún no se ha metido la pureza, un aviso de que el resultado se calcula sobre peso bruto.
 */
function Orientador({ t, sustancia }: { t: Theme; sustancia: SustanciaDetalle }) {
  const [cantidadTexto, setCantidadTexto] = useState('');
  const [purezaTexto, setPurezaTexto] = useState('');

  const cantidadG = parseCantidadG(cantidadTexto);
  const purezaPct = parsePurezaPct(purezaTexto);
  const esPuro = sustancia.basePeso === 'puro';
  const orientacion = cantidadG !== null ? calcularOrientacion(sustancia, cantidadG, purezaPct) : null;

  return (
    <View style={{ gap: t.spacing.sm }}>
      <Text accessibilityRole="header" style={{ color: t.color.textPrimary, ...t.typography.scale.titleM }}>
        Orientador consumo / tráfico
      </Text>
      <Text style={{ color: t.color.textSecondary, ...t.typography.scale.body }}>
        Introduce la cantidad aprehendida para ver una orientación. Es una ayuda, no un veredicto: la
        calificación final es judicial.
      </Text>

      <Card>
        <CampoNumerico
          t={t}
          etiqueta="Cantidad aprehendida (g)"
          valor={cantidadTexto}
          onChange={setCantidadTexto}
          placeholder="p. ej. 3,5"
          invalido={cantidadTexto.trim().length > 0 && cantidadG === null}
        />

        {esPuro ? (
          <View style={{ marginTop: t.spacing.md }}>
            <CampoNumerico
              t={t}
              etiqueta="Pureza del análisis (%) — opcional"
              valor={purezaTexto}
              onChange={setPurezaTexto}
              placeholder="p. ej. 25"
              invalido={purezaTexto.trim().length > 0 && purezaPct === null}
            />
          </View>
        ) : null}

        {orientacion ? (
          <View style={{ marginTop: t.spacing.md, gap: t.spacing.sm }}>
            <ResultadoOrientacion t={t} orientacion={orientacion} />

            {esPuro && purezaPct === null ? (
              <Text style={{ color: t.color.warning, ...t.typography.scale.caption }}>
                Cálculo sobre peso BRUTO. Introduce la pureza para reducir a la riqueza real y no
                sobre-marcar tráfico.
              </Text>
            ) : null}

            <Text style={{ color: t.color.textSecondary, ...t.typography.scale.caption }}>
              {orientacion.resultado.motivo}
            </Text>
            <Text style={{ color: t.color.textTertiary, ...t.typography.scale.caption }}>
              {orientacion.resultado.pie}
            </Text>
          </View>
        ) : null}
      </Card>

      <Text style={{ color: t.color.textTertiary, ...t.typography.scale.caption }}>
        No se guarda ni se envía nada de lo que introduzcas.
      </Text>
    </View>
  );
}

/** Campo numérico etiquetado (toque ≥ 44, teclado decimal, coma o punto). */
function CampoNumerico({
  t,
  etiqueta,
  valor,
  onChange,
  placeholder,
  invalido,
}: {
  t: Theme;
  etiqueta: string;
  valor: string;
  onChange: (v: string) => void;
  placeholder: string;
  invalido: boolean;
}) {
  return (
    <View style={{ gap: t.spacing.xs }}>
      <Text style={{ color: t.color.textSecondary, ...t.typography.scale.label }}>{etiqueta}</Text>
      <TextInput
        accessibilityLabel={etiqueta}
        value={valor}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={t.color.textTertiary}
        keyboardType="decimal-pad"
        inputMode="decimal"
        maxFontSizeMultiplier={1.6}
        style={{
          minHeight: t.touch.min,
          borderRadius: t.radius.md,
          borderWidth: invalido ? 2 : 1,
          borderColor: invalido ? t.color.danger : t.color.border,
          backgroundColor: t.color.bg,
          paddingHorizontal: t.spacing.md,
          color: t.color.textPrimary,
          ...t.typography.scale.bodyL,
        }}
      />
    </View>
  );
}

/**
 * Titular de la orientación: color + TEXTO + icono (regla del sistema visual, nunca solo color).
 * Consumo propio → azul informativo; indicios de tráfico → magenta (salto a la vía penal).
 */
function ResultadoOrientacion({ t, orientacion }: { t: Theme; orientacion: OrientacionCalculada }) {
  const esTrafico = orientacion.resultado.orientacion === 'indicios_trafico';
  const colors = esTrafico ? t.severity.delito : { bg: t.color.infoBg, fg: t.color.info, solid: t.color.info };
  const Icon = esTrafico ? Scale : Info;

  return (
    <View
      accessibilityRole="text"
      style={{
        flexDirection: 'row',
        gap: t.spacing.sm,
        borderRadius: t.radius.md,
        backgroundColor: colors.bg,
        padding: t.spacing.md,
      }}
    >
      <Icon size={22} color={colors.solid} strokeWidth={2} />
      <View style={{ flex: 1, gap: t.spacing.xxs }}>
        <Text style={{ color: colors.fg, ...t.typography.scale.bodyStrong }}>
          {orientacion.resultado.titulo}
        </Text>
        {orientacion.purezaAplicada !== null ? (
          <Text style={{ color: colors.fg, ...t.typography.scale.caption }}>
            {`Comparado sobre ${orientacion.cantidadComparadaG.toLocaleString('es-ES', { maximumFractionDigits: 3 })} g de sustancia pura (pureza ${orientacion.purezaAplicada.toLocaleString('es-ES')} %).`}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
