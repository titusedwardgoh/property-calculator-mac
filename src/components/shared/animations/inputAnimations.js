/**
 * Animation utilities for input elements using framer-motion
 * Provides consistent animations for:
 * - Selection buttons (state, category, type, etc.)
 * - Text input fields (focus, hover, border effects)
 * 
 * @returns {object} Animation properties for framer-motion
 */

/**
 * Animation for input selection buttons
 */
export function getInputButtonAnimation() {
  return {
    whileHover: { scale: 1.05 },
    whileTap: { scale: 0.96 },
    transition: { duration: 0.3 }
  };
}

/**
 * Animation for text input fields
 * Provides smooth border color transitions and subtle scale on focus
 */
export function getInputFieldAnimation() {
  return {
    whileFocus: { 
      scale: 1.01,
      transition: { duration: 0.2 }
    },
    transition: { duration: 0.2, ease: "easeInOut" }
  };
}

