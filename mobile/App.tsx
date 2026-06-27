import { NavigationContainer } from '@react-navigation/native';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import ErrorBoundary from './src/components/ErrorBoundary';
import RootNavigator from './src/navigation/RootNavigator';
import { CACHE_BUSTER, CACHE_MAX_AGE, asyncStoragePersister, queryClient } from './src/queryClient';
import { useAuthStore } from './src/store/authStore';
import { useLocaleStore } from './src/store/localeStore';
import { useThemeStore } from './src/store/themeStore';
import { navigationThemeFor, paperThemeFor } from './src/theme/theme';

// react-query's default only persists SUCCESSFUL queries, so a stuck loading/error
// state is never restored. maxAge drops caches older than a day; buster invalidates
// all persisted caches when bumped (e.g. after an incompatible response-shape change).
const persistOptions = {
  persister: asyncStoragePersister,
  maxAge: CACHE_MAX_AGE,
  buster: CACHE_BUSTER,
};

export default function App() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const hydrateLocale = useLocaleStore((s) => s.hydrate);
  const hydrateTheme = useThemeStore((s) => s.hydrate);
  const locale = useLocaleStore((s) => s.locale);
  const scheme = useThemeStore((s) => s.scheme);

  useEffect(() => {
    hydrate();
    hydrateLocale();
    hydrateTheme();
  }, [hydrate, hydrateLocale, hydrateTheme]);

  return (
    <SafeAreaProvider>
      <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
        <PaperProvider theme={paperThemeFor(scheme)}>
          {/* Remount the tree on locale/scheme change so t() + themed styles re-read. */}
          <NavigationContainer key={`${locale}-${scheme}`} theme={navigationThemeFor(scheme)}>
            <ErrorBoundary>
              <RootNavigator />
            </ErrorBoundary>
            <StatusBar style={scheme === 'light' ? 'dark' : 'light'} />
          </NavigationContainer>
        </PaperProvider>
      </PersistQueryClientProvider>
    </SafeAreaProvider>
  );
}
