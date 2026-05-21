import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { TeacherService } from '../services/teacher.service';
import { AppError } from '../errors/AppError';

const teacherService = new TeacherService();

export class TeacherController {
    async getAll(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            return res.status(200).json(await teacherService.getAll());
        } catch (err) {
            if (err instanceof AppError) return res.status(err.statusCode).json({ message: err.message });
            next(err);
        }
    }

    async getById(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const id = parseInt(String(req.params.id));
            if (isNaN(id)) throw new AppError(400, 'Invalid teacher ID');
            return res.status(200).json(await teacherService.getById(id));
        } catch (err) {
            if (err instanceof AppError) return res.status(err.statusCode).json({ message: err.message });
            next(err);
        }
    }
}
