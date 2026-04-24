import { useState } from 'react';
import { ScanBarcode, Camera, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  CapacitorBarcodeScanner,
  CapacitorBarcodeScannerAndroidScanningLibrary,
  CapacitorBarcodeScannerCameraDirection,
  CapacitorBarcodeScannerScanOrientation,
  CapacitorBarcodeScannerTypeHint,
} from '@capacitor/barcode-scanner';
import { isNative } from '@/lib/capacitor/platform';

interface BarcodeMissionProps {
  onComplete: () => void;
  targetBarcode: string;
}

export function BarcodeMission({ onComplete, targetBarcode }: BarcodeMissionProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [fallbackCode, setFallbackCode] = useState('');
  const [showFallback, setShowFallback] = useState(false);

  const verifyBarcode = (scannedCode: string) => {
    if (scannedCode === targetBarcode) {
      toast.success('Barcode matched! Good morning!');
      window.setTimeout(() => onComplete(), 1000);
      return;
    }

    toast.error('Wrong barcode! Get out of bed and find the right one.');
  };

  const startScan = async () => {
    if (!isNative) {
      toast.info('Use the emergency code on web preview.');
      setShowFallback(true);
      return;
    }

    try {
      setIsScanning(true);
      const result = await CapacitorBarcodeScanner.scanBarcode({
        hint: CapacitorBarcodeScannerTypeHint.ALL,
        scanInstructions: 'Scan the barcode you saved earlier',
        scanButton: true,
        scanText: 'Scan barcode',
        cameraDirection: CapacitorBarcodeScannerCameraDirection.BACK,
        scanOrientation: CapacitorBarcodeScannerScanOrientation.PORTRAIT,
        android: {
          scanningLibrary: CapacitorBarcodeScannerAndroidScanningLibrary.ZXING,
        },
      });

      if (result?.ScanResult) {
        verifyBarcode(result.ScanResult);
      } else {
        toast.error('No barcode detected. Try again.');
      }
    } catch (error) {
      console.error('Scanner failed to start', error);
      toast.error('Scanner failed to start');
    } finally {
      setIsScanning(false);
    }
  };

  const handleFallbackSubmit = () => {
    if (fallbackCode === targetBarcode) {
      verifyBarcode(fallbackCode);
    } else {
      toast.error('Invalid emergency code');
      setFallbackCode('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-white p-6">
      <div className="flex items-center justify-between mb-10 mt-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/20 rounded-2xl">
            <ScanBarcode className="h-6 w-6 text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold">Barcode Mission</h2>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-8 text-center max-w-sm mx-auto">
        <div className="h-32 w-32 bg-slate-900 rounded-full flex items-center justify-center border border-white/5 relative">
          <div className="absolute inset-0 border border-emerald-500/30 rounded-full animate-ping" />
          {isScanning ? <Loader2 className="h-14 w-14 text-white/80 animate-spin" /> : <ScanBarcode className="h-14 w-14 text-white/80" />}
        </div>

        <div>
          <h3 className="text-2xl font-bold mb-2">Time to get up!</h3>
          <p className="text-white/50 text-sm">
            Go to the bathroom and scan your registered toothpaste barcode to dismiss this alarm.
          </p>
        </div>

        <Button
          onClick={startScan}
          disabled={isScanning}
          className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-lg font-semibold shadow-[0_0_20px_rgba(16,185,129,0.2)]"
        >
          {isScanning ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Camera className="h-5 w-5 mr-2" />}
          {isScanning ? 'Opening Scanner...' : 'Open Scanner'}
        </Button>

        <div className="mt-8 w-full border-t border-white/10 pt-8">
          <Button
            variant="ghost"
            onClick={() => setShowFallback(!showFallback)}
            className="text-white/40 text-xs w-full mb-4"
          >
            Camera not working? Use emergency code
          </Button>

          {showFallback && (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter exact code..."
                value={fallbackCode}
                onChange={(e) => setFallbackCode(e.target.value)}
                className="flex-1 h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-white focus:outline-none focus:border-indigo-500"
              />
              <Button
                onClick={handleFallbackSubmit}
                className="h-12 w-12 bg-white/10 hover:bg-white/20 rounded-xl"
              >
                <CheckCircle2 className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
