import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { isPWAInstalled, isIOSSafari } from '@/lib/pwaUtils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Download, Smartphone, WifiOff, Zap, Shield, Share, Plus, ArrowRight, Check } from 'lucide-react';
import { Loader2 } from 'lucide-react';

export default function Install() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { isInstallable, isInstalled, install } = useInstallPrompt();
  const isIOS = isIOSSafari();

  useEffect(() => {
    // If already installed and logged in, go to dashboard
    if (!loading && user && isPWAInstalled()) {
      navigate('/dashboard');
    }
    // If already installed but not logged in, go to auth
    if (isPWAInstalled() && !user && !loading) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const handleInstall = async () => {
    const installed = await install();
    if (installed) {
      navigate('/auth');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const features = [
    {
      icon: WifiOff,
      title: 'Works Offline',
      description: 'Track your habits even without internet',
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Instant loading from your home screen',
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your data stays on your device',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background p-4 sm:p-6">
      <div className="mx-auto max-w-lg">
        {/* Header */}
        <div className="mb-8 text-center pt-8">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-primary/80 shadow-2xl shadow-primary/30">
            <Target className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="text-headline text-foreground mb-2">Yearly Track</h1>
          <p className="text-body text-muted-foreground">
            Life Operating System
          </p>
        </div>

        {/* Main Install Card */}
        <Card className="mb-6 border-primary/20 shadow-xl">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-title">
              {isInstalled ? 'App Installed!' : 'Install the App'}
            </CardTitle>
            <CardDescription>
              {isInstalled 
                ? 'You\'re all set. Sign in to start tracking.'
                : 'Get the full experience on your device'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isInstalled ? (
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-2 text-green-500">
                  <Check className="h-6 w-6" />
                  <span className="font-medium">Successfully installed!</span>
                </div>
                <Button asChild className="w-full" size="lg">
                  <Link to="/auth">
                    Continue to Sign In
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ) : isIOS ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground text-center">
                  Install this app on your iPhone:
                </p>
                <ol className="space-y-3">
                  <li className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                      1
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Tap the Share button</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Share className="h-4 w-4" /> at the bottom of Safari
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                      2
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Add to Home Screen</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        Scroll down and tap <Plus className="h-4 w-4" /> Add to Home Screen
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                      3
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Tap "Add"</p>
                      <p className="text-sm text-muted-foreground">
                        Confirm to install the app
                      </p>
                    </div>
                  </li>
                </ol>
                <div className="pt-2">
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/auth">
                      Skip for now
                    </Link>
                  </Button>
                </div>
              </div>
            ) : isInstallable ? (
              <div className="space-y-4">
                <Button className="w-full" size="lg" onClick={handleInstall}>
                  <Download className="mr-2 h-5 w-5" />
                  Install App
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/auth">
                    Skip for now
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Smartphone className="h-5 w-5 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Your browser supports installation. Look for the install icon in your address bar.
                  </p>
                </div>
                <Button asChild className="w-full" size="lg">
                  <Link to="/auth">
                    Continue to Sign In
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Features */}
        {!isInstalled && (
          <div className="grid gap-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="flex items-center gap-3 rounded-xl border bg-card/50 p-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{feature.title}</p>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <p className="mt-8 text-center text-sm text-muted-foreground">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
