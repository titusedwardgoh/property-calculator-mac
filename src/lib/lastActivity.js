/**
 * Persisted idle-activity timestamp for client + middleware.
 * Cookie mirrors localStorage so middleware can redirect before client hydration.
 */
export const LAST_ACTIVITY_STORAGE_KEY = "propwiz_last_activity";

/** 1 year — expiry is not the idle gate; the numeric value is. */
const COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 365;

export function readStoredActivityMs() {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(LAST_ACTIVITY_STORAGE_KEY);
  if (raw == null) return null;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
}

function setActivityCookie(value) {
  if (typeof document === "undefined") return;
  const secure =
    typeof location !== "undefined" && location.protocol === "https:"
      ? "; Secure"
      : "";
  document.cookie = `${LAST_ACTIVITY_STORAGE_KEY}=${encodeURIComponent(value)}; path=/; max-age=${COOKIE_MAX_AGE_SEC}; SameSite=Lax${secure}`;
}

function clearActivityCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${LAST_ACTIVITY_STORAGE_KEY}=; path=/; max-age=0; SameSite=Lax`;
}

export function syncActivityTimestamp(ts = Date.now()) {
  if (typeof window === "undefined") return;
  const v = String(ts);
  localStorage.setItem(LAST_ACTIVITY_STORAGE_KEY, v);
  setActivityCookie(v);
}

export function clearActivityTimestamp() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LAST_ACTIVITY_STORAGE_KEY);
  clearActivityCookie();
}
