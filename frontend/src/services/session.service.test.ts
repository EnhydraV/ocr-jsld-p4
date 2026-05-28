import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sessionService } from './session.service';
import api from './api';

vi.mock('./api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const TOKEN = 'tok-xyz';
const AUTH = { headers: { Authorization: 'Bearer tok-xyz' } };

describe('sessionService.getSessions', () => {
  beforeEach(() => vi.clearAllMocks());

  it('GET /session avec entête Authorization et signal', async () => {
    const sessions = [{ id: 1, name: 'Yoga', date: '', description: '', teacher: {} as any, users: [] }];
    vi.mocked(api.get).mockResolvedValue({ data: sessions });
    const signal = new AbortController().signal;

    const result = await sessionService.getSessions(TOKEN, signal);

    expect(api.get).toHaveBeenCalledWith('/session', { ...AUTH, signal });
    expect(result).toEqual(sessions);
  });
});

describe('sessionService.getSession', () => {
  beforeEach(() => vi.clearAllMocks());

  it('GET /session/:id', async () => {
    const session = { id: 7, name: 'Yoga', date: '', description: '', teacher: {} as any, users: [] };
    vi.mocked(api.get).mockResolvedValue({ data: session });

    const result = await sessionService.getSession(TOKEN, 7);

    expect(api.get).toHaveBeenCalledWith('/session/7', { ...AUTH, signal: undefined });
    expect(result).toEqual(session);
  });
});

describe('sessionService.createSession', () => {
  beforeEach(() => vi.clearAllMocks());

  it('POST /session avec le payload du formulaire', async () => {
    vi.mocked(api.post).mockResolvedValue({});
    const data = { name: 'Yoga', date: '2026-01-01', description: 'desc', teacherId: 3 };

    await sessionService.createSession(TOKEN, data);

    expect(api.post).toHaveBeenCalledWith('/session', data, AUTH);
  });
});

describe('sessionService.updateSession', () => {
  beforeEach(() => vi.clearAllMocks());

  it('PUT /session/:id avec le payload', async () => {
    vi.mocked(api.put).mockResolvedValue({});
    const data = { name: 'Yoga', date: '2026-01-01', description: 'desc', teacherId: 3 };

    await sessionService.updateSession(TOKEN, 7, data);

    expect(api.put).toHaveBeenCalledWith('/session/7', data, AUTH);
  });
});

describe('sessionService.deleteSession', () => {
  beforeEach(() => vi.clearAllMocks());

  it('DELETE /session/:id', async () => {
    vi.mocked(api.delete).mockResolvedValue({});

    await sessionService.deleteSession(TOKEN, 7);

    expect(api.delete).toHaveBeenCalledWith('/session/7', AUTH);
  });
});

describe('sessionService.participate / unparticipate', () => {
  beforeEach(() => vi.clearAllMocks());

  it('POST sur /session/:sid/participate/:uid', async () => {
    vi.mocked(api.post).mockResolvedValue({});

    await sessionService.participate(TOKEN, 7, 42);

    expect(api.post).toHaveBeenCalledWith('/session/7/participate/42', {}, AUTH);
  });

  it('DELETE sur /session/:sid/participate/:uid', async () => {
    vi.mocked(api.delete).mockResolvedValue({});

    await sessionService.unparticipate(TOKEN, 7, 42);

    expect(api.delete).toHaveBeenCalledWith('/session/7/participate/42', AUTH);
  });
});
