import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useHeaderHeight } from '@react-navigation/elements';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { ActivityIndicator, Button, Text, TextInput } from 'react-native-paper';

import { apiErrorMessage } from '../../api/auth';
import { Gym, addGymPhoto, deleteGymPhoto, getMyGym, updateGym } from '../../api/gyms';
import { resolveMediaUrl, uploadMedia } from '../../api/posts';
import { t } from '../../i18n';
import { palette } from '../../theme/theme';

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

async function pickAndUpload(): Promise<{ key: string; uri: string } | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    Alert.alert(t('mural.media.permission'));
    return null;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    quality: 0.7,
  });
  if (result.canceled) return null;
  const asset = result.assets[0];
  const uploaded = await uploadMedia({
    uri: asset.uri,
    name: asset.fileName ?? 'foto.jpg',
    type: asset.mimeType ?? 'image/jpeg',
  });
  return { key: uploaded.key, uri: asset.uri };
}

export default function EditGymScreen({ navigation }: { navigation: { goBack: () => void } }) {
  const gym = useQuery({ queryKey: ['myGym'], queryFn: getMyGym });

  if (gym.isLoading || !gym.data) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }
  return <EditForm gym={gym.data} goBack={navigation.goBack} />;
}

function EditForm({ gym, goBack }: { gym: Gym; goBack: () => void }) {
  const queryClient = useQueryClient();
  const headerHeight = useHeaderHeight();

  const [name, setName] = useState(gym.name);
  const [city, setCity] = useState(gym.city ?? '');
  const [address, setAddress] = useState(gym.address ?? '');
  const [phone, setPhone] = useState(gym.phone ?? '');
  const [email, setEmail] = useState(gym.email ?? '');
  const [website, setWebsite] = useState(gym.website ?? '');
  const [bio, setBio] = useState(gym.description ?? '');
  const [logo, setLogo] = useState<{ key?: string; uri: string } | null>(
    gym.logoUrl ? { uri: resolveMediaUrl(gym.logoUrl) } : null,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['myGym'] });

  const save = useMutation({
    mutationFn: () =>
      updateGym({
        name: name.trim(),
        city: city.trim() || undefined,
        address: address.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        website: website.trim() || undefined,
        description: bio.trim() || undefined,
        logoKey: logo?.key,
      }),
    onSuccess: () => {
      invalidate();
      Alert.alert(t('gymProfile.edit.saved'));
      goBack();
    },
    onError: (e) => setError(apiErrorMessage(e)),
  });

  const addPhoto = useMutation({
    mutationFn: async () => {
      const picked = await pickAndUpload();
      if (picked) {
        await addGymPhoto(picked.key);
      }
    },
    onSuccess: invalidate,
    onError: (e) => setError(apiErrorMessage(e)),
  });

  const removePhoto = useMutation({
    mutationFn: (photoId: number) => deleteGymPhoto(photoId),
    onSuccess: invalidate,
  });

  const pickLogo = async () => {
    setBusy(true);
    setError(null);
    try {
      const picked = await pickAndUpload();
      if (picked) setLogo(picked);
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={headerHeight}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.logoRow}>
          <Pressable style={styles.logoPicker} onPress={pickLogo} disabled={busy}>
            {logo ? (
              <Image source={{ uri: logo.uri }} style={styles.logoImage} resizeMode="cover" />
            ) : (
              <View style={[styles.logoImage, styles.logoFallback]}>
                <Text style={styles.logoText}>{initialsOf(name || gym.name)}</Text>
              </View>
            )}
            <View style={styles.logoBadge}>
              {busy ? (
                <ActivityIndicator size={12} color="#fff" />
              ) : (
                <MaterialCommunityIcons name="camera" size={13} color="#fff" />
              )}
            </View>
          </Pressable>
          <Text style={styles.logoHint}>{t('gymProfile.edit.logo')}</Text>
        </View>

        <TextInput mode="outlined" label={t('gymProfile.edit.name')} value={name} onChangeText={setName} style={styles.input} />
        <TextInput mode="outlined" label={t('gymProfile.edit.city')} value={city} onChangeText={setCity} style={styles.input} />
        <TextInput mode="outlined" label={t('gymProfile.edit.address')} value={address} onChangeText={setAddress} style={styles.input} />
        <TextInput mode="outlined" label={t('gymProfile.edit.phone')} value={phone} onChangeText={setPhone} keyboardType="phone-pad" style={styles.input} />
        <TextInput mode="outlined" label={t('gymProfile.edit.email')} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" style={styles.input} />
        <TextInput mode="outlined" label={t('gymProfile.edit.website')} value={website} onChangeText={setWebsite} autoCapitalize="none" style={styles.input} />
        <TextInput mode="outlined" label={t('gymProfile.edit.bio')} value={bio} onChangeText={setBio} multiline numberOfLines={3} style={styles.input} />

        <Text style={styles.sectionTitle}>{t('gymProfile.photos')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gallery}>
          {gym.photos.map((p) => (
            <View key={p.id} style={styles.photoWrap}>
              <Image source={{ uri: resolveMediaUrl(p.url) }} style={styles.photo} resizeMode="cover" />
              <Pressable style={styles.photoX} onPress={() => removePhoto.mutate(p.id)} hitSlop={6}>
                <MaterialCommunityIcons name="close" size={12} color="#fff" />
              </Pressable>
            </View>
          ))}
          <Pressable
            style={styles.addPhoto}
            onPress={() => addPhoto.mutate()}
            disabled={addPhoto.isPending}>
            {addPhoto.isPending ? (
              <ActivityIndicator size="small" color={palette.primary} />
            ) : (
              <>
                <MaterialCommunityIcons name="plus" size={22} color={palette.primary} />
                <Text style={styles.addPhotoText}>{t('gymProfile.edit.addPhoto')}</Text>
              </>
            )}
          </Pressable>
        </ScrollView>

        {error && <Text style={styles.error}>{error}</Text>}

        <Button
          mode="contained"
          onPress={() => save.mutate()}
          disabled={name.trim().length === 0 || save.isPending || busy}
          loading={save.isPending}
          contentStyle={styles.saveContent}
          style={styles.save}>
          {t('gymProfile.edit.save')}
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.background },
  content: { padding: 20, paddingBottom: 40 },
  logoRow: { alignItems: 'center', marginBottom: 16 },
  logoPicker: { position: 'relative' },
  logoImage: { width: 76, height: 76, borderRadius: 20 },
  logoFallback: { backgroundColor: palette.primary, alignItems: 'center', justifyContent: 'center' },
  logoText: { color: '#fff', fontWeight: 'bold', fontSize: 24 },
  logoBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: palette.background,
  },
  logoHint: { color: palette.textSecondary, fontSize: 11, marginTop: 8 },
  input: { marginBottom: 12 },
  sectionTitle: { color: palette.textPrimary, fontSize: 13, fontWeight: 'bold', marginTop: 4, marginBottom: 10 },
  gallery: { marginBottom: 16 },
  photoWrap: { marginRight: 8 },
  photo: { width: 110, height: 80, borderRadius: 10, backgroundColor: palette.surfaceVariant },
  photoX: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhoto: {
    width: 110,
    height: 80,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: palette.outline,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  addPhotoText: { color: palette.textSecondary, fontSize: 10 },
  error: { color: palette.primary, marginBottom: 10 },
  save: { marginTop: 4 },
  saveContent: { paddingVertical: 6 },
});
