/** sessionStorage — anonymous surveys explicitly discarded via "Don't Save". */
const ABANDONED_IDS_KEY = 'proppers_abandoned_property_ids';

function readAbandonedIds() {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = sessionStorage.getItem(ABANDONED_IDS_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function writeAbandonedIds(ids) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(ABANDONED_IDS_KEY, JSON.stringify([...ids]));
}

/** Mark a property record as abandoned — still in DB for login/signup linking, but not resumed locally. */
export function markSurveyAbandoned(propertyId) {
  if (!propertyId || typeof window === 'undefined') return;
  const ids = readAbandonedIds();
  ids.add(String(propertyId));
  writeAbandonedIds(ids);
}

export function isSurveyAbandoned(propertyId) {
  if (!propertyId) return false;
  return readAbandonedIds().has(String(propertyId));
}
