import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';
import { FlatList, Image, Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { Conversation, getConversations } from '../api/messages';
import { resolveMediaUrl } from '../api/posts';
import { TrainingCardSkeleton } from '../components/Skeleton';
import { t } from '../i18n';
import { palette } from '../theme/theme';
import { timeAgo } from '../utils/time';

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

export default function DirectInboxScreen() {
  const navigation = useNavigation<any>();
  const convs = useQuery({ queryKey: ['conversations'], queryFn: getConversations });

  // Refresh the inbox each time it regains focus (e.g. returning from a thread).
  useFocusEffect(
    useCallback(() => {
      convs.refetch();
    }, []), // eslint-disable-line react-hooks/exhaustive-deps
  );

  const items = Array.isArray(convs.data) ? convs.data : [];

  const renderRow = (c: Conversation) => {
    const name = c.other.displayName;
    const preview = c.lastMessage ? (c.lastFromMe ? `${t('dm.you')}: ${c.lastMessage}` : c.lastMessage) : t('dm.empty.preview');
    return (
      <Pressable
        style={styles.row}
        onPress={() =>
          navigation.navigate('Conversation', {
            conversationId: c.id,
            title: name,
            username: c.other.username,
          })
        }>
        {c.other.avatarUrl ? (
          <Image source={{ uri: resolveMediaUrl(c.other.avatarUrl) }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarText}>{initialsOf(name)}</Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <View style={styles.topLine}>
            <Text style={[styles.name, c.unread > 0 && styles.unreadText]} numberOfLines={1}>
              {name}
            </Text>
            {c.lastMessageAt && <Text style={styles.time}>{timeAgo(c.lastMessageAt)}</Text>}
          </View>
          <Text style={[styles.preview, c.unread > 0 && styles.unreadText]} numberOfLines={1}>
            {preview}
          </Text>
        </View>
        {c.unread > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{c.unread > 9 ? '9+' : c.unread}</Text>
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={items}
      keyExtractor={(c) => String(c.id)}
      renderItem={({ item }) => renderRow(item)}
      ItemSeparatorComponent={() => <View style={styles.sep} />}
      ListEmptyComponent={
        convs.isLoading ? (
          <View style={{ padding: 16, gap: 12 }}>
            <TrainingCardSkeleton />
          </View>
        ) : (
          <View style={styles.empty}>
            <MaterialCommunityIcons name="message-text-outline" size={44} color={palette.surfaceVariant} />
            <Text style={styles.emptyTitle}>{t('dm.empty.title')}</Text>
            <Text style={styles.emptySub}>{t('dm.empty.sub')}</Text>
          </View>
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  content: { flexGrow: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  avatarFallback: { backgroundColor: palette.surfaceVariant, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: palette.textPrimary, fontWeight: 'bold', fontSize: 16 },
  topLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { color: palette.textPrimary, fontSize: 15, fontWeight: '600', flexShrink: 1 },
  time: { color: palette.textSecondary, fontSize: 11, marginLeft: 8 },
  preview: { color: palette.textSecondary, fontSize: 13, marginTop: 2 },
  unreadText: { color: palette.textPrimary, fontWeight: 'bold' },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: palette.surfaceVariant, marginLeft: 80 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingTop: 100 },
  emptyTitle: { color: palette.textPrimary, fontWeight: 'bold', fontSize: 15 },
  emptySub: { color: palette.textSecondary, fontSize: 13, textAlign: 'center', paddingHorizontal: 40 },
});
