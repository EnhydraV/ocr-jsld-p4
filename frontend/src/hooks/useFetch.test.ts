import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { AxiosError, CanceledError } from 'axios';
import { useFetch } from './useFetch';

describe('useFetch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('appelle fetcher au montage et passe les données à onSuccess', async () => {
    const fetcher = vi.fn().mockResolvedValue({ value: 42 });
    const onSuccess = vi.fn();

    const { result } = renderHook(() => useFetch(fetcher, onSuccess, 'fallback'));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(onSuccess).toHaveBeenCalledWith({ value: 42 });
    expect(result.current.error).toBe('');
  });

  it('met error avec le message de la réponse axios en cas d\'erreur', async () => {
    const axiosErr = new AxiosError('fail');
    axiosErr.response = {
      data: { message: 'server says no' },
      status: 500, statusText: 'err', headers: {}, config: {} as any,
    };
    axiosErr.isAxiosError = true;
    const fetcher = vi.fn().mockRejectedValue(axiosErr);
    const onSuccess = vi.fn();

    const { result } = renderHook(() => useFetch(fetcher, onSuccess, 'fallback'));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('server says no');
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('ignore les erreurs d\'annulation (signal abort)', async () => {
    const fetcher = vi.fn().mockRejectedValue(new CanceledError('canceled'));
    const onSuccess = vi.fn();

    const { result } = renderHook(() => useFetch(fetcher, onSuccess, 'fallback'));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('');
  });

  it('ne lance pas l\'appel quand enabled=false', () => {
    const fetcher = vi.fn().mockResolvedValue({});
    const onSuccess = vi.fn();

    renderHook(() => useFetch(fetcher, onSuccess, 'fallback', { enabled: false }));

    expect(fetcher).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('refetch relance l\'appel manuellement', async () => {
    const fetcher = vi.fn().mockResolvedValue({ value: 1 });
    const onSuccess = vi.fn();

    const { result } = renderHook(() => useFetch(fetcher, onSuccess, 'fallback'));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetcher).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.refetch();
    });

    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});
