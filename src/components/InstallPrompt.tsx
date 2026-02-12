import { useState, forwardRef } from 'react';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Smartphone, X, Share, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InstallPromptProps {
  className?: string;
  variant?: 'banner' | 'card' | 'modal';
  onDismiss?: () => void;
}

const InstallPrompt = forwardRef<HTMLDivElement, InstallPromptProps>(function InstallPrompt({ className, variant = 'banner', onDismiss }, ref) {
  const { isInstallable, isInstalled, isIOSSafari, install } = useInstallPrompt();
  const [isDismissed, setIsDismissed] = useState(false);

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  const handleInstall = async () => {
    const installed = await install();
    if (installed) {
      handleDismiss();
    }
  };

  // Don't show if already installed or dismissed
  if (isInstalled || isDismissed) {
    return null;
  }

  // Note: ref is accepted via forwardRef but not applied to a specific element
  // since the component returns different variants. This prevents the React warning.

  // iOS Safari instructions
  if (isIOSSafari) {
    if (variant === 'card' || variant === 'modal') {
      return (
        <Card className={cn('relative', className)}>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Smartphone className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Install Yearly Track</CardTitle>
                <CardDescription>Get the full app experience</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Install this app on your iPhone for the best experience:
            </p>
            <ol className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">1</div>
                <span>Tap the Share button</span>
                <Share className="h-4 w-4 text-primary" />
              </li>
              <li className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">2</div>
                <span>Scroll down and tap "Add to Home Screen"</span>
                <Plus className="h-4 w-4 text-primary" />
              </li>
              <li className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">3</div>
                <span>Tap "Add" to install</span>
              </li>
            </ol>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className={cn(
        'flex items-center gap-3 rounded-lg border bg-card p-3',
        className
      )}>
        <Smartphone className="h-5 w-5 text-primary shrink-0" />
        <p className="text-sm flex-1">
          Tap <Share className="inline h-4 w-4 mx-1" /> then "Add to Home Screen" to install
        </p>
        <Button variant="ghost" size="sm" onClick={handleDismiss}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  // Native install prompt (Chrome, Edge, etc.)
  if (!isInstallable) {
    return null;
  }

  if (variant === 'card' || variant === 'modal') {
    return (
      <Card className={cn('relative', className)}>
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-8 w-8"
          onClick={handleDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Download className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Install Yearly Track</CardTitle>
              <CardDescription>Get the full app experience</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Works offline
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Quick access from home screen
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Full-screen experience
            </li>
          </ul>
          <Button className="w-full" onClick={handleInstall}>
            <Download className="mr-2 h-4 w-4" />
            Install App
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Banner variant
  return (
    <div className={cn(
      'flex items-center gap-3 rounded-lg border bg-card p-3',
      className
    )}>
      <Download className="h-5 w-5 text-primary shrink-0" />
      <p className="text-sm flex-1">Install Yearly Track for the best experience</p>
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={handleInstall}>
          Install
        </Button>
        <Button variant="ghost" size="sm" onClick={handleDismiss}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
});

export default InstallPrompt;
