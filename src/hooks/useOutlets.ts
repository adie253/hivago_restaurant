import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getOwnerOutlets, updateOutletAvailability, updateAllOutletsAvailability, Outlet } from '../api/ownerApi';

const OUTLETS_KEY = ['owner', 'outlets'] as const;

export function useOutlets() {
  return useQuery({
    queryKey: OUTLETS_KEY,
    queryFn: getOwnerOutlets,
  });
}

export function useToggleOutlet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ outletId, isAcceptingOrders }: { outletId: string; isAcceptingOrders: boolean }) =>
      updateOutletAvailability(outletId, isAcceptingOrders),

    // Optimistic update — flips the switch instantly, rolls back on error
    onMutate: async ({ outletId, isAcceptingOrders }) => {
      await qc.cancelQueries({ queryKey: OUTLETS_KEY });
      const prev = qc.getQueryData<Outlet[]>(OUTLETS_KEY);
      
      qc.setQueryData<Outlet[]>(OUTLETS_KEY, (old) =>
        old?.map((o) => (o.id === outletId ? { ...o, isAcceptingOrders } : o)),
      );
      
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(OUTLETS_KEY, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: OUTLETS_KEY }),
  });
}

export function useToggleAllOutlets() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (isAcceptingOrders: boolean) =>
      updateAllOutletsAvailability(isAcceptingOrders),
    onSuccess: () => qc.invalidateQueries({ queryKey: OUTLETS_KEY }),
  });
}
