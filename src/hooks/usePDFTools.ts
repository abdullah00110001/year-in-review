import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { PDFToolConfig, PDFToolType } from '@/types/pdf';

export function usePDFTools() {
  const [toolConfigs, setToolConfigs] = useState<PDFToolConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchToolConfigs() {
      try {
        const { data, error: fetchError } = await supabase
          .from('pdf_tool_configs')
          .select('*')
          .eq('is_enabled', true)
          .order('sort_order', { ascending: true });

        if (fetchError) throw fetchError;
        setToolConfigs(data as unknown as PDFToolConfig[]);
      } catch (err) {
        console.error('Error fetching tool configs:', err);
        setError(err instanceof Error ? err.message : 'Failed to load tools');
      } finally {
        setIsLoading(false);
      }
    }

    fetchToolConfigs();
  }, []);

  const calculateCredits = (
    toolType: PDFToolType,
    fileSizeMb: number,
    isPremiumUser: boolean
  ): number => {
    const config = toolConfigs.find(t => t.tool_type === toolType);
    if (!config) return 0;
    
    // Premium users get free processing for non-premium tools
    if (isPremiumUser && !config.is_premium) return 0;
    
    // Files under max free size are free for basic tools
    if (!config.is_premium && fileSizeMb <= config.max_free_size_mb) return 0;
    
    // Calculate credits: base + (size * rate)
    const sizeCredits = Math.ceil(fileSizeMb * config.credits_per_mb);
    return config.base_credits + sizeCredits;
  };

  const getToolConfig = (toolType: PDFToolType): PDFToolConfig | undefined => {
    return toolConfigs.find(t => t.tool_type === toolType);
  };

  return {
    toolConfigs,
    isLoading,
    error,
    calculateCredits,
    getToolConfig
  };
}
