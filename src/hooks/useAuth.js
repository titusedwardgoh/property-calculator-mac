"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

// Helper function to check if error is an invalid refresh token error
function isRefreshTokenError(error) {
  if (!error) return false;
  const message = error.message || '';
  return (
    message.includes('Invalid Refresh Token') ||
    message.includes('Refresh Token Not Found') ||
    message.includes('refresh_token_not_found') ||
    error.status === 401
  );
}

// Helper function to handle invalid refresh token
async function handleInvalidRefreshToken(supabase, router) {
  try {
    // Clear the session
    await supabase.auth.signOut();
    // Redirect to login
    router.push('/login');
  } catch (err) {
    console.error('Error during logout:', err);
    // Force redirect even if logout fails
    router.push('/login');
  }
}

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        // Check if it's an invalid refresh token error
        if (isRefreshTokenError(error)) {
          console.error('Invalid refresh token detected, clearing session...');
          handleInvalidRefreshToken(supabase, router);
          return;
        }
        setError(error);
        setLoading(false);
        return;
      }
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Check for token refresh errors
      if (event === 'TOKEN_REFRESHED' && !session) {
        // Token refresh failed, check for errors
        const { error: sessionError } = await supabase.auth.getSession();
        if (sessionError && isRefreshTokenError(sessionError)) {
          console.error('Invalid refresh token detected in auth state change, clearing session...');
          handleInvalidRefreshToken(supabase, router);
          return;
        }
      }
      
      // Handle SIGNED_OUT event which might indicate invalid token
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setLoading(false);
        return;
      }
      
      setUser(session?.user ?? null);
      setLoading(false);
      setError(null);
    });

    return () => subscription.unsubscribe();
  }, [supabase, router]);

  return { user, loading, error };
}

