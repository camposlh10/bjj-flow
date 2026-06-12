import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, View } from 'react-native';

import { createQuickCheckIn } from '../api/checkins';
import { t } from '../i18n';
import ComunidadeScreen from '../screens/ComunidadeScreen';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import GymNavigator from './GymNavigator';
import { palette } from '../theme/theme';

export type AppTabsParamList = {
  Home: undefined;
  Comunidade: undefined;
  CheckIn: undefined;
  Gym: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<AppTabsParamList>();

function EmptyScreen() {
  return null;
}

export default function AppTabs() {
  const queryClient = useQueryClient();

  const checkIn = useMutation({
    mutationFn: createQuickCheckIn,
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: palette.textSecondary,
        tabBarLabelStyle: styles.tabLabel,
      }}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: t('tabs.home'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home-variant" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Comunidade"
        component={ComunidadeScreen}
        options={{
          tabBarLabel: t('tabs.community'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="earth" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="CheckIn"
        component={EmptyScreen}
        options={{
          tabBarLabel: '',
          tabBarButton: () => (
            <View style={styles.centerWrap}>
              <Pressable
                onPress={() => checkIn.mutate()}
                style={({ pressed }) => [styles.centerButton, pressed && styles.centerPressed]}
                accessibilityLabel={t('home.checkin.button')}>
                <MaterialCommunityIcons name="plus" size={26} color="#FFFFFF" />
              </Pressable>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Gym"
        component={GymNavigator}
        options={{
          tabBarLabel: t('tabs.gym'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="town-hall" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: t('tabs.profile'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: palette.surface,
    borderTopColor: palette.surfaceVariant,
  },
  tabLabel: {
    fontSize: 10,
  },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
  },
  centerButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20,
    borderWidth: 4,
    borderColor: palette.background,
  },
  centerPressed: {
    transform: [{ scale: 0.94 }],
  },
});
