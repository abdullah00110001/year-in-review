import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Bed, Sun } from 'lucide-react';
import { MathMission } from '@/components/rise/missions/MathMission';
import { ShakeMission } from '@/components/rise/missions/ShakeMission';
import { BarcodeMission } from '@/components/rise/missions/BarcodeMission';
import { PhotoMission } from '@/components/rise/missions/PhotoMission';
import { WakeStatusModal } from '@/components/rise/WakeStatusModal';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { isNative } from '@/lib/capacitor/platform';
import { cancelAlarmByUuid } from '@/lib/capacitor/nativeAlarm';
import { toast } from 'sonner';
import { stopNativeRinging, clearRingingAlarmId } from '@/lib/capacitor/riseAlarmBridge';
import { setPresence } from '@/hooks/useLifeosLive';
import { supabase } from '@/integrations/supabase/client';
import { App } from '@capacitor/app';
import { format } from 'date-fns';
import { recordWakeEvent } from '@/lib/rise/recordWakeEvent';
import { LocationPrivacySheet } from '@/components/rise/LocationPrivacySheet';

interface LocalAlarm {
  id: string;
  alarm_time: string;
  label: string | null;
  intention: string | null;
  verification_type: string;
  snooze_limit: number;
  snooze_interval_minutes: number;
  vibration_enabled?: boolean;
}

