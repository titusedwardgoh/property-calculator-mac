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
    // Clear the session silently - don't log errors for expected token expiration
    await supabase.auth.signOut();
    // Redirect to login
    router.push('/login');
  } catch (err) {
    // Only log if it's not a refresh token error (which is expected)
    if (!isRefreshTokenError(err)) {
      console.error('Error during logout:', err);
    }
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
    // Get initial session - wrap in try/catch to handle any errors
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        // Check if it's an invalid refresh token error
        // This commonly happens when refresh token expires after inactivity
        if (isRefreshTokenError(error)) {
          // Silently handle - this is expected behavior after token expiration
          handleInvalidRefreshToken(supabase, router);
          return;
        }
        setError(error);
        setLoading(false);
        return;
      }
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch((err) => {
      // Catch any unhandled errors during session retrieval
      if (isRefreshTokenError(err)) {
        handleInvalidRefreshToken(supabase, router);
        return;
      }
      setError(err);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        // Check for token refresh errors - Supabase automatically refreshes tokens
        // If refresh fails, we'll get a TOKEN_REFRESHED event with no session or an error
        if (event === 'TOKEN_REFRESHED') {
          if (!session) {
            // Token refresh failed, check for errors
            const { error: sessionError } = await supabase.auth.getSession();
            if (sessionError && isRefreshTokenError(sessionError)) {
              // Silently handle expired refresh token - this is expected after long inactivity
              handleInvalidRefreshToken(supabase, router);
              return;
            }
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
      } catch (err) {
        // Catch any errors during auth state change
        if (isRefreshTokenError(err)) {
          handleInvalidRefreshToken(supabase, router);
          return;
        }
        // For other errors, still update state
        setLoading(false);
        setError(err);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, router]);

  return { user, loading, error };
}

