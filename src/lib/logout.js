import { createClient } from '@/lib/supabase/client';
import { clearSurveyOnLogout } from '@/lib/clearSurveyOnLogout';

export const LOGOUT_REDIRECT_KEY = 'propwiz_logout_redirect';
export const LOGOUT_OVERLAY_EVENT = 'propwiz:logout-start';

function triggerLogoutOverlay() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(LOGOUT_OVERLAY_EVENT));
  }
}

function waitForOverlayPaint() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTimeout(resolve, 80);
      });
    });
  });
}

/** Where to send users who hit a protected page without a session. */
export function getRedirectForUnauthenticatedUser(fallbackPath = '/') {
  if (typeof window !== 'undefined') {
    const logoutRedirect = sessionStorage.getItem(LOGOUT_REDIRECT_KEY);
    if (logoutRedirect) {
      sessionStorage.removeItem(LOGOUT_REDIRECT_KEY);
      return logoutRedirect;
    }
  }

  const next = fallbackPath.startsWith('/') ? fallbackPath : `/${fallbackPath}`;
  return `/login?next=${encodeURIComponent(next)}`;
}

/** Sign out and hard-navigate so client redirects on protected pages cannot race. */
export async function performLogout(redirectTo = '/') {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(LOGOUT_REDIRECT_KEY, redirectTo);
    triggerLogoutOverlay();
    await waitForOverlayPaint();
  }

  const supabase = createClient();

  try {
    await fetch('/api/auth/logout', { method: 'POST' });
    await supabase.auth.signOut();
    clearSurveyOnLogout();
  } catch (error) {
    console.error('Logout error:', error);
  }

  if (typeof window !== 'undefined') {
    window.location.assign(redirectTo);
  }
}
