import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getCommunityFeed } from '../api/feed';
import { TrainingCardSkeleton } from '../components/Skeleton';
import TrainingCard from '../components/TrainingCard';
import { t } from '../i18n';
import type { ComunidadeStackParamList } from '../navigation/ComunidadeNavigator';
import { palette } from '../theme/theme';

type Nav = NativeStackNavigationProp<ComunidadeStackParamList, 'ComunidadeFeed'>;

export default function ComunidadeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const feed = useQuery({ queryKey: ['communityFeed'], queryFn: getCommunityFeed });
  const items = Array.isArray(feed.data) ? feed.data : [];

  const soon = () => Alert.alert(t('gym.soon'));

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      data={items}
      keyExtractor={(item) => String(item.checkInId)}
      renderItem={({ item, index }) => (
        <Animated.View entering={FadeInDown.duration(280).delay(Math.min(index, 8) * 45)}>
          <TrainingCard
            item={item}
            onPressAuthor={(userId) => navigation.navigate('UserProfile', { userId })}
            onPressComment={(it) => navigation.navigate('FeedComments', { item: it })}
          />
        </Animated.View>
      )}
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      refreshControl={
        <RefreshControl refreshing={feed.isRefetching} onRefresh={() => feed.refetch()} tintColor={palette.primary} />
      }
      ListHeaderComponent={
        <View style={styles.head}>
          <View style={{ flex: 1 }}>
            <Text variant="titleLarge" style={styles.title}>
              {t('tabs.community')}
            </Text>
            <Text style={styles.subtitle}>{t('feed.subtitle')}</Text>
          </View>
          <View style={styles.headActions}>
            <Pressable
              style={styles.iconBtn}
              onPress={() => navigation.navigate('Direct')}
              hitSlop={8}
              accessibilityLabel={t('feed.messages')}>
              <MaterialCommunityIcons name="message-outline" size={22} color={palette.textPrimary} />
            </Pressable>
            <Pressable style={styles.iconBtn} onPress={soon} hitSlop={8} accessibilityLabel={t('feed.notifications')}>
              <MaterialCommunityIcons name="bell-outline" size={22} color={palette.textPrimary} />
            </Pressable>
          </View>
        </View>
      }
      ListEmptyComponent={
        feed.isLoading ? (
          <View style={{ gap: 12 }}>
            <TrainingCardSkeleton />
            <TrainingCardSkeleton />
            <TrainingCardSkeleton />
          </View>
        ) : (
          <View style={styles.center}>
            <MaterialCommunityIcons name="earth" size={44} color={palette.surfaceVariant} />
            <Text style={styles.emptyTitle}>{t('feed.empty.title')}</Text>
            <Text style={styles.emptySub}>{t('feed.empty.sub')}</Text>
          </View>
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  content: { paddingHorizontal: 20, paddingBottom: 32, flexGrow: 1 },
  head: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  headActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { color: palette.textPrimary, fontWeight: 'bold' },
  subtitle: { color: palette.textSecondary, fontSize: 13, marginTop: 2 },
  center: { alignItems: 'center', justifyContent: 'center', gap: 8, paddingTop: 80 },
  emptyTitle: { color: palette.textPrimary, fontWeight: 'bold', fontSize: 15 },
  emptySub: { color: palette.textSecondary, fontSize: 13, textAlign: 'center' },
});
