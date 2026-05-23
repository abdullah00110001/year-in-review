import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface BroadcastBody {
  group_id: string;
  kind: 'leader' | 'member';
  target_user_id?: string;
  message?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Auth-bound client to identify caller
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const senderId = userData.user.id;

    const body = (await req.json()) as BroadcastBody;
    if (!body?.group_id || !body?.kind) {
      return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (body.kind === 'member' && !body.target_user_id) {
      return new Response(JSON.stringify({ error: 'target_user_id required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Rate-limit check via RPCs (uses caller's auth)
    if (body.kind === 'leader') {
      const { data: ok } = await userClient.rpc('can_send_leader_wake', { _group_id: body.group_id });
      if (!ok) {
        return new Response(JSON.stringify({ error: 'Rate limit reached for leader broadcast today' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    } else {
      const { data: ok } = await userClient.rpc('can_send_member_wake', { _group_id: body.group_id, _target: body.target_user_id });
      if (!ok) {
        return new Response(JSON.stringify({ error: 'Daily wake-up call limit reached for this member' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // Service client for inserts + reading members
    const svc = createClient(supabaseUrl, serviceKey);

    // Log broadcast
    const { error: insErr } = await svc.from('group_wake_broadcasts').insert({
      group_id: body.group_id,
      sender_id: senderId,
      kind: body.kind,
      target_user_id: body.kind === 'member' ? body.target_user_id : null,
      message: body.message ?? null,
    });
    if (insErr) {
      return new Response(JSON.stringify({ error: insErr.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Determine recipients
    let recipients: string[] = [];
    if (body.kind === 'leader') {
      const { data: members } = await svc
        .from('lifeos_group_members')
        .select('user_id')
        .eq('group_id', body.group_id);
      recipients = (members ?? []).map((m: any) => m.user_id).filter((id: string) => id !== senderId);
    } else {
      recipients = [body.target_user_id!];
    }

    // Persist a notification row per recipient (frontend listens via realtime / native plugin polls)
    const { data: senderProfile } = await svc.from('profiles').select('full_name').eq('user_id', senderId).maybeSingle();
    const senderName = senderProfile?.full_name ?? 'Someone';

    return new Response(
      JSON.stringify({
        success: true,
        recipients,
        sender_name: senderName,
        kind: body.kind,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});