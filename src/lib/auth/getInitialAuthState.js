import { cookies } from 'next/headers';
import { unstable_noStore as noStore } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { LAST_ACTIVITY_STORAGE_KEY, IDLE_TIMEOUT_MS } from '@/lib/lastActivity';

function readActivityMsFromCookies(cookieStore) {
  const raw = cookieStore.get(LAST_ACTIVITY_STORAGE_KEY)?.value;
  if (raw == null) return null;
  const decoded = decodeURIComponent(raw);
  const n = parseInt(decoded, 10);
  return Number.isFinite(n) ? n : null;
}

/** Server-side auth hint for first paint — respects idle timeout before trusting session. */
export async function getInitialAuthState() {
  noStore();
  const cookieStore = await cookies();
  const activityMs = readActivityMsFromCookies(cookieStore);
  const idleExpired =
    activityMs !== null && Date.now() - activityMs >= IDLE_TIMEOUT_MS;

  if (idleExpired) {
    return {
      initialUser: null,
      initialShowLoggedInUI: false,
      idleExpired: true,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return {
    initialUser: user ?? null,
    initialShowLoggedInUI: Boolean(user),
    idleExpired: false,
  };
}
