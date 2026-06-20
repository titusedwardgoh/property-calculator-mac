/** Canonical wizard screen identifiers (URL `step` param values). */
export const WIZARD_STEPS = {
  WELCOME: 'welcome',
  PROPERTY: 'property',
  BUYER: 'buyer',
  LOAN: 'loan',
  SELLER: 'seller',
  REVIEW: 'review',
  ADDITIONAL: 'additional-questions',
  RESULTS: 'results',
};

export const VALID_STEPS = new Set(Object.values(WIZARD_STEPS));

/** URL sub-step value for section completion screens (e.g. "Buyer Details Complete"). */
export const SUB_COMPLETE = 'complete';

export function isSubCompleteValue(sub) {
  return sub === SUB_COMPLETE;
}

export const SECTION_STEPS = [
  WIZARD_STEPS.PROPERTY,
  WIZARD_STEPS.BUYER,
  WIZARD_STEPS.LOAN,
  WIZARD_STEPS.SELLER,
];

/**
 * Build a /calculator URL with wizard query params.
 */
export function buildCalculatorUrl({
  step,
  sub,
  propertyId,
  resume = false,
  from,
  fresh = false,
} = {}) {
  const params = new URLSearchParams();

  if (fresh) params.set('fresh', 'true');
  if (resume) params.set('resume', 'true');
  if (propertyId) params.set('propertyId', String(propertyId));
  if (step && step !== WIZARD_STEPS.WELCOME) {
    params.set('step', step);
  }
  if (sub === SUB_COMPLETE) {
    params.set('sub', SUB_COMPLETE);
  } else if (sub != null && Number(sub) > 0) {
    params.set('sub', String(sub));
  }
  if (from === 'review') {
    params.set('from', 'review');
  }

  const qs = params.toString();
  return qs ? `/calculator?${qs}` : '/calculator';
}

/**
 * Parse wizard-related params from URLSearchParams.
 */
export function parseWizardParams(searchParams) {
  const rawStep = searchParams.get('step');
  const step =
    rawStep && VALID_STEPS.has(rawStep) ? rawStep : WIZARD_STEPS.WELCOME;
  const rawSub = searchParams.get('sub');
  const isSubComplete = rawSub === SUB_COMPLETE;
  const subNumeric = isSubComplete
    ? null
    : Math.max(1, parseInt(rawSub || '1', 10) || 1);
  const sub = isSubComplete ? SUB_COMPLETE : subNumeric;
  const fromReview = searchParams.get('from') === 'review';
  const propertyId = searchParams.get('propertyId') || null;
  const resume = searchParams.get('resume') === 'true';
  const fresh = searchParams.get('fresh') === 'true';

  return { step, sub, subNumeric, isSubComplete, fromReview, propertyId, resume, fresh };
}

/** Whether a URL step param is a valid in-survey screen (not welcome). */
export function isValidSurveyStep(step) {
  return Boolean(step && VALID_STEPS.has(step) && step !== WIZARD_STEPS.WELCOME);
}

/**
 * Prefer explicit URL step/sub on refresh; fall back to DB completion flags
 * when the URL has no step (e.g. first Resume from dashboard).
 */
export function resolveWizardStep(searchParams, formData, options = {}) {
  const urlStep = searchParams.get('step');
  const rawSub = searchParams.get('sub');
  const urlSub = rawSub === SUB_COMPLETE
    ? SUB_COMPLETE
    : Math.max(1, parseInt(rawSub || '1', 10) || 1);

  if (isValidSurveyStep(urlStep)) {
    return { step: urlStep, sub: urlSub };
  }

  return computeStepFromFormState(formData, options);
}

/**
 * Infer the correct wizard step from persisted form / completion flags.
 */
export function computeStepFromFormState(formData, options = {}) {
  const { completionStatus } = options;

  const surveyComplete =
    completionStatus === 'complete' ||
    formData.allFormsComplete ||
    formData.sellerQuestionsComplete;

  if (surveyComplete) {
    return { step: WIZARD_STEPS.RESULTS, sub: 1 };
  }

  const propertyDone =
    formData.propertyDetailsComplete || formData.propertyDetailsFormComplete;

  if (!propertyDone) {
    return {
      step: WIZARD_STEPS.PROPERTY,
      sub: formData.propertyDetailsActiveStep || 1,
    };
  }

  if (!formData.buyerDetailsComplete) {
    return {
      step: WIZARD_STEPS.BUYER,
      sub: formData.buyerDetailsActiveStep || 1,
    };
  }

  if (formData.needsLoan === 'yes' && !formData.loanDetailsComplete) {
    return {
      step: WIZARD_STEPS.LOAN,
      sub: formData.loanDetailsActiveStep || 1,
    };
  }

  if (!formData.sellerQuestionsComplete) {
    return {
      step: WIZARD_STEPS.SELLER,
      sub: formData.sellerQuestionsActiveStep || 1,
    };
  }

  return { step: WIZARD_STEPS.RESULTS, sub: 1 };
}

/** Whether the store has enough data to indicate a survey was started. */
export function hasStartedSurvey(formData) {
  return !!(
    formData.propertyPrice ||
    formData.propertyAddress ||
    formData.selectedState ||
    formData.buyerType ||
    formData.propertyId
  );
}

/**
 * Whether header close/logo should return to Results instead of leaving the calculator.
 * Partial and in-progress surveys keep the save popup → dashboard flow.
 */
export function shouldReturnToResultsOnClose({
  step,
  allFormsComplete,
  fromReview,
  editingFromReview,
}) {
  if (step === WIZARD_STEPS.RESULTS || step === WIZARD_STEPS.WELCOME) {
    return false;
  }

  // Review page is only reachable after completing sections — X returns to Results
  if (step === WIZARD_STEPS.REVIEW) {
    return true;
  }

  if (fromReview || editingFromReview) {
    return true;
  }

  if (allFormsComplete) {
    return true;
  }

  return false;
}
