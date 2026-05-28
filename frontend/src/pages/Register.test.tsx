import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AxiosError } from 'axios';
import Register from './Register';
import { authService } from '../services/auth.service';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../services/auth.service', () => ({
  authService: { register: vi.fn() },
}));

// FormField ne lie pas label et input, donc on récupère les inputs par nom
function getInputs() {
  const firstName = document.querySelector('input[name="firstName"]') as HTMLInputElement;
  const lastName = document.querySelector('input[name="lastName"]') as HTMLInputElement;
  const email = document.querySelector('input[name="email"]') as HTMLInputElement;
  const password = document.querySelector('input[name="password"]') as HTMLInputElement;
  return { firstName, lastName, email, password };
}

function renderRegister() {
  return render(<MemoryRouter><Register /></MemoryRouter>);
}

describe('Register (intégration)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('affiche le titre et les 4 champs', () => {
    renderRegister();
    expect(screen.getByRole('heading', { name: /register for yoga studio/i })).toBeInTheDocument();
    const { firstName, lastName, email, password } = getInputs();
    expect(firstName).toBeInTheDocument();
    expect(lastName).toBeInTheDocument();
    expect(email).toBeInTheDocument();
    expect(password).toBeInTheDocument();
  });

  it('soumet le formulaire et redirige vers /sessions en cas de succès', async () => {
    vi.mocked(authService.register).mockResolvedValue({
      id: 1, email: 'a@b.c', firstName: 'Alice', lastName: 'Smith', admin: false, token: 't',
    });
    const user = userEvent.setup();

    renderRegister();
    const { firstName, lastName, email, password } = getInputs();
    await user.type(firstName, 'Alice');
    await user.type(lastName, 'Smith');
    await user.type(email, 'a@b.c');
    await user.type(password, 'secret12');
    await user.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => expect(authService.register).toHaveBeenCalledWith({
      email: 'a@b.c', password: 'secret12', firstName: 'Alice', lastName: 'Smith',
    }));
    expect(mockNavigate).toHaveBeenCalledWith('/sessions');
  });

  it('affiche le message d\'erreur retourné par l\'API en cas d\'échec', async () => {
    const err = new AxiosError('fail');
    err.response = {
      data: { message: 'Email already taken' },
      status: 409, statusText: 'err', headers: {}, config: {} as any,
    };
    vi.mocked(authService.register).mockRejectedValue(err);
    const user = userEvent.setup();

    renderRegister();
    const { firstName, lastName, email, password } = getInputs();
    await user.type(firstName, 'Alice');
    await user.type(lastName, 'Smith');
    await user.type(email, 'taken@b.c');
    await user.type(password, 'secret12');
    await user.click(screen.getByRole('button', { name: /register/i }));

    expect(await screen.findByText('Email already taken')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('affiche le fallback "Registration failed" quand l\'erreur n\'est pas axios', async () => {
    vi.mocked(authService.register).mockRejectedValue(new Error('boom'));
    const user = userEvent.setup();

    renderRegister();
    const { firstName, lastName, email, password } = getInputs();
    await user.type(firstName, 'Alice');
    await user.type(lastName, 'Smith');
    await user.type(email, 'a@b.c');
    await user.type(password, 'secret12');
    await user.click(screen.getByRole('button', { name: /register/i }));

    expect(await screen.findByText('Registration failed')).toBeInTheDocument();
  });
});
