import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AxiosError } from 'axios';
import Login from './Login';
import { authService } from '../services/auth.service';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../services/auth.service', () => ({
  authService: { login: vi.fn() },
}));

// Récupère les inputs sans s'appuyer sur l'association label/input
// (FormField n'utilise pas htmlFor donc getByLabelText ne fonctionne pas)
function getInputs() {
  const email = document.querySelector('input[type="email"]') as HTMLInputElement;
  const password = document.querySelector('input[type="password"]') as HTMLInputElement;
  return { email, password };
}

function renderLogin() {
  return render(<MemoryRouter><Login /></MemoryRouter>);
}

describe('Login (intégration)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('affiche le titre et les deux champs', () => {
    renderLogin();
    expect(screen.getByRole('heading', { name: /login to yoga studio/i })).toBeInTheDocument();
    const { email, password } = getInputs();
    expect(email).toBeInTheDocument();
    expect(password).toBeInTheDocument();
  });

  it('soumet le formulaire et redirige vers /sessions en cas de succès', async () => {
    vi.mocked(authService.login).mockResolvedValue({
      id: 1, email: 'a@b.c', firstName: 'A', lastName: 'B', admin: false, token: 't',
    });
    const user = userEvent.setup();

    renderLogin();
    const { email, password } = getInputs();
    await user.type(email, 'a@b.c');
    await user.type(password, 'secret');
    await user.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => expect(authService.login).toHaveBeenCalledWith({
      email: 'a@b.c', password: 'secret',
    }));
    expect(mockNavigate).toHaveBeenCalledWith('/sessions');
  });

  it('affiche le message d\'erreur retourné par l\'API en cas d\'échec', async () => {
    const err = new AxiosError('fail');
    err.response = {
      data: { message: 'Bad credentials' },
      status: 401, statusText: 'err', headers: {}, config: {} as any,
    };
    vi.mocked(authService.login).mockRejectedValue(err);
    const user = userEvent.setup();

    renderLogin();
    const { email, password } = getInputs();
    await user.type(email, 'a@b.c');
    await user.type(password, 'wrong');
    await user.click(screen.getByRole('button', { name: /login/i }));

    expect(await screen.findByText('Bad credentials')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('affiche le fallback "Login failed" quand l\'erreur n\'est pas axios', async () => {
    vi.mocked(authService.login).mockRejectedValue(new Error('boom'));
    const user = userEvent.setup();

    renderLogin();
    const { email, password } = getInputs();
    await user.type(email, 'a@b.c');
    await user.type(password, 'pwd');
    await user.click(screen.getByRole('button', { name: /login/i }));

    expect(await screen.findByText('Login failed')).toBeInTheDocument();
  });
});
