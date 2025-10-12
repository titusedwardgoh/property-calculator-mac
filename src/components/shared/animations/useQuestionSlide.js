/**
 * Custom hook for question transition animations
 * Provides consistent slide and fade animations across all form sections
 * 
 * @param {string} direction - 'forward' or 'backward'
 * @param {boolean} shouldFade - If true, uses fade-only animation (for completion states)
 * @param {number} fadeDelay - Duration for fade animations (default: 0.5s)
 * @param {number} slideDelay - Duration for slide animations (default: 0.3s)
 * @returns {object} Animation properties for framer-motion
 */
export function useQuestionSlide(
  direction = 'forward',
  shouldFade = false,
  fadeDelay = 0.5,
  slideDelay = 0.3
) {
  return {
    initial: { 
      y: shouldFade ? 0 : (direction === 'forward' ? -50 : 50),
      opacity: 0
    },
    animate: { 
      y: 0,
      opacity: 1 
    },
    exit: { 
      y: shouldFade ? 0 : (direction === 'forward' ? 50 : -50),
      opacity: 0
    },
    transition: { 
      duration: shouldFade ? fadeDelay : slideDelay,
      ease: "easeInOut"
    }
  };
}

