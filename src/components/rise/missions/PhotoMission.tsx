import { useState, useRef } from 'react';
import { Camera, RotateCcw, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Camera as CapCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { isNative } from '@/lib/capacitor/platform';
import { toast } from 'sonner';

interface PhotoMissionProps {
  onComplete: () => void;
  registeredPlace?: string; // e.g. "Bathroom sink"
}

/**
 * Photo Mission — user must take a fresh photo of a registered location to
 * dismiss. We don't do real image matching (that needs ML); instead the user
 * confirms it visually after taking the photo, mirroring Alarmy's flow.
 */
export function PhotoMission({ onComplete, registeredPlace = 'Bathroom sink' }: PhotoMissionProps) {
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const takePhoto = async () => {
    try {
      if (isNative) {
        const photo = await CapCamera.getPhoto({
          quality: 70,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Camera,
          allowEditing: false,
          saveToGallery: false,
        });
        if (photo.dataUrl) {
          setPhotoUri(photo.dataUrl);
          setConfirming(true);
        }
      } else {
        fileRef.current?.click();
      }
    } catch (e) {
      toast.error('Camera failed to open');
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoUri(reader.result as string);
      setConfirming(true);
    };
    reader.readAsDataURL(file);
  };

  const confirm = () => {
    toast.success('Photo verified! Good morning ☀️');
    setTimeout(() => onComplete(), 400);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-white p-6">
      <div className="flex items-center justify-between mb-8 mt-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/20 rounded-2xl">
            <Camera className="h-6 w-6 text-amber-400" />
          </div>
          <h2 className="text-xl font-bold">Photo Mission</h2>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center">
        {photoUri ? (
          <>
            <div className="w-full max-w-xs aspect-square rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
              <img src={photoUri} alt="Captured" className="w-full h-full object-cover" />
            </div>
            <p className="text-white/70 text-sm max-w-xs">
              Does this look like <span className="font-semibold text-amber-400">{registeredPlace}</span>?
            </p>
          </>
        ) : (
          <>
            <div className="h-40 w-40 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Camera className="h-16 w-16 text-amber-400" />
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-2">Get out of bed!</h3>
              <p className="text-white/50 text-sm max-w-xs">
                Walk to your <span className="text-amber-400 font-semibold">{registeredPlace}</span> and take a photo to dismiss the alarm.
              </p>
            </div>
          </>
        )}
      </div>

      <div className="space-y-3 pb-4">
        {confirming ? (
          <>
            <Button
              onClick={confirm}
              className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-lg font-semibold"
            >
              <CheckCircle2 className="h-5 w-5 mr-2" />
              Yes, dismiss alarm
            </Button>
            <Button
              variant="ghost"
              onClick={() => { setPhotoUri(null); setConfirming(false); }}
              className="w-full text-white/60"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Retake
            </Button>
          </>
        ) : (
          <Button
            onClick={takePhoto}
            className="w-full h-14 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl text-lg font-semibold shadow-[0_0_30px_rgba(245,158,11,0.3)]"
          >
            <Camera className="h-5 w-5 mr-2" />
            Open Camera
          </Button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFile}
        />
      </div>
    </div>
  );
}
