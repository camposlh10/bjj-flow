import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';

import {
  createPersonalTechnique,
  deletePersonalTechnique,
  updatePersonalTechnique,
  type PersonalTechniqueInput,
} from '../api/techniques';
import { t } from '../i18n';
import type { HomeStackParamList } from '../navigation/HomeNavigator';
import { palette } from '../theme/theme';

export default function PersonalTechniqueEditorScreen() {
  const route = useRoute<RouteProp<HomeStackParamList, 'PersonalTechniqueEditor'>>();
  const navigation = useNavigation();
  const qc = useQueryClient();
  const existing = route.params?.technique;

  const [name, setName] = useState(existing?.name ?? '');
  const [category, setCategory] = useState(existing?.category ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [videoUrl, setVideoUrl] = useState(existing?.videoUrl ?? '');

  const done = () => {
    qc.invalidateQueries({ queryKey: ['personalTechniques'] });
    navigation.goBack();
  };

  const save = useMutation({
    mutationFn: (body: PersonalTechniqueInput) =>
      existing ? updatePersonalTechnique(existing.id, body) : createPersonalTechnique(body),
    onSuccess: done,
  });

  const remove = useMutation({
    mutationFn: () => deletePersonalTechnique(existing!.id),
    onSuccess: done,
  });

  const confirmDelete = () =>
    Alert.alert(t('techniques.delete.confirm'), undefined, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('techniques.delete'), style: 'destructive', onPress: () => remove.mutate() },
    ]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
      <Field label={t('techniques.field.name')} value={name} onChange={setName} />
      <Field label={t('techniques.field.category')} value={category} onChange={setCategory} />
      <Field label={t('techniques.field.notes')} value={notes} onChange={setNotes} multiline />
      <Field label={t('techniques.field.videoUrl')} value={videoUrl} onChange={setVideoUrl} keyboard="url" />

      <Button
        mode="contained"
        style={styles.save}
        loading={save.isPending}
        disabled={!name.trim() || save.isPending}
        onPress={() =>
          save.mutate({
            name: name.trim(),
            category: category.trim() || null,
            notes: notes.trim() || null,
            videoUrl: videoUrl.trim() || null,
          })
        }>
        {t('techniques.save')}
      </Button>

      {existing && (
        <Button mode="text" textColor={palette.primary} onPress={confirmDelete} style={{ marginTop: 4 }}>
          {t('techniques.delete')}
        </Button>
      )}
    </ScrollView>
  );
}

function Field({
  label,
  value,
  onChange,
  multiline,
  keyboard,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  keyboard?: 'url';
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        mode="outlined"
        value={value}
        onChangeText={onChange}
        multiline={multiline}
        autoCapitalize={keyboard === 'url' ? 'none' : 'sentences'}
        keyboardType={keyboard === 'url' ? 'url' : 'default'}
        style={[styles.input, multiline && { minHeight: 90 }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  body: { padding: 16 },
  label: { color: palette.textSecondary, fontSize: 12, marginBottom: 6 },
  input: { backgroundColor: palette.surface },
  save: { marginTop: 8, borderRadius: 12 },
});
