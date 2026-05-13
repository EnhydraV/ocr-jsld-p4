import { useState } from 'react';

interface RequestState {
  loading: boolean;
  setLoading: (v: boolean) => void;
  error: string;
  setError: (v: string) => void;
}

export function useRequestState(initialLoading = false): RequestState {
  const [loading, setLoading] = useState<boolean>(initialLoading);
  const [error, setError] = useState<string>('');
  return { loading, setLoading, error, setError };
}