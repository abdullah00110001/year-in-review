import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAppMode } from '@/contexts/AppModeContext';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, User, Mail, Save, Palette, Globe, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import ModeSwitcher from '@/components/mode/ModeSwitcher';

export default function Settings() {
  const { user, signOut } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    full_name: '',
    bio: '',
  });

  useEffect(() => {
    if (user) fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('full_name, bio')
      .eq('user_id', user!.id)
      .single();

    if (data) {
      setProfile({
        full_name: data.full_name || '',
        bio: data.bio || '',
      });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: profile.full_name,
        bio: profile.bio,
      })
      .eq('user_id', user!.id);

    if (error) {
      toast.error('Failed to update profile');
    } else {
      toast.success(t('settings.updated'));
    }
    
    setSaving(false);
  };

  const themeOptions = [
    { value: 'light', label: t('settings.light') },
    { value: 'dark', label: t('settings.dark') },
    { value: 'system', label: t('settings.system') },
  ] as const;

  const languageOptions = [
    { value: 'en', label: t('settings.english'), native: 'English' },
    { value: 'bn', label: t('settings.bangla'), native: 'বাংলা' },
  ] as const;

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t('settings.title')}</h1>
          <p className="mt-1 text-sm sm:text-base text-muted-foreground">
            {t('settings.subtitle')}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {/* Profile Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {t('settings.profile')}
                </CardTitle>
                <CardDescription>
                  {t('settings.updateInfo')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t('settings.email')}</Label>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{user?.email}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">{t('settings.fullName')}</Label>
                  <Input
                    id="name"
                    value={profile.full_name}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    placeholder="Your name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">{t('settings.bio')}</Label>
                  <Input
                    id="bio"
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    placeholder="A short bio about yourself"
                  />
                </div>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  {t('settings.save')}
                </Button>
              </CardContent>
            </Card>

            {/* Experience Mode Card */}
            <ModeSwitcher />

            {/* Appearance Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  {t('settings.appearance')}
                </CardTitle>
                <CardDescription>
                  {t('settings.theme')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-2">
                  {themeOptions.map((option) => (
                    <Button
                      key={option.value}
                      variant={theme === option.value ? 'default' : 'outline'}
                      onClick={() => setTheme(option.value)}
                      className="flex-1"
                      size="sm"
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Language Card */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Globe className="h-5 w-5" />
                  {t('settings.language')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="flex flex-col sm:flex-row gap-2">
                  {languageOptions.map((option) => (
                    <Button
                      key={option.value}
                      variant={language === option.value ? 'default' : 'outline'}
                      onClick={() => setLanguage(option.value)}
                      className="flex-1"
                      size="sm"
                    >
                      {option.native}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Account Card */}
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.account')}</CardTitle>
                <CardDescription>
                  {t('settings.subtitle')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="destructive" onClick={signOut}>
                  {t('nav.signOut')}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
