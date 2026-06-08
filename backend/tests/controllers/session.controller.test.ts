import {beforeEach, describe, expect, it, vi} from 'vitest';
import {createTestApp} from '../utils/test-app';
import {serialized} from '../utils/serialize';
import {SessionService} from '../../src/services/session.service';
import {verifyToken} from '../../src/utils/jwt.util';
import {AppError} from '../../src/errors/AppError';
import {SessionResponse} from '../../src/dto/session.dto';
import supertest from "supertest";

vi.mock('../../src/utils/prisma', async () => await import('../utils/__mocks__/prisma'));
vi.mock('../../src/utils/jwt.util', () => ({
    verifyToken: vi.fn(),
    generateToken: vi.fn(),
}));


const app = createTestApp();
const USER_ID = 13;
const TOKEN = 'tok-1234567890';
const AUTH_HEADER = ['Authorization', 'Bearer ' + TOKEN] as const;

const SESSION: SessionResponse = {
    id: 1,
    name: 'Session 1',
    date: new Date('2026-06-10'),
    description: 'Description 1',
    teacher: {id: 2, firstName: 'Charlie', lastName: 'Ztherone'},
    users: [1, 3, 5],
    createdAt: new Date('2026-06-01'),
    updatedAt: new Date('2026-06-01'),
};

const PARTICIPANT_ID = 25;

const getAllSpy = vi.spyOn(SessionService.prototype, 'getAll');
const getByIdSpy = vi.spyOn(SessionService.prototype, 'getById');
const createSpy = vi.spyOn(SessionService.prototype, 'create');
const updateSpy = vi.spyOn(SessionService.prototype, 'update');
const deleteSpy = vi.spyOn(SessionService.prototype, 'delete');
const participateSpy = vi.spyOn(SessionService.prototype, 'participate');
const unparticipateSpy = vi.spyOn(SessionService.prototype, 'unparticipate');

// Le mapping générique des erreurs est testé dans tests/middleware/errorHandler.test.ts.
// On garde ici UN test de bout en bout (getById) qui prouve que asyncHandler forwarde
// bien un rejet async du service vers le errorHandler.

