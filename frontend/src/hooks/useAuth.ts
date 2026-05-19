import { useMemo } from 'react';
import { authService } from '../services/auth.service';
import { AuthResponse } from '../types';

interface AuthContext {
  user: AuthResponse | null;
  token: string | null;
}

export function useAuth(): AuthContext {
  const user = authService.getCurrentUser();
  const token = authService.getToken();
  return useMemo(() => ({ user, token }), [user?.id, token]);
}