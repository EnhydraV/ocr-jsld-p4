import {NextFunction, Request, Response} from 'express';

export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    // Erreur inattendue : on log et on renvoie un message générique pour ne rien fuiter.
    console.error(err);
    res.status(500).json({
        error: {
            code: 'INTERNAL_ERROR',
            message: 'Une erreur interne est survenue',
        },
    });
};