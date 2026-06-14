import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useHeaderHeight } from '@react-navigation/elements';
import { useNavigation } from '@react-navigation/native';
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

import { apiErrorMessage } from '../api/auth';
import { MedalInput, MedalTier } from '../api/gyms';
import { resolveMediaUrl, uploadMedia } from '../api/posts';
import {
  ProfilePhoto,
  UserProfile,
  addMyPhoto,
  deleteMyPhoto,
  getUserProfile,
  togglePro,
  updateMyMedals,
  updateMyProfile,
} from '../api/users';
import MedalVisual from '../components/MedalVisual';
import { COMPETITIONS } from '../constants/competitions';
import { t } from '../i18n';
import { useAuthStore } from '../store/authStore';
import { palette } from '../theme/theme';

const TIERS: { key: MedalTier; color: string }[] = [
  { key: 'GOLD', color: '#F5C518' },
  { key: 'SILVER', color: '#C7CED6' },
  { key: 'BRONZE', color: '#CD7F32' },
];

const ACCENT_COLORS = ['#E63946', '#2563EB', '#16A34A', '#7C3AED', '#F59E0B', '#06B6D4'];

type MedalEntry = { count: number; tier: MedalTier };
type Pic = { key?: string; uri: string };

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

async function pickAndUpload(): Promise<Pic | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    Alert.alert(t('mural.media.permission'));
    return null;
  }
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.7 });
  if (result.canceled) return null;
  const asset = result.assets[0];
  const uploaded = await uploadMedia({
    uri: asset.uri,
    name: asset.fileName ?? 'foto.jpg',
    type: asset.mimeType ?? 'image/jpeg',
  });
  return { key: uploaded.key, uri: asset.uri };
}

export default function EditUserProfileScreen() {
  const me = useAuthStore((s) => s.user);
  const profile = useQuery({ queryKey: ['userProfile', me?.id ?? 0], queryFn: () => getUserProfile(me!.id) });

  if (profile.isLoading || !profile.data) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }
  return <Form profile={profile.data} />;
}

