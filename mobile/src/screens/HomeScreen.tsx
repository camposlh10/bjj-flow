import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ActivityIndicator, Button, Text } from 'react-native-paper';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import { Stats, createQuickCheckIn, getStats } from '../api/checkins';
import { GymSuggestion, getGymSuggestions } from '../api/gyms';
import type { AppTabsParamList } from '../navigation/AppTabs';
import BeltVisual, { formatStripes } from '../components/BeltVisual';
import { rankBarColorFor } from '../constants/belts';
import { quoteOfTheDay } from '../constants/quotes';
import { t, tf } from '../i18n';
import { useAuthStore } from '../store/authStore';
import { palette } from '../theme/theme';

const WEEK_LETTERS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];
const MILESTONES = [10, 25, 50, 100, 150, 200, 300, 500, 1000];

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const second = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + second).toUpperCase();
}

function streakLabel(streak: number): string {
  if (streak === 0) return t('home.streak.zero');
  if (streak === 1) return t('home.streak.one');
  return tf('home.streak.many', { n: streak });
}

type Motivation = { title: string; text: string; progress?: number };

function motivationFor(stats: Stats): Motivation {
  if (stats.weeklyProgress < stats.weeklyGoal) {
    const left = stats.weeklyGoal - stats.weeklyProgress;
    return {
      title: t('motivation.weekly.title'),
      text: left === 1 ? t('motivation.weekly.one') : tf('motivation.weekly.many', { n: left }),
      progress: stats.weeklyProgress / stats.weeklyGoal,
    };
  }
  const recordGap = stats.longestStreak - stats.currentStreak;
  if (stats.currentStreak > 0 && recordGap > 0 && recordGap <= 7) {
    return {
      title: t('motivation.record.title'),
      text: recordGap === 1 ? t('motivation.record.one') : tf('motivation.record.many', { n: recordGap }),
    };
  }
  const next = MILESTONES.find((m) => m > stats.totalCheckIns);
  if (next && next - stats.totalCheckIns <= 10) {
    return {
      title: t('motivation.milestone.title'),
      text: tf('motivation.milestone.text', { n: next - stats.totalCheckIns, m: next }),
    };
  }
  if (stats.weeklyProgress >= stats.weeklyGoal) {
    return { title: t('motivation.goalDone.title'), text: t('motivation.goalDone.text') };
  }
  return { title: t('motivation.quote.title'), text: quoteOfTheDay() };
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<BottomTabNavigationProp<AppTabsParamList>>();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [dismissed, setDismissed] = useState<number[]>([]);

  const stats = useQuery({ queryKey: ['stats'], queryFn: getStats });
  const suggestions = useQuery({ queryKey: ['gymSuggestions'], queryFn: getGymSuggestions });

  const checkIn = useMutation({
    mutationFn: createQuickCheckIn,
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });

  const s = stats.data;
  const todayIndex = (new Date().getDay() + 6) % 7;
  const visibleGyms = (suggestions.data ?? []).filter((g) => !dismissed.includes(g.id));

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      refreshControl={
        <RefreshControl
          refreshing={stats.isRefetching}
          onRefresh={() => {
            stats.refetch();
            suggestions.refetch();
          }}
          tintColor={palette.primary}
        />
      }>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initialsOf(user?.displayName ?? '')}</Text>
          </View>
          <View>
            <Text variant="titleMedium" style={styles.name}>
              {t('home.greeting')}, {user?.displayName?.split(' ')[0] ?? ''}
            </Text>
            <Text variant="bodySmall" style={styles.subGreeting}>
              {t('home.subGreeting')}
            </Text>
          </View>
        </View>
        {user?.belt && (
          <View style={styles.headerBelt}>
            <BeltVisual
              color={user.belt.colorHex}
              rankBarColor={rankBarColorFor(user.belt.slug)}
              stripes={user.belt.stripes}
              height={16}
            />
            <Text style={styles.headerBeltLabel}>
              {user.belt.namePt}
              {user.belt.stripes > 0 ? ` · ${formatStripes(user.belt.stripes)}` : ''}
            </Text>
          </View>
        )}
      </View>

      {!s ? (
        <View style={styles.loading}>
          <ActivityIndicator />
        </View>
      ) : (
        <>
          <View style={styles.card}>
            <View style={styles.streakHeader}>
              <View style={styles.streakFlame}>
                <MaterialCommunityIcons name="fire" size={18} color={palette.primary} />
                <Text style={styles.streakText}>{streakLabel(s.currentStreak)}</Text>
              </View>
              <Text style={styles.recordText}>
                {t('home.record')}: {s.longestStreak}
              </Text>
            </View>
            <View style={styles.weekRow}>
              {WEEK_LETTERS.map((letter, i) => (
                <View key={i} style={styles.weekDay}>
                  <Text style={[styles.weekLetter, i === todayIndex && styles.weekLetterToday]}>
                    {letter}
                  </Text>
                  <View
                    style={[
                      styles.weekCircle,
                      s.weekDays[i] && styles.weekCircleDone,
                      i === todayIndex && !s.weekDays[i] && styles.weekCircleToday,
                    ]}>
                    {s.weekDays[i] && (
                      <MaterialCommunityIcons name="check" size={14} color="#FFFFFF" />
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>

          {s.checkedInToday ? (
            <Animated.View entering={FadeIn.duration(300)} style={[styles.card, styles.checkInDone]}>
              <Text variant="titleMedium" style={styles.cardTitle}>
                {t('home.checkin.done.title')} 🔥
              </Text>
              <Text variant="bodySmall" style={styles.cardSubtitle}>
                {t('home.checkin.done.subtitle')}
              </Text>
              <Button
                mode="text"
                textColor={palette.textSecondary}
                onPress={() => checkIn.mutate()}
                loading={checkIn.isPending}>
                {t('home.checkin.again')}
              </Button>
            </Animated.View>
          ) : (
            <View style={styles.card}>
              <Text variant="titleMedium" style={styles.cardTitle}>
                {t('home.checkin.title')}
              </Text>
              <Text variant="bodySmall" style={styles.cardSubtitle}>
                {t('home.checkin.subtitle')}
              </Text>
              <Button
                mode="contained"
                onPress={() => checkIn.mutate()}
                loading={checkIn.isPending}
                contentStyle={styles.checkInButton}>
                {t('home.checkin.button')}
              </Button>
            </View>
          )}

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>{t('home.stats.trainings')}</Text>
              <Text style={styles.statValue}>{s.totalCheckIns}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>{t('home.stats.hours')}</Text>
              <Text style={styles.statValue}>{s.totalHours}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>{t('home.stats.record')}</Text>
              <Text style={styles.statValue}>{s.longestStreak}</Text>
            </View>
          </View>

          <Text variant="titleSmall" style={styles.sectionTitle}>
            {t('home.suggestions.title')}
          </Text>
          {visibleGyms.length === 0 ? (
            <View style={styles.card}>
              <Text variant="bodySmall" style={styles.cardSubtitle}>
                {t('home.suggestions.empty')}
              </Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gymsRow}>
              {visibleGyms.map((gym: GymSuggestion) => (
                <View key={gym.id} style={styles.gymCard}>
                  <TouchableOpacity
                    style={styles.gymDismiss}
                    onPress={() => setDismissed((d) => [...d, gym.id])}
                    hitSlop={8}>
                    <MaterialCommunityIcons name="close" size={14} color={palette.textSecondary} />
                  </TouchableOpacity>
                  <View style={styles.gymAvatar}>
                    <Text style={styles.gymAvatarText}>{initialsOf(gym.name)}</Text>
                  </View>
                  <Text numberOfLines={1} style={styles.gymName}>
                    {gym.name}
                  </Text>
                  <Text numberOfLines={1} style={styles.gymMeta}>
                    {[gym.city, `${gym.memberCount} ${t('home.suggestions.members')}`]
                      .filter(Boolean)
                      .join(' · ')}
                  </Text>
                  <Button
                    mode="contained"
                    compact
                    labelStyle={styles.gymJoinLabel}
                    onPress={() => navigation.navigate('Gym')}>
                    {t('home.suggestions.view')}
                  </Button>
                </View>
              ))}
            </ScrollView>
          )}

          {(() => {
            const m = motivationFor(s);
            return (
              <View style={[styles.card, styles.motivationCard]}>
                <MaterialCommunityIcons name="target" size={26} color={palette.primary} />
                <View style={styles.motivationBody}>
                  <Text variant="titleSmall" style={styles.cardTitle}>
                    {m.title}
                  </Text>
                  <Text variant="bodySmall" style={styles.cardSubtitle}>
                    {m.text}
                  </Text>
                  {m.progress !== undefined && (
                    <View style={styles.progressTrack}>
                      <View style={[styles.progressFill, { width: `${m.progress * 100}%` }]} />
                    </View>
                  )}
                </View>
              </View>
            );
          })()}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: palette.textPrimary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  name: {
    color: palette.textPrimary,
    fontWeight: 'bold',
  },
  subGreeting: {
    color: palette.textSecondary,
  },
  headerBelt: {
    width: 104,
    alignItems: 'flex-end',
    gap: 3,
  },
  headerBeltLabel: {
    color: palette.textSecondary,
    fontSize: 10,
  },
  loading: {
    paddingVertical: 48,
  },
  card: {
    backgroundColor: palette.surface,
    borderRadius: 16,
    padding: 16,
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  streakFlame: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  streakText: {
    color: palette.textPrimary,
    fontWeight: 'bold',
    fontSize: 13,
  },
  recordText: {
    color: palette.textSecondary,
    fontSize: 11,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weekDay: {
    alignItems: 'center',
    gap: 4,
  },
  weekLetter: {
    color: palette.textSecondary,
    fontSize: 10,
  },
  weekLetterToday: {
    color: palette.textPrimary,
    fontWeight: 'bold',
  },
  weekCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: palette.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekCircleDone: {
    backgroundColor: palette.primary,
  },
  weekCircleToday: {
    borderWidth: 2,
    borderColor: palette.primary,
  },
  checkInDone: {
    borderWidth: 1,
    borderColor: palette.primary,
  },
  cardTitle: {
    color: palette.textPrimary,
    fontWeight: 'bold',
  },
  cardSubtitle: {
    color: palette.textSecondary,
    marginTop: 2,
    marginBottom: 10,
  },
  checkInButton: {
    paddingVertical: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: palette.surface,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  statLabel: {
    color: palette.textSecondary,
    fontSize: 11,
  },
  statValue: {
    color: palette.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionTitle: {
    color: palette.textPrimary,
    fontWeight: 'bold',
    marginTop: 4,
  },
  gymsRow: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  gymCard: {
    width: 130,
    backgroundColor: palette.surface,
    borderRadius: 14,
    padding: 10,
    marginRight: 8,
    alignItems: 'center',
  },
  gymDismiss: {
    alignSelf: 'flex-end',
  },
  gymAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  gymAvatarText: {
    color: palette.textPrimary,
    fontWeight: 'bold',
    fontSize: 12,
  },
  gymName: {
    color: palette.textPrimary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  gymMeta: {
    color: palette.textSecondary,
    fontSize: 10,
    marginTop: 2,
    marginBottom: 8,
  },
  gymJoinLabel: {
    fontSize: 11,
    marginVertical: 4,
  },
  motivationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  motivationBody: {
    flex: 1,
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: palette.surfaceVariant,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: palette.primary,
  },
});
