import {afterAll, beforeEach, describe, expect, it} from 'vitest';
import prisma from '../../src/utils/prisma';
import {TeacherService} from '../../src/services/teacher.service';
import {resetDb} from './db-utils';


const service = new TeacherService();

beforeEach(resetDb);
afterAll(async () => {
    await prisma.$disconnect();
});

describe('TeacherService (integration)', () => {
    describe('getAll', () => {
        it('should return an empty array when there is no teacher', async () => {
            expect(await service.getAll()).toEqual([]);
        });

        it('should order teachers by creation date, newest first', async () => {
            const old = await prisma.teacher.create({
                data: {firstName: 'Charlie', lastName: 'Zthérone', createdAt: new Date('2026-01-01')},
            });
            const recent = await prisma.teacher.create({
                data: {firstName: 'Oscar', lastName: 'Izé', createdAt: new Date('2026-06-01')},
            });
            const res = await service.getAll();
            expect(res.map((t) => t.id)).toEqual([recent.id, old.id]);
        });

        it('should map exactly the DTO fields (no Prisma leak)', async () => {
            const teacher = await prisma.teacher.create({
                data: {firstName: 'Charlie', lastName: 'Zthérone'},
            });
            const [res] = await service.getAll();
            expect(res).toStrictEqual({
                id: teacher.id,
                firstName: 'Charlie',
                lastName: 'Zthérone',
                createdAt: teacher.createdAt,
                updatedAt: teacher.updatedAt,
            });
        });
    });

    describe('getById', () => {
        it('should return the teacher when it exists', async () => {
            const teacher = await prisma.teacher.create({
                data: {firstName: 'Charlie', lastName: 'Zthérone'},
            });
            const res = await service.getById(teacher.id);
            expect(res.id).toBe(teacher.id);
            expect(res.firstName).toBe('Charlie');
        });

        it('should throw 404 when the teacher does not exist', async () => {
            await expect(service.getById(13)).rejects.toMatchObject({
                statusCode: 404,
                message: 'Teacher not found',
            });
        });
    });
});
