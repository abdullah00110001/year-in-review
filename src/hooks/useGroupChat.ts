import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface GroupChatMessage {
  id: string;
  group_id: string;
  user_id: string;
  content: string;
  reply_to: string | null;
  is_system: boolean;
  reactions: Record<string, string[]>;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
  author_name?: string | null;
}

export function useGroupChat(groupId: string | undefined) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['group-chat', groupId],
    enabled: !!groupId,
    queryFn: async (): Promise<GroupChatMessage[]> => {
      const { data, error } = await supabase
        .from('group_chat_messages')
        .select('*')
        .eq('group_id', groupId!)
        .is('deleted_at', null)
        .order('created_at', { ascending: true })
        .limit(100);
      if (error) throw error;
      const rows = (data ?? []) as any[];
      const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
      if (userIds.length === 0) return [];
      const { data: profiles } = await supabase
        .from('profiles').select('user_id, full_name').in('user_id', userIds);
      const nameMap = new Map((profiles ?? []).map((p: any) => [p.user_id, p.full_name]));
      return rows.map((r) => ({ ...r, author_name: nameMap.get(r.user_id) ?? 'Member' }));
    },
  });

  useEffect(() => {
    if (!groupId) return;
    const channel = supabase
      .channel(`group-chat-${groupId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'group_chat_messages', filter: `group_id=eq.${groupId}` },
        () => qc.invalidateQueries({ queryKey: ['group-chat', groupId] })
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [groupId, qc]);

  return query;
}

export function useSendChatMessage(groupId: string | undefined) {
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: { content: string; reply_to?: string }) => {
      if (!groupId || !user) return;
      const content = input.content.trim();
      if (!content) return;
      const { error } = await supabase.from('group_chat_messages').insert({
        group_id: groupId,
        user_id: user.id,
        content,
        reply_to: input.reply_to ?? null,
      });
      if (error) throw error;
    },
    onError: (e: any) => toast.error(e?.message ?? 'Failed to send'),
  });
}

export function useDeleteChatMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('group_chat_messages')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_data, _vars) => qc.invalidateQueries({ queryKey: ['group-chat'] }),
  });
}