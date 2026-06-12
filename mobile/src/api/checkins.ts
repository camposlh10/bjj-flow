import { api } from './client';

export type Stats = {
  currentStreak: number;
  longestStreak: number;
  totalCheckIns: number;
  totalHours: number;
  weeklyGoal: number;
  weeklyProgress: number;
  checkedInToday: boolean;
  /** segunda → domingo */
  weekDays: boolean[];
};

/** Data local do aparelho em YYYY-MM-DD (sem efeitos de fuso do servidor). */
export function todayLocalDate(): string {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

export async function getStats(): Promise<Stats> {
  const { data } = await api.get<Stats>('/users/me/stats');
  return data;
}

export async function createQuickCheckIn(): Promise<void> {
  // Check-in de um toque: duração padrão de 60min (edição detalhada vem depois)
  await api.post('/checkins', { date: todayLocalDate(), durationMinutes: 60 });
}
