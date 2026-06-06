import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../src/App';
import { authService } from '../src/services/auth.service';

vi.mock('../src/services/auth.service', () => ({
  authService: {
    isAuthenticated: vi.fn(),
    getCurrentUser: vi.fn(),
    getToken: vi.fn(),
    logout: vi.fn(),
  },
}));

// Mock des pages : on ne veut pas tester leur contenu ici, juste le routing.
// Chaque page rend un marqueur unique qu'on peut chercher avec getByText.
vi.mock('../src/pages/Login', () => ({
  default: () => <div>page:Login</div>,
}));
vi.mock('../src/pages/Register', () => ({
  default: () => <div>page:Register</div>,
}));
vi.mock('../src/pages/Sessions', () => ({
  default: () => <div>page:Sessions</div>,
}));
vi.mock('../src/pages/SessionDetail', () => ({
  default: () => <div>page:SessionDetail</div>,
}));
vi.mock('../src/pages/SessionForm', () => ({
  default: () => <div>page:SessionForm</div>,
}));
vi.mock('../src/pages/Profile', () => ({
  default: () => <div>page:Profile</div>,
}));

const USER = {
  id: 1, email: 'victor@yoga.com', firstName: 'Victor', lastName: 'Pille', admin: false, token: 'tok-123456789',
};

describe('App (routing)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authService.getCurrentUser).mockReturnValue(null);
  });

  it('renders the Navbar in all cases', () => {
    vi.mocked(authService.isAuthenticated).mockReturnValue(false);
    window.history.pushState({}, '', '/login');
    render(<App />);
    // La Navbar contient le titre "Yoga Studio"
    expect(screen.getByText('Yoga Studio')).toBeInTheDocument();
  });

  it('displays Login on /login', () => {
    vi.mocked(authService.isAuthenticated).mockReturnValue(false);
    window.history.pushState({}, '', '/login');
    render(<App />);
    expect(screen.getByText('page:Login')).toBeInTheDocument();
  });

  it('PrivateRoute redirects to /login if not authenticated', () => {
    vi.mocked(authService.isAuthenticated).mockReturnValue(false);
    window.history.pushState({}, '', '/sessions');
    render(<App />);
    // On doit voir le Login (après redirection), pas la page Sessions
    expect(screen.getByText('page:Login')).toBeInTheDocument();
    expect(screen.queryByText('page:Sessions')).not.toBeInTheDocument();
  });

  it('PrivateRoute lets authenticated users through', () => {
    vi.mocked(authService.isAuthenticated).mockReturnValue(true);
    vi.mocked(authService.getCurrentUser).mockReturnValue(USER);
    window.history.pushState({}, '', '/sessions');
    render(<App />);
    expect(screen.getByText('page:Sessions')).toBeInTheDocument();
  });

  it('/ redirects to /sessions', () => {
    vi.mocked(authService.isAuthenticated).mockReturnValue(true);
    vi.mocked(authService.getCurrentUser).mockReturnValue(USER);
    window.history.pushState({}, '', '/');
    render(<App />);
    expect(screen.getByText('page:Sessions')).toBeInTheDocument();
  });
});
