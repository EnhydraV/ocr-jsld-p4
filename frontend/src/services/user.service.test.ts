import {describe, it, expect, vi, beforeEach} from 'vitest';
import {userService} from './user.service';
import api from './api';

vi.mock('./api', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
        delete: vi.fn(),
    },
}));

const TOKEN = 'tok-123456789';
const AUTH = {headers: {Authorization: 'Bearer ' + TOKEN}};

const mockUser = {id: 1, email: 'victor@yoga.com', firstName: 'Victor', lastName: 'Pille'};

describe('userService.getUser', () => {
    beforeEach(() => vi.clearAllMocks());

    it('GET /user/:id', async () => {
        const user = {...mockUser, admin: false};
        vi.mocked(api.get).mockResolvedValue({data: user});

        const result = await userService.getUser(TOKEN, user.id);

        expect(api.get).toHaveBeenCalledWith('/user/' + user.id, {...AUTH, signal: undefined});
        expect(result).toEqual(user);
    });

    it('forwards the abort signal', async () => {
        vi.mocked(api.get).mockResolvedValue({data: {}});
        const signal = new AbortController().signal;

        await userService.getUser(TOKEN, mockUser.id, signal);

        expect(api.get).toHaveBeenCalledWith('/user/' + mockUser.id, {...AUTH, signal});
    });
});

describe('userService.deleteUser', () => {
    beforeEach(() => vi.clearAllMocks());

    it('DELETE /user/:id', async () => {
        vi.mocked(api.delete).mockResolvedValue({});

        await userService.deleteUser(TOKEN, mockUser.id);

        expect(api.delete).toHaveBeenCalledWith('/user/' + mockUser.id, AUTH);
    });
});

describe('userService.promoteAdmin', () => {
    beforeEach(() => vi.clearAllMocks());

    it('POST /user/promote-admin with an empty body', async () => {
        const promoted = {...mockUser, admin: true};
        vi.mocked(api.post).mockResolvedValue({data: promoted});

        const result = await userService.promoteAdmin(TOKEN);

        expect(api.post).toHaveBeenCalledWith('/user/promote-admin', {}, AUTH);
        expect(result).toEqual(promoted);
    });
});
