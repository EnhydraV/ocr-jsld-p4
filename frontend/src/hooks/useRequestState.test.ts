import { describe, it, expect } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useRequestState } from './useRequestState';

describe('useRequestState', () => {
  it('démarre avec loading=false par défaut', () => {
    const { result } = renderHook(() => useRequestState());
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('');
  });

  it('respecte la valeur initiale de loading', () => {
    const { result } = renderHook(() => useRequestState(true));
    expect(result.current.loading).toBe(true);
  });

  it('met à jour loading via setLoading', () => {
    const { result } = renderHook(() => useRequestState());
    act(() => result.current.setLoading(true));
    expect(result.current.loading).toBe(true);
    act(() => result.current.setLoading(false));
    expect(result.current.loading).toBe(false);
  });

  it('met à jour error via setError', () => {
    const { result } = renderHook(() => useRequestState());
    act(() => result.current.setError('boom'));
    expect(result.current.error).toBe('boom');
  });
});
