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
  ArrowRightCircle,
  Ban,
  DoorClosed,
  FileDown,
  FileText,
  FileWarning,
  Fingerprint,
  Gavel,
  Info,
  Lock,
  MessageSquareWarning,
  ShieldCheck,
  Truck,
  WifiOff,
  type LucideProps,
} from 'lucide-react-native';
import type { Gravedad, GravedadPenal, TipoConsecuencia, TipoInfraccion } from '@agente/shared';
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
import {
  accionOperativaFrom,
  cargarFicha,
  esConsultableSinSancion,
  tilesFicha,
  type AccionOperativa,
  type AccionOperativaKind,
  type FichaInfraccion,
  type TileFicha,
} from './ficha';
import { DetencionTree } from './DetencionTree';
import { reportarErrorFichaLink } from './reportarError';
import {
  CONSECUENCIA_LABEL,
  formatCompetencia,
  formatEuros,
  formatFecha,
} from './format';

/**
 * FICHA de infracción (§4.4). Orden LEER-PRIMERO: título, norma+artículo, gravedad/tipo, ACCIÓN
 * OPERATIVA (qué hace el agente con el vehículo/persona: sigue/inmoviliza/grúa/detención) ARRIBA
 * DEL TODO, importes/puntos, TEXTO DE BOLETÍN con "Copiar boletín" SOBRE EL PLIEGUE (ADR-004),
 * consecuencias detalladas con su fuente (§4.6, orientativas), competencia, artículo completo
 * (desplegable) + enlace al BOE, y el pie "Actualizado el… · Fuente".
 *
 * Si la infracción está `pendiente_revision`, muestra un distintivo DISCRETO "Borrador beta" y un
 * banner que da CONFIANZA (cotejado con la fuente, pendiente de 2ª revisión), no que la reste: el
 * contenido está en beta y su verificación final es una decisión legal humana.
 */
export interface FichaScreenProps {
  infraccionId: string;
}

const TIPO_LABEL: Record<TipoInfraccion, string> = {
  administrativa: 'Vía administrativa',
  penal: 'Vía penal',
};

/**
 * El bloque de copia habla el idioma de la vía (D4 del rediseño): un delito NO se denuncia con
 * "boletín" ni arrastra importe/puntos (que en penal no existen), se documenta en diligencia/
 * atestado. `plantillaId` es la plantilla que prerrellena "Generar documento": la vía penal abre
 * la DILIGENCIA de identificación (sin campos de importe/puntos), la administrativa el boletín.
 */
const COPIA: Record<TipoInfraccion, {
  label: string;
  copiar: string;
  generar: string;
  plantillaId: string;
}> = {
  administrativa: {
    label: 'Texto para el boletín',
    copiar: 'Copiar boletín',
    generar: 'Generar boletín',
    plantillaId: 'seed-boletin-denuncia',
  },
  penal: {
    label: 'Texto para el atestado',
    copiar: 'Copiar para el atestado',
    generar: 'Generar diligencia',
    plantillaId: 'seed-diligencia-identificacion',
  },
};

