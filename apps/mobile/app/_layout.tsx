import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useSettingsStore } from '@/store/settings';

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
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
        <Stack.Screen
          name="ajustes"
          options={{ headerShown: true, title: 'Ajustes', presentation: 'card' }}
        />
        <Stack.Screen
          name="ficha/[id]"
          options={{ headerShown: true, title: 'Infracción', presentation: 'card' }}
        />
        <Stack.Screen
          name="feedback"
          options={{ headerShown: true, title: 'Sugerencias', presentation: 'card' }}
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
      </Stack>
    </SafeAreaProvider>
  );
}
