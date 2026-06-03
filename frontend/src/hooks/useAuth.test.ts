import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAuth } from './useAuth';
import { authService } from '../services/auth.service';

vi.mock('../services/auth.service', () => ({
  authService: {
    getCurrentUser: vi.fn(),
    getToken: vi.fn(),
  },
}));

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns user and token from the authService', () => {
    const user = {
      id: 1, email: 'victor@yoga.com', firstName: 'Victor', lastName: 'Pille', admin: false, token: 'tok-123456789',
    };
    vi.mocked(authService.getCurrentUser).mockReturnValue(user);
    vi.mocked(authService.getToken).mockReturnValue(user.token);

    const { result } = renderHook(() => useAuth());
    expect(result.current.user).toEqual(user);
    expect(result.current.token).toBe(user.token);
  });

  it('returns null/null when no user is logged in', () => {
    vi.mocked(authService.getCurrentUser).mockReturnValue(null);
    vi.mocked(authService.getToken).mockReturnValue(null);

    const { result } = renderHook(() => useAuth());
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
  });
});
