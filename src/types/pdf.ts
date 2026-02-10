export type PDFToolType = 
  | 'merge'
  | 'split'
  | 'compress'
  | 'convert_to_pdf'
  | 'convert_from_pdf'
  | 'rotate'
  | 'watermark'
  | 'password_protect'
  | 'unlock'
  | 'extract_pages'
  | 'ocr'
  | 'edit_text'
  | 'sign'
  | 'redact'
  | 'compare'
  | 'optimize';

export interface PDFToolConfig {
  id: string;
  tool_type: PDFToolType;
  name: string;
  description: string | null;
  icon: string;
  is_premium: boolean;
  base_credits: number;
  credits_per_mb: number;
  max_free_size_mb: number;
  is_enabled: boolean;
  sort_order: number;
}

export interface UserWallet {
  id: string;
  user_id: string;
  balance: number;
  lifetime_earned: number;
  lifetime_spent: number;
  is_premium: boolean;
  premium_until: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreditTransaction {
  id: string;
  user_id: string;
  wallet_id: string;
  transaction_type: string;
  amount: number;
  balance_before: number;
  balance_after: number;
  tool_used: PDFToolType | null;
  file_size_mb: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface ProcessingStep {
  id: string;
  label: string;
  status: 'pending' | 'processing' | 'complete';
  duration?: number;
}

export interface PDFProcessingResult {
  success: boolean;
  outputBlob?: Blob;
  outputBlobs?: Blob[];
  fileName?: string;
  fileNames?: string[];
  error?: string;
  creditsUsed: number;
  processingTimeMs?: number;
}
