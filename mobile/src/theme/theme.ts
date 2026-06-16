import { DarkTheme as NavigationDarkTheme } from '@react-navigation/native';
import { MD3DarkTheme, adaptNavigationTheme } from 'react-native-paper';

// BJJ Flow palette: dark, modern, gym-inspired with a crimson accent.
export const palette = {
  background: '#0D0D10',
  surface: '#17171C',
  surfaceVariant: '#22222A',
  primary: '#E63946',
  onPrimary: '#FFFFFF',
  textPrimary: '#F4F4F5',
  textSecondary: '#A1A1AA',
  outline: '#3F3F46',
  verified: '#3897F0',
  pro: '#F5C518',
};

export const paperTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: palette.primary,
    onPrimary: palette.onPrimary,
    background: palette.background,
    surface: palette.surface,
    surfaceVariant: palette.surfaceVariant,
    outline: palette.outline,
  },
};

const { DarkTheme: adaptedNavigationTheme } = adaptNavigationTheme({
  reactNavigationDark: NavigationDarkTheme,
});

export const navigationTheme = {
  ...adaptedNavigationTheme,
  // React Navigation 7 requires fonts; Paper's adaptNavigationTheme drops them
  fonts: NavigationDarkTheme.fonts,
  colors: {
    ...adaptedNavigationTheme.colors,
    primary: palette.primary,
    background: palette.background,
    card: palette.surface,
    text: palette.textPrimary,
    border: palette.outline,
  },
};
