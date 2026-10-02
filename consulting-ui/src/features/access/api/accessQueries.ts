import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/services/query-keys/queryKeys';
import { accessApi } from './accessApi';

export function useEffectiveAccessQuery(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.access.mine(),
    queryFn: accessApi.getMine,
    enabled,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });
}
