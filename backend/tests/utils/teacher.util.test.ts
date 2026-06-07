import {describe, expect, it} from 'vitest';
import {Teacher} from '@prisma/client';
import {toTeacherResponse} from '../../src/utils/teacher.util';

// Fixture typée Teacher : suit le modèle Prisma à la compilation
const TEACHER: Teacher = {
    id: 2,
    firstName: 'Charlie',
    lastName: 'Ztherone',
    createdAt: new Date('2026-06-01'),
    updatedAt: new Date('2026-06-02'),
};

describe('toTeacherResponse', () => {
    // toStrictEqual : tout champ ajouté au modèle doit passer par le DTO en conscience
    it('should map exactly the exposed fields', () => {
        expect(toTeacherResponse(TEACHER)).toStrictEqual({
            id: TEACHER.id,
            firstName: TEACHER.firstName,
            lastName: TEACHER.lastName,
            createdAt: TEACHER.createdAt,
            updatedAt: TEACHER.updatedAt,
        });
    });
});
