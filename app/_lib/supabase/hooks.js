'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from './client';
import { getCurrentUser } from './auth';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const accessTokenRef = useRef(null);

  useEffect(() => {
    // Use getSession first (reads from storage, fast) then enrich with profile
    const init = async () => {
      try {
        const { data: { session } } = await Promise.race([
          supabase.auth.getSession(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
        ]);
        if (session?.access_token) {
          accessTokenRef.current = session.access_token;
        }
        if (session?.user) {
          // Quick set with basic info first (stops "Laster..." immediately)
          setUser({
            id: session.user.id,
            email: session.user.email,
            displayName: session.user.user_metadata?.display_name || session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Bruker',
            companyName: session.user.user_metadata?.company_name,
            avatarUrl: session.user.user_metadata?.avatar_url,
            plan: 'free',
          });
          setLoading(false);
          // Then enrich with profile data in background
          const full = await getCurrentUser();
          if (full) setUser(full);
        } else {
          setUser(null);
          setLoading(false);
        }
      } catch {
        setUser(null);
        setLoading(false);
      }
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      accessTokenRef.current = session?.access_token || null;
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email,
          displayName: session.user.user_metadata?.display_name || session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Bruker',
          companyName: session.user.user_metadata?.company_name,
          avatarUrl: session.user.user_metadata?.avatar_url,
          plan: 'free',
        });
        setLoading(false);
        const full = await getCurrentUser();
        if (full) setUser(full);
      } else {
        setUser(null);
        setLoading(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  /**
   * Get a valid access token. Uses the cached token from onAuthStateChange,
   * falling back to getSession() with a timeout to avoid browser lock hangs.
   */
  const getAccessToken = async () => {
    if (accessTokenRef.current) return accessTokenRef.current;
    // Fallback: try getSession with a 3-second timeout
    try {
      const result = await Promise.race([
        supabase.auth.getSession(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Session timeout')), 3000)),
      ]);
      const token = result?.data?.session?.access_token || null;
      if (token) accessTokenRef.current = token;
      return token;
    } catch {
      return null;
    }
  };

  return { user, loading, getAccessToken };
}
