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

const ADMIN_USER = {
  id: 1, email: 'admin@x.c', firstName: 'Admin', lastName: 'A', admin: true, token: 't',
};

const TEACHERS = [
  { id: 1, firstName: 'Alice', lastName: 'Doe' },
  { id: 2, firstName: 'Bob', lastName: 'Smith' },
];

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

describe('SessionForm (intégration)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authService.getCurrentUser).mockReturnValue(ADMIN_USER);
    vi.mocked(authService.getToken).mockReturnValue('t');
    vi.mocked(teacherService.getTeachers).mockResolvedValue(TEACHERS);
  });

  it('affiche le titre "Create New Session" en mode création', async () => {
    renderCreate();
    expect(await screen.findByRole('heading', { name: /create new session/i })).toBeInTheDocument();
  });

  it('charge la liste des teachers et la propose dans le select', async () => {
    renderCreate();
    await waitFor(() => expect(teacherService.getTeachers).toHaveBeenCalled());
    expect(await screen.findByRole('option', { name: 'Alice Doe' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Bob Smith' })).toBeInTheDocument();
  });

  it('soumet le formulaire, crée la session et redirige vers /sessions', async () => {
    vi.mocked(sessionService.createSession).mockResolvedValue(undefined);
    const user = userEvent.setup();

    renderCreate();
    await screen.findByRole('option', { name: 'Alice Doe' });

    const { name, date, teacherSelect, description } = getInputs();
    await user.type(name, 'Vinyasa');
    await user.type(date, '2026-07-15');
    await user.selectOptions(teacherSelect, '1');
    await user.type(description, 'Une session dynamique');
    await user.click(screen.getByRole('button', { name: /create session/i }));

    await waitFor(() => expect(sessionService.createSession).toHaveBeenCalledWith('t', {
      name: 'Vinyasa',
      date: '2026-07-15',
      description: 'Une session dynamique',
      teacherId: 1,
    }));
    expect(mockNavigate).toHaveBeenCalledWith('/sessions');
  });

  it('affiche le message d\'erreur backend si la création échoue', async () => {
    const err = new AxiosError('fail');
    err.response = {
      data: { message: 'Invalid date' },
      status: 400, statusText: 'err', headers: {}, config: {} as any,
    };
    vi.mocked(sessionService.createSession).mockRejectedValue(err);
    const user = userEvent.setup();

    renderCreate();
    await screen.findByRole('option', { name: 'Alice Doe' });

    const { name, date, teacherSelect, description } = getInputs();
    await user.type(name, 'Vinyasa');
    await user.type(date, '2026-07-15');
    await user.selectOptions(teacherSelect, '1');
    await user.type(description, 'desc');
    await user.click(screen.getByRole('button', { name: /create session/i }));

    expect(await screen.findByText('Invalid date')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('en mode édition, pré-remplit le formulaire avec les données de la session', async () => {
    vi.mocked(sessionService.getSession).mockResolvedValue({
      id: 42,
      name: 'Hatha',
      date: '2026-08-20T10:00:00.000Z',
      description: 'Doux',
      teacher: { id: 2, firstName: 'Bob', lastName: 'Smith' },
      users: [],
    });

    renderEdit('42');

    expect(await screen.findByRole('heading', { name: /edit session/i })).toBeInTheDocument();
    await waitFor(() => {
      const { name, date, description } = getInputs();
      expect(name.value).toBe('Hatha');
      expect(date.value).toBe('2026-08-20');
      expect(description.value).toBe('Doux');
    });
    expect(sessionService.getSession).toHaveBeenCalledWith('t', '42', expect.anything());
  });
});
