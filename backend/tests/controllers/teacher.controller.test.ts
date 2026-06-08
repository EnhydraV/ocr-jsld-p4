import {beforeEach, describe, expect, it, vi} from 'vitest';
import {createTestApp} from '../utils/test-app';
import {TeacherService} from '../../src/services/teacher.service';
import {verifyToken} from '../../src/utils/jwt.util';
import supertest from "supertest";
import {toTeacherResponse} from "../../src/utils/teacher.util";
import {serialized} from "../utils/serialize";

vi.mock('../../src/utils/prisma', async () => await import('../utils/__mocks__/prisma'));
vi.mock('../../src/utils/jwt.util', () => ({
    verifyToken: vi.fn(),
    generateToken: vi.fn(),
}));

const app = createTestApp();
const USER_ID = 13;
const TEACHER = {
    id: 14,
    firstName: 'Charlie',
    lastName: 'Zthérone',
    createdAt: new Date('2026-06-06'),
    updatedAt: new Date('2026-06-07'),
};
const TEACHER_2 = {
    id: 15,
    firstName: 'Oscar',
    lastName: 'Izé',
    createdAt: new Date('2026-06-06'),
    updatedAt: new Date('2026-06-07'),
}
const TOKEN = 'tok-1234567890';
const AUTH_HEADER = ['Authorization', 'Bearer ' + TOKEN] as const;

const getAllSpy = vi.spyOn(TeacherService.prototype, 'getAll');
const getByIdSpy = vi.spyOn(TeacherService.prototype, 'getById');

// Le mapping des erreurs (AppError → statut, erreur inattendue → 500) est testé
// une seule fois dans tests/middleware/errorHandler.test.ts.

describe('TeacherController', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(verifyToken).mockReturnValue({userId: USER_ID});
    });

    describe('GET /api/teacher', () => {
        it('should return 401 when no token is provided', async () => {
            const response = await supertest(app).get('/api/teacher');
            expect(response.status).toBe(401);
            expect(response.body).toMatchObject({message: 'No token provided'});
            expect(getAllSpy).not.toHaveBeenCalled();
        });
        it('should return 200 with the teacher list', async () => {
            const teacherList=[TEACHER, TEACHER_2].map(toTeacherResponse);
            getAllSpy.mockResolvedValue(teacherList);
            const response = await supertest(app).get('/api/teacher').set(...AUTH_HEADER);
            expect(response.status).toBe(200);
            expect(response.body).toStrictEqual(serialized(teacherList));
            expect(getAllSpy).toHaveBeenCalled();
        });
    });

    describe('GET /api/teacher/:id', () => {
        it('should return 401 when no token is provided', async () => {
            const response = await supertest(app).get('/api/teacher/' + TEACHER.id);
            expect(response.status).toBe(401);
            expect(response.body).toMatchObject({message: 'No token provided'});
            expect(getByIdSpy).not.toHaveBeenCalled();
        });

        it('should return 400 when the id is not a number', async () => {
            const response = await supertest(app).get('/api/teacher/notanumber').set(...AUTH_HEADER);
            expect(response.status).toBe(400);
            expect(response.body).toMatchObject({message: 'Invalid teacher ID'});
            expect(getByIdSpy).not.toHaveBeenCalled();
        });
        it('should return 200 with the requested teacher', async () => {
            getByIdSpy.mockResolvedValue(TEACHER);
            const response = await supertest(app).get('/api/teacher/' + TEACHER.id).set(...AUTH_HEADER);
            expect(response.status).toBe(200);
            expect(response.body).toStrictEqual(serialized(TEACHER));
            expect(getByIdSpy).toHaveBeenCalledWith(TEACHER.id);
        });
    });
});
