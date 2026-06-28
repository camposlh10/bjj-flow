import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useEffect } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';

import { OAuthProvider, apiErrorMessage, oauthLogin } from '../api/auth';
import { t } from '../i18n';
import { useAuthStore } from '../store/authStore';
import { makeStyles, palette } from '../theme/theme';

WebBrowser.maybeCompleteAuthSession();

// Configure in .env.local (gitignored). Without these, the button is hidden.
const GOOGLE_IDS = {
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
};

/** "Continue with Google" button (browser flow). Hidden until OAuth client IDs are
 *  configured. Apple Sign-In is deferred — the backend supports it, but the native
 *  button needs the Apple "Sign in with Apple" capability + expo-apple-authentication. */
export default function SocialAuthButtons() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const googleConfigured = !!(GOOGLE_IDS.iosClientId || GOOGLE_IDS.androidClientId || GOOGLE_IDS.webClientId);

  const login = useMutation({
    mutationFn: (v: { provider: OAuthProvider; idToken: string; displayName?: string }) =>
      oauthLogin(v.provider, v.idToken, v.displayName),
    onSuccess: async (data) => {
      await setAuth({ accessToken: data.accessToken, refreshToken: data.refreshToken }, data.user);
    },
    onError: (e) => Alert.alert(apiErrorMessage(e)),
  });

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest(GOOGLE_IDS);

  useEffect(() => {
    if (response?.type === 'success') {
      const idToken = response.params?.id_token ?? response.authentication?.idToken;
      if (idToken) login.mutate({ provider: 'GOOGLE', idToken });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);

  const onGoogle = () => {
    if (!request) {
      Alert.alert(t('social.googleUnavailable'));
      return;
    }
    promptAsync();
  };

  if (!googleConfigured) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.divider}>
        <View style={styles.line} />
        <Text style={styles.dividerText}>{t('social.or')}</Text>
        <View style={styles.line} />
      </View>

      {login.isPending ? (
        <ActivityIndicator color={palette.primary} style={{ marginVertical: 12 }} />
      ) : (
        <Pressable style={styles.btn} onPress={onGoogle} accessibilityRole="button">
          <MaterialCommunityIcons name="google" size={20} color={palette.textPrimary} />
          <Text style={styles.btnText}>{t('social.google')}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = makeStyles(() => ({
  wrap: { marginTop: 8 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 16 },
  line: { flex: 1, height: 1, backgroundColor: palette.surfaceVariant },
  dividerText: { color: palette.textSecondary, fontSize: 12 },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.outline,
    borderRadius: 12,
    paddingVertical: 13,
    marginBottom: 10,
  },
  btnText: { color: palette.textPrimary, fontSize: 15, fontWeight: '600' },
}));
