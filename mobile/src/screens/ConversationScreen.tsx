import { useHeaderHeight } from '@react-navigation/elements';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ActivityIndicator } from 'react-native-paper';

import { DirectMessage, getMessages, sendMessage, startConversation } from '../api/messages';
import { t } from '../i18n';
import { palette } from '../theme/theme';

type Params = {
  conversationId?: number;
  userId?: number;
  title?: string;
  username?: string | null;
};

export default function ConversationScreen() {
  const route = useRoute<RouteProp<Record<string, Params>, string>>();
  const navigation = useNavigation<any>();
  const headerHeight = useHeaderHeight();
  const queryClient = useQueryClient();
  const listRef = useRef<FlatList<DirectMessage>>(null);

  const params = route.params ?? {};
  const [convId, setConvId] = useState<number | null>(params.conversationId ?? null);
  const [text, setText] = useState('');

  useEffect(() => {
    if (params.title) navigation.setOptions({ title: params.title });
  }, [navigation, params.title]);

  // When opened from a profile we only have a userId — get-or-create the thread.
  useEffect(() => {
    let active = true;
    if (convId == null && params.userId != null) {
      startConversation(params.userId).then((c) => {
        if (!active) return;
        setConvId(c.id);
        navigation.setOptions({ title: c.other.displayName });
      });
    }
    return () => {
      active = false;
    };
  }, [convId, params.userId, navigation]);

  const messages = useQuery({
    queryKey: ['messages', convId],
    queryFn: () => getMessages(convId as number),
    enabled: convId != null,
    refetchInterval: 4000,
  });

  const send = useMutation({
    mutationFn: () => sendMessage(convId as number, text.trim()),
    onSuccess: () => {
      setText('');
      queryClient.invalidateQueries({ queryKey: ['messages', convId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  const data = messages.data ?? [];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={headerHeight}>
      {convId == null || messages.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={data}
          keyExtractor={(m) => String(m.id)}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={<Text style={styles.emptyHint}>{t('dm.thread.empty')}</Text>}
          renderItem={({ item }) => (
            <View style={[styles.bubbleRow, item.fromMe ? styles.rowMine : styles.rowTheirs]}>
              <View style={[styles.bubble, item.fromMe ? styles.bubbleMine : styles.bubbleTheirs]}>
                <Text style={item.fromMe ? styles.textMine : styles.textTheirs}>{item.content}</Text>
              </View>
            </View>
          )}
        />
      )}
      <View style={styles.composer}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={t('dm.thread.placeholder')}
          placeholderTextColor={palette.textSecondary}
          style={styles.input}
          multiline
        />
        <Pressable
          onPress={() => send.mutate()}
          disabled={text.trim().length === 0 || send.isPending || convId == null}
          style={[styles.sendBtn, (text.trim().length === 0 || send.isPending) && styles.sendBtnOff]}>
          <Text style={styles.sendText}>{t('dm.thread.send')}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 12, flexGrow: 1, justifyContent: 'flex-end' },
  emptyHint: { color: palette.textSecondary, fontSize: 13, textAlign: 'center', marginVertical: 24 },
  bubbleRow: { marginVertical: 3, flexDirection: 'row' },
  rowMine: { justifyContent: 'flex-end' },
  rowTheirs: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '78%', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8 },
  bubbleMine: { backgroundColor: palette.primary, borderBottomRightRadius: 4 },
  bubbleTheirs: { backgroundColor: palette.surface, borderBottomLeftRadius: 4 },
  textMine: { color: '#fff', fontSize: 14, lineHeight: 19 },
  textTheirs: { color: palette.textPrimary, fontSize: 14, lineHeight: 19 },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.surfaceVariant,
    backgroundColor: palette.surface,
  },
  input: { flex: 1, maxHeight: 110, color: palette.textPrimary, fontSize: 14, paddingHorizontal: 8 },
  sendBtn: { backgroundColor: palette.primary, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8 },
  sendBtnOff: { opacity: 0.5 },
  sendText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
});
