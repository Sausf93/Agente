import { forwardRef, type ComponentType } from 'react';
import { Link } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Baby,
  Car,
  ChevronRight,
  Fingerprint,
  FlaskConical,
  Globe,
  House,
  Languages,
  MessageSquarePlus,
  MessageSquareText,
  Settings,
  ShieldAlert,
  Signpost,
  SquareParking,
  Wine,
  type LucideProps,
} from 'lucide-react-native';
import { useAppTheme } from '@/ui/useAppTheme';
import { ScreenHeader } from '@/ui/components/ScreenHeader';
import type { Theme } from '@/ui/theme';

/**
 * Hub "Más": accesos a lo que no es pestaña de nivel 1 (ajustes, mapa/PK, lectura de derechos,
 * sustancias, vehículos, suscripción) y a "Sugerencias / reportar problema".
 *
 * Ajustes y feedback ya son funcionales; el resto se irá activando. La navegación la resuelve
 * Expo Router.
 */
export default function MasScreen() {
  const t = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.color.bg }}
      contentContainerStyle={{
        paddingBottom: insets.bottom + t.spacing.xxl,
        gap: t.spacing.md,
      }}
    >
      <ScreenHeader title="Más" />

      {/* GUÍAS RÁPIDAS de uso EN DIRECTO. Antes solo se llegaba a ellas desde los accesos rápidos de
          INICIO, que dependen del cuerpo: un agente cuyo cuerpo no listaba una guía no podía abrirla.
          Aquí están TODAS, para cualquier cuerpo. La lectura de derechos vive abajo (herramienta). */}
      <SeccionTitulo t={t} titulo="Guías rápidas" />
      <View style={{ gap: t.spacing.sm, paddingHorizontal: t.spacing.base }}>
        <Link href="/guia-identificacion" asChild>
          <FilaMas
            t={t}
            icon={Fingerprint}
            titulo="Identificación y cacheo"
            descripcion="Cuándo identificar, garantías del cacheo y qué hago ante la negativa."
          />
        </Link>
        <Link href="/guia-alcoholemia" asChild>
          <FilaMas
            t={t}
            icon={Wine}
            titulo="Alcoholemia"
            descripcion="Tasas, cuándo pasa a delito y cómo dejar la prueba bien hecha."
          />
        </Link>
        <Link href="/control-carretera" asChild>
          <FilaMas
            t={t}
            icon={Signpost}
            titulo="Control de carretera"
            descripcion="Checklist de un control, paso a paso, para no dejarte nada."
          />
        </Link>
        <Link href="/guia-menores" asChild>
          <FilaMas
            t={t}
            icon={Baby}
            titulo="Menores"
            descripcion="Inimputable menor de 14, régimen 14-17 con garantías y MENA."
          />
        </Link>
        <Link href="/guia-extranjeria" asChild>
          <FilaMas
            t={t}
            icon={Globe}
            titulo="Extranjería en la calle"
            descripcion="Irregular ≠ delito: vía administrativa, detención cautelar y cuándo es penal."
          />
        </Link>
        <Link href="/guia-violencia-genero" asChild>
          <FilaMas
            t={t}
            icon={ShieldAlert}
            titulo="Violencia de género"
            descripcion="Proteger primero: valoración del riesgo, orden de protección y detención."
          />
        </Link>
        <Link href="/guia-ocupacion" asChild>
          <FilaMas
            t={t}
            icon={House}
            titulo="Ocupación (okupas)"
            descripcion="¿Morada o no? Allanamiento (202) vs usurpación (245), flagrancia y desalojo."
          />
        </Link>
      </View>

      <SeccionTitulo t={t} titulo="Herramientas y ajustes" />
      <View style={{ gap: t.spacing.sm, paddingHorizontal: t.spacing.base }}>
        <Link href="/ajustes" asChild>
          <FilaMas
            t={t}
            icon={Settings}
            titulo="Ajustes"
            descripcion="Cuerpo, territorio y tema (claro/oscuro)."
          />
        </Link>
        <Link href="/derechos" asChild>
          <FilaMas
            t={t}
            icon={Languages}
            titulo="Lectura de derechos (art. 520)"
            descripcion="Derechos del detenido en varios idiomas, para leérselos en el suyo."
          />
        </Link>
        <Link href="/vehiculos" asChild>
          <FilaMas
            t={t}
            icon={Car}
            titulo="Vehículos"
            descripcion="Documentación, vehículos extranjeros, comprobaciones y falsedad documental."
          />
        </Link>
        <Link href="/mis-ordenanzas" asChild>
          <FilaMas
            t={t}
            icon={SquareParking}
            titulo="Mi ordenanza (zona azul, vado…)"
            descripcion="Guarda el importe de tu ordenanza de aparcamiento y reúsalo en el boletín."
          />
        </Link>
        <Link href="/sustancias" asChild>
          <FilaMas
            t={t}
            icon={FlaskConical}
            titulo="Sustancias"
            descripcion="Umbrales orientativos de consumo y tráfico, con orientador y fuente."
          />
        </Link>
        <Link href="/feedback" asChild>
          <FilaMas
            t={t}
            icon={MessageSquarePlus}
            titulo="Sugerencias / reportar problema"
            descripcion="Cuéntanos qué mejorarías o qué falla. Se guarda en tu móvil."
          />
        </Link>
        <Link href="/mis-sugerencias" asChild>
          <FilaMas
            t={t}
            icon={MessageSquareText}
            titulo="Mis sugerencias"
            descripcion="Lo que has enviado, con su estado y nuestra respuesta."
          />
        </Link>
      </View>

      <Text
        style={{
          color: t.color.textTertiary,
          marginTop: t.spacing.base,
          paddingHorizontal: t.spacing.base,
          ...t.typography.scale.caption,
        }}
      >
        Próximamente: mapa/PK y suscripción.
      </Text>
    </ScrollView>
  );
}

