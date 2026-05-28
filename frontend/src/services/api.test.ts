import { describe, it, expect } from 'vitest';
import api from './api';

describe('api (instance axios)', () => {
  it('est configuré avec baseURL=/api', () => {
    expect(api.defaults.baseURL).toBe('/api');
  });

  it('envoie le header Content-Type JSON par défaut', () => {
    expect(api.defaults.headers['Content-Type']).toBe('application/json');
  });
});
