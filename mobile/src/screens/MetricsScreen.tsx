import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { ComponentProps } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { getStats } from '../api/checkins';
import { getBiometrics } from '../api/wearables';
import MetricWidget from '../components/MetricWidget';
import Skeleton from '../components/Skeleton';
import { t, tf } from '../i18n';
import { palette } from '../theme/theme';

function formatMinutes(m: number): string {
  if (!m) return '0min';
  const h = Math.floor(m / 60);
  const min = m % 60;
  if (h === 0) return `${min}min`;
  return min === 0 ? `${h}h` : `${h}h${min}`;
}

function formatBio(value: number, unit: string): string {
  const v = Number.isInteger(value) ? String(value) : value.toFixed(1);
  return unit === '%' ? `${v}%` : `${v}${unit ? ` ${unit}` : ''}`;
}

type LockedMetric = { icon: ComponentProps<typeof MaterialCommunityIcons>['name']; label: string; metric: string; color: string };

export default function MetricsScreen() {
  const navigation = useNavigation<any>();
  const stats = useQuery({ queryKey: ['stats'], queryFn: getStats });
  const bio = useQuery({ queryKey: ['biometrics'], queryFn: getBiometrics });
  const bioMap = new Map((bio.data ?? []).map((b) => [b.metric, b]));

  // Wearable-only metrics, each mapped to a backend biometric key; a tile unlocks once
  // a reading exists. Built in render so labels follow the active language.
  const LOCKED: LockedMetric[] = [
    { icon: 'heart-pulse', label: t('metrics.recovery'), metric: 'RECOVERY', color: '#16A34A' },
    { icon: 'gauge', label: t('metrics.readiness'), metric: 'READINESS', color: '#3E63DD' },
    { icon: 'sleep', label: t('metrics.sleep'), metric: 'SLEEP', color: '#8E4EC6' },
    { icon: 'sine-wave', label: t('metrics.hrv'), metric: 'HRV', color: '#2DB6A3' },
    { icon: 'heart', label: t('metrics.restingHr'), metric: 'RESTING_HR', color: '#E5484D' },
    { icon: 'lungs', label: t('metrics.vo2max'), metric: 'VO2MAX', color: '#E0A82E' },
    { icon: 'timer-sand', label: t('metrics.recoveryTime'), metric: 'RECOVERY_TIME', color: '#F76808' },
  ];

  if (stats.isLoading || !stats.data) {
    return (
      <View style={styles.loading}>
        <View style={styles.grid}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} width="48%" height={110} radius={16} style={{ marginBottom: 12 }} />
          ))}
        </View>
      </View>
    );
  }
  const s = stats.data;
  const delta = s.weeklyMinutes - s.lastWeekMinutes;
  const trend = delta === 0 ? t('metrics.flat') : `${delta > 0 ? '+' : '−'}${Math.abs(delta)}min`;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.section}>{t('metrics.yours')}</Text>
      <View style={styles.grid}>
        <MetricWidget
          icon="fire"
          label={t('metrics.streak')}
          value={String(s.currentStreak)}
          sub={tf('metrics.streak.sub', { n: s.longestStreak })}
          color={palette.primary}
        />
        <MetricWidget
          icon="lightning-bolt"
          label={t('metrics.load')}
          value={formatMinutes(s.weeklyMinutes)}
          sub={trend}
          color="#E0A82E"
        />
        <MetricWidget
          icon="fire"
          label={t('metrics.calories')}
          value={s.weeklyCalories != null ? String(s.weeklyCalories) : '—'}
          sub={s.weeklyCalories != null ? t('metrics.calories.sub') : t('metrics.calories.needWeight')}
          color="#E5484D"
        />
        <MetricWidget
          icon="dumbbell"
          label={t('metrics.trainings')}
          value={String(s.totalCheckIns)}
          sub={t('metrics.trainings.sub')}
          color="#2DB6A3"
        />
        <MetricWidget
          icon="calendar-check"
          label={t('metrics.weeks')}
          value={String(s.activeWeeks)}
          sub={t('metrics.weeks.sub')}
          color="#3E63DD"
        />
      </View>

      <View style={styles.lockedHead}>
        <Text style={styles.section}>{t('metrics.wearable')}</Text>
        <MaterialCommunityIcons name="watch-variant" size={16} color={palette.textSecondary} />
      </View>
      <Text style={styles.wearableHint}>{t('metrics.wearable.hint')}</Text>
      <Pressable style={styles.connectRow} onPress={() => navigation.navigate('Wearables')}>
        <MaterialCommunityIcons name="plus-circle-outline" size={18} color={palette.primary} />
        <Text style={styles.connectText}>{t('metrics.connect')}</Text>
        <MaterialCommunityIcons name="chevron-right" size={18} color={palette.textSecondary} />
      </Pressable>
      <View style={styles.grid}>
        {LOCKED.map((m) => {
          const b = bioMap.get(m.metric);
          return b ? (
            <MetricWidget key={m.label} icon={m.icon} label={m.label} value={formatBio(b.value, b.unit)} sub={t('metrics.synced')} color={m.color} />
          ) : (
            <MetricWidget key={m.label} icon={m.icon} label={m.label} sub={t('metrics.soon')} locked />
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  content: { padding: 16, paddingBottom: 40 },
  loading: { flex: 1, backgroundColor: palette.background, padding: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  section: { color: palette.textSecondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12, marginLeft: 2 },
  lockedHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  wearableHint: { color: palette.textSecondary, fontSize: 12, marginBottom: 12, marginLeft: 2 },
  connectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: palette.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  connectText: { color: palette.primary, fontWeight: '700', flex: 1 },
});
