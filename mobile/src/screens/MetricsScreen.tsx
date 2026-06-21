import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { ComponentProps } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { getStats } from '../api/checkins';
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

// Metrics that need a wearable (WHOOP/Garmin/Apple Watch) — shown locked for now.
const LOCKED: { icon: ComponentProps<typeof MaterialCommunityIcons>['name']; label: string }[] = [
  { icon: 'heart-pulse', label: t('metrics.recovery') },
  { icon: 'gauge', label: t('metrics.readiness') },
  { icon: 'sleep', label: t('metrics.sleep') },
  { icon: 'sine-wave', label: t('metrics.hrv') },
  { icon: 'heart', label: t('metrics.restingHr') },
  { icon: 'lungs', label: t('metrics.vo2max') },
  { icon: 'timer-sand', label: t('metrics.recoveryTime') },
];

export default function MetricsScreen() {
  const stats = useQuery({ queryKey: ['stats'], queryFn: getStats });

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
      <View style={styles.grid}>
        {LOCKED.map((m) => (
          <MetricWidget key={m.label} icon={m.icon} label={m.label} sub={t('metrics.soon')} locked />
        ))}
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
});
