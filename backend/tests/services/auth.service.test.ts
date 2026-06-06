import {beforeEach, describe, expect, it, vi} from "vitest";
import {AuthService} from "../../src/services/auth.service";
import prisma from "../utils/__mocks__/prisma";
import * as bcrypt from 'bcrypt';
import {LoginSchema, RegisterSchema} from "../../src/dto/auth.dto";
import {generateToken} from "../../src/utils/jwt.util";

vi.mock('../../src/utils/prisma', async () => await import('../utils/__mocks__/prisma'));
vi.mock('../../src/utils/jwt.util');

describe('AuthService', async () => {
    const authService = new AuthService();
    const mockedGenerateToken = vi.mocked(generateToken)
    beforeEach(() => {
        mockedGenerateToken.mockClear();
    })

    const PASSWORD = 'azerty123#'
    const WRONG_PASSWORD = '12345678';
    const HASHED_PASSWORD = await bcrypt.hash(PASSWORD, 4);
    const USER = {
        id: 1,
        email: 'victor@yoga.com',
        password: PASSWORD,
        firstName: "Victor",
        lastName: "Pille",
        admin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
    }
    const TOKEN = 'tok-1234567890';
    const EXPECTED_AUTH_RESPONSE = {
        id: USER.id,
        email: USER.email,
        firstName: USER.firstName,
        lastName: USER.lastName,
        admin: USER.admin,
        token: TOKEN,
    };


    // Valider les données utilisées dans les tests pour provoquer une erreur avant le test
    // si le schéma est durci
    const VALID_LOGIN_BODY = LoginSchema.parse({
        email: USER.email,
        password: USER.password,
    });

    const VALID_REGISTER_BODY = RegisterSchema.parse({
        email: USER.email,
        password: USER.password,
        firstName: USER.firstName,
        lastName: USER.lastName,
    });

    describe('login', () => {
        it('should return invalid credentials when email not exists', async () => {
            prisma.user.findUnique.mockResolvedValue(null);
            await expect(authService.login({
                email: 'unknown@yoga.com',
                'password': PASSWORD
            })).rejects.toMatchObject({statusCode: 401, message: 'Invalid credentials'});
        });
        it('should return invalid credentials when password is wrong', async () => {
            prisma.user.findUnique.mockResolvedValue({...USER, password: HASHED_PASSWORD});
            await expect(authService.login({
                email: USER.email,
                'password': WRONG_PASSWORD
            })).rejects.toMatchObject({statusCode: 401, message: 'Invalid credentials'});
        });
        it('should return user response when login is ok', async () => {
            prisma.user.findUnique.mockResolvedValue({...USER, password: HASHED_PASSWORD});
            mockedGenerateToken.mockReturnValue(TOKEN);

            const res = await authService.login(VALID_LOGIN_BODY);
            expect(res).toMatchObject(EXPECTED_AUTH_RESPONSE);
            expect(mockedGenerateToken).toHaveBeenCalledWith(USER.id)
            expect(res).not.toHaveProperty('password');
        });
    });

    describe('register', () => {
        it('should return an error when the email already exists', async () => {
            prisma.user.findUnique.mockResolvedValue({...USER, password: HASHED_PASSWORD});

            await expect(authService.register(VALID_REGISTER_BODY)).rejects.toMatchObject({
                statusCode: 400,
                message: 'Email already exists'
            });
        });
        it('should return user response when register is ok', async () => {
            prisma.user.findUnique.mockResolvedValue(null);
            prisma.user.create.mockResolvedValue({...USER, password: HASHED_PASSWORD})
            mockedGenerateToken.mockReturnValue(TOKEN);
            const res = await authService.register(VALID_REGISTER_BODY);
            expect(mockedGenerateToken).toHaveBeenCalledWith(USER.id)
            expect(res).toMatchObject(EXPECTED_AUTH_RESPONSE);
            expect(res).not.toHaveProperty('password');
        });
    })


})