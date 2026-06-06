import { describe, it, expect } from 'vitest';
import { AxiosError } from 'axios';
import { authHeaders, getAxiosErrorMessage } from '../../src/utils/http';

describe('authHeaders', () => {
  it('generates the Authorization header with the token', () => {
    expect(authHeaders('mon-token')).toEqual({
      headers: { Authorization: 'Bearer mon-token' },
    });
  });

  it('omits the Authorization header when the token is null', () => {
    expect(authHeaders(null)).toEqual({
      headers: {},
    });
  });
});

describe('getAxiosErrorMessage', () => {
  const makeAxiosError = (message?: string): AxiosError => {
    const err = new AxiosError('request failed');
    err.response = {
      data: message ? { message } : {},
      status: 400,
      statusText: 'Bad Request',
      headers: {},
      config: {} as any,
    };
    return err;
  };

  it('returns the message from the axios response', () => {
    const err = makeAxiosError('Email already taken');
    expect(getAxiosErrorMessage(err, 'fallback')).toBe('Email already taken');
  });

  it('returns the fallback when the response has no message', () => {
    const err = makeAxiosError();
    expect(getAxiosErrorMessage(err, 'fallback')).toBe('fallback');
  });

  it('returns the fallback for a non-Axios error', () => {
    expect(getAxiosErrorMessage(new Error('boom'), 'fallback')).toBe('fallback');
  });

  it('returns the fallback for an arbitrary non-error value', () => {
    expect(getAxiosErrorMessage('string error', 'fallback')).toBe('fallback');
  });
});
