import {beforeEach, afterEach, describe, expect, it, vi} from 'vitest';
import {UserService} from '../../src/services/user.service';
import {toUserResponse} from '../../src/utils/user.util';
import prisma from '../utils/__mocks__/prisma';

vi.mock('../../src/utils/prisma', async () => await import('../utils/__mocks__/prisma'));


describe('UserService', () => {
    const USER = {
        id: 1,
        email: 'victor@yoga.com',
        password: 'azerty#123',
        firstName: "Victor",
        lastName: "Pille",
        admin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
    }
    const REQUESTER_ID=USER.id;

    const userService = new UserService();

    describe('getById', () => {
        it('should throw 403 when requesterId is not the user to read', async () => {
            await expect(userService.getById(USER.id, USER.id + 1)).rejects.toMatchObject({
                statusCode: 403,
                message: 'You can only read your own account'
            });
            expect(prisma.user.findUnique).not.toHaveBeenCalled();
        });

        it('should return the user response when the user exists', async () => {
            prisma.user.findUnique.mockResolvedValue(USER);
            const res = await userService.getById(USER.id,REQUESTER_ID);
            expect(res).toStrictEqual(toUserResponse(USER));
        });
        it('should throw 404 when the user does not exist', async () => {
            prisma.user.findUnique.mockResolvedValue(null);
            await expect(userService.getById(USER.id,REQUESTER_ID)).rejects.toMatchObject({
                statusCode: 404,
                message: "User not found"
            });
        });
    });

    describe('delete', () => {
        it('should throw 403 when requesterId is not the user to delete', async () => {
            await expect(userService.delete(USER.id, USER.id + 1)).rejects.toMatchObject({
                statusCode: 403,
                message: 'You can only delete your own account'
            });
            expect(prisma.user.delete).not.toHaveBeenCalled();
        });

        it('should throw 404 when the user does not exist', async () => {
            prisma.user.findUnique.mockResolvedValue(null);
            await expect(userService.delete(USER.id, REQUESTER_ID)).rejects.toMatchObject({
                statusCode: 404,
                message: "User not found"
            });
            expect(prisma.user.delete).not.toHaveBeenCalled();
        });

        it('should call the delete in db when requesterId matches and user exists', async () => {
            prisma.user.findUnique.mockResolvedValue(USER);
            await userService.delete(USER.id, REQUESTER_ID);
            expect(prisma.user.delete).toHaveBeenCalledWith({where: {id: USER.id}});
        });
    });

    describe('promoteSelfToAdmin', () => {
        beforeEach(() => {
            vi.stubEnv('NODE_ENV', 'development');
        });
        afterEach(() => {
            vi.unstubAllEnvs();
        })

        it('should throw 403 when NODE_ENV is not development', async () => {
            vi.stubEnv('NODE_ENV', 'production');
            await expect(userService.promoteSelfToAdmin(USER.id)).rejects.toMatchObject({
                statusCode: 403,
                message: 'Admin self-promotion is only available in development'
            });
            expect(prisma.user.update).not.toHaveBeenCalled();
        });
        it('should throw 404 when the user does not exist', async () => {
            prisma.user.findUnique.mockResolvedValue(null);
            await expect(userService.promoteSelfToAdmin(USER.id)).rejects.toMatchObject({
                statusCode: 404,
                message: "User not found"
            });
            expect(prisma.user.update).not.toHaveBeenCalled();
        });
        it('should return the same user when already admin', async () => {
            const adminUser = {...USER, admin: true};
            prisma.user.findUnique.mockResolvedValue(adminUser);
            const response = await userService.promoteSelfToAdmin(adminUser.id);
            expect(response).toStrictEqual(toUserResponse(adminUser));
            expect(prisma.user.update).not.toHaveBeenCalled();
        });
        it('should update the user to admin and return the updated response', async () => {
            const adminUser = {...USER, admin: true};
            prisma.user.findUnique.mockResolvedValue(USER);
            prisma.user.update.mockResolvedValue(adminUser);
            const response = await userService.promoteSelfToAdmin(adminUser.id);
            expect(response).toStrictEqual(toUserResponse(adminUser));
            expect(prisma.user.update).toHaveBeenCalledWith({where: {id: USER.id}, data: {admin: true}});
        });
    });
});