/** Etiqueta legible de la gravedad penal (art. 33 CP). Escala distinta a la gravedad administrativa. */
const GRAVEDAD_PENAL_LABEL: Record<GravedadPenal, string> = {
  leve: 'Leve',
  menos_grave: 'Menos grave',
  grave: 'Grave',
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
  const esPenal = ficha.fichaKind === 'penal';
  // Entrada CONSULTABLE que no sanciona (facultad/diligencia, p. ej. el requerimiento de
  // identificación del art. 16 LOSC): sin chip de gravedad ni tile de tramo (no hay sanción).
  const consultable = esConsultableSinSancion(ficha);
  const copia = COPIA[ficha.tipo];
  // Tiles adaptativos (solo con valor; ninguno en un delito → usa el "Marco penal").
  const tiles = tilesFicha(ficha, formatEuros);
  // ACCIÓN OPERATIVA (leer-primero): QUÉ HACE el agente con el vehículo/persona. Se deriva del set
  // de consecuencias y se pinta ARRIBA DEL TODO con color semántico FIJO (verde "sigue" / rojo).
  const accion = accionOperativaFrom({
    fichaKind: ficha.fichaKind,
    // Se pasa `textoCorto` (para que el banner use el texto REVISADO de cada consecuencia: MENA
    // protege al menor, VG a la víctima) y la señal `consultable` (una entrada sin sanción sin
    // medida NO debe caer al verde "se formula la denuncia").
    consecuencias: ficha.consecuencias.map((c) => ({
      tipo: c.tipo,
      fuente: c.fuente,
      textoCorto: c.textoCorto,
    })),
    consultable,
  });
  // La DETENCIÓN se separa del resto: en un delito sube arriba (leer-primero), no va enterrada.
  const consecuenciaDetencion = ficha.consecuencias.find((c) => c.tipo === 'detencion') ?? null;
  // La PROTECCIÓN de la víctima (violencia de género) también sube DESTACADA junto a la detención:
  // no debe quedar enterrada entre "otras consecuencias".
  const consecuenciaProteccion = ficha.consecuencias.find((c) => c.tipo === 'proteccion') ?? null;
  // En un delito, detención y protección suben arriba (leer-primero); en una ficha NO penal, la
  // protección se queda en la lista normal (no hay bloque penal donde destacarla).
  const otrasConsecuencias = esPenal
    ? ficha.consecuencias.filter((c) => c.tipo !== 'detencion' && c.tipo !== 'proteccion')
    : ficha.consecuencias;

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

      {/* 1-3. Cabecera LEER-PRIMERO: TÍTULO grande primero, luego norma+artículo, luego las
          insignias (D7). En un delito, UNA sola insignia penal "Delito · vía penal" (D6): sin
          duplicar el chip de gravedad y el badge de vía, que decían casi lo mismo con dos rojos. */}
      <View style={{ gap: t.spacing.sm }}>
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
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.xs, alignItems: 'center' }}>
          {esPenal ? (
            <PenalChip t={t} />
          ) : consultable ? (
            // Entrada sin sanción: NO se pinta gravedad ni tramo (no existen); solo la vía y un
            // distintivo neutro "Consulta · sin sanción" para que quede claro que no es una multa.
            <>
              <Badge label="Consulta · sin sanción" tone="neutral" />
              <Badge label={TIPO_LABEL[ficha.tipo]} tone="neutral" />
            </>
          ) : (
            <>
              <SeverityChip gravedad={ficha.gravedad as Gravedad} />
              <Badge label={TIPO_LABEL[ficha.tipo]} tone="neutral" />
            </>
          )}
          {pendiente ? <Badge label="Borrador beta" tone="neutral" /> : null}
        </View>
      </View>

      {/* ACCIÓN OPERATIVA, leer-primero: lo que el agente decide ANTES que el importe. Verde
          "sigue" o rojo coercitivo; color semántico FIJO (no el acento por cuerpo). */}
      {accion ? <AccionOperativaBanner t={t} accion={accion} /> : null}

      {esPenal ? (
        <>
          {/* 4a. MARCO PENAL (sustituye a los tiles de tráfico): la PENA y la gravedad art. 33 CP. */}
          <MarcoPenal t={t} penaTexto={ficha.penaTexto} gravedadPenal={ficha.gravedadPenal} />

          {/* 4b. DETENCIÓN, leer-primero y ARRIBA: en un delito, "qué procede" es LA decisión. */}
          {consecuenciaDetencion ? (
            <DetencionTree regla={consecuenciaDetencion.regla} />
          ) : null}

          {/* 4c. PROTECCIÓN de la víctima (violencia de género), DESTACADA junto a la detención:
              orden de protección + valoración de riesgo. La acuerda la autoridad judicial. */}
          {consecuenciaProteccion ? (
            <ProteccionBanner t={t} consecuencia={consecuenciaProteccion} />
          ) : null}
        </>
      ) : tiles.length > 0 ? (
        /* 4. Tiles de datos ADAPTATIVOS: solo los que tienen valor (nunca "—"). El importe manda. */
        <View style={{ flexDirection: 'row', gap: t.spacing.sm }}>
          {tiles.map((tile) => (
            <Tile key={tile.etiqueta} t={t} tile={tile} solo={tiles.length === 1} />
          ))}
        </View>
      ) : null}

      {/* 5. Texto para boletín/atestado + copiar SOBRE EL PLIEGUE (ADR-004), idioma según la vía. */}
      <View style={{ gap: t.spacing.sm }}>
        <Text style={{ color: t.color.textPrimary, ...t.typography.scale.label }}>
          {copia.label}
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
          label={copia.copiar}
          onCopied={() => {
            // Copiar el boletín es la señal más fuerte de "uso real": pesa en "tus más usadas".
            if (snapshot) void recordUso(snapshot, 'copia', new Date().toISOString());
          }}
        />

        {/* Acción "Favorito" (§4.4 punto 9): guardar/quitar de "Tus favoritas". */}
        {snapshot ? <FavoriteToggle snapshot={snapshot} /> : null}

        {/* 9. Generar documento: prerrellena la plantilla con norma, artículo, importe y hecho.
            El título habla el idioma de la vía ("Generar boletín" / "Generar diligencia"). */}
        <Button
          title={copia.generar}
          variant="secondary"
          icon={FileDown}
          accessibilityHint="Abre el documento con estos datos ya rellenos"
          onPress={() => {
            const precepto = `${ficha.normaCodigo} art. ${ficha.articuloNumero}`;
            if (esPenal) {
              // Vía PENAL → diligencia: NADA de importe/puntos/gravedad administrativa (no existen
              // en un delito). Se prerrellena el motivo con el hecho y el amparo con el precepto.
              router.push({
                pathname: '/documento/[plantillaId]',
                params: {
                  plantillaId: copia.plantillaId,
                  motivo: textoCopiable,
                  amparo: precepto,
                  // Título corto de la infracción para la línea "Nace de:" (dato del agente).
                  origenTitulo: ficha.tituloCorto,
                },
              });
              return;
            }
            // Vía ADMINISTRATIVA → boletín: norma, artículo, hecho e importe/puntos si los hay.
            const params: Record<string, string> = {
              plantillaId: copia.plantillaId,
              norma: ficha.normaCodigo,
              articulo: `art. ${ficha.articuloNumero}`,
              hecho: textoCopiable,
              gravedad: severityMeta[severityFromGravedad(ficha.gravedad)].label,
              // Título corto de la infracción para la línea "Nace de:" (dato del agente).
              origenTitulo: ficha.tituloCorto,
            };
            if (ficha.importeEur !== null) params.importe = formatEuros(ficha.importeEur);
            if (ficha.puntos !== null) params.puntos = String(ficha.puntos);
            router.push({ pathname: '/documento/[plantillaId]', params });
          }}
        />
      </View>

      {/* 6. Consecuencias con su fuente (orientativas, §4.6). En un delito, la detención ya se
          pintó arriba (leer-primero): aquí van "Otras consecuencias" (decomiso, identificación…). */}
      {otrasConsecuencias.length > 0 ? (
        <View style={{ gap: t.spacing.sm }}>
          <Text style={{ color: t.color.textPrimary, ...t.typography.scale.label }}>
            {esPenal ? 'Otras consecuencias' : 'Consecuencias'}
          </Text>
          {otrasConsecuencias.map((c, i) => (
            <View key={`${c.tipo}-${i}`} style={{ gap: t.spacing.sm }}>
              <FilaConsecuencia
                t={t}
                tipo={c.tipo}
                textoCorto={c.textoCorto}
                fuente={c.fuente}
              />
              {/* Árbol de detención interactivo (§4.6): solo para la consecuencia `detencion`
                  en fichas NO penales (en un delito ya va arriba, extraída del mapa). */}
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

      {/* Distintivo de BETA que da CONFIANZA en vez de restarla (pulido pre-beta, validación GC): un
          "En revisión" a secas hacía dudar del dato para un boletín, aunque la ficha SÍ lleva
          artículo fuente + fecha (arriba y al pie). El mensaje es honesto —cotejado con la fuente,
          pendiente de 2ª revisión— y enlaza con el botón "¿Ves algo mal?" del pie. NO afirma
          "verificado": la aprobación final es una decisión legal humana. La `notaRevision` es una
          nota interna de QA (contrato del pipeline, §8.2/8.3) que no se vuelca cruda al agente. */}
      {pendiente ? (
        <Banner tone="info" title="Borrador beta">
          Cotejado con el BOE (tienes el artículo y la fecha a la vista, arriba y al pie); pendiente
          de una segunda revisión antes de publicarlo. Si ves algo que no cuadre, avísanos con el
          botón de aquí abajo.
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

      {/* Gancho "reportar error de contenido" (§4.15, ADR-011): el socio (guardia real) avisa de un
          dato mal con un toque. Coherente con que el contenido está EN REVISIÓN durante la beta.
          Abre el formulario de feedback PRERRELLENADO (tipo + infracción + pantalla); no captura
          datos de terceros: el socio escribe el texto y la pantalla de feedback avisa. */}
      <ReportarError t={t} infraccionId={ficha.infraccionId} />
    </ScrollView>
  );
}

/**
 * Acción DISCRETA al pie de la ficha para reportar un dato incorrecto. Abre `app/feedback.tsx`
 * con el tipo `error_contenido` ya elegido y el contexto de la infracción (ver `reportarError.ts`).
 * Tono cercano y orientativo, en línea con el badge/banner "Borrador beta".
 */
function ReportarError({ t, infraccionId }: { t: Theme; infraccionId: string }) {
  const router = useRouter();
  const link = reportarErrorFichaLink(infraccionId);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Reportar un dato de esta ficha"
      accessibilityHint="Abre el formulario para avisarnos de un error en el contenido"
      onPress={() => router.push(link)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: t.spacing.sm,
        minHeight: t.touch.min,
        borderRadius: t.radius.md,
        borderWidth: 1,
        borderColor: t.color.border,
        backgroundColor: t.color.surface,
        paddingHorizontal: t.spacing.md,
        paddingVertical: t.spacing.sm,
      }}
    >
      <MessageSquareWarning size={20} color={t.color.textSecondary} strokeWidth={2} />
      <View style={{ flex: 1, gap: t.spacing.xxs }}>
        <Text style={{ color: t.color.textPrimary, ...t.typography.scale.label }}>
          ¿Ves algo mal? Avísanos
        </Text>
        <Text style={{ color: t.color.textSecondary, ...t.typography.scale.caption }}>
          Si algo no cuadra con la norma o falta un supuesto, cuéntamelo.
        </Text>
      </View>
    </Pressable>
  );
}

/**
 * Tile de dato clave (importe / pronto pago / puntos / tramo): número grande y etiqueta pequeña
 * (§7.2). `enfasis` marca el dato que el agente busca primero (el IMPORTE): borde y fondo de
 * acento sutiles para que "gane" sin romper la retícula. `solo` (cuando queda un único tile) evita
 * que se estire a todo el ancho de una retícula de 3 columnas: ocupa un ancho cómodo y para.
 */
function Tile({ t, tile, solo = false }: { t: Theme; tile: TileFicha; solo?: boolean }) {
  const enfasis = tile.enfasis ?? false;
  return (
    <View
      style={{
        flexGrow: solo ? 0 : 1,
        flexShrink: 1,
        flexBasis: solo ? 'auto' : 0,
        minWidth: solo ? 140 : undefined,
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
          color: enfasis ? t.color.accent : t.color.textPrimary,
          ...t.typography.scale.displayL,
          fontVariant: ['tabular-nums'],
        }}
      >
        {tile.valor}
      </Text>
      <Text style={{ color: t.color.textSecondary, ...t.typography.scale.caption }}>
        {tile.etiqueta}
      </Text>
    </View>
  );
}

/**
 * Insignia ÚNICA de un delito (D6): "Delito · vía penal" en la familia de color de gravedad
 * `delito` (magenta, FIJA, no cambia con el cuerpo) + icono de balanza. Sustituye al par
 * redundante SeverityChip "Delito" + Badge "Vía penal". Color + texto + icono (nunca canal único).
 */
function PenalChip({ t }: { t: Theme }) {
  const c = t.severity.delito;
  return (
    <View
      accessible
      accessibilityLabel="Delito, vía penal"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: t.spacing.xs,
        borderRadius: t.radius.pill,
        backgroundColor: c.bg,
        paddingHorizontal: t.spacing.sm,
        paddingVertical: t.spacing.xxs,
        minHeight: t.touch.chipHeight,
      }}
    >
      <Gavel size={16} color={c.fg} strokeWidth={2.2} />
      <Text
        maxFontSizeMultiplier={1.6}
        style={{ color: c.fg, ...t.typography.scale.caption, fontWeight: '700' }}
      >
        Delito · vía penal
      </Text>
    </View>
  );
}

/** Icono de cada acción operativa: refuerza el mensaje (nunca solo color, regla UI 2.4). */
const ACCION_ICON: Record<AccionOperativaKind, ComponentType<LucideProps>> = {
  sigue: ArrowRightCircle,
  consulta: Info,
  inmovilizacion: Lock,
  deposito: Truck,
  decomiso: Ban,
  retirada: FileText,
  identificacion: Fingerprint,
  cese_actividad: DoorClosed,
  proteccion: ShieldCheck,
  detencion: Gavel,
};

/**
 * BANNER de ACCIÓN OPERATIVA (rediseño 2026-09): lo PRIMERO que lee el agente. Resume QUÉ HACE con
 * el vehículo o la persona con color semántico FIJO —verde `sigue` / rojo coercitivo— más icono y
 * texto (nunca solo color). Lenguaje ORIENTATIVO: enuncia la medida, no da órdenes. Lleva su fuente
 * (artículo) cuando la medida nace de una consecuencia.
 */
function AccionOperativaBanner({ t, accion }: { t: Theme; accion: AccionOperativa }) {
  // Color semántico FIJO por tono: verde (sigue), azul (identificación administrativa) o rojo
  // (medida coercitiva). Siempre color + texto + icono (nunca solo color, regla UI 2.4).
  const fg =
    accion.tono === 'positivo'
      ? t.color.success
      : accion.tono === 'informativo'
        ? t.color.info
        : t.color.danger;
  const bg =
    accion.tono === 'positivo'
      ? t.color.successBg
      : accion.tono === 'informativo'
        ? t.color.infoBg
        : t.color.dangerBg;
  const Icon = ACCION_ICON[accion.kind];
  const a11y = `Acción operativa: ${accion.titulo}. ${accion.detalle}${
    accion.fuente ? ` Fuente: ${accion.fuente}.` : ''
  }`;
  return (
    <View
      accessible
      accessibilityLabel={a11y}
      style={{
        flexDirection: 'row',
        gap: t.spacing.md,
        alignItems: 'center',
        borderRadius: t.radius.md,
        borderWidth: 1.5,
        borderColor: fg,
        backgroundColor: bg,
        padding: t.spacing.md,
        minHeight: t.touch.min,
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: t.radius.md,
          backgroundColor: t.color.surface,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={26} color={fg} strokeWidth={2.4} />
      </View>
      <View style={{ flex: 1, gap: t.spacing.xxs }}>
        <Text
          accessibilityElementsHidden
          maxFontSizeMultiplier={1.6}
          style={{ color: fg, ...t.typography.scale.titleM }}
        >
          {accion.titulo}
        </Text>
        <Text
          accessibilityElementsHidden
          maxFontSizeMultiplier={1.6}
          style={{ color: t.color.textPrimary, ...t.typography.scale.body }}
        >
          {accion.detalle}
        </Text>
        {accion.fuente ? (
          <Text
            accessibilityElementsHidden
            style={{ color: t.color.textSecondary, ...t.typography.scale.caption }}
          >
            Fuente: {accion.fuente}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

/**
 * MARCO PENAL (variante `penal`): sustituye a los tiles de tráfico (importe/puntos, que en un
 * delito no existen). Muestra la PENA legible (art. del CP) en grande + un chip NEUTRO con la
 * gravedad del art. 33 CP. El chip es neutro a propósito: la gravedad penal (leve/menos_grave/
 * grave) es OTRA escala que la administrativa y no debe robar su familia de color. Si aún no hay
 * pena en el contenido, se remite al artículo desplegable de abajo.
 */
function MarcoPenal({
  t,
  penaTexto,
  gravedadPenal,
}: {
  t: Theme;
  penaTexto: string | null;
  gravedadPenal: GravedadPenal | null;
}) {
  return (
    <View
      style={{
        borderRadius: t.radius.md,
        borderWidth: 1,
        borderColor: t.color.border,
        backgroundColor: t.color.surfaceAlt,
        padding: t.spacing.md,
        gap: t.spacing.sm,
      }}
    >
      <Text style={{ color: t.color.textSecondary, ...t.typography.scale.caption }}>Pena</Text>
      {penaTexto ? (
        <Text
          maxFontSizeMultiplier={1.6}
          style={{
            color: t.color.textPrimary,
            ...t.typography.scale.titleM,
            fontVariant: ['tabular-nums'],
          }}
        >
          {penaTexto}
        </Text>
      ) : (
        <Text style={{ color: t.color.textSecondary, ...t.typography.scale.body }}>
          Consulta la pena en el artículo, más abajo.
        </Text>
      )}
      {gravedadPenal ? (
        <View
          style={{
            alignSelf: 'flex-start',
            borderRadius: t.radius.pill,
            borderWidth: 1,
            borderColor: t.color.border,
            backgroundColor: t.color.surface,
            paddingHorizontal: t.spacing.sm,
            paddingVertical: t.spacing.xxs,
            minHeight: t.touch.chipHeight,
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: t.color.textSecondary, ...t.typography.scale.caption }}>
            Gravedad penal: {GRAVEDAD_PENAL_LABEL[gravedadPenal]} · art. 33 CP
          </Text>
        </View>
      ) : null}
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
  proteccion: ShieldCheck,
  cese_actividad: DoorClosed,
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

/**
 * BANNER de PROTECCIÓN de la víctima (violencia de género): sube DESTACADO junto a la detención en
 * lugar de quedar enterrado en el texto del boletín. Orden de protección (arts. 544 bis/ter LECrim)
 * y valoración policial del riesgo (VPR/VioGén). Tono INFORMATIVO (no coercitivo): la medida la
 * ACUERDA la autoridad judicial; el agente la propone/documenta. Color fijo (info), no el acento.
 */
function ProteccionBanner({
  t,
  consecuencia,
}: {
  t: Theme;
  consecuencia: { textoCorto: string; fuente: string };
}) {
  return (
    <View
      accessible
      accessibilityLabel={`Protección de la víctima: ${consecuencia.textoCorto}. Fuente: ${consecuencia.fuente}.`}
      style={{
        flexDirection: 'row',
        gap: t.spacing.md,
        borderRadius: t.radius.md,
        borderWidth: 1.5,
        borderColor: t.color.info,
        backgroundColor: t.color.infoBg,
        padding: t.spacing.md,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: t.radius.md,
          backgroundColor: t.color.surface,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ShieldCheck size={22} color={t.color.info} strokeWidth={2.2} />
      </View>
      <View style={{ flex: 1, gap: t.spacing.xxs }}>
        <Text
          accessibilityElementsHidden
          style={{ color: t.color.info, ...t.typography.scale.bodyStrong }}
        >
          Protección de la víctima
        </Text>
        <Text
          accessibilityElementsHidden
          maxFontSizeMultiplier={1.6}
          style={{ color: t.color.textPrimary, ...t.typography.scale.body }}
        >
          {consecuencia.textoCorto}
        </Text>
        <Text
          accessibilityElementsHidden
          style={{ color: t.color.textSecondary, ...t.typography.scale.caption }}
        >
          Fuente: {consecuencia.fuente}
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
