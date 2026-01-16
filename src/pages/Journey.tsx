import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { monthlyThemes, getMonthName } from '@/data/monthlyThemes';
import { 
  Rocket, Moon, Dumbbell, Eye, BookOpen, Heart, 
  Zap, Repeat, Focus, Scale, TrendingUp, RefreshCw,
  CheckCircle2, Circle, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

const iconMap: Record<string, any> = {
  Rocket, Moon, Dumbbell, Eye, BookOpen, Heart,
  Zap, Repeat, Focus, Scale, TrendingUp, RefreshCw
};

export default function Journey() {
  const { language, t } = useLanguage();
  const currentMonth = new Date().getMonth() + 1;
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  const selectedTheme = monthlyThemes.find(theme => theme.month === selectedMonth);

  const getMonthStatus = (month: number) => {
    if (month < currentMonth) return 'completed';
    if (month === currentMonth) return 'current';
    return 'upcoming';
  };

  const progressPercentage = Math.round((currentMonth / 12) * 100);

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {language === 'bn' ? '১২ মাসের যাত্রা' : '12-Month Journey'}
          </h1>
          <p className="mt-1 text-sm sm:text-base text-muted-foreground">
            {language === 'bn' 
              ? 'প্রতি মাসে একটি নতুন টার্গেট, সারা বছর ধরে ট্রান্সফরমেশন' 
              : 'One new target each month, transformation throughout the year'}
          </p>
        </div>

        {/* Year Progress */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                {language === 'bn' ? 'বছরের অগ্রগতি' : 'Year Progress'}
              </span>
              <span className="text-sm text-muted-foreground">
                {currentMonth}/12 {language === 'bn' ? 'মাস' : 'months'}
              </span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
            <p className="mt-2 text-xs text-muted-foreground text-center">
              {language === 'bn' 
                ? `এখন চলছে: ${getMonthName(currentMonth, 'bn')} - ${monthlyThemes[currentMonth - 1]?.titleBn}`
                : `Currently: ${getMonthName(currentMonth, 'en')} - ${monthlyThemes[currentMonth - 1]?.titleEn}`}
            </p>
          </CardContent>
        </Card>

        {/* Mobile Month Selector - Horizontal Scroll */}
        <div className="mb-6 lg:hidden">
          <h3 className="text-sm font-medium mb-3 text-muted-foreground">
            {language === 'bn' ? 'মাস নির্বাচন করুন' : 'Select Month'}
          </h3>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6 scrollbar-hide">
            {monthlyThemes.map((theme) => {
              const status = getMonthStatus(theme.month);
              const Icon = iconMap[theme.icon] || Circle;
              
              return (
                <button
                  key={theme.month}
                  onClick={() => setSelectedMonth(theme.month)}
                  className={cn(
                    "flex flex-col items-center gap-1 p-3 rounded-xl border min-w-[70px] transition-all",
                    selectedMonth === theme.month 
                      ? "border-primary bg-primary/10" 
                      : "border-border bg-card hover:bg-muted/50"
                  )}
                >
                  <div 
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full",
                      status === 'completed' && "bg-primary/20",
                      status === 'current' && "bg-secondary ring-2 ring-secondary ring-offset-1",
                      status === 'upcoming' && "bg-muted"
                    )}
                    style={status === 'completed' ? { backgroundColor: `${theme.color}30`, color: theme.color } : {}}
                  >
                    {status === 'completed' ? (
                      <CheckCircle2 className="h-5 w-5" style={{ color: theme.color }} />
                    ) : (
                      <Icon className="h-5 w-5" style={status === 'current' ? { color: theme.color } : {}} />
                    )}
                  </div>
                  <span className="text-xs font-medium">
                    {String(theme.month).padStart(2, '0')}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Timeline Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Month Selector - Desktop Only */}
          <Card className="hidden lg:block lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">
                {language === 'bn' ? 'মাসিক টার্গেট' : 'Monthly Targets'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y max-h-[600px] overflow-y-auto">
                {monthlyThemes.map((theme) => {
                  const status = getMonthStatus(theme.month);
                  const Icon = iconMap[theme.icon] || Circle;
                  
                  return (
                    <button
                      key={theme.month}
                      onClick={() => setSelectedMonth(theme.month)}
                      className={cn(
                        "w-full flex items-center gap-3 p-4 text-left transition-colors hover:bg-muted/50",
                        selectedMonth === theme.month && "bg-muted"
                      )}
                    >
                      <div 
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                          status === 'completed' && "bg-primary/20 text-primary",
                          status === 'current' && "bg-secondary text-secondary-foreground ring-2 ring-secondary ring-offset-2",
                          status === 'upcoming' && "bg-muted text-muted-foreground"
                        )}
                        style={status === 'completed' ? { backgroundColor: `${theme.color}30`, color: theme.color } : {}}
                      >
                        {status === 'completed' ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : (
                          <Icon className="h-5 w-5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {language === 'bn' ? `টার্গেট ${String(theme.month).padStart(2, '0')}` : `Target ${String(theme.month).padStart(2, '0')}`}
                          </span>
                          {status === 'current' && (
                            <Badge variant="secondary" className="text-[10px] px-1.5">
                              {language === 'bn' ? 'চলমান' : 'Active'}
                            </Badge>
                          )}
                        </div>
                        <p className="font-medium truncate">
                          {language === 'bn' ? theme.titleBn : theme.titleEn}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Selected Month Detail */}
          <Card className="lg:col-span-2">
            {selectedTheme && (
              <>
                <CardHeader className="pb-4">
                  <div className="flex flex-col sm:flex-row items-start gap-4">
                    <div 
                      className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl shrink-0"
                      style={{ backgroundColor: `${selectedTheme.color}30` }}
                    >
                      {(() => {
                        const Icon = iconMap[selectedTheme.icon] || Circle;
                        return <Icon className="h-7 w-7 sm:h-8 sm:w-8" style={{ color: selectedTheme.color }} />;
                      })()}
                    </div>
                    <div className="flex-1 w-full">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <Badge 
                          variant="outline"
                          style={{ borderColor: selectedTheme.color, color: selectedTheme.color }}
                        >
                          {language === 'bn' 
                            ? `টার্গেট ${String(selectedTheme.month).padStart(2, '0')}`
                            : `Target ${String(selectedTheme.month).padStart(2, '0')}`}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {getMonthName(selectedTheme.month, language)}
                        </span>
                      </div>
                      <CardTitle className="text-xl sm:text-2xl">
                        {language === 'bn' ? selectedTheme.titleBn : selectedTheme.titleEn}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <p className="text-lg text-muted-foreground leading-relaxed">
                      {language === 'bn' ? selectedTheme.descriptionBn : selectedTheme.descriptionEn}
                    </p>
                  </div>

                  {/* Status Card */}
                  <div 
                    className="mt-6 rounded-xl p-6"
                    style={{ backgroundColor: `${selectedTheme.color}15` }}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      {getMonthStatus(selectedTheme.month) === 'completed' ? (
                        <CheckCircle2 className="h-6 w-6" style={{ color: selectedTheme.color }} />
                      ) : getMonthStatus(selectedTheme.month) === 'current' ? (
                        <Zap className="h-6 w-6" style={{ color: selectedTheme.color }} />
                      ) : (
                        <Circle className="h-6 w-6" style={{ color: selectedTheme.color }} />
                      )}
                      <span className="font-semibold" style={{ color: selectedTheme.color }}>
                        {getMonthStatus(selectedTheme.month) === 'completed' 
                          ? (language === 'bn' ? 'সম্পন্ন' : 'Completed')
                          : getMonthStatus(selectedTheme.month) === 'current'
                            ? (language === 'bn' ? 'চলমান টার্গেট' : 'Active Target')
                            : (language === 'bn' ? 'আসন্ন' : 'Upcoming')}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {getMonthStatus(selectedTheme.month) === 'current'
                        ? (language === 'bn' 
                            ? 'এই মাসের টার্গেটে ফোকাস করুন এবং Goals পেজে গিয়ে সংশ্লিষ্ট লক্ষ্য সেট করুন।'
                            : 'Focus on this month\'s target and set related goals on the Goals page.')
                        : getMonthStatus(selectedTheme.month) === 'completed'
                          ? (language === 'bn'
                              ? 'এই মাসের টার্গেট শেষ। আপনার অগ্রগতি দেখতে Analytics পেজে যান।'
                              : 'This month\'s target is complete. Visit Analytics to see your progress.')
                          : (language === 'bn'
                              ? 'এই টার্গেট শীঘ্রই আসছে। প্রস্তুতি নিন!'
                              : 'This target is coming soon. Get ready!')}
                    </p>
                  </div>

                  {/* Suggested Habits */}
                  <div className="mt-6">
                    <h4 className="font-semibold mb-3">
                      {language === 'bn' ? 'প্রস্তাবিত অভ্যাস' : 'Suggested Habits'}
                    </h4>
                    <div className="grid gap-2 grid-cols-1 sm:grid-cols-2">
                      {getSuggestedHabits(selectedTheme.month, language).map((habit, index) => (
                        <div 
                          key={index}
                          className="flex items-center gap-2 rounded-lg border p-3"
                        >
                          <div 
                            className="h-2 w-2 rounded-full shrink-0"
                            style={{ backgroundColor: selectedTheme.color }}
                          />
                          <span className="text-sm">{habit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </>
            )}
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

function getSuggestedHabits(month: number, language: 'en' | 'bn'): string[] {
  const habits: Record<number, { en: string[]; bn: string[] }> = {
    1: {
      en: ['Wake up at fixed time', 'Make daily to-do list', 'Track all habits', 'Evening review'],
      bn: ['নির্দিষ্ট সময়ে ঘুম থেকে ওঠা', 'দৈনিক টু-ডু লিস্ট তৈরি', 'সব অভ্যাস ট্র্যাক করা', 'সন্ধ্যায় রিভিউ করা']
    },
    2: {
      en: ['Sleep by 11 PM', '7-8 hours sleep', 'No phone before bed', 'Morning sunlight'],
      bn: ['রাত ১১টায় ঘুমানো', '৭-৮ ঘণ্টা ঘুম', 'ঘুমের আগে ফোন না', 'সকালে সূর্যের আলো']
    },
    3: {
      en: ['10K steps daily', 'Morning stretching', 'Take stairs', 'Evening walk'],
      bn: ['দৈনিক ১০ হাজার পদক্ষেপ', 'সকালে স্ট্রেচিং', 'সিঁড়ি ব্যবহার', 'সন্ধ্যায় হাঁটা']
    },
    4: {
      en: ['2 hour screen limit', 'No phone first hour', 'App blockers on', 'Digital sunset'],
      bn: ['২ ঘণ্টা স্ক্রিন লিমিট', 'প্রথম ঘণ্টা ফোন না', 'অ্যাপ ব্লকার চালু', 'ডিজিটাল সানসেট']
    },
    5: {
      en: ['Read 30 min daily', 'Note key learnings', 'Discuss ideas', 'Library visit weekly'],
      bn: ['দৈনিক ৩০ মিনিট পড়া', 'মূল শিক্ষা নোট করা', 'আইডিয়া আলোচনা', 'সাপ্তাহিক লাইব্রেরি']
    },
    6: {
      en: ['5 min meditation', 'Gratitude journal', 'Weekly review', 'Nature time'],
      bn: ['৫ মিনিট মেডিটেশন', 'কৃতজ্ঞতা জার্নাল', 'সাপ্তাহিক রিভিউ', 'প্রকৃতিতে সময়']
    },
    7: {
      en: ['1 hour skill practice', 'Online course', 'Build projects', 'Share learnings'],
      bn: ['১ ঘণ্টা স্কিল প্র্যাক্টিস', 'অনলাইন কোর্স', 'প্রজেক্ট তৈরি', 'শেখা শেয়ার করা']
    },
    8: {
      en: ['Never miss twice', 'Habit stacking', 'Environment design', 'Track streaks'],
      bn: ['দুইবার মিস না করা', 'হ্যাবিট স্ট্যাকিং', 'পরিবেশ ডিজাইন', 'স্ট্রিক ট্র্যাক করা']
    },
    9: {
      en: ['2 hour deep work', 'Pomodoro technique', 'Single-tasking', 'Batch similar tasks'],
      bn: ['২ ঘণ্টা ডিপ ওয়ার্ক', 'পমোডোরো টেকনিক', 'একটা কাজে ফোকাস', 'একই ধরণের কাজ একসাথে']
    },
    10: {
      en: ['Family dinner', 'Hobby time', 'Friend meetup', 'Self-care day'],
      bn: ['পরিবারের সাথে খাবার', 'শখের সময়', 'বন্ধুদের সাথে দেখা', 'সেলফ-কেয়ার ডে']
    },
    11: {
      en: ['Face one fear', 'Public speaking', 'New challenges', 'Celebrate wins'],
      bn: ['একটা ভয় জয় করা', 'পাবলিক স্পিকিং', 'নতুন চ্যালেঞ্জ', 'সাফল্য উদযাপন']
    },
    12: {
      en: ['Year review', 'Lessons learned', 'Next year goals', 'Gratitude list'],
      bn: ['বছর রিভিউ', 'শেখা পাঠ', 'আগামী বছরের লক্ষ্য', 'কৃতজ্ঞতা তালিকা']
    }
  };

  return habits[month]?.[language] || habits[1][language];
}
