import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AxiosError } from 'axios';
import SessionDetail from './SessionDetail';
import { authService } from '../services/auth.service';
import { sessionService } from '../services/session.service';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../services/auth.service', () => ({
  authService: {
    getCurrentUser: vi.fn(),
    getToken: vi.fn(),
  },
}));

vi.mock('../services/session.service', () => ({
  sessionService: {
    getSession: vi.fn(),
    participate: vi.fn(),
    unparticipate: vi.fn(),
    deleteSession: vi.fn(),
  },
}));

const NORMAL_USER = {
  id: 10, email: 'u@x.c', firstName: 'U', lastName: 'U', admin: false, token: 't',
};

const ADMIN_USER = {
  id: 99, email: 'a@x.c', firstName: 'A', lastName: 'A', admin: true, token: 't',
};

const SESSION_BASE = {
  id: 7,
  name: 'Vinyasa',
  date: '2026-07-15T09:00:00.000Z',
  description: 'A dynamic flow',
  teacher: { id: 1, firstName: 'Alice', lastName: 'Doe' },
  users: [] as number[],
};

function renderDetail() {
  return render(
    <MemoryRouter initialEntries={['/sessions/7']}>
      <Routes>
        <Route path="/sessions/:id" element={<SessionDetail />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('SessionDetail (intégration)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authService.getToken).mockReturnValue('t');
  });

  it('affiche "Loading session..." pendant le chargement', () => {
    vi.mocked(authService.getCurrentUser).mockReturnValue(NORMAL_USER);
    vi.mocked(sessionService.getSession).mockReturnValue(new Promise(() => {}));
    renderDetail();
    expect(screen.getByText(/loading session/i)).toBeInTheDocument();
  });

  it('affiche le nom, la date, le teacher et la description une fois chargé', async () => {
    vi.mocked(authService.getCurrentUser).mockReturnValue(NORMAL_USER);
    vi.mocked(sessionService.getSession).mockResolvedValue(SESSION_BASE);

    renderDetail();

    expect(await screen.findByRole('heading', { name: 'Vinyasa' })).toBeInTheDocument();
    expect(screen.getByText(/Alice Doe/)).toBeInTheDocument();
    expect(screen.getByText(/A dynamic flow/)).toBeInTheDocument();
  });

  it('affiche le message d\'erreur si le chargement échoue', async () => {
    vi.mocked(authService.getCurrentUser).mockReturnValue(NORMAL_USER);
    const err = new AxiosError('fail');
    err.response = {
      data: { message: 'Not found' },
      status: 404, statusText: 'err', headers: {}, config: {} as any,
    };
    vi.mocked(sessionService.getSession).mockRejectedValue(err);

    renderDetail();
    expect(await screen.findByText('Not found')).toBeInTheDocument();
  });

  it('affiche "Join Session" pour un user non inscrit, et l\'inscrit au clic', async () => {
    vi.mocked(authService.getCurrentUser).mockReturnValue(NORMAL_USER);
    vi.mocked(sessionService.getSession).mockResolvedValue(SESSION_BASE);
    vi.mocked(sessionService.participate).mockResolvedValue(undefined);
    const user = userEvent.setup();

    renderDetail();
    await user.click(await screen.findByRole('button', { name: /join session/i }));

    await waitFor(() => expect(sessionService.participate).toHaveBeenCalledWith('t', '7', 10));
  });

  it('affiche "Leave Session" pour un user déjà inscrit, et le désinscrit au clic', async () => {
    vi.mocked(authService.getCurrentUser).mockReturnValue(NORMAL_USER);
    vi.mocked(sessionService.getSession).mockResolvedValue({ ...SESSION_BASE, users: [10] });
    vi.mocked(sessionService.unparticipate).mockResolvedValue(undefined);
    const user = userEvent.setup();

    renderDetail();
    await user.click(await screen.findByRole('button', { name: /leave session/i }));

    await waitFor(() => expect(sessionService.unparticipate).toHaveBeenCalledWith('t', '7', 10));
  });

  it('affiche le message d\'erreur si participate échoue', async () => {
    vi.mocked(authService.getCurrentUser).mockReturnValue(NORMAL_USER);
    vi.mocked(sessionService.getSession).mockResolvedValue(SESSION_BASE);
    const err = new AxiosError('fail');
    err.response = {
      data: { message: 'Already full' },
      status: 409, statusText: 'err', headers: {}, config: {} as any,
    };
    vi.mocked(sessionService.participate).mockRejectedValue(err);
    const user = userEvent.setup();

    renderDetail();
    await user.click(await screen.findByRole('button', { name: /join session/i }));

    expect(await screen.findByText('Already full')).toBeInTheDocument();
  });

  it('affiche les boutons Edit et Delete pour un admin', async () => {
    vi.mocked(authService.getCurrentUser).mockReturnValue(ADMIN_USER);
    vi.mocked(sessionService.getSession).mockResolvedValue(SESSION_BASE);

    renderDetail();

    expect(await screen.findByRole('button', { name: 'Edit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /join session/i })).not.toBeInTheDocument();
  });

  it('Edit redirige vers la page d\'édition', async () => {
    vi.mocked(authService.getCurrentUser).mockReturnValue(ADMIN_USER);
    vi.mocked(sessionService.getSession).mockResolvedValue(SESSION_BASE);
    const user = userEvent.setup();

    renderDetail();
    await user.click(await screen.findByRole('button', { name: 'Edit' }));

    expect(mockNavigate).toHaveBeenCalledWith('/sessions/edit/7');
  });

  it('Delete supprime la session et redirige après confirmation', async () => {
    vi.mocked(authService.getCurrentUser).mockReturnValue(ADMIN_USER);
    vi.mocked(sessionService.getSession).mockResolvedValue(SESSION_BASE);
    vi.mocked(sessionService.deleteSession).mockResolvedValue(undefined);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const user = userEvent.setup();

    renderDetail();
    await user.click(await screen.findByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(sessionService.deleteSession).toHaveBeenCalledWith('t', '7'));
    expect(mockNavigate).toHaveBeenCalledWith('/sessions');
  });

  it('Delete ne fait rien si l\'admin annule la confirmation', async () => {
    vi.mocked(authService.getCurrentUser).mockReturnValue(ADMIN_USER);
    vi.mocked(sessionService.getSession).mockResolvedValue(SESSION_BASE);
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const user = userEvent.setup();

    renderDetail();
    await user.click(await screen.findByRole('button', { name: 'Delete' }));

    expect(sessionService.deleteSession).not.toHaveBeenCalled();
  });

  it('"Back to Sessions" navigue vers /sessions', async () => {
    vi.mocked(authService.getCurrentUser).mockReturnValue(NORMAL_USER);
    vi.mocked(sessionService.getSession).mockResolvedValue(SESSION_BASE);
    const user = userEvent.setup();

    renderDetail();
    await user.click(await screen.findByRole('button', { name: /back to sessions/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/sessions');
  });
});
