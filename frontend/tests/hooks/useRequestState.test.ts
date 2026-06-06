import { describe, it, expect } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useRequestState } from '../../src/hooks/useRequestState';

describe('useRequestState', () => {
  it('starts with loading=false by default', () => {
    const { result } = renderHook(() => useRequestState());
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('');
  });

  it('respects the initial loading value', () => {
    const { result } = renderHook(() => useRequestState(true));
    expect(result.current.loading).toBe(true);
  });

  it('updates loading via setLoading', () => {
    const { result } = renderHook(() => useRequestState());
    act(() => result.current.setLoading(true));
    expect(result.current.loading).toBe(true);
    act(() => result.current.setLoading(false));
    expect(result.current.loading).toBe(false);
  });

  it('updates error via setError', () => {
    const { result } = renderHook(() => useRequestState());
    act(() => result.current.setError('boom'));
    expect(result.current.error).toBe('boom');
  });
});
