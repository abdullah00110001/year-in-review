import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useWakeBroadcast() {
  return useMutation({
    mutationFn: async (input: {
      group_id: string;
      kind: 'leader' | 'member';
      target_user_id?: string;
      message?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('wake-broadcast', { body: input });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data;
    },
    onSuccess: (data: any) => {
      const count = Array.isArray(data?.recipients) ? data.recipients.length : 1;
      toast.success(`Wake call sent to ${count} member${count !== 1 ? 's' : ''}`);
    },
    onError: (e: any) => toast.error(e?.message ?? 'Could not send wake call'),
  });
}

export function useCanLeaderWake(groupId: string | undefined) {
  return useQuery({
    queryKey: ['can-leader-wake', groupId],
    enabled: !!groupId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('can_send_leader_wake', { _group_id: groupId! });
      if (error) return false;
      return !!data;
    },
    refetchInterval: 60_000,
  });
}

export function useTrustedWakers(groupId: string | undefined, grantorId: string | undefined) {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ['trusted-wakers', groupId, grantorId],
    enabled: !!groupId && !!grantorId,
    queryFn: async () => {
      const { data } = await supabase
        .from('group_trusted_wakers')
        .select('grantee_id')
        .eq('group_id', groupId!)
        .eq('grantor_id', grantorId!);
      return new Set((data ?? []).map((r: any) => r.grantee_id));
    },
  });

  const toggle = useMutation({
    mutationFn: async (granteeId: string) => {
      const current = query.data;
      if (!groupId || !grantorId) return;
      if (current?.has(granteeId)) {
        const { error } = await supabase.from('group_trusted_wakers')
          .delete()
          .eq('group_id', groupId).eq('grantor_id', grantorId).eq('grantee_id', granteeId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('group_trusted_wakers')
          .insert({ group_id: groupId, grantor_id: grantorId, grantee_id: granteeId });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trusted-wakers', groupId, grantorId] }),
    onError: (e: any) => toast.error(e?.message ?? 'Failed'),
  });

  return { ...query, toggle };
}