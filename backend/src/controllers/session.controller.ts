import {Response} from 'express';
import {AuthRequest} from '../middleware/auth.middleware';
import {SessionService} from '../services/session.service';
import {AppError} from '../errors/AppError';

const sessionService = new SessionService();

const parseIntParam = (value: string, label: string): number => {
    const n = parseInt(value);
    if (isNaN(n)) throw new AppError(400, `Invalid ${label}`);
    return n;
};

export class SessionController {
    async getAll(req: AuthRequest, res: Response) {
        return res.status(200).json(await sessionService.getAll());
    }

    async getById(req: AuthRequest, res: Response) {
        const id = parseIntParam(String(req.params.id), 'session ID');
        return res.status(200).json(await sessionService.getById(id));
    }

    async create(req: AuthRequest, res: Response) {
        const result = await sessionService.create(req.body, req.userId!);
        return res.status(201).json(result);
    }

    async update(req: AuthRequest, res: Response) {
        const id = parseIntParam(String(req.params.id), 'session ID');
        return res.status(200).json(await sessionService.update(id, req.body, req.userId!));
    }

    async delete(req: AuthRequest, res: Response) {
        const id = parseIntParam(String(req.params.id), 'session ID');
        await sessionService.delete(id, req.userId!);
        return res.status(200).json({message: 'Session deleted successfully'});
    }

    async participate(req: AuthRequest, res: Response) {
        const sessionId = parseIntParam(String(req.params.id), 'session ID');
        const userId = parseIntParam(String(req.params.userId), 'user ID');
        await sessionService.participate(sessionId, userId);
        return res.status(200).json({message: 'Successfully joined the session'});
    }

    async unparticipate(req: AuthRequest, res: Response) {
        const sessionId = parseIntParam(String(req.params.id), 'session ID');
        const userId = parseIntParam(String(req.params.userId), 'user ID');
        await sessionService.unparticipate(sessionId, userId);
        return res.status(200).json({message: 'Successfully left the session'});
    }
}
