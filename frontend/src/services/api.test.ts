import { describe, it, expect } from 'vitest';
import api from './api';

describe('api (instance axios)', () => {
  it('is configured with baseURL=/api', () => {
    expect(api.defaults.baseURL).toBe('/api');
  });

  it('sends the Content-Type JSON header by default', () => {
    expect(api.defaults.headers['Content-Type']).toBe('application/json');
  });
});
