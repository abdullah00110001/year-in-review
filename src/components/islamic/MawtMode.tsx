import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import { Skull, Calendar, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MawtModeProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (preparedness: number) => void;
  lastRating?: number;
}

export default function MawtMode({ isOpen, onClose, onSubmit, lastRating }: MawtModeProps) {
  const [preparedness, setPreparedness] = useState(lastRating || 5);
  const [showReflection, setShowReflection] = useState(true);

  const handleSubmit = () => {
    onSubmit(preparedness);
    onClose();
  };

  const getPreparednessLabel = (value: number) => {
    if (value <= 2) return { text: 'Not Ready', color: 'text-rose-500' };
    if (value <= 4) return { text: 'Unprepared', color: 'text-amber-500' };
    if (value <= 6) return { text: 'Somewhat Ready', color: 'text-yellow-500' };
    if (value <= 8) return { text: 'Prepared', color: 'text-emerald-500' };
    return { text: 'Ready to Meet Allah', color: 'text-emerald-600' };
  };

  const label = getPreparednessLabel(preparedness);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-slate-950 text-slate-100 border-slate-800">
        <DialogHeader>
          <DialogTitle className="text-center text-xl flex items-center justify-center gap-2 text-slate-100">
            <Skull className="h-5 w-5" />
            Mawt (Death) Contemplation
          </DialogTitle>
          <DialogDescription className="text-center text-slate-400">
            <Calendar className="h-4 w-4 inline mr-1" />
            Jumu'ah Reflection
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 space-y-6">
          {showReflection ? (
            <>
              {/* Contemplation Text */}
              <div className="text-center space-y-4">
                <p className="text-lg text-slate-300 leading-relaxed">
                  "Every soul will taste death. Then to Us will you be returned."
                </p>
                <p className="text-sm text-slate-500 italic">— Al-Ankabut 29:57</p>
              </div>

              <div className="p-4 border border-slate-700 rounded-lg bg-slate-900/50">
                <p className="text-center text-slate-300">
                  If this was your last week on Earth...
                </p>
                <p className="text-center text-lg font-medium mt-2 text-slate-100">
                  Are you ready to meet your Lord?
                </p>
              </div>

              {/* Reminders */}
              <div className="space-y-2 text-sm text-slate-400">
                <p>• Have you prayed all your prayers with presence?</p>
                <p>• Have you sought forgiveness from those you've wronged?</p>
                <p>• Have you paid your debts and fulfilled your trusts?</p>
                <p>• Have you prepared your soul for the questioning?</p>
              </div>

              <Button 
                onClick={() => setShowReflection(false)}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-100"
              >
                Continue to Rating
              </Button>
            </>
          ) : (
            <>
              {/* Rating Section */}
              <div className="text-center">
                <p className="text-sm text-slate-400 mb-4">
                  How prepared are you to meet Allah today?
                </p>
                
                <div className="py-6">
                  <p className={cn("text-4xl font-bold mb-2", label.color)}>
                    {preparedness}
                  </p>
                  <p className={cn("text-sm font-medium", label.color)}>
                    {label.text}
                  </p>
                </div>

                <Slider
                  value={[preparedness]}
                  onValueChange={(value) => setPreparedness(value[0])}
                  min={1}
                  max={10}
                  step={1}
                  className="w-full"
                />

                <div className="flex justify-between text-xs text-slate-500 mt-2">
                  <span>Not Ready</span>
                  <span>Fully Prepared</span>
                </div>
              </div>

              {/* Low Preparedness Warning */}
              {preparedness <= 4 && (
                <Card className="bg-rose-950/30 border-rose-800">
                  <CardContent className="py-3 px-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />
                      <div className="text-sm text-rose-200">
                        <p className="font-medium">Reflection Needed</p>
                        <p className="text-rose-300 text-xs mt-1">
                          Consider making tawbah and increasing your good deeds this week.
                          Death comes without warning.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Action Items */}
              <div className="p-4 bg-slate-900/50 border border-slate-700 rounded-lg">
                <p className="text-sm font-medium text-slate-300 mb-2">
                  This week, focus on:
                </p>
                <ul className="text-xs text-slate-400 space-y-1">
                  <li>✓ Praying Fajr on time every day</li>
                  <li>✓ Reading at least 1 page of Quran daily</li>
                  <li>✓ Giving charity, even if small</li>
                  <li>✓ Seeking forgiveness before sleeping</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setShowReflection(true)}
                  className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  Back
                </Button>
                <Button 
                  onClick={handleSubmit}
                  className="flex-1 bg-emerald-800 hover:bg-emerald-700 text-emerald-100"
                >
                  Save Reflection
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
