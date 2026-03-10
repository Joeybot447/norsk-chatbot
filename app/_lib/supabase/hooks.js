'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from './client';
import { getCurrentUser } from './auth';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const accessTokenRef = useRef(null);

  useEffect(() => {
    getCurrentUser().then((u) => {
      setUser(u);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Store the access token from every auth state change
      accessTokenRef.current = session?.access_token || null;
      if (session?.user) {
        const u = await getCurrentUser();
        setUser(u);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    // Also grab initial session token (non-blocking, no lock issues in Node)
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session?.access_token) {
        accessTokenRef.current = data.session.access_token;
      }
    }).catch(() => {});
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
