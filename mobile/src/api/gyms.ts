import { api } from './client';

export type GymRole = 'OWNER' | 'INSTRUCTOR' | 'MEMBER';

export type GymPhoto = { id: number; url: string };

export type Gym = {
  id: number;
  name: string;
  city: string | null;
  description: string | null;
  memberCount: number;
  role: GymRole;
  graduationTarget: number;
  /** present only for owner/instructor */
  inviteCode: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  logoUrl: string | null;
  photos: GymPhoto[];
};

export type UpdateGymPayload = {
  name: string;
  city?: string;
  description?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  logoKey?: string;
};

export type RankingEntry = {
  position: number;
  userId: number;
  displayName: string;
  belt: GymMemberBelt | null;
  classes: number;
};

export type GymMemberBelt = {
  slug: string;
  namePt: string;
  colorHex: string;
  stripes: number;
};

export type GymMember = {
  userId: number;
  displayName: string;
  role: GymRole;
  belt: GymMemberBelt | null;
  /** aulas verificadas desde a última graduação (contador de graduação) */
  classesAttended: number;
};

export type GymSuggestion = {
  id: number;
  name: string;
  city: string | null;
  memberCount: number;
};

export type CreateGymPayload = {
  name: string;
  city?: string;
  description?: string;
};

/** Returns the user's gym, or null when they aren't in one (backend replies 204). */
export async function getMyGym(): Promise<Gym | null> {
  const res = await api.get<Gym>('/gyms/me', {
    validateStatus: (s) => s === 200 || s === 204,
  });
  return res.status === 204 ? null : res.data;
}

export async function createGym(payload: CreateGymPayload): Promise<Gym> {
  const { data } = await api.post<Gym>('/gyms', payload);
  return data;
}

export async function joinGymByCode(inviteCode: string): Promise<Gym> {
  const { data } = await api.post<Gym>('/gyms/join', { inviteCode });
  return data;
}

export async function getGymMembers(): Promise<GymMember[]> {
  const { data } = await api.get<GymMember[]>('/gyms/me/members');
  return data;
}

export async function getGymSuggestions(): Promise<GymSuggestion[]> {
  const { data } = await api.get<GymSuggestion[]>('/gyms/suggestions');
  return data;
}

export async function leaveGym(): Promise<void> {
  await api.post('/gyms/leave');
}

export async function promoteMember(
  userId: number,
  beltSlug: string,
  stripes: number,
): Promise<GymMember> {
  const { data } = await api.post<GymMember>(`/gyms/me/members/${userId}/promote`, {
    beltSlug,
    stripes,
  });
  return data;
}

export async function updateGym(payload: UpdateGymPayload): Promise<Gym> {
  const { data } = await api.put<Gym>('/gyms/me', payload);
  return data;
}

export async function addGymPhoto(key: string): Promise<GymPhoto> {
  const { data } = await api.post<GymPhoto>('/gyms/me/photos', { key });
  return data;
}

export async function deleteGymPhoto(photoId: number): Promise<void> {
  await api.delete(`/gyms/me/photos/${photoId}`);
}

export async function getRanking(): Promise<RankingEntry[]> {
  const { data } = await api.get<RankingEntry[]>('/gyms/ranking');
  return data;
}

/** TEMP testing aid — flip your own role to preview instructor/owner features. */
export async function setMyGymRole(role: GymRole): Promise<Gym> {
  const { data } = await api.post<Gym>('/gyms/me/role', { role });
  return data;
}
