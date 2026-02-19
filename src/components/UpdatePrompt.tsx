import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, AlertTriangle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface UpdatePromptProps {
  open: boolean;
  onDismiss: () => void;
  downloadUrl: string;
  isForceUpdate: boolean;
  releaseNotes?: string | null;
  latestVersion: number;
}

export default function UpdatePrompt({
  open,
  onDismiss,
  downloadUrl,
  isForceUpdate,
  releaseNotes,
  latestVersion,
}: UpdatePromptProps) {
  const [downloading, setDownloading] = useState(false);

  const handleUpdate = async () => {
    setDownloading(true);
    try {
      const { Browser } = await import('@capacitor/browser');
      await Browser.open({ url: downloadUrl });
    } catch {
      window.open(downloadUrl, '_blank');
    }
    setDownloading(false);
  };

  const handleRemindLater = () => {
    localStorage.setItem('update_snooze_until', String(Date.now() + 24 * 60 * 60 * 1000));
    onDismiss();
  };

  return (
    <Dialog open={open} onOpenChange={isForceUpdate ? undefined : onDismiss}>
      <DialogContent
        className={`sm:max-w-md ${isForceUpdate ? '[&>button]:hidden' : ''}`}
        onPointerDownOutside={isForceUpdate ? (e) => e.preventDefault() : undefined}
        onEscapeKeyDown={isForceUpdate ? (e) => e.preventDefault() : undefined}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isForceUpdate ? (
              <AlertTriangle className="h-5 w-5 text-destructive" />
            ) : (
              <Download className="h-5 w-5 text-primary" />
            )}
            New Update Available
          </DialogTitle>
          <DialogDescription>
            Version {latestVersion} is ready to install.
            {isForceUpdate && ' This update is required to continue using the app.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {isForceUpdate && (
            <Badge variant="destructive" className="text-xs">Required Update</Badge>
          )}
          {releaseNotes && (
            <div className="rounded-lg border bg-muted/50 p-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">What's new:</p>
              <p className="text-sm text-foreground">{releaseNotes}</p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button onClick={handleUpdate} disabled={downloading} className="w-full gap-2">
            <Download className="h-4 w-4" />
            {downloading ? 'Opening...' : 'Update Now'}
          </Button>
          {!isForceUpdate && (
            <Button variant="ghost" onClick={handleRemindLater} className="w-full gap-2">
              <Clock className="h-4 w-4" />
              Remind Me Later
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
