import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AxiosError } from 'axios';
import SessionForm from './SessionForm';
import { authService } from '../services/auth.service';
import { sessionService } from '../services/session.service';
import { teacherService } from '../services/teacher.service';

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
    createSession: vi.fn(),
    updateSession: vi.fn(),
  },
}));

vi.mock('../services/teacher.service', () => ({
  teacherService: {
    getTeachers: vi.fn(),
  },
}));

const TOKEN = 'tok-123456789';

const ADMIN_USER = {
  id: 2, email: 'juliette@yoga.com', firstName: 'Juliette', lastName: 'Michel',
  admin: true, token: TOKEN, createdAt: '2026-01-15T10:00:00.000Z',
};

const TEACHERS = [
  { id: 3, firstName: 'Charlie', lastName: 'Zterone' },
  { id: 4, firstName: 'Oscar', lastName: 'Isé' },
];

// Données saisies dans le formulaire en mode création (réutilisées pour vérifier le payload)
const CREATE_INPUT = {
  name: 'Yoga du soir',
  date: '2026-07-15',
  description: 'Une séance dynamique',
  teacherId: TEACHERS[0].id,
};

const EDIT_SESSION = {
  id: 42,
  name: 'Yoga doux',
  date: '2026-08-20T10:00:00.000Z',
  description: 'Pratique douce',
  teacher: TEACHERS[1],
  users: [] as number[],
};

function getInputs() {
  const name = document.querySelector('input[name="name"]') as HTMLInputElement;
  const date = document.querySelector('input[name="date"]') as HTMLInputElement;
  const teacherSelect = document.querySelector('select[name="teacherId"]') as HTMLSelectElement;
  const description = document.querySelector('textarea[name="description"]') as HTMLTextAreaElement;
  return { name, date, teacherSelect, description };
}

function renderCreate() {
  return render(
    <MemoryRouter initialEntries={['/sessions/create']}>
      <Routes>
        <Route path="/sessions/create" element={<SessionForm />} />
        <Route path="/sessions/edit/:id" element={<SessionForm />} />
      </Routes>
    </MemoryRouter>,
  );
}

function renderEdit(id: string) {
  return render(
    <MemoryRouter initialEntries={[`/sessions/edit/${id}`]}>
      <Routes>
        <Route path="/sessions/edit/:id" element={<SessionForm />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('SessionForm (integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authService.getCurrentUser).mockReturnValue(ADMIN_USER);
    vi.mocked(authService.getToken).mockReturnValue(TOKEN);
    vi.mocked(teacherService.getTeachers).mockResolvedValue(TEACHERS);
  });

  it('displays the "Create New Session" title in creation mode', async () => {
    renderCreate();
    expect(await screen.findByRole('heading', { name: /create new session/i })).toBeInTheDocument();
  });

  it('loads the list of teachers and offers it in the select', async () => {
    renderCreate();
    await waitFor(() => expect(teacherService.getTeachers).toHaveBeenCalled());
    expect(await screen.findByRole('option', { name: `${TEACHERS[0].firstName} ${TEACHERS[0].lastName}` })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: `${TEACHERS[1].firstName} ${TEACHERS[1].lastName}` })).toBeInTheDocument();
  });

  it('submits the form, creates the session and redirects to /sessions', async () => {
    vi.mocked(sessionService.createSession).mockResolvedValue(undefined);
    const user = userEvent.setup();

    renderCreate();
    await screen.findByRole('option', { name: `${TEACHERS[0].firstName} ${TEACHERS[0].lastName}` });

    const { name, date, teacherSelect, description } = getInputs();
    await user.type(name, CREATE_INPUT.name);
    await user.type(date, CREATE_INPUT.date);
    await user.selectOptions(teacherSelect, String(CREATE_INPUT.teacherId));
    await user.type(description, CREATE_INPUT.description);
    await user.click(screen.getByRole('button', { name: /create session/i }));

    await waitFor(() => expect(sessionService.createSession).toHaveBeenCalledWith(TOKEN, CREATE_INPUT));
    expect(mockNavigate).toHaveBeenCalledWith('/sessions');
  });

  it('displays the backend error message if the creation fails', async () => {
    const err = new AxiosError('fail');
    err.response = {
      data: { message: 'Invalid date' },
      status: 400, statusText: 'err', headers: {}, config: {} as any,
    };
    vi.mocked(sessionService.createSession).mockRejectedValue(err);
    const user = userEvent.setup();

    renderCreate();
    await screen.findByRole('option', { name: `${TEACHERS[0].firstName} ${TEACHERS[0].lastName}` });

    const { name, date, teacherSelect, description } = getInputs();
    await user.type(name, CREATE_INPUT.name);
    await user.type(date, CREATE_INPUT.date);
    await user.selectOptions(teacherSelect, String(CREATE_INPUT.teacherId));
    await user.type(description, CREATE_INPUT.description);
    await user.click(screen.getByRole('button', { name: /create session/i }));

    expect(await screen.findByText('Invalid date')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('in edit mode, pre-fills the form with the session data', async () => {
    vi.mocked(sessionService.getSession).mockResolvedValue(EDIT_SESSION);

    renderEdit(String(EDIT_SESSION.id));

    expect(await screen.findByRole('heading', { name: /edit session/i })).toBeInTheDocument();
    await waitFor(() => {
      const { name, date, description } = getInputs();
      expect(name.value).toBe(EDIT_SESSION.name);
      expect(date.value).toBe('2026-08-20'); // toInputDate convertit la date ISO
      expect(description.value).toBe(EDIT_SESSION.description);
    });
    expect(sessionService.getSession).toHaveBeenCalledWith(TOKEN, String(EDIT_SESSION.id), expect.anything());
  });
});
