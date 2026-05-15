import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../api/client';

export interface TimeOff {
  id: string;
  restaurantId: string;
  startsAtUtc: string; // ISO 8601 UTC
  endsAtUtc: string;
  reason: string | null;
  cancelledAtUtc: string | null;
  createdAtUtc: string;
  isActive: boolean; // currently in [startsAt, endsAt) and not cancelled
}

const timeOffKey = (restaurantId: string) => ['time-off', restaurantId] as const;

export function useTimeOffs(restaurantId: string) {
  return useQuery({
    queryKey: timeOffKey(restaurantId),
    queryFn: async () => {
      const response = await client.get<TimeOff[]>(`/owners/me/outlets/${restaurantId}/time-off`);
      return response.data;
    },
    enabled: !!restaurantId,
  });
}

export function useScheduleTimeOff(restaurantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { startsAtUtc: string; endsAtUtc: string; reason?: string }) =>
      client.post(`/owners/me/outlets/${restaurantId}/time-off`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: timeOffKey(restaurantId) }),
  });
}

export function useQuickPause(restaurantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { durationMinutes: number; reason?: string }) =>
      client.post(`/owners/me/outlets/${restaurantId}/time-off/quick-pause`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: timeOffKey(restaurantId) }),
  });
}

export function useCancelTimeOff(restaurantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (timeOffId: string) =>
      client.delete(`/owners/me/outlets/${restaurantId}/time-off/${timeOffId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: timeOffKey(restaurantId) }),
  });
}
