import {describe, it, expect, vi, beforeEach} from 'vitest';
import {authService} from './auth.service';
import api from './api';

vi.mock('./api', () => ({
    default: {
        post: vi.fn(),
    },
}));

const mockUser={
    id: 1,
    email: 'victor@yoga.com',
    firstName: 'Victor',
    lastName: 'Pille',
}

const mockAuthResponse = {
    ...mockUser,
    admin: false,
    token: 'tok-123456789',
};

const password = 'Azerty#0';

const loginCredentials = {
    email: mockAuthResponse.email,
    password,
};

const registerData = {
    email: mockUser.email,
    password,
    firstName: mockUser.firstName,
    lastName: mockUser.lastName,
};

const updateData = {
    firstName: 'Juliette',
    lastName: 'Michel',
}

describe('authService.login', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    it('calls /auth/login and stores token + user in localStorage', async () => {
        vi.mocked(api.post).mockResolvedValue({data: mockAuthResponse});

        const result = await authService.login(loginCredentials);

        expect(api.post).toHaveBeenCalledWith('/auth/login', loginCredentials);
        expect(localStorage.getItem('token')).toBe(mockAuthResponse.token);
        expect(JSON.parse(localStorage.getItem('user')!)).toEqual(mockAuthResponse);
        expect(result).toEqual(mockAuthResponse);
    });

    it('stores nothing when the response has no token', async () => {
        vi.mocked(api.post).mockResolvedValue({data: {...mockAuthResponse, token: ''}});

        await authService.login(loginCredentials);

        expect(localStorage.getItem('token')).toBeNull();
        expect(localStorage.getItem('user')).toBeNull();
    });
});

describe('authService.register', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    it('calls /auth/register and stores the data', async () => {
        vi.mocked(api.post).mockResolvedValue({data: mockAuthResponse});

        await authService.register(registerData);

        expect(api.post).toHaveBeenCalledWith('/auth/register', registerData);
        expect(localStorage.getItem('token')).toBe(mockAuthResponse.token);
    });
});

describe('authService.logout', () => {
    it('removes token and user from localStorage', () => {
        localStorage.setItem('token', mockAuthResponse.token);
        localStorage.setItem('user', JSON.stringify(mockAuthResponse));

        authService.logout();

        expect(localStorage.getItem('token')).toBeNull();
        expect(localStorage.getItem('user')).toBeNull();
    });
});

describe('authService.getCurrentUser', () => {
    beforeEach(() => localStorage.clear());

    it('returns the user parsed from localStorage', () => {
        localStorage.setItem('user', JSON.stringify(mockAuthResponse));
        expect(authService.getCurrentUser()).toEqual(mockAuthResponse);
    });

    it('returns null when nothing is stored', () => {
        expect(authService.getCurrentUser()).toBeNull();
    });
});

describe('authService.updateCurrentUser', () => {
    beforeEach(() => localStorage.clear());

    it('merges the updates with the current user', () => {
        localStorage.setItem('user', JSON.stringify(mockAuthResponse));

        const updated = authService.updateCurrentUser({firstName: updateData.firstName});

        expect(updated?.firstName).toBe(updateData.firstName);
        expect(updated?.lastName).toBe(mockAuthResponse.lastName);
        expect(JSON.parse(localStorage.getItem('user')!).firstName).toBe(updateData.firstName);
    });

    it('returns null when no user is logged in', () => {
        expect(authService.updateCurrentUser({firstName: updateData.firstName})).toBeNull();
    });
});

describe('authService.getToken / isAuthenticated', () => {
    beforeEach(() => localStorage.clear());

    it('getToken returns the stored value', () => {
        localStorage.setItem('token', mockAuthResponse.token);
        expect(authService.getToken()).toBe(mockAuthResponse.token);
    });

    it('isAuthenticated is true when a token exists', () => {
        localStorage.setItem('token', mockAuthResponse.token);
        expect(authService.isAuthenticated()).toBe(true);
    });

    it('isAuthenticated is false without a token', () => {
        expect(authService.isAuthenticated()).toBe(false);
    });
});
