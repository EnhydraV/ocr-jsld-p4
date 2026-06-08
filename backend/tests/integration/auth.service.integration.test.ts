import {afterAll, beforeEach, describe, expect, it} from 'vitest';
import * as bcrypt from 'bcrypt';
import prisma from '../../src/utils/prisma';
import {AuthService} from '../../src/services/auth.service';
import {verifyToken} from '../../src/utils/jwt.util';
import {resetDb} from './db-utils';


const service = new AuthService();

const REGISTER_BODY = {
    email: 'victor@yoga.com',
    password: 'azerty#123',
    firstName: 'Victor',
    lastName: 'Pille',
};

beforeEach(resetDb);
afterAll(async () => {
    await prisma.$disconnect();
});

describe('AuthService (integration)', () => {
    describe('register', () => {
        it('should persist the user with a real bcrypt hash (never the plaintext)', async () => {
            await service.register(REGISTER_BODY);

            const stored = await prisma.user.findUniqueOrThrow({where: {email: REGISTER_BODY.email}});
            expect(stored.password).not.toBe(REGISTER_BODY.password); // jamais en clair
            expect(await bcrypt.compare(REGISTER_BODY.password, stored.password)).toBe(true);
            expect(stored.admin).toBe(false);
        });

        it('should return the auth response and a valid token', async () => {
            const res = await service.register(REGISTER_BODY);

            expect(res).toMatchObject({email: REGISTER_BODY.email, firstName: 'Victor', admin: false});
            expect(res).not.toHaveProperty('password');
            expect(verifyToken(res.token)).toMatchObject({userId: res.id});
        });

        it('should throw 400 on a duplicate email and persist only one user', async () => {
            await service.register(REGISTER_BODY);

            await expect(service.register(REGISTER_BODY)).rejects.toMatchObject({
                statusCode: 400,
                message: 'Email already exists',
            });
            expect(await prisma.user.count()).toBe(1);
        });

        it('should throw 400 on an invalid body before touching the DB', async () => {
            await expect(
                service.register({...REGISTER_BODY, password: 'court'}),
            ).rejects.toMatchObject({statusCode: 400});
            expect(await prisma.user.count()).toBe(0);
        });
    });

    describe('login', () => {
        beforeEach(async () => {
            await service.register(REGISTER_BODY);
        });

        it('should return the auth response on valid credentials', async () => {
            const res = await service.login({email: REGISTER_BODY.email, password: REGISTER_BODY.password});

            expect(res).toMatchObject({email: REGISTER_BODY.email, admin: false});
            expect(verifyToken(res.token)).toMatchObject({userId: res.id});
        });

        it('should throw 401 on a wrong password', async () => {
            await expect(
                service.login({email: REGISTER_BODY.email, password: 'wrongpassword'}),
            ).rejects.toMatchObject({statusCode: 401, message: 'Invalid credentials'});
        });

        it('should throw 401 on an unknown email', async () => {
            await expect(
                service.login({email: 'ghost@yoga.com', password: REGISTER_BODY.password}),
            ).rejects.toMatchObject({statusCode: 401, message: 'Invalid credentials'});
        });
    });
});
