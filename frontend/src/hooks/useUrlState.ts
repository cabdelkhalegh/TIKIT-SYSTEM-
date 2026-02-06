'use client';

import { useCallback, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export function useUrlState(searchParamsString?: string) {
  const router = useRouter();
  const pathname = usePathname();
  
  // Parse search params from string or get from window in client
  const searchParams = useMemo(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search);
    }
    return new URLSearchParams(searchParamsString || '');
  }, [searchParamsString]);

  const updateUrlParams = useCallback(
    (updates: Record<string, string | number | boolean | null | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === undefined || value === '') {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      });

      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const getParam = useCallback(
    (key: string, defaultValue: string = ''): string => {
      return searchParams.get(key) || defaultValue;
    },
    [searchParams]
  );

  const getNumberParam = useCallback(
    (key: string, defaultValue: number = 1): number => {
      const value = searchParams.get(key);
      return value ? parseInt(value, 10) : defaultValue;
    },
    [searchParams]
  );

  const getBooleanParam = useCallback(
    (key: string, defaultValue: boolean = false): boolean => {
      const value = searchParams.get(key);
      return value ? value === 'true' : defaultValue;
    },
    [searchParams]
  );

  const getArrayParam = useCallback(
    (key: string, defaultValue: string[] = []): string[] => {
      const value = searchParams.get(key);
      return value ? value.split(',').filter(Boolean) : defaultValue;
    },
    [searchParams]
  );

  const clearAllParams = useCallback(() => {
    router.push(pathname, { scroll: false });
  }, [pathname, router]);

  return {
    updateUrlParams,
    getParam,
    getNumberParam,
    getBooleanParam,
    getArrayParam,
    clearAllParams,
  };
}
