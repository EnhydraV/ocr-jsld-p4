import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AxiosError } from 'axios';
import Sessions from './Sessions';
import { authService } from '../services/auth.service';
import { sessionService } from '../services/session.service';

vi.mock('../services/auth.service', () => ({
  authService: {
    getCurrentUser: vi.fn(),
    getToken: vi.fn(),
  },
}));

vi.mock('../services/session.service', () => ({
  sessionService: {
    getSessions: vi.fn(),
    deleteSession: vi.fn(),
  },
}));

const NORMAL_USER = {
  id: 1, email: 'u@x.c', firstName: 'U', lastName: 'U', admin: false, token: 't',
};

const ADMIN_USER = {
  id: 2, email: 'a@x.c', firstName: 'A', lastName: 'A', admin: true, token: 't',
};

const SAMPLE_SESSIONS = [
  {
    id: 1, name: 'Vinyasa Morning', date: '2026-07-15T09:00:00.000Z',
    description: 'Dynamic flow', users: [10, 20],
    teacher: { id: 1, firstName: 'Alice', lastName: 'Doe' },
  },
  {
    id: 2, name: 'Hatha Evening', date: '2026-07-16T18:00:00.000Z',
    description: 'Soft practice', users: [],
    teacher: { id: 2, firstName: 'Bob', lastName: 'Smith' },
  },
];

function renderSessions() {
  return render(<MemoryRouter><Sessions /></MemoryRouter>);
}

describe('Sessions (intégration)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authService.getToken).mockReturnValue('t');
  });

  it('affiche "Loading sessions..." pendant le chargement initial', () => {
    vi.mocked(authService.getCurrentUser).mockReturnValue(NORMAL_USER);
    vi.mocked(sessionService.getSessions).mockReturnValue(new Promise(() => {})); // jamais résolue

    renderSessions();
    expect(screen.getByText(/loading sessions/i)).toBeInTheDocument();
  });

  it('affiche une carte par session une fois les données chargées', async () => {
    vi.mocked(authService.getCurrentUser).mockReturnValue(NORMAL_USER);
    vi.mocked(sessionService.getSessions).mockResolvedValue(SAMPLE_SESSIONS);

    renderSessions();

    expect(await screen.findByText('Vinyasa Morning')).toBeInTheDocument();
    expect(screen.getByText('Hatha Evening')).toBeInTheDocument();
    expect(screen.getByText(/Alice Doe/)).toBeInTheDocument();
    expect(screen.getByText(/Participants: 2/)).toBeInTheDocument();
    expect(screen.getByText(/Participants: 0/)).toBeInTheDocument();
  });

  it('affiche "No sessions available" quand la liste est vide', async () => {
    vi.mocked(authService.getCurrentUser).mockReturnValue(NORMAL_USER);
    vi.mocked(sessionService.getSessions).mockResolvedValue([]);

    renderSessions();

    expect(await screen.findByText(/no sessions available/i)).toBeInTheDocument();
  });

  it('affiche les actions admin (Create Session, Delete) seulement pour un admin', async () => {
    vi.mocked(authService.getCurrentUser).mockReturnValue(ADMIN_USER);
    vi.mocked(sessionService.getSessions).mockResolvedValue(SAMPLE_SESSIONS);

    renderSessions();

    expect(await screen.findByRole('link', { name: /create session/i })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /delete/i })).toHaveLength(SAMPLE_SESSIONS.length);
    });
  });

  it('ne montre PAS les actions admin pour un utilisateur normal', async () => {
    vi.mocked(authService.getCurrentUser).mockReturnValue(NORMAL_USER);
    vi.mocked(sessionService.getSessions).mockResolvedValue(SAMPLE_SESSIONS);

    renderSessions();

    await screen.findByText('Vinyasa Morning');
    expect(screen.queryByRole('link', { name: /create session/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
  });

  it('admin clique sur Delete, confirme, appelle deleteSession puis recharge la liste', async () => {
    vi.mocked(authService.getCurrentUser).mockReturnValue(ADMIN_USER);
    vi.mocked(sessionService.getSessions).mockResolvedValue(SAMPLE_SESSIONS);
    vi.mocked(sessionService.deleteSession).mockResolvedValue(undefined);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const user = userEvent.setup();

    renderSessions();
    const deleteButtons = await screen.findAllByRole('button', { name: /delete/i });
    await user.click(deleteButtons[0]);

    await waitFor(() => expect(sessionService.deleteSession).toHaveBeenCalledWith('t', 1));
    // après la suppression, getSessions est rappelé pour rafraîchir la liste
    await waitFor(() => expect(sessionService.getSessions).toHaveBeenCalledTimes(2));
  });

  it('admin clique Delete et annule la confirmation : rien ne se passe', async () => {
    vi.mocked(authService.getCurrentUser).mockReturnValue(ADMIN_USER);
    vi.mocked(sessionService.getSessions).mockResolvedValue(SAMPLE_SESSIONS);
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const user = userEvent.setup();

    renderSessions();
    const deleteButtons = await screen.findAllByRole('button', { name: /delete/i });
    await user.click(deleteButtons[0]);

    expect(sessionService.deleteSession).not.toHaveBeenCalled();
  });

  it('affiche le message d\'erreur si la suppression échoue', async () => {
    vi.mocked(authService.getCurrentUser).mockReturnValue(ADMIN_USER);
    vi.mocked(sessionService.getSessions).mockResolvedValue(SAMPLE_SESSIONS);
    const err = new AxiosError('fail');
    err.response = {
      data: { message: 'Cannot delete' },
      status: 403, statusText: 'err', headers: {}, config: {} as any,
    };
    vi.mocked(sessionService.deleteSession).mockRejectedValue(err);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const user = userEvent.setup();

    renderSessions();
    const deleteButtons = await screen.findAllByRole('button', { name: /delete/i });
    await user.click(deleteButtons[0]);

    expect(await screen.findByText('Cannot delete')).toBeInTheDocument();
  });
});