export default function RiseRingScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [alarm, setAlarm] = useState<LocalAlarm | null>(null);
  const [phase, setPhase] = useState<'wake' | 'mission'>('wake');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const [showPrivacySheet, setShowPrivacySheet] = useState(false);

  useEffect(() => {
    setPresence({ status: phase === 'wake' ? 'waking' : 'in_rise_mission' });
  }, [phase]);
  const [now, setNow] = useState(new Date());
  const [snoozesLeft, setSnoozesLeft] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const vibrationTimer = useRef<number | null>(null);
  const hasClearedRinging = useRef(false);

  // 🟢 1. ব্যাক বাটন + অ্যাপ কিল ব্লক - Alarmy স্টাইল
  useEffect(() => {
    const handler = App.addListener('backButton', (e) => {
      // ব্যাক বাটন কাজ করবে না
      toast.error('Complete the mission to dismiss', { duration: 1000 });
    });

    // হোম বাটনে গেলেও আবার ফিরে আসবে
    const stateHandler = App.addListener('appStateChange', ({ isActive }) => {
      if (!isActive && phase === 'wake') {
        // ইউজার অন্য অ্যাপে গেলে আবার ফিরিয়ে আনো
        setTimeout(() => {
          navigate(`/rise/ring/${id}`, { replace: true });
        }, 500);
      }
    });

    return () => {
      handler.then(h => h.remove());
      stateHandler.then(h => h.remove());
    };
  }, [id, phase, navigate]);

  // 🟢 2. মাউন্ট হলে সাউন্ড বন্ধ করবা না! শুধু ID ক্লিয়ার
  useEffect(() => {
    const initRingScreen = async () => {
      if (hasClearedRinging.current) return;
      hasClearedRinging.current = true;

      try {
        // 🟢 এই লাইন ডিলিট করো - এইটাই সাউন্ড 1 বারের পর বন্ধ করতেছিল
        // await stopNativeRinging(); ← ডিলিট

        await clearRingingAlarmId(); // শুধু ID ক্লিয়ার, সাউন্ড চলবে
      } catch (e) {
        console.error('Failed to clear ringing ID:', e);
      }
    };

    if (isNative) {
      initRingScreen();
    }
  }, []);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('local_alarms') || '[]');
      const found = stored.find((a: any) => String(a.id) === String(id));
      if (found) {
        setAlarm(found);
        setSnoozesLeft(found.snooze_limit?? 3);
      } else {
        setAlarm({
          id: id || 'emergency-fallback',
          alarm_time: new Date().toTimeString().slice(0, 5),
          label: 'Wake Up',
          intention: 'Time to start the day',
          verification_type: 'math',
          snooze_limit: 3,
          snooze_interval_minutes: 5,
          vibration_enabled: true,
        });
        setSnoozesLeft(3);
      }
    } catch (e) {
      console.error("Error loading alarm for ring screen", e);
    }
  }, [id]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!alarm) return;

    // Web এর জন্য ফেক সাউন্ড
    if (!isNative) {
      try {
        const audio = new Audio(
          'data:audio/wav;base64,UklGRkIDAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YR4DAAB/f39/f4B/f4F/gIB/gH9/gIB/f3+Af3+Af3+Af4B/gH9/gH9/gIB/f4B/f4B/f4F/gIB/gH9/gIB/'
        );
        audio.loop = true;
        audio.volume = 0.6;
        audio.play().catch(() => {});
        audioRef.current = audio;
      } catch {}
    }

    // Haptics - Native এ extra ভাইব্রেশন
    if (alarm.vibration_enabled!== false && isNative) {
      const buzz = async () => {
        try {
          await Haptics.impact({ style: ImpactStyle.Heavy });
        } catch {}
      };
      buzz();
      vibrationTimer.current = window.setInterval(buzz, 1500);
    }

    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
      if (vibrationTimer.current) {
        clearInterval(vibrationTimer.current);
        vibrationTimer.current = null;
      }
    };
  }, [alarm]);

  // 🟢 3. মিশন কমপ্লিট বা Snooze হলেই সাউন্ড বন্ধ করো
  const stopAlarm = async () => {
    audioRef.current?.pause();
    if (vibrationTimer.current) clearInterval(vibrationTimer.current);
    try {
      await stopNativeRinging(); // 🟢 এখানে বন্ধ করো
      await clearRingingAlarmId();
    } catch (e) {
      console.error('Failed to stop native ringing:', e);
    }
  };

  const handleMissionComplete = async () => {
    await stopAlarm();
    await setPresence({ status: 'idle' });

    if (alarm?.id && alarm.id !== 'emergency-fallback') {
      try {
        await cancelAlarmByUuid(alarm.id);
      } catch (e) {}
    }

    // Record into community wake feed (respects user privacy)
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const result = await recordWakeEvent({
          userId: user.id,
          missionType: alarm?.verification_type,
        });
        if (result && !result.hasSeenPrompt) {
          setShowPrivacySheet(true);
          return;
        }
      }
    } catch (e) {
      console.warn('recordWakeEvent failed', e);
    }

    // If group alarm, show status modal before navigating away
    const groupId = (alarm as any)?.groupId;
    if (groupId) {
      setShowStatusModal(true);
      return;
    }

    toast.success('Alarm dismissed. Have a great day! ☀️');
    navigate('/rise', { replace: true });
  };

  const handleStatusSubmit = async (text: string) => {
    if (statusBusy) return;
    setStatusBusy(true);
    try {
      const grpId = (alarm as any)?.groupId;
      if (!grpId) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Not authenticated');
        return;
      }

      const today = format(new Date(), 'yyyy-MM-dd');
      const nowIso = new Date().toISOString();

      const { data: sessionRow } = await supabase
        .from('group_wake_sessions')
        .select('id')
        .eq('group_id', grpId)
        .eq('session_date', today)
        .maybeSingle();

      let sessionId = sessionRow?.id;

      if (!sessionId) {
        const { data: alarmRow } = await supabase
          .from('group_wake_alarms')
          .select('id')
          .eq('group_id', grpId)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (alarmRow) {
          const { data: newSession } = await supabase
            .from('group_wake_sessions')
            .insert({ group_alarm_id: alarmRow.id, group_id: grpId, session_date: today })
            .select('id')
            .single();
          sessionId = newSession?.id;
        }
      }

      if (sessionId) {
        const payload: any = {
          session_id: sessionId,
          group_id: grpId,
          user_id: user.id,
          status: 'mission_done',
          status_text: text,
          mission_completed_at: nowIso,
          status_updated_at: nowIso,
        };
        await supabase.from('group_wake_member_status').upsert(payload, { onConflict: 'session_id,user_id' });
      }

      toast.success('Status shared with your group ☀️');
      setShowStatusModal(false);
      navigate('/rise', { replace: true });
    } catch (e: any) {
      console.error('Status submit failed', e);
      toast.error('Could not share status');
    } finally {
      setStatusBusy(false);
    }
  };

  const handleSnooze = async () => {
    if (snoozesLeft <= 0) {
      toast.error('No snoozes left. You must complete the mission.');
      return;
    }

    await stopAlarm(); // 🟢 Snooze এ সাউন্ড বন্ধ করো

    const mins = alarm?.snooze_interval_minutes?? 5;
    toast.success(`Snoozed for ${mins} minutes`);

    navigate('/rise', { replace: true });
  };

  if (!alarm) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <Sun className="h-12 w-12 text-amber-500 animate-spin mb-4" />
        <p>Loading your alarm mission...</p>
      </div>
    );
  }

  const hours = now.getHours();
  const minutes = now.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayH = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  const dateStr = now.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <>
      {phase === 'mission' ? (
        <div className="fixed inset-0 z-[200] bg-slate-950">
          {alarm.verification_type === 'math' && <MathMission onComplete={handleMissionComplete} requiredSolves={3} />}
          {alarm.verification_type === 'shake' && <ShakeMission onComplete={handleMissionComplete} requiredShakes={30} />}
          {(alarm.verification_type === 'qr' || alarm.verification_type === 'barcode') && (
            <BarcodeMission onComplete={handleMissionComplete} targetBarcode="WAKE-UP" />
          )}
          {alarm.verification_type === 'photo' && <PhotoMission onComplete={handleMissionComplete} registeredPlace="Bathroom sink" />}
          {(alarm.verification_type === 'none' || !['math', 'shake', 'qr', 'barcode', 'photo'].includes(alarm.verification_type)) && (
            <div className="flex flex-col h-full items-center justify-center p-6 text-white">
              <Sun className="h-20 w-20 text-amber-400 mb-6" />
              <h2 className="text-3xl font-bold mb-2">Good Morning</h2>
              <p className="text-white/60 mb-10 text-center max-w-xs">{alarm.intention}</p>
              <Button onClick={handleMissionComplete} className="h-14 px-12 bg-amber-500 hover:bg-amber-600 rounded-2xl text-lg font-semibold">
                I'm Awake
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="fixed inset-0 z-[200] bg-gradient-to-b from-amber-600 via-orange-600 to-rose-700 text-white flex flex-col">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.15),transparent_60%)] pointer-events-none" />
          <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
            <div className="mb-6">
              <Sun className="h-16 w-16 text-white/90 animate-pulse" />
            </div>
            <p className="text-sm uppercase tracking-[0.2em] text-white/70 mb-2">{dateStr}</p>
            <div className="flex items-baseline gap-2">
              <span className="text-8xl font-black tabular-nums tracking-tight">
                {displayH}:{minutes.toString().padStart(2, '0')}
              </span>
              <span className="text-2xl font-bold text-white/80">{ampm}</span>
            </div>
            {alarm.label && (
              <p className="mt-6 text-2xl font-bold text-white/95">{alarm.label}</p>
            )}
            {alarm.intention && (
              <p className="mt-3 text-base text-white/80 text-center max-w-xs italic">
                "{alarm.intention}"
              </p>
            )}
          </div>
          <div className="p-6 pb-[max(env(safe-area-inset-bottom),1.5rem)] space-y-3 relative z-10">
            <Button
              onClick={() => setPhase('mission')}
              className="w-full h-16 bg-white text-amber-700 hover:bg-white/90 rounded-2xl text-lg font-bold shadow-2xl"
            >
              <Sun className="h-5 w-5 mr-2" />
              Wake Up — Start Mission
            </Button>
            <Button
              onClick={handleSnooze}
              variant="ghost"
              disabled={snoozesLeft <= 0}
              className="w-full h-14 text-white/90 hover:bg-white/10 rounded-2xl text-base font-medium"
            >
              <Bed className="h-5 w-5 mr-2" />
              Snooze {alarm.snooze_interval_minutes}m {snoozesLeft > 0 ? `(${snoozesLeft} left)` : '(none left)'}
            </Button>
          </div>
        </div>
      )}

      <WakeStatusModal
        open={showStatusModal}
        onClose={() => {
          setShowStatusModal(false);
          navigate('/rise', { replace: true });
        }}
        onSubmit={handleStatusSubmit}
      />

      <LocationPrivacySheet
        open={showPrivacySheet}
        onOpenChange={(o) => {
          setShowPrivacySheet(o);
          if (!o) {
            toast.success('Welcome to the wake feed ☀️');
            navigate('/rise', { replace: true });
          }
        }}
      />
    </>
  );
}