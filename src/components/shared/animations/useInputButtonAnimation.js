/**
 * Custom hook for input button animations using framer-motion
 * Provides consistent hover and tap animations for selection buttons (state, category, type, etc.)
 * 
 * @returns {object} Animation properties for framer-motion
 */
export function useInputButtonAnimation() {
  return {
    whileHover: { scale: 1.05 },
    whileTap: { scale: 0.96 },
    transition: { duration: 0.3 }
  };
}

