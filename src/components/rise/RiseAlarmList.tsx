import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  Bell, 
  Users, 
  Sunrise,
  Moon,
  Trash2
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface RiseAlarm {
  id: string;
  alarm_time: string;
  days_of_week: number[];
  alarm_type: string;
  is_enabled: boolean;
  intention: string | null;
  label: string | null;
  verification_type: string;
  snooze_limit: number;
}

interface RiseAlarmListProps {
  alarms: RiseAlarm[];
  onToggle: (id: string, enabled: boolean) => void;
  onRefresh: () => void;
}

export function RiseAlarmList({ alarms, onToggle, onRefresh }: RiseAlarmListProps) {
  const { user } = useAuth();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newAlarm, setNewAlarm] = useState({
    alarm_time: '06:00',
    days_of_week: [0, 1, 2, 3, 4, 5, 6],
    alarm_type: 'personal',
    intention: '',
    label: '',
    verification_type: 'breath_hold'
  });

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return { time: `${displayHour}:${minutes}`, ampm };
  };

  const getDayLabels = (days: number[]) => {
    const labels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    return labels.map((l, i) => ({
      label: l,
      active: days.includes(i)
    }));
  };

  const toggleDay = (day: number) => {
    setNewAlarm(prev => ({
      ...prev,
      days_of_week: prev.days_of_week.includes(day)
        ? prev.days_of_week.filter(d => d !== day)
        : [...prev.days_of_week, day].sort()
    }));
  };

  const createAlarm = async () => {
    if (!user) return;

    const { error } = await supabase
      .from('rise_alarms')
      .insert({
        user_id: user.id,
        ...newAlarm,
        is_enabled: true,
        snooze_limit: 3,
        snooze_interval_minutes: 5
      });

    if (error) {
      toast.error('Failed to create alarm');
      return;
    }

    toast.success('Alarm created!');
    setShowCreateDialog(false);
    setNewAlarm({
      alarm_time: '06:00',
      days_of_week: [0, 1, 2, 3, 4, 5, 6],
      alarm_type: 'personal',
      intention: '',
      label: '',
      verification_type: 'breath_hold'
    });
    onRefresh();
  };

  const deleteAlarm = async (alarmId: string) => {
    const { error } = await supabase
      .from('rise_alarms')
      .delete()
      .eq('id', alarmId);

    if (error) {
      toast.error('Failed to delete alarm');
      return;
    }

    toast.success('Alarm deleted');
    onRefresh();
  };

  const getAlarmTypeIcon = (type: string) => {
    switch (type) {
      case 'group': return <Users className="h-4 w-4" />;
      case 'fajr': return <Moon className="h-4 w-4" />;
      case 'recovery': return <Sunrise className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Create Alarm Button */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogTrigger asChild>
          <Button className="w-full h-14 rounded-2xl" size="lg">
            <Plus className="h-5 w-5 mr-2" />
            Add New Alarm
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Alarm</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Time Picker */}
            <div className="text-center">
              <Input
                type="time"
                value={newAlarm.alarm_time}
                onChange={(e) => setNewAlarm(prev => ({ ...prev, alarm_time: e.target.value }))}
                className="text-4xl h-20 text-center font-bold"
              />
            </div>

            {/* Days Selection */}
            <div className="space-y-2">
              <Label>Repeat</Label>
              <div className="flex justify-between">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                  <Button
                    key={i}
                    variant={newAlarm.days_of_week.includes(i) ? 'default' : 'outline'}
                    size="icon"
                    className="h-10 w-10 rounded-full"
                    onClick={() => toggleDay(i)}
                  >
                    {day}
                  </Button>
                ))}
              </div>
            </div>

            {/* Alarm Type */}
            <div className="space-y-2">
              <Label>Alarm Type</Label>
              <Select 
                value={newAlarm.alarm_type}
                onValueChange={(value) => setNewAlarm(prev => ({ ...prev, alarm_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personal">🔔 Personal Alarm</SelectItem>
                  <SelectItem value="group">👥 Group Alarm</SelectItem>
                  <SelectItem value="fajr">🌙 Fajr Alarm</SelectItem>
                  <SelectItem value="recovery">🌅 Recovery Alarm</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Verification Type */}
            <div className="space-y-2">
              <Label>Wake Verification</Label>
              <Select 
                value={newAlarm.verification_type}
                onValueChange={(value) => setNewAlarm(prev => ({ ...prev, verification_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="breath_hold">🌬️ Breath Hold (5 seconds)</SelectItem>
                  <SelectItem value="morning_intention">✍️ Type "I am awake"</SelectItem>
                  <SelectItem value="stand_detection">🧍 Stand Up Detection</SelectItem>
                  <SelectItem value="photo">📸 Take Morning Photo</SelectItem>
                  <SelectItem value="none">❌ No Verification</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Intention */}
            <div className="space-y-2">
              <Label>Why are you waking up? (Optional)</Label>
              <Textarea
                placeholder="e.g., Fajr prayer and morning study"
                value={newAlarm.intention}
                onChange={(e) => setNewAlarm(prev => ({ ...prev, intention: e.target.value }))}
                rows={2}
              />
              <p className="text-xs text-muted-foreground">
                This will appear when your alarm rings
              </p>
            </div>

            {/* Label */}
            <div className="space-y-2">
              <Label>Label (Optional)</Label>
              <Input
                placeholder="e.g., Wake up early"
                value={newAlarm.label}
                onChange={(e) => setNewAlarm(prev => ({ ...prev, label: e.target.value }))}
              />
            </div>

            <Button className="w-full" onClick={createAlarm}>
              Create Alarm
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Alarms List */}
      {alarms.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Sunrise className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
            <h3 className="font-semibold mb-1">No Alarms Set</h3>
            <p className="text-sm text-muted-foreground">
              Create an alarm to start your disciplined mornings
            </p>
          </CardContent>
        </Card>
      ) : (
        alarms.map((alarm) => {
          const { time, ampm } = formatTime(alarm.alarm_time);
          const days = getDayLabels(alarm.days_of_week);
          
          return (
            <Card 
              key={alarm.id}
              className={cn(
                'transition-all',
                !alarm.is_enabled && 'opacity-50'
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Days */}
                    <div className="flex gap-1 mb-2">
                      {days.map((d, i) => (
                        <span 
                          key={i}
                          className={cn(
                            'text-xs font-medium w-5 h-5 flex items-center justify-center rounded',
                            d.active 
                              ? 'bg-primary text-primary-foreground' 
                              : 'text-muted-foreground'
                          )}
                        >
                          {d.label}
                        </span>
                      ))}
                    </div>

                    {/* Time */}
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold">{time}</span>
                      <span className="text-lg text-muted-foreground">{ampm}</span>
                      {getAlarmTypeIcon(alarm.alarm_type)}
                    </div>

                    {/* Label/Intention */}
                    {(alarm.label || alarm.intention) && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xl">💡</span>
                        <span className="text-sm text-muted-foreground">
                          {alarm.label || alarm.intention}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={alarm.is_enabled}
                      onCheckedChange={(checked) => onToggle(alarm.id, checked)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => deleteAlarm(alarm.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}