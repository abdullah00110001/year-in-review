import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Pause, Eye, Square, Lock, Brain, ShieldCheck, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { MasterToggle } from './MasterToggle';
import type { PureShieldMetrics } from './types';

interface DashboardTabProps {
  running: boolean;
  metrics: PureShieldMetrics | null;
  onToggle: (v: boolean) => void;
  onPause5m: () => void;
  onTestBlur: () => void;
  onEmergencyStop: () => void;
  showFps: boolean;
  loading?: boolean;
}

export function DashboardTab({
  running,
  metrics,
  onToggle,
  onPause5m,
  onTestBlur,
  onEmergencyStop,
  showFps,
  loading,
}: DashboardTabProps) {
  const fps = useFakeFps(running && showFps, metrics?.lastInferenceMs ?? 30);

  return (
    <div className="space-y-5 mt-5">
      <MasterToggle enabled={running} onToggle={onToggle} loading={loading} />

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-2.5">
        <QuickAction icon={Pause} label="Pause 5m" tone="amber" onClick={onPause5m} disabled={!running} />
        <QuickAction icon={Eye} label="Test Blur" tone="primary" onClick={onTestBlur} />
        <QuickAction icon={Square} label="Emergency" tone="rose" onClick={onEmergencyStop} disabled={!running} />
      </div>

      {/* Live metrics row */}
      <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Live Metrics
            </span>
          </div>
          {running && (
            <span className="flex items-center gap-1.5 text-[11px] text-emerald-500 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Running
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 divide-x divide-y divide-border/50">
          <MetricCell label="Device Tier" value={metrics?.deviceTier ?? '—'} />
          <MetricCell label="Sample Rate" value={metrics ? `${metrics.sampleIntervalMs}ms` : '—'} />
          <MetricCell
            label="Last Inference"
            value={metrics ? `${metrics.lastInferenceMs}ms` : 'Not running yet'}
          />
          <MetricCell
            label="Battery"
            value={metrics ? `${metrics.batteryLevel}%` : '—'}
            tone={
              !metrics
                ? undefined
                : metrics.batteryLevel > 50
                  ? 'good'
                  : metrics.batteryLevel > 20
                    ? 'warn'
                    : 'bad'
            }
          />
          <MetricCell
            label="Thermal"
            value={metrics?.thermalStatus ?? '—'}
            tone={
              !metrics
                ? undefined
                : metrics.thermalStatus === 'Normal'
                  ? 'good'
                  : metrics.thermalStatus === 'Warning'
                    ? 'warn'
                    : 'bad'
            }
          />
          <MetricCell
            label="FPS"
            value={showFps && running ? `${fps}` : 'Off'}
            tone={showFps && running ? (fps > 20 ? 'good' : fps > 10 ? 'warn' : 'bad') : undefined}
          />
        </div>
      </div>

      {/* Trust indicators */}
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20">
            <Lock className="h-3 w-3 mr-1" /> 100% On-Device
          </Badge>
          <Badge variant="outline" className="border-border/60">
            <Brain className="h-3 w-3 mr-1" /> BlazeFace + MobileNetV3
          </Badge>
        </div>
        <p className="text-xs font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5" />
          No data leaves your phone.
        </p>
      </div>
    </div>
  );
}

function QuickAction({
  icon: Icon,
  label,
  onClick,
  disabled,
  tone,
}: {
  icon: any;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tone: 'primary' | 'amber' | 'rose';
}) {
  const tones = {
    primary: 'border-primary/30 bg-primary/5 text-primary hover:bg-primary/10',
    amber: 'border-amber-500/30 bg-amber-500/5 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10',
    rose: 'border-rose-500/30 bg-rose-500/5 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10',
  };
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'rounded-2xl border p-3 flex flex-col items-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
        tones[tone],
      )}
    >
      <Icon className="h-5 w-5" />
      <span className="text-[11px] font-medium">{label}</span>
    </motion.button>
  );
}

function MetricCell({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone?: 'good' | 'warn' | 'bad';
}) {
  const color =
    tone === 'good'
      ? 'text-emerald-500'
      : tone === 'warn'
        ? 'text-amber-500'
        : tone === 'bad'
          ? 'text-rose-500'
          : 'text-foreground';
  return (
    <div className="p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={cn('mt-1 text-sm font-semibold', color)}>{value}</div>
    </div>
  );
}

// Lightweight pseudo-FPS derived from inference time (placeholder until native exposes real FPS)
function useFakeFps(active: boolean, lastInferenceMs: number): number {
  const [fps, setFps] = useState(0);
  const ref = useRef<number | null>(null);
  useEffect(() => {
    if (!active) {
      setFps(0);
      return;
    }
    const tick = () => {
      const target = lastInferenceMs > 0 ? Math.min(60, Math.round(1000 / Math.max(20, lastInferenceMs))) : 0;
      // small jitter
      const jitter = Math.round((Math.random() - 0.5) * 2);
      setFps(Math.max(0, target + jitter));
      ref.current = window.setTimeout(tick, 1000);
    };
    tick();
    return () => { if (ref.current) clearTimeout(ref.current); };
  }, [active, lastInferenceMs]);
  return fps;
}

export default DashboardTab;
