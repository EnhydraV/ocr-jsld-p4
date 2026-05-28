import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { authService } from '../services/auth.service';
import Navbar from './Navbar';

vi.mock('../services/auth.service', () => ({
  authService: {
    getCurrentUser: vi.fn(),
    isAuthenticated: vi.fn(),
    logout: vi.fn(),
  },
}));

function renderNavbar() {
  return render(<MemoryRouter><Navbar /></MemoryRouter>);
}

describe('Navbar — non connecté', () => {
  beforeEach(() => {
    vi.mocked(authService.isAuthenticated).mockReturnValue(false);
    vi.mocked(authService.getCurrentUser).mockReturnValue(null);
  });

  it('affiche les liens Login et Register', () => {
    renderNavbar();
    expect(screen.getByRole('link', { name: 'Login' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Register' })).toBeInTheDocument();
  });

  it('ne montre pas les liens Sessions ni Profile', () => {
    renderNavbar();
    expect(screen.queryByRole('link', { name: 'Sessions' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Profile' })).not.toBeInTheDocument();
  });
});

describe('Navbar — utilisateur connecté', () => {
  beforeEach(() => {
    vi.mocked(authService.isAuthenticated).mockReturnValue(true);
    vi.mocked(authService.getCurrentUser).mockReturnValue({
      id: 1, email: 'user@test.com', firstName: 'Alice', lastName: 'Smith', admin: false, token: 'tok',
    });
  });

  it('affiche les liens Sessions et Profile', () => {
    renderNavbar();
    expect(screen.getByRole('link', { name: 'Sessions' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Profile' })).toBeInTheDocument();
  });

  it('ne montre pas le lien Create Session', () => {
    renderNavbar();
    expect(screen.queryByRole('link', { name: 'Create Session' })).not.toBeInTheDocument();
  });

  it('affiche le bouton Logout', () => {
    renderNavbar();
    expect(screen.getByRole('button', { name: 'Logout' })).toBeInTheDocument();
  });

  it('appelle authService.logout au clic sur Logout', async () => {
    const user = userEvent.setup();
    renderNavbar();
    await user.click(screen.getByRole('button', { name: 'Logout' }));
    expect(authService.logout).toHaveBeenCalledOnce();
  });
});

describe('Navbar — admin connecté', () => {
  beforeEach(() => {
    vi.mocked(authService.isAuthenticated).mockReturnValue(true);
    vi.mocked(authService.getCurrentUser).mockReturnValue({
      id: 2, email: 'admin@test.com', firstName: 'Admin', lastName: 'User', admin: true, token: 'tok',
    });
  });

  it('affiche le lien Create Session', () => {
    renderNavbar();
    expect(screen.getByRole('link', { name: 'Create Session' })).toBeInTheDocument();
  });
});
