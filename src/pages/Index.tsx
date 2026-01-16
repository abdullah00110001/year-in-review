import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Target, CheckCircle2, BarChart3, Calendar, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Index() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  const features = [
    {
      icon: Target,
      title: 'Set Yearly Goals',
      description: 'Define ambitious goals for the year and break them into actionable habits.',
    },
    {
      icon: CheckCircle2,
      title: 'Track Daily Progress',
      description: 'Check off habits each day and build momentum with streaks.',
    },
    {
      icon: Calendar,
      title: 'Visual Calendar',
      description: 'See your progress at a glance with a beautiful calendar view.',
    },
    {
      icon: BarChart3,
      title: 'Detailed Analytics',
      description: 'Understand your patterns with insights and charts.',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-background/80 backdrop-blur-sm fixed top-0 left-0 right-0 z-50">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
              <Target className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold">Yearly Track</span>
          </div>
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost">
              <Link to="/auth">Sign In</Link>
            </Button>
            <Button asChild>
              <Link to="/auth">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" />
            Transform your year with better habits
          </div>
          <h1 className="mb-6 text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            Build habits that
            <span className="block text-primary">stick all year</span>
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
            Set meaningful yearly goals, break them into daily habits, and track your progress 
            with beautiful visualizations. Join thousands building better lives, one day at a time.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button asChild size="lg" className="gap-2">
              <Link to="/auth">
                Start for Free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/auth">Learn More</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold">Everything you need to succeed</h2>
            <p className="text-muted-foreground">
              Simple tools designed to help you build lasting habits
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border bg-card p-6 transition-shadow hover:shadow-lg"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-4 text-3xl font-bold">Ready to transform your year?</h2>
          <p className="mb-8 text-muted-foreground">
            Start tracking your habits today and see the difference consistency makes.
          </p>
          <Button asChild size="lg" className="gap-2">
            <Link to="/auth">
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4">
        <div className="mx-auto max-w-6xl text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Yearly Track. Build better habits.</p>
        </div>
      </footer>
    </div>
  );
}