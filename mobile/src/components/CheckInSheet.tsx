import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';

import { apiErrorMessage } from '../api/auth';
import { CheckInSubmission, createCheckIn, todayLocalDate } from '../api/checkins';
import { SUBMISSIONS } from '../constants/submissions';
import { t } from '../i18n';
import { useAuthStore } from '../store/authStore';
import { palette } from '../theme/theme';

type Direction = 'HIT' | 'CONCEDED';
const TYPES: { key: string; label: string }[] = [
  { key: 'GI', label: t('checkin.type.GI') },
  { key: 'NOGI', label: t('checkin.type.NOGI') },
  { key: 'OPEN_MAT', label: t('checkin.type.OPEN_MAT') },
];
const DURATIONS = [60, 90, 120, 180];

export default function CheckInSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const myId = useAuthStore((s) => s.user?.id);

  const [sessionType, setSessionType] = useState('GI');
  const [duration, setDuration] = useState(60);
  const [subDir, setSubDir] = useState<Direction>('HIT');
  const [hit, setHit] = useState<Record<string, number>>({});
  const [conceded, setConceded] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState('');

  const reset = () => {
    setSessionType('GI');
    setDuration(60);
    setSubDir('HIT');
    setHit({});
    setConceded({});
    setNotes('');
  };

  const save = useMutation({
    mutationFn: () => {
      const submissions: CheckInSubmission[] = [
        ...Object.entries(hit).filter(([, n]) => n > 0).map(([submission, n]) => ({ submission, direction: 'HIT' as const, count: n })),
        ...Object.entries(conceded).filter(([, n]) => n > 0).map(([submission, n]) => ({ submission, direction: 'CONCEDED' as const, count: n })),
      ];
      return createCheckIn({
        date: todayLocalDate(),
        sessionType,
        durationMinutes: duration,
        notes: notes.trim() || undefined,
        submissions: submissions.length ? submissions : undefined,
      });
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['journey'] });
      queryClient.invalidateQueries({ queryKey: ['academyActivity'] });
      queryClient.invalidateQueries({ queryKey: ['userSubmissions'] });
      if (myId) queryClient.invalidateQueries({ queryKey: ['userProfile', myId] });
      reset();
      onClose();
      Alert.alert(t('checkin.sheet.saved'));
    },
    onError: (e) => Alert.alert(apiErrorMessage(e)),
  });

  const counts = subDir === 'HIT' ? hit : conceded;
  const setCounts = subDir === 'HIT' ? setHit : setConceded;
  const bump = (key: string, delta: number) =>
    setCounts((prev) => {
      const next = Math.max(0, (prev[key] ?? 0) + delta);
      if (delta > 0) Haptics.selectionAsync();
      return { ...prev, [key]: next };
    });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => undefined}>
          <View style={styles.handle} />
          <Text style={styles.title}>{t('checkin.sheet.title')}</Text>
          <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
            {/* Session type */}
            <Text style={styles.label}>{t('checkin.sheet.type')}</Text>
            <View style={styles.chips}>
              {TYPES.map((x) => (
                <Pressable
                  key={x.key}
                  style={[styles.chip, sessionType === x.key && styles.chipOn]}
                  onPress={() => setSessionType(x.key)}>
                  <Text style={[styles.chipText, sessionType === x.key && styles.chipTextOn]}>{x.label}</Text>
                </Pressable>
              ))}
            </View>

            {/* Duration */}
            <Text style={styles.label}>{t('checkin.sheet.duration')}</Text>
            <View style={styles.chips}>
              {DURATIONS.map((d) => (
                <Pressable key={d} style={[styles.chip, duration === d && styles.chipOn]} onPress={() => setDuration(d)}>
                  <Text style={[styles.chipText, duration === d && styles.chipTextOn]}>
                    {d % 60 === 0 ? `${d / 60}h` : `${(d / 60).toFixed(1)}h`}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Submissions */}
            <View style={styles.subToggle}>
              <Pressable
                style={[styles.segBtn, subDir === 'HIT' && styles.segBtnOn]}
                onPress={() => setSubDir('HIT')}>
                <Text style={[styles.segText, subDir === 'HIT' && styles.segTextOn]}>{t('checkin.sheet.subsHit')}</Text>
              </Pressable>
              <Pressable
                style={[styles.segBtn, subDir === 'CONCEDED' && styles.segBtnOn]}
                onPress={() => setSubDir('CONCEDED')}>
                <Text style={[styles.segText, subDir === 'CONCEDED' && styles.segTextOn]}>
                  {t('checkin.sheet.subsConceded')}
                </Text>
              </Pressable>
            </View>
            <View style={styles.subList}>
              {SUBMISSIONS.map((s) => {
                const n = counts[s.key] ?? 0;
                return (
                  <View key={s.key} style={styles.subRow}>
                    <View style={[styles.subDot, { backgroundColor: s.color }]} />
                    <Text style={[styles.subLabel, n > 0 && styles.subLabelOn]} numberOfLines={1}>
                      {s.label}
                    </Text>
                    <Pressable onPress={() => bump(s.key, -1)} hitSlop={8} style={styles.stepBtn} disabled={n === 0}>
                      <MaterialCommunityIcons name="minus" size={15} color={n === 0 ? palette.outline : palette.textPrimary} />
                    </Pressable>
                    <Text style={styles.stepNum}>{n}</Text>
                    <Pressable onPress={() => bump(s.key, 1)} hitSlop={8} style={styles.stepBtn}>
                      <MaterialCommunityIcons name="plus" size={15} color={palette.primary} />
                    </Pressable>
                  </View>
                );
              })}
            </View>

            <TextInput
              mode="outlined"
              value={notes}
              onChangeText={setNotes}
              placeholder={t('checkin.sheet.notes.placeholder')}
              multiline
              numberOfLines={2}
              style={styles.notes}
            />
          </ScrollView>

          <Button
            mode="contained"
            icon="check"
            loading={save.isPending}
            disabled={save.isPending}
            onPress={() => save.mutate()}
            contentStyle={styles.saveContent}
            style={styles.save}>
            {t('checkin.sheet.save')}
          </Button>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: palette.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 28,
    maxHeight: '88%',
  },
  handle: { width: 36, height: 4, borderRadius: 999, backgroundColor: palette.outline, alignSelf: 'center', marginBottom: 12 },
  title: { color: palette.textPrimary, fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginBottom: 14 },
  scroll: { flexGrow: 0 },
  label: { color: palette.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 8, marginTop: 6 },
  chips: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: palette.surfaceVariant },
  chipOn: { backgroundColor: palette.primary },
  chipText: { color: palette.textSecondary, fontSize: 13, fontWeight: '600' },
  chipTextOn: { color: '#fff' },
  subToggle: { flexDirection: 'row', backgroundColor: palette.surfaceVariant, borderRadius: 10, padding: 3, marginTop: 14, marginBottom: 10 },
  segBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  segBtnOn: { backgroundColor: palette.surface },
  segText: { color: palette.textSecondary, fontSize: 12, fontWeight: '600' },
  segTextOn: { color: palette.textPrimary },
  subList: { gap: 2 },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  subDot: { width: 10, height: 10, borderRadius: 5 },
  subLabel: { color: palette.textSecondary, fontSize: 13, flex: 1 },
  subLabelOn: { color: palette.textPrimary, fontWeight: '600' },
  stepBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: palette.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNum: { color: palette.textPrimary, fontSize: 14, fontWeight: 'bold', minWidth: 18, textAlign: 'center' },
  notes: { marginTop: 14, backgroundColor: palette.surface },
  save: { marginTop: 16 },
  saveContent: { paddingVertical: 6 },
});
