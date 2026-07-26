const SURVEY_RETURN_PATH_KEY = 'surveyReturnPath';

const BLOCKED_PREFIXES = ['/calculator', '/login', '/signup', '/forgot-password', '/auth'];

function isSafeReturnPath(path) {
  if (!path || typeof path !== 'string') return false;
  if (!path.startsWith('/') || path.startsWith('//')) return false;
  return !BLOCKED_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`) || path.startsWith(`${prefix}?`)
  );
}

export function saveSurveyReturnPath(path) {
  if (typeof window === 'undefined') return;
  const nextPath = path || window.location.pathname;
  if (!isSafeReturnPath(nextPath)) return;
  sessionStorage.setItem(SURVEY_RETURN_PATH_KEY, nextPath);
}

export function getSurveyReturnPath() {
  if (typeof window === 'undefined') return null;
  const saved = sessionStorage.getItem(SURVEY_RETURN_PATH_KEY);
  return isSafeReturnPath(saved) ? saved : null;
}

export function clearSurveyReturnPath() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(SURVEY_RETURN_PATH_KEY);
}

/** Prefer the page the user started the survey from; fall back by auth state. */
export function resolveSurveyExitPath(user) {
  return getSurveyReturnPath() || (user ? '/dashboard' : '/');
}

export function getSurveyExitLoadingMessage(destination) {
  if (destination === '/dashboard') return 'Returning to dashboard...';
  if (destination === '/' || destination === '') return 'Returning to home...';
  return 'Leaving survey...';
}
