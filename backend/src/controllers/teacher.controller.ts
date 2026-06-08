import {Response} from 'express';
import {AuthRequest} from '../middleware/auth.middleware';
import {TeacherService} from '../services/teacher.service';
import {AppError} from '../errors/AppError';

const teacherService = new TeacherService();

export class TeacherController {
    async getAll(req: AuthRequest, res: Response) {
        return res.status(200).json(await teacherService.getAll());
    }

    async getById(req: AuthRequest, res: Response) {
        const id = parseInt(String(req.params.id));
        if (isNaN(id)) throw new AppError(400, 'Invalid teacher ID');
        return res.status(200).json(await teacherService.getById(id));
    }
}
