import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { InferResponseType } from 'hono/client';

import { api, ensureOk } from '@/lib/api';

export type HistoryPage = InferResponseType<typeof api.v1.identifications.$get, 200>;
export type HistoryItem = HistoryPage['items'][number];
export type SavedIdentification = InferResponseType<(typeof api.v1.identifications)[':id']['$get'], 200>;

export const historyKeys = {
  all: ['history'] as const,
  list: (query: string) => ['history', 'list', query] as const,
  detail: (id: string) => ['history', 'detail', id] as const,
};

/** The user's identifications, newest first, 30 per page; `query` filters by name on the server. */
export function useHistory(query = '') {
  return useInfiniteQuery({
    queryKey: historyKeys.list(query),
    queryFn: async ({ pageParam }) => {
      const response = await api.v1.identifications.$get({ query: { cursor: pageParam, q: query || undefined } });
      return (await ensureOk(response)).json();
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) => page.nextCursor ?? undefined,
  });
}

export function useSavedIdentification(id: string | undefined) {
  return useQuery({
    queryKey: historyKeys.detail(id ?? ''),
    queryFn: async () => {
      const response = await api.v1.identifications[':id'].$get({ param: { id: id! } });
      return (await ensureOk(response)).json();
    },
    enabled: !!id,
  });
}

export function useDeleteIdentification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await ensureOk(await api.v1.identifications[':id'].$delete({ param: { id } }));
    },
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: historyKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: historyKeys.all });
    },
  });
}
