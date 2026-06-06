import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AxiosError } from 'axios';
import Login from '../../src/pages/Login';
import { authService } from '../../src/services/auth.service';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../../src/services/auth.service', () => ({
  authService: { login: vi.fn() },
}));

const credentials = { email: 'victor@yoga.com', password: 'Azerty#0' };

const mockAuthResponse = {
  id: 1, email: credentials.email, firstName: 'Victor', lastName: 'Pille', admin: false, token: 'tok-123456789',
};

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

describe('Login (integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays the title and both fields', () => {
    renderLogin();
    expect(screen.getByRole('heading', { name: /login to yoga studio/i })).toBeInTheDocument();
    const { email, password } = getInputs();
    expect(email).toBeInTheDocument();
    expect(password).toBeInTheDocument();
  });

  it('submits the form and redirects to /sessions on success', async () => {
    vi.mocked(authService.login).mockResolvedValue(mockAuthResponse);
    const user = userEvent.setup();

    renderLogin();
    const { email, password } = getInputs();
    await user.type(email, credentials.email);
    await user.type(password, credentials.password);
    await user.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => expect(authService.login).toHaveBeenCalledWith(credentials));
    expect(mockNavigate).toHaveBeenCalledWith('/sessions');
  });

  it('displays the error message returned by the API on failure', async () => {
    const err = new AxiosError('fail');
    err.response = {
      data: { message: 'Bad credentials' },
      status: 401, statusText: 'err', headers: {}, config: {} as any,
    };
    vi.mocked(authService.login).mockRejectedValue(err);
    const user = userEvent.setup();

    renderLogin();
    const { email, password } = getInputs();
    await user.type(email, credentials.email);
    await user.type(password, credentials.password);
    await user.click(screen.getByRole('button', { name: /login/i }));

    expect(await screen.findByText('Bad credentials')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('displays the "Login failed" fallback when the error is not axios', async () => {
    vi.mocked(authService.login).mockRejectedValue(new Error('boom'));
    const user = userEvent.setup();

    renderLogin();
    const { email, password } = getInputs();
    await user.type(email, credentials.email);
    await user.type(password, credentials.password);
    await user.click(screen.getByRole('button', { name: /login/i }));

    expect(await screen.findByText('Login failed')).toBeInTheDocument();
  });
});
