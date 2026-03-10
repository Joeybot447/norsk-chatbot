'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { supabase } from './client';
import { getCurrentUser } from './auth';

/**
 * Stable auth hook that avoids unnecessary re-renders.
 * 
 * Fixes:
 * - Bug 2: Memoized state object, stable getAccessToken via useCallback
 * - Bug 3: Refreshes session on tab focus (visibilitychange), token staleness check
 * - Bug 4: Loading only true on initial mount, never flickers back to true
 */
export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const accessTokenRef = useRef(null);
  const tokenExpiresAtRef = useRef(0);
  const initDoneRef = useRef(false);
  const refreshingRef = useRef(false);

  // Store token with expiry tracking
  const storeToken = useCallback((session) => {
    if (session?.access_token) {
      accessTokenRef.current = session.access_token;
      // Supabase tokens typically expire in 3600s; refresh early at 80%
      const expiresIn = session.expires_in || 3600;
      tokenExpiresAtRef.current = Date.now() + expiresIn * 800; // 80% of TTL in ms
    } else {
      accessTokenRef.current = null;
      tokenExpiresAtRef.current = 0;
    }
  }, []);

  // Build a minimal user object from session (avoids extra network call for initial render)
  const userFromSession = useCallback((sessionUser) => {
    if (!sessionUser) return null;
    return {
      id: sessionUser.id,
      email: sessionUser.email,
      displayName:
        sessionUser.user_metadata?.display_name ||
        sessionUser.user_metadata?.full_name ||
        sessionUser.email?.split('@')[0] ||
        'Bruker',
      companyName: sessionUser.user_metadata?.company_name,
      avatarUrl: sessionUser.user_metadata?.avatar_url,
      plan: 'free',
    };
  }, []);

  // Refresh the session from Supabase (used on tab focus and token staleness)
  const refreshSession = useCallback(async () => {
    if (refreshingRef.current) return;
    refreshingRef.current = true;
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      if (error || !session) {
        // Try getSession as fallback
        const { data: fallback } = await supabase.auth.getSession();
        if (fallback?.session) {
          storeToken(fallback.session);
        }
      } else {
        storeToken(session);
      }
    } catch {
      // Silently fail — token will be fetched on next getAccessToken call
    } finally {
      refreshingRef.current = false;
    }
  }, [storeToken]);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        const { data: { session } } = await Promise.race([
          supabase.auth.getSession(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
        ]);
        if (cancelled) return;

        storeToken(session);

        if (session?.user) {
          const basicUser = userFromSession(session.user);
          setUser(basicUser);
          setLoading(false);
          initDoneRef.current = true;

          // Enrich with profile in background (don't cause loading flash)
          try {
            const full = await getCurrentUser();
            if (!cancelled && full) {
              setUser((prev) => {
                // Only update if data actually changed
                if (prev && prev.id === full.id &&
                    prev.displayName === full.displayName &&
                    prev.plan === full.plan &&
                    prev.companyName === full.companyName) {
                  return prev;
                }
                return full;
              });
            }
          } catch {
            // Profile enrichment failed — basic user is fine
          }
        } else {
          setUser(null);
          setLoading(false);
          initDoneRef.current = true;
        }
      } catch {
        if (!cancelled) {
          setUser(null);
          setLoading(false);
          initDoneRef.current = true;
        }
      }
    };

    init();

    // Auth state listener — only update user when meaningful changes happen
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;

      storeToken(session);

      if (event === 'SIGNED_OUT') {
        setUser(null);
        return;
      }

      if (session?.user) {
        // Only update user if we don't have one or if the user ID changed
        setUser((prev) => {
          if (prev && prev.id === session.user.id) {
            // Same user — don't trigger re-render for token refresh events
            if (event === 'TOKEN_REFRESHED') return prev;
            return prev;
          }
          return userFromSession(session.user);
        });

        if (!initDoneRef.current) {
          setLoading(false);
          initDoneRef.current = true;
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    // Tab visibility handler — refresh session when user comes back
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshSession();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [storeToken, userFromSession, refreshSession]);

  /**
   * Get a valid access token.
   * If the cached token is stale (past 80% of TTL), proactively refresh.
   * On failure, falls back to getSession.
   */
  const getAccessToken = useCallback(async () => {
    // Check if cached token is still fresh
    if (accessTokenRef.current && Date.now() < tokenExpiresAtRef.current) {
      return accessTokenRef.current;
    }

    // Token is stale or missing — refresh
    try {
      const { data: { session } } = await Promise.race([
        supabase.auth.refreshSession(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('refresh timeout')), 5000)),
      ]);
      if (session?.access_token) {
        storeToken(session);
        return session.access_token;
      }
    } catch {
      // Refresh failed
    }

    // Final fallback: getSession
    try {
      const { data: { session } } = await Promise.race([
        supabase.auth.getSession(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('session timeout')), 3000)),
      ]);
      if (session?.access_token) {
        storeToken(session);
        return session.access_token;
      }
    } catch {
      // Both methods failed
    }

    return null;
  }, [storeToken]);

  // Return a stable object reference using useMemo
  return useMemo(() => ({
    user,
    loading,
    getAccessToken,
  }), [user, loading, getAccessToken]);
}
