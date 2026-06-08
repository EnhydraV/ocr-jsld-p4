import {Response} from 'express';
import {AuthRequest} from '../middleware/auth.middleware';
import {UserService} from '../services/user.service';
import {AppError} from '../errors/AppError';

const userService = new UserService();

export class UserController {
    async getById(req: AuthRequest, res: Response) {
        const id = parseInt(String(req.params.id));
        if (isNaN(id)) throw new AppError(400, 'Invalid user ID');
        return res.status(200).json(await userService.getById(id, req.userId!));
    }

    async delete(req: AuthRequest, res: Response) {
        const id = parseInt(String(req.params.id));
        if (isNaN(id)) throw new AppError(400, 'Invalid user ID');
        await userService.delete(id, req.userId!);
        return res.status(200).json({message: 'User deleted successfully'});
    }

    async promoteSelfToAdmin(req: AuthRequest, res: Response) {
        return res.status(200).json(await userService.promoteSelfToAdmin(req.userId!));
    }
}
