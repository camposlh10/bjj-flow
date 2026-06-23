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

export type MonthlyRegion = { region: string; intensity: number; days: number };
export type PainMonthly = { month: string; regions: MonthlyRegion[] };

export async function getPainMap(): Promise<PainMap> {
  const { data } = await api.get<PainMap>('/users/me/pain');
  return data;
}

/** A single day's pain (latest reading per region that day). */
export async function getPainDaily(date?: string): Promise<PainMap> {
  const { data } = await api.get<PainMap>('/users/me/pain/daily', { params: { date } });
  return data;
}

/** A month's aggregate per region (peak intensity + days it hurt). */
export async function getPainMonthly(month?: string): Promise<PainMonthly> {
  const { data } = await api.get<PainMonthly>('/users/me/pain/monthly', { params: { month } });
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
