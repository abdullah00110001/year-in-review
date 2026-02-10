import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Crown, Upload, Lock } from 'lucide-react';
import type { PDFToolConfig, PDFToolType } from '@/types/pdf';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface PDFToolGridProps {
  tools: PDFToolConfig[];
  isLoading: boolean;
  onToolSelect: (toolType: PDFToolType, files: File[]) => void;
  userBalance: number;
  isPremium: boolean;
}

export function PDFToolGrid({ 
  tools, 
  isLoading, 
  onToolSelect,
  userBalance,
  isPremium
}: PDFToolGridProps) {
  const [dragOver, setDragOver] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement>>({});

  const handleDragOver = (e: React.DragEvent, toolId: string) => {
    e.preventDefault();
    setDragOver(toolId);
  };

  const handleDragLeave = () => {
    setDragOver(null);
  };

  const handleDrop = (e: React.DragEvent, tool: PDFToolConfig) => {
    e.preventDefault();
    setDragOver(null);
    
    const files = Array.from(e.dataTransfer.files).filter(
      f => f.type === 'application/pdf' || 
           f.type.startsWith('image/') ||
           tool.tool_type === 'convert_to_pdf'
    );
    
    if (files.length > 0) {
      onToolSelect(tool.tool_type, files);
    }
  };

  const handleFileSelect = (tool: PDFToolConfig, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onToolSelect(tool.tool_type, files);
    }
    // Reset input
    e.target.value = '';
  };

  const handleToolClick = (tool: PDFToolConfig) => {
    const input = fileInputRefs.current[tool.id];
    if (input) {
      input.click();
    }
  };

  const getAcceptedTypes = (toolType: PDFToolType): string => {
    switch (toolType) {
      case 'convert_to_pdf':
        return 'image/*,.doc,.docx,.txt';
      case 'merge':
      case 'compare':
        return '.pdf';
      default:
        return '.pdf,application/pdf';
    }
  };

  const isMultipleAllowed = (toolType: PDFToolType): boolean => {
    return ['merge', 'compare', 'convert_to_pdf'].includes(toolType);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="h-48 bg-gray-800/50 rounded-xl" />
        ))}
      </div>
    );
  }

  const basicTools = tools.filter(t => !t.is_premium);
  const premiumTools = tools.filter(t => t.is_premium);

  return (
    <div className="space-y-12">
      {/* Basic Tools */}
      <section>
        <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <span className="w-2 h-2 bg-cyan-400 rounded-full" />
          Core Processing Suite
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {basicTools.map((tool, index) => (
            <ToolCard
              key={tool.id}
              tool={tool}
              index={index}
              isDragOver={dragOver === tool.id}
              isPremiumUser={isPremium}
              userBalance={userBalance}
              onDragOver={(e) => handleDragOver(e, tool.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, tool)}
              onClick={() => handleToolClick(tool)}
              fileInputRef={(el) => { if (el) fileInputRefs.current[tool.id] = el; }}
              acceptedTypes={getAcceptedTypes(tool.tool_type)}
              allowMultiple={isMultipleAllowed(tool.tool_type)}
              onFileSelect={(e) => handleFileSelect(tool, e)}
            />
          ))}
        </div>
      </section>

      {/* Premium Tools */}
      <section>
        <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <Crown className="w-5 h-5 text-yellow-400" />
          <span className="text-gradient bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
            Advanced Security Suite
          </span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {premiumTools.map((tool, index) => (
            <ToolCard
              key={tool.id}
              tool={tool}
              index={index + basicTools.length}
              isDragOver={dragOver === tool.id}
              isPremiumUser={isPremium}
              userBalance={userBalance}
              onDragOver={(e) => handleDragOver(e, tool.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, tool)}
              onClick={() => handleToolClick(tool)}
              fileInputRef={(el) => { if (el) fileInputRefs.current[tool.id] = el; }}
              acceptedTypes={getAcceptedTypes(tool.tool_type)}
              allowMultiple={isMultipleAllowed(tool.tool_type)}
              onFileSelect={(e) => handleFileSelect(tool, e)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

interface ToolCardProps {
  tool: PDFToolConfig;
  index: number;
  isDragOver: boolean;
  isPremiumUser: boolean;
  userBalance: number;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onClick: () => void;
  fileInputRef: (el: HTMLInputElement | null) => void;
  acceptedTypes: string;
  allowMultiple: boolean;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function ToolCard({
  tool,
  index,
  isDragOver,
  isPremiumUser,
  userBalance,
  onDragOver,
  onDragLeave,
  onDrop,
  onClick,
  fileInputRef,
  acceptedTypes,
  allowMultiple,
  onFileSelect
}: ToolCardProps) {
  const isLocked = tool.is_premium && !isPremiumUser && userBalance < tool.base_credits;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        "relative group cursor-pointer rounded-xl border transition-all duration-300",
        isDragOver 
          ? "border-cyan-400 bg-cyan-500/10 scale-105" 
          : "border-gray-700 bg-gray-900/50 hover:border-cyan-500/50 hover:bg-gray-800/50",
        isLocked && "opacity-60"
      )}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Premium Badge */}
      {tool.is_premium && (
        <div className="absolute -top-2 -right-2 z-10">
          <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full shadow-lg">
            <Crown className="w-3 h-3 text-black" />
            <span className="text-xs font-bold text-black">PRO</span>
          </div>
        </div>
      )}

      {/* Locked Overlay */}
      {isLocked && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 rounded-xl">
          <Lock className="w-8 h-8 text-gray-400" />
        </div>
      )}

      <div className="p-6">
        {/* Icon */}
        <div className={cn(
          "w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-colors",
          tool.is_premium 
            ? "bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30" 
            : "bg-cyan-500/10 border border-cyan-500/20 group-hover:border-cyan-500/40"
        )}>
          <span className="text-3xl">{tool.icon}</span>
        </div>

        {/* Title & Description */}
        <h3 className="font-semibold text-white mb-2">{tool.name}</h3>
        <p className="text-sm text-gray-400 mb-4 line-clamp-2">{tool.description}</p>

        {/* Credits Info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-xs font-medium px-2 py-1 rounded",
              tool.base_credits === 0 || (!tool.is_premium && tool.max_free_size_mb > 0)
                ? "bg-green-500/10 text-green-400"
                : "bg-cyan-500/10 text-cyan-400"
            )}>
              {!tool.is_premium && tool.max_free_size_mb > 0 
                ? `Free <${tool.max_free_size_mb}MB` 
                : `${tool.base_credits}+ credits`}
            </span>
          </div>
          
          <Upload className="w-5 h-5 text-gray-500 group-hover:text-cyan-400 transition-colors" />
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes}
        multiple={allowMultiple}
        onChange={onFileSelect}
        className="hidden"
      />
    </motion.div>
  );
}
