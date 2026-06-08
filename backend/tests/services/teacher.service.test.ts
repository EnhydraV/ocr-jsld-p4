import {describe, it, vi,expect} from 'vitest';
import {TeacherService} from '../../src/services/teacher.service';
import prisma from '../utils/__mocks__/prisma';
import {toTeacherResponse} from "../../src/utils/teacher.util";

const TEACHER = {
    id: 14,
    firstName: 'Charlie',
    lastName: 'Zthérone',
    createdAt: new Date('2026-05-06'),
    updatedAt: new Date('2026-05-07'),
};

const TEACHER_2 = {
    id: 15,
    firstName: 'Oscar',
    lastName: 'Izé',
    createdAt: new Date('2026-06-06'),
    updatedAt: new Date('2026-06-07'),
}

vi.mock('../../src/utils/prisma', async () => await import('../utils/__mocks__/prisma'));

describe('TeacherService', () => {
    const teacherService = new TeacherService();


    describe('getAll', () => {
        it('should return an empty array when no teacher exists', async () => {
            prisma.teacher.findMany.mockResolvedValue([]);
            const response = await teacherService.getAll();
            expect(response).toStrictEqual([]);
        });
        it('should return the list of teacher responses', async () => {
            prisma.teacher.findMany.mockResolvedValue([TEACHER_2, TEACHER]);
            const response = await teacherService.getAll();
            expect(response).toStrictEqual([TEACHER_2, TEACHER].map(toTeacherResponse));
            expect(prisma.teacher.findMany).toHaveBeenCalledWith({orderBy:{ createdAt: 'desc' },})
        });

    });

    describe('getById', () => {
        it('should return the teacher response when the teacher exists', async () => {
            prisma.teacher.findUnique.mockResolvedValue(TEACHER);
            const response = await teacherService.getById(TEACHER.id);
            expect(response).toStrictEqual(toTeacherResponse(TEACHER));
            expect(prisma.teacher.findUnique).toHaveBeenCalledWith({where: {id: TEACHER.id}});
        });
        it('should throw 404 when the teacher does not exist', async () => {
            prisma.teacher.findUnique.mockResolvedValue(null);
            await expect(teacherService.getById(TEACHER.id)).rejects.toMatchObject({
                statusCode: 404,
                message: 'Teacher not found',
            });
        });
    });
});