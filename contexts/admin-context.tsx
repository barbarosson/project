'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

interface AdminProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: 'admin' | 'super_admin';
  tenant_id: string | null;
}

interface AdminContextType {
  user: User | null;
  profile: AdminProfile | null;
  isLoading: boolean;
  isSuperAdmin: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const profileRef = useRef<AdminProfile | null>(null);

  const fetchProfile = async (userId: string) => {
    try {
      console.log('🔵 [AdminContext] Fetching profile for user:', userId);

      // Timeout after 10 seconds
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Profile fetch timeout')), 10000)
      );

      const queryPromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

      console.log('🔵 [AdminContext] Profile query result:', {
        data,
        error,
        hasData: !!data,
        dataRole: data?.role
      });

      if (error) {
        console.error('❌ [AdminContext] Profile fetch error:', error);
        throw error;
      }

      if (data && (data.role === 'admin' || data.role === 'super_admin')) {
        console.log('✅ [AdminContext] Admin profile set:', data.role);
        const adminProfile = data as AdminProfile;
        setProfile(adminProfile);
        profileRef.current = adminProfile;
      } else {
        console.error('❌ [AdminContext] Not an admin user, data:', data);
        setProfile(null);
        profileRef.current = null;
        await supabase.auth.signOut();
      }
    } catch (error) {
      console.error('❌ [AdminContext] Error fetching profile:', error);
      setProfile(null);
      profileRef.current = null;
      throw error;
    }
  };

  const refreshProfile = async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (currentUser) {
      await fetchProfile(currentUser.id);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        console.log('🔵 [AdminContext] Initializing auth...');

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('❌ [AdminContext] Session error:', sessionError);
          return;
        }

        const currentUser = session?.user || null;
        console.log('🔵 [AdminContext] Current user:', currentUser?.id, currentUser?.email);

        if (currentUser && mounted) {
          setUser(currentUser);
          await fetchProfile(currentUser.id);
        } else {
          console.log('🔵 [AdminContext] No active session');
        }
      } catch (error) {
        console.error('❌ [AdminContext] Auth initialization error:', error);
      } finally {
        if (mounted) {
          console.log('🔵 [AdminContext] Auth initialization complete, setting isLoading to false');
          setIsLoading(false);
        }
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔵 [AdminContext] Auth state change:', event, 'mounted:', mounted);
        if (!mounted) return;

        if (event === 'SIGNED_IN' && session?.user) {
          console.log('🔵 [AdminContext] User signed in, checking if profile already loaded...');
          console.log('🔵 [AdminContext] Current profile ref:', profileRef.current?.id);

          // Only fetch profile if we don't have it yet or user changed
          if (!profileRef.current || profileRef.current.id !== session.user.id) {
            console.log('🔵 [AdminContext] Profile not loaded or user changed, fetching...');
            setIsLoading(true);
            setUser(session.user);
            await fetchProfile(session.user.id);
            setIsLoading(false);
            console.log('🔵 [AdminContext] Profile fetch complete, isLoading set to false');
          } else {
            console.log('🔵 [AdminContext] Profile already loaded, skipping fetch');
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('🔵 [AdminContext] User signed out');
          setUser(null);
          setProfile(null);
          profileRef.current = null;
          setIsLoading(false);
        }
      }
    );

    return () => {
      console.log('🔵 [AdminContext] Cleanup: unsubscribing');
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      profileRef.current = null;
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const isSuperAdmin = profile?.role === 'super_admin';

  return (
    <AdminContext.Provider
      value={{
        user,
        profile,
        isLoading,
        isSuperAdmin,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}
