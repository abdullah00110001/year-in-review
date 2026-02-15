import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Target, BookOpen, Shield, Brain, Calendar, BarChart3, 
  ArrowRight, CheckCircle2, Loader2, Sparkles, Heart, Flame
} from 'lucide-react';

const features = [
  { icon: Calendar, title: 'Daily Life Input', desc: 'Track prayers, study, sleep, exercise & mood every day' },
  { icon: BookOpen, title: 'Islamic Dashboard', desc: 'Salah quality, Quran heatmap, Tahajjud & Sadaqah tracking' },
  { icon: Shield, title: 'Digital Shield', desc: 'Block distracting apps, focus timer & discipline scoring' },
  { icon: Brain, title: 'AI Intelligence', desc: 'Burnout detection, life balance & predictive analytics' },
  { icon: Heart, title: 'Life Calendar', desc: 'Visualize your entire life in weeks with Hayat Battery' },
  { icon: Flame, title: 'Gamification', desc: 'Challenges, streaks, leaderboards & achievement badges' },
];

export default function LandingPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Hero */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="relative max-w-5xl mx-auto px-4 pt-12 pb-16 sm:pt-20 sm:pb-24 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary shadow-lg shadow-primary/25">
            <Target className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight">
            <span className="text-primary">Oporajeyo</span>
          </h1>
          <p className="mt-2 text-lg sm:text-xl text-muted-foreground font-medium">
            Life OS — Your Complete Islamic Productivity Platform
          </p>
          <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
            Track your daily life, build habits, monitor spiritual growth, and achieve your goals 
            with AI-powered insights. Designed for Muslims who want to excel in both Dunya & Akhirah.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" onClick={() => navigate('/auth')} className="gap-2 text-base px-8">
              Get Started Free <ArrowRight className="h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/auth')} className="text-base px-8">
              Sign In
            </Button>
          </div>
          <div className="mt-6 flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4 text-primary" /> Free forever plan</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4 text-primary" /> No credit card</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4 text-primary" /> Android app</span>
          </div>
        </div>
      </header>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-4 pb-20">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="text-sm font-semibold text-primary uppercase tracking-wider">Features</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold">Everything You Need to Level Up</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <Card key={i} className="border-muted/50 hover:border-primary/30 transition-colors">
              <CardContent className="p-5">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary/5 py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">Start Your Journey Today</h2>
          <p className="text-muted-foreground mb-8">
            Join thousands of Muslims tracking their daily progress and building better habits.
          </p>
          <Button size="lg" onClick={() => navigate('/auth')} className="gap-2 text-base px-10">
            Create Free Account <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Oporajeyo — Life OS. All rights reserved.</p>
      </footer>
    </div>
  );
}
