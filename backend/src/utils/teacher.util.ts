import { Teacher } from '@prisma/client';
import { TeacherResponse } from '../dto/teacher.dto';

// Met en forme le teacher exposé par l'API — seul le contrat TeacherResponse sort
export const toTeacherResponse = (teacher: Teacher): TeacherResponse => ({
    id: teacher.id,
    firstName: teacher.firstName,
    lastName: teacher.lastName,
    createdAt: teacher.createdAt,
    updatedAt: teacher.updatedAt,
});
