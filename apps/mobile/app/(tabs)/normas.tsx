import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BookOpen } from 'lucide-react-native';
import { EmptyState } from '@/ui/components/EmptyState';
import { useAppTheme } from '@/ui/useAppTheme';

export default function NormasScreen() {
  const t = useAppTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: t.color.bg, paddingTop: insets.top }}>
      <EmptyState
        icon={BookOpen}
        title="Próximamente"
        message="Aquí tendrás el articulado consolidado, tus favoritos y las novedades normativas de tu territorio. Estamos cargándolo."
      />
    </View>
  );
}
