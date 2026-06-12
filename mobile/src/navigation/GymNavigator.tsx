import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AgendaOccurrence } from '../api/classes';
import { t } from '../i18n';
import AttendanceScreen from '../screens/gym/AttendanceScreen';
import ClassDetailScreen from '../screens/gym/ClassDetailScreen';
import CreateClassScreen from '../screens/gym/CreateClassScreen';
import CreateGymScreen from '../screens/gym/CreateGymScreen';
import CreatePostScreen from '../screens/gym/CreatePostScreen';
import CreateProductScreen from '../screens/gym/CreateProductScreen';
import EditGymScreen from '../screens/gym/EditGymScreen';
import GymHomeScreen from '../screens/gym/GymHomeScreen';
import GymProfileScreen from '../screens/gym/GymProfileScreen';
import JoinGymScreen from '../screens/gym/JoinGymScreen';
import MemberProfileScreen from '../screens/gym/MemberProfileScreen';
import PostDetailScreen from '../screens/gym/PostDetailScreen';
import SavedPostsScreen from '../screens/gym/SavedPostsScreen';
import { palette } from '../theme/theme';

export type GymStackParamList = {
  GymHome: undefined;
  CreateGym: undefined;
  JoinGym: undefined;
  CreatePost: undefined;
  PostDetail: { postId: number };
  SavedPosts: undefined;
  CreateClass: undefined;
  ClassDetail: { occurrence: AgendaOccurrence };
  Attendance: { classId: number; date: string; title: string };
  MemberProfile: { userId: number };
  CreateProduct: undefined;
  GymProfile: undefined;
  EditGym: undefined;
};

const Stack = createNativeStackNavigator<GymStackParamList>();

export default function GymNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: palette.surface },
        headerTintColor: palette.textPrimary,
        headerTitleStyle: { color: palette.textPrimary },
        contentStyle: { backgroundColor: palette.background },
      }}>
      <Stack.Screen name="GymHome" component={GymHomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="CreateGym" component={CreateGymScreen} options={{ title: t('gym.create.title') }} />
      <Stack.Screen name="JoinGym" component={JoinGymScreen} options={{ title: t('gym.join.title') }} />
      <Stack.Screen name="CreatePost" component={CreatePostScreen} options={{ title: t('mural.publish') }} />
      <Stack.Screen
        name="PostDetail"
        component={PostDetailScreen}
        options={{ title: t('post.detail.title') }}
      />
      <Stack.Screen
        name="SavedPosts"
        component={SavedPostsScreen}
        options={{ title: t('mural.saved.title') }}
      />
      <Stack.Screen
        name="CreateClass"
        component={CreateClassScreen}
        options={{ title: t('agenda.class.create.title') }}
      />
      <Stack.Screen
        name="ClassDetail"
        component={ClassDetailScreen}
        options={{ title: t('agenda.detail.title') }}
      />
      <Stack.Screen
        name="Attendance"
        component={AttendanceScreen}
        options={{ title: t('agenda.attendance.title') }}
      />
      <Stack.Screen
        name="MemberProfile"
        component={MemberProfileScreen}
        options={{ title: t('member.profile.title') }}
      />
      <Stack.Screen
        name="CreateProduct"
        component={CreateProductScreen}
        options={{ title: t('market.create.title') }}
      />
      <Stack.Screen
        name="GymProfile"
        component={GymProfileScreen}
        options={{ title: t('gymProfile.title') }}
      />
      <Stack.Screen
        name="EditGym"
        component={EditGymScreen}
        options={{ title: t('gymProfile.edit.title') }}
      />
    </Stack.Navigator>
  );
}
