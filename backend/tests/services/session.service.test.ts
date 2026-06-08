import {describe, expect, it, vi} from 'vitest';
import {SessionService} from '../../src/services/session.service';
import prisma from '../utils/__mocks__/prisma';
import {CreateSessionSchema, SessionResponse, UpdateSessionSchema} from "../../src/dto/session.dto";
import {SessionWithRelations, toSessionResponse} from "../../src/utils/session.util";

vi.mock('../../src/utils/prisma', async () => await import('../utils/__mocks__/prisma'));

const toPrismaSession = (s: SessionResponse) =>
    ({
        ...s,
        teacherId: s.teacher.id,
        participants: s.users.map((id) => ({user: {id}})),
    }) as unknown as SessionWithRelations;


// Fixture canonique : un SessionResponse (la forme exposée par l'API), source de vérité.
const SESSION: SessionResponse = {
    id: 1,
    name: "Session 1",
    date: new Date('2026-06-10'),
    description: "Description 1",
    teacher: {id: 2, firstName: "Charlie", lastName: "Zthérone"},
    users: [1, 3],
    createdAt: new Date('2026-06-05'),
    updatedAt: new Date('2026-06-08'),
};

const CREATE_SESSION = {
    name: SESSION.name,
    date: '2026-06-10',
    description: SESSION.description,
    teacherId: SESSION.teacher.id
};

const UPDATE_SESSION = {...CREATE_SESSION, name: 'new name'}

const VALID_CREATE_BODY = CreateSessionSchema.parse(CREATE_SESSION);
const VALID_UPDATE_BODY = UpdateSessionSchema.parse(UPDATE_SESSION);

const REQUESTER = {
    id: 1,
    firstName: 'Victor',
    lastName: 'Pille',
    email: 'victor@yoga.com',
    password: 'hashedpassword',
    admin: true,
    createdAt: new Date('2026-06-05'),
    updatedAt: new Date('2026-06-08'),
};

const PARTICIPANT_ID = 13;
const PARTICIPANT = {...REQUESTER, admin: false, id: PARTICIPANT_ID};

