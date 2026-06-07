import { AppError } from '../errors/AppError';
import { UserResponse } from '../dto/user.dto';
import { toUserResponse } from '../utils/user.util';
import prisma from '../utils/prisma';

export class UserService {
    async getById(id: number, requesterId: number): Promise<UserResponse> {
        if (requesterId !== id) {
            throw new AppError(403, 'You can only read your own account');
        }

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

    async promoteSelfToAdmin(userId: number): Promise<UserResponse> {
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
