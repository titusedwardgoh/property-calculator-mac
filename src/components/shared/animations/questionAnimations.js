/**
 * Animation utilities for question transitions
 * Provides consistent slide and fade animations across all form sections
 */

/**
 * Animation for question content transitions
 * Provides slide and fade animations for question content
 * 
 * @param {string} direction - 'forward' or 'backward'
 * @param {boolean} shouldFade - If true, uses fade-only animation (for completion states)
 * @param {number} fadeDelay - Duration for fade animations (default: 0.5s)
 * @param {number} slideDelay - Duration for slide animations (default: 0.3s)
 * @returns {object} Animation properties for framer-motion
 */
export function getQuestionSlideAnimation(
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

/**
 * Animation for question number indicator
 * Provides horizontal slide animation for the question number
 * 
 * @param {string} direction - 'forward' or 'backward'
 * @param {number} duration - Animation duration in seconds (default: 0.4s)
 * @returns {object} Animation properties for framer-motion
 */
export function getQuestionNumberAnimation(direction = 'forward', duration = 0.4) {
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

