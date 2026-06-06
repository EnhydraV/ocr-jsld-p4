import {describe, it, expect, beforeEach, vi} from 'vitest';
import {authMiddleware, AuthRequest} from '../../src/middleware/auth.middleware';
import {NextFunction, Response} from "express";
import {verifyToken} from "../../src/utils/jwt.util";

describe('auth.middleware', () => {
    let req: AuthRequest;
    let res: Response
    let next: NextFunction;

    vi.mock('../../src/utils/jwt.util', () => ({
        verifyToken: vi.fn()
    }));

    const validToken='valid-token';
    const invalidToken='invalid-token';
    const userId=13;

    const mockVerifyToken = vi.mocked(verifyToken);

    beforeEach(() => {
        req = {headers: {}} as AuthRequest;
        res = {} as Response;
        res.status = vi.fn().mockReturnValue(res);
        res.json = vi.fn().mockReturnValue(res);
        next = vi.fn() as NextFunction;
        mockVerifyToken.mockReset();
    });

    it('should return 401 if no auth header is provided', () => {
        req.headers = {};
        authMiddleware(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({message: 'No token provided'}))
    });

    it('should return 401 if no token is provided', () => {
        req.headers.authorization = 'Bearer ';
        authMiddleware(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({message: 'Invalid token format'}))
    })

    it('should return 401 if token is invalid or expired token', () => {
        req.headers.authorization = 'Bearer '+invalidToken;
        authMiddleware(req, res, next);
        expect(mockVerifyToken).toHaveBeenCalledWith(invalidToken);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({message: 'Invalid or expired token'}))
    });

    it('should call next if token is valid', () => {
        req.headers.authorization = 'Bearer '+validToken;
        mockVerifyToken.mockReturnValue({userId:userId});
        authMiddleware(req, res, next);
        expect(mockVerifyToken).toHaveBeenCalledWith(validToken);
        expect(req.userId).toBe(userId);
        expect(next).toHaveBeenCalledOnce()
    });

});
