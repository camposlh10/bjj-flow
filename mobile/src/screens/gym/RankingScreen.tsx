import { FlatList, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';

import { RankingEntry, getRanking } from '../../api/gyms';
import BeltVisual from '../../components/BeltVisual';
import { rankBarColorFor } from '../../constants/belts';
import { t, tf } from '../../i18n';
import { useAuthStore } from '../../store/authStore';
import { palette } from '../../theme/theme';

const PODIUM: Record<number, { bg: string; fg: string }> = {
  1: { bg: '#FACC15', fg: '#422006' },
  2: { bg: '#9CA3AF', fg: '#1F2937' },
  3: { bg: '#B45309', fg: '#FEF3C7' },
};

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

export default function RankingScreen() {
  const myUserId = useAuthStore((s) => s.user?.id);
  const ranking = useQuery({ queryKey: ['gymRanking'], queryFn: getRanking });

  if (ranking.isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  const hasClasses = (ranking.data ?? []).some((e) => e.classes > 0);

  return (
    <FlatList
      data={ranking.data ?? []}
      keyExtractor={(e) => String(e.userId)}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={<Text style={styles.title}>{t('ranking.title')}</Text>}
      ListEmptyComponent={<Text style={styles.empty}>{t('ranking.empty')}</Text>}
      ListFooterComponent={
        !hasClasses && (ranking.data?.length ?? 0) > 0 ? (
          <Text style={styles.empty}>{t('ranking.empty')}</Text>
        ) : null
      }
      renderItem={({ item }: { item: RankingEntry }) => {
        const podium = PODIUM[item.position];
        const isMe = item.userId === myUserId;
        return (
          <View style={[styles.row, isMe && styles.rowMe]}>
            {podium ? (
              <View style={[styles.posBadge, { backgroundColor: podium.bg }]}>
                <Text style={[styles.posBadgeText, { color: podium.fg }]}>{item.position}</Text>
              </View>
            ) : (
              <Text style={styles.pos}>{item.position}</Text>
            )}
            <View style={[styles.avatar, isMe && styles.avatarMe]}>
              <Text style={[styles.avatarText, isMe && styles.avatarTextMe]}>
                {initialsOf(item.displayName)}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>
                {isMe ? t('ranking.you') : item.displayName}
              </Text>
              {item.belt && (
                <View style={styles.beltMini}>
                  <BeltVisual
                    color={item.belt.colorHex}
                    rankBarColor={rankBarColorFor(item.belt.slug)}
                    stripes={item.belt.stripes}
                    height={8}
                  />
                </View>
              )}
            </View>
            <Text style={styles.classes}>
              {item.classes === 1
                ? t('ranking.classes.one')
                : tf('ranking.classes.many', { n: item.classes })}
            </Text>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  content: { paddingBottom: 24 },
  title: { color: palette.textSecondary, fontSize: 11, marginBottom: 10 },
  empty: { color: palette.textSecondary, textAlign: 'center', paddingVertical: 24 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#1A1A20',
  },
  rowMe: {
    backgroundColor: palette.surface,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: palette.primary,
    borderBottomWidth: 0.5,
  },
  pos: { width: 24, textAlign: 'center', color: palette.textSecondary, fontSize: 12 },
  posBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  posBadgeText: { fontSize: 12, fontWeight: 'bold' },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: palette.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarMe: { backgroundColor: palette.primary },
  avatarText: { color: palette.textPrimary, fontWeight: 'bold', fontSize: 10 },
  avatarTextMe: { color: '#fff' },
  name: { color: palette.textPrimary, fontSize: 12, fontWeight: 'bold' },
  beltMini: { width: 38, marginTop: 4 },
  classes: { color: palette.textPrimary, fontSize: 12, fontWeight: 'bold' },
});
