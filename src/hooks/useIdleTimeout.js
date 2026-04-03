"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LAST_ACTIVITY_STORAGE_KEY,
  readStoredActivityMs,
  syncActivityTimestamp,
  clearActivityTimestamp,
} from "@/lib/lastActivity";

const IDLE_TIMEOUT = 2 * 60 * 60 * 1000; // 2 hours
const WARNING_TIME = 1 * 60 * 1000; // warning in the final minute before logout
const ACTIVITY_DEBOUNCE_MS = 1500;
const HEARTBEAT_MS = 30 * 1000;

function debounce(func, wait) {
  let timeout;
  const executedFunction = (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
  executedFunction.cancel = () => clearTimeout(timeout);
  return executedFunction;
}

export function useIdleTimeout(user, onWarning, onLogout) {
  const router = useRouter();
  const supabase = createClient();
  const warningShownRef = useRef(false);
  const logoutInProgressRef = useRef(false);
  const debouncedRecordRef = useRef(null);
  /** Avoid clearing storage on first paint while `user` is still null (auth loading). */
  const hadAuthenticatedUserRef = useRef(false);
  const callbacksRef = useRef({ onWarning, onLogout });

  callbacksRef.current = { onWarning, onLogout };

  const performLogout = useCallback(async () => {
    if (logoutInProgressRef.current) return;
    logoutInProgressRef.current = true;
    clearActivityTimestamp();
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      await supabase.auth.signOut();
      callbacksRef.current.onLogout?.();
      router.push("/login");
    } catch (error) {
      console.error("Auto-logout error:", error);
      router.push("/login");
    }
  }, [router, supabase]);

  /**
   * Wall-clock check (localStorage). Timestamps frozen while the machine sleeps;
   * timers do not — use this on visibility, focus, interval, and mount.
   * Null / missing storage → last = 0 → forces logout (no ghost sessions).
   */
  const checkActivity = useCallback(() => {
    if (!user) return;

    const stored = readStoredActivityMs();
    const last = stored === null ? 0 : stored;
    const elapsed = Date.now() - last;

    if (elapsed >= IDLE_TIMEOUT) {
      void performLogout();
      return;
    }

    if (elapsed >= IDLE_TIMEOUT - WARNING_TIME) {
      const cb = callbacksRef.current.onWarning;
      if (cb && !warningShownRef.current) {
        warningShownRef.current = true;
        cb();
      }
    } else {
      warningShownRef.current = false;
    }
  }, [user, performLogout]);

  const stayLoggedIn = useCallback(() => {
    if (!user) return;
    syncActivityTimestamp();
    warningShownRef.current = false;
  }, [user]);

  useLayoutEffect(() => {
    if (!user) return;
    checkActivity();
  }, [user, checkActivity]);

  useEffect(() => {
    debouncedRecordRef.current = debounce(() => {
      if (!user) return;
      syncActivityTimestamp();
      warningShownRef.current = false;
    }, ACTIVITY_DEBOUNCE_MS);

    return () => {
      debouncedRecordRef.current?.cancel?.();
    };
  }, [user]);

  useEffect(() => {
    if (!user) {
      debouncedRecordRef.current?.cancel?.();
      if (hadAuthenticatedUserRef.current) {
        clearActivityTimestamp();
      }
      hadAuthenticatedUserRef.current = false;
      warningShownRef.current = false;
      logoutInProgressRef.current = false;
      return;
    }

    hadAuthenticatedUserRef.current = true;

    const bumpDebounced = () => debouncedRecordRef.current?.();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkActivity();
      }
    };

    const handleFocus = () => {
      checkActivity();
    };

    const handleStorage = (e) => {
      if (e.key !== LAST_ACTIVITY_STORAGE_KEY) return;
      warningShownRef.current = false;
      checkActivity();
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("mousemove", bumpDebounced);
    window.addEventListener("mousedown", bumpDebounced);
    window.addEventListener("click", bumpDebounced);
    window.addEventListener("keydown", bumpDebounced);
    window.addEventListener("scroll", bumpDebounced, true);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    checkActivity();
    const heartbeat = window.setInterval(checkActivity, HEARTBEAT_MS);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("mousemove", bumpDebounced);
      window.removeEventListener("mousedown", bumpDebounced);
      window.removeEventListener("click", bumpDebounced);
      window.removeEventListener("keydown", bumpDebounced);
      window.removeEventListener("scroll", bumpDebounced, true);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      window.clearInterval(heartbeat);
    };
  }, [user, checkActivity]);

  return { stayLoggedIn };
}
