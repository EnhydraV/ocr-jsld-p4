import { describe, it, expect } from 'vitest';
import { formatDate, toInputDate } from './date';

describe('formatDate', () => {
  it('returns a localized en-US date with no options', () => {
    expect(formatDate('2024-06-15')).toBe('6/15/2024');
  });

  it('applies long format options', () => {
    expect(
      formatDate('2024-06-15', { year: 'numeric', month: 'long', day: 'numeric' })
    ).toBe('June 15, 2024');
  });

  it('includes weekday when requested', () => {
    expect(
      formatDate('2024-06-15', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    ).toBe('Saturday, June 15, 2024');
  });
});

describe('toInputDate', () => {
  it('extracts the date part from an ISO string', () => {
    expect(toInputDate('2024-06-15T10:30:00.000Z')).toBe('2024-06-15');
  });

  it('works with a midnight date', () => {
    expect(toInputDate('2024-01-01T00:00:00.000Z')).toBe('2024-01-01');
  });
});
