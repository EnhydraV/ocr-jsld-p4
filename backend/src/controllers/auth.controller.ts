import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { AppError } from '../errors/AppError';

const authService = new AuthService();

export class AuthController {
    async login(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await authService.login(req.body);
            return res.status(200).json(result);
        } catch (err) {
            if (err instanceof AppError) return res.status(err.statusCode).json({ message: err.message });
            next(err);
        }
    }

    async register(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await authService.register(req.body);
            return res.status(201).json(result);
        } catch (err) {
            if (err instanceof AppError) return res.status(err.statusCode).json({ message: err.message });
            next(err);
        }
    }
}
