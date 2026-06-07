import { AppError } from '../errors/AppError';
import { TeacherResponse } from '../dto/teacher.dto';
import { toTeacherResponse } from '../utils/teacher.util';
import prisma from '../utils/prisma';

export class TeacherService {
    async getAll(): Promise<TeacherResponse[]> {
        const teachers = await prisma.teacher.findMany({
            orderBy: { createdAt: 'desc' },
        });
        return teachers.map(toTeacherResponse);
    }

    async getById(id: number): Promise<TeacherResponse> {
        const teacher = await prisma.teacher.findUnique({ where: { id } });
        if (!teacher) {
            throw new AppError(404, 'Teacher not found');
        }
        return toTeacherResponse(teacher);
    }
}
