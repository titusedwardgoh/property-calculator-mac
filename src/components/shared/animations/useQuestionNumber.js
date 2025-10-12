/**
 * Custom hook for question number transition animations
 * Provides horizontal slide animation for the question number indicator
 * 
 * @param {string} direction - 'forward' or 'backward'
 * @param {number} duration - Animation duration in seconds (default: 0.4s)
 * @returns {object} Animation properties for framer-motion
 */
export function useQuestionNumber(direction = 'forward', duration = 0.4) {
  return {
    initial: { 
      x: -30,
      opacity: 0 
    },
    animate: { 
      x: 0,
      opacity: 1 
    },
    exit: { 
      x: direction === 'forward' ? 30 : -30,
      opacity: 0 
    },
    transition: { 
      duration 
    }
  };
}

