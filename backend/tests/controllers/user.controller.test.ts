import {beforeEach, describe, expect, it, vi} from 'vitest';
import {createTestApp} from '../utils/test-app';
import {serialized} from '../utils/serialize';
import {verifyToken} from '../../src/utils/jwt.util';
import supertest from "supertest";
import {UserService} from "../../src/services/user.service";

vi.mock('../../src/utils/prisma', async () => await import('../utils/__mocks__/prisma'));
vi.mock('../../src/utils/jwt.util', () => ({
    verifyToken: vi.fn(),
    generateToken: vi.fn(),
}));
const getByIdSpy = vi.spyOn(UserService.prototype, 'getById');
const deleteSpy = vi.spyOn(UserService.prototype, 'delete');
const promoteSpy = vi.spyOn(UserService.prototype, 'promoteSelfToAdmin');

// Le mapping des erreurs (AppError → statut, erreur inattendue → 500) est testé
// une seule fois dans tests/middleware/errorHandler.test.ts.

const app = createTestApp();
const USER = {
    id: 1,
    email: 'victor@yoga.com',
    firstName: 'Victor',
    lastName: 'Pille',
    admin: false,
    createdAt: new Date('2026-06-06'),
    updatedAt: new Date('2026-06-06'),
}
const REQUESTER_ID = 13;
const TOKEN = 'tok-1234567890';
const AUTH_HEADER = ['Authorization', 'Bearer ' + TOKEN] as const;


describe('UserController', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(verifyToken).mockReturnValue({userId: REQUESTER_ID});
    });

    describe('GET /api/user/:id', () => {
        it('should return 401 when no token is provided', async () => {
            const response = await supertest(app).get('/api/user/' + USER.id);
            expect(response.status).toBe(401);
            expect(response.body).toMatchObject({message: 'No token provided'});
            expect(getByIdSpy).not.toHaveBeenCalled();
        });
        it('should return 400 when the id is not a number', async () => {
            const response = await supertest(app).get('/api/user/notanumber').set(...AUTH_HEADER);
            expect(response.status).toBe(400);
            expect(response.body).toMatchObject({message: 'Invalid user ID'});
            expect(getByIdSpy).not.toHaveBeenCalled();
        });
        it('should return 200 with the user', async () => {
            getByIdSpy.mockResolvedValue(USER);
            const response = await supertest(app).get('/api/user/' + USER.id).set(...AUTH_HEADER);
            expect(response.status).toBe(200);
            expect(response.body).toStrictEqual(serialized(USER));
            expect(getByIdSpy).toHaveBeenCalledWith(USER.id,REQUESTER_ID)
        });
    });

    describe('POST /api/user/promote-admin', () => {
        it('should return 401 when no token is provided', async () => {
            const response = await supertest(app).post('/api/user/promote-admin');
            expect(response.status).toBe(401);
            expect(response.body).toMatchObject({message: 'No token provided'});
            expect(promoteSpy).not.toHaveBeenCalled();
        });

        it('should promote the authenticated user', async () => {
            const promotedUser = {...USER, admin: true};
            promoteSpy.mockResolvedValue(promotedUser);
            const response = await supertest(app).post('/api/user/promote-admin').set(...AUTH_HEADER);
            expect(response.status).toBe(200);
            expect(response.body).toStrictEqual(serialized(promotedUser));
            expect(promoteSpy).toHaveBeenCalledWith(REQUESTER_ID);
        });
    });

    describe('DELETE /api/user/:id', () => {
        it('should return 401 when no token is provided', async () => {
            const response = await supertest(app).delete('/api/user/' + USER.id);
            expect(response.status).toBe(401);
            expect(response.body).toMatchObject({message: 'No token provided'});
            expect(deleteSpy).not.toHaveBeenCalled();
        });

        it('should return error 400 if user id is not a number', async () => {
            const response = await supertest(app).delete('/api/user/notanumber').set(...AUTH_HEADER);
            expect(response.status).toBe(400);
            expect(response.body).toMatchObject({message: 'Invalid user ID'});
            expect(deleteSpy).not.toHaveBeenCalled();
        })
        it('should return 200 with a confirmation message', async () => {
            deleteSpy.mockResolvedValue(undefined);
            const response = await supertest(app).delete('/api/user/' + USER.id).set(...AUTH_HEADER);
            expect(response.status).toBe(200);
            expect(response.body).toMatchObject({message: 'User deleted successfully'});
            expect(deleteSpy).toHaveBeenCalledWith(USER.id, REQUESTER_ID);
        });
    });
});
