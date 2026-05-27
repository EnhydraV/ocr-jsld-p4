import api from './api';
import { Teacher } from '../types';
import { authHeaders } from '../utils/http';

export const teacherService = {
  getTeachers: async (token: string | null, signal?: AbortSignal): Promise<Teacher[]> => {
    const response = await api.get<Teacher[]>('/teacher', { ...authHeaders(token), signal });
    return response.data;
  },
};
