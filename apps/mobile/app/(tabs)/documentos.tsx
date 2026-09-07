import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FileText } from 'lucide-react-native';
import { EmptyState } from '@/ui/components/EmptyState';
import { useAppTheme } from '@/ui/useAppTheme';

export default function DocumentosScreen() {
  const t = useAppTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: t.color.bg, paddingTop: insets.top }}>
      <EmptyState
        icon={FileText}
        title="Próximamente"
        message="Plantillas que rellenas y conviertes en PDF en tu dispositivo. Nada sale de tu móvil. Estamos preparándolas."
      />
    </View>
  );
}
