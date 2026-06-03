import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AxiosError } from 'axios';
import Profile from './Profile';
import { authService } from '../services/auth.service';
import { userService } from '../services/user.service';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../services/auth.service', () => ({
  authService: {
    getCurrentUser: vi.fn(),
    getToken: vi.fn(),
    logout: vi.fn(),
    updateCurrentUser: vi.fn(),
  },
}));

vi.mock('../services/user.service', () => ({
  userService: {
    getUser: vi.fn(),
    deleteUser: vi.fn(),
    promoteAdmin: vi.fn(),
  },
}));

const TOKEN = 'tok-123456789';

const NORMAL_USER = {
  id: 1, email: 'victor@yoga.com', firstName: 'Victor', lastName: 'Pille',
  admin: false, token: TOKEN, createdAt: '2026-01-15T10:00:00.000Z',
};

const ADMIN_USER = {
  ...NORMAL_USER, id: 2, email: 'juliette@yoga.com', firstName: 'Juliette', lastName: 'Michel', admin: true,
};

function renderProfile() {
  return render(<MemoryRouter><Profile /></MemoryRouter>);
}

describe('Profile (integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authService.getToken).mockReturnValue(TOKEN);
    vi.mocked(authService.getCurrentUser).mockReturnValue(NORMAL_USER);
  });

  it('displays "Loading profile..." while loading', () => {
    vi.mocked(userService.getUser).mockReturnValue(new Promise(() => {}));
    renderProfile();
    expect(screen.getByText(/loading profile/i)).toBeInTheDocument();
  });

  it('displays the user info once loaded', async () => {
    vi.mocked(userService.getUser).mockResolvedValue(NORMAL_USER);

    renderProfile();

    expect(await screen.findByRole('heading', { name: /my profile/i })).toBeInTheDocument();
    expect(screen.getByText(NORMAL_USER.firstName)).toBeInTheDocument();
    expect(screen.getByText(NORMAL_USER.lastName)).toBeInTheDocument();
    expect(screen.getByText(NORMAL_USER.email)).toBeInTheDocument();
    expect(screen.getByText('User')).toBeInTheDocument();
  });

  it('displays "Administrator" for an admin', async () => {
    vi.mocked(authService.getCurrentUser).mockReturnValue(ADMIN_USER);
    vi.mocked(userService.getUser).mockResolvedValue(ADMIN_USER);

    renderProfile();

    expect(await screen.findByText('Administrator')).toBeInTheDocument();
  });

  it('displays an error message if loading fails', async () => {
    const err = new AxiosError('fail');
    err.response = {
      data: { message: 'Not found' },
      status: 404, statusText: 'err', headers: {}, config: {} as any,
    };
    vi.mocked(userService.getUser).mockRejectedValue(err);

    renderProfile();

    expect(await screen.findByText('Not found')).toBeInTheDocument();
  });

  it('calls deleteUser, logout and redirects to /login after confirmation', async () => {
    vi.mocked(userService.getUser).mockResolvedValue(NORMAL_USER);
    vi.mocked(userService.deleteUser).mockResolvedValue(undefined);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const user = userEvent.setup();

    renderProfile();
    await screen.findByRole('heading', { name: /my profile/i });
    await user.click(screen.getByRole('button', { name: /delete account/i }));

    await waitFor(() => expect(userService.deleteUser).toHaveBeenCalledWith(TOKEN, NORMAL_USER.id));
    expect(authService.logout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('does nothing if the user cancels the confirmation', async () => {
    vi.mocked(userService.getUser).mockResolvedValue(NORMAL_USER);
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const user = userEvent.setup();

    renderProfile();
    await screen.findByRole('heading', { name: /my profile/i });
    await user.click(screen.getByRole('button', { name: /delete account/i }));

    expect(userService.deleteUser).not.toHaveBeenCalled();
    expect(authService.logout).not.toHaveBeenCalled();
  });

  it('displays the error message if deletion fails', async () => {
    vi.mocked(userService.getUser).mockResolvedValue(NORMAL_USER);
    const err = new AxiosError('fail');
    err.response = {
      data: { message: 'Cannot delete' },
      status: 403, statusText: 'err', headers: {}, config: {} as any,
    };
    vi.mocked(userService.deleteUser).mockRejectedValue(err);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const user = userEvent.setup();

    renderProfile();
    await screen.findByRole('heading', { name: /my profile/i });
    await user.click(screen.getByRole('button', { name: /delete account/i }));

    expect(await screen.findByText('Cannot delete')).toBeInTheDocument();
    expect(authService.logout).not.toHaveBeenCalled();
  });

  it('the "Back to Sessions" button navigates to /sessions', async () => {
    vi.mocked(userService.getUser).mockResolvedValue(NORMAL_USER);
    const user = userEvent.setup();

    renderProfile();
    await screen.findByRole('heading', { name: /my profile/i });
    await user.click(screen.getByRole('button', { name: /back to sessions/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/sessions');
  });

  it('clicks "Promote to Admin", calls the API and updates the local user', async () => {
    vi.mocked(userService.getUser).mockResolvedValue(NORMAL_USER);
    vi.mocked(userService.promoteAdmin).mockResolvedValue({ ...NORMAL_USER, admin: true });
    const user = userEvent.setup();

    renderProfile();
    await screen.findByRole('heading', { name: /my profile/i });
    await user.click(screen.getByRole('button', { name: /promote to admin/i }));

    await waitFor(() => expect(userService.promoteAdmin).toHaveBeenCalledWith(TOKEN));
    expect(authService.updateCurrentUser).toHaveBeenCalledWith({ admin: true });
  });

  it('displays the error message if the promotion fails', async () => {
    vi.mocked(userService.getUser).mockResolvedValue(NORMAL_USER);
    const err = new AxiosError('fail');
    err.response = {
      data: { message: 'Promotion refused' },
      status: 403, statusText: 'err', headers: {}, config: {} as any,
    };
    vi.mocked(userService.promoteAdmin).mockRejectedValue(err);
    const user = userEvent.setup();

    renderProfile();
    await screen.findByRole('heading', { name: /my profile/i });
    await user.click(screen.getByRole('button', { name: /promote to admin/i }));

    expect(await screen.findByText('Promotion refused')).toBeInTheDocument();
    expect(authService.updateCurrentUser).not.toHaveBeenCalled();
  });
});
