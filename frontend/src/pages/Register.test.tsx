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

const registerData = {
  email: 'victor@yoga.com', password: 'Azerty#0', firstName: 'Victor', lastName: 'Pille',
};

const mockAuthResponse = {
  id: 1, email: registerData.email, firstName: registerData.firstName,
  lastName: registerData.lastName, admin: false, token: 'tok-123456789',
};

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

describe('Register (integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays the title and the 4 fields', () => {
    renderRegister();
    expect(screen.getByRole('heading', { name: /register for yoga studio/i })).toBeInTheDocument();
    const { firstName, lastName, email, password } = getInputs();
    expect(firstName).toBeInTheDocument();
    expect(lastName).toBeInTheDocument();
    expect(email).toBeInTheDocument();
    expect(password).toBeInTheDocument();
  });

  it('submits the form and redirects to /sessions on success', async () => {
    vi.mocked(authService.register).mockResolvedValue(mockAuthResponse);
    const user = userEvent.setup();

    renderRegister();
    const { firstName, lastName, email, password } = getInputs();
    await user.type(firstName, registerData.firstName);
    await user.type(lastName, registerData.lastName);
    await user.type(email, registerData.email);
    await user.type(password, registerData.password);
    await user.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => expect(authService.register).toHaveBeenCalledWith(registerData));
    expect(mockNavigate).toHaveBeenCalledWith('/sessions');
  });

  it('displays the error message returned by the API on failure', async () => {
    const err = new AxiosError('fail');
    err.response = {
      data: { message: 'Email already taken' },
      status: 409, statusText: 'err', headers: {}, config: {} as any,
    };
    vi.mocked(authService.register).mockRejectedValue(err);
    const user = userEvent.setup();

    renderRegister();
    const { firstName, lastName, email, password } = getInputs();
    await user.type(firstName, registerData.firstName);
    await user.type(lastName, registerData.lastName);
    await user.type(email, registerData.email);
    await user.type(password, registerData.password);
    await user.click(screen.getByRole('button', { name: /register/i }));

    expect(await screen.findByText('Email already taken')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('displays the "Registration failed" fallback when the error is not axios', async () => {
    vi.mocked(authService.register).mockRejectedValue(new Error('boom'));
    const user = userEvent.setup();

    renderRegister();
    const { firstName, lastName, email, password } = getInputs();
    await user.type(firstName, registerData.firstName);
    await user.type(lastName, registerData.lastName);
    await user.type(email, registerData.email);
    await user.type(password, registerData.password);
    await user.click(screen.getByRole('button', { name: /register/i }));

    expect(await screen.findByText('Registration failed')).toBeInTheDocument();
  });
});
