"use client";

/** Shared spinner + text sizing for survey transition / resume / navigation overlays (#1–17). */
export const SURVEY_LOADING_TEXT_CLASS = "text-lg text-gray-600 md:text-xl";

export function SurveyLoadingSpinner() {
  return (
    <div
      className="mx-auto mb-6 h-16 w-16 animate-spin rounded-full border-b-[3px] border-primary md:h-20 md:w-20"
      aria-hidden
    />
  );
}

export default function SurveyLoadingOverlay({ message, children }) {
  return (
    <div className="aurora-loading-overlay fixed inset-0 z-50 flex items-center justify-center">
      <div className="px-6 text-center">
        <SurveyLoadingSpinner />
        {children ??
          (message ? <p className={SURVEY_LOADING_TEXT_CLASS}>{message}</p> : null)}
      </div>
    </div>
  );
}

/** Suspense / plain-page fallback — same spinner scale, no aurora gradient. */
export function SurveyLoadingFallback({ message }) {
  return (
    <div className="aurora-page-bg flex min-h-screen items-center justify-center">
      <div className="px-6 text-center">
        <SurveyLoadingSpinner />
        {message ? <p className={SURVEY_LOADING_TEXT_CLASS}>{message}</p> : null}
      </div>
    </div>
  );
}
