import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, BookOpen, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Quote {
  quote: string;
  quote_bn: string;
  author: string | null;
  type?: 'islamic' | 'general';
}

// Static quotes for fallback/mix
const staticQuotes: Quote[] = [
  { quote: "Indeed, with hardship comes ease.", quote_bn: "নিশ্চয়ই কষ্টের সাথে স্বস্তি আছে।", author: "Quran 94:6", type: 'islamic' },
  { quote: "Allah does not burden a soul beyond that it can bear.", quote_bn: "আল্লাহ কোন আত্মাকে তার সাধ্যের বাইরে বোঝা দেন না।", author: "Quran 2:286", type: 'islamic' },
  { quote: "Verily, in the remembrance of Allah do hearts find rest.", quote_bn: "জেনে রাখ, আল্লাহর স্মরণেই অন্তর প্রশান্তি লাভ করে।", author: "Quran 13:28", type: 'islamic' },
  { quote: "Take benefit of five before five: your youth before your old age.", quote_bn: "পাঁচটি বিষয়কে পাঁচটির আগে সুযোগ হিসেবে নাও: বার্ধক্যের আগে যৌবনকে।", author: "Prophet Muhammad (PBUH)", type: 'islamic' },
  { quote: "The best among you is the one who learns the Quran and teaches it.", quote_bn: "তোমাদের মধ্যে সর্বোত্তম সে যে কুরআন শেখে এবং শেখায়।", author: "Prophet Muhammad (PBUH)", type: 'islamic' },
  { quote: "Your time is limited, don't waste it living someone else's life.", quote_bn: "আপনার সময় সীমিত, অন্যের জীবন যাপন করে এটি নষ্ট করবেন না।", author: "Steve Jobs", type: 'general' },
  { quote: "The only way to do great work is to love what you do.", quote_bn: "মহান কাজ করার একমাত্র উপায় হল আপনি যা করেন তা ভালোবাসা।", author: "Steve Jobs", type: 'general' },
  { quote: "Small consistent steps lead to extraordinary results.", quote_bn: "ছোট ধারাবাহিক পদক্ষেপ অসাধারণ ফলাফলের দিকে নিয়ে যায়।", author: null, type: 'general' },
  { quote: "Focus is your superpower. Protect it.", quote_bn: "ফোকাস আপনার সুপারপাওয়ার। এটি রক্ষা করুন।", author: null, type: 'general' },
  { quote: "The discipline you build today shapes the success of tomorrow.", quote_bn: "আজ যে শৃঙ্খলা গড়ে তুলবেন তা আগামীকালের সাফল্য গঠন করবে।", author: null, type: 'general' },
];

export default function UnifiedQuotes() {
  const { language } = useLanguage();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [allQuotes, setAllQuotes] = useState<Quote[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    try {
      const { data } = await supabase
        .from('motivational_quotes')
        .select('*');
      
      // Merge DB quotes with static quotes
      const dbQuotes: Quote[] = (data || []).map((q: any) => ({
        quote: q.quote,
        quote_bn: q.quote_bn,
        author: q.author,
        type: q.author?.includes('Quran') || q.author?.includes('Prophet') ? 'islamic' : 'general'
      }));

      const mergedQuotes = [...dbQuotes, ...staticQuotes];
      setAllQuotes(mergedQuotes);
      
      // Pick a random quote
      pickRandomQuote(mergedQuotes);
    } catch (error) {
      // Fallback to static quotes
      setAllQuotes(staticQuotes);
      pickRandomQuote(staticQuotes);
    }
  };

  const pickRandomQuote = (quotes: Quote[]) => {
    if (quotes.length === 0) return;
    const randomIndex = Math.floor(Math.random() * quotes.length);
    setQuote(quotes[randomIndex]);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    pickRandomQuote(allQuotes);
    setTimeout(() => setIsRefreshing(false), 300);
  };

  if (!quote) return null;

  const isIslamic = quote.type === 'islamic' || 
    quote.author?.includes('Quran') || 
    quote.author?.includes('Prophet') ||
    quote.author?.includes('PBUH');

  return (
    <Card className="overflow-hidden border-0 bg-gradient-to-br from-accent/10 via-background to-primary/5">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            {isIslamic ? (
              <BookOpen className="h-4 w-4 sm:h-5 sm:w-5" />
            ) : (
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="text-[10px] sm:text-xs">
                {isIslamic ? (
                  <>📿 {language === 'bn' ? 'ইসলামিক' : 'Islamic'}</>
                ) : (
                  <>💡 {language === 'bn' ? 'অনুপ্রেরণা' : 'Motivation'}</>
                )}
              </Badge>
            </div>
            <p className="text-sm sm:text-base italic text-foreground/90 leading-relaxed">
              "{language === 'bn' ? quote.quote_bn : quote.quote}"
            </p>
            {quote.author && (
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground font-medium">
                — {quote.author}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 h-8 w-8"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
