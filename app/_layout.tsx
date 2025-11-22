import RootNavigation from '@/navigation/RootNavigation';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  return (
    <>
      <RootNavigation />
      <StatusBar style="light" />
    </>
  );
}
