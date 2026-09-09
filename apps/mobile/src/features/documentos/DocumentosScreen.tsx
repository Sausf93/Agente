import type { ComponentType } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Ban,
  FileText,
  FileWarning,
  FlaskConical,
  IdCard,
  Languages,
  type LucideProps,
} from 'lucide-react-native';
import { useAppTheme } from '@/ui/useAppTheme';
import { Banner } from '@/ui/components/Banner';
import { ListRow } from '@/ui/components/ListRow';
import { IconPill } from '@/ui/components/LeadingPill';
import { PLANTILLAS_SEED } from './plantillasSeed';

/** Icono de la pastilla por plantilla (escaneo rápido de la lista, como el hub "Más"). */
const ICONO_PLANTILLA: Record<string, ComponentType<LucideProps>> = {
  'seed-boletin-denuncia': FileWarning,
  'seed-acta-inmovilizacion': Ban,
  'seed-diligencia-identificacion': IdCard,
  'seed-acta-intervencion-sustancias': FlaskConical,
};

/**
 * Pestaña DOCUMENTOS (§4.8), pensada como "mis actas": el catálogo de actas/plantillas que el
 * agente puede generar como PDF EN EL DISPOSITIVO. Cada fila dice para qué sirve. Todo es offline
 * y local-first: nada de lo que se teclea aquí (ni el PDF resultante) sale del teléfono.
 *
 * La vía más rápida NO es esta pantalla en frío, sino nacer de una consulta: desde la ficha de una
 * infracción, "Generar documento" abre el mismo formulario con lo legal ya relleno. Aquí se entra
 * cuando el agente quiere un acta que no parte de una infracción concreta.
 */

/** Una entrada del catálogo: casi todas abren una plantilla; alguna enruta a otra pantalla. */
interface EntradaCatalogo {
  titulo: string;
  /** Frase de "para qué sirve" (una línea). */
  paraQue: string;
  /** Ruta a la que navega la fila. */
  destino: string;
  /** Icono de la pastilla de la izquierda. */
  icono: ComponentType<LucideProps>;
}

/** Frase de para-qué-sirve para la lectura de derechos (vive en su propia pantalla, §4.11). */
const LECTURA_DERECHOS: EntradaCatalogo = {
  titulo: 'Lectura de derechos (art. 520 LECrim)',
  paraQue: 'Leer los derechos del detenido en varios idiomas, para leerlos en voz alta.',
  destino: '/derechos',
  icono: Languages,
};

export function DocumentosScreen() {
  const t = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Catálogo: las plantillas del seed + la lectura de derechos (que reusa su pantalla propia).
  const catalogo: EntradaCatalogo[] = [
    ...PLANTILLAS_SEED.map((p) => ({
      titulo: p.titulo,
      paraQue: p.descripcion,
      destino: `/documento/${p.id}`,
      icono: ICONO_PLANTILLA[p.id] ?? FileText,
    })),
    LECTURA_DERECHOS,
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.color.bg }}
      contentContainerStyle={{
        paddingTop: insets.top + t.spacing.base,
        paddingBottom: insets.bottom + t.spacing.xxl,
        gap: t.spacing.lg,
      }}
    >
      <View style={{ paddingHorizontal: t.spacing.base, gap: t.spacing.xs }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm }}>
          <FileText size={24} color={t.color.accent} strokeWidth={2} />
          <Text
            accessibilityRole="header"
            style={{ color: t.color.textPrimary, ...t.typography.scale.titleXL }}
          >
            Documentos
          </Text>
        </View>
        <Text style={{ color: t.color.textSecondary, ...t.typography.scale.body }}>
          Lo más rápido es que el documento nazca de una infracción. Aquí empiezas un acta en blanco
          cuando no partes de una consulta concreta.
        </Text>
      </View>

      <View style={{ paddingHorizontal: t.spacing.base, gap: t.spacing.md }}>
        <Banner tone="info" title="Lo más rápido: desde la infracción">
          Abre una infracción en Buscar o Normas y pulsa "Generar documento": el boletín llega con
          norma, artículo, importe y texto ya rellenos, listo para mandártelo en un gesto.
        </Banner>
        <Banner tone="warning" title="Solo en este dispositivo">
          Las matrículas, nombres y DNI que escribas viven únicamente en tu teléfono. Ni esos datos
          ni el PDF se envían a ningún servidor.
        </Banner>
      </View>

      {/* Secundario: empezar de cero. Baja la lista de plantillas frente a la vía "desde la ficha". */}
      <View style={{ paddingHorizontal: t.spacing.base, gap: t.spacing.xxs }}>
        <Text style={{ color: t.color.textPrimary, ...t.typography.scale.titleM }}>
          Empezar un acta en blanco
        </Text>
        <Text style={{ color: t.color.textSecondary, ...t.typography.scale.caption }}>
          Elige la plantilla; tú pones fecha, lugar y lo específico.
        </Text>
      </View>

      <View>
        {catalogo.map((e) => (
          <ListRow
            key={e.destino}
            title={e.titulo}
            subtitle={e.paraQue}
            leading={<IconPill icon={e.icono} />}
            accessibilityHint="Abre el formulario para rellenar y generar el PDF"
            onPress={() => router.push(e.destino)}
          />
        ))}
      </View>
    </ScrollView>
  );
}
