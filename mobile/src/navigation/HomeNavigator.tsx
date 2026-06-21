import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { t } from '../i18n';
import AccountScreen from '../screens/AccountScreen';
import EditUserProfileScreen from '../screens/EditUserProfileScreen';
import HelpScreen from '../screens/HelpScreen';
import HomeScreen from '../screens/HomeScreen';
import MetricsScreen from '../screens/MetricsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import PrivacyScreen from '../screens/PrivacyScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { palette } from '../theme/theme';

export type HomeStackParamList = {
  HomeMain: undefined;
  Settings: undefined;
  EditUserProfile: undefined;
  Account: undefined;
  Notifications: undefined;
  Privacy: undefined;
  Help: undefined;
  Metrics: undefined;
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

export default function HomeNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: palette.surface },
        headerTintColor: palette.textPrimary,
        headerTitleStyle: { color: palette.textPrimary },
        contentStyle: { backgroundColor: palette.background },
        animation: 'slide_from_right',
      }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: t('settings.title') }} />
      <Stack.Screen
        name="EditUserProfile"
        component={EditUserProfileScreen}
        options={{ title: t('profile.edit.title') }}
      />
      <Stack.Screen name="Account" component={AccountScreen} options={{ title: t('settings.account') }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: t('settings.notifications') }} />
      <Stack.Screen name="Privacy" component={PrivacyScreen} options={{ title: t('settings.privacy') }} />
      <Stack.Screen name="Help" component={HelpScreen} options={{ title: t('settings.help') }} />
      <Stack.Screen name="Metrics" component={MetricsScreen} options={{ title: t('metrics.title') }} />
    </Stack.Navigator>
  );
}
