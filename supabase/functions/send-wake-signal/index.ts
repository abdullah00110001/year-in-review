import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { target_user_id, sender_user_id, group_id, signal_type } = await req.json();
    if (!target_user_id || !sender_user_id || !group_id) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: senderProfile } = await supabase.from('profiles').select('full_name').eq('user_id', sender_user_id).maybeSingle();
    const { data: targetDevice } = await supabase.from('push_subscriptions').select('endpoint').eq('user_id', target_user_id).eq('is_active', true).order('created_at', { ascending: false }).limit(1).maybeSingle();

    const senderName = senderProfile?.full_name || 'Someone';
    const signalMessages: Record<string, { title: string; body: string; priority: string }> = {
      gentle: { title: 'Gentle wake-up nudge', body: `${senderName} sent you a wake-up nudge`, priority: 'normal' },
      urgent: { title: 'Urgent wake-up alarm', body: `${senderName} is trying to wake you right now`, priority: 'high' },
      sos: { title: 'SOS wake-up signal', body: `${senderName} sent a critical wake-up signal`, priority: 'high' },
    };

    const message = signalMessages[signal_type] || signalMessages.gentle;
    const FIREBASE_SERVER_KEY = Deno.env.get('FIREBASE_SERVER_KEY');

    if (targetDevice?.endpoint && FIREBASE_SERVER_KEY) {
      try {
        await fetch('https://fcm.googleapis.com/fcm/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `key=${FIREBASE_SERVER_KEY}`,
          },
          body: JSON.stringify({
            to: targetDevice.endpoint,
            priority: message.priority,
            notification: {
              title: message.title,
              body: message.body,
              sound: signal_type === 'sos' ? 'alarm_sound' : 'default',
              channel_id: 'rise_wake_signal',
              android_channel_id: 'rise_wake_signal',
            },
            data: {
              type: 'group_wake',
              signal_type,
              sender_id: sender_user_id,
              group_id,
              route: '/rise',
            },
          }),
        });
      } catch (fcmError) {
        console.error('FCM send error:', fcmError);
      }
    }

    try {
      await supabase.from('notifications').insert({ user_id: target_user_id, title: message.title, message: message.body, type: 'wake_signal' });
    } catch (notificationError) {
      console.error('Notification record insert skipped:', notificationError);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
