import api from './api';
import { User } from '../types';
import { authHeaders } from '../utils/http';

export const userService = {
  getUser: async (token: string | null, id: number, signal?: AbortSignal): Promise<User> => {
    const response = await api.get<User>(`/user/${id}`, { ...authHeaders(token), signal });
    return response.data;
  },

  deleteUser: async (token: string | null, id: number): Promise<void> => {
    await api.delete(`/user/${id}`, authHeaders(token));
  },

  promoteAdmin: async (token: string | null): Promise<User> => {
    const response = await api.post<User>('/user/promote-admin', {}, authHeaders(token));
    return response.data;
  },
};
