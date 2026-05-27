import { useCallback, useEffect } from 'react';
import axios from 'axios';
import { useRequestState } from './useRequestState';
import { getAxiosErrorMessage } from '../utils/http';

interface UseFetchOptions {
  initialLoading?: boolean;
  enabled?: boolean;
}

export function useFetch<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  onSuccess: (data: T) => void,
  fallbackError: string,
  { initialLoading = true, enabled = true }: UseFetchOptions = {},
) {
  const { loading, setLoading, error, setError } = useRequestState(initialLoading);

  const run = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      setError('');
      const data = await fetcher(signal ?? new AbortController().signal);
      onSuccess(data);
    } catch (err) {
      if (axios.isCancel(err)) return;
      setError(getAxiosErrorMessage(err, fallbackError));
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [fetcher, onSuccess, fallbackError, setLoading, setError]);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    run(controller.signal);
    return () => controller.abort();
  }, [run, enabled]);

  return { loading, error, refetch: () => run() };
}
