import axios from 'axios';

export const authHeaders = (token: string | null) => {
  // Pas de token → pas de header Authorization (on évite d'envoyer "Bearer null")
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return { headers };
};

export const getAxiosErrorMessage = (err: unknown, fallback: string): string => {
  if (axios.isAxiosError(err)) return err.response?.data?.message ?? fallback;
  return fallback;
};