import {afterAll, beforeEach, describe, expect, it} from 'vitest';
import prisma from '../../src/utils/prisma';
import {UserService} from '../../src/services/user.service';
import {resetDb, seedSession, seedTeacher, seedUser} from './db-utils';

beforeEach(resetDb);
afterAll(async () => {
    await prisma.$disconnect();
});

describe('DB constraints', () => {
    it('should reject a duplicate email (unique constraint)', async () => {
        await seedUser();
        await expect(seedUser()).rejects.toMatchObject({code: 'P2002'});
    });

    it('should reject a duplicate participation (composite primary key)', async () => {
        const user = await seedUser();
        const session = await seedSession((await seedTeacher()).id);
        const participation = {data: {sessionId: session.id, userId: user.id}};

        await prisma.sessionParticipation.create(participation);
        await expect(prisma.sessionParticipation.create(participation)).rejects.toMatchObject({
            code: 'P2002',
        });
    });

    it('should cascade participations when a session is deleted', async () => {
        const user = await seedUser();
        const session = await seedSession((await seedTeacher()).id);
        await prisma.sessionParticipation.create({data: {sessionId: session.id, userId: user.id}});

        await prisma.session.delete({where: {id: session.id}});

        expect(await prisma.sessionParticipation.count()).toBe(0);
        expect(await prisma.user.count()).toBe(1);
    });

    it('should cascade participations when a user deletes his account (real UserService)', async () => {
        // Service réel + base réelle : toutes les couches traversées sauf HTTP
        const user = await seedUser();
        const session = await seedSession((await seedTeacher()).id);
        await prisma.sessionParticipation.create({data: {sessionId: session.id, userId: user.id}});

        await new UserService().delete(user.id, user.id);

        expect(await prisma.user.count()).toBe(0);
        expect(await prisma.sessionParticipation.count()).toBe(0);
        // La session, elle, reste planifiée
        expect(await prisma.session.count()).toBe(1);
    });
});
