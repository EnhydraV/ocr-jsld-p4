import api from './api';
import { Session, SessionFormData } from '../types';
import { authHeaders } from '../utils/http';

export const sessionService = {
  getSessions: async (token: string | null, signal?: AbortSignal): Promise<Session[]> => {
    const response = await api.get<Session[]>('/session', { ...authHeaders(token), signal });
    return response.data;
  },

  getSession: async (token: string | null, id: string | number, signal?: AbortSignal): Promise<Session> => {
    const response = await api.get<Session>(`/session/${id}`, { ...authHeaders(token), signal });
    return response.data;
  },

  createSession: async (token: string | null, data: SessionFormData): Promise<void> => {
    await api.post('/session', data, authHeaders(token));
  },

  updateSession: async (token: string | null, id: string | number, data: SessionFormData): Promise<void> => {
    await api.put(`/session/${id}`, data, authHeaders(token));
  },

  deleteSession: async (token: string | null, id: string | number): Promise<void> => {
    await api.delete(`/session/${id}`, authHeaders(token));
  },

  participate: async (token: string | null, sessionId: string | number, userId: number): Promise<void> => {
    await api.post(`/session/${sessionId}/participate/${userId}`, {}, authHeaders(token));
  },

  unparticipate: async (token: string | null, sessionId: string | number, userId: number): Promise<void> => {
    await api.delete(`/session/${sessionId}/participate/${userId}`, authHeaders(token));
  },
};
