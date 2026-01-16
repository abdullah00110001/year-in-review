import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { RefreshCw, Sun, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TawbahProtocolProps {
  currentScore: number;
  targetScore: number;
  currentHour: number;
  dayResetUsed: boolean;
  onReset: () => void;
}

export default function TawbahProtocol({ 
  currentScore, 
  targetScore, 
  currentHour, 
  dayResetUsed,
  onReset 
}: TawbahProtocolProps) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const scorePercentage = (currentScore / targetScore) * 100;
  const isLowScore = scorePercentage < 40;
  const isAfternoon = currentHour >= 15; // 3:00 PM
  const canReset = isLowScore && isAfternoon && !dayResetUsed;

  const remainingHours = 24 - currentHour;
  const potentialRecovery = Math.min(100, scorePercentage + (remainingHours * 5)); // Assume 5% per hour possible

  const handleReset = () => {
    setIsResetting(true);
    setTimeout(() => {
      onReset();
      setShowConfirmation(false);
      setIsResetting(false);
    }, 1500);
  };

  if (!isAfternoon) {
    return null; // Only show after 3 PM
  }

  return (
    <>
      <Card className={cn(
        "transition-all duration-300",
        canReset 
          ? "border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20" 
          : "border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/20"
      )}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <RefreshCw className={cn(
                "h-4 w-4",
                canReset ? "text-amber-500" : "text-emerald-500"
              )} />
              Tawbah Protocol
            </CardTitle>
            <Badge variant="outline" className={cn(
              "text-xs",
              scorePercentage >= 70 ? "border-emerald-500 text-emerald-600" :
              scorePercentage >= 40 ? "border-amber-500 text-amber-600" :
              "border-rose-500 text-rose-600"
            )}>
              {scorePercentage.toFixed(0)}% Today
            </Badge>
          </div>
          <CardDescription>
            {canReset 
              ? "A rough morning? The day isn't over yet."
              : dayResetUsed 
                ? "Fresh start already activated. Keep going!"
                : "You're on track. No reset needed."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Day Progress</span>
              <span className="text-muted-foreground">{currentScore}/{targetScore} points</span>
            </div>
            <Progress value={scorePercentage} className="h-2" />
          </div>

          {/* Recovery Potential */}
          <div className="p-3 bg-background/50 rounded-lg border space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Sun className="h-4 w-4 text-amber-500" />
              <span className="font-medium">{remainingHours} hours remaining today</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Potential recovery: Up to {potentialRecovery.toFixed(0)}% if you stay focused
            </p>
          </div>

          {canReset ? (
            <>
              <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg border border-amber-200 dark:border-amber-700">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>Allah's Mercy:</strong> The believer is tested. What matters is how you finish, not how you started.
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1 italic">
                  "Say: O My servants who have transgressed against themselves, do not despair of the mercy of Allah." — Az-Zumar 39:53
                </p>
              </div>

              <Button 
                onClick={() => setShowConfirmation(true)}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Activate Fresh Start
              </Button>
            </>
          ) : dayResetUsed ? (
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg border border-emerald-200 dark:border-emerald-700 text-center">
              <p className="text-sm text-emerald-800 dark:text-emerald-200">
                ✨ Fresh start is active. Your afternoon score is being tracked separately.
              </p>
            </div>
          ) : (
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg border border-emerald-200 dark:border-emerald-700 text-center">
              <p className="text-sm text-emerald-800 dark:text-emerald-200">
                👍 You're doing well! Keep up the momentum.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="sm:max-w-md text-center">
          <DialogHeader>
            <DialogTitle className="text-center">
              🌅 Start Fresh?
            </DialogTitle>
            <DialogDescription className="text-center">
              This will dim your morning's struggles and start a fresh progress bar for the remaining hours.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <AlertCircle className="h-8 w-8 mx-auto text-amber-500 mb-2" />
              <p className="text-sm">
                <strong>Note:</strong> Your morning data is still saved. This is a psychological reset, not a data deletion.
              </p>
            </div>

            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
              <p className="text-sm italic text-emerald-800 dark:text-emerald-200">
                "Every son of Adam sins, and the best of sinners are those who repent."
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">— Hadith (Tirmidhi)</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => setShowConfirmation(false)}
              className="flex-1"
              disabled={isResetting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleReset}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600"
              disabled={isResetting}
            >
              {isResetting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Resetting...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset & Renew
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
