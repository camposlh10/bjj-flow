import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { Alert, Linking, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Text } from 'react-native-paper';

import { todayLocalDate } from '../api/checkins';
import {
  WearableProviderInfo,
  connectWearable,
  disconnectWearable,
  getWearableProviders,
  ingestBiometrics,
} from '../api/wearables';
import { t } from '../i18n';
import { palette } from '../theme/theme';

const ICONS: Record<string, string> = {
  WHOOP: 'watch-variant',
  GARMIN: 'run-fast',
  OURA: 'circle-slice-8',
  APPLE_HEALTH: 'apple',
};

// Sample readings so the metric tiles can be exercised without HealthKit (dev aid).
const SAMPLE = [
  { metric: 'RECOVERY', value: 68 },
  { metric: 'READINESS', value: 74 },
  { metric: 'SLEEP', value: 7.2, unit: 'h' },
  { metric: 'HRV', value: 62 },
  { metric: 'RESTING_HR', value: 56 },
  { metric: 'VO2MAX', value: 48 },
  { metric: 'RECOVERY_TIME', value: 12 },
];

export default function WearablesScreen() {
  const qc = useQueryClient();
  const { data: providers, isLoading } = useQuery({ queryKey: ['wearableProviders'], queryFn: getWearableProviders });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['wearableProviders'] });
    qc.invalidateQueries({ queryKey: ['biometrics'] });
  };

  const connect = useMutation({
    mutationFn: connectWearable,
    onSuccess: (res) => {
      if (res.authorizationUrl) Linking.openURL(res.authorizationUrl).catch(() => undefined);
      refresh();
    },
    onError: (err) => {
      const code = (err as AxiosError<{ code?: string }>)?.response?.data?.code;
      Alert.alert(code === 'PROVIDER_NOT_CONFIGURED' ? t('wearables.soon') : t('errors.UNKNOWN'));
    },
  });

  const disconnect = useMutation({ mutationFn: disconnectWearable, onSuccess: refresh });

  const seed = useMutation({
    mutationFn: () => ingestBiometrics('APPLE_HEALTH', SAMPLE.map((s) => ({ ...s, date: todayLocalDate() }))),
    onSuccess: () => {
      refresh();
      Alert.alert(t('wearables.seeded'));
    },
  });

  if (isLoading || !providers) {
    return <ActivityIndicator style={{ marginTop: 48 }} color={palette.primary} />;
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.body}>
      <Text style={styles.subtitle}>{t('wearables.subtitle')}</Text>

      {providers.map((p: WearableProviderInfo) => {
        const connected = p.status === 'CONNECTED';
        return (
          <View key={p.provider} style={styles.card}>
            <View style={styles.iconWrap}>
              <MaterialCommunityIcons name={(ICONS[p.provider] ?? 'watch') as never} size={24} color={palette.textPrimary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{p.displayName}</Text>
              <Text style={[styles.status, connected && { color: '#16A34A' }]}>
                {connected ? t('wearables.connected') : p.configured ? '' : t('common.soon')}
              </Text>
            </View>
            {connected ? (
              <Button mode="text" textColor={palette.textSecondary} onPress={() => disconnect.mutate(p.provider)}>
                {t('wearables.disconnect')}
              </Button>
            ) : (
              <Button
                mode="contained-tonal"
                loading={connect.isPending && connect.variables === p.provider}
                onPress={() => connect.mutate(p.provider)}>
                {t('wearables.connect')}
              </Button>
            )}
          </View>
        );
      })}

      <Text style={styles.hint}>{t('wearables.appleHint')}</Text>

      <Button
        mode="outlined"
        icon="flask-outline"
        style={styles.seed}
        loading={seed.isPending}
        onPress={() => seed.mutate()}>
        {t('wearables.seed')}
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  body: { padding: 16 },
  subtitle: { color: palette.textSecondary, lineHeight: 20, marginBottom: 16 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: palette.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: palette.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { color: palette.textPrimary, fontWeight: '600', fontSize: 15 },
  status: { color: palette.textSecondary, fontSize: 12, marginTop: 2 },
  hint: { color: palette.textSecondary, fontSize: 12, lineHeight: 18, marginTop: 8 },
  seed: { marginTop: 20, borderRadius: 12, borderColor: palette.outline },
});
