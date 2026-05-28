import { describe, it, expect, vi, beforeEach } from 'vitest';
import { userService } from './user.service';
import api from './api';

vi.mock('./api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

const TOKEN = 'tok-xyz';
const AUTH = { headers: { Authorization: 'Bearer tok-xyz' } };

describe('userService.getUser', () => {
  beforeEach(() => vi.clearAllMocks());

  it('GET /user/:id', async () => {
    const user = { id: 7, email: 'a@b.c', firstName: 'A', lastName: 'B', admin: false };
    vi.mocked(api.get).mockResolvedValue({ data: user });

    const result = await userService.getUser(TOKEN, 7);

    expect(api.get).toHaveBeenCalledWith('/user/7', { ...AUTH, signal: undefined });
    expect(result).toEqual(user);
  });

  it('transmet le signal d\'abort', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: {} });
    const signal = new AbortController().signal;

    await userService.getUser(TOKEN, 7, signal);

    expect(api.get).toHaveBeenCalledWith('/user/7', { ...AUTH, signal });
  });
});

describe('userService.deleteUser', () => {
  beforeEach(() => vi.clearAllMocks());

  it('DELETE /user/:id', async () => {
    vi.mocked(api.delete).mockResolvedValue({});

    await userService.deleteUser(TOKEN, 7);

    expect(api.delete).toHaveBeenCalledWith('/user/7', AUTH);
  });
});

describe('userService.promoteAdmin', () => {
  beforeEach(() => vi.clearAllMocks());

  it('POST /user/promote-admin avec corps vide', async () => {
    const promoted = { id: 1, email: 'a@b.c', firstName: 'A', lastName: 'B', admin: true };
    vi.mocked(api.post).mockResolvedValue({ data: promoted });

    const result = await userService.promoteAdmin(TOKEN);

    expect(api.post).toHaveBeenCalledWith('/user/promote-admin', {}, AUTH);
    expect(result).toEqual(promoted);
  });
});
