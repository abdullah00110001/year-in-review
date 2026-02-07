import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Ban, 
  Globe, 
  Smartphone, 
  Type, 
  Film, 
  Plus,
  Trash2,
  Shield,
  AlertTriangle,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BlockedItem {
  id: string;
  name: string;
  type: 'app' | 'website' | 'keyword';
  category?: string;
}

interface ShieldBlockingProps {
  blockedApps: string[];
  blockedWebsites: string[];
  blockedKeywords: string[];
  blockInfiniteContent: boolean;
  blockAdultContent: boolean;
  onUpdate: (data: any) => void;
}

export function ShieldBlocking({ 
  blockedApps, 
  blockedWebsites, 
  blockedKeywords,
  blockInfiniteContent,
  blockAdultContent,
  onUpdate 
}: ShieldBlockingProps) {
  const [newApp, setNewApp] = useState('');
  const [newWebsite, setNewWebsite] = useState('');
  const [newKeyword, setNewKeyword] = useState('');
  const [activeBlockTab, setActiveBlockTab] = useState('apps');

  const popularApps = [
    { name: 'Instagram', icon: '📷', category: 'Social' },
    { name: 'TikTok', icon: '🎵', category: 'Social' },
    { name: 'YouTube', icon: '▶️', category: 'Video' },
    { name: 'Facebook', icon: '👤', category: 'Social' },
    { name: 'Twitter/X', icon: '🐦', category: 'Social' },
    { name: 'Snapchat', icon: '👻', category: 'Social' },
    { name: 'Reddit', icon: '🤖', category: 'Social' },
    { name: 'WhatsApp', icon: '💬', category: 'Messaging' },
    { name: 'Telegram', icon: '✈️', category: 'Messaging' },
    { name: 'Discord', icon: '🎮', category: 'Gaming' },
    { name: 'Twitch', icon: '📺', category: 'Gaming' },
    { name: 'Netflix', icon: '🎬', category: 'Entertainment' },
    { name: 'Games', icon: '🎮', category: 'Gaming' },
  ];

  const appCategories = ['All Social Media', 'All Games', 'All Entertainment', 'All Messaging'];

  const addApp = (app: string) => {
    if (app && !blockedApps.includes(app)) {
      onUpdate({ blockedApps: [...blockedApps, app] });
      setNewApp('');
    }
  };

  const removeApp = (app: string) => {
    onUpdate({ blockedApps: blockedApps.filter(a => a !== app) });
  };

  const addWebsite = () => {
    if (newWebsite && !blockedWebsites.includes(newWebsite)) {
      onUpdate({ blockedWebsites: [...blockedWebsites, newWebsite] });
      setNewWebsite('');
    }
  };

  const removeWebsite = (website: string) => {
    onUpdate({ blockedWebsites: blockedWebsites.filter(w => w !== website) });
  };

  const addKeyword = () => {
    if (newKeyword && !blockedKeywords.includes(newKeyword)) {
      onUpdate({ blockedKeywords: [...blockedKeywords, newKeyword] });
      setNewKeyword('');
    }
  };

  const removeKeyword = (keyword: string) => {
    onUpdate({ blockedKeywords: blockedKeywords.filter(k => k !== keyword) });
  };

  return (
    <div className="space-y-4">
      {/* Quick Content Blocks */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Content Protection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-muted rounded-xl">
            <div className="flex items-center gap-3">
              <Film className="h-5 w-5 text-rose-500" />
              <div>
                <p className="font-medium text-sm">Shorts & Reels Blocker</p>
                <p className="text-xs text-muted-foreground">Block infinite scroll content</p>
              </div>
            </div>
            <Switch 
              checked={blockInfiniteContent}
              onCheckedChange={(checked) => onUpdate({ blockInfiniteContent: checked })}
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-muted rounded-xl">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <div>
                <p className="font-medium text-sm">Adult Content Blocker</p>
                <p className="text-xs text-muted-foreground">Block harmful websites</p>
              </div>
            </div>
            <Switch 
              checked={blockAdultContent}
              onCheckedChange={(checked) => onUpdate({ blockAdultContent: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Blocking Tabs */}
      <Tabs value={activeBlockTab} onValueChange={setActiveBlockTab}>
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="apps" className="text-xs">
            <Smartphone className="h-3 w-3 mr-1" />
            Apps ({blockedApps.length})
          </TabsTrigger>
          <TabsTrigger value="websites" className="text-xs">
            <Globe className="h-3 w-3 mr-1" />
            Sites ({blockedWebsites.length})
          </TabsTrigger>
          <TabsTrigger value="keywords" className="text-xs">
            <Type className="h-3 w-3 mr-1" />
            Keywords ({blockedKeywords.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="apps" className="mt-4 space-y-4">
          {/* Category Quick Blocks */}
          <div className="flex flex-wrap gap-2">
            {appCategories.map((cat) => (
              <Badge
                key={cat}
                variant={blockedApps.includes(cat) ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => blockedApps.includes(cat) ? removeApp(cat) : addApp(cat)}
              >
                {cat}
              </Badge>
            ))}
          </div>

          {/* Popular Apps Grid */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Popular Apps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-2">
                {popularApps.map((app) => (
                  <button
                    key={app.name}
                    onClick={() => blockedApps.includes(app.name) ? removeApp(app.name) : addApp(app.name)}
                    className={cn(
                      'flex flex-col items-center p-2 rounded-xl transition-all',
                      blockedApps.includes(app.name) 
                        ? 'bg-destructive/20 border-2 border-destructive' 
                        : 'bg-muted hover:bg-muted/80'
                    )}
                  >
                    <span className="text-2xl mb-1">{app.icon}</span>
                    <span className="text-[10px] text-center truncate w-full">{app.name}</span>
                    {blockedApps.includes(app.name) && (
                      <Ban className="h-3 w-3 text-destructive mt-1" />
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Custom App Input */}
          <div className="flex gap-2">
            <Input
              placeholder="Add custom app..."
              value={newApp}
              onChange={(e) => setNewApp(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addApp(newApp)}
            />
            <Button onClick={() => addApp(newApp)} size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Blocked Apps List */}
          {blockedApps.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Ban className="h-4 w-4 text-destructive" />
                  Blocked Apps ({blockedApps.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {blockedApps.map((app) => (
                    <Badge key={app} variant="destructive" className="gap-1">
                      {app}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => removeApp(app)}
                      />
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="websites" className="mt-4 space-y-4">
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground mb-4">
                Block websites by domain, subdomain, or use wildcards (*) for patterns.
              </p>

              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g., instagram.com or *.tiktok.com"
                    value={newWebsite}
                    onChange={(e) => setNewWebsite(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addWebsite()}
                  />
                  <Button onClick={addWebsite} size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {blockedWebsites.length > 0 && (
                  <div className="space-y-2">
                    {blockedWebsites.map((website) => (
                      <div 
                        key={website}
                        className="flex items-center justify-between p-2 bg-destructive/10 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-destructive" />
                          <span className="text-sm">{website}</span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => removeWebsite(website)}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Website Blocks */}
          <div className="flex flex-wrap gap-2">
            {['facebook.com', 'instagram.com', 'tiktok.com', 'twitter.com', 'reddit.com', 'youtube.com'].map((site) => (
              <Badge
                key={site}
                variant={blockedWebsites.includes(site) ? 'destructive' : 'outline'}
                className="cursor-pointer"
                onClick={() => blockedWebsites.includes(site) ? removeWebsite(site) : onUpdate({ blockedWebsites: [...blockedWebsites, site] })}
              >
                <Globe className="h-3 w-3 mr-1" />
                {site}
              </Badge>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="keywords" className="mt-4 space-y-4">
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground mb-4">
                Block content containing specific keywords in URLs or search queries.
              </p>

              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="e.g., shorts, reels, gaming"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
                />
                <Button onClick={addKeyword} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {blockedKeywords.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {blockedKeywords.map((keyword) => (
                    <Badge key={keyword} variant="destructive" className="gap-1">
                      <Type className="h-3 w-3" />
                      {keyword}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => removeKeyword(keyword)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Suggested Keywords */}
          <div className="flex flex-wrap gap-2">
            {['shorts', 'reels', 'stories', 'gaming', 'memes', 'viral', 'trending'].map((kw) => (
              <Badge
                key={kw}
                variant={blockedKeywords.includes(kw) ? 'destructive' : 'outline'}
                className="cursor-pointer"
                onClick={() => blockedKeywords.includes(kw) ? removeKeyword(kw) : onUpdate({ blockedKeywords: [...blockedKeywords, kw] })}
              >
                {kw}
              </Badge>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
