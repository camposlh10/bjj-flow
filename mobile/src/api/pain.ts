import { api } from './client';

export type PainEntry = {
  region: string;
  intensity: number;
  note: string | null;
  occurredAt: string;
};

export type PainMap = { regions: PainEntry[] };

export type PainHistoryItem = {
  id: number;
  region: string;
  intensity: number;
  note: string | null;
  occurredAt: string;
};

export async function getPainMap(): Promise<PainMap> {
  const { data } = await api.get<PainMap>('/users/me/pain');
  return data;
}

export async function logPain(body: { region: string; intensity: number; note?: string | null }): Promise<PainMap> {
  const { data } = await api.post<PainMap>('/users/me/pain', body);
  return data;
}

export async function getPainHistory(limit?: number): Promise<PainHistoryItem[]> {
  const { data } = await api.get<PainHistoryItem[]>('/users/me/pain/history', { params: { limit } });
  return data;
}
