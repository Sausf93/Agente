import { Stack } from 'expo-router';
import { useAppTheme } from '@/ui/useAppTheme';

/**
 * Stack anidado de la pestaña NORMAS (ADR-003; §4.5): lista de normas → articulado de una norma →
 * artículo, más "mis marcadores". La cabecera propia del stack aporta la navegación hacia atrás;
 * sus colores salen del tema (acento por cuerpo, claro/oscuro), sin colores sueltos.
 */
export default function NormasLayout() {
  const t = useAppTheme();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: t.color.surface },
        headerTintColor: t.color.accent,
        headerTitleStyle: { color: t.color.textPrimary },
        contentStyle: { backgroundColor: t.color.bg },
        // Toda la pila de Normas (materia → norma → artículo) entra desde la derecha y vuelve con
        // el swipe de borde izquierdo → derecha (gesto estándar de iOS), coherente con el resto.
        presentation: 'card',
        animation: 'slide_from_right',
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Normas' }} />
      <Stack.Screen name="materia/[materia]" options={{ title: 'Materia' }} />
      <Stack.Screen name="norma/[normaId]" options={{ title: 'Norma' }} />
      <Stack.Screen name="articulo/[articuloId]" options={{ title: 'Artículo' }} />
      <Stack.Screen name="marcadores" options={{ title: 'Mis marcadores' }} />
    </Stack>
  );
}
