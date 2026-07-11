"use client";

import { createContext, useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  syncActivityTimestamp,
  readStoredActivityMs,
  clearActivityTimestamp,
} from '@/lib/lastActivity';
import { isIdleExpired, isRefreshTokenError, clearInvalidSession } from '@/lib/auth/authHelpers';

export const AuthContext = createContext(null);

export default function AuthProvider({ initialAuth, children }) {
  const [user, setUser] = useState(initialAuth?.initialUser ?? null);
  const [validated, setValidated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let mounted = true;

    async function validateAuth() {
      try {
        if (initialAuth?.idleExpired || isIdleExpired()) {
          await clearInvalidSession(supabase);
          if (mounted) {
            setUser(null);
          }
          return;
        }

        const { data: { user: validatedUser }, error: userError } =
          await supabase.auth.getUser();

        if (userError) {
          if (isRefreshTokenError(userError)) {
            await clearInvalidSession(supabase);
          }
          if (mounted) {
            setUser(null);
            setError(isRefreshTokenError(userError) ? null : userError);
          }
          return;
        }

        if (!validatedUser) {
          if (mounted) setUser(null);
          return;
        }

        if (isIdleExpired()) {
          await clearInvalidSession(supabase);
          if (mounted) setUser(null);
          return;
        }

        if (mounted) setUser(validatedUser);
      } catch (err) {
        if (isRefreshTokenError(err)) {
          await clearInvalidSession(supabase);
        }
        if (mounted) {
          setUser(null);
          setError(isRefreshTokenError(err) ? null : err);
        }
      } finally {
        if (mounted) setValidated(true);
      }
    }

    validateAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (event === 'INITIAL_SESSION') {
          if (session && readStoredActivityMs() === null) {
            syncActivityTimestamp();
          }
          return;
        }

        if (event === 'SIGNED_IN' && session) {
          syncActivityTimestamp(Date.now());
          if (mounted) {
            setUser(session.user);
            setError(null);
          }
          return;
        }

        if (event === 'SIGNED_OUT') {
          if (mounted) setUser(null);
          return;
        }

        if (event === 'TOKEN_REFRESHED') {
          if (!session) {
            const { error: sessionError } = await supabase.auth.getSession();
            if (sessionError && isRefreshTokenError(sessionError)) {
              await clearInvalidSession(supabase);
              if (mounted) setUser(null);
            }
          }
          return;
        }

        if (isIdleExpired()) {
          await clearInvalidSession(supabase);
          if (mounted) setUser(null);
          return;
        }

        if (mounted) {
          setUser(session?.user ?? null);
          setError(null);
        }
      } catch (err) {
        if (isRefreshTokenError(err)) {
          await clearInvalidSession(supabase);
          if (mounted) setUser(null);
        } else if (mounted) {
          setError(err);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, initialAuth?.idleExpired]);

  const showLoggedInUI =
    Boolean(user) || (!validated && Boolean(initialAuth?.initialShowLoggedInUI));

  const value = useMemo(
    () => ({ user, loading, error, showLoggedInUI }),
    [user, loading, error, showLoggedInUI]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
