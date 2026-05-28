import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Rocket, AlarmClock, X, Settings, Bell, HelpCircle, MessageSquare,
  ShieldCheck, BatteryMedium, Volume2, Smartphone, ChevronRight,
  Shield, Zap, Lock, Moon, Globe
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { isNative } from '@/lib/capacitor/platform';
import { requestAllAlarmPermissions } from '@/lib/capacitor/nativeAlarm';
import { requestNotificationPermission, openBatterySettings } from '@/lib/capacitor/permissions';
import { useGroupSettings } from '@/hooks/useGroupSettings';
import { toast } from 'sonner';

interface SettingItemProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  value?: string;
  hasChevron?: boolean;
  hasSwitch?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
  onClick?: () => void;
  iconColor?: string;
}

function SettingItem({ icon, title, description, value, hasChevron, hasSwitch, switchValue, onSwitchChange, onClick, iconColor = 'text-muted-foreground' }: SettingItemProps) {
  return (
    <button className="w-full flex items-center justify-between p-4 bg-card rounded-xl hover:bg-muted/50 transition-colors" onClick={onClick}>
      <div className="flex items-center gap-3">
        <span className={iconColor}>{icon}</span>
        <div className="text-left">
          <p className="font-medium text-sm">{title}</p>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {value && <span className="text-sm text-primary">{value}</span>}
        {hasSwitch && <Switch checked={switchValue} onCheckedChange={onSwitchChange} onClick={(e) => e.stopPropagation()} />}
        {hasChevron && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
      </div>
    </button>
  );
}

export function RiseSettings() {
  const { settings, updateSettings } = useGroupSettings();
  const [useBuiltInSpeaker, setUseBuiltInSpeaker] = useState(true);
  const [showNextAlarmNotification, setShowNextAlarmNotification] = useState(false);
  const [preventLastMinuteEdits, setPreventLastMinuteEdits] = useState(false);
  const [preventUninstall, setPreventUninstall] = useState(false);
  const [autoDismiss, setAutoDismiss] = useState(false);
  const [muteDuringMission, setMuteDuringMission] = useState(true);
  const [optimizationOpen, setOptimizationOpen] = useState(false);
  const [dndOpen, setDndOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [cityInput, setCityInput] = useState(settings.city);

  return (
    <div className="space-y-4">
      <Collapsible open={dndOpen} onOpenChange={setDndOpen}>
        <CollapsibleTrigger asChild>
          <Card className="cursor-pointer hover:border-primary/30 transition-colors">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Moon className="h-5 w-5 text-primary" />
                <div>
                  <span className="font-medium">Do Not Disturb</span>
                  {settings.dndEnabled && <p className="text-xs text-destructive">Enabled</p>}
                </div>
              </div>
              <ChevronRight className={cn('h-4 w-4 text-muted-foreground transition-transform', dndOpen && 'rotate-90')} />
            </CardContent>
          </Card>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2">
          <Card className="bg-muted/30">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">DND mode</p>
                  <p className="text-xs text-muted-foreground">Other members will not be able to send wake signals</p>
                </div>
                <Switch checked={settings.dndEnabled} onCheckedChange={(v) => updateSettings({ dndEnabled: v })} />
              </div>
              {settings.dndEnabled && (
                <div className="space-y-2">
                  <Label>Reason shown to the group</Label>
                  <Input placeholder="Example: Sick today" value={settings.dndReason} onChange={(e) => updateSettings({ dndReason: e.target.value })} />
                </div>
              )}
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      <Collapsible open={locationOpen} onOpenChange={setLocationOpen}>
        <CollapsibleTrigger asChild>
          <Card className="cursor-pointer hover:border-primary/30 transition-colors">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-primary" />
                <div>
                  <span className="font-medium">Location sharing</span>
                  {settings.locationOptIn && <p className="text-xs text-emerald-500">{settings.city || 'Enabled'}</p>}
                </div>
              </div>
              <ChevronRight className={cn('h-4 w-4 text-muted-foreground transition-transform', locationOpen && 'rotate-90')} />
            </CardContent>
          </Card>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2">
          <Card className="bg-muted/30">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Show me in the community feed</p>
                  <p className="text-xs text-muted-foreground">Only your city will be shared</p>
                </div>
                <Switch checked={settings.locationOptIn} onCheckedChange={(v) => updateSettings({ locationOptIn: v })} />
              </div>
              {settings.locationOptIn && (
                <div className="space-y-2">
                  <Label>Your city</Label>
                  <div className="flex gap-2">
                    <Input placeholder="Example: Dhaka" value={cityInput} onChange={(e) => setCityInput(e.target.value)} />
                    <Button size="sm" onClick={() => { updateSettings({ city: cityInput.trim() }); toast.success('City saved'); }}>Save</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      <Collapsible open={optimizationOpen} onOpenChange={setOptimizationOpen}>
        <CollapsibleTrigger asChild>
          <Card className="cursor-pointer hover:border-primary/30 transition-colors">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Rocket className="h-5 w-5 text-primary" />
                <span className="font-medium">Alarm reliability</span>
              </div>
              <ChevronRight className={cn('h-4 w-4 text-muted-foreground transition-transform', optimizationOpen && 'rotate-90')} />
            </CardContent>
          </Card>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2 space-y-2">
          <Card className="bg-muted/30">
            <CardContent className="p-4 space-y-4">
              <div>
                <h3 className="font-bold text-lg mb-2">Alarm not ringing?</h3>
                <p className="text-sm text-muted-foreground">Grant notification access, allow alarms, and disable battery restrictions for best results.</p>
              </div>
              <Button className="w-full" onClick={async () => {
                const granted = await requestAllAlarmPermissions();
                if (granted) toast.success('Alarm permissions granted');
                else toast.error('Alarm permissions are still blocked');
              }}>
                <ShieldCheck className="h-4 w-4 mr-2" />Grant alarm permissions
              </Button>
              <Button variant="outline" className="w-full" onClick={async () => {
                const result = await requestNotificationPermission();
                if (result === 'granted') toast.success('Notifications enabled');
                else toast.error('Notification permission denied');
              }}>
                <Bell className="h-4 w-4 mr-2" />Enable notifications
              </Button>
              {isNative && (
                <Button variant="outline" className="w-full" onClick={() => { openBatterySettings(); toast.success('Opening battery settings'); }}>
                  <BatteryMedium className="h-4 w-4 mr-2" />Open battery settings
                </Button>
              )}
              <Button variant="outline" className="w-full"><MessageSquare className="h-4 w-4 mr-2" />Send feedback</Button>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2"><AlarmClock className="h-4 w-4" />Alarm settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <SettingItem icon={<Volume2 className="h-5 w-5" />} title="Use built-in speaker" description="Prefer device speaker for alarms" hasSwitch switchValue={useBuiltInSpeaker} onSwitchChange={setUseBuiltInSpeaker} />
          <SettingItem icon={<Smartphone className="h-5 w-5" />} title="Show next alarm notification" hasSwitch switchValue={showNextAlarmNotification} onSwitchChange={setShowNextAlarmNotification} />
          <SettingItem icon={<Lock className="h-5 w-5" />} title="Prevent last-minute edits" value={preventLastMinuteEdits ? 'On' : 'Off'} hasChevron onClick={() => setPreventLastMinuteEdits(!preventLastMinuteEdits)} iconColor="text-primary" />
          <SettingItem icon={<Shield className="h-5 w-5" />} title="Discourage uninstall during alarm" hasSwitch switchValue={preventUninstall} onSwitchChange={setPreventUninstall} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2"><X className="h-4 w-4" />Dismiss and mission</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <SettingItem icon={<Zap className="h-5 w-5" />} title="Auto dismiss" description="Stop after a timeout if you do not respond" value={autoDismiss ? 'On' : 'Off'} hasChevron onClick={() => setAutoDismiss(!autoDismiss)} />
          <SettingItem icon={<Volume2 className="h-5 w-5" />} title="Mute during mission" hasSwitch switchValue={muteDuringMission} onSwitchChange={setMuteDuringMission} />
          <SettingItem icon={<Settings className="h-5 w-5" />} title="Mute limit" description="Mute will be ignored after the limit" value="3 times" hasChevron />
        </CardContent>
      </Card>
    </div>
  );
}
