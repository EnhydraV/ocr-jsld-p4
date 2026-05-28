import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from './auth.service';
import api from './api';

vi.mock('./api', () => ({
  default: {
    post: vi.fn(),
  },
}));

const fakeAuthResponse = {
  id: 1,
  email: 'a@b.c',
  firstName: 'Alice',
  lastName: 'Smith',
  admin: false,
  token: 'tok-123',
};

describe('authService.login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('appelle /auth/login et stocke token + user dans localStorage', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: fakeAuthResponse });

    const result = await authService.login({ email: 'a@b.c', password: 'pwd' });

    expect(api.post).toHaveBeenCalledWith('/auth/login', { email: 'a@b.c', password: 'pwd' });
    expect(localStorage.getItem('token')).toBe('tok-123');
    expect(JSON.parse(localStorage.getItem('user')!)).toEqual(fakeAuthResponse);
    expect(result).toEqual(fakeAuthResponse);
  });

  it('ne stocke rien si la réponse ne contient pas de token', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { ...fakeAuthResponse, token: '' } });

    await authService.login({ email: 'a@b.c', password: 'pwd' });

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });
});

describe('authService.register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('appelle /auth/register et stocke les données', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: fakeAuthResponse });

    await authService.register({
      email: 'a@b.c', password: 'pwd', firstName: 'Alice', lastName: 'Smith',
    });

    expect(api.post).toHaveBeenCalledWith(
      '/auth/register',
      { email: 'a@b.c', password: 'pwd', firstName: 'Alice', lastName: 'Smith' },
    );
    expect(localStorage.getItem('token')).toBe('tok-123');
  });
});

describe('authService.logout', () => {
  it('supprime token et user du localStorage', () => {
    localStorage.setItem('token', 'tok');
    localStorage.setItem('user', JSON.stringify(fakeAuthResponse));

    authService.logout();

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });
});

describe('authService.getCurrentUser', () => {
  beforeEach(() => localStorage.clear());

  it('retourne l\'utilisateur parsé depuis localStorage', () => {
    localStorage.setItem('user', JSON.stringify(fakeAuthResponse));
    expect(authService.getCurrentUser()).toEqual(fakeAuthResponse);
  });

  it('retourne null quand rien n\'est stocké', () => {
    expect(authService.getCurrentUser()).toBeNull();
  });
});

describe('authService.updateCurrentUser', () => {
  beforeEach(() => localStorage.clear());

  it('fusionne les updates avec l\'utilisateur courant', () => {
    localStorage.setItem('user', JSON.stringify(fakeAuthResponse));

    const updated = authService.updateCurrentUser({ firstName: 'Bob' });

    expect(updated?.firstName).toBe('Bob');
    expect(updated?.lastName).toBe('Smith');
    expect(JSON.parse(localStorage.getItem('user')!).firstName).toBe('Bob');
  });

  it('retourne null si aucun utilisateur n\'est connecté', () => {
    expect(authService.updateCurrentUser({ firstName: 'Bob' })).toBeNull();
  });
});

describe('authService.getToken / isAuthenticated', () => {
  beforeEach(() => localStorage.clear());

  it('getToken retourne la valeur stockée', () => {
    localStorage.setItem('token', 'abc');
    expect(authService.getToken()).toBe('abc');
  });

  it('isAuthenticated est true quand un token existe', () => {
    localStorage.setItem('token', 'abc');
    expect(authService.isAuthenticated()).toBe(true);
  });

  it('isAuthenticated est false sans token', () => {
    expect(authService.isAuthenticated()).toBe(false);
  });
});
