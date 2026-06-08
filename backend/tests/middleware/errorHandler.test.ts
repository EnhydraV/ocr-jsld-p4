import {beforeEach, describe, expect, it, vi} from 'vitest';
import {NextFunction, Request, Response} from 'express';
import {errorHandler} from '../../src/middleware/errorHandler';
import {AppError} from '../../src/errors/AppError';

describe('errorHandler', () => {
    let req: Request;
    let res: Response;
    let next: NextFunction;
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        req = {} as Request;
        res = {} as Response;
        res.status = vi.fn().mockReturnValue(res);
        res.json = vi.fn().mockReturnValue(res);
        next = vi.fn() as NextFunction;
        // Pas de console dans l'output des tests
        consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('should map an AppError to its status code and message', () => {
        const err = new AppError(404, 'Session not found');
        errorHandler(err, req, res, next);
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({message: 'Session not found'});
    });

    it('should not log an AppError (it is an expected business error)', () => {
        errorHandler(new AppError(400, 'Invalid session ID'), req, res, next);
        expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should respond with 500 and the generic error payload', () => {
        const err = new Error('Erreur chien tête en bas');
        errorHandler(err, req, res, next);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            error: {code: 'INTERNAL_ERROR', message: 'Une erreur interne est survenue'},
        });
    });

    it('should not leak the original error message in the response', () => {
        const secretMessage='Salutation au soleil secrète'
        const err = new Error(secretMessage);
        errorHandler(err, req, res, next);
        const payload = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
        expect(JSON.stringify(payload)).not.toContain(secretMessage);
    });

    it('should log the error in console', () => {
        const err = new Error('Erreur chien tête en haut');
        errorHandler(err, req, res, next);
        expect(consoleErrorSpy).toHaveBeenCalledWith(err);
    });
});
