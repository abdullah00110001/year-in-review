import { useEffect, useRef, useState } from 'react';
import { isNative } from '@/lib/capacitor/platform';

/**
 * Capawesome Live Update integration (OTA).
 *
 * Native: dynamically imports @capawesome/capacitor-live-update if installed
 * in the native project, calls sync(), and reloads if a new bundle is staged.
 * Web: no-op.
 *
 * The dynamic import is wrapped so missing native plugins never crash the app.
 */
export function useLiveUpdate(opts?: { onApplied?: () => void; onForce?: () => void }) {
  const checkedRef = useRef(false);
  const [applied, setApplied] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(false);

  useEffect(() => {
    if (!isNative || checkedRef.current) return;
    checkedRef.current = true;

    (async () => {
      try {
        // Resolve at runtime via a variable so TS/Vite don't try to statically
        // resolve a plugin that may only exist in the native project.
        const pkg = '@capawesome/capacitor-live-update';
        const mod: any = await import(/* @vite-ignore */ pkg).catch(() => null);
        if (!mod?.LiveUpdate) return;

        const LiveUpdate = mod.LiveUpdate;
        const result = await LiveUpdate.sync().catch(() => null);
        if (!result) return;

        if (result.nextBundleId) {
          // Stage applied — non-blocking toast handled by caller via onApplied
          setApplied(true);
          opts?.onApplied?.();
          // Reload into the new bundle on next idle tick
          setTimeout(() => LiveUpdate.reload().catch(() => {}), 600);
        }
      } catch (err) {
        console.warn('[LiveUpdate] sync skipped:', err);
      }
    })();
  }, [opts]);

  return { applied, forceUpdate, setForceUpdate };
}
