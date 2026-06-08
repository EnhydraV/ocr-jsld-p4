import {Request, Response} from 'express';
import {AuthService} from '../services/auth.service';

const authService = new AuthService();

export class AuthController {
    async login(req: Request, res: Response) {
        const result = await authService.login(req.body);
        return res.status(200).json(result);
    }

    async register(req: Request, res: Response) {
        const result = await authService.register(req.body);
        return res.status(201).json(result);
    }
}
