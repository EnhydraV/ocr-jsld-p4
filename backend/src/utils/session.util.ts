import { Prisma } from '@prisma/client';
import { SessionResponse } from '../dto/session.dto';

// Session Prisma avec ses relations chargées (miroir de l'include des requêtes)
export type SessionWithRelations = Prisma.SessionGetPayload<{
    include: { teacher: true; participants: { include: { user: true } } };
}>;

// Met en forme la session exposée par l'API à partir de la forme Prisma (relations chargées)
export const toSessionResponse = (session: SessionWithRelations): SessionResponse => ({
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
