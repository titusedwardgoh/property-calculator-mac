'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const DEFAULT_DELAY_MS = 350;
/** Extra hold after the slide so React can commit the new step / disabled Next. */
const UNLOCK_AFTER_APPLY_MS = 80;

/**
 * Locks step navigation during slide transitions so rapid Next/Back clicks
 * advance one step at a time instead of queueing stale setTimeout closures.
 * Lock stays held after apply long enough for React to commit validity UI.
 */
export function useStepTransition(delayMs = DEFAULT_DELAY_MS) {
  const lockRef = useRef(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const runTransition = useCallback(
    (applyStepChange) => {
      if (lockRef.current) return false;
      lockRef.current = true;
      setIsTransitioning(true);
      setTimeout(() => {
        applyStepChange();
        // Hold lock after apply: context/Zustand updates can re-render before
        // currentStep state commits; Next must stay blocked until then.
        setTimeout(() => {
          lockRef.current = false;
          setIsTransitioning(false);
        }, UNLOCK_AFTER_APPLY_MS);
      }, delayMs);
      return true;
    },
    [delayMs]
  );

  return { isTransitioning, runTransition };
}

/**
 * Step index ref for use inside runTransition.
 * Intentionally does NOT assign on every render — that raced with updateFormData
 * re-renders and reset the ref to the previous step while a transition applied.
 * Sync from state in an effect (URL/resume); apply handlers write the ref first.
 */
export function useCurrentStepRef(currentStep) {
  const ref = useRef(currentStep);
  useEffect(() => {
    ref.current = currentStep;
  }, [currentStep]);
  return ref;
}
