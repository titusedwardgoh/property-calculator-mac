"use client";

import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const IDLE_TIMEOUT = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
const WARNING_TIME = 1 * 60 * 1000; // 1 minute before logout (warning shown at 1h 59m)

// Debounce function to limit how often we reset the timer
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function useIdleTimeout(user, onWarning, onLogout) {
  const router = useRouter();
  const timeoutRef = useRef(null);
  const warningTimeoutRef = useRef(null);
  const lastActivityRef = useRef(Date.now());
  const warningShownRef = useRef(false);
  const supabase = createClient();

  // Reset idle timer on user activity
  const resetIdleTimer = useCallback(() => {
    if (!user) return; // Only track for authenticated users

    const now = Date.now();
    lastActivityRef.current = now;
    warningShownRef.current = false;

    // Clear existing timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = null;
    }

    // Set warning timeout (1 minute before logout)
    warningTimeoutRef.current = setTimeout(() => {
      if (onWarning) {
        warningShownRef.current = true;
        onWarning();
      }
    }, IDLE_TIMEOUT - WARNING_TIME);

    // Set logout timeout
    timeoutRef.current = setTimeout(async () => {
      // Perform logout
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
        await supabase.auth.signOut();
        if (onLogout) {
          onLogout();
        }
        router.push('/login');
      } catch (error) {
        console.error('Auto-logout error:', error);
        // Force redirect even if logout fails
        router.push('/login');
      }
    }, IDLE_TIMEOUT);
  }, [user, onWarning, onLogout, router, supabase]);

  // Handle user staying logged in (from warning modal)
  const stayLoggedIn = useCallback(() => {
    resetIdleTimer();
  }, [resetIdleTimer]);

  // Create debounced activity handler using ref to persist across renders
  const debouncedResetRef = useRef(null);
  
  useEffect(() => {
    // Create debounced function that calls resetIdleTimer
    debouncedResetRef.current = debounce(() => {
      resetIdleTimer();
    }, 1000); // Debounce to 1 second
    
    return () => {
      // Cleanup on unmount
      if (debouncedResetRef.current) {
        // Clear any pending debounced calls
        debouncedResetRef.current.cancel?.();
      }
    };
  }, [resetIdleTimer]);

  useEffect(() => {
    if (!user) {
      // Clear timeouts if user logs out
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
        warningTimeoutRef.current = null;
      }
      return;
    }

    // Initialize timer on mount
    resetIdleTimer();

    // Track mouse movements (debounced)
    const handleMouseMove = () => {
      if (debouncedResetRef.current) {
        debouncedResetRef.current();
      }
    };
    
    // Track clicks
    const handleClick = () => {
      resetIdleTimer();
    };
    
    // Track keyboard input
    const handleKeyDown = () => {
      resetIdleTimer();
    };
    
    // Track scrolling (debounced)
    const handleScroll = () => {
      if (debouncedResetRef.current) {
        debouncedResetRef.current();
      }
    };
    
    // Track page visibility (when tab becomes visible again)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // When tab becomes visible again, check if user has been inactive for the full timeout
        // Only log out if they've been inactive for the ENTIRE timeout period
        const timeSinceLastActivity = Date.now() - lastActivityRef.current;
        if (timeSinceLastActivity >= IDLE_TIMEOUT) {
          // User has been away for the full timeout period, log them out
          supabase.auth.signOut().then(() => {
            router.push('/login');
          });
        } else {
          // Reset timer if they haven't been away too long
          // This allows users to switch tabs/websites and come back without being logged out
          resetIdleTimer();
        }
      } else {
        // Tab is hidden - don't do anything, let the idle timeout handle it
        // The timer will continue running and log out if they're inactive for 2 hours
      }
    };
    
    // Track window focus
    const handleFocus = () => {
      resetIdleTimer();
    };

    // Add event listeners
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleClick);
    window.addEventListener('click', handleClick);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScroll, true); // Use capture phase for all scroll events
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    // Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleClick);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll, true);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
    };
  }, [user, resetIdleTimer, router, supabase]);

  return { stayLoggedIn };
}

