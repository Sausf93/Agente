import { Tabs } from 'expo-router';
import { useAppTheme } from '@/ui/useAppTheme';

/**
 * Barra de pestañas inferior (ADR-003): Buscar · Normas · Documentos · Cuadrante · Más.
 *
 * "Buscar" es la home (el buscador ES el producto). El Mapa/PK NO es pestaña de
 * nivel 1: vive como apoyo contextual dentro de la ficha/documento y en "Más".
 *
 * Los iconos (Lucide) los añade mobile-dev: activo = relleno, inactivo = línea,
 * de modo que el estado activo no dependa solo del color (regla UI 2.4). De
 * momento la pestaña activa se distingue por color de marca + peso de la etiqueta.
 */
export default function TabsLayout() {
  const t = useAppTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: t.color.brand,
        tabBarInactiveTintColor: t.color.textSecondary,
        tabBarStyle: {
          backgroundColor: t.color.surface,
          borderTopColor: t.color.border,
        },
        tabBarLabelStyle: { fontSize: 13, fontWeight: '600' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Buscar' }} />
      <Tabs.Screen name="normas" options={{ title: 'Normas' }} />
      <Tabs.Screen name="documentos" options={{ title: 'Documentos' }} />
      <Tabs.Screen name="cuadrante" options={{ title: 'Cuadrante' }} />
      <Tabs.Screen name="mas" options={{ title: 'Más' }} />
    </Tabs>
  );
}
