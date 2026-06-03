import {describe, it, expect, vi, beforeEach} from 'vitest';
import {sessionService} from './session.service';
import api from './api';

vi.mock('./api', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
    },
}));

const TOKEN = 'tok-123456789';
const AUTH = {headers: {Authorization: 'Bearer '+TOKEN}};
const USER_ID = 42;
const SESSION_ID = 7;

describe('sessionService.getSessions', () => {
    beforeEach(() => vi.clearAllMocks());

    it('GET /session with authorization token and abort signal', async () => {
        const sessions = [{id: 1, name: 'Yoga du matin', date: '', description: '', teacher: {} as any, users: []}];
        vi.mocked(api.get).mockResolvedValue({data: sessions});
        const signal = new AbortController().signal;

        const result = await sessionService.getSessions(TOKEN, signal);

        expect(api.get).toHaveBeenCalledWith('/session', {...AUTH, signal});
        expect(result).toEqual(sessions);
    });
});

describe('sessionService.getSession', () => {
    beforeEach(() => vi.clearAllMocks());

    it('GET /session/:id', async () => {
        const session = {id: SESSION_ID, name: 'Yoga du matin', date: '', description: '', teacher: {} as any, users: []};
        vi.mocked(api.get).mockResolvedValue({data: session});

        const result = await sessionService.getSession(TOKEN, SESSION_ID);

        expect(api.get).toHaveBeenCalledWith('/session/' + SESSION_ID, {...AUTH, signal: undefined});
        expect(result).toEqual(session);
    });
});

describe('sessionService.createSession', () => {
    beforeEach(() => vi.clearAllMocks());

    it('POST /session with form payload', async () => {
        vi.mocked(api.post).mockResolvedValue({});
        const data = {name: 'Yoga du matin', date: '2026-01-01', description: 'desc', teacherId: 3};

        await sessionService.createSession(TOKEN, data);

        expect(api.post).toHaveBeenCalledWith('/session', data, AUTH);
    });
});

describe('sessionService.updateSession', () => {
    beforeEach(() => vi.clearAllMocks());

    it('PUT /session/:id with form payload', async () => {
        vi.mocked(api.put).mockResolvedValue({});
        const data = {name: 'Yoga du matin', date: '2026-01-01', description: 'desc', teacherId: 3};

        await sessionService.updateSession(TOKEN, SESSION_ID, data);

        expect(api.put).toHaveBeenCalledWith('/session/' + SESSION_ID, data, AUTH);
    });
});

describe('sessionService.deleteSession', () => {
    beforeEach(() => vi.clearAllMocks());

    it('DELETE /session/:id', async () => {
        vi.mocked(api.delete).mockResolvedValue({});

        await sessionService.deleteSession(TOKEN, SESSION_ID);

        expect(api.delete).toHaveBeenCalledWith('/session/' + SESSION_ID, AUTH);
    });
});

describe('sessionService.participate / unparticipate', () => {
    beforeEach(() => vi.clearAllMocks());

    it('POST on /session/:sid/participate/:uid', async () => {
        vi.mocked(api.post).mockResolvedValue({});

        await sessionService.participate(TOKEN, SESSION_ID, USER_ID);

        expect(api.post).toHaveBeenCalledWith('/session/' + SESSION_ID + '/participate/' + USER_ID, {}, AUTH);
    });

    it('DELETE on /session/:sid/participate/:uid', async () => {
        vi.mocked(api.delete).mockResolvedValue({});

        await sessionService.unparticipate(TOKEN, SESSION_ID, USER_ID);

        expect(api.delete).toHaveBeenCalledWith('/session/' + SESSION_ID + '/participate/' + USER_ID, AUTH);
    });
});
