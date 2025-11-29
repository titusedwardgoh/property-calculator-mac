"use client";

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useWindowCloseLogout(user) {
  const supabase = createClient();
  const hasLoggedOutRef = useRef(false);

  useEffect(() => {
    if (!user) return; // Only track for authenticated users

    const handleBeforeUnload = async (e) => {
      // Attempt to log out when window is closing
      if (!hasLoggedOutRef.current) {
        hasLoggedOutRef.current = true;
        
        // Use sendBeacon for reliable logout request during page unload
        // sendBeacon is more reliable than fetch during beforeunload
        const logoutUrl = '/api/auth/logout';
        const blob = new Blob([JSON.stringify({})], { type: 'application/json' });
        
        if (navigator.sendBeacon) {
          // Use sendBeacon if available (most reliable)
          navigator.sendBeacon(logoutUrl, blob);
        } else {
          // Fallback to synchronous fetch (less reliable but better than nothing)
          fetch(logoutUrl, {
            method: 'POST',
            body: JSON.stringify({}),
            headers: { 'Content-Type': 'application/json' },
            keepalive: true, // Keep request alive even after page unloads
          }).catch(() => {
            // Ignore errors - page is unloading anyway
          });
        }

        // Also try to sign out from Supabase client-side
        // This may not complete, but it's worth trying
        supabase.auth.signOut().catch(() => {
          // Ignore errors during unload
        });
      }
    };

    const handleVisibilityChange = async () => {
      // When tab becomes hidden (user switches tabs or minimizes)
      // We don't log out here, but we could track it for analytics
      // The idle timeout will handle long periods of inactivity
      if (document.visibilityState === 'hidden') {
        // Tab is now hidden - idle timeout will handle logout if needed
      }
    };

    // Listen for beforeunload (window close, tab close, navigation away)
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, supabase]);
}

