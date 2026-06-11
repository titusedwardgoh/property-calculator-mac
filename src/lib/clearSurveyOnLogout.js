import { useFormStore } from '@/stores/formStore';
import { resetSessionAndForm, clearAuthenticatedUserId } from '@/lib/sessionManager';
import { clearPendingSurveyLink } from '@/lib/pendingSurveyLink';

/** Clear in-memory survey state and session keys (call on logout). */
export function clearSurveyOnLogout() {
  resetSessionAndForm(useFormStore.getState().resetForm);
  clearAuthenticatedUserId();
  clearPendingSurveyLink();
}
