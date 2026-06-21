import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import ErrorBoundary from './src/components/ErrorBoundary';
import RootNavigator from './src/navigation/RootNavigator';
import { useAuthStore } from './src/store/authStore';
import { useLocaleStore } from './src/store/localeStore';
import { navigationTheme, paperTheme } from './src/theme/theme';

const queryClient = new QueryClient();

export default function App() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const hydrateLocale = useLocaleStore((s) => s.hydrate);
  const locale = useLocaleStore((s) => s.locale);

  useEffect(() => {
    hydrate();
    hydrateLocale();
  }, [hydrate, hydrateLocale]);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <PaperProvider theme={paperTheme}>
          {/* Remount the navigation tree on locale change so every t() re-reads the active dictionary. */}
          <NavigationContainer key={locale} theme={navigationTheme}>
            <ErrorBoundary>
              <RootNavigator />
            </ErrorBoundary>
            <StatusBar style="light" />
          </NavigationContainer>
        </PaperProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
