import {describe, expect, it} from 'vitest';
import {SessionWithRelations, toSessionResponse} from '../../src/utils/session.util';

// Fixture typée SessionWithRelations : la forme exacte que Prisma renvoie avec
// l'include { teacher, participants: { user } }. Le typage casse à la compilation
// si l'include du service change.
const SESSION: SessionWithRelations = {
    id: 1,
    name: 'Session 1',
    date: new Date('2026-06-10'),
    description: 'Description 1',
    teacherId: 2,
    teacher: {
        id: 2,
        firstName: 'Charlie',
        lastName: 'Ztherone',
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-02'),
    },
    participants: [
        {sessionId: 1, userId: 5, user: fakeUser(5)},
        {sessionId: 1, userId: 8, user: fakeUser(8)},
    ],
    createdAt: new Date('2026-06-01'),
    updatedAt: new Date('2026-06-02'),
};

function fakeUser(id: number) {
    return {
        id,
        email: `user${id}@yoga.com`,
        password: 'hash',
        firstName: 'U',
        lastName: String(id),
        admin: false,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-02'),
    };
}

describe('toSessionResponse', () => {
    it('should map the session, the teacher (without dates) and the participant ids', () => {
        expect(toSessionResponse(SESSION)).toStrictEqual({
            id: 1,
            name: 'Session 1',
            date: SESSION.date,
            description: 'Description 1',
            teacher: {id: 2, firstName: 'Charlie', lastName: 'Ztherone'},
            users: [5, 8],
            createdAt: SESSION.createdAt,
            updatedAt: SESSION.updatedAt,
        });
    });

    it('should not leak the raw Prisma shape (participants, teacherId, user objects)', () => {
        const res = toSessionResponse(SESSION);
        expect(res).not.toHaveProperty('participants');
        expect(res).not.toHaveProperty('teacherId');
        // teacher réduit aux champs publics : pas de password/email via les users
        expect(JSON.stringify(res)).not.toContain('password');
    });

    it('should return an empty users array when there is no participant', () => {
        expect(toSessionResponse({...SESSION, participants: []}).users).toEqual([]);
    });
});
