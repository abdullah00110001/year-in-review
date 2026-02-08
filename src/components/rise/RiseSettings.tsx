import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { 
  Rocket,
  AlarmClock,
  X,
  Settings,
  Bell,
  HelpCircle,
  MessageSquare,
  ShieldCheck,
  BatteryMedium,
  Volume2,
  Smartphone,
  ChevronRight,
  Shield,
  Zap,
  Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { isNative } from '@/lib/capacitor/platform';

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

function SettingItem({ 
  icon, 
  title, 
  description, 
  value, 
  hasChevron, 
  hasSwitch,
  switchValue,
  onSwitchChange,
  onClick,
  iconColor = 'text-muted-foreground'
}: SettingItemProps) {
  return (
    <button 
      className="w-full flex items-center justify-between p-4 bg-card rounded-xl hover:bg-muted/50 transition-colors"
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <span className={iconColor}>{icon}</span>
        <div className="text-left">
          <p className="font-medium text-sm">{title}</p>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {value && <span className="text-sm text-amber-500">{value}</span>}
        {hasSwitch && (
          <Switch 
            checked={switchValue} 
            onCheckedChange={onSwitchChange}
            onClick={(e) => e.stopPropagation()}
          />
        )}
        {hasChevron && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
      </div>
    </button>
  );
}

export function RiseSettings() {
  const [useBuiltInSpeaker, setUseBuiltInSpeaker] = useState(true);
  const [showNextAlarmNotification, setShowNextAlarmNotification] = useState(false);
  const [preventLastMinuteEdits, setPreventLastMinuteEdits] = useState(false);
  const [preventUninstall, setPreventUninstall] = useState(false);
  const [autoDismiss, setAutoDismiss] = useState(false);
  const [muteDuringMission, setMuteDuringMission] = useState(true);

  const [optimizationOpen, setOptimizationOpen] = useState(false);

  return (
    <div className="space-y-4">
      {/* Alarm Optimization */}
      <Collapsible open={optimizationOpen} onOpenChange={setOptimizationOpen}>
        <CollapsibleTrigger asChild>
          <Card className="cursor-pointer hover:border-primary/30 transition-colors">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Rocket className="h-5 w-5 text-rose-500" />
                <span className="font-medium">Alarm optimization</span>
              </div>
              <ChevronRight className={cn(
                "h-4 w-4 text-muted-foreground transition-transform",
                optimizationOpen && "rotate-90"
              )} />
            </CardContent>
          </Card>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2 space-y-2">
          <Card className="bg-muted/30">
            <CardContent className="p-4 space-y-4">
              <div>
                <h3 className="font-bold text-lg mb-2">Your alarm isn't ringing?</h3>
                <p className="text-sm text-muted-foreground">
                  Alarms may be blocked by the phone's system. Check the following guidelines!
                </p>
              </div>

              <SettingItem
                icon={<ShieldCheck className="h-5 w-5" />}
                title="2 Essential permissions"
                description={isNative ? "Grant alarm permissions" : "Available on native app"}
                iconColor="text-rose-500"
                hasChevron
              />

              <SettingItem
                icon={<Bell className="h-5 w-5" />}
                title="Allow in Do Not Disturb mode"
                description="Ensure alarms ring during DND"
                iconColor="text-amber-500"
                hasChevron
              />

              <SettingItem
                icon={<BatteryMedium className="h-5 w-5" />}
                title="Exclude from battery optimization"
                description="Prevent system from killing the app"
                iconColor="text-blue-500"
                hasChevron
              />

              <Button variant="outline" className="w-full">
                <MessageSquare className="h-4 w-4 mr-2" />
                Send feedback
              </Button>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Alarm Settings */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <AlarmClock className="h-4 w-4" />
            Alarm Setting
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground px-1">Volume and Sound</p>
            <SettingItem
              icon={<Volume2 className="h-5 w-5" />}
              title="Use the built-in speaker"
              description="Always ring through device speaker"
              hasSwitch
              switchValue={useBuiltInSpeaker}
              onSwitchChange={setUseBuiltInSpeaker}
            />
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground px-1">Upcoming Alarms</p>
            <SettingItem
              icon={<Smartphone className="h-5 w-5" />}
              title="Show next alarm in notification drawer"
              description="Next alarm will appear as a notification"
              hasSwitch
              switchValue={showNextAlarmNotification}
              onSwitchChange={setShowNextAlarmNotification}
            />
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground px-1">Alarm Cheat Prevention</p>
            <SettingItem
              icon={<Lock className="h-5 w-5" />}
              title="Prevent last-minute edits to alarm"
              value={preventLastMinuteEdits ? "On" : "Off"}
              iconColor="text-rose-500"
              hasChevron
              onClick={() => setPreventLastMinuteEdits(!preventLastMinuteEdits)}
            />
            <SettingItem
              icon={<Shield className="h-5 w-5" />}
              title="Prevent app uninstall during alarm"
              hasSwitch
              switchValue={preventUninstall}
              onSwitchChange={setPreventUninstall}
            />
          </div>
        </CardContent>
      </Card>

      {/* Dismiss Alarm/Mission */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <X className="h-4 w-4" />
            Dismiss Alarm/Mission
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground px-1">Alarm Dismissal</p>
            <SettingItem
              icon={<Zap className="h-5 w-5" />}
              title="Auto dismiss"
              description="Turn off alarm if unresponsive for a certain amount of time"
              value={autoDismiss ? "On" : "Off"}
              hasChevron
              onClick={() => setAutoDismiss(!autoDismiss)}
            />
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground px-1">Mission Dismissal</p>
            <SettingItem
              icon={<Volume2 className="h-5 w-5" />}
              title="Mute during mission"
              hasSwitch
              switchValue={muteDuringMission}
              onSwitchChange={setMuteDuringMission}
            />
            <SettingItem
              icon={<Settings className="h-5 w-5" />}
              title="Mute during mission limit"
              description="Not muted when the max limit is exceeded"
              value="3 times"
              hasChevron
            />
          </div>
        </CardContent>
      </Card>

      {/* General */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Settings className="h-4 w-4" />
            General
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <SettingItem
            icon={<Bell className="h-5 w-5" />}
            title="Notices"
            iconColor="text-rose-500"
            hasChevron
          />
          <SettingItem
            icon={<HelpCircle className="h-5 w-5" />}
            title="FAQ"
            hasChevron
          />
          <SettingItem
            icon={<MessageSquare className="h-5 w-5" />}
            title="Send feedback"
            hasChevron
          />
        </CardContent>
      </Card>
    </div>
  );
}
