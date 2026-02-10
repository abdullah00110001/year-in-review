import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { PDFToolsHeader } from '@/components/pdf/PDFToolsHeader';
import { PDFToolGrid } from '@/components/pdf/PDFToolGrid';
import { PDFProcessingModal } from '@/components/pdf/PDFProcessingModal';
import { PDFWatchAdModal } from '@/components/pdf/PDFWatchAdModal';
import { usePDFWallet } from '@/hooks/usePDFWallet';
import { usePDFTools } from '@/hooks/usePDFTools';
import type { PDFToolType } from '@/types/pdf';

export default function PDFTools() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { wallet, isLoading: walletLoading, refreshWallet } = usePDFWallet();
  const { toolConfigs, isLoading: toolsLoading } = usePDFTools();
  
  const [selectedTool, setSelectedTool] = useState<PDFToolType | null>(null);
  const [showProcessing, setShowProcessing] = useState(false);
  const [showAdModal, setShowAdModal] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const handleToolSelect = (toolType: PDFToolType, files: File[]) => {
    if (!user) {
      navigate('/auth?redirect=/pdf-tools');
      return;
    }
    
    setSelectedTool(toolType);
    setPendingFiles(files);
    setShowProcessing(true);
  };

  const handleInsufficientCredits = () => {
    setShowProcessing(false);
    setShowAdModal(true);
  };

  const handleAdComplete = async () => {
    setShowAdModal(false);
    await refreshWallet();
    // Resume processing after ad bonus
    if (selectedTool && pendingFiles.length > 0) {
      setShowProcessing(true);
    }
  };

  const handleProcessingComplete = () => {
    setShowProcessing(false);
    setSelectedTool(null);
    setPendingFiles([]);
    refreshWallet();
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Cyber grid background */}
      <div className="fixed inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }} />
      </div>
      
      <PDFToolsHeader 
        balance={wallet?.balance ?? 0} 
        isPremium={wallet?.is_premium ?? false}
        isLoading={walletLoading}
      />
      
      <main className="container mx-auto px-4 py-8 relative z-10">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            <span className="text-white">Black</span>
            <span className="text-cyan-400">Box</span>
            <span className="text-white"> PDF</span>
          </h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto">
            Zero-Knowledge Processing • Client-Side Encryption Core • Ephemeral Memory Execution
          </p>
          
          {/* Security badges */}
          <div className="flex justify-center gap-4 mt-6">
            <div className="flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
              <span className="text-cyan-400">🔒</span>
              <span className="text-cyan-400 text-sm font-medium">256-bit Encryption</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
              <span className="text-cyan-400">🛡️</span>
              <span className="text-cyan-400 text-sm font-medium">Zero Cloud Upload</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
              <span className="text-cyan-400">⚡</span>
              <span className="text-cyan-400 text-sm font-medium">Instant Processing</span>
            </div>
          </div>
        </motion.div>

        {/* Tool Grid */}
        <PDFToolGrid 
          tools={toolConfigs}
          isLoading={toolsLoading}
          onToolSelect={handleToolSelect}
          userBalance={wallet?.balance ?? 0}
          isPremium={wallet?.is_premium ?? false}
        />
      </main>

      {/* Processing Modal */}
      <AnimatePresence>
        {showProcessing && selectedTool && (
          <PDFProcessingModal
            toolType={selectedTool}
            files={pendingFiles}
            onComplete={handleProcessingComplete}
            onInsufficientCredits={handleInsufficientCredits}
            onClose={() => {
              setShowProcessing(false);
              setSelectedTool(null);
              setPendingFiles([]);
            }}
          />
        )}
      </AnimatePresence>

      {/* Watch Ad Modal */}
      <AnimatePresence>
        {showAdModal && (
          <PDFWatchAdModal
            onComplete={handleAdComplete}
            onClose={() => setShowAdModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
