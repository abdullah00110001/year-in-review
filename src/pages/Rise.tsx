import { useState } from 'react';
import { AlarmClock, Plus, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { 
  scheduleRiseAlarm, 
  cancelRiseAlarm, 
  canScheduleExactAlarms, 
  openExactAlarmSettings 
} from '@/lib/capacitor/riseAlarmBridge';

interface Alarm {
  id: number;
  timeString: string;
  timeInMillis: number;
  isActive: boolean;
}

export default function Rise() {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [selectedTime, setSelectedTime] = useState<string>('04:00'); // ডিফল্ট ভোর ৪টা

  // ==========================================
  // ⏰ অ্যালার্ম সেট করার লজিক
  // ==========================================
  const handleSetAlarm = async () => {
    try {
      // ১. Android 12+ পারমিশন চেক
      const hasPermission = await canScheduleExactAlarms();
      if (!hasPermission) {
        toast.error("Exact Alarm permission required!");
        await openExactAlarmSettings();
        return;
      }

      // ২. সময় ক্যালকুলেশন (আজ নাকি আগামীকাল বাজবে)
      const now = new Date();
      const [hours, minutes] = selectedTime.split(':').map(Number);
      
      const alarmDate = new Date();
      alarmDate.setHours(hours, minutes, 0, 0);

      // যদি সিলেক্ট করা সময় আজকের পার হয়ে গিয়ে থাকে, তবে আগামীকালের জন্য সেট হবে
      if (alarmDate.getTime() <= now.getTime()) {
        alarmDate.setDate(alarmDate.getDate() + 1);
      }

      const timeInMillis = alarmDate.getTime();
      const alarmId = Math.floor(Math.random() * 100000); // ইউনিক আইডি

      // ৩. নেটিভ ইঞ্জিনে অ্যালার্ম পাঠানো
      const success = await scheduleRiseAlarm(
        alarmId, 
        timeInMillis, 
        "Rise & Shine!", 
        "It's time to wake up and conquer the day!"
      );

      if (success) {
        const newAlarm: Alarm = {
          id: alarmId,
          timeString: selectedTime,
          timeInMillis: timeInMillis,
          isActive: true
        };
        setAlarms([...alarms, newAlarm]);
        toast.success(`Alarm set for ${alarmDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`);
      } else {
        toast.error("Failed to set alarm in native engine");
      }
    } catch (error) {
      toast.error("An error occurred while setting the alarm");
      console.error(error);
    }
  };

  // ==========================================
  // 🛑 অ্যালার্ম ক্যানসেল বা ডিলিট করার লজিক
  // ==========================================
  const handleDeleteAlarm = async (id: number) => {
    const success = await cancelRiseAlarm(id);
    if (success) {
      setAlarms(alarms.filter(a => a.id !== id));
      toast.info("Alarm cancelled successfully");
    } else {
      toast.error("Failed to cancel alarm");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20">
      
      {/* 🌅 Header */}
      <div className="pt-14 pb-6 px-6 bg-slate-900/50 border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-amber-500/20">
            <AlarmClock className="h-7 w-7 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Rise</h1>
            <p className="text-xs font-medium mt-1 text-amber-400/80">
              Master your morning routine
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        
        {/* ⏰ Set New Alarm Card */}
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-6">
            <div className="flex flex-col items-center gap-6">
              
              {/* Native Time Input */}
              <input 
                type="time" 
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="bg-transparent text-5xl font-bold text-center text-white focus:outline-none w-full"
              />

              <Button 
                onClick={handleSetAlarm}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white rounded-xl h-12 text-lg font-medium shadow-[0_0_20px_rgba(245,158,11,0.2)] transition-all"
              >
                <Plus className="h-5 w-5 mr-2" />
                Set Alarm
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 📋 Active Alarms List */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-white/60 px-1">Active Alarms</h3>
          
          {alarms.length === 0 ? (
            <div className="p-8 text-center text-white/30 border border-white/5 border-dashed rounded-2xl">
              <AlarmClock className="h-8 w-8 mx-auto mb-3 opacity-20" />
              <p>No alarms set.</p>
            </div>
          ) : (
            alarms.map((alarm) => (
              <Card key={alarm.id} className="bg-white/5 border-white/10">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold tracking-tight">{alarm.timeString}</h2>
                    <p className="text-xs text-white/40 mt-1">
                      {new Date(alarm.timeInMillis).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleDeleteAlarm(alarm.id)}
                    className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 h-12 w-12 rounded-full"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
