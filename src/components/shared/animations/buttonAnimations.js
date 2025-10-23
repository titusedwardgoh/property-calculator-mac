/**
 * Animation utilities for navigation buttons
 * Provides consistent hover and tap animations for form navigation buttons
 */

/**
 * Animation for back/previous buttons
 * Includes slight leftward movement on hover and entry animation
 * 
 * @returns {object} Animation properties for framer-motion
 */
export function getBackButtonAnimation() {
  return {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3, ease: "easeOut" },
    whileHover: { scale: 1.02, x: -2 },
    whileTap: { scale: 0.98 }
  };
}

/**
 * Animation for next/forward buttons
 * Can be conditionally disabled based on form validity
 * Includes entry animation
 * 
 * @param {boolean} isEnabled - Whether the button is enabled (default: true)
 * @returns {object} Animation properties for framer-motion
 */
export function getNextButtonAnimation(isEnabled = true) {
  return {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3, ease: "easeOut" },
    whileHover: isEnabled ? { scale: 1.01 } : {},
    whileTap: isEnabled ? { scale: 0.99 } : {}
  };
}

