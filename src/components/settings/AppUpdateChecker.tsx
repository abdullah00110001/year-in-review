import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Download, CheckCircle2, Loader2, RefreshCw, Sparkles } from 'lucide-react';

export default function AppUpdateChecker() {
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [latestUpdate, setLatestUpdate] = useState<any>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const currentVersion = '1.0.0'; // Update this with each release

  useEffect(() => {
    checkForUpdates();
  }, []);

  const checkForUpdates = async () => {
    setChecking(true);
    const { data } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'app_updates')
      .maybeSingle();

    if (data?.value) {
      const val = data.value as any;
      const activeUpdates = (val.updates || []).filter((u: any) => u.is_active);
      if (activeUpdates.length > 0) {
        setLatestUpdate(activeUpdates[0]);
      }
    }

    // Get APK from storage
    try {
      const { data: files } = await supabase.storage.from('app-releases').list('', {
        limit: 1,
        sortBy: { column: 'created_at', order: 'desc' },
      });
      if (files && files.length > 0) {
        const { data: urlData } = supabase.storage.from('app-releases').getPublicUrl(files[0].name);
        setDownloadUrl(urlData.publicUrl);
      }
    } catch {}

    setChecking(false);
    setLoading(false);
  };

  const hasUpdate = latestUpdate && latestUpdate.version !== currentVersion;
  const finalUrl = downloadUrl || latestUpdate?.download_url;

  const handleUpdate = () => {
    if (finalUrl) {
      window.open(finalUrl, '_blank');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-subtitle flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          App Updates
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Current Version</p>
            <Badge variant="outline">v{currentVersion}</Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={checkForUpdates} disabled={checking}>
            <RefreshCw className={`h-4 w-4 mr-1 ${checking ? 'animate-spin' : ''}`} />
            Check
          </Button>
        </div>

        {hasUpdate ? (
          <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm text-foreground">
                v{latestUpdate.version} Available!
              </span>
              {latestUpdate.is_mandatory && (
                <Badge variant="destructive" className="text-[10px]">Required</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{latestUpdate.title}</p>
            <p className="text-xs text-muted-foreground">{latestUpdate.description}</p>
            {finalUrl && (
              <Button onClick={handleUpdate} className="w-full gap-2" size="sm">
                <Download className="h-4 w-4" />
                Download Update
              </Button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 p-3 rounded-xl border bg-card">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">You're up to date!</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
