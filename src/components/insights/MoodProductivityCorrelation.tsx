import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MoodCorrelationProps {
  lowMoodHighDevice: boolean;
  highMoodHighProductivity: boolean;
  insights: string[];
}

export default function MoodProductivityCorrelation({ 
  lowMoodHighDevice, 
  highMoodHighProductivity, 
  insights 
}: MoodCorrelationProps) {
  if (insights.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-muted-foreground">
          <p className="text-sm">Collecting data to generate mood insights...</p>
          <p className="text-xs mt-1">Continue logging entries for analysis</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-amber-500" />
          Mood ↔ Productivity Insights
        </CardTitle>
        <CardDescription>Patterns detected in your behavior</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Correlation badges */}
        <div className="flex flex-wrap gap-2">
          {lowMoodHighDevice && (
            <Badge variant="outline" className="text-red-500 border-red-300 text-xs">
              <TrendingDown className="h-3 w-3 mr-1" />
              Low mood → High device
            </Badge>
          )}
          {highMoodHighProductivity && (
            <Badge variant="outline" className="text-emerald-500 border-emerald-300 text-xs">
              <TrendingUp className="h-3 w-3 mr-1" />
              High energy → High study
            </Badge>
          )}
        </div>

        {/* Insights list */}
        <div className="space-y-2">
          {insights.map((insight, index) => (
            <div 
              key={index} 
              className={cn(
                "p-3 rounded-lg text-sm",
                insight.includes('Low mood') || insight.includes('⚠️')
                  ? "bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200"
                  : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200"
              )}
            >
              {insight}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
