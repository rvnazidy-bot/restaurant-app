import { useState } from 'react';
import { extractApiError } from '../services/api';

export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const request = async (callback) => {
    setLoading(true);
    setError('');
    try {
      return await callback();
    } catch (err) {
      const message = extractApiError(err);
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, request, setError };
}
