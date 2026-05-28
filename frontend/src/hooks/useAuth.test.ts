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

  it('retourne user et token issus du authService', () => {
    const fakeUser = {
      id: 1, email: 'a@b.c', firstName: 'A', lastName: 'B', admin: false, token: 'tok-1',
    };
    vi.mocked(authService.getCurrentUser).mockReturnValue(fakeUser);
    vi.mocked(authService.getToken).mockReturnValue('tok-1');

    const { result } = renderHook(() => useAuth());
    expect(result.current.user).toEqual(fakeUser);
    expect(result.current.token).toBe('tok-1');
  });

  it('retourne null/null quand aucun utilisateur n\'est connecté', () => {
    vi.mocked(authService.getCurrentUser).mockReturnValue(null);
    vi.mocked(authService.getToken).mockReturnValue(null);

    const { result } = renderHook(() => useAuth());
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
  });
});
