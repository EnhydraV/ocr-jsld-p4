import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AxiosError } from 'axios';
import Sessions from '../../src/pages/Sessions';
import { authService } from '../../src/services/auth.service';
import { sessionService } from '../../src/services/session.service';

vi.mock('../../src/services/auth.service', () => ({
  authService: {
    getCurrentUser: vi.fn(),
    getToken: vi.fn(),
  },
}));

vi.mock('../../src/services/session.service', () => ({
  sessionService: {
    getSessions: vi.fn(),
    deleteSession: vi.fn(),
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

const TEACHER = { id: 3, firstName: 'Charlie', lastName: 'Zterone' };
const TEACHER_2 = { id: 4, firstName: 'Oscar', lastName: 'Isé' };

const SAMPLE_SESSIONS = [
  {
    id: 1, name: 'Yoga du matin', date: '2026-07-15T09:00:00.000Z',
    description: 'Flow dynamique', users: [10, 20],
    teacher: TEACHER,
  },
  {
    id: 2, name: 'Détente du soir', date: '2026-07-16T18:00:00.000Z',
    description: 'Pratique douce', users: [],
    teacher: TEACHER_2,
  },
];

function renderSessions() {
  return render(<MemoryRouter><Sessions /></MemoryRouter>);
}

describe('Sessions (integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authService.getToken).mockReturnValue(TOKEN);
  });

  it('displays "Loading sessions..." during the initial load', () => {
    vi.mocked(authService.getCurrentUser).mockReturnValue(NORMAL_USER);
    vi.mocked(sessionService.getSessions).mockReturnValue(new Promise(() => {})); // jamais résolue

    renderSessions();
    expect(screen.getByText(/loading sessions/i)).toBeInTheDocument();
  });

  it('displays one card per session once the data is loaded', async () => {
    vi.mocked(authService.getCurrentUser).mockReturnValue(NORMAL_USER);
    vi.mocked(sessionService.getSessions).mockResolvedValue(SAMPLE_SESSIONS);

    renderSessions();

    expect(await screen.findByText(SAMPLE_SESSIONS[0].name)).toBeInTheDocument();
    expect(screen.getByText(SAMPLE_SESSIONS[1].name)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`${TEACHER.firstName} ${TEACHER.lastName}`))).toBeInTheDocument();
    expect(screen.getByText(/Participants: 2/)).toBeInTheDocument();
    expect(screen.getByText(/Participants: 0/)).toBeInTheDocument();
  });

  it('displays "No sessions available" when the list is empty', async () => {
    vi.mocked(authService.getCurrentUser).mockReturnValue(NORMAL_USER);
    vi.mocked(sessionService.getSessions).mockResolvedValue([]);

    renderSessions();

    expect(await screen.findByText(/no sessions available/i)).toBeInTheDocument();
  });

  it('displays the admin actions (Create Session, Delete) only for an admin', async () => {
    vi.mocked(authService.getCurrentUser).mockReturnValue(ADMIN_USER);
    vi.mocked(sessionService.getSessions).mockResolvedValue(SAMPLE_SESSIONS);

    renderSessions();

    expect(await screen.findByRole('link', { name: /create session/i })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /delete/i })).toHaveLength(SAMPLE_SESSIONS.length);
    });
  });

  it('does NOT show the admin actions for a normal user', async () => {
    vi.mocked(authService.getCurrentUser).mockReturnValue(NORMAL_USER);
    vi.mocked(sessionService.getSessions).mockResolvedValue(SAMPLE_SESSIONS);

    renderSessions();

    await screen.findByText(SAMPLE_SESSIONS[0].name);
    expect(screen.queryByRole('link', { name: /create session/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
  });

  it('admin clicks Delete, confirms, calls deleteSession then reloads the list', async () => {
    vi.mocked(authService.getCurrentUser).mockReturnValue(ADMIN_USER);
    vi.mocked(sessionService.getSessions).mockResolvedValue(SAMPLE_SESSIONS);
    vi.mocked(sessionService.deleteSession).mockResolvedValue(undefined);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const user = userEvent.setup();

    renderSessions();
    const deleteButtons = await screen.findAllByRole('button', { name: /delete/i });
    await user.click(deleteButtons[0]);

    await waitFor(() => expect(sessionService.deleteSession).toHaveBeenCalledWith(TOKEN, SAMPLE_SESSIONS[0].id));
    // après la suppression, getSessions est rappelé pour rafraîchir la liste
    await waitFor(() => expect(sessionService.getSessions).toHaveBeenCalledTimes(2));
  });

  it('admin clicks Delete and cancels the confirmation: nothing happens', async () => {
    vi.mocked(authService.getCurrentUser).mockReturnValue(ADMIN_USER);
    vi.mocked(sessionService.getSessions).mockResolvedValue(SAMPLE_SESSIONS);
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const user = userEvent.setup();

    renderSessions();
    const deleteButtons = await screen.findAllByRole('button', { name: /delete/i });
    await user.click(deleteButtons[0]);

    expect(sessionService.deleteSession).not.toHaveBeenCalled();
  });

  it('displays the error message if the deletion fails', async () => {
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
