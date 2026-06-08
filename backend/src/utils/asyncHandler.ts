import {NextFunction, Request, RequestHandler, Response} from 'express';

// Enveloppe un handler async : tout rejet (y compris un throw synchrone) part vers next()
// et tombe donc dans le errorHandler global. Évite de répéter try/catch dans chaque controller.
export const asyncHandler =
    (fn: (req: any, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
    (req: Request, res: Response, next: NextFunction) =>
        Promise.resolve(fn(req, res, next)).catch(next);