describe('SessionService', () => {
    const sessionService = new SessionService();

    describe('getAll', () => {
        it('should return an empty array when no session exists', async () => {
            prisma.session.findMany.mockResolvedValue([]);
            const res = await sessionService.getAll();
            expect(res).toStrictEqual([]);
        });
        it('should return the list of session responses with teacher and participants', async () => {
            prisma.session.findMany.mockResolvedValue([toPrismaSession(SESSION)]);
            const res = await sessionService.getAll();
            expect(res).toStrictEqual([SESSION]);
        });
    });

    describe('getById', () => {
        it('should return the session response when the session exists', async () => {
            prisma.session.findUnique.mockResolvedValue(toPrismaSession(SESSION));
            const res = await sessionService.getById(SESSION.id);
            expect(res).toStrictEqual(SESSION);
        });
        it('should throw 404 when the session does not exist', async () => {
            prisma.session.findUnique.mockResolvedValue(null);
            await expect(sessionService.getById(SESSION.id)).rejects.toMatchObject({
                statusCode: 404,
                message: 'Session not found'
            });
        });
    });

    describe('create', () => {
        it('should throw 400 when the body is invalid', async () => {
            const invalid_create_body = {name: 'a'}
            await expect(sessionService.create(invalid_create_body, REQUESTER.id)).rejects.toMatchObject({statusCode: 400});
            expect(prisma.session.create).not.toHaveBeenCalled();
        });
        it('should throw 403 when the requester is not admin', async () => {
            const nonAdminRequester = {...REQUESTER, admin: false};
            prisma.user.findUnique.mockResolvedValue(nonAdminRequester);
            await expect(sessionService.create(VALID_CREATE_BODY, nonAdminRequester.id)).rejects.toMatchObject({
                statusCode: 403,
                message: 'Admin access required'
            });
        });
        it('should throw 404 when the teacher does not exist', async () => {
            prisma.user.findUnique.mockResolvedValue(REQUESTER);
            prisma.teacher.findUnique.mockResolvedValue(null);
            await expect(sessionService.create(VALID_CREATE_BODY, REQUESTER.id)).rejects.toMatchObject({
                statusCode: 404,
                message: 'Teacher not found'
            });
        });
        it('should create the session and return the response with empty users', async () => {
            prisma.user.findUnique.mockResolvedValue(REQUESTER);
            prisma.teacher.findUnique.mockResolvedValue({
                ...SESSION.teacher,
                createdAt: new Date('2026-06-05'),
                updatedAt: new Date('2026-06-08'),
            });

            const prismaSession = toPrismaSession({...SESSION, users: []});
            prisma.session.create.mockResolvedValue(prismaSession);
            const response = await sessionService.create(VALID_CREATE_BODY, REQUESTER.id);
            expect(prisma.session.create).toHaveBeenCalledWith({
                data: {
                    name: VALID_CREATE_BODY.name,
                    date: new Date(VALID_CREATE_BODY.date),
                    description: VALID_CREATE_BODY.description,
                    teacherId: VALID_CREATE_BODY.teacherId
                },
                include: {teacher: true, participants: true},
            });
            expect(response).toStrictEqual(toSessionResponse(prismaSession));
        });


    });

    describe('update', () => {
        it('should throw 400 when the body is invalid', async () => {
            const invalid_update_body = {name: 'a'}
            await expect(sessionService.update(SESSION.id, invalid_update_body, REQUESTER.id)).rejects.toMatchObject({statusCode: 400});
            expect(prisma.session.update).not.toHaveBeenCalled();
        });
        it('should throw 403 when the requester is not admin', async () => {
            const nonAdminRequester = {...REQUESTER, admin: false};
            prisma.user.findUnique.mockResolvedValue(nonAdminRequester);
            await expect(sessionService.update(SESSION.id, VALID_UPDATE_BODY, nonAdminRequester.id)).rejects.toMatchObject({
                statusCode: 403,
                message: 'Admin access required'
            });
        });
        it('should throw 404 when the session does not exist', async () => {
            prisma.user.findUnique.mockResolvedValue(REQUESTER);
            prisma.session.findUnique.mockResolvedValue(null);
            await expect(sessionService.update(SESSION.id, VALID_UPDATE_BODY, REQUESTER.id)).rejects.toMatchObject({
                statusCode: 404,
                message: 'Session not found'
            });
        });
        it('should throw 404 when the teacher does not exist', async () => {
            prisma.user.findUnique.mockResolvedValue(REQUESTER);
            prisma.session.findUnique.mockResolvedValue(toPrismaSession(SESSION));
            prisma.teacher.findUnique.mockResolvedValue(null);
            await expect(sessionService.update(SESSION.id, VALID_UPDATE_BODY, REQUESTER.id)).rejects.toMatchObject({
                statusCode: 404,
                message: 'Teacher not found'
            });

        });

        it('should update only provided fields and return the session response', async () => {
            prisma.user.findUnique.mockResolvedValue(REQUESTER);
            prisma.session.findUnique.mockResolvedValue(toPrismaSession(SESSION));
            prisma.teacher.findUnique.mockResolvedValue({
                ...SESSION.teacher,
                createdAt: new Date('2026-06-05'),
                updatedAt: new Date('2026-06-08'),
            });
            const prismaSession = toPrismaSession({...SESSION, users: []});
            prisma.session.update.mockResolvedValue(prismaSession);
            const response = await sessionService.update(SESSION.id, VALID_UPDATE_BODY, REQUESTER.id);
            expect(prisma.session.update).toHaveBeenCalledWith({
                where: {id: SESSION.id},
                data: {
                    name: VALID_UPDATE_BODY.name,
                    date: new Date(CREATE_SESSION.date),
                    description: VALID_UPDATE_BODY.description,
                    teacherId: VALID_UPDATE_BODY.teacherId
                },
                include: {
                    teacher: true,
                    participants: {include: {user: true}},
                },
            });
            expect(response).toStrictEqual(toSessionResponse(prismaSession));
        });
    });

    describe('delete', () => {
        it('should throw 403 when the requester is not admin', async () => {
            const nonAdminRequester = {...REQUESTER, admin: false};
            prisma.user.findUnique.mockResolvedValue(nonAdminRequester);
            await expect(sessionService.delete(SESSION.id, nonAdminRequester.id)).rejects.toMatchObject({
                statusCode: 403,
                message: 'Admin access required'
            });
            expect(prisma.session.delete).not.toHaveBeenCalled();
        });
        it('should throw 404 when the session does not exist', async () => {

            prisma.user.findUnique.mockResolvedValue(REQUESTER);
            prisma.session.findUnique.mockResolvedValue(null);
            await expect(sessionService.delete(SESSION.id, REQUESTER.id)).rejects.toMatchObject({
                statusCode: 404,
                message: 'Session not found'
            });
        });
        it('should call prisma.session.delete when admin and session exists', async () => {
            prisma.user.findUnique.mockResolvedValue(REQUESTER);
            prisma.session.findUnique.mockResolvedValue(toPrismaSession(SESSION));
            await sessionService.delete(SESSION.id, REQUESTER.id);
            expect(prisma.session.delete).toHaveBeenCalledWith({where: {id: SESSION.id}});
        });
    });

    describe('participate', () => {
        it('should throw 404 when the session does not exist', async () => {
            prisma.session.findUnique.mockResolvedValue(null);
            await expect(sessionService.participate(SESSION.id, PARTICIPANT_ID)).rejects.toMatchObject({
                statusCode: 404,
                message: 'Session not found'
            });
        });
        it('should throw 404 when the user does not exist', async () => {
            prisma.session.findUnique.mockResolvedValue(toPrismaSession(SESSION));
            prisma.user.findUnique.mockResolvedValue(null);
            await expect(sessionService.participate(SESSION.id, PARTICIPANT_ID)).rejects.toMatchObject({
                statusCode: 404,
                message: 'User not found'
            });
        });
        it('should throw 400 when the user is already participating', async () => {
            prisma.session.findUnique.mockResolvedValue(toPrismaSession(SESSION));
            prisma.user.findUnique.mockResolvedValue(PARTICIPANT);
            prisma.sessionParticipation.findUnique.mockResolvedValue({sessionId: SESSION.id, userId: PARTICIPANT_ID});
            await expect(sessionService.participate(SESSION.id, PARTICIPANT_ID)).rejects.toMatchObject({
                statusCode: 400,
                message: 'User already participating in this session'
            });
            expect(prisma.sessionParticipation.create).not.toHaveBeenCalled();

        });
        it('should create the participation otherwise', async () => {
            prisma.session.findUnique.mockResolvedValue(toPrismaSession(SESSION));
            prisma.user.findUnique.mockResolvedValue(PARTICIPANT);
            prisma.sessionParticipation.findUnique.mockResolvedValue(null);
            await sessionService.participate(SESSION.id, PARTICIPANT_ID);
            expect(prisma.sessionParticipation.create).toHaveBeenCalledWith({
                data: {
                    sessionId: SESSION.id,
                    userId: PARTICIPANT_ID
                }
            });
        });
    });

    describe('unparticipate', () => {
        it('should throw 404 when the participation does not exist', async () => {
            prisma.sessionParticipation.findUnique.mockResolvedValue(null);
            await expect(sessionService.unparticipate(SESSION.id, PARTICIPANT_ID)).rejects.toMatchObject({
                statusCode: 404,
                message: 'Participation not found'
            });
        });
        it('should delete the participation otherwise', async () => {
            prisma.sessionParticipation.findUnique.mockResolvedValue({sessionId: SESSION.id, userId: PARTICIPANT_ID});
            await sessionService.unparticipate(SESSION.id, PARTICIPANT_ID);
            expect(prisma.sessionParticipation.delete).toHaveBeenCalledWith({
                where: {
                    sessionId_userId: {
                        sessionId: SESSION.id,
                        userId: PARTICIPANT_ID
                    }
                }
            });
        });


    });
});