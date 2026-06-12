import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { t } from '../i18n';
import { palette } from '../theme/theme';

export default function TechniquesScreen() {
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name="book-open-variant" size={48} color={palette.surfaceVariant} />
      <Text variant="titleMedium" style={styles.title}>
        {t('tabs.techniques')}
      </Text>
      <Text variant="bodySmall" style={styles.soon}>
        {t('common.soon')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  title: {
    color: palette.textPrimary,
    fontWeight: 'bold',
  },
  soon: {
    color: palette.textSecondary,
  },
});
