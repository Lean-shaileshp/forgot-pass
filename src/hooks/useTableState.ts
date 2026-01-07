import { useState, useEffect, useCallback, useMemo } from 'react';

interface TableState {
  search: string;
  page: number;
  pageSize: number;
  filters: Record<string, string>;
}

export function useTableState(storageKey: string, defaultPageSize = 10) {
  // Initialize from localStorage
  const getInitialState = (): TableState => {
    try {
      const stored = localStorage.getItem(`table_state_${storageKey}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error reading table state:', e);
    }
    return {
      search: '',
      page: 1,
      pageSize: defaultPageSize,
      filters: {},
    };
  };

  const [state, setState] = useState<TableState>(getInitialState);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`table_state_${storageKey}`, JSON.stringify(state));
    } catch (e) {
      console.error('Error saving table state:', e);
    }
  }, [state, storageKey]);

  const setSearch = useCallback((search: string) => {
    setState(prev => ({ ...prev, search, page: 1 })); // Reset to page 1 on search
  }, []);

  const setPage = useCallback((page: number) => {
    setState(prev => ({ ...prev, page }));
  }, []);

  const setPageSize = useCallback((pageSize: number) => {
    setState(prev => ({ ...prev, pageSize, page: 1 }));
  }, []);

  const setFilter = useCallback((key: string, value: string) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, [key]: value },
      page: 1, // Reset to page 1 on filter change
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setState(prev => ({
      ...prev,
      filters: {},
      search: '',
      page: 1,
    }));
  }, []);

  return {
    search: state.search,
    page: state.page,
    pageSize: state.pageSize,
    filters: state.filters,
    setSearch,
    setPage,
    setPageSize,
    setFilter,
    clearFilters,
  };
}

// Helper to paginate data
export function usePaginatedData<T>(data: T[], page: number, pageSize: number) {
  return useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return {
      paginatedData: data.slice(start, end),
      totalPages: Math.ceil(data.length / pageSize),
      totalItems: data.length,
    };
  }, [data, page, pageSize]);
}
