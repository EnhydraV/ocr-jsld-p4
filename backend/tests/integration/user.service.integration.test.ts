import {afterAll, afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import prisma from '../../src/utils/prisma';
import {UserService} from '../../src/services/user.service';
import {resetDb, seedSession, seedTeacher, seedUser} from './db-utils';

const service = new UserService();

beforeEach(resetDb);
afterAll(async () => {
    await prisma.$disconnect();
});

describe('UserService (integration)', () => {
    describe('getById', () => {
        it('should return the own profile without the password', async () => {
            const user = await seedUser();
            const res = await service.getById(user.id, user.id);

            expect(res).not.toHaveProperty('password');
            expect(res.email).toBe(user.email);
        });

        it('should throw 403 when reading someone else profile', async () => {
            const user = await seedUser();
            await expect(service.getById(user.id, user.id + 1)).rejects.toMatchObject({
                statusCode: 403,
            });
        });

        it('should throw 404 when reading own but missing id', async () => {
            await expect(service.getById(999, 999)).rejects.toMatchObject({statusCode: 404});
        });
    });

    describe('delete', () => {
        it('should delete own account and cascade participations, keeping the session', async () => {
            const user = await seedUser();
            const session = await seedSession((await seedTeacher()).id);
            await prisma.sessionParticipation.create({data: {sessionId: session.id, userId: user.id}});

            await service.delete(user.id, user.id);

            expect(await prisma.user.count()).toBe(0);
            expect(await prisma.sessionParticipation.count()).toBe(0); // cascade
            expect(await prisma.session.count()).toBe(1); // la session reste
        });

        it('should throw 403 when deleting someone else account and keep the user', async () => {
            const user = await seedUser();

            await expect(service.delete(user.id, user.id + 1)).rejects.toMatchObject({
                statusCode: 403,
            });
            expect(await prisma.user.count()).toBe(1);
        });
    });

    describe('promoteSelfToAdmin', () => {
        beforeEach(() => {
            vi.stubEnv('NODE_ENV', 'development'); // chemin nominal
        });
        afterEach(() => {
            vi.unstubAllEnvs();
        });

        it('should promote a regular user in development and persist it', async () => {
            const user = await seedUser();
            const res = await service.promoteSelfToAdmin(user.id);
            expect(res.admin).toBe(true);
            const stored = await prisma.user.findUniqueOrThrow({where: {id: user.id}});
            expect(stored.admin).toBe(true);
        });

        it('should leave an already-admin user untouched', async () => {
            const admin = await seedUser('admin@yoga.com', true);
            const res = await service.promoteSelfToAdmin(admin.id);
            expect(res.admin).toBe(true);
        });

        it('should throw 403 outside development', async () => {
            vi.stubEnv('NODE_ENV', 'production'); // écrase le beforeEach
            const user = await seedUser();
            await expect(service.promoteSelfToAdmin(user.id)).rejects.toMatchObject({
                statusCode: 403,
            });
            const stored = await prisma.user.findUniqueOrThrow({where: {id: user.id}});
            expect(stored.admin).toBe(false); // rien promu
        });

        it('should throw 404 when the user does not exist', async () => {
            await expect(service.promoteSelfToAdmin(13)).rejects.toMatchObject({statusCode: 404});
        });
    });
});
