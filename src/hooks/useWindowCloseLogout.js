"use client";

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useWindowCloseLogout(user) {
  const supabase = createClient();
  const hasLoggedOutRef = useRef(false);

  useEffect(() => {
    if (!user) return; // Only track for authenticated users

    const handleBeforeUnload = async (e) => {
      // Only log out on actual window/tab close, not on navigation or refresh
      // Check if this is a navigation within the same site by checking if it's a same-origin navigation
      // We can't reliably detect this, so we'll disable auto-logout on beforeunload
      // The idle timeout will handle logout after inactivity instead
      
      // DISABLED: Don't log out on navigation/refresh
      // This was causing users to be logged out when refreshing or navigating between pages
      return;
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

