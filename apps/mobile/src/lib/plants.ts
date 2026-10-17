import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { InferResponseType } from 'hono/client';

import { api, ensureOk } from '@/lib/api';
import { historyKeys } from '@/lib/identifications';

export type Plant = InferResponseType<typeof api.v1.plants.$get, 200>['items'][number];

export const plantKeys = { all: ['plants'] as const };

const DAY_MS = 24 * 60 * 60 * 1000;
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/** Calendar days until the next watering: negative when overdue, 0 for today. */
export function daysUntilWatering(plant: Pick<Plant, 'nextWateringAt'>, now = new Date()) {
  return Math.round((startOfDay(new Date(plant.nextWateringAt)) - startOfDay(now)) / DAY_MS);
}

/** My plants, the ones that need water soonest first. */
export function usePlants() {
  return useQuery({
    queryKey: plantKeys.all,
    queryFn: async () => (await ensureOk(await api.v1.plants.$get())).json(),
    select: (data) => data.items,
  });
}

function useInvalidatePlants() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: plantKeys.all });
    // Identification details show whether they were added to My plants.
    void queryClient.invalidateQueries({ queryKey: historyKeys.all });
  };
}

export function useAddPlant() {
  const invalidate = useInvalidatePlants();
  return useMutation({
    mutationFn: async (identificationId: string) =>
      (await ensureOk(await api.v1.plants.$post({ json: { identificationId } }))).json(),
    onSuccess: invalidate,
  });
}

export function useWaterPlant() {
  const invalidate = useInvalidatePlants();
  return useMutation({
    mutationFn: async (id: string) => {
      await ensureOk(await api.v1.plants[':id'].water.$post({ param: { id } }));
    },
    onSuccess: invalidate,
  });
}

export function useUpdatePlant() {
  const invalidate = useInvalidatePlants();
  return useMutation({
    mutationFn: async ({ id, ...json }: { id: string; name?: string; wateringIntervalDays?: number }) => {
      await ensureOk(await api.v1.plants[':id'].$patch({ param: { id }, json }));
    },
    onSuccess: invalidate,
  });
}

export function useDeletePlant() {
  const invalidate = useInvalidatePlants();
  return useMutation({
    mutationFn: async (id: string) => {
      await ensureOk(await api.v1.plants[':id'].$delete({ param: { id } }));
    },
    onSuccess: invalidate,
  });
}
