import { api } from './api';
import type { ScheduleEvent, Stats, StudySession, TestItem, User } from './types';

export const AuthApi = {
  signup: (data: { name: string; email: string; password: string; grade?: string }) =>
    api.post<{ token: string; user: User }>('/auth/signup', data),
  login: (data: { email: string; password: string }) =>
    api.post<{ token: string; user: User }>('/auth/login', data),
  me: () => api.get<{ user: User }>('/auth/me'),
  update: (data: Partial<{ name: string; grade: string; studyWindowStart: string; studyWindowEnd: string; onboarded: boolean }>) =>
    api.put<{ user: User }>('/auth/me', data),
};

export const EventsApi = {
  list: () => api.get<{ events: ScheduleEvent[] }>('/events'),
  create: (data: Partial<ScheduleEvent>) => api.post<{ event: ScheduleEvent }>('/events', data),
  update: (id: string, data: Partial<ScheduleEvent>) => api.put<{ event: ScheduleEvent }>(`/events/${id}`, data),
  remove: (id: string) => api.del<void>(`/events/${id}`),
};

export const TestsApi = {
  list: () => api.get<{ tests: TestItem[] }>('/tests'),
  create: (data: Partial<TestItem>) => api.post<{ test: TestItem }>('/tests', data),
  update: (id: string, data: Partial<TestItem>) => api.put<{ test: TestItem }>(`/tests/${id}`, data),
  remove: (id: string) => api.del<void>(`/tests/${id}`),
};

export const SessionsApi = {
  get: (id: string) => api.get<{ session: StudySession }>(`/sessions/${id}`),
  listByDate: (date: string) => api.get<{ sessions: StudySession[] }>(`/sessions?date=${date}`),
  listRange: (from: string, to: string) => api.get<{ sessions: StudySession[] }>(`/sessions?from=${from}&to=${to}`),
  listAll: () => api.get<{ sessions: StudySession[] }>('/sessions'),
  generate: (date: string) => api.post<{ sessions: StudySession[]; skipped: { testId: string; subject: string; reason: string }[] }>('/sessions/generate', { date }),
  randomize: (id: string) => api.post<{ session: StudySession }>(`/sessions/${id}/randomize`),
  complete: (id: string, actualSeconds: number) => api.post<{ session: StudySession }>(`/sessions/${id}/complete`, { actualSeconds }),
  remove: (id: string) => api.del<void>(`/sessions/${id}`),
};

export const StatsApi = {
  get: () => api.get<Stats>('/stats'),
};

export const PremiumApi = {
  upgrade: () => api.post<{ user: User }>('/premium/upgrade'),
};
