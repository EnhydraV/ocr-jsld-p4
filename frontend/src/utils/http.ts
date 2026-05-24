import axios from 'axios';

export const authHeaders = (token: string | null) => ({
  headers: { Authorization: `Bearer ${token}` },
});

export const getAxiosErrorMessage = (err: unknown, fallback: string): string => {
  if (axios.isAxiosError(err)) return err.response?.data?.message ?? fallback;
  return fallback;
};