import {describe, expect, it} from 'vitest';
import {User} from '@prisma/client';
import {toUserResponse} from '../../src/utils/user.util';

const USER: User = {
    id: 1,
    email: 'victor@yoga.com',
    password: 'unsecrethashé',
    firstName: 'Victor',
    lastName: 'Pille',
    admin: false,
    createdAt: new Date('2026-06-01'),
    updatedAt: new Date('2026-06-02'),
};

describe('toUserResponse', () => {
    it('should map exactly the exposed fields except password', () => {
        expect(toUserResponse(USER)).toStrictEqual({
            id: USER.id,
            email: USER.email,
            firstName: USER.firstName,
            lastName: USER.lastName,
            admin: USER.admin,
            createdAt: USER.createdAt,
            updatedAt: USER.updatedAt,
        });
        expect(toUserResponse(USER)).not.toHaveProperty('password');
    });
});
