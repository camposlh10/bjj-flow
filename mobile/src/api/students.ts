import { api } from './client';

export type AdminBelt = { slug: string; name: string; namePt: string; colorHex: string; stripes: number };

export type Graduation = {
  classesSincePromotion: number;
  graduationTarget: number;
  ready: boolean;
  daysInBelt: number | null;
  lastPromotedAt: string | null;
};

export type Attendance = {
  totalClasses: number;
  last30Days: number;
  lastAttended: string | null;
  memberSince: string | null;
};

export type Promotion = {
  beltSlug: string | null;
  beltNamePt: string;
  colorHex: string;
  stripes: number;
  date: string;
};

export type AttendanceEntry = { date: string; className: string };

export type StudentAdmin = {
  userId: number;
  username: string | null;
  displayName: string;
  avatarUrl: string | null;
  pro: boolean;
  role: 'OWNER' | 'INSTRUCTOR' | 'MEMBER';
  belt: AdminBelt | null;
  graduation: Graduation;
  attendance: Attendance;
  history: Promotion[];
  recentAttendance: AttendanceEntry[];
};

export type StudentNote = { id: number; authorName: string; content: string; createdAt: string };

export async function getStudentAdmin(userId: number): Promise<StudentAdmin> {
  const { data } = await api.get<StudentAdmin>(`/gyms/me/students/${userId}`);
  return data;
}

export async function getStudentNotes(userId: number): Promise<StudentNote[]> {
  const { data } = await api.get<StudentNote[]>(`/gyms/me/students/${userId}/notes`);
  return data;
}

export async function addStudentNote(userId: number, content: string): Promise<StudentNote> {
  const { data } = await api.post<StudentNote>(`/gyms/me/students/${userId}/notes`, { content });
  return data;
}

export async function deleteStudentNote(userId: number, noteId: number): Promise<void> {
  await api.delete(`/gyms/me/students/${userId}/notes/${noteId}`);
}
