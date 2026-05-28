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

const NORMAL_USER = {
  id: 1, email: 'u@x.c', firstName: 'Alice', lastName: 'Smith',
  admin: false, token: 't', createdAt: '2025-01-15T10:00:00.000Z',
};

const ADMIN_USER = {
  ...NORMAL_USER, id: 2, admin: true,
};

function renderProfile() {
  return render(<MemoryRouter><Profile /></MemoryRouter>);
}

describe('Profile (intégration)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authService.getToken).mockReturnValue('t');
    vi.mocked(authService.getCurrentUser).mockReturnValue(NORMAL_USER);
  });

  it('affiche "Loading profile..." pendant le chargement', () => {
    vi.mocked(userService.getUser).mockReturnValue(new Promise(() => {}));
    renderProfile();
    expect(screen.getByText(/loading profile/i)).toBeInTheDocument();
  });

  it('affiche les infos utilisateur une fois chargées', async () => {
    vi.mocked(userService.getUser).mockResolvedValue(NORMAL_USER);

    renderProfile();

    expect(await screen.findByRole('heading', { name: /my profile/i })).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Smith')).toBeInTheDocument();
    expect(screen.getByText('u@x.c')).toBeInTheDocument();
    expect(screen.getByText('User')).toBeInTheDocument();
  });

  it('affiche "Administrator" pour un admin', async () => {
    vi.mocked(authService.getCurrentUser).mockReturnValue(ADMIN_USER);
    vi.mocked(userService.getUser).mockResolvedValue(ADMIN_USER);

    renderProfile();

    expect(await screen.findByText('Administrator')).toBeInTheDocument();
  });

  it('affiche un message d\'erreur si le chargement échoue', async () => {
    const err = new AxiosError('fail');
    err.response = {
      data: { message: 'Not found' },
      status: 404, statusText: 'err', headers: {}, config: {} as any,
    };
    vi.mocked(userService.getUser).mockRejectedValue(err);

    renderProfile();

    expect(await screen.findByText('Not found')).toBeInTheDocument();
  });

  it('appelle deleteUser, logout et redirige vers /login après confirmation', async () => {
    vi.mocked(userService.getUser).mockResolvedValue(NORMAL_USER);
    vi.mocked(userService.deleteUser).mockResolvedValue(undefined);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const user = userEvent.setup();

    renderProfile();
    await screen.findByRole('heading', { name: /my profile/i });
    await user.click(screen.getByRole('button', { name: /delete account/i }));

    await waitFor(() => expect(userService.deleteUser).toHaveBeenCalledWith('t', 1));
    expect(authService.logout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('ne fait rien si l\'utilisateur annule la confirmation', async () => {
    vi.mocked(userService.getUser).mockResolvedValue(NORMAL_USER);
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const user = userEvent.setup();

    renderProfile();
    await screen.findByRole('heading', { name: /my profile/i });
    await user.click(screen.getByRole('button', { name: /delete account/i }));

    expect(userService.deleteUser).not.toHaveBeenCalled();
    expect(authService.logout).not.toHaveBeenCalled();
  });

  it('affiche le message d\'erreur si la suppression échoue', async () => {
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

  it('le bouton "Back to Sessions" navigue vers /sessions', async () => {
    vi.mocked(userService.getUser).mockResolvedValue(NORMAL_USER);
    const user = userEvent.setup();

    renderProfile();
    await screen.findByRole('heading', { name: /my profile/i });
    await user.click(screen.getByRole('button', { name: /back to sessions/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/sessions');
  });

  it('clique sur "Promote to Admin", appelle l\'API et met à jour le user local', async () => {
    vi.mocked(userService.getUser).mockResolvedValue(NORMAL_USER);
    vi.mocked(userService.promoteAdmin).mockResolvedValue({ ...NORMAL_USER, admin: true });
    const user = userEvent.setup();

    renderProfile();
    await screen.findByRole('heading', { name: /my profile/i });
    await user.click(screen.getByRole('button', { name: /promote to admin/i }));

    await waitFor(() => expect(userService.promoteAdmin).toHaveBeenCalledWith('t'));
    expect(authService.updateCurrentUser).toHaveBeenCalledWith({ admin: true });
  });

  it('affiche le message d\'erreur si la promotion échoue', async () => {
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
