import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import Constants from 'expo-constants';

import { useAuthStore } from '../store/authStore';

// In Expo Go / dev builds, Metro's host is the dev machine's LAN IP — reuse it
// so a physical device or emulator can reach the backend on the same machine.
const metroHost = Constants.expoConfig?.hostUri?.split(':')[0];

// Backend runs on 8090 (8080 = Apache, 8081 = Expo Metro). Must match server.port
// in the backend's application.yml — sharing Metro's 8081 made API calls hit the
// bundler and return HTML, crashing every data-driven screen.
export const API_BASE_URL = `http://${metroHost ?? 'localhost'}:8090/api/v1`;
// Origin without the /api/v1 suffix — used to resolve relative media URLs (/media/...).
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/v1$/, '');

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10_000,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

api.interceptors.response.use(undefined, async (error: AxiosError) => {
  const config = error.config as RetriableConfig | undefined;
  const { refreshToken, setTokens, logout } = useAuthStore.getState();

  // On 401, try a one-time token refresh and replay the original request.
  // Uses bare axios to avoid re-entering this interceptor.
  if (error.response?.status === 401 && refreshToken && config && !config._retried) {
    config._retried = true;
    try {
      const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
      await setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
      config.headers.Authorization = `Bearer ${data.accessToken}`;
      return api(config);
    } catch {
      await logout();
    }
  }
  throw error;
});
