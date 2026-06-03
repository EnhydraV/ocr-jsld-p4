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

const USER = {
  id: 1, email: 'victor@yoga.com', firstName: 'Victor', lastName: 'Pille', admin: false, token: 'tok-123456789',
};

const ADMIN = {
  ...USER, id: 2, email: 'juliette@yoga.com', firstName: 'Juliette', lastName: 'Michel', admin: true,
};

function renderNavbar() {
  return render(<MemoryRouter><Navbar /></MemoryRouter>);
}

describe('Navbar — not logged in', () => {
  beforeEach(() => {
    vi.mocked(authService.isAuthenticated).mockReturnValue(false);
    vi.mocked(authService.getCurrentUser).mockReturnValue(null);
  });

  it('displays the Login and Register links', () => {
    renderNavbar();
    expect(screen.getByRole('link', { name: 'Login' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Register' })).toBeInTheDocument();
  });

  it('does not show the Sessions or Profile links', () => {
    renderNavbar();
    expect(screen.queryByRole('link', { name: 'Sessions' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Profile' })).not.toBeInTheDocument();
  });
});

describe('Navbar — logged-in user', () => {
  beforeEach(() => {
    vi.mocked(authService.isAuthenticated).mockReturnValue(true);
    vi.mocked(authService.getCurrentUser).mockReturnValue(USER);
  });

  it('displays the Sessions and Profile links', () => {
    renderNavbar();
    expect(screen.getByRole('link', { name: 'Sessions' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Profile' })).toBeInTheDocument();
  });

  it('does not show the Create Session link', () => {
    renderNavbar();
    expect(screen.queryByRole('link', { name: 'Create Session' })).not.toBeInTheDocument();
  });

  it('displays the Logout button', () => {
    renderNavbar();
    expect(screen.getByRole('button', { name: 'Logout' })).toBeInTheDocument();
  });

  it('calls authService.logout when clicking Logout', async () => {
    const user = userEvent.setup();
    renderNavbar();
    await user.click(screen.getByRole('button', { name: 'Logout' }));
    expect(authService.logout).toHaveBeenCalledOnce();
  });
});

describe('Navbar — logged-in admin', () => {
  beforeEach(() => {
    vi.mocked(authService.isAuthenticated).mockReturnValue(true);
    vi.mocked(authService.getCurrentUser).mockReturnValue(ADMIN);
  });

  it('displays the Create Session link', () => {
    renderNavbar();
    expect(screen.getByRole('link', { name: 'Create Session' })).toBeInTheDocument();
  });
});
