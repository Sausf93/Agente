import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Gravedad, TipoInfraccion } from '@agente/shared';
import { useAppTheme } from '@/ui/useAppTheme';
import type { Theme } from '@/ui/theme';
import { Badge } from '@/ui/components/Badge';
import { Banner } from '@/ui/components/Banner';
import { Card } from '@/ui/components/Card';
import { SeverityChip } from '@/ui/components/SeverityChip';
import { CopyBulletinButton } from '@/ui/components/CopyBulletinButton';
import { getContentRunner } from '@/db/contentDb';
import { cargarFicha, type FichaInfraccion } from './ficha';
import {
  CONSECUENCIA_LABEL,
  formatCompetencia,
  formatEuros,
  formatFecha,
} from './format';

/**
 * FICHA de infracción (§4.4). Muestra los campos EN ORDEN: título, norma+artículo,
 * gravedad/tipo, importes/puntos, TEXTO DE BOLETÍN con "Copiar boletín" SOBRE EL PLIEGUE
 * (ADR-004), consecuencias con su fuente (§4.6, orientativas), competencia, artículo completo
 * (desplegable) + enlace al BOE, y el pie "Actualizado el… · Fuente".
 *
 * Si la infracción está `pendiente_revision`, muestra el distintivo "A verificar" y, si la hay,
 * la nota de qué confirmar (contrato del pipeline, §8.2/8.3).
 */
export interface FichaScreenProps {
  infraccionId: string;
}

const TIPO_LABEL: Record<TipoInfraccion, string> = {
  administrativa: 'Vía administrativa',
  penal: 'Vía penal',
};

type EstadoCarga = 'cargando' | 'ok' | 'no-encontrada' | 'sin-contenido';

