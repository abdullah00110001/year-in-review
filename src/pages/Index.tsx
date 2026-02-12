import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Target, CheckCircle2, BarChart3, Calendar, ArrowRight, Sparkles, Zap, Shield, TrendingUp, Star, ChevronRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isPWAInstalled } from '@/lib/pwaUtils';
import InstallPrompt from '@/components/InstallPrompt';
import { isNative } from '@/lib/capacitor/platform';

export default function Index() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    // Don't act while auth is loading
    if (loading) return;
    
    // Redirect logged-in users to dashboard
    if (user) {
      navigate('/dashboard', { replace: true });
      return;
    }

    // Always redirect to auth when not logged in (mobile-first app)
    // Skip the landing page entirely for native apps and PWA
    if (isNative || isPWAInstalled()) {
      navigate('/auth', { replace: true });
      return;
    }

    // Show install prompt after a short delay for new visitors on web
    const timer = setTimeout(() => {
      if (!isPWAInstalled()) {
        setShowInstallPrompt(true);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [user, loading, navigate]);

  const features = [
    {
      icon: Target,
      title: 'Set Yearly Goals',
      description: 'Define ambitious goals for the year and break them into actionable habits.',
      gradient: 'from-primary/20 to-accent/20',
    },
    {
      icon: CheckCircle2,
      title: 'Track Daily Progress',
      description: 'Check off habits each day and build momentum with streaks.',
      gradient: 'from-accent/20 to-primary/20',
    },
    {
      icon: Calendar,
      title: 'Visual Calendar',
      description: 'See your progress at a glance with a beautiful calendar view.',
      gradient: 'from-primary/20 to-secondary/20',
    },
    {
      icon: BarChart3,
      title: 'Detailed Analytics',
      description: 'Understand your patterns with insights and charts.',
      gradient: 'from-secondary/20 to-primary/20',
    },
  ];

  const stats = [
    { value: '10K+', label: 'Active Users' },
    { value: '500K+', label: 'Habits Tracked' },
    { value: '98%', label: 'Success Rate' },
    { value: '4.9', label: 'User Rating', icon: Star },
  ];

  const testimonials = [
    {
      quote: "This app completely transformed how I approach my goals. I've never been more consistent!",
      author: "Sarah M.",
      role: "Entrepreneur",
    },
    {
      quote: "The visual tracking keeps me motivated every single day. Absolutely love it!",
      author: "James K.",
      role: "Software Engineer",
    },
    {
      quote: "Finally, an app that understands the importance of building lasting habits.",
      author: "Emily R.",
      role: "Health Coach",
    },
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Install Prompt Banner */}
      {showInstallPrompt && (
        <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
          <InstallPrompt 
            variant="card" 
            onDismiss={() => setShowInstallPrompt(false)} 
          />
        </div>
      )}

      {/* Animated Background Elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute -bottom-40 right-1/3 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      {/* Navigation */}
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur-xl fixed top-0 left-0 right-0 z-50">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <img 
              src="/icons/app-icon.png" 
              alt="Yearly Track" 
              className="h-10 w-10 rounded-xl shadow-lg shadow-primary/25"
            />
            <span className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Yearly Track
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" className="hidden sm:flex">
              <Link to="/auth">Sign In</Link>
            </Button>
            <Button asChild className="shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300">
              <Link to="/auth" className="gap-2">
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative">
        <div className="mx-auto max-w-5xl text-center">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-5 py-2.5 text-sm font-medium text-primary backdrop-blur-sm animate-fade-in">
            <Sparkles className="h-4 w-4" />
            <span>Transform your year with better habits</span>
            <ChevronRight className="h-4 w-4" />
          </div>
          
          {/* Main Heading */}
          <h1 className="mb-8 text-display animate-fade-in">
            <span className="block text-foreground">Build habits that</span>
            <span className="block mt-2 bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
              stick all year
            </span>
          </h1>
          
          {/* Subheading */}
          <p className="mx-auto mb-10 max-w-2xl text-body-lg text-muted-foreground animate-fade-in">
            Set meaningful yearly goals, break them into daily habits, and track your progress 
            with beautiful visualizations. Join thousands building better lives, one day at a time.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-16 animate-fade-in">
            <Button asChild size="lg" className="h-14 px-8 text-base shadow-2xl shadow-primary/30 hover:shadow-primary/40 hover:scale-105 transition-all duration-300">
              <Link to="/install" className="gap-2">
                Install App
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-14 px-8 text-base border-border/50 hover:bg-muted/50 hover:scale-105 transition-all duration-300">
              <Link to="/auth">Sign In</Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto animate-fade-in">
            {stats.map((stat, index) => (
              <div 
                key={stat.label} 
                className="relative group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative p-4 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-all duration-300">
                  <div className="flex items-center justify-center gap-1 text-2xl sm:text-3xl font-bold text-foreground mb-1">
                    {stat.value}
                    {stat.icon && <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />}
                  </div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-muted/30 via-muted/50 to-muted/30" />
        <div className="mx-auto max-w-6xl relative">
          <div className="mb-16 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
              <Zap className="h-4 w-4" />
              Powerful Features
            </div>
            <h2 className="mb-4 text-headline text-foreground">
              Everything you need to succeed
            </h2>
            <p className="text-body-lg text-muted-foreground max-w-2xl mx-auto">
              Simple, yet powerful tools designed to help you build lasting habits and achieve your goals
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="group relative"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/5 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500" />
                <div className="relative h-full rounded-3xl border border-border/50 bg-card/80 backdrop-blur-sm p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1">
                  <div className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.gradient} border border-primary/20`}>
                    <feature.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="mb-3 text-subtitle text-foreground">{feature.title}</h3>
                  <p className="text-body text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 px-4">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
              <Star className="h-4 w-4" />
              Testimonials
            </div>
            <h2 className="mb-4 text-headline text-foreground">
              Loved by thousands
            </h2>
            <p className="text-body-lg text-muted-foreground">
              See what our users have to say about their transformation
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <div
                key={testimonial.author}
                className="group relative"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative h-full rounded-3xl border border-border/50 bg-card/50 backdrop-blur-sm p-8 transition-all duration-300 hover:border-primary/30 hover:shadow-lg">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                    ))}
                  </div>
                  <p className="text-body text-foreground mb-6 italic">"{testimonial.quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-semibold">
                      {testimonial.author[0]}
                    </div>
                    <div>
                      <div className="text-subtitle text-foreground">{testimonial.author}</div>
                      <div className="text-caption">{testimonial.role}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-24 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-muted/30 via-muted/50 to-muted/30" />
        <div className="mx-auto max-w-6xl relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
                <Shield className="h-4 w-4" />
                Why Yearly Track?
              </div>
              <h2 className="mb-6 text-headline text-foreground">
                Built for people who are serious about growth
              </h2>
              <p className="text-body-lg text-muted-foreground mb-8">
                We understand that building habits is hard. That's why we've created a system that makes it 
                simple, visual, and rewarding to stay consistent with your goals.
              </p>
              <div className="space-y-4">
                {[
                  { icon: CheckCircle2, text: 'Intuitive daily check-ins that take seconds' },
                  { icon: TrendingUp, text: 'Visual progress tracking that motivates' },
                  { icon: Zap, text: 'Smart insights that help you improve' },
                  { icon: Shield, text: 'Privacy-first approach to your data' },
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                      <item.icon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-body text-foreground">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl blur-3xl" />
              <div className="relative rounded-3xl border border-border/50 bg-card/80 backdrop-blur-sm p-8 shadow-2xl">
                <div className="space-y-4">
                  {[85, 92, 78, 95, 88].map((progress, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Week {index + 1}</span>
                        <span className="font-medium text-foreground">{progress}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div 
                          className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-1000"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-4 relative">
        <div className="mx-auto max-w-4xl text-center relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 rounded-3xl blur-3xl" />
          <div className="relative rounded-3xl border border-primary/20 bg-card/50 backdrop-blur-sm p-12 sm:p-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
              <Sparkles className="h-4 w-4" />
              Start Today
            </div>
            <h2 className="mb-4 text-headline text-foreground">
              Ready to transform your year?
            </h2>
            <p className="mb-8 text-body-lg text-muted-foreground max-w-2xl mx-auto">
              Join thousands of people who have already changed their lives through better habits. 
              Start your journey today — it's completely free.
            </p>
            <Button asChild size="lg" className="h-14 px-10 text-base shadow-2xl shadow-primary/30 hover:shadow-primary/40 hover:scale-105 transition-all duration-300">
              <Link to="/install" className="gap-2">
                Install App Free
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12 px-4">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img 
                src="/icons/app-icon.png" 
                alt="Yearly Track" 
                className="h-9 w-9 rounded-xl"
              />
              <span className="font-semibold text-foreground">Yearly Track</span>
            </div>
            <p className="text-caption">
              © {new Date().getFullYear()} Yearly Track. Build better habits, transform your life.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
