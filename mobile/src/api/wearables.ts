import { api } from './client';

export type WearableProviderInfo = {
  provider: 'WHOOP' | 'GARMIN' | 'OURA' | 'APPLE_HEALTH';
  displayName: string;
  oauth: boolean;
  configured: boolean;
  status: 'CONNECTED' | 'DISCONNECTED' | 'PENDING';
  connectedAt: string | null;
};

export type ConnectResult = {
  provider: string;
  status: string;
  authorizationUrl: string | null;
  configured: boolean;
};

export type Biometric = {
  metric: string;
  label: string;
  unit: string;
  value: number;
  date: string;
  provider: string;
};

export type BiometricSampleInput = { metric: string; date: string; value: number; unit?: string };

export async function getWearableProviders(): Promise<WearableProviderInfo[]> {
  const { data } = await api.get<WearableProviderInfo[]>('/wearables/providers');
  return data;
}

export async function connectWearable(provider: string): Promise<ConnectResult> {
  const { data } = await api.post<ConnectResult>(`/wearables/${provider}/connect`);
  return data;
}

export async function disconnectWearable(provider: string): Promise<void> {
  await api.post(`/wearables/${provider}/disconnect`);
}

export async function getBiometrics(): Promise<Biometric[]> {
  const { data } = await api.get<Biometric[]>('/users/me/biometrics');
  return data;
}

export async function ingestBiometrics(
  provider: string,
  samples: BiometricSampleInput[],
): Promise<Biometric[]> {
  const { data } = await api.post<Biometric[]>('/users/me/biometrics', { provider, samples });
  return data;
}
