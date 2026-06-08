import prisma from '../../src/utils/prisma';

export const resetDb = async () => {
    await prisma.$executeRawUnsafe(
        'TRUNCATE TABLE "PARTICIPATE", "sessions", "teachers", "users" RESTART IDENTITY CASCADE',
    );
};

export const seedUser = (email = 'victor@yoga.com', admin = false) =>
    prisma.user.create({
        data: {email, firstName: 'Victor', lastName: 'Pille', password: 'hashedpassword', admin},
    });

export const seedAdmin = (email = 'admin@yoga.com') => seedUser(email, true);

export const seedTeacher = () =>
    prisma.teacher.create({
        data: {firstName: 'Charlie', lastName: 'Ztherone'},
    });

export const seedSession = (teacherId: number) =>
    prisma.session.create({
        data: {name: 'Yoga yoghurt', date: new Date('2026-07-01'), description: 'Une session veloutée', teacherId},
    });
