import { useState, useEffect, useRef, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { isNative } from '@/lib/capacitor/platform';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const isMounted = useRef(true);
  const initialSessionChecked = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    console.log('[Auth] Setting up auth listener');

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        if (!isMounted.current) return;
        console.log('[Auth] State change:', event, currentSession?.user?.email ?? 'no user');
        
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (!isMounted.current) return;
      if (!initialSessionChecked.current) {
        initialSessionChecked.current = true;
        console.log('[Auth] Initial session:', currentSession?.user?.email ?? 'none');
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);
      }
    }).catch((err) => {
      console.error('[Auth] getSession error:', err);
      if (isMounted.current) setLoading(false);
    });

    return () => {
      isMounted.current = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('[Auth] Signing in:', email);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        console.error('[Auth] Sign in error:', error.message);
      } else {
        console.log('[Auth] Sign in success');
      }
      return { error: error as Error | null };
    } catch (err) {
      console.error('[Auth] Sign in crash:', err);
      return { error: err as Error };
    }
  };

  const signInWithGoogle = async () => {
    // For native apps, use deep link scheme for OAuth redirect
    const redirectUrl = isNative
      ? 'app.lifeos.com://callback'
      : `${window.location.origin}/dashboard`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
      }
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      console.log('[Auth] Signed out');
    } catch (err) {
      console.error('[Auth] Sign out error:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
