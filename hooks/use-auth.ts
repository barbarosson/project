'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

interface AuthState {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    session: null,
    user: null,
    isLoading: true,
    isError: false,
    error: null,
  });

  const login = useCallback(
    async (email: string, password: string) => {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null, isError: false }));

      try {
        console.log('🔵 [useAuth] Login started:', { email });

        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError) {
          console.error('❌ [useAuth] Auth error:', authError);
          throw authError;
        }

        if (!authData.session) {
          console.error('❌ [useAuth] No session in response');
          throw new Error('No session returned from authentication');
        }

        console.log('✅ [useAuth] User authenticated:', authData.user.id);
        console.log('✅ [useAuth] Session stored automatically by Supabase');

        await new Promise(resolve => setTimeout(resolve, 100));

        console.log('✅ [useAuth] Login successful');

        setAuthState({
          session: authData.session,
          user: authData.user,
          isLoading: false,
          isError: false,
          error: null,
        });

        return authData.session;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        console.error('❌ [useAuth] Login failed:', err.message);

        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          isError: true,
          error: err,
        }));

        throw err;
      }
    },
    []
  );

  const logout = useCallback(async () => {
    console.log('🔵 [useAuth] Logging out...');
    await supabase.auth.signOut();

    setAuthState({
      session: null,
      user: null,
      isLoading: false,
      isError: false,
      error: null,
    });

    console.log('✅ [useAuth] Logged out');
  }, []);

  useEffect(() => {
    let mounted = true;
    console.log('🔵 [useAuth] Initializing auth state listener...');

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔄 [useAuth] Auth state changed:', event, session?.user?.email || 'no session');

        if (mounted) {
          setAuthState({
            session,
            user: session?.user ?? null,
            isLoading: false,
            isError: false,
            error: null,
          });
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log('🔵 [useAuth] Initial session check:', {
        hasSession: !!session,
        userId: session?.user?.id,
        error: error?.message
      });

      if (mounted) {
        if (error) {
          setAuthState(prev => ({
            ...prev,
            isLoading: false,
            isError: true,
            error,
          }));
        } else {
          setAuthState({
            session,
            user: session?.user ?? null,
            isLoading: false,
            isError: false,
            error: null,
          });
        }
      }
    });

    return () => {
      console.log('🔵 [useAuth] Cleaning up auth listener');
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  return {
    ...authState,
    login,
    logout,
  };
}