export function FichaScreen({ infraccionId }: FichaScreenProps) {
  const t = useAppTheme();
  const insets = useSafeAreaInsets();

  const [estado, setEstado] = useState<EstadoCarga>('cargando');
  const [ficha, setFicha] = useState<FichaInfraccion | null>(null);
  const [varianteIdx, setVarianteIdx] = useState<number | null>(null);
  const [articuloAbierto, setArticuloAbierto] = useState(false);

  useEffect(() => {
    let vivo = true;
    (async () => {
      const runner = await getContentRunner();
      if (!vivo) return;
      if (!runner) {
        setEstado('sin-contenido');
        return;
      }
      const f = await cargarFicha(runner, infraccionId);
      if (!vivo) return;
      if (!f) {
        setEstado('no-encontrada');
        return;
      }
      setFicha(f);
      setEstado('ok');
    })();
    return () => {
      vivo = false;
    };
  }, [infraccionId]);

  // Texto que se copia: el del boletín + la variante elegida (si hay).
  const textoCopiable = useMemo(() => {
    if (!ficha) return '';
    if (varianteIdx !== null && ficha.variantesBoletin[varianteIdx]) {
      return `${ficha.textoBoletin} ${ficha.variantesBoletin[varianteIdx].texto}`;
    }
    return ficha.textoBoletin;
  }, [ficha, varianteIdx]);

  if (estado === 'cargando') {
    return (
      <View style={{ flex: 1, backgroundColor: t.color.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={t.color.brand} />
      </View>
    );
  }

  if (estado !== 'ok' || !ficha) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: t.color.bg,
          padding: t.spacing.base,
          paddingTop: insets.top + t.spacing.xl,
          gap: t.spacing.sm,
        }}
      >
        <Text style={{ color: t.color.textPrimary, ...t.typography.scale.titleM }}>
          {estado === 'sin-contenido' ? 'Contenido no disponible' : 'No encontrada'}
        </Text>
        <Text style={{ color: t.color.textSecondary, ...t.typography.scale.body }}>
          {estado === 'sin-contenido'
            ? 'La ficha necesita el paquete de contenido, disponible en la app móvil.'
            : 'No hemos encontrado esta infracción en el contenido instalado.'}
        </Text>
      </View>
    );
  }

  const pendiente = ficha.estadoRevision === 'pendiente_revision';

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.color.bg }}
      contentContainerStyle={{
        padding: t.spacing.base,
        paddingBottom: insets.bottom + t.spacing.xxl,
        gap: t.spacing.lg,
      }}
    >
      {/* 1-3. Cabecera: título, norma+artículo, gravedad/tipo + distintivo de revisión. */}
      <View style={{ gap: t.spacing.sm }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.xs, alignItems: 'center' }}>
          <SeverityChip gravedad={ficha.gravedad as Gravedad} />
          <Badge label={TIPO_LABEL[ficha.tipo]} tone={ficha.tipo === 'penal' ? 'danger' : 'neutral'} />
          {pendiente ? <Badge label="A verificar" tone="warning" /> : null}
        </View>
        <Text
          accessibilityRole="header"
          maxFontSizeMultiplier={1.6}
          style={{ color: t.color.textPrimary, ...t.typography.scale.titleXL }}
        >
          {ficha.tituloCorto}
        </Text>
        <Text style={{ color: t.color.textSecondary, ...t.typography.scale.bodyStrong }}>
          {ficha.normaCodigo} · art. {ficha.articuloNumero}
        </Text>
      </View>

      {/* 4. Importe / reducido (pronto pago) / puntos. */}
      <Card>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.xl }}>
          <Dato t={t} etiqueta="Importe" valor={formatEuros(ficha.importeEur)} />
          {ficha.importeReducidoEur !== null ? (
            <Dato t={t} etiqueta="Pronto pago" valor={formatEuros(ficha.importeReducidoEur)} />
          ) : null}
          <Dato t={t} etiqueta="Puntos" valor={ficha.puntos !== null ? String(ficha.puntos) : '—'} />
        </View>
      </Card>

      {/* 5. Texto de boletín + "Copiar boletín" SOBRE EL PLIEGUE (ADR-004). */}
      <View style={{ gap: t.spacing.sm }}>
        <Text style={{ color: t.color.textPrimary, ...t.typography.scale.label }}>
          Texto para el boletín
        </Text>
        <Card>
          <Text
            maxFontSizeMultiplier={1.6}
            style={{ color: t.color.textPrimary, ...t.typography.scale.body }}
          >
            {ficha.textoBoletin}
          </Text>
        </Card>

        {ficha.variantesBoletin.length > 0 ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm }}>
            {ficha.variantesBoletin.map((v, i) => {
              const activo = i === varianteIdx;
              return (
                <Pressable
                  key={v.etiqueta}
                  accessibilityRole="button"
                  accessibilityState={{ selected: activo }}
                  onPress={() => setVarianteIdx(activo ? null : i)}
                  style={{
                    minHeight: t.touch.min,
                    justifyContent: 'center',
                    borderRadius: t.radius.pill,
                    borderWidth: 1,
                    borderColor: activo ? t.color.brand : t.color.border,
                    backgroundColor: activo ? t.color.infoBg : t.color.surface,
                    paddingHorizontal: t.spacing.md,
                  }}
                >
                  <Text
                    style={{
                      color: activo ? t.color.brand : t.color.textSecondary,
                      ...t.typography.scale.label,
                    }}
                  >
                    {v.etiqueta}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        <CopyBulletinButton texto={textoCopiable} />
      </View>

      {/* 6. Consecuencias con su fuente (orientativas, §4.6). */}
      {ficha.consecuencias.length > 0 ? (
        <View style={{ gap: t.spacing.sm }}>
          <Text style={{ color: t.color.textPrimary, ...t.typography.scale.label }}>
            Consecuencias
          </Text>
          {ficha.consecuencias.map((c, i) => (
            <Banner key={`${c.tipo}-${i}`} tone="warning" title={CONSECUENCIA_LABEL[c.tipo]}>
              <Text style={{ color: t.color.textPrimary, ...t.typography.scale.body }}>
                {c.textoCorto}
              </Text>
              <Text style={{ color: t.color.textSecondary, ...t.typography.scale.caption }}>
                Fuente: {c.fuente}
              </Text>
            </Banner>
          ))}
          <Text style={{ color: t.color.textTertiary, ...t.typography.scale.caption }}>
            Orientación con su fuente; la valoración final corresponde al agente y, en su caso, a
            la autoridad judicial.
          </Text>
        </View>
      ) : null}

      {/* 7. Competencia. */}
      <View style={{ gap: t.spacing.xs }}>
        <Text style={{ color: t.color.textPrimary, ...t.typography.scale.label }}>Competencia</Text>
        <Text style={{ color: t.color.textSecondary, ...t.typography.scale.body }}>
          {formatCompetencia(ficha.competencia)}
        </Text>
      </View>

      {/* 8. Artículo completo (desplegable) + enlace al BOE. */}
      <View style={{ gap: t.spacing.sm }}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: articuloAbierto }}
          onPress={() => setArticuloAbierto((v) => !v)}
          style={{ minHeight: t.touch.min, justifyContent: 'center' }}
        >
          <Text style={{ color: t.color.brand, ...t.typography.scale.label }}>
            {articuloAbierto ? 'Ocultar artículo' : 'Ver artículo completo'}
            {ficha.articuloTitulo ? ` · ${ficha.articuloTitulo}` : ''}
          </Text>
        </Pressable>
        {articuloAbierto ? (
          <Card>
            <Text
              maxFontSizeMultiplier={1.6}
              style={{ color: t.color.textPrimary, ...t.typography.scale.body }}
            >
              {ficha.articuloTexto}
            </Text>
          </Card>
        ) : null}
        {ficha.urlBoe ? (
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Abrir la norma consolidada en el BOE"
            onPress={() => void Linking.openURL(ficha.urlBoe as string)}
            style={{ minHeight: t.touch.min, justifyContent: 'center' }}
          >
            <Text style={{ color: t.color.brand, ...t.typography.scale.label }}>
              Abrir en el BOE ↗
            </Text>
          </Pressable>
        ) : null}
      </View>

      {/* Nota de revisión, si procede. */}
      {pendiente && ficha.notaRevision ? (
        <Banner tone="warning" title="Pendiente de revisión">
          {ficha.notaRevision}
        </Banner>
      ) : null}

      {/* 10. Pie: "Actualizado el… · Fuente". */}
      <View style={{ gap: t.spacing.xxs, marginTop: t.spacing.sm }}>
        {ficha.actualizadoEn ? (
          <Text style={{ color: t.color.textTertiary, ...t.typography.scale.caption }}>
            Actualizado el {formatFecha(ficha.actualizadoEn)}
          </Text>
        ) : null}
        <Text style={{ color: t.color.textTertiary, ...t.typography.scale.caption }}>
          Fuente: {ficha.normaCodigo} art. {ficha.articuloNumero}
        </Text>
      </View>
    </ScrollView>
  );
}

function Dato({ t, etiqueta, valor }: { t: Theme; etiqueta: string; valor: string }) {
  return (
    <View style={{ gap: t.spacing.xxs }}>
      <Text style={{ color: t.color.textSecondary, ...t.typography.scale.caption }}>{etiqueta}</Text>
      <Text
        style={{
          color: t.color.textPrimary,
          ...t.typography.scale.titleM,
          fontVariant: ['tabular-nums'],
        }}
      >
        {valor}
      </Text>
    </View>
  );
}
