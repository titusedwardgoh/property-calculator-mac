import { useEffect } from 'react';

export default function useFormNavigation({
  currentStep,
  totalSteps,
  isCurrentStepValid,
  onNext,
  onPrev,
  onComplete,
  onBack,
  isComplete = false,
  isTransitioning = false,
}) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (isTransitioning) {
        if (event.key === 'Enter' || event.key === 'Escape') {
          event.preventDefault();
        }
        return;
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        if (isComplete) {
          onComplete?.();
        } else if (isCurrentStepValid()) {
          // Always call onNext, let the form handle completion logic
          onNext?.();
        }
      } else if (event.key === 'Escape') {
        event.preventDefault();
        if (currentStep > 1) {
          onPrev?.();
        } else {
          onBack?.();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentStep, isComplete, isCurrentStepValid, isTransitioning, onNext, onPrev, onComplete, onBack]);

  return null; // This is a hook, not a component
}
