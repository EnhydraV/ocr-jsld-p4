import {describe, expect, it} from "vitest";
import {generateToken, verifyToken} from "./jwt.util";

describe('JWT Utils', () => {
    it('should generate a valid token', () => {
        const token = generateToken(1);
        expect(token).toMatch(/(^[A-Za-z0-9-_]*\.[A-Za-z0-9-_]*\.[A-Za-z0-9-_]*$)/);
    });

    it('should verify a generated token', () => {
        const verified = verifyToken(generateToken(1));
        expect(verified).toBeTruthy();
    });

    it('should not verify an non jwt token', () => {
        const verified = verifyToken('invalid-token');
        expect(verified).toBeNull();
    });
})