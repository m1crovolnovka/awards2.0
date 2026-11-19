import { api, downloadBlob } from './client';
import type {
  AuthResponse,
  NominationCard,
  NominationStats,
  NomineeAdminView,
  PublicConfig,
  UserMe,
  VotingStatus,
} from '../types';

export const getConfig = () => api<PublicConfig>('/api/public/config');
export const getVotingStatus = () => api<VotingStatus>('/api/public/voting-status');

export const loginTelegram = (payload: Record<string, unknown>) =>
  api<AuthResponse>('/api/auth/telegram', { method: 'POST', body: JSON.stringify(payload) });

export const loginTelegramLite = (username: string, displayName: string) =>
  api<AuthResponse>('/api/auth/telegram/lite', {
    method: 'POST',
    body: JSON.stringify({ username, displayName }),
  });

export const loginAdmin = (login: string, password: string) =>
  api<AuthResponse>('/api/auth/admin/login', {
    method: 'POST',
    body: JSON.stringify({ login, password }),
  });

export const changeAdminCredentials = (currentPassword: string, newLogin: string, newPassword: string) =>
  api<AuthResponse>('/api/auth/admin/change-credentials', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newLogin, newPassword }),
  });

export const me = () => api<UserMe>('/api/auth/me');

export const listNominations = () => api<NominationCard[]>('/api/nominations');
export const getNomination = (id: number) => api<NominationCard>(`/api/nominations/${id}`);
export const castVote = (nominationId: number, nomineeId: number) =>
  api<void>('/api/votes', { method: 'POST', body: JSON.stringify({ nominationId, nomineeId }) });

export const adminVotingStatus = () => api<VotingStatus>('/api/admin/voting-status');
export const endVoting = (announcementAt?: string) => {
  const q = announcementAt ? `?announcementAt=${encodeURIComponent(announcementAt)}` : '';
  return api<VotingStatus>(`/api/admin/voting/end${q}`, { method: 'POST' });
};
export const resumeVoting = () => api<VotingStatus>('/api/admin/voting/resume', { method: 'POST' });

export const adminNominees = () => api<NomineeAdminView[]>('/api/admin/nominees');
export const createNominee = (form: FormData) =>
  api<NomineeAdminView>('/api/admin/nominees', { method: 'POST', body: form });
export const updateNominee = (id: number, form: FormData) =>
  api<NomineeAdminView>(`/api/admin/nominees/${id}`, { method: 'PUT', body: form });
export const deleteNominee = (id: number) =>
  api<void>(`/api/admin/nominees/${id}`, { method: 'DELETE' });

export const adminNominations = () => api<NominationCard[]>('/api/admin/nominations');
export const createNomination = (form: FormData) =>
  api<NominationCard>('/api/admin/nominations', { method: 'POST', body: form });
export const updateNomination = (id: number, form: FormData) =>
  api<NominationCard>(`/api/admin/nominations/${id}`, { method: 'PUT', body: form });
export const deleteNomination = (id: number) =>
  api<void>(`/api/admin/nominations/${id}`, { method: 'DELETE' });

export const adminStats = () => api<NominationStats[]>('/api/admin/stats');
export const resolveTie = (nominationId: number, nomineeId: number) =>
  api<NominationStats>(`/api/admin/ties/${nominationId}/resolve`, {
    method: 'POST',
    body: JSON.stringify({ nomineeId }),
  });

export const downloadWinnersReport = () => downloadBlob('/api/admin/reports/winners', 'winners.pdf');
export const downloadDetailedReport = () =>
  downloadBlob('/api/admin/reports/detailed', 'votes-detailed.pdf');
