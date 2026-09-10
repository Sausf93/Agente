import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useSettingsStore } from '@/store/settings';
import { useAppTheme } from '@/ui/useAppTheme';

/**
 * Layout raíz de la app. Aporta el proveedor de safe-area, la barra de estado (sigue el tema
 * del sistema) y el GATE de onboarding: en la primera apertura (perfil sin `onboarded`) manda a
 * `/onboarding`; después, a las pestañas. El perfil se hidrata desde el dispositivo antes de
 * decidir, para no parpadear ni mostrar el buscador vacío a quien aún no ha elegido cuerpo.
 *
 * No hay comprobaciones de red bloqueantes (regla UX F1): la hidratación es local (SQLite) y
 * rápida; la splash se oculta en cuanto termina.
 */
void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const hydrate = useSettingsStore((s) => s.hydrate);
  const loaded = useSettingsStore((s) => s.loaded);
  const onboarded = useSettingsStore((s) => s.onboarded);
  const router = useRouter();
  const segments = useSegments();
  const t = useAppTheme();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!loaded) return;
    void SplashScreen.hideAsync();
    const enOnboarding = segments[0] === 'onboarding';
    if (!onboarded && !enOnboarding) {
      router.replace('/onboarding');
    } else if (onboarded && enOnboarding) {
      router.replace('/');
    }
  }, [loaded, onboarded, segments, router]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
            // El botón de atrás muestra solo la flecha (sin el nombre de la ruta anterior, que
            // era el crudo "(tabs)"). iOS: minimal; el resto ignora la opción sin romper.
            headerBackButtonDisplayMode: 'minimal',
            headerBackTitle: 'Atrás',
            // Cabeceras TEMATIZADAS: la barra seguía el color por defecto (blanca sobre la app
            // oscura, "franja blanca" que cantaba). Ahora sigue el tema (oscuro/claro + acento).
            headerStyle: { backgroundColor: t.color.surface },
            headerTintColor: t.color.accent,
            headerTitleStyle: { color: t.color.textPrimary },
            headerShadowVisible: false,
            contentStyle: { backgroundColor: t.color.bg },
          }}
        >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" options={{ gestureEnabled: false, animation: 'fade' }} />
        <Stack.Screen
          name="ajustes"
          options={{ headerShown: true, title: 'Ajustes', presentation: 'card' }}
        />
        {/* La ficha entra desde la derecha (card) y se cierra con el gesto estándar de iOS: swipe
            desde el borde izquierdo hacia la derecha (antes era modal con arrastre vertical). */}
        <Stack.Screen
          name="ficha/[id]"
          options={{ headerShown: true, title: 'Infracción', presentation: 'card', gestureEnabled: true }}
        />
        <Stack.Screen
          name="feedback"
          options={{ headerShown: true, title: 'Sugerencias', presentation: 'card' }}
        />
        <Stack.Screen
          name="mis-sugerencias"
          options={{ headerShown: true, title: 'Mis sugerencias', presentation: 'card' }}
        />
        <Stack.Screen
          name="sugerencia/[id]"
          options={{ headerShown: true, title: 'Aportación', presentation: 'card' }}
        />
        <Stack.Screen
          name="favoritos"
          options={{ headerShown: true, title: 'Tus favoritas', presentation: 'card' }}
        />
        <Stack.Screen
          name="novedades"
          options={{ headerShown: true, title: 'Novedades', presentation: 'card' }}
        />
        <Stack.Screen
          name="documento/[plantillaId]"
          options={{ headerShown: true, title: 'Documento', presentation: 'card' }}
        />
        <Stack.Screen
          name="derechos"
          options={{ headerShown: true, title: 'Lectura de derechos', presentation: 'card' }}
        />
        <Stack.Screen
          name="guia-alcoholemia"
          options={{ headerShown: true, title: 'Guía de alcoholemia', presentation: 'card' }}
        />
        <Stack.Screen
          name="vehiculos/index"
          options={{ headerShown: true, title: 'Vehículos', presentation: 'card' }}
        />
        <Stack.Screen
          name="vehiculos/[categoriaId]"
          options={{ headerShown: true, title: 'Vehículos', presentation: 'card' }}
        />
        <Stack.Screen
          name="sustancias/index"
          options={{ headerShown: true, title: 'Sustancias', presentation: 'card' }}
        />
        <Stack.Screen
          name="sustancias/[sustanciaId]"
          options={{ headerShown: true, title: 'Sustancia', presentation: 'card' }}
        />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
