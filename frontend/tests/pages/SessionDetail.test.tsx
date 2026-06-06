import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AxiosError } from 'axios';
import SessionDetail from '../../src/pages/SessionDetail';
import { authService } from '../../src/services/auth.service';
import { sessionService } from '../../src/services/session.service';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../../src/services/auth.service', () => ({
  authService: {
    getCurrentUser: vi.fn(),
    getToken: vi.fn(),
  },
}));

vi.mock('../../src/services/session.service', () => ({
  sessionService: {
    getSession: vi.fn(),
    participate: vi.fn(),
    unparticipate: vi.fn(),
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

const SESSION_BASE = {
  id: 7,
  name: 'Salutation au soleil',
  date: '2026-07-15T09:00:00.000Z',
  description: 'Un flow dynamique',
  teacher: { id: 3, firstName: 'Charlie', lastName: 'Zterone' },
  users: [] as number[],
};

function renderDetail() {
  return render(
    <MemoryRouter initialEntries={[`/sessions/${SESSION_BASE.id}`]}>
      <Routes>
        <Route path="/sessions/:id" element={<SessionDetail />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('SessionDetail (integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authService.getToken).mockReturnValue(TOKEN);
  });

  it('displays "Loading session..." during the load', () => {
    vi.mocked(authService.getCurrentUser).mockReturnValue(NORMAL_USER);
    vi.mocked(sessionService.getSession).mockReturnValue(new Promise(() => {}));
    renderDetail();
    expect(screen.getByText(/loading session/i)).toBeInTheDocument();
  });

  it('displays the name, date, teacher and description once loaded', async () => {
    vi.mocked(authService.getCurrentUser).mockReturnValue(NORMAL_USER);
    vi.mocked(sessionService.getSession).mockResolvedValue(SESSION_BASE);

    renderDetail();

    expect(await screen.findByRole('heading', { name: SESSION_BASE.name })).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`${SESSION_BASE.teacher.firstName} ${SESSION_BASE.teacher.lastName}`))).toBeInTheDocument();
    expect(screen.getByText(new RegExp(SESSION_BASE.description))).toBeInTheDocument();
  });

  it('displays the error message if the load fails', async () => {
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

  it('displays "Join Session" for a user not registered, and registers them on click', async () => {
    vi.mocked(authService.getCurrentUser).mockReturnValue(NORMAL_USER);
    vi.mocked(sessionService.getSession).mockResolvedValue(SESSION_BASE);
    vi.mocked(sessionService.participate).mockResolvedValue(undefined);
    const user = userEvent.setup();

    renderDetail();
    await user.click(await screen.findByRole('button', { name: /join session/i }));

    await waitFor(() => expect(sessionService.participate).toHaveBeenCalledWith(TOKEN, String(SESSION_BASE.id), NORMAL_USER.id));
  });

  it('displays "Leave Session" for a user already registered, and unregisters them on click', async () => {
    vi.mocked(authService.getCurrentUser).mockReturnValue(NORMAL_USER);
    vi.mocked(sessionService.getSession).mockResolvedValue({ ...SESSION_BASE, users: [NORMAL_USER.id] });
    vi.mocked(sessionService.unparticipate).mockResolvedValue(undefined);
    const user = userEvent.setup();

    renderDetail();
    await user.click(await screen.findByRole('button', { name: /leave session/i }));

    await waitFor(() => expect(sessionService.unparticipate).toHaveBeenCalledWith(TOKEN, String(SESSION_BASE.id), NORMAL_USER.id));
  });

  it('displays the error message if participate fails', async () => {
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

  it('displays the Edit and Delete buttons for an admin', async () => {
    vi.mocked(authService.getCurrentUser).mockReturnValue(ADMIN_USER);
    vi.mocked(sessionService.getSession).mockResolvedValue(SESSION_BASE);

    renderDetail();

    expect(await screen.findByRole('button', { name: 'Edit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /join session/i })).not.toBeInTheDocument();
  });

  it('Edit redirects to the edit page', async () => {
    vi.mocked(authService.getCurrentUser).mockReturnValue(ADMIN_USER);
    vi.mocked(sessionService.getSession).mockResolvedValue(SESSION_BASE);
    const user = userEvent.setup();

    renderDetail();
    await user.click(await screen.findByRole('button', { name: 'Edit' }));

    expect(mockNavigate).toHaveBeenCalledWith(`/sessions/edit/${SESSION_BASE.id}`);
  });

  it('Delete removes the session and redirects after confirmation', async () => {
    vi.mocked(authService.getCurrentUser).mockReturnValue(ADMIN_USER);
    vi.mocked(sessionService.getSession).mockResolvedValue(SESSION_BASE);
    vi.mocked(sessionService.deleteSession).mockResolvedValue(undefined);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const user = userEvent.setup();

    renderDetail();
    await user.click(await screen.findByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(sessionService.deleteSession).toHaveBeenCalledWith(TOKEN, String(SESSION_BASE.id)));
    expect(mockNavigate).toHaveBeenCalledWith('/sessions');
  });

  it('Delete does nothing if the admin cancels the confirmation', async () => {
    vi.mocked(authService.getCurrentUser).mockReturnValue(ADMIN_USER);
    vi.mocked(sessionService.getSession).mockResolvedValue(SESSION_BASE);
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const user = userEvent.setup();

    renderDetail();
    await user.click(await screen.findByRole('button', { name: 'Delete' }));

    expect(sessionService.deleteSession).not.toHaveBeenCalled();
  });

  it('"Back to Sessions" navigates to /sessions', async () => {
    vi.mocked(authService.getCurrentUser).mockReturnValue(NORMAL_USER);
    vi.mocked(sessionService.getSession).mockResolvedValue(SESSION_BASE);
    const user = userEvent.setup();

    renderDetail();
    await user.click(await screen.findByRole('button', { name: /back to sessions/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/sessions');
  });
});
