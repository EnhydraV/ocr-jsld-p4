import { User } from '@prisma/client';
import { UserResponse } from '../dto/user.dto';

// Met en forme l'utilisateur exposé par l'API — le password ne doit jamais passer
export const toUserResponse = (user: User): UserResponse => ({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    admin: user.admin,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
});
