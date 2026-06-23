import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Text, TextInput } from 'react-native-paper';

import { getPainMap, logPain } from '../api/pain';
import BodyMap from '../components/BodyMap';
import { BodyView, bodyRegionLabel, intensityColor } from '../constants/body';
import { t } from '../i18n';
import { palette } from '../theme/theme';

export default function BodyMapScreen() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['painMap'], queryFn: getPainMap });
  const [view, setView] = useState<BodyView>('front');
  const [selected, setSelected] = useState<string | null>(null);
  const [intensity, setIntensity] = useState(0);
  const [note, setNote] = useState('');

  const painByRegion: Record<string, number> = {};
  (data?.regions ?? []).forEach((r) => {
    painByRegion[r.region] = r.intensity;
  });

  const close = () => {
    setSelected(null);
    setNote('');
    setIntensity(0);
  };

  const save = useMutation({
    mutationFn: () => logPain({ region: selected!, intensity, note: note.trim() || null }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['painMap'] });
      close();
    },
  });

  const openRegion = (region: string) => {
    const existing = data?.regions.find((r) => r.region === region);
    setSelected(region);
    setIntensity(existing?.intensity ?? 0);
    setNote(existing?.note ?? '');
  };

  if (isLoading) {
    return <ActivityIndicator style={{ marginTop: 48 }} color={palette.primary} />;
  }
  const active = data?.regions ?? [];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.body}>
      <Text style={styles.intro}>{t('body.intro')}</Text>

      <View style={styles.toggle}>
        {(['front', 'back'] as const).map((v) => (
          <Pressable key={v} style={[styles.toggleBtn, view === v && styles.toggleActive]} onPress={() => setView(v)}>
            <Text style={[styles.toggleText, view === v && styles.toggleTextActive]}>
              {t(v === 'front' ? 'body.front' : 'body.back')}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.bodyWrap}>
        <BodyMap view={view} pain={painByRegion} onRegionPress={openRegion} width={230} />
      </View>

      <View style={styles.legend}>
        <Legend color="#E0A82E" label={t('body.legend.low')} />
        <Legend color="#F76808" label={t('body.legend.mid')} />
        <Legend color="#E5484D" label={t('body.legend.high')} />
      </View>

      <Text style={styles.section}>{t('body.current')}</Text>
      {active.length === 0 ? (
        <Text style={styles.none}>{t('body.none')}</Text>
      ) : (
        active.map((r) => (
          <Pressable key={r.region} style={styles.painRow} onPress={() => openRegion(r.region)}>
            <View style={[styles.dot, { backgroundColor: intensityColor(r.intensity) }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.painName}>{bodyRegionLabel(r.region)}</Text>
              {!!r.note && (
                <Text style={styles.painNote} numberOfLines={1}>
                  {r.note}
                </Text>
              )}
            </View>
            <Text style={[styles.painVal, { color: intensityColor(r.intensity) }]}>{r.intensity}/10</Text>
          </Pressable>
        ))
      )}

      <Modal visible={!!selected} transparent animationType="slide" onRequestClose={close}>
        <Pressable style={styles.backdrop} onPress={close}>
          <Pressable style={styles.sheet} onPress={() => undefined}>
            <Text style={styles.sheetTitle}>{selected ? bodyRegionLabel(selected) : ''}</Text>
            <Text style={styles.sheetLabel}>{t('body.intensity')}</Text>
            <View style={styles.scale}>
              {Array.from({ length: 11 }).map((_, i) => (
                <Pressable
                  key={i}
                  onPress={() => setIntensity(i)}
                  style={[
                    styles.scaleBtn,
                    { backgroundColor: i === intensity ? (i === 0 ? palette.outline : intensityColor(i)) : palette.surfaceVariant },
                  ]}>
                  <Text style={[styles.scaleText, i === intensity && { color: '#FFFFFF', fontWeight: '800' }]}>{i}</Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              mode="outlined"
              placeholder={t('body.note')}
              value={note}
              onChangeText={setNote}
              style={styles.noteInput}
            />
            <Button mode="contained" style={styles.saveBtn} loading={save.isPending} onPress={() => save.mutate()}>
              {intensity === 0 ? t('body.clear') : t('body.save')}
            </Button>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  body: { padding: 16, paddingBottom: 40 },
  intro: { color: palette.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 14 },
  toggle: { flexDirection: 'row', alignSelf: 'center', backgroundColor: palette.surface, borderRadius: 12, padding: 4, marginBottom: 8 },
  toggleBtn: { paddingVertical: 7, paddingHorizontal: 26, borderRadius: 9 },
  toggleActive: { backgroundColor: palette.surfaceVariant },
  toggleText: { color: palette.textSecondary, fontWeight: '600' },
  toggleTextActive: { color: palette.textPrimary },
  bodyWrap: { alignItems: 'center', marginVertical: 8 },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 18, marginBottom: 18 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { color: palette.textSecondary, fontSize: 12 },
  section: { color: palette.textSecondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, marginLeft: 2 },
  none: { color: palette.textSecondary, textAlign: 'center', paddingVertical: 16 },
  painRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: palette.surface, borderRadius: 12, padding: 14, marginBottom: 10 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  painName: { color: palette.textPrimary, fontWeight: '600', fontSize: 15 },
  painNote: { color: palette.textSecondary, fontSize: 12, marginTop: 2 },
  painVal: { fontWeight: '800', fontSize: 15 },
  backdrop: { flex: 1, backgroundColor: '#00000088', justifyContent: 'flex-end' },
  sheet: { backgroundColor: palette.surface, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20, paddingBottom: 32 },
  sheetTitle: { color: palette.textPrimary, fontSize: 20, fontWeight: '800', marginBottom: 16 },
  sheetLabel: { color: palette.textSecondary, fontSize: 13, marginBottom: 10 },
  scale: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  scaleBtn: { width: 28, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  scaleText: { color: palette.textPrimary, fontWeight: '600' },
  noteInput: { backgroundColor: palette.background, marginBottom: 16 },
  saveBtn: { borderRadius: 12 },
});
