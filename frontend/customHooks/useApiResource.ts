"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface ApiResource<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Encapsulates the ubiquitous {data, loading, error, refetch} fetch pattern.
 * Pass a fetcher plus its dependency list; the resource reloads whenever a
 * dependency changes and exposes `refetch` for imperative reloads after mutations.
 */
export function useApiResource<T>(
  fetcher: () => Promise<T>,
  deps: React.DependencyList = [],
): ApiResource<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Always call the latest fetcher without making it a hook dependency.
  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetcherRef.current());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  // Serialise the caller's deps into a stable key so the effect re-runs on change.
  const depsKey = JSON.stringify(deps);
  useEffect(() => {
    refetch();
  }, [depsKey, refetch]);

  return { data, loading, error, refetch };
}
