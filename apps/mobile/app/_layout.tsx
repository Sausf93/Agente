import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/**
 * Layout raíz de la app. Aporta el proveedor de safe-area y la barra de estado
 * (que sigue el tema del sistema, claro/oscuro). El contenedor real de la
 * navegación es el grupo de pestañas `(tabs)`.
 *
 * Nota: aquí NO hay splash largo ni comprobaciones bloqueantes (regla UX F1):
 * el arranque debe ser instantáneo. La actualización de contenido irá en segundo
 * plano cuando la implemente mobile-dev.
 */
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </SafeAreaProvider>
  );
}
