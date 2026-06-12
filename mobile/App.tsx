import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import RootNavigator from './src/navigation/RootNavigator';
import { useAuthStore } from './src/store/authStore';
import { navigationTheme, paperTheme } from './src/theme/theme';

const queryClient = new QueryClient();

export default function App() {
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <PaperProvider theme={paperTheme}>
          <NavigationContainer theme={navigationTheme}>
            <RootNavigator />
            <StatusBar style="light" />
          </NavigationContainer>
        </PaperProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
