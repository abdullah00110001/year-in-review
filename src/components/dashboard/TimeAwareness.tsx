import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CalendarDays, Clock, Sparkles } from 'lucide-react';

interface Quote {
  quote: string;
  quote_bn: string;
  author: string | null;
}

export default function TimeAwareness() {
  const { t, language } = useLanguage();
  const [quote, setQuote] = useState<Quote | null>(null);

  const now = new Date();
  const year = now.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const endOfYear = new Date(year, 11, 31);
  
  const dayOfYear = Math.ceil((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
  const totalDays = Math.ceil((endOfYear.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const daysRemaining = totalDays - dayOfYear;
  const yearProgress = Math.round((dayOfYear / totalDays) * 100);

  useEffect(() => {
    fetchDailyQuote();
  }, []);

  const fetchDailyQuote = async () => {
    // Get a quote based on day of year for consistency
    const { data } = await supabase
      .from('motivational_quotes')
      .select('*');
    
    if (data && data.length > 0) {
      const quoteIndex = dayOfYear % data.length;
      setQuote(data[quoteIndex]);
    }
  };

  return (
    <div className="mb-8 space-y-4">
      {/* Year Progress Hero */}
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <CardContent className="p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            {/* Progress Section */}
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{year} {language === 'bn' ? 'সালের অগ্রগতি' : 'Progress'}</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-primary">{yearProgress}%</span>
                  <span className="text-sm text-muted-foreground">
                    {language === 'bn' ? 'সম্পন্ন' : 'completed'}
                  </span>
                </div>
                <Progress value={yearProgress} className="h-3" />
              </div>
            </div>

            {/* Day Counters */}
            <div className="flex gap-6 lg:gap-8">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-muted-foreground">
                  <CalendarDays className="h-4 w-4" />
                </div>
                <div className="mt-1 text-3xl font-bold">{dayOfYear}</div>
                <div className="text-xs text-muted-foreground">
                  {language === 'bn' ? `${totalDays} এর মধ্যে` : `of ${totalDays}`}
                </div>
              </div>
              
              <div className="h-16 w-px bg-border" />
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-secondary">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="mt-1 text-3xl font-bold text-secondary">{daysRemaining}</div>
                <div className="text-xs text-muted-foreground">
                  {language === 'bn' ? 'দিন বাকি' : 'days left'}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Daily Quote */}
      {quote && (
        <Card className="border-dashed bg-muted/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm italic text-foreground/80">
                  "{language === 'bn' ? quote.quote_bn : quote.quote}"
                </p>
                {quote.author && (
                  <p className="mt-1 text-xs text-muted-foreground">— {quote.author}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
