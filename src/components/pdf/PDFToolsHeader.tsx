import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Wallet, Crown, LogIn, ChevronLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface PDFToolsHeaderProps {
  balance: number;
  isPremium: boolean;
  isLoading: boolean;
}

export function PDFToolsHeader({ balance, isPremium, isLoading }: PDFToolsHeaderProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 bg-black/90 backdrop-blur-xl border-b border-cyan-500/20">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Logo + Back */}
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
              <ChevronLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Back</span>
            </Link>
            
            <Link to="/pdf-tools" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-cyan-700 rounded-lg flex items-center justify-center">
                <span className="text-black font-bold text-lg">B</span>
              </div>
              <span className="font-bold text-xl">
                <span className="text-white">Black</span>
                <span className="text-cyan-400">Box</span>
              </span>
            </Link>
          </div>

          {/* Right: Credits + Auth */}
          <div className="flex items-center gap-4">
            {/* Credit Balance */}
            <motion.div 
              className="flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Wallet className="w-5 h-5 text-cyan-400" />
              {isLoading ? (
                <Skeleton className="w-12 h-5 bg-cyan-500/20" />
              ) : (
                <span className="font-mono font-bold text-cyan-400">
                  {balance.toLocaleString()}
                </span>
              )}
              <span className="text-gray-500 text-sm hidden sm:inline">credits</span>
            </motion.div>

            {/* Premium Badge */}
            {isPremium && (
              <motion.div 
                className="flex items-center gap-2 px-3 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
              >
                <Crown className="w-5 h-5 text-yellow-400" />
                <span className="text-yellow-400 font-medium text-sm hidden sm:inline">PRO</span>
              </motion.div>
            )}

            {/* Auth Button */}
            {user ? (
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white"
                onClick={() => navigate('/settings')}
              >
                <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-black font-bold text-sm">
                    {user.email?.[0].toUpperCase()}
                  </span>
                </div>
              </Button>
            ) : (
              <Button
                onClick={() => navigate('/auth?redirect=/pdf-tools')}
                className="bg-cyan-500 hover:bg-cyan-600 text-black font-medium"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
