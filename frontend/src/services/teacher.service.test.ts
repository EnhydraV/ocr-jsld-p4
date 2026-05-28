import { describe, it, expect, vi, beforeEach } from 'vitest';
import { teacherService } from './teacher.service';
import api from './api';

vi.mock('./api', () => ({
  default: { get: vi.fn() },
}));

const TOKEN = 'tok-xyz';
const AUTH = { headers: { Authorization: 'Bearer tok-xyz' } };

describe('teacherService.getTeachers', () => {
  beforeEach(() => vi.clearAllMocks());

  it('GET /teacher avec entête Authorization et signal', async () => {
    const teachers = [{ id: 1, firstName: 'Alice', lastName: 'Doe' }];
    vi.mocked(api.get).mockResolvedValue({ data: teachers });
    const signal = new AbortController().signal;

    const result = await teacherService.getTeachers(TOKEN, signal);

    expect(api.get).toHaveBeenCalledWith('/teacher', { ...AUTH, signal });
    expect(result).toEqual(teachers);
  });

  it('fonctionne sans signal d\'abort', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });

    await teacherService.getTeachers(TOKEN);

    expect(api.get).toHaveBeenCalledWith('/teacher', { ...AUTH, signal: undefined });
  });
});
