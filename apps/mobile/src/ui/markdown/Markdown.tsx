import { Text, View } from 'react-native';
import { useAppTheme } from '@/ui/useAppTheme';
import type { Theme } from '@/ui/theme';
import { parseMarkdown, type InlineSpan, type MarkdownBlock } from './parse';

/**
 * Renderiza Markdown con las primitivas de React Native y los tokens del tema (cero colores
 * sueltos). Compatible con Expo Go (sin dependencias nativas). Legibilidad primero: cuerpo ≥16 pt,
 * interlineado holgado, texto SELECCIONABLE (para copiar un apartado del artículo).
 *
 * El parseo vive en `parse.ts` (puro y testeado); aquí solo se pinta.
 */
export interface MarkdownProps {
  children: string;
}

export function Markdown({ children }: MarkdownProps) {
  const t = useAppTheme();
  const bloques = parseMarkdown(children);
  return (
    <View style={{ gap: t.spacing.md }}>
      {bloques.map((bloque, i) => (
        <Bloque key={i} t={t} bloque={bloque} />
      ))}
    </View>
  );
}

function Bloque({ t, bloque }: { t: Theme; bloque: MarkdownBlock }) {
  switch (bloque.type) {
    case 'heading': {
      const escala =
        bloque.level === 1
          ? t.typography.scale.titleL
          : bloque.level === 2
            ? t.typography.scale.titleM
            : t.typography.scale.bodyStrong;
      return (
        <Text
          accessibilityRole="header"
          maxFontSizeMultiplier={1.6}
          style={{ color: t.color.textPrimary, ...escala }}
        >
          <Spans t={t} spans={bloque.spans} />
        </Text>
      );
    }
    case 'paragraph':
      return (
        <Text
          selectable
          maxFontSizeMultiplier={1.6}
          style={{ color: t.color.textPrimary, ...t.typography.scale.body }}
        >
          <Spans t={t} spans={bloque.spans} />
        </Text>
      );
    case 'quote':
      return (
        <View
          style={{
            flexDirection: 'row',
            borderRadius: t.radius.sm,
            backgroundColor: t.color.surfaceAlt,
            overflow: 'hidden',
          }}
        >
          <View style={{ width: 3, backgroundColor: t.color.border }} />
          <Text
            selectable
            style={{
              flex: 1,
              padding: t.spacing.md,
              color: t.color.textSecondary,
              ...t.typography.scale.body,
            }}
          >
            <Spans t={t} spans={bloque.spans} />
          </Text>
        </View>
      );
    case 'list':
      return (
        <View style={{ gap: t.spacing.xs }}>
          {bloque.items.map((item, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: t.spacing.sm }}>
              <Text style={{ color: t.color.textSecondary, ...t.typography.scale.body }}>
                {bloque.ordered ? `${i + 1}.` : '•'}
              </Text>
              <Text
                selectable
                style={{ flex: 1, color: t.color.textPrimary, ...t.typography.scale.body }}
              >
                <Spans t={t} spans={item} />
              </Text>
            </View>
          ))}
        </View>
      );
    case 'table':
      return <Tabla t={t} header={bloque.header} rows={bloque.rows} />;
    default:
      return null;
  }
}

/** Tabla simple: cabecera con fondo tenue y filas separadas por borde. Con scroll horizontal implícito por columnas flexibles. */
function Tabla({
  t,
  header,
  rows,
}: {
  t: Theme;
  header: InlineSpan[][];
  rows: InlineSpan[][][];
}) {
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: t.color.border,
        borderRadius: t.radius.sm,
        overflow: 'hidden',
      }}
    >
      <Fila t={t} celdas={header} cabecera />
      {rows.map((fila, i) => (
        <Fila key={i} t={t} celdas={fila} />
      ))}
    </View>
  );
}

function Fila({
  t,
  celdas,
  cabecera = false,
}: {
  t: Theme;
  celdas: InlineSpan[][];
  cabecera?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: cabecera ? t.color.surfaceAlt : t.color.surface,
        borderTopWidth: cabecera ? 0 : 1,
        borderTopColor: t.color.border,
      }}
    >
      {celdas.map((celda, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            padding: t.spacing.sm,
            borderLeftWidth: i === 0 ? 0 : 1,
            borderLeftColor: t.color.border,
          }}
        >
          <Text
            selectable
            style={{
              color: t.color.textPrimary,
              ...(cabecera ? t.typography.scale.bodyStrong : t.typography.scale.body),
            }}
          >
            <Spans t={t} spans={celda} />
          </Text>
        </View>
      ))}
    </View>
  );
}

/** Pinta los fragmentos en línea con su énfasis (negrita, cursiva, código). */
function Spans({ t, spans }: { t: Theme; spans: InlineSpan[] }) {
  return (
    <>
      {spans.map((s, i) => (
        <Text
          key={i}
          style={{
            fontWeight: s.bold ? '700' : '400',
            fontStyle: s.italic ? 'italic' : 'normal',
            ...(s.code
              ? { fontFamily: 'monospace', color: t.color.textSecondary }
              : null),
          }}
        >
          {s.text}
        </Text>
      ))}
    </>
  );
}
