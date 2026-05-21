import { AppError } from '../errors/AppError';
import prisma from '../utils/prisma';

const toUserResponse = (user: any) => ({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    admin: user.admin,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
});

export class UserService {
    async getById(id: number) {
        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) {
            throw new AppError(404, 'User not found');
        }
        return toUserResponse(user);
    }

    async delete(id: number, requesterId: number) {
        if (requesterId !== id) {
            throw new AppError(403, 'You can only delete your own account');
        }

        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) {
            throw new AppError(404, 'User not found');
        }

        await prisma.user.delete({ where: { id } });
    }

    async promoteSelfToAdmin(userId: number) {
        const isDev = (process.env.NODE_ENV || 'development') === 'development';
        if (!isDev) {
            throw new AppError(403, 'Admin self-promotion is only available in development');
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new AppError(404, 'User not found');
        }

        if (user.admin) {
            return toUserResponse(user);
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { admin: true },
        });

        return toUserResponse(updatedUser);
    }
}
