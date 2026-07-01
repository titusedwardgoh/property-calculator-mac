'use client';

import { useCallback, useRef, useState } from 'react';

const DEFAULT_DELAY_MS = 150;

/**
 * Locks step navigation during slide transitions so rapid Next/Back clicks
 * advance one step at a time instead of queueing stale setTimeout closures.
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
        lockRef.current = false;
        setIsTransitioning(false);
      }, delayMs);
      return true;
    },
    [delayMs]
  );

  return { isTransitioning, runTransition };
}

/** Sync a ref to the latest step index — read inside runTransition after each unlock. */
export function useCurrentStepRef(currentStep) {
  const ref = useRef(currentStep);
  ref.current = currentStep;
  return ref;
}
