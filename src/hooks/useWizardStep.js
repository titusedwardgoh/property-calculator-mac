'use client';

import { useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFormStore } from '../stores/formStore';
import { useEditSession } from '../contexts/EditSessionContext';
import {
  WIZARD_STEPS,
  SUB_COMPLETE,
  buildCalculatorUrl,
  parseWizardParams,
} from '../lib/wizardSteps';

/**
 * Read and update wizard screen state via URL query params.
 */
export function useWizardStep() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const propertyId = useFormStore((s) => s.propertyId);

  const parsed = useMemo(
    () => parseWizardParams(searchParams),
    [searchParams]
  );

  const navigateToStep = useCallback(
    (step, options = {}) => {
      const {
        sub = 1,
        propertyId: overridePropertyId,
        resume = parsed.resume,
        replace = true,
      } = options;

      // Preserve from=review across sub-step navigation unless explicitly cleared
      const from =
        'from' in options
          ? options.from
          : parsed.fromReview
            ? 'review'
            : undefined;

      const url = buildCalculatorUrl({
        step,
        sub,
        propertyId: overridePropertyId ?? propertyId ?? parsed.propertyId,
        resume,
        from,
      });

      if (replace) {
        router.replace(url, { scroll: false });
      } else {
        router.push(url, { scroll: false });
      }
    },
    [router, propertyId, parsed.propertyId, parsed.resume, parsed.fromReview]
  );

  const updateSubStep = useCallback(
    (sub, options = {}) => {
      const step = options.step ?? parsed.step;
      if (!step || step === WIZARD_STEPS.WELCOME) return;
      navigateToStep(step, { ...options, sub, replace: options.replace ?? true });
    },
    [navigateToStep, parsed.step]
  );

  const pushSubStep = useCallback(
    (sub, options = {}) => {
      updateSubStep(sub, { ...options, replace: false });
    },
    [updateSubStep]
  );

  const updateFormData = useFormStore((s) => s.updateFormData);
  const { completeEditAndSave, abortEditAndRestoreBaseline } = useEditSession();

  const returnToResultsFromEdit = useCallback(() => {
    updateFormData('showSummary', true);
    updateFormData('editingFromReview', false);
    updateFormData('showReviewPage', false);
    navigateToStep(WIZARD_STEPS.RESULTS, { from: undefined });
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }
  }, [updateFormData, navigateToStep]);

  const completeEditAndReturnToResults = useCallback(async () => {
    useFormStore.setState({
      isRecalculatingResults: true,
      isResumingSurvey: false,
    });
    if (useFormStore.getState().editSessionActive) {
      await completeEditAndSave();
    }
    returnToResultsFromEdit();
  }, [completeEditAndSave, returnToResultsFromEdit]);

  const abortEditAndReturnToResults = useCallback(() => {
    if (useFormStore.getState().editSessionActive) {
      abortEditAndRestoreBaseline();
    }
    returnToResultsFromEdit();
  }, [abortEditAndRestoreBaseline, returnToResultsFromEdit]);

  return {
    ...parsed,
    navigateToStep,
    updateSubStep,
    pushSubStep,
    returnToResultsFromEdit,
    completeEditAndReturnToResults,
    abortEditAndReturnToResults,
    WIZARD_STEPS,
    SUB_COMPLETE,
  };
}
