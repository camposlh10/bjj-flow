import { AxiosError } from 'axios';

import { t } from '../i18n';
import { User } from '../store/authStore';
import { api } from './client';

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: User;
};

export type RegisterPayload = {
  email: string;
  password: string;
  displayName: string;
  age: number;
  beltSlug: string;
  stripes?: number;
  weightKg?: number;
  heightCm?: number;
};

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/register', payload);
  return data;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
  return data;
}

/** Converte erros da API em mensagens pt-BR para exibir ao usuário. */
export function apiErrorMessage(error: unknown): string {
  const axiosError = error as AxiosError<{ code?: string }>;
  if (axiosError?.isAxiosError) {
    if (!axiosError.response) {
      return t('errors.NETWORK');
    }
    switch (axiosError.response.data?.code) {
      case 'EMAIL_ALREADY_USED':
        return t('errors.EMAIL_ALREADY_USED');
      case 'INVALID_CREDENTIALS':
        return t('errors.INVALID_CREDENTIALS');
      case 'INVALID_BELT':
        return t('errors.INVALID_BELT');
      case 'VALIDATION_ERROR':
        return t('errors.VALIDATION_ERROR');
      case 'ALREADY_IN_GYM':
        return t('errors.ALREADY_IN_GYM');
      case 'INVALID_INVITE_CODE':
        return t('errors.INVALID_INVITE_CODE');
      case 'NOT_ELIGIBLE':
        return t('errors.NOT_ELIGIBLE');
      case 'CHECKIN_NOT_OPEN':
        return t('errors.CHECKIN_NOT_OPEN');
      case 'INVALID_TIME':
        return t('errors.INVALID_TIME');
      case 'INVALID_STRIPES':
        return t('errors.INVALID_STRIPES');
      case 'USERNAME_TAKEN':
        return t('errors.USERNAME_TAKEN');
      case 'INVALID_USERNAME':
        return t('errors.INVALID_USERNAME');
      case 'WRONG_PASSWORD':
        return t('errors.WRONG_PASSWORD');
    }
  }
  return t('errors.UNKNOWN');
}
