const LINK_PROPERTY_ID_KEY = 'linkPropertyIdAfterAuth';
const RETURN_AFTER_AUTH_KEY = 'returnAfterAuth';

export function hasPendingSurveyLink() {
  if (typeof window === 'undefined') return false;
  return Boolean(sessionStorage.getItem(LINK_PROPERTY_ID_KEY));
}

export function getPendingSurveyLinkPropertyId() {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(LINK_PROPERTY_ID_KEY);
}

export function setPendingSurveyLink(propertyId, returnPath = '/calculator') {
  if (typeof window === 'undefined' || !propertyId) return;
  sessionStorage.setItem(LINK_PROPERTY_ID_KEY, String(propertyId));
  sessionStorage.setItem(RETURN_AFTER_AUTH_KEY, returnPath);
}

export function clearPendingSurveyLink() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(LINK_PROPERTY_ID_KEY);
  sessionStorage.removeItem(RETURN_AFTER_AUTH_KEY);
}

export function isAuthFlowPath(path) {
  if (!path) return false;
  return (
    path === '/login' ||
    path.startsWith('/login/') ||
    path === '/signup' ||
    path.startsWith('/signup/') ||
    path === '/forgot-password' ||
    path.startsWith('/forgot-password/')
  );
}