/** Título de sección del hub (agrupa las filas: "Guías rápidas" vs "Herramientas y ajustes"). */
function SeccionTitulo({ t, titulo }: { t: Theme; titulo: string }) {
  return (
    <Text
      accessibilityRole="header"
      style={{
        color: t.color.textSecondary,
        paddingHorizontal: t.spacing.base,
        ...t.typography.scale.caption,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
      }}
    >
      {titulo}
    </Text>
  );
}

interface FilaMasProps {
  t: Theme;
  icon: ComponentType<LucideProps>;
  titulo: string;
  descripcion: string;
  onPress?: () => void;
}

/**
 * Fila pulsable del hub. `Link asChild` le inyecta el `onPress` Y una `ref`: por eso el
 * componente se declara con `forwardRef` (si no, React avisa "Function components cannot be given
 * refs"). La ref se reenvía al `Pressable`, sin cambiar el comportamiento de navegación.
 */
const FilaMas = forwardRef<View, FilaMasProps>(function FilaMas(
  { t, icon: Icon, titulo, descripcion, onPress },
  ref,
) {
  return (
    <Pressable
      ref={ref}
      accessibilityRole="button"
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: t.spacing.md,
        minHeight: t.touch.min + 8,
        borderRadius: t.radius.md,
        borderWidth: 1,
        borderColor: t.color.border,
        backgroundColor: t.color.surface,
        padding: t.spacing.md,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: t.radius.md,
          backgroundColor: t.color.accentWeak,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={22} color={t.color.accent} strokeWidth={2} />
      </View>
      <View style={{ flex: 1, gap: t.spacing.xxs }}>
        <Text style={{ color: t.color.textPrimary, ...t.typography.scale.bodyStrong }}>{titulo}</Text>
        <Text style={{ color: t.color.textSecondary, ...t.typography.scale.caption }}>
          {descripcion}
        </Text>
      </View>
      <ChevronRight size={20} color={t.color.textTertiary} strokeWidth={2} />
    </Pressable>
  );
});
