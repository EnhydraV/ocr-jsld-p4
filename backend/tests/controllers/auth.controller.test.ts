import {beforeEach, describe, it, vi, expect} from 'vitest';
import {createTestApp} from '../utils/test-app';
import {AuthService} from '../../src/services/auth.service';
import supertest from "supertest";
import {LoginSchema, RegisterSchema} from "../../src/dto/auth.dto";

vi.mock('../../src/utils/prisma', async () => await import('../utils/__mocks__/prisma'));

const app = createTestApp();

const loginSpy = vi.spyOn(AuthService.prototype, 'login');
const registerSpy = vi.spyOn(AuthService.prototype, 'register');

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

    // Le mapping des erreurs (AppError → statut, erreur inattendue → 500) est testé
    // une seule fois dans tests/middleware/errorHandler.test.ts.

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
    });

    describe('POST /api/auth/register', () => {
        it('should return 201 with the auth response on register', async () => {
            registerSpy.mockResolvedValue(USER);
            const response = await supertest(app).post("/api/auth/register").send(VALID_REGISTER_BODY);
            expect(response.status).toBe(201);
            expect(response.body).toStrictEqual(USER);
            expect(registerSpy).toHaveBeenCalledWith(VALID_REGISTER_BODY);

        });
    });
});