describe('SessionController', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Par défaut : requête authentifiée en tant que USER_ID
        vi.mocked(verifyToken).mockReturnValue({userId: USER_ID});
    });

    describe('GET /api/session', () => {
        it('should return 401 when no token is provided', async () => {
            const response = await supertest(app).get('/api/session');
            expect(response.status).toBe(401);
            expect(getAllSpy).not.toHaveBeenCalled();
        });

        it('should return 200 with the session list', async () => {
            getAllSpy.mockResolvedValue([SESSION]);
            const response = await supertest(app).get('/api/session').set(...AUTH_HEADER);
            expect(response.status).toBe(200);
            expect(response.body).toStrictEqual(serialized([SESSION]));
        });
    });

    describe('GET /api/session/:id', () => {
        it('should return 400 when the id is not a number', async () => {
            const response = await supertest(app).get('/api/session/notanumber').set(...AUTH_HEADER);
            expect(response.status).toBe(400);
            expect(response.body).toMatchObject({message: 'Invalid session ID'});
            expect(getByIdSpy).not.toHaveBeenCalled();
        });

        it('should map an AppError from the service to its status code', async () => {
            getByIdSpy.mockRejectedValue(new AppError(404, 'Session not found'));
            const response = await supertest(app).get('/api/session/' + SESSION.id).set(...AUTH_HEADER);
            expect(response.status).toBe(404);
            expect(response.body).toMatchObject({message: 'Session not found'});
            expect(getByIdSpy).toHaveBeenCalledWith(SESSION.id);
        });

    });

    describe('POST /api/session', () => {
        it('should return 201 and pass the body and authenticated userId to the service', async () => {
            createSpy.mockResolvedValue(SESSION);
            const body = {
                name: SESSION.name,
                date: '2026-01-05',
                description: SESSION.description,
                teacherId: SESSION.teacher.id
            };
            const response = await supertest(app).post('/api/session').set(...AUTH_HEADER).send(body);
            expect(response.status).toBe(201);
            expect(response.body).toStrictEqual(serialized(SESSION));
            expect(createSpy).toHaveBeenCalledWith(body,USER_ID);
        });
    });

    describe('PUT /api/session/:id', () => {
        it('should return 400 when the id is not a number', async () => {
            const response = await supertest(app).put('/api/session/notanumber').set(...AUTH_HEADER);
            expect(response.status).toBe(400);
            expect(response.body).toMatchObject({message: 'Invalid session ID'});
            expect(updateSpy).not.toHaveBeenCalled();
        });
        it('should return 200 and pass id, body and userId to the service', async () => {
            updateSpy.mockResolvedValue(SESSION);
            const body = {name: SESSION.name, description: SESSION.description};
            const response = await supertest(app).put('/api/session/' + SESSION.id).set(...AUTH_HEADER).send(body);
            expect(response.status).toBe(200);
            expect(response.body).toStrictEqual(serialized(SESSION));
            expect(updateSpy).toHaveBeenCalledWith(SESSION.id, body, USER_ID);
        });
    });

    describe('DELETE /api/session/:id', () => {
        it('should return 400 when the id is not a number', async () => {
            const response = await supertest(app).delete('/api/session/notanumber').set(...AUTH_HEADER);
            expect(response.status).toBe(400);
            expect(response.body).toMatchObject({message: 'Invalid session ID'});
            expect(deleteSpy).not.toHaveBeenCalled();
        });
        it('should return 200 with a confirmation message', async () => {
            deleteSpy.mockResolvedValue();
            const response = await supertest(app).delete('/api/session/' + SESSION.id).set(...AUTH_HEADER);
            expect(response.status).toBe(200);
            expect(response.body).toMatchObject({message: 'Session deleted successfully'});
            expect(deleteSpy).toHaveBeenCalledWith(SESSION.id, USER_ID);
        });
    });

    describe('POST /api/session/:id/participate/:userId', () => {
        it('should return 400 when the session id is not a number', async () => {
            const response = await supertest(app).post('/api/session/notanumber/participate/' + USER_ID).set(...AUTH_HEADER);
            expect(response.status).toBe(400);
            expect(response.body).toMatchObject({message: 'Invalid session ID'});
            expect(participateSpy).not.toHaveBeenCalled();
        });
        it('should return 400 when the user id is not a number', async () => {
            const response = await supertest(app).post('/api/session/' + SESSION.id + '/participate/notanumber').set(...AUTH_HEADER);
            expect(response.status).toBe(400);
            expect(response.body).toMatchObject({message: 'Invalid user ID'});
            expect(participateSpy).not.toHaveBeenCalled();
        });
        it('should return 200 with a confirmation message', async () => {
            participateSpy.mockResolvedValue();
            const response = await supertest(app).post('/api/session/' + SESSION.id + '/participate/' + PARTICIPANT_ID).set(...AUTH_HEADER);
            expect(response.status).toBe(200);
            expect(response.body).toMatchObject({message: 'Successfully joined the session'});
            expect(participateSpy).toHaveBeenCalledWith(SESSION.id, PARTICIPANT_ID);
        });
    });

    describe('DELETE /api/session/:id/participate/:userId', () => {
        it('should return 400 when the session id is not a number', async () => {
            const response = await supertest(app).delete('/api/session/notanumber/participate/' + PARTICIPANT_ID).set(...AUTH_HEADER);
            expect(response.status).toBe(400);
            expect(response.body).toMatchObject({message: 'Invalid session ID'});
            expect(unparticipateSpy).not.toHaveBeenCalled();
        });
        it('should return 400 when the user id is not a number', async () => {
            const response = await supertest(app).delete('/api/session/' + SESSION.id + '/participate/notanumber').set(...AUTH_HEADER);
            expect(response.status).toBe(400);
            expect(response.body).toMatchObject({message: 'Invalid user ID'});
            expect(unparticipateSpy).not.toHaveBeenCalled();
        });
        it('should return 200 with a confirmation message', async () => {
            unparticipateSpy.mockResolvedValue();
            const response = await supertest(app).delete('/api/session/' + SESSION.id + '/participate/' + PARTICIPANT_ID).set(...AUTH_HEADER);
            expect(response.status).toBe(200);
            expect(response.body).toMatchObject({message: 'Successfully left the session'});
            expect(unparticipateSpy).toHaveBeenCalledWith(SESSION.id, PARTICIPANT_ID);
        });
    });
});
