import { authService } from '../services/auth.service';
import { User } from '../types';

interface AuthContext {
  user: User;
  token: string | null;
}

export function useAuth(): AuthContext {
  const user: User = authService.getCurrentUser();
  const token = authService.getToken();
  return { user, token };
}