import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';

import {
  NotificationItem,
  NotificationType,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../api/notifications';
import { t } from '../i18n';
import type { ComunidadeStackParamList } from '../navigation/ComunidadeNavigator';
import { palette } from '../theme/theme';

type Nav = NativeStackNavigationProp<ComunidadeStackParamList>;

const ICONS: Record<NotificationType, string> = {
  MESSAGE: 'message-text',
  COMMUNITY: 'earth',
  PROMOTION: 'arrow-up-bold-circle',
  SYSTEM: 'information',
};

function timeAgo(iso: string): string {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export default function NotificationCenterScreen() {
  const navigation = useNavigation<Nav>();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['notifications'], queryFn: () => getNotifications() });

  const read = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
  const readAll = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const open = (n: NotificationItem) => {
    if (!n.read) read.mutate(n.id);
    if (n.payload?.startsWith('conversation:')) {
      const id = Number(n.payload.split(':')[1]);
      if (id) navigation.navigate('Conversation', { conversationId: id });
    }
  };

  if (isLoading || !data) {
    return <ActivityIndicator style={{ marginTop: 48 }} color={palette.primary} />;
  }

  return (
    <View style={styles.screen}>
      {data.unread > 0 && (
        <Pressable style={styles.markAll} onPress={() => readAll.mutate()}>
          <MaterialCommunityIcons name="check-all" size={16} color={palette.primary} />
          <Text style={styles.markAllText}>{t('notifications.markAll')}</Text>
        </Pressable>
      )}
      <FlatList
        data={data.items}
        keyExtractor={(n) => String(n.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>{t('notifications.empty')}</Text>}
        renderItem={({ item }) => (
          <Pressable style={[styles.row, !item.read && styles.rowUnread]} onPress={() => open(item)}>
            <View style={styles.iconWrap}>
              <MaterialCommunityIcons name={(ICONS[item.type] ?? 'bell') as never} size={20} color={palette.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{item.title}</Text>
              {!!item.body && (
                <Text style={styles.rowBody} numberOfLines={2}>
                  {item.body}
                </Text>
              )}
              <Text style={styles.rowTime}>{timeAgo(item.createdAt)}</Text>
            </View>
            {!item.read && <View style={styles.dot} />}
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  markAll: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-end', padding: 14 },
  markAllText: { color: palette.primary, fontWeight: '600', fontSize: 13 },
  list: { paddingHorizontal: 16, paddingBottom: 32 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: palette.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  rowUnread: { backgroundColor: palette.surfaceVariant },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: palette.primary + '22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: { color: palette.textPrimary, fontWeight: '600', fontSize: 15 },
  rowBody: { color: palette.textSecondary, fontSize: 13, marginTop: 2 },
  rowTime: { color: palette.textSecondary, fontSize: 11, marginTop: 4 },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: palette.primary },
  empty: { color: palette.textSecondary, textAlign: 'center', marginTop: 60 },
});
