import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { UserWallet, CreditTransaction, PDFToolType } from '@/types/pdf';

export function usePDFWallet() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<UserWallet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWallet = useCallback(async () => {
    if (!user) {
      setWallet(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error: fetchError } = await supabase
        .from('user_wallets')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (fetchError) {
        // Wallet might not exist yet - create one
        if (fetchError.code === 'PGRST116') {
          const { data: newWallet, error: createError } = await supabase
            .from('user_wallets')
            .insert({ user_id: user.id, balance: 50, lifetime_earned: 50 })
            .select()
            .single();

          if (createError) throw createError;
          setWallet(newWallet as unknown as UserWallet);
        } else {
          throw fetchError;
        }
      } else {
        setWallet(data as unknown as UserWallet);
      }
    } catch (err) {
      console.error('Error fetching wallet:', err);
      setError(err instanceof Error ? err.message : 'Failed to load wallet');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  const deductCredits = async (
    amount: number,
    toolUsed: PDFToolType,
    fileSizeMb: number
  ): Promise<boolean> => {
    if (!user || !wallet) return false;
    if (wallet.balance < amount) return false;

    const newBalance = wallet.balance - amount;

    try {
      // Update wallet
      const { error: updateError } = await supabase
        .from('user_wallets')
        .update({
          balance: newBalance,
          lifetime_spent: wallet.lifetime_spent + amount
        })
        .eq('id', wallet.id);

      if (updateError) throw updateError;

      // Log transaction
      await supabase.from('credit_transactions').insert({
        user_id: user.id,
        wallet_id: wallet.id,
        transaction_type: 'tool_usage',
        amount: -amount,
        balance_before: wallet.balance,
        balance_after: newBalance,
        tool_used: toolUsed,
        file_size_mb: fileSizeMb
      });

      // Update local state
      setWallet(prev => prev ? { ...prev, balance: newBalance, lifetime_spent: prev.lifetime_spent + amount } : null);
      
      return true;
    } catch (err) {
      console.error('Error deducting credits:', err);
      return false;
    }
  };

  const addCredits = async (
    amount: number,
    transactionType: 'ad_bonus' | 'purchase' | 'admin_grant' | 'referral_bonus' | 'daily_bonus'
  ): Promise<boolean> => {
    if (!user || !wallet) return false;

    const newBalance = wallet.balance + amount;

    try {
      const { error: updateError } = await supabase
        .from('user_wallets')
        .update({
          balance: newBalance,
          lifetime_earned: wallet.lifetime_earned + amount
        })
        .eq('id', wallet.id);

      if (updateError) throw updateError;

      await supabase.from('credit_transactions').insert({
        user_id: user.id,
        wallet_id: wallet.id,
        transaction_type: transactionType,
        amount: amount,
        balance_before: wallet.balance,
        balance_after: newBalance
      });

      setWallet(prev => prev ? { 
        ...prev, 
        balance: newBalance, 
        lifetime_earned: prev.lifetime_earned + amount 
      } : null);
      
      return true;
    } catch (err) {
      console.error('Error adding credits:', err);
      return false;
    }
  };

  const checkCredits = (required: number): boolean => {
    return (wallet?.balance ?? 0) >= required;
  };

  return {
    wallet,
    isLoading,
    error,
    refreshWallet: fetchWallet,
    deductCredits,
    addCredits,
    checkCredits
  };
}
