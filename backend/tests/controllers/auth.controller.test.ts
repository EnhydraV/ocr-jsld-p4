import {beforeEach, describe, it, vi, expect} from 'vitest';
import {createTestApp} from '../utils/test-app';
import {AuthService} from '../../src/services/auth.service';
import supertest from "supertest";
import {AppError} from "../../src/errors/AppError";
import {LoginSchema, RegisterSchema} from "../../src/dto/auth.dto";

vi.mock('../../src/utils/prisma', async () => await import('../utils/__mocks__/prisma'));

const app = createTestApp();

const loginSpy = vi.spyOn(AuthService.prototype, 'login');
const registerSpy = vi.spyOn(AuthService.prototype, 'register');
// Rend console.error silencieux pour tests erreur 500
const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {
});

describe('AuthController', () => {
    beforeEach(() => {
        vi.clearAllMocks();

    });

    const USER = {
        id: 1, email: 'victor@yoga.com', firstName: 'Victor', lastName: 'Pille',
        admin: false, token: 'tok-123456789',
    }
    const PASSWORD = 'azerty#123'

    // Valider les données utilisées dans les tests pour provoquer une erreur avant le test
    // si le schéma est durci
    const VALID_LOGIN_BODY = LoginSchema.parse({
        email: USER.email,
        password: PASSWORD,
    });

    const VALID_REGISTER_BODY = RegisterSchema.parse({
        email: USER.email,
        password: PASSWORD,
        firstName: USER.firstName,
        lastName: USER.lastName,
    });


    // Routes publiques : pas de authMiddleware, donc pas de cas 401 "no token"
    describe('POST /api/auth/login', () => {
        it('should return code 200 and the auth response on login', async () => {
            loginSpy.mockResolvedValue(USER);
            const body = VALID_LOGIN_BODY;
            const response = await supertest(app).post("/api/auth/login").send(body);
            expect(response.status).toBe(200);
            expect(response.body).toStrictEqual(USER);
            expect(loginSpy).toHaveBeenCalledWith(body);

        });

        it('should return error 401', async () => {
            const error = new AppError(401, 'Invalid credentials');
            loginSpy.mockRejectedValue(error);
            const body = {email: USER.email, password: PASSWORD};
            const response = await supertest(app).post("/api/auth/login").send(body);
            expect(response.status).toBe(error.statusCode);
            expect(response.body).toStrictEqual({message: error.message});
            expect(loginSpy).toHaveBeenCalledWith(body);
        });

        it('should return 500 on an unexpected error', async () => {
            // Erreur "inattendue" (pas un AppError) : doit passer par next(err)
            // et tomber dans errorHandler avec une réponse générique.
            const error = new Error('Erreur chien tête en bas');
            loginSpy.mockRejectedValue(error);
            const body = {email: USER.email, password: PASSWORD};
            const response = await supertest(app).post("/api/auth/login").send(body);
            expect(response.status).toBe(500);
            expect(response.body).toStrictEqual({
                error: {code: 'INTERNAL_ERROR', message: 'Une erreur interne est survenue'},
            });
            expect(response.body.error.message).not.toBe(error.message); // pas de fuite
            expect(loginSpy).toHaveBeenCalledWith(body);
            expect(consoleErrorSpy).toHaveBeenCalledWith(error);
        });
    });

    describe('POST /api/auth/register', () => {
        it('should return 201 with the auth response on register', async () => {
            registerSpy.mockResolvedValue(USER);
            const response = await supertest(app).post("/api/auth/register").send(VALID_REGISTER_BODY);
            expect(response.status).toBe(201);
            expect(response.body).toStrictEqual(USER);
            expect(registerSpy).toHaveBeenCalledWith(VALID_REGISTER_BODY);

        });
        it('should return 400', async () => {
            const error = new AppError(400, 'Email already exists');
            registerSpy.mockRejectedValue(error);
            const response = await supertest(app).post("/api/auth/register").send(VALID_REGISTER_BODY);
            expect(response.status).toBe(error.statusCode);
            expect(response.body).toStrictEqual({message: error.message});
            expect(registerSpy).toHaveBeenCalledWith(VALID_REGISTER_BODY);
        });
    });
});