function Form({ profile }: { profile: UserProfile }) {
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const headerHeight = useHeaderHeight();
  const me = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [bio, setBio] = useState(profile.bio ?? '');
  const [avatar, setAvatar] = useState<Pic | null>(profile.avatarUrl ? { uri: resolveMediaUrl(profile.avatarUrl) } : null);
  const [cert, setCert] = useState<Pic | null>(
    profile.certificateUrl ? { uri: resolveMediaUrl(profile.certificateUrl) } : null,
  );
  const [accent, setAccent] = useState(profile.accentColor || ACCENT_COLORS[0]);
  const [photos, setPhotos] = useState<ProfilePhoto[]>(profile.photos);
  const [medalMap, setMedalMap] = useState<Record<string, MedalEntry>>(() => {
    const map: Record<string, MedalEntry> = {};
    profile.medals.forEach((m) => {
      map[m.competition] = { count: m.count, tier: m.tier };
    });
    return map;
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['userProfile', profile.id] });
    queryClient.invalidateQueries({ queryKey: ['userJourney', profile.id] });
  };

  const save = useMutation({
    mutationFn: async () => {
      await updateMyProfile({
        bio: bio.trim() || undefined,
        avatarKey: avatar?.key,
        certificateKey: cert?.key,
        accentColor: accent,
      });
      const medals: MedalInput[] = Object.entries(medalMap)
        .filter(([, e]) => e.count > 0)
        .map(([competition, e]) => ({ competition, tier: e.tier, count: e.count }));
      await updateMyMedals(medals);
    },
    onSuccess: () => {
      invalidate();
      Alert.alert(t('profile.edit.saved'));
      navigation.goBack();
    },
    onError: (e) => setError(apiErrorMessage(e)),
  });

  const proToggle = useMutation({ mutationFn: togglePro, onSuccess: invalidate });

  const addPhoto = useMutation({
    mutationFn: async () => {
      const picked = await pickAndUpload();
      return picked?.key ? addMyPhoto(picked.key) : null;
    },
    onSuccess: (data) => {
      if (data) {
        setPhotos(data.photos);
        invalidate();
      }
    },
    onError: (e) => setError(apiErrorMessage(e)),
  });

  const removePhoto = useMutation({
    mutationFn: (id: number) => deleteMyPhoto(id),
    onSuccess: (data) => {
      setPhotos(data.photos);
      invalidate();
    },
  });

  const entryFor = (label: string): MedalEntry => medalMap[label] ?? { count: 0, tier: 'GOLD' };
  const setCount = (label: string, count: number) =>
    setMedalMap((prev) => ({ ...prev, [label]: { tier: prev[label]?.tier ?? 'GOLD', count: Math.max(0, count) } }));
  const setTier = (label: string, tier: MedalTier) =>
    setMedalMap((prev) => ({ ...prev, [label]: { count: prev[label]?.count ?? 0, tier } }));

  const pick = async (setter: (p: Pic) => void) => {
    setBusy(true);
    setError(null);
    try {
      const picked = await pickAndUpload();
      if (picked) setter(picked);
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
        {/* Avatar */}
        <View style={styles.avatarRow}>
          <Pressable onPress={() => pick(setAvatar)} disabled={busy} style={styles.avatarPick}>
            {avatar ? (
              <Image source={{ uri: avatar.uri }} style={styles.avatar} resizeMode="cover" />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarText}>{initialsOf(profile.displayName)}</Text>
              </View>
            )}
            <View style={styles.avatarBadge}>
              {busy ? <ActivityIndicator size={12} color="#fff" /> : <MaterialCommunityIcons name="camera" size={13} color="#fff" />}
            </View>
          </Pressable>
          <Text style={styles.hint}>{t('profile.edit.photo')}</Text>
        </View>

        <TextInput
          mode="outlined"
          label={t('profile.edit.bio')}
          value={bio}
          onChangeText={setBio}
          placeholder={t('profile.edit.bio.placeholder')}
          multiline
          numberOfLines={3}
          style={styles.input}
        />

        {/* Accent color */}
        <Text style={styles.sectionTitle}>{t('profile.edit.color')}</Text>
        <View style={styles.colorRow}>
          {ACCENT_COLORS.map((c) => (
            <Pressable
              key={c}
              onPress={() => setAccent(c)}
              style={[styles.swatch, { backgroundColor: c }, accent === c && styles.swatchOn]}
            />
          ))}
        </View>

        {/* PRO toggle (temp) */}
        <View style={styles.proRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>{t('profile.edit.pro')}</Text>
            <Text style={styles.proStatus}>{profile.pro ? t('profile.edit.pro.on') : t('profile.edit.pro.off')}</Text>
          </View>
          <Button mode="outlined" compact loading={proToggle.isPending} disabled={proToggle.isPending} onPress={() => proToggle.mutate()}>
            {t('profile.edit.pro.toggle')}
          </Button>
        </View>

        {/* Medals */}
        <Text style={styles.sectionTitle}>{t('profile.edit.medals')}</Text>
        <View style={styles.medalGrid}>
          {COMPETITIONS.map((comp) => {
            const entry = entryFor(comp.label);
            const active = entry.count > 0;
            return (
              <View key={comp.key} style={[styles.medalCard, active && styles.medalCardActive]}>
                <MedalVisual competition={comp.label} tier={entry.tier} count={entry.count} size={50} />
                <Text style={styles.medalCardLabel} numberOfLines={1}>
                  {comp.label}
                </Text>
                <View style={styles.counter}>
                  <Pressable onPress={() => setCount(comp.label, entry.count - 1)} hitSlop={6} style={styles.counterBtn}>
                    <MaterialCommunityIcons name="minus" size={15} color={palette.textPrimary} />
                  </Pressable>
                  <Text style={styles.counterValue}>{entry.count}</Text>
                  <Pressable onPress={() => setCount(comp.label, entry.count + 1)} hitSlop={6} style={styles.counterBtn}>
                    <MaterialCommunityIcons name="plus" size={15} color={palette.textPrimary} />
                  </Pressable>
                </View>
                {active && (
                  <View style={styles.tierDots}>
                    {TIERS.map((tier) => (
                      <Pressable
                        key={tier.key}
                        onPress={() => setTier(comp.label, tier.key)}
                        hitSlop={6}
                        style={[styles.tierDot, { backgroundColor: tier.color }, entry.tier === tier.key && styles.tierDotOn]}
                      />
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Photos */}
        <Text style={styles.sectionTitle}>{t('profile.edit.photos')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gallery}>
          {photos.map((ph) => (
            <View key={ph.id} style={styles.photoWrap}>
              <Image source={{ uri: resolveMediaUrl(ph.url) }} style={styles.photo} resizeMode="cover" />
              <Pressable style={styles.photoX} hitSlop={6} onPress={() => removePhoto.mutate(ph.id)}>
                <MaterialCommunityIcons name="close" size={12} color="#fff" />
              </Pressable>
            </View>
          ))}
          <Pressable style={styles.addPhoto} disabled={addPhoto.isPending} onPress={() => addPhoto.mutate()}>
            {addPhoto.isPending ? (
              <ActivityIndicator size="small" color={palette.primary} />
            ) : (
              <>
                <MaterialCommunityIcons name="plus" size={22} color={palette.primary} />
                <Text style={styles.addPhotoText}>{t('profile.edit.photos.add')}</Text>
              </>
            )}
          </Pressable>
        </ScrollView>

        {/* Certificate */}
        <Text style={styles.sectionTitle}>{t('profile.edit.certificate')}</Text>
        <Pressable style={styles.certBox} onPress={() => pick(setCert)} disabled={busy}>
          {cert ? (
            <Image source={{ uri: cert.uri }} style={styles.certImage} resizeMode="cover" />
          ) : (
            <View style={styles.certPlaceholder}>
              <MaterialCommunityIcons name="certificate-outline" size={26} color={palette.textSecondary} />
              <Text style={styles.hint}>{t('profile.edit.certificate.add')}</Text>
            </View>
          )}
        </Pressable>

        {error && <Text style={styles.error}>{error}</Text>}

        <Button
          mode="contained"
          onPress={() => save.mutate()}
          loading={save.isPending}
          disabled={save.isPending || busy}
          contentStyle={styles.saveContent}
          style={styles.save}>
          {t('profile.edit.save')}
        </Button>

        {me?.admin && (
          <Button
            mode="contained-tonal"
            icon="shield-check"
            style={styles.adminBtn}
            onPress={() => navigation.navigate('Gym', { screen: 'AdminVerifications' })}>
            {t('admin.entry')}
          </Button>
        )}
        <Button mode="text" textColor={palette.textSecondary} onPress={() => logout()} style={styles.logout}>
          {t('profile.logout')}
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.background },
  content: { padding: 20, paddingBottom: 40 },
  avatarRow: { alignItems: 'center', marginBottom: 16 },
  avatarPick: { position: 'relative' },
  avatar: { width: 90, height: 90, borderRadius: 45 },
  avatarFallback: { backgroundColor: palette.surfaceVariant, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: palette.textPrimary, fontWeight: 'bold', fontSize: 28 },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: palette.background,
  },
  hint: { color: palette.textSecondary, fontSize: 11, marginTop: 8 },
  input: { marginBottom: 16 },
  sectionTitle: { color: palette.textPrimary, fontSize: 13, fontWeight: 'bold', marginTop: 4, marginBottom: 10 },
  proRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: palette.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  proStatus: { color: palette.textSecondary, fontSize: 12, marginTop: -6 },
  medalGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12, marginBottom: 16 },
  medalCard: {
    width: '48%',
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  medalCardActive: { borderColor: palette.outline },
  medalCardLabel: { color: palette.textPrimary, fontSize: 13, fontWeight: 'bold', marginTop: 6, marginBottom: 8 },
  counter: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  counterBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: palette.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterValue: { color: palette.textPrimary, fontSize: 15, fontWeight: 'bold', minWidth: 18, textAlign: 'center' },
  tierDots: { flexDirection: 'row', gap: 10, marginTop: 10 },
  tierDot: { width: 16, height: 16, borderRadius: 8, opacity: 0.4 },
  tierDotOn: { opacity: 1, borderWidth: 2, borderColor: palette.textPrimary },
  colorRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  swatch: { width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: 'transparent' },
  swatchOn: { borderColor: palette.textPrimary },
  gallery: { marginBottom: 16 },
  photoWrap: { marginRight: 8 },
  photo: { width: 100, height: 100, borderRadius: 10, backgroundColor: palette.surfaceVariant },
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
    width: 100,
    height: 100,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: palette.outline,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  addPhotoText: { color: palette.textSecondary, fontSize: 10 },
  certBox: {
    height: 160,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: palette.outline,
    overflow: 'hidden',
    marginBottom: 16,
  },
  certImage: { width: '100%', height: '100%' },
  certPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  error: { color: palette.primary, marginBottom: 12 },
  save: { marginTop: 4 },
  saveContent: { paddingVertical: 6 },
  adminBtn: { marginTop: 16, borderRadius: 12 },
  logout: { marginTop: 8 },
});
