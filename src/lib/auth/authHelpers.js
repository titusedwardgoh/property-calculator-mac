import {
  readStoredActivityMs,
  IDLE_TIMEOUT_MS,
  clearActivityTimestamp,
} from '@/lib/lastActivity';

export function isRefreshTokenError(error) {
  if (!error) return false;
  const message = (error.message || '').toLowerCase();
  return (
    message.includes('invalid refresh token') ||
    message.includes('refresh token not found') ||
    message.includes('refresh_token_not_found') ||
    message.includes('token has expired') ||
    message.includes('token is expired')
  );
}

export function isIdleExpired() {
  const stored = readStoredActivityMs();
  if (stored === null) return false;
  return Date.now() - stored >= IDLE_TIMEOUT_MS;
}

export async function clearInvalidSession(supabase) {
  clearActivityTimestamp();
  try {
    await supabase.auth.signOut();
  } catch {
    // Expected when refresh token is already invalid
  }
}
