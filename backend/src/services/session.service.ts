import { Prisma } from '@prisma/client';
import { CreateSessionSchema, UpdateSessionSchema, type SessionResponse } from '../dto/session.dto';
import { AppError } from '../errors/AppError';
import prisma from '../utils/prisma';

// Session Prisma avec ses relations chargées (miroir de l'include des requêtes)
export type SessionWithRelations = Prisma.SessionGetPayload<{
    include: { teacher: true; participants: { include: { user: true } } };
}>;

const toSessionResponse = (session: SessionWithRelations): SessionResponse => ({
    id: session.id,
    name: session.name,
    date: session.date,
    description: session.description,
    teacher: {
        id: session.teacher.id,
        firstName: session.teacher.firstName,
        lastName: session.teacher.lastName,
    },
    users: session.participants.map((p) => p.user.id),
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
});

export class SessionService {
    async getAll() {
        const sessions = await prisma.session.findMany({
            include: {
                teacher: true,
                participants: { include: { user: true } },
            },
        });
        return sessions.map(toSessionResponse);
    }

    async getById(id: number) {
        const session = await prisma.session.findUnique({
            where: { id },
            include: {
                teacher: true,
                participants: { include: { user: true } },
            },
        });

        if (!session) {
            throw new AppError(404, 'Session not found');
        }

        return toSessionResponse(session);
    }

    async create(body: unknown, requesterId: number): Promise<SessionResponse> {
        const result = CreateSessionSchema.safeParse(body);
        if (!result.success) {
            throw new AppError(400, result.error.message);
        }
        const { name, date, description, teacherId } = result.data;

        await this.requireAdmin(requesterId);

        const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });
        if (!teacher) {
            throw new AppError(404, 'Teacher not found');
        }

        const session = await prisma.session.create({
            data: { name, date: new Date(date), description, teacherId },
            include: { teacher: true, participants: true },
        });

        return {
            id: session.id,
            name: session.name,
            date: session.date,
            description: session.description,
            teacher: {
                id: session.teacher.id,
                firstName: session.teacher.firstName,
                lastName: session.teacher.lastName,
            },
            users: [],
            createdAt: session.createdAt,
            updatedAt: session.updatedAt,
        };
    }

    async update(id: number, body: unknown, requesterId: number) {
        const result = UpdateSessionSchema.safeParse(body);
        if (!result.success) {
            throw new AppError(400, result.error.message);
        }
        const { name, date, description, teacherId } = result.data;

        await this.requireAdmin(requesterId);

        const existingSession = await prisma.session.findUnique({ where: { id } });
        if (!existingSession) {
            throw new AppError(404, 'Session not found');
        }

        const updateData: any = {};
        if (name) updateData.name = name;
        if (date) updateData.date = new Date(date);
        if (description) updateData.description = description;
        if (teacherId !== undefined) {
            const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });
            if (!teacher) {
                throw new AppError(404, 'Teacher not found');
            }
            updateData.teacherId = teacherId;
        }

        const session = await prisma.session.update({
            where: { id },
            data: updateData,
            include: {
                teacher: true,
                participants: { include: { user: true } },
            },
        });

        return toSessionResponse(session);
    }

    async delete(id: number, requesterId: number) {
        await this.requireAdmin(requesterId);

        const existingSession = await prisma.session.findUnique({ where: { id } });
        if (!existingSession) {
            throw new AppError(404, 'Session not found');
        }

        await prisma.session.delete({ where: { id } });
    }

    async participate(sessionId: number, userId: number) {
        const session = await prisma.session.findUnique({ where: { id: sessionId } });
        if (!session) {
            throw new AppError(404, 'Session not found');
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new AppError(404, 'User not found');
        }

        const existing = await prisma.sessionParticipation.findUnique({
            where: { sessionId_userId: { sessionId, userId } },
        });
        if (existing) {
            throw new AppError(400, 'User already participating in this session');
        }

        await prisma.sessionParticipation.create({ data: { sessionId, userId } });
    }

    async unparticipate(sessionId: number, userId: number) {
        const participation = await prisma.sessionParticipation.findUnique({
            where: { sessionId_userId: { sessionId, userId } },
        });
        if (!participation) {
            throw new AppError(404, 'Participation not found');
        }

        await prisma.sessionParticipation.delete({
            where: { sessionId_userId: { sessionId, userId } },
        });
    }

    private async requireAdmin(userId: number) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.admin) {
            throw new AppError(403, 'Admin access required');
        }
    }
}
