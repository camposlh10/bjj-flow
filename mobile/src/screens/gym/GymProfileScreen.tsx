import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { ComponentProps } from 'react';
import { Image, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Text } from 'react-native-paper';

import { getMyGym } from '../../api/gyms';
import { resolveMediaUrl } from '../../api/posts';
import { t } from '../../i18n';
import { GymStackParamList } from '../../navigation/GymNavigator';
import { palette } from '../../theme/theme';

type Nav = NativeStackNavigationProp<GymStackParamList>;
type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

function ContactRow({ icon, value, onPress }: { icon: IconName; value: string; onPress?: () => void }) {
  return (
    <Pressable style={styles.contactRow} onPress={onPress} disabled={!onPress}>
      <MaterialCommunityIcons name={icon} size={17} color={palette.textSecondary} />
      <Text style={[styles.contactText, onPress && styles.contactLink]} numberOfLines={1}>
        {value}
      </Text>
    </Pressable>
  );
}

export default function GymProfileScreen() {
  const navigation = useNavigation<Nav>();
  const gym = useQuery({ queryKey: ['myGym'], queryFn: getMyGym });

  if (gym.isLoading || !gym.data) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  const g = gym.data;
  const isOwner = g.role === 'OWNER';
  const open = (url: string) => Linking.openURL(url).catch(() => undefined);
  const website = g.website
    ? g.website.startsWith('http')
      ? g.website
      : `https://${g.website}`
    : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerCenter}>
        {g.logoUrl ? (
          <Image source={{ uri: resolveMediaUrl(g.logoUrl) }} style={styles.logo} resizeMode="cover" />
        ) : (
          <View style={[styles.logo, styles.logoFallback]}>
            <Text style={styles.logoText}>{initialsOf(g.name)}</Text>
          </View>
        )}
        <Text variant="titleLarge" style={styles.name}>
          {g.name}
        </Text>
        <Text style={styles.meta}>
          {[g.city, `${g.memberCount} ${t('gymProfile.members')}`].filter(Boolean).join(' · ')}
        </Text>
      </View>

      {g.description && <Text style={styles.bio}>{g.description}</Text>}

      {(g.address || g.phone || g.email || website) && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('gymProfile.contact')}</Text>
          {g.address && <ContactRow icon="map-marker-outline" value={g.address} />}
          {g.phone && (
            <ContactRow icon="phone-outline" value={g.phone} onPress={() => open(`tel:${g.phone}`)} />
          )}
          {g.email && (
            <ContactRow icon="email-outline" value={g.email} onPress={() => open(`mailto:${g.email}`)} />
          )}
          {website && <ContactRow icon="web" value={g.website!} onPress={() => open(website)} />}
        </View>
      )}

      {g.photos.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>{t('gymProfile.photos')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gallery}>
            {g.photos.map((p) => (
              <Image
                key={p.id}
                source={{ uri: resolveMediaUrl(p.url) }}
                style={styles.galleryPhoto}
                resizeMode="cover"
              />
            ))}
          </ScrollView>
        </>
      )}

      {isOwner && (
        <Button
          mode="contained"
          icon="pencil"
          style={styles.editBtn}
          contentStyle={styles.editContent}
          onPress={() => navigation.navigate('EditGym')}>
          {t('gymProfile.edit')}
        </Button>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.background },
  content: { padding: 20, paddingBottom: 40 },
  headerCenter: { alignItems: 'center', marginBottom: 16 },
  logo: { width: 84, height: 84, borderRadius: 22, marginBottom: 12 },
  logoFallback: {
    backgroundColor: palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { color: '#fff', fontWeight: 'bold', fontSize: 26 },
  name: { color: palette.textPrimary, fontWeight: 'bold', textAlign: 'center' },
  meta: { color: palette.textSecondary, fontSize: 12, marginTop: 4 },
  bio: { color: '#E4E4E7', fontSize: 13, lineHeight: 19, marginBottom: 16, textAlign: 'center' },
  card: { backgroundColor: palette.surface, borderRadius: 16, padding: 16, marginBottom: 16 },
  cardTitle: { color: palette.textPrimary, fontSize: 13, fontWeight: 'bold', marginBottom: 10 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7 },
  contactText: { color: palette.textSecondary, fontSize: 13, flex: 1 },
  contactLink: { color: '#4A9EED' },
  sectionTitle: { color: palette.textPrimary, fontSize: 13, fontWeight: 'bold', marginBottom: 10 },
  gallery: { marginBottom: 16 },
  galleryPhoto: { width: 140, height: 100, borderRadius: 12, marginRight: 8, backgroundColor: palette.surfaceVariant },
  editBtn: { marginTop: 8 },
  editContent: { paddingVertical: 5 },
});
