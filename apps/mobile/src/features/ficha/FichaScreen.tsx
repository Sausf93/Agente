import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import type { ComponentType } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import {
  Ban,
  FileDown,
  FileText,
  FileWarning,
  Fingerprint,
  Gavel,
  Lock,
  Truck,
  WifiOff,
  type LucideProps,
} from 'lucide-react-native';
import type { Gravedad, TipoConsecuencia, TipoInfraccion } from '@agente/shared';
import { useAppTheme } from '@/ui/useAppTheme';
import type { Theme } from '@/ui/theme';
import { severityFromGravedad, severityMeta } from '@/ui/theme';
import { Badge } from '@/ui/components/Badge';
import { Banner } from '@/ui/components/Banner';
import { Button } from '@/ui/components/Button';
import { Card } from '@/ui/components/Card';
import { EmptyState } from '@/ui/components/EmptyState';
import { SeverityChip } from '@/ui/components/SeverityChip';
import { SkeletonLine } from '@/ui/components/Skeleton';
import { CopyBulletinButton } from '@/ui/components/CopyBulletinButton';
import { hapticAlert } from '@/ui/haptics';
import { getContentRunner } from '@/db/contentDb';
import { recordUso } from '@/db/userDb';
import { FavoriteToggle } from '@/features/inicio/FavoriteToggle';
import type { InfraccionSnapshot } from '@/features/inicio/masUsadas';
import { cargarFicha, type FichaInfraccion } from './ficha';
import { DetencionTree } from './DetencionTree';
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
  const router = useRouter();

  const [estado, setEstado] = useState<EstadoCarga>('cargando');
  const [ficha, setFicha] = useState<FichaInfraccion | null>(null);
  const [varianteIdx, setVarianteIdx] = useState<number | null>(null);
  const [articuloAbierto, setArticuloAbierto] = useState(false);
  const alertaDisparada = useRef(false);

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

  // Snapshot DESNORMALIZADO para favoritos y "tus más usadas" (§4.2/§6.2). Anónimo y local.
  const snapshot = useMemo<InfraccionSnapshot | null>(() => {
    if (!ficha) return null;
    return {
      infraccionId: ficha.infraccionId,
      tituloCorto: ficha.tituloCorto,
      gravedad: ficha.gravedad,
      normaCodigo: ficha.normaCodigo,
      articuloNumero: ficha.articuloNumero,
      importeEur: ficha.importeEur,
    };
  }, [ficha]);

  // Registra la CONSULTA de la ficha (una vez por apertura). Contador local y anónimo.
  useEffect(() => {
    if (!snapshot) return;
    void recordUso(snapshot, 'consulta', new Date().toISOString());
  }, [snapshot]);

  // Alerta HÁPTICA (una sola vez) al abrir una ficha muy grave o delito (mapa háptico, 01-ux §4.6).
  useEffect(() => {
    if (estado !== 'ok' || !ficha || alertaDisparada.current) return;
    if (ficha.gravedad === 'muy_grave' || ficha.gravedad === 'delito') {
      alertaDisparada.current = true;
      hapticAlert();
    }
  }, [estado, ficha]);

  if (estado === 'cargando') {
    return <FichaCargando t={t} insets={insets} />;
  }

  if (estado !== 'ok' || !ficha) {
    return (
      <View style={{ flex: 1, backgroundColor: t.color.bg, paddingTop: insets.top }}>
        <EmptyState
          icon={estado === 'sin-contenido' ? WifiOff : FileWarning}
          title={estado === 'sin-contenido' ? 'Contenido no disponible' : 'No encontrada'}
          message={
            estado === 'sin-contenido'
              ? 'La ficha necesita el paquete de contenido, disponible en la app móvil.'
              : 'No hemos encontrado esta infracción en el contenido instalado.'
          }
          actionLabel="Volver"
          onAction={() => router.back()}
        />
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
      {/* El encabezado se adapta: un delito NO es una "infracción" administrativa. */}
      <Stack.Screen options={{ title: ficha.tipo === 'penal' ? 'Delito' : 'Infracción' }} />

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

      {/* 4. Importe / reducido (pronto pago) / puntos: TILES grandes, número "de refilón" (§7.2). */}
      <View style={{ flexDirection: 'row', gap: t.spacing.sm }}>
        {/* El IMPORTE manda: tile con énfasis de acento (el dato que el agente busca primero). */}
        <Tile t={t} etiqueta="Importe" valor={formatEuros(ficha.importeEur)} enfasis />
        <Tile
          t={t}
          etiqueta="Pronto pago"
          valor={ficha.importeReducidoEur !== null ? formatEuros(ficha.importeReducidoEur) : '—'}
        />
        <Tile t={t} etiqueta="Puntos" valor={ficha.puntos !== null ? String(ficha.puntos) : '—'} />
      </View>

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
                    borderColor: activo ? t.color.accent : t.color.border,
                    backgroundColor: activo ? t.color.accentWeak : t.color.surface,
                    paddingHorizontal: t.spacing.md,
                  }}
                >
                  <Text
                    style={{
                      color: activo ? t.color.accent : t.color.textSecondary,
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

        <CopyBulletinButton
          texto={textoCopiable}
          onCopied={() => {
            // Copiar el boletín es la señal más fuerte de "uso real": pesa en "tus más usadas".
            if (snapshot) void recordUso(snapshot, 'copia', new Date().toISOString());
          }}
        />

        {/* Acción "Favorito" (§4.4 punto 9): guardar/quitar de "Tus favoritas". */}
        {snapshot ? <FavoriteToggle snapshot={snapshot} /> : null}

        {/* 9. Generar documento: prerrellena el boletín con norma, artículo, importe y hecho. */}
        <Button
          title="Generar documento"
          variant="secondary"
          icon={FileDown}
          accessibilityHint="Abre el boletín de denuncia con estos datos ya rellenos"
          onPress={() => {
            const params: Record<string, string> = {
              plantillaId: 'seed-boletin-denuncia',
              norma: ficha.normaCodigo,
              articulo: `art. ${ficha.articuloNumero}`,
              hecho: textoCopiable,
              gravedad: severityMeta[severityFromGravedad(ficha.gravedad)].label,
            };
            if (ficha.importeEur !== null) params.importe = formatEuros(ficha.importeEur);
            if (ficha.puntos !== null) params.puntos = String(ficha.puntos);
            router.push({ pathname: '/documento/[plantillaId]', params });
          }}
        />
      </View>

      {/* 6. Consecuencias con su fuente (orientativas, §4.6). */}
      {ficha.consecuencias.length > 0 ? (
        <View style={{ gap: t.spacing.sm }}>
          <Text style={{ color: t.color.textPrimary, ...t.typography.scale.label }}>
            Consecuencias
          </Text>
          {ficha.consecuencias.map((c, i) => (
            <View key={`${c.tipo}-${i}`} style={{ gap: t.spacing.sm }}>
              <FilaConsecuencia
                t={t}
                tipo={c.tipo}
                textoCorto={c.textoCorto}
                fuente={c.fuente}
              />
              {/* Árbol de detención interactivo (§4.6): solo para la consecuencia `detencion`. */}
              {c.tipo === 'detencion' ? <DetencionTree regla={c.regla} /> : null}
            </View>
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

/**
 * Tile de dato clave (importe / pronto pago / puntos): número grande y etiqueta pequeña (§7.2).
 *
 * `enfasis` marca el dato que el agente busca primero (el IMPORTE): borde y fondo de acento
 * sutiles para que "gane" sin romper la retícula. `acento` solo tiñe el número (pronto pago).
 */
function Tile({
  t,
  etiqueta,
  valor,
  acento = false,
  enfasis = false,
}: {
  t: Theme;
  etiqueta: string;
  valor: string;
  acento?: boolean;
  enfasis?: boolean;
}) {
  return (
    <View
      style={{
        flex: 1,
        borderRadius: t.radius.md,
        borderWidth: enfasis ? 1.5 : 1,
        borderColor: enfasis ? t.color.accent : t.color.border,
        backgroundColor: enfasis ? t.color.accentWeak : t.color.surface,
        paddingVertical: t.spacing.md,
        paddingHorizontal: t.spacing.sm,
        gap: t.spacing.xxs,
      }}
    >
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        maxFontSizeMultiplier={1.4}
        style={{
          color: enfasis || acento ? t.color.accent : t.color.textPrimary,
          ...t.typography.scale.displayL,
          fontVariant: ['tabular-nums'],
        }}
      >
        {valor}
      </Text>
      <Text style={{ color: t.color.textSecondary, ...t.typography.scale.caption }}>{etiqueta}</Text>
    </View>
  );
}

/**
 * Icono por tipo de consecuencia. Neutros por defecto; solo la COERCITIVA (`detencion`) recibe un
 * icono fuerte para que resalte de verdad (una detención pesa más que una grúa). No cambia el
 * lenguaje orientativo ni los colores de gravedad (que son fijos): el color aquí es de acción, no
 * de gravedad.
 */
const CONSECUENCIA_ICON: Record<TipoConsecuencia, ComponentType<LucideProps>> = {
  detencion: Gavel,
  inmovilizacion: Lock,
  deposito: Truck,
  decomiso: Ban,
  retirada_permiso: FileText,
  identificacion: Fingerprint,
};

/**
 * Fila-tarjeta de una consecuencia (auditoría de pulido, ficha §ALTA). Sustituye el "muro de
 * banners naranjas": superficie neutra con icono a la izquierda; solo la detención (coercitiva)
 * usa color `danger` para destacar. Título + texto + fuente, con jerarquía clara.
 */
function FilaConsecuencia({
  t,
  tipo,
  textoCorto,
  fuente,
}: {
  t: Theme;
  tipo: TipoConsecuencia;
  textoCorto: string;
  fuente: string;
}) {
  const Icon = CONSECUENCIA_ICON[tipo] ?? FileText;
  const coercitiva = tipo === 'detencion';
  const iconColor = coercitiva ? t.color.danger : t.color.textSecondary;
  const iconBg = coercitiva ? t.color.dangerBg : t.color.surfaceAlt;
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: t.spacing.md,
        borderRadius: t.radius.md,
        borderWidth: 1,
        borderColor: coercitiva ? t.color.danger : t.color.border,
        backgroundColor: t.color.surface,
        padding: t.spacing.md,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: t.radius.md,
          backgroundColor: iconBg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={22} color={iconColor} strokeWidth={2} />
      </View>
      <View style={{ flex: 1, gap: t.spacing.xxs }}>
        <Text
          style={{
            color: coercitiva ? t.color.danger : t.color.textPrimary,
            ...t.typography.scale.bodyStrong,
          }}
        >
          {CONSECUENCIA_LABEL[tipo]}
        </Text>
        <Text maxFontSizeMultiplier={1.6} style={{ color: t.color.textPrimary, ...t.typography.scale.body }}>
          {textoCorto}
        </Text>
        <Text style={{ color: t.color.textSecondary, ...t.typography.scale.caption }}>
          Fuente: {fuente}
        </Text>
      </View>
    </View>
  );
}

/** Esqueleto de carga de la ficha: sustituye al spinner que "salta" (P1-10). */
function FichaCargando({ t, insets }: { t: Theme; insets: { top: number } }) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: t.color.bg,
        padding: t.spacing.base,
        paddingTop: insets.top + t.spacing.xl,
        gap: t.spacing.lg,
      }}
    >
      <SkeletonLine width="40%" height={28} radius={t.radius.pill} />
      <SkeletonLine width="80%" height={30} />
      <SkeletonLine width="55%" height={16} />
      <View style={{ flexDirection: 'row', gap: t.spacing.sm, marginTop: t.spacing.sm }}>
        <SkeletonLine width="32%" height={72} radius={t.radius.md} />
        <SkeletonLine width="32%" height={72} radius={t.radius.md} />
        <SkeletonLine width="32%" height={72} radius={t.radius.md} />
      </View>
      <SkeletonLine width="100%" height={96} radius={t.radius.md} />
      <SkeletonLine width="100%" height={54} radius={t.radius.md} />
    </View>
  );
}
