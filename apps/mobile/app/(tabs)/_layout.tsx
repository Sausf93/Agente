import type { ComponentType } from 'react';
import { View, type ColorValue } from 'react-native';
import { Tabs } from 'expo-router';
import {
  BookOpen,
  CalendarDays,
  FileText,
  LayoutGrid,
  Search,
  type LucideProps,
} from 'lucide-react-native';
import { useAppTheme } from '@/ui/useAppTheme';
import type { Theme } from '@/ui/theme';
import { hapticSelection } from '@/ui/haptics';

/**
 * Barra de pestañas inferior (ADR-003; sistema visual v2 §3): Buscar · Normas · Documentos ·
 * Cuadrante · Más. Iconos Lucide (sobre react-native-svg, compatible con Expo Go). La pestaña
 * ACTIVA usa TRES señales redundantes (nunca solo color): pastilla de fondo `accentWeak`, icono
 * y etiqueta en acento, y trazo del icono más grueso (2.4 vs 2.0). Etiqueta siempre visible.
 */
export default function TabsLayout() {
  const t = useAppTheme();
  return (
    <Tabs
      screenListeners={{
        // Háptico de selección al cambiar de pestaña (mejoras-usabilidad P0-1).
        tabPress: () => hapticSelection(),
      }}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: t.color.accent,
        tabBarInactiveTintColor: t.color.textSecondary,
        tabBarStyle: {
          backgroundColor: t.color.surface,
          borderTopColor: t.color.border,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        tabBarItemStyle: { minWidth: t.touch.min },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Buscar', tabBarIcon: makeIcon(t, Search) }}
      />
      <Tabs.Screen
        name="normas"
        options={{ title: 'Normas', tabBarIcon: makeIcon(t, BookOpen) }}
      />
      <Tabs.Screen
        name="documentos"
        options={{ title: 'Documentos', tabBarIcon: makeIcon(t, FileText) }}
      />
      <Tabs.Screen
        name="cuadrante"
        options={{ title: 'Cuadrante', tabBarIcon: makeIcon(t, CalendarDays) }}
      />
      <Tabs.Screen
        name="mas"
        options={{ title: 'Más', tabBarIcon: makeIcon(t, LayoutGrid) }}
      />
    </Tabs>
  );
}

/** Genera el `tabBarIcon`: pastilla `accentWeak` + trazo grueso cuando la pestaña está activa. */
function makeIcon(t: Theme, Icon: ComponentType<LucideProps>) {
  return function TabIcon({ focused, color }: { focused: boolean; color: ColorValue }) {
    return (
      <View
        style={{
          width: 52,
          height: 30,
          borderRadius: t.radius.pill,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: focused ? t.color.accentWeak : 'transparent',
        }}
      >
        <Icon size={24} color={color as string} strokeWidth={focused ? 2.4 : 2} />
      </View>
    );
  };
}
