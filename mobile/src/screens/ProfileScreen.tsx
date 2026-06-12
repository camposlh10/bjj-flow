import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BeltVisual, { formatStripes } from '../components/BeltVisual';
import { rankBarColorFor } from '../constants/belts';
import { t } from '../i18n';
import { useAuthStore } from '../store/authStore';
import { palette } from '../theme/theme';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const initials = (user?.displayName ?? '')
    .trim()
    .split(/\s+/)
    .map((p, i, arr) => (i === 0 || i === arr.length - 1 ? p[0] : ''))
    .join('')
    .toUpperCase();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 24 }]}>
      <View style={styles.headerCenter}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text variant="headlineSmall" style={styles.name}>
          {user?.displayName}
        </Text>
        <Text variant="bodySmall" style={styles.email}>
          {user?.email}
        </Text>
      </View>

      {user?.belt && (
        <View style={styles.beltSection}>
          <BeltVisual
            color={user.belt.colorHex}
            rankBarColor={rankBarColorFor(user.belt.slug)}
            stripes={user.belt.stripes}
            height={32}
          />
          <Text variant="bodySmall" style={styles.beltLabel}>
            {t('home.belt')} {user.belt.namePt}
            {user.belt.stripes > 0 ? ` · ${formatStripes(user.belt.stripes)}` : ''}
          </Text>
        </View>
      )}

      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{t('profile.age')}</Text>
          <Text style={styles.infoValue}>
            {user?.age != null ? `${user.age} ${t('profile.ageSuffix')}` : '—'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{t('profile.weight')}</Text>
          <Text style={styles.infoValue}>
            {user?.weightKg != null ? `${user.weightKg} kg` : '—'}
          </Text>
        </View>
        <View style={[styles.infoRow, styles.infoRowLast]}>
          <Text style={styles.infoLabel}>{t('profile.height')}</Text>
          <Text style={styles.infoValue}>
            {user?.heightCm != null ? `${user.heightCm} cm` : '—'}
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Button mode="outlined" textColor={palette.textSecondary} onPress={() => logout()}>
          {t('profile.logout')}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
    paddingHorizontal: 20,
  },
  headerCenter: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: palette.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: palette.textPrimary,
    fontWeight: 'bold',
    fontSize: 24,
  },
  name: {
    color: palette.textPrimary,
    fontWeight: 'bold',
  },
  email: {
    color: palette.textSecondary,
  },
  beltSection: {
    gap: 8,
    marginBottom: 20,
  },
  beltLabel: {
    color: palette.textSecondary,
  },
  infoCard: {
    backgroundColor: palette.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: palette.surfaceVariant,
  },
  infoRowLast: {
    borderBottomWidth: 0,
  },
  infoLabel: {
    color: palette.textSecondary,
  },
  infoValue: {
    color: palette.textPrimary,
    fontWeight: 'bold',
  },
  footer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 24,
  },
});
