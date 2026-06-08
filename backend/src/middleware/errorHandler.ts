import {NextFunction, Request, Response} from 'express';
import {AppError} from '../errors/AppError';

export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    // Erreur métier connue : on remonte son statut et son message tels quels.
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({message: err.message});
    }
    // Erreur inattendue : on log et on renvoie un message générique pour ne rien fuiter.
    console.error(err);
    res.status(500).json({
        error: {
            code: 'INTERNAL_ERROR',
            message: 'Une erreur interne est survenue',
        },
    });
};