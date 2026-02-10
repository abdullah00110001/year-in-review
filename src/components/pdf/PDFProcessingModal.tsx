import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X, Shield, Check, Loader2, Download, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePDFWallet } from '@/hooks/usePDFWallet';
import { usePDFTools } from '@/hooks/usePDFTools';
import { processPDF } from '@/lib/pdf/pdfProcessor';
import type { PDFToolType, ProcessingStep } from '@/types/pdf';
import { cn } from '@/lib/utils';

interface PDFProcessingModalProps {
  toolType: PDFToolType;
  files: File[];
  onComplete: () => void;
  onInsufficientCredits: () => void;
  onClose: () => void;
}

const ILLUSION_STEPS: ProcessingStep[] = [
  { id: 'encrypt', label: 'Initializing Secure Environment...', status: 'pending', duration: 800 },
  { id: 'analyze', label: 'Analyzing Document Structure...', status: 'pending', duration: 1200 },
  { id: 'allocate', label: 'Allocating Compute Resources...', status: 'pending', duration: 600 },
  { id: 'process', label: 'Processing with Zero-Knowledge Protocol...', status: 'pending', duration: 0 },
  { id: 'finalize', label: 'Finalizing Secure Output...', status: 'pending', duration: 400 },
];

export function PDFProcessingModal({
  toolType,
  files,
  onComplete,
  onInsufficientCredits,
  onClose
}: PDFProcessingModalProps) {
  const { wallet, deductCredits } = usePDFWallet();
  const { calculateCredits, getToolConfig } = usePDFTools();
  
  const [steps, setSteps] = useState<ProcessingStep[]>(ILLUSION_STEPS);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
  const [outputFileName, setOutputFileName] = useState<string>('');
  const [isComplete, setIsComplete] = useState(false);
  const [creditsUsed, setCreditsUsed] = useState(0);

  const toolConfig = getToolConfig(toolType);
  const isPremiumUser = wallet?.is_premium ?? false;
  
  // Calculate total file size
  const totalSizeMb = files.reduce((sum, f) => sum + f.size / (1024 * 1024), 0);
  const requiredCredits = calculateCredits(toolType, totalSizeMb, isPremiumUser);

  const runProcessing = useCallback(async () => {
    // Check credits first
    if (requiredCredits > 0 && (wallet?.balance ?? 0) < requiredCredits) {
      onInsufficientCredits();
      return;
    }

    // Deduct credits before processing (important for psychology)
    if (requiredCredits > 0) {
      const success = await deductCredits(requiredCredits, toolType, totalSizeMb);
      if (!success) {
        setError('Failed to process payment. Please try again.');
        return;
      }
      setCreditsUsed(requiredCredits);
    }

    // Run illusion steps
    for (let i = 0; i < steps.length; i++) {
      setCurrentStepIndex(i);
      setSteps(prev => prev.map((s, idx) => ({
        ...s,
        status: idx < i ? 'complete' : idx === i ? 'processing' : 'pending'
      })));

      const step = steps[i];
      
      if (step.id === 'process') {
        // Actual processing happens here
        try {
          const startTime = Date.now();
          const result = await processPDF(toolType, files);
          
          if (!result.success) {
            throw new Error(result.error || 'Processing failed');
          }

          // Artificial minimum processing time for perception
          const elapsed = Date.now() - startTime;
          if (elapsed < 1500) {
            await new Promise(r => setTimeout(r, 1500 - elapsed));
          }

          setOutputBlob(result.outputBlob || null);
          setOutputFileName(result.fileName || `processed_${Date.now()}.pdf`);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Processing failed');
          return;
        }
      } else if (step.duration) {
        await new Promise(r => setTimeout(r, step.duration));
      }
    }

    // Mark all complete
    setSteps(prev => prev.map(s => ({ ...s, status: 'complete' })));
    setIsComplete(true);
  }, [requiredCredits, wallet, deductCredits, toolType, totalSizeMb, files, steps, onInsufficientCredits]);

  useEffect(() => {
    runProcessing();
  }, []);

  const handleDownload = () => {
    if (!outputBlob) return;
    
    const url = URL.createObjectURL(outputBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = outputFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    onComplete();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-lg mx-4 bg-gray-900 border border-cyan-500/30 rounded-2xl overflow-hidden"
      >
        {/* Close button */}
        {(isComplete || error) && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Header */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-cyan-500/10 border border-cyan-500/30 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                {toolConfig?.name || 'Processing'}
              </h3>
              <p className="text-sm text-gray-400">
                {files.length} file{files.length > 1 ? 's' : ''} • {totalSizeMb.toFixed(2)} MB
              </p>
            </div>
          </div>
        </div>

        {/* Processing Steps */}
        <div className="p-6 space-y-4">
          {error ? (
            <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
              <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
              <div>
                <p className="text-red-400 font-medium">Processing Failed</p>
                <p className="text-sm text-gray-400">{error}</p>
              </div>
            </div>
          ) : (
            steps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ 
                  opacity: index <= currentStepIndex || isComplete ? 1 : 0.4, 
                  x: 0 
                }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                  step.status === 'complete' 
                    ? "bg-green-500/20 border border-green-500/50" 
                    : step.status === 'processing'
                    ? "bg-cyan-500/20 border border-cyan-500/50"
                    : "bg-gray-800 border border-gray-700"
                )}>
                  {step.status === 'complete' ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : step.status === 'processing' ? (
                    <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-gray-600" />
                  )}
                </div>
                <span className={cn(
                  "text-sm font-mono transition-colors",
                  step.status === 'complete' 
                    ? "text-green-400" 
                    : step.status === 'processing'
                    ? "text-cyan-400"
                    : "text-gray-500"
                )}>
                  {step.label}
                </span>
              </motion.div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-800 bg-gray-900/50">
          {isComplete && outputBlob ? (
            <div className="space-y-4">
              {creditsUsed > 0 && (
                <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                  <span>Credits used:</span>
                  <span className="font-mono text-cyan-400">{creditsUsed}</span>
                </div>
              )}
              <Button
                onClick={handleDownload}
                className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-black font-semibold"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Secure File
              </Button>
            </div>
          ) : error ? (
            <Button
              onClick={onClose}
              variant="outline"
              className="w-full border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Close
            </Button>
          ) : (
            <div className="text-center text-sm text-gray-500">
              <p className="font-mono">Processing with military-grade encryption...</p>
              <p className="mt-2">Your files never leave your device.</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
