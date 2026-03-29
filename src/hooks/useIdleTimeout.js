"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const IDLE_TIMEOUT = 2 * 60 * 60 * 1000; // 2 hours
const WARNING_TIME = 1 * 60 * 1000; // warning in the final minute before logout
const STORAGE_KEY = "propwiz_last_activity";
const ACTIVITY_DEBOUNCE_MS = 1500; // 1–2s: avoid hammering localStorage
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

function readStoredActivityMs() {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw == null) return null;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
}

function writeStoredActivityMs(ts = Date.now()) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, String(ts));
}

export function useIdleTimeout(user, onWarning, onLogout) {
  const router = useRouter();
  const supabase = createClient();
  const warningShownRef = useRef(false);
  const logoutInProgressRef = useRef(false);
  const debouncedRecordRef = useRef(null);
  const callbacksRef = useRef({ onWarning, onLogout });

  callbacksRef.current = { onWarning, onLogout };

  const performLogout = useCallback(async () => {
    if (logoutInProgressRef.current) return;
    logoutInProgressRef.current = true;
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

  /** Wall clock vs persisted last activity (reliable after sleep — setTimeout is not). */
  const checkActivity = useCallback(() => {
    if (!user) return;

    const stored = readStoredActivityMs();
    const last = stored ?? Date.now();
    const elapsed = Date.now() - last;

    if (elapsed >= IDLE_TIMEOUT) {
      performLogout();
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
    writeStoredActivityMs();
    warningShownRef.current = false;
  }, [user]);

  useEffect(() => {
    debouncedRecordRef.current = debounce(() => {
      if (!user) return;
      writeStoredActivityMs();
      warningShownRef.current = false;
    }, ACTIVITY_DEBOUNCE_MS);

    return () => {
      debouncedRecordRef.current?.cancel?.();
    };
  }, [user]);

  useEffect(() => {
    if (!user) {
      debouncedRecordRef.current?.cancel?.();
      if (typeof window !== "undefined") {
        localStorage.removeItem(STORAGE_KEY);
      }
      warningShownRef.current = false;
      logoutInProgressRef.current = false;
      return;
    }

    if (typeof window !== "undefined" && readStoredActivityMs() === null) {
      writeStoredActivityMs();
    }

    const bumpDebounced = () => debouncedRecordRef.current?.();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkActivity();
      }
    };

    const handleFocus = () => {
      checkActivity();
    };

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
