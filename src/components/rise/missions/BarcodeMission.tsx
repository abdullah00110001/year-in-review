import { useState, useEffect } from 'react';
import { ScanBarcode, AlertCircle, Camera, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
// ক্যাপাসিটর বারকোড স্ক্যানার (নিশ্চিত করবেন যে @capacitor/barcode-scanner ইনস্টল করা আছে)
import { BarcodeScanner } from '@capacitor/barcode-scanner';
import { isNative } from '@/lib/capacitor/platform';

interface BarcodeMissionProps {
  onComplete: () => void;
  targetBarcode: string; // ইউজার যে বারকোডটি আগে থেকে সেট করে রেখেছিল (যেমন: টুথপেস্টের কোড)
}

export function BarcodeMission({ onComplete, targetBarcode }: BarcodeMissionProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [fallbackCode, setFallbackCode] = useState('');
  const [showFallback, setShowFallback] = useState(false);

  // ১. ক্যামেরা পারমিশন চেক করা
  useEffect(() => {
    const checkPermission = async () => {
      if (!isNative) {
        setHasPermission(false);
        return;
      }
      try {
        const status = await BarcodeScanner.checkPermission({ force: true });
        setHasPermission(status.granted);
      } catch (error) {
        console.error("Camera permission error:", error);
        setHasPermission(false);
      }
    };
    checkPermission();

    // কম্পোনেন্ট আনমাউন্ট হলে স্ক্যানার বন্ধ করা (যাতে ক্যামেরা অন না থাকে)
    return () => {
      BarcodeScanner.stopScan();
      document.body.classList.remove('barcode-scanner-active');
    };
  }, []);

  // ২. স্ক্যানিং শুরু করা
  const startScan = async () => {
    if (!hasPermission && isNative) {
      toast.error("Camera permission is required to scan!");
      return;
    }

    try {
      setIsScanning(true);
      // স্ক্যানারের জন্য ব্যাকগ্রাউন্ড ট্রান্সপারেন্ট করতে হয় (CSS এ .barcode-scanner-active ক্লাস লাগবে)
      document.body.classList.add('barcode-scanner-active'); 
      BarcodeScanner.hideBackground();

      const result = await BarcodeScanner.startScan(); // স্ক্যান হওয়া পর্যন্ত অপেক্ষা করবে

      if (result.hasContent) {
        verifyBarcode(result.content);
      }
    } catch (error) {
      toast.error("Scanner failed to start");
      stopScan();
    }
  };

  // স্ক্যানিং থামানো
  const stopScan = () => {
    BarcodeScanner.stopScan();
    BarcodeScanner.showBackground();
    document.body.classList.remove('barcode-scanner-active');
    setIsScanning(false);
  };

  // ৩. স্ক্যান করা বারকোড মেলানো
  const verifyBarcode = (scannedCode: string) => {
    stopScan();
    
    if (scannedCode === targetBarcode) {
      toast.success("Barcode matched! Good morning!");
      setTimeout(() => {
        onComplete(); // মিশন সাকসেস! অ্যালার্ম বন্ধ হবে
      }, 1000);
    } else {
      toast.error("Wrong barcode! Get out of bed and find the right one.");
    }
  };

  // ব্যাকআপ অপশন (ক্যামেরা নষ্ট থাকলে বা ব্রাউজারে টেস্ট করলে)
  const handleFallbackSubmit = () => {
    if (fallbackCode === targetBarcode) {
      verifyBarcode(fallbackCode);
    } else {
      toast.error("Invalid emergency code");
      setFallbackCode('');
    }
  };

  // স্ক্যানিং চলাকালীন UI (বাকি সব ট্রান্সপারেন্ট হয়ে যাবে)
  if (isScanning) {
    return (
      <div className="flex flex-col h-full items-center justify-between p-8 bg-transparent z-50">
        <div className="bg-black/50 p-4 rounded-2xl backdrop-blur-md mt-10">
          <p className="text-white font-medium text-center">Scan the barcode you saved earlier</p>
        </div>
        
        {/* স্ক্যানার টার্গেট বক্স */}
        <div className="w-64 h-64 border-4 border-indigo-500 rounded-3xl relative">
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-2xl -ml-1 -mt-1" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-2xl -mr-1 -mt-1" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-2xl -ml-1 -mb-1" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-2xl -mr-1 -mb-1" />
          {/* স্ক্যানিং এনিমেশন লাইন */}
          <div className="w-full h-1 bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)] animate-pulse absolute top-1/2" />
        </div>

        <Button 
          variant="destructive" 
          onClick={stopScan}
          className="rounded-full px-8 h-12 text-lg font-medium mb-10"
        >
          Cancel Scan
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-950 text-white p-6">
      
      {/* 🏷️ Header */}
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
          <ScanBarcode className="h-14 w-14 text-white/80" />
        </div>
        
        <div>
          <h3 className="text-2xl font-bold mb-2">Time to get up!</h3>
          <p className="text-white/50 text-sm">
            Go to the bathroom and scan your registered toothpaste barcode to dismiss this alarm.
          </p>
        </div>

        <Button 
          onClick={startScan}
          className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-lg font-semibold shadow-[0_0_20px_rgba(16,185,129,0.2)]"
        >
          <Camera className="h-5 w-5 mr-2" />
          Open Scanner
        </Button>

        {/* ⚠️ Emergency Fallback */}
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
