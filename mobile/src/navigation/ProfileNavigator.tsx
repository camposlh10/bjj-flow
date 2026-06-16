import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { t } from '../i18n';
import EditUserProfileScreen from '../screens/EditUserProfileScreen';
import SubmissionsScreen from '../screens/SubmissionsScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import { palette } from '../theme/theme';

export type ProfileStackParamList = {
  UserProfile: { userId?: number } | undefined;
  EditUserProfile: undefined;
  Submissions: { userId?: number } | undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfileNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: palette.surface },
        headerTintColor: palette.textPrimary,
        headerTitleStyle: { color: palette.textPrimary },
        contentStyle: { backgroundColor: palette.background },
      }}>
      <Stack.Screen name="UserProfile" component={UserProfileScreen} options={{ title: t('tabs.profile') }} />
      <Stack.Screen
        name="EditUserProfile"
        component={EditUserProfileScreen}
        options={{ title: t('profile.edit.title') }}
      />
      <Stack.Screen
        name="Submissions"
        component={SubmissionsScreen}
        options={{ title: t('submissions.title') }}
      />
    </Stack.Navigator>
  );
}
