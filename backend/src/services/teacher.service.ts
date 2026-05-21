import { AppError } from '../errors/AppError';
import prisma from '../utils/prisma';

const toTeacherResponse = (teacher: any) => ({
    id: teacher.id,
    firstName: teacher.firstName,
    lastName: teacher.lastName,
    createdAt: teacher.createdAt,
    updatedAt: teacher.updatedAt,
});

export class TeacherService {
    async getAll() {
        const teachers = await prisma.teacher.findMany({
            orderBy: { createdAt: 'desc' },
        });
        return teachers.map(toTeacherResponse);
    }

    async getById(id: number) {
        const teacher = await prisma.teacher.findUnique({ where: { id } });
        if (!teacher) {
            throw new AppError(404, 'Teacher not found');
        }
        return toTeacherResponse(teacher);
    }
}
