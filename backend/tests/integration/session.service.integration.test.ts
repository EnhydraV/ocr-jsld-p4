import {afterAll, beforeEach, describe, expect, it} from 'vitest';
import prisma from '../../src/utils/prisma';
import {SessionService} from '../../src/services/session.service';
import {resetDb, seedAdmin, seedSession, seedTeacher, seedUser} from './db-utils';

// Service réel contre une vraie base : on vérifie ce que les mocks ne peuvent PAS
// voir — la justesse de l'`include` (un include faux passe silencieusement un mock),
// le mapping `toSessionResponse` contre de vraies relations, les FK et la dédup.
// Cf. NOTES_PERSO 10.8.

const service = new SessionService();

beforeEach(resetDb);
afterAll(async () => {
    await prisma.$disconnect();
});

describe('SessionService (integration)', () => {
    describe('getById / getAll — include + toSessionResponse', () => {
        it('should map teacher and participant ids from the real relations', async () => {
            // C'est LE test que le mock ne sait pas faire : l'include charge teacher +
            // participants.user, et le mapping doit ressortir users: [ids].
            const teacher = await seedTeacher();
            const session = await seedSession(teacher.id);
            const charlie = await seedUser('charlie@yoga.com');
            const juliette = await seedUser('juliette@yoga.com');
            await prisma.sessionParticipation.createMany({
                data: [
                    {sessionId: session.id, userId: charlie.id},
                    {sessionId: session.id, userId: juliette.id},
                ],
            });

            const res = await service.getById(session.id);

            expect(res.teacher).toEqual({
                id: teacher.id,
                firstName: teacher.firstName,
                lastName: teacher.lastName,
            });
            expect(res.users.sort()).toEqual([charlie.id, juliette.id].sort());
            expect(res).not.toHaveProperty('participants'); // forme DTO, pas la forme Prisma
        });

        it('should return an empty users array for a session without participants', async () => {
            const teacher = await seedTeacher();
            const session = await seedSession(teacher.id);

            const res = await service.getById(session.id);

            expect(res.users).toEqual([]);
        });

        it('should throw 404 when the session does not exist', async () => {
            await expect(service.getById(999)).rejects.toMatchObject({statusCode: 404});
        });

        it('getAll should return every session mapped', async () => {
            const teacher = await seedTeacher();
            await seedSession(teacher.id);
            await seedSession(teacher.id);

            const res = await service.getAll();

            expect(res).toHaveLength(2);
            expect(res.every((s) => s.teacher.id === teacher.id)).toBe(true);
        });
    });

    describe('create — admin gate + teacher FK', () => {
        const body = (teacherId: number) => ({
            name: 'Yoga doux',
            date: '2026-07-01',
            description: 'Une session',
            teacherId,
        });

        it('should persist a session and return it with an empty users array (admin)', async () => {
            const admin = await seedAdmin();
            const teacher = await seedTeacher();

            const res = await service.create(body(teacher.id), admin.id);

            expect(res.users).toEqual([]);
            expect(res.teacher.id).toBe(teacher.id);
            expect(res.date.toISOString().startsWith('2026-07-01')).toBe(true);
            expect(await prisma.session.count()).toBe(1);
        });

        it('should throw 403 for a non-admin and persist nothing', async () => {
            const user = await seedUser();
            const teacher = await seedTeacher();

            await expect(service.create(body(teacher.id), user.id)).rejects.toMatchObject({
                statusCode: 403,
            });
            expect(await prisma.session.count()).toBe(0);
        });

        it('should throw 404 when the teacher does not exist', async () => {
            const admin = await seedAdmin();

            await expect(service.create(body(999), admin.id)).rejects.toMatchObject({
                statusCode: 404,
                message: 'Teacher not found',
            });
            expect(await prisma.session.count()).toBe(0);
        });

        it('should throw 400 on an invalid body before touching the DB', async () => {
            const admin = await seedAdmin();

            await expect(service.create({name: 'x'}, admin.id)).rejects.toMatchObject({
                statusCode: 400,
            });
            expect(await prisma.session.count()).toBe(0);
        });
    });

    describe('update — partial update + teacher FK', () => {
        it('should update only the provided fields', async () => {
            const admin = await seedAdmin();
            const teacher = await seedTeacher();
            const session = await seedSession(teacher.id);

            const res = await service.update(session.id, {name: 'Renommée'}, admin.id);

            expect(res.name).toBe('Renommée');
            expect(res.description).toBe(session.description); // inchangé
        });

        it('should throw 404 when the new teacherId does not exist', async () => {
            const admin = await seedAdmin();
            const teacher = await seedTeacher();
            const session = await seedSession(teacher.id);

            await expect(
                service.update(session.id, {teacherId: 999}, admin.id),
            ).rejects.toMatchObject({statusCode: 404, message: 'Teacher not found'});
        });

        it('should throw 403 for a non-admin', async () => {
            const user = await seedUser();
            const teacher = await seedTeacher();
            const session = await seedSession(teacher.id);

            await expect(
                service.update(session.id, {name: 'Renommée'}, user.id),
            ).rejects.toMatchObject({statusCode: 403});
        });
    });

    describe('delete — admin gate + cascade', () => {
        it('should delete the session and cascade its participations', async () => {
            const admin = await seedAdmin();
            const teacher = await seedTeacher();
            const session = await seedSession(teacher.id);
            const user = await seedUser();
            await prisma.sessionParticipation.create({
                data: {sessionId: session.id, userId: user.id},
            });

            await service.delete(session.id, admin.id);

            expect(await prisma.session.count()).toBe(0);
            expect(await prisma.sessionParticipation.count()).toBe(0); // cascade
            expect(await prisma.user.count()).toBe(2); // admin + user survivent
        });

        it('should throw 403 for a non-admin and keep the session', async () => {
            const user = await seedUser();
            const teacher = await seedTeacher();
            const session = await seedSession(teacher.id);

            await expect(service.delete(session.id, user.id)).rejects.toMatchObject({
                statusCode: 403,
            });
            expect(await prisma.session.count()).toBe(1);
        });
    });

    describe('participate / unparticipate', () => {
        it('should add a participation', async () => {
            const teacher = await seedTeacher();
            const session = await seedSession(teacher.id);
            const user = await seedUser();

            await service.participate(session.id, user.id);

            expect(await prisma.sessionParticipation.count()).toBe(1);
        });

        it('should throw 400 on a duplicate participation', async () => {
            const teacher = await seedTeacher();
            const session = await seedSession(teacher.id);
            const user = await seedUser();
            await service.participate(session.id, user.id);

            await expect(service.participate(session.id, user.id)).rejects.toMatchObject({
                statusCode: 400,
                message: 'User already participating in this session',
            });
            expect(await prisma.sessionParticipation.count()).toBe(1);
        });

        it('should throw 404 participating in a missing session', async () => {
            const user = await seedUser();
            await expect(service.participate(999, user.id)).rejects.toMatchObject({
                statusCode: 404,
                message: 'Session not found',
            });
        });

        it('should remove a participation', async () => {
            const teacher = await seedTeacher();
            const session = await seedSession(teacher.id);
            const user = await seedUser();
            await service.participate(session.id, user.id);

            await service.unparticipate(session.id, user.id);

            expect(await prisma.sessionParticipation.count()).toBe(0);
        });

        it('should throw 404 unparticipating without an existing participation', async () => {
            const teacher = await seedTeacher();
            const session = await seedSession(teacher.id);
            const user = await seedUser();

            await expect(service.unparticipate(session.id, user.id)).rejects.toMatchObject({
                statusCode: 404,
                message: 'Participation not found',
            });
        });
    });
});
