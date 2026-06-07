import {beforeEach, describe, expect, it, vi} from 'vitest';
import {createTestApp} from '../utils/test-app';
import {serialized} from '../utils/serialize';
import {verifyToken} from '../../src/utils/jwt.util';
import supertest from "supertest";
import {UserService} from "../../src/services/user.service";
import {AppError} from "../../src/errors/AppError";

vi.mock('../../src/utils/prisma', async () => await import('../utils/__mocks__/prisma'));
vi.mock('../../src/utils/jwt.util', () => ({
    verifyToken: vi.fn(),
    generateToken: vi.fn(),
}));
const getByIdSpy = vi.spyOn(UserService.prototype, 'getById');
const deleteSpy = vi.spyOn(UserService.prototype, 'delete');
const promoteSpy = vi.spyOn(UserService.prototype, 'promoteSelfToAdmin');
const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {
});

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
const TOKEN = 'tok-1234567890'


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
            const response = await supertest(app).get('/api/user/notanumber').set({authorization: 'Bearer ' + TOKEN});
            expect(response.status).toBe(400);
            expect(response.body).toMatchObject({message: 'Invalid user ID'});
            expect(getByIdSpy).not.toHaveBeenCalled();
        });
        it('should return 200 with the user', async () => {
            getByIdSpy.mockResolvedValue(USER);
            const response = await supertest(app).get('/api/user/' + USER.id).set({authorization: 'Bearer ' + TOKEN});
            expect(response.status).toBe(200);
            expect(response.body).toStrictEqual(serialized(USER));
            expect(getByIdSpy).toHaveBeenCalledWith(USER.id,REQUESTER_ID)
        });
        it('should return the rejection details on error', async () => {
            const error = new AppError(404, 'User not found');
            getByIdSpy.mockRejectedValue(error);
            const response = await supertest(app).get('/api/user/' + USER.id).set({authorization: 'Bearer ' + TOKEN});
            expect(response.status).toBe(error.statusCode);
            expect(response.body).toMatchObject({message: error.message});
        });

        it('should return the rejection details of unexpected error', async () => {
            const error = new Error('Erreur chien tête en bas');
            getByIdSpy.mockRejectedValue(error);
            const response = await supertest(app).get('/api/user/' + USER.id).set({authorization: 'Bearer ' + TOKEN});
            expect(response.status).toBe(500);
            expect(response.body).toStrictEqual({
                error: {code: 'INTERNAL_ERROR', message: 'Une erreur interne est survenue'},
            });
            expect(response.body.error.message).not.toBe(error.message);
            expect(getByIdSpy).toHaveBeenCalled();
            expect(consoleErrorSpy).toHaveBeenCalledWith(error);
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
            const response = await supertest(app).post('/api/user/promote-admin').set({authorization: 'Bearer ' + TOKEN});
            expect(response.status).toBe(200);
            expect(response.body).toStrictEqual(serialized(promotedUser));
            expect(promoteSpy).toHaveBeenCalledWith(REQUESTER_ID);
        });

        it('should map an error if promotion fails', async () => {
            const error = new AppError(404, 'User not found');
            promoteSpy.mockRejectedValue(error);
            const response = await supertest(app).post('/api/user/promote-admin').set({authorization: 'Bearer ' + TOKEN});
            expect(response.status).toBe(error.statusCode);
            expect(response.body).toMatchObject({message: error.message});
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
            const response = await supertest(app).delete('/api/user/notanumber').set({authorization: 'Bearer ' + TOKEN});
            expect(response.status).toBe(400);
            expect(response.body).toMatchObject({message: 'Invalid user ID'});
            expect(deleteSpy).not.toHaveBeenCalled();
        })
        it('should return 200 with a confirmation message', async () => {
            deleteSpy.mockResolvedValue(undefined);
            const response = await supertest(app).delete('/api/user/' + USER.id).set({authorization: 'Bearer ' + TOKEN});
            expect(response.status).toBe(200);
            expect(response.body).toMatchObject({message: 'User deleted successfully'});
            expect(deleteSpy).toHaveBeenCalledWith(USER.id, REQUESTER_ID);
        });
        it('should return the rejection details on error', async () => {
            const error = new AppError(403, 'You can only delete your own account');
            deleteSpy.mockRejectedValue(error);
            const response = await supertest(app).delete('/api/user/' + USER.id).set({authorization: 'Bearer ' + TOKEN});
            expect(response.status).toBe(error.statusCode);
            expect(response.body).toMatchObject({message: error.message});
        });
    });
});
