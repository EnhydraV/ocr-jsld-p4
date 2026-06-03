import { describe, it, expect, vi, beforeEach } from 'vitest';
import { teacherService } from './teacher.service';
import api from './api';

vi.mock('./api', () => ({
  default: { get: vi.fn() },
}));

const TOKEN = 'tok-123456789';
const AUTH = { headers: { Authorization: 'Bearer '+TOKEN } };

describe('teacherService.getTeachers', () => {
  beforeEach(() => vi.clearAllMocks());

  it('GET /teacher with the Authorization header and signal', async () => {
    const teachers = [{ id: 3, firstName: 'Charlie', lastName: 'Zterone' }];
    vi.mocked(api.get).mockResolvedValue({ data: teachers });
    const signal = new AbortController().signal;

    const result = await teacherService.getTeachers(TOKEN, signal);

    expect(api.get).toHaveBeenCalledWith('/teacher', { ...AUTH, signal });
    expect(result).toEqual(teachers);
  });

  it('works without an abort signal', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });

    await teacherService.getTeachers(TOKEN);

    expect(api.get).toHaveBeenCalledWith('/teacher', { ...AUTH, signal: undefined });
  });
});
