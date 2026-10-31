import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface FetchOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
}

interface ApiError extends Error {
  status?: number;
}

export function useApi<T>(url: string, options?: { immediate?: boolean; onError?: (error: Error) => void }) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const router = useRouter();

  const fetchData = useCallback(async (fetchOptions?: FetchOptions) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(url, {
        method: fetchOptions?.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...fetchOptions?.headers,
        },
        body: fetchOptions?.body ? JSON.stringify(fetchOptions.body) : undefined,
        credentials: 'include',
      });

      if (response.status === 401) {
        router.push('/login');
        return;
      }

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setData(result);
      return result;
    } catch (err) {
      const error = err as ApiError;
      setError(error);
      options?.onError?.(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [url, router, options]);

  useEffect(() => {
    if (options?.immediate !== false) {
      fetchData();
    }
  }, [fetchData, options?.immediate]);

  const mutate = useCallback(async (fetchOptions?: FetchOptions) => {
    return fetchData(fetchOptions);
  }, [fetchData]);

  return { data, loading, error, mutate, refetch: fetchData };
}

export function useProducts(params?: Record<string, string>) {
  const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
  return useApi<{ products: any[] }>(`/api/products${queryString}`);
}

export function useCategories(params?: Record<string, string>) {
  const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
  return useApi<{ categories: any[] }>(`/api/categories${queryString}`);
}

export function useInventory(params?: Record<string, string>) {
  const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
  return useApi<{ inventory: any[] }>(`/api/inventory${queryString}`);
}

export function useCustomers(params?: Record<string, string>) {
  const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
  return useApi<{ customers: any[] }>(`/api/customers${queryString}`);
}

export function useOrders(params?: Record<string, string>) {
  const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
  return useApi<{ orders: any[] }>(`/api/orders${queryString}`);
}

export function useDashboard(params?: Record<string, string>) {
  const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
  return useApi<any>(`/api/dashboard${queryString}`);
}

export function useShifts(params?: Record<string, string>) {
  const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
  return useApi<{ shifts: any[] }>(`/api/shifts${queryString}`);
}

export function useRegisters(params?: Record<string, string>) {
  const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
  return useApi<{ registers: any[] }>(`/api/registers${queryString}`);
}

export function useUsers(params?: Record<string, string>) {
  const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
  return useApi<{ users: any[] }>(`/api/users${queryString}`);
}

export function useDiscounts(params?: Record<string, string>) {
  const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
  return useApi<{ discounts: any[] }>(`/api/discounts${queryString}`);
}

export function useProductsWithInventory(locationId?: string, params?: Record<string, string>) {
  const queryParams = { ...params };
  if (locationId) queryParams.locationId = locationId;
  const queryString = Object.keys(queryParams).length > 0 ? '?' + new URLSearchParams(queryParams).toString() : '';
  return useApi<{ products: any[] }>(`/api/products/with-inventory${queryString}`);
}

export function useReceipt(id: string) {
  return useApi<{ receipt: any }>(`/api/receipts/${id}`, { immediate: !!id });
}

export function useLocations(params?: Record<string, string>) {
  const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
  return useApi<{ locations: any[] }>(`/api/locations${queryString}`);
}

export function useReceipts(params?: Record<string, string>) {
  const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
  return useApi<{ receipts: any[] }>(`/api/receipts${queryString}`);
}