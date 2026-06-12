import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, IconButton, Text } from 'react-native-paper';

import { apiErrorMessage } from '../../api/auth';
import { GymRole, getGymMembers, getMyGym, promoteMember } from '../../api/gyms';
import BeltVisual, { formatStripes } from '../../components/BeltVisual';
import { ADULT_BELTS, KIDS_BELTS, beltBySlug, maxStripesFor, rankBarColorFor } from '../../constants/belts';
import { t, tf } from '../../i18n';
import { GymStackParamList } from '../../navigation/GymNavigator';
import { useAuthStore } from '../../store/authStore';
import { palette } from '../../theme/theme';

type Props = NativeStackScreenProps<GymStackParamList, 'MemberProfile'>;

const ALL_BELTS = [...ADULT_BELTS, ...KIDS_BELTS];

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

function roleLabel(role: GymRole): string {
  if (role === 'OWNER') return t('gym.role.OWNER');
  if (role === 'INSTRUCTOR') return t('gym.role.INSTRUCTOR');
  return t('gym.role.MEMBER');
}

export default function MemberProfileScreen({ route }: Props) {
  const { userId } = route.params;
  const queryClient = useQueryClient();
  const myUserId = useAuthStore((s) => s.user?.id);

  const gym = useQuery({ queryKey: ['myGym'], queryFn: getMyGym });
  const members = useQuery({ queryKey: ['gymMembers'], queryFn: getGymMembers });

  const member = members.data?.find((m) => m.userId === userId);
  const staffViewer = gym.data ? gym.data.role !== 'MEMBER' : false;
  const target = gym.data?.graduationTarget ?? 40;

  const [sheetOpen, setSheetOpen] = useState(false);
  const [beltSlug, setBeltSlug] = useState<string | null>(null);
  const [stripes, setStripes] = useState(0);

  const promote = useMutation({
    mutationFn: () => promoteMember(userId, beltSlug!, stripes),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSheetOpen(false);
      queryClient.invalidateQueries({ queryKey: ['gymMembers'] });
      queryClient.invalidateQueries({ queryKey: ['gymFeed'] });
      queryClient.invalidateQueries({ queryKey: ['savedPosts'] });
      Alert.alert(t('member.promote.success'));
    },
    onError: (e) => Alert.alert(apiErrorMessage(e)),
  });

  if (gym.isLoading || members.isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!member) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>—</Text>
      </View>
    );
  }

  const openSheet = () => {
    setBeltSlug(member.belt?.slug ?? 'adult-white');
    setStripes(member.belt?.stripes ?? 0);
    setSheetOpen(true);
  };

  const selectedBelt = beltSlug ? beltBySlug(beltSlug) : undefined;
  const maxStripes = beltSlug ? maxStripesFor(beltSlug) : 4;
  const progress = Math.min(1, member.classesAttended / target);
  const ready = member.classesAttended >= target;

  const changeStripes = (delta: number) => {
    const next = Math.min(maxStripes, Math.max(0, stripes + delta));
    if (next !== stripes) {
      Haptics.selectionAsync();
      setStripes(next);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerCenter}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initialsOf(member.displayName)}</Text>
        </View>
        <Text variant="titleLarge" style={styles.name}>
          {member.displayName}
        </Text>
        <View style={styles.roleChip}>
          <Text style={styles.roleChipText}>{roleLabel(member.role)}</Text>
        </View>
      </View>

      {member.belt && (
        <View style={styles.beltSection}>
          <BeltVisual
            color={member.belt.colorHex}
            rankBarColor={rankBarColorFor(member.belt.slug)}
            stripes={member.belt.stripes}
            height={32}
          />
          <Text style={styles.beltLabel}>
            {t('home.belt')} {member.belt.namePt}
            {member.belt.stripes > 0 ? ` · ${formatStripes(member.belt.stripes)}` : ''}
          </Text>
        </View>
      )}

      {staffViewer && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('member.progress.title')}</Text>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${progress * 100}%` },
                ready && styles.progressReady,
              ]}
            />
          </View>
          <Text style={[styles.progressLabel, ready && styles.progressLabelReady]}>
            {ready
              ? t('member.progress.ready')
              : tf('member.progress.classes', { n: member.classesAttended, m: target })}
          </Text>
        </View>
      )}

      {staffViewer && member.userId !== myUserId && (
        <Button mode="contained" style={styles.promoteBtn} contentStyle={styles.promoteContent} onPress={openSheet}>
          {t('member.promote')}
        </Button>
      )}

      <Modal visible={sheetOpen} transparent animationType="slide">
        <Pressable style={styles.sheetBackdrop} onPress={() => setSheetOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => undefined}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{t('member.promote.title')}</Text>

            {selectedBelt && (
              <View style={styles.preview}>
                <BeltVisual
                  color={selectedBelt.color}
                  rankBarColor={rankBarColorFor(selectedBelt.slug)}
                  stripes={stripes}
                  height={40}
                />
                <Text style={styles.previewLabel}>
                  {selectedBelt.namePt}
                  {stripes > 0 ? ` · ${formatStripes(stripes)}` : ''}
                </Text>
              </View>
            )}

            <Text style={styles.sheetLabel}>{t('member.promote.belt')}</Text>
            <View style={styles.beltChips}>
              {ALL_BELTS.map((b) => {
                const on = beltSlug === b.slug;
                return (
                  <Pressable
                    key={b.slug}
                    style={[styles.beltChip, on && styles.beltChipOn]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setBeltSlug(b.slug);
                      setStripes((s) => Math.min(s, maxStripesFor(b.slug)));
                    }}>
                    <View style={[styles.beltDot, { backgroundColor: b.color }]} />
                    <Text style={[styles.beltChipText, on && styles.beltChipTextOn]}>{b.namePt}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.sheetLabel}>{t('member.promote.stripes')}</Text>
            <View style={styles.stripesRow}>
              <IconButton
                icon="minus"
                size={20}
                iconColor={palette.textPrimary}
                onPress={() => changeStripes(-1)}
              />
              <Text style={styles.stripesNum}>{stripes}</Text>
              <IconButton
                icon="plus"
                size={20}
                iconColor={palette.primary}
                onPress={() => changeStripes(1)}
              />
            </View>

            <Button
              mode="contained"
              onPress={() => promote.mutate()}
              loading={promote.isPending}
              disabled={!beltSlug || promote.isPending}
              contentStyle={styles.promoteContent}>
              {t('member.promote.confirm')}
            </Button>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.background },
  muted: { color: palette.textSecondary },
  content: { padding: 20 },
  headerCenter: { alignItems: 'center', marginBottom: 20 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: palette.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  avatarText: { color: palette.textPrimary, fontWeight: 'bold', fontSize: 24 },
  name: { color: palette.textPrimary, fontWeight: 'bold' },
  roleChip: {
    backgroundColor: palette.surfaceVariant,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 6,
  },
  roleChipText: { color: palette.textSecondary, fontSize: 11 },
  beltSection: { gap: 8, marginBottom: 16 },
  beltLabel: { color: palette.textSecondary, fontSize: 12 },
  card: { backgroundColor: palette.surface, borderRadius: 16, padding: 16, marginBottom: 16 },
  cardTitle: { color: palette.textPrimary, fontSize: 13, fontWeight: 'bold', marginBottom: 10 },
  progressTrack: { height: 8, borderRadius: 999, backgroundColor: palette.surfaceVariant, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: palette.primary },
  progressReady: { backgroundColor: '#16A34A' },
  progressLabel: { color: palette.textSecondary, fontSize: 11, marginTop: 8 },
  progressLabelReady: { color: '#4ADE80', fontWeight: 'bold' },
  promoteBtn: { marginTop: 4 },
  promoteContent: { paddingVertical: 5 },
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: palette.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 32,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 999,
    backgroundColor: palette.outline,
    alignSelf: 'center',
    marginBottom: 12,
  },
  sheetTitle: { color: palette.textPrimary, fontSize: 15, fontWeight: 'bold', textAlign: 'center', marginBottom: 14 },
  preview: { gap: 8, marginBottom: 16, alignItems: 'center' },
  previewLabel: { color: palette.textPrimary, fontSize: 13, fontWeight: 'bold', textTransform: 'capitalize' },
  sheetLabel: { color: palette.textSecondary, fontSize: 12, marginBottom: 8 },
  beltChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  beltChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: palette.surfaceVariant,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  beltChipOn: { backgroundColor: palette.primary },
  beltChipText: { color: palette.textSecondary, fontSize: 12 },
  beltChipTextOn: { color: '#fff', fontWeight: 'bold' },
  beltDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.3)' },
  stripesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
  },
  stripesNum: { color: palette.textPrimary, fontSize: 18, fontWeight: 'bold', minWidth: 24, textAlign: 'center' },
});
