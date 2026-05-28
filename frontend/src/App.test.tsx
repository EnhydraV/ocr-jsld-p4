import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';
import { authService } from './services/auth.service';

vi.mock('./services/auth.service', () => ({
  authService: {
    isAuthenticated: vi.fn(),
    getCurrentUser: vi.fn(),
    getToken: vi.fn(),
    logout: vi.fn(),
  },
}));

// Mock des pages : on ne veut pas tester leur contenu ici, juste le routing.
// Chaque page rend un marqueur unique qu'on peut chercher avec getByText.
vi.mock('./pages/Login', () => ({
  default: () => <div>page:Login</div>,
}));
vi.mock('./pages/Register', () => ({
  default: () => <div>page:Register</div>,
}));
vi.mock('./pages/Sessions', () => ({
  default: () => <div>page:Sessions</div>,
}));
vi.mock('./pages/SessionDetail', () => ({
  default: () => <div>page:SessionDetail</div>,
}));
vi.mock('./pages/SessionForm', () => ({
  default: () => <div>page:SessionForm</div>,
}));
vi.mock('./pages/Profile', () => ({
  default: () => <div>page:Profile</div>,
}));

describe('App (routing)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authService.getCurrentUser).mockReturnValue(null);
  });

  it('rend la Navbar dans tous les cas', () => {
    vi.mocked(authService.isAuthenticated).mockReturnValue(false);
    window.history.pushState({}, '', '/login');
    render(<App />);
    // La Navbar contient le titre "Yoga Studio"
    expect(screen.getByText('Yoga Studio')).toBeInTheDocument();
  });

  it('affiche Login sur /login', () => {
    vi.mocked(authService.isAuthenticated).mockReturnValue(false);
    window.history.pushState({}, '', '/login');
    render(<App />);
    expect(screen.getByText('page:Login')).toBeInTheDocument();
  });

  it('PrivateRoute redirige vers /login si non authentifié', () => {
    vi.mocked(authService.isAuthenticated).mockReturnValue(false);
    window.history.pushState({}, '', '/sessions');
    render(<App />);
    // On doit voir le Login (après redirection), pas la page Sessions
    expect(screen.getByText('page:Login')).toBeInTheDocument();
    expect(screen.queryByText('page:Sessions')).not.toBeInTheDocument();
  });

  it('PrivateRoute laisse passer les utilisateurs authentifiés', () => {
    vi.mocked(authService.isAuthenticated).mockReturnValue(true);
    vi.mocked(authService.getCurrentUser).mockReturnValue({
      id: 1, email: 'a@b.c', firstName: 'A', lastName: 'B', admin: false, token: 't',
    });
    window.history.pushState({}, '', '/sessions');
    render(<App />);
    expect(screen.getByText('page:Sessions')).toBeInTheDocument();
  });

  it('/ redirige vers /sessions', () => {
    vi.mocked(authService.isAuthenticated).mockReturnValue(true);
    vi.mocked(authService.getCurrentUser).mockReturnValue({
      id: 1, email: 'a@b.c', firstName: 'A', lastName: 'B', admin: false, token: 't',
    });
    window.history.pushState({}, '', '/');
    render(<App />);
    expect(screen.getByText('page:Sessions')).toBeInTheDocument();
  });
});
