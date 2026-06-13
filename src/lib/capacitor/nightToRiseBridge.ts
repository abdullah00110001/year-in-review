/**
 * nightToRiseBridge — JS → native bridge for syncing Night-to-Rise config
 * into Android SharedPreferences, so the ShieldAccessibilityService can
 * enforce the lock at the OS level. Web/iOS: silent no-op.
 *
 * Native plugin name (to be implemented on Android): `NightToRise` with
 * methods setConfig({ json }) and setRiseAlarm({ epochMillis }).
 */

import { registerPlugin, Capacitor } from '@capacitor/core';
import type { NightToRiseConfig } from '@/components/rise/night-to-rise/types';

interface NightToRiseNativePlugin {
  setConfig(options: { json: string }): Promise<void>;
  setRiseAlarm(options: { epochMillis: number }): Promise<void>;
}

const Plugin = registerPlugin<NightToRiseNativePlugin>('NightToRise');

const isAndroid = Capacitor.getPlatform() === 'android';

export const nightToRiseBridge = {
  async setConfig(cfg: NightToRiseConfig): Promise<void> {
    if (!isAndroid) return;
    try { await Plugin.setConfig({ json: JSON.stringify(cfg) }); } catch (e) {
      console.warn('[NightToRise bridge] setConfig failed', e);
    }
  },
  async setRiseAlarm(epochMillis: number): Promise<void> {
    if (!isAndroid) return;
    try { await Plugin.setRiseAlarm({ epochMillis }); } catch (e) {
      console.warn('[NightToRise bridge] setRiseAlarm failed', e);
    }
  },
};
