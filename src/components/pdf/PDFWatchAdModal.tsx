import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Play, Gift, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePDFWallet } from '@/hooks/usePDFWallet';
import { Progress } from '@/components/ui/progress';

interface PDFWatchAdModalProps {
  onComplete: () => void;
  onClose: () => void;
}

const AD_DURATION = 30; // seconds

export function PDFWatchAdModal({ onComplete, onClose }: PDFWatchAdModalProps) {
  const { addCredits } = usePDFWallet();
  const [isWatching, setIsWatching] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(AD_DURATION);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isWatching && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setIsComplete(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isWatching, timeRemaining]);

  const handleStartWatching = () => {
    setIsWatching(true);
  };

  const handleClaimReward = async () => {
    const success = await addCredits(5, 'ad_bonus');
    if (success) {
      onComplete();
    }
  };

  const progress = ((AD_DURATION - timeRemaining) / AD_DURATION) * 100;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-md mx-4 bg-gray-900 border border-cyan-500/30 rounded-2xl overflow-hidden"
      >
        {/* Close button */}
        {!isWatching && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Header */}
        <div className="p-6 border-b border-gray-800 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-2xl flex items-center justify-center">
            <Gift className="w-8 h-8 text-yellow-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            Unlock Processing Credits
          </h3>
          <p className="text-gray-400 text-sm">
            Watch a short message to earn 5 free credits
          </p>
        </div>

        {/* Ad Content Area */}
        <div className="p-6">
          {!isWatching && !isComplete ? (
            <div className="text-center space-y-6">
              <div className="aspect-video bg-gray-800/50 rounded-xl flex items-center justify-center border border-gray-700">
                <div className="text-center">
                  <Play className="w-12 h-12 text-cyan-400 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">Sponsored content</p>
                </div>
              </div>
              
              <Button
                onClick={handleStartWatching}
                className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-black font-semibold h-12"
              >
                <Play className="w-5 h-5 mr-2" />
                Watch Now ({AD_DURATION}s)
              </Button>
            </div>
          ) : isWatching && !isComplete ? (
            <div className="space-y-6">
              {/* Simulated Ad Content */}
              <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl flex items-center justify-center border border-gray-700 relative overflow-hidden">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center p-6"
                >
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-cyan-500 to-cyan-700 rounded-xl flex items-center justify-center">
                    <span className="text-black font-bold text-2xl">B</span>
                  </div>
                  <h4 className="text-white font-semibold mb-2">BlackBox PDF Pro</h4>
                  <p className="text-gray-400 text-sm">Unlimited processing. Zero knowledge. Maximum security.</p>
                </motion.div>
                
                {/* Animated background */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute inset-0" style={{
                    backgroundImage: `
                      linear-gradient(rgba(0, 255, 255, 0.3) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(0, 255, 255, 0.3) 1px, transparent 1px)
                    `,
                    backgroundSize: '30px 30px',
                    animation: 'pulse 2s infinite'
                  }} />
                </div>
              </div>

              {/* Timer */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Time remaining
                  </span>
                  <span className="font-mono text-cyan-400">{timeRemaining}s</span>
                </div>
                <Progress value={progress} className="h-2 bg-gray-800" />
              </div>
            </div>
          ) : (
            <div className="text-center space-y-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', duration: 0.5 }}
                className="w-20 h-20 mx-auto bg-green-500/20 border border-green-500/50 rounded-full flex items-center justify-center"
              >
                <Gift className="w-10 h-10 text-green-400" />
              </motion.div>
              
              <div>
                <h4 className="text-xl font-semibold text-white mb-2">Reward Unlocked!</h4>
                <p className="text-gray-400">You've earned 5 processing credits</p>
              </div>

              <Button
                onClick={handleClaimReward}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-black font-semibold h-12"
              >
                <Gift className="w-5 h-5 mr-2" />
                Claim Credits
              </Button>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 pb-6">
          <p className="text-center text-xs text-gray-600">
            Ads support free tier processing. Upgrade to PRO for ad-free experience.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
