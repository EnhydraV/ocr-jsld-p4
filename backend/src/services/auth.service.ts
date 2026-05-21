import * as bcrypt from 'bcrypt';
import { generateToken } from '../utils/jwt.util';
import { LoginSchema, RegisterSchema } from '../dto/auth.dto';
import { AppError } from '../errors/AppError';
import prisma from '../utils/prisma';

export class AuthService {
    async login(body: unknown) {
        const result = LoginSchema.safeParse(body);
        if (!result.success) {
            throw new AppError(400, result.error.message);
        }
        const { email, password } = result.data;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            throw new AppError(401, 'Invalid credentials');
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new AppError(401, 'Invalid credentials');
        }

        const token = generateToken(user.id);

        return {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            admin: user.admin,
            token,
        };
    }

    async register(body: unknown) {
        const result = RegisterSchema.safeParse(body);
        if (!result.success) {
            throw new AppError(400, result.error.message);
        }
        const { email, password, firstName, lastName } = result.data;

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            throw new AppError(400, 'Email already exists');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: { email, password: hashedPassword, firstName, lastName, admin: false },
        });

        const token = generateToken(user.id);

        return {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            admin: user.admin,
            token,
        };
    }
}
