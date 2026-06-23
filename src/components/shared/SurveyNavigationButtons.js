'use client';

import { motion } from 'framer-motion';

const NAV_TRANSITION = { duration: 0.26, ease: [0.25, 0.1, 0.25, 1] };
const BACK_SLOT_WIDTH = 70;
const BACK_GAP = 16;

const DEFAULT_BACK_CLASS =
  'bg-primary px-6 py-3 rounded-full border border-primary font-medium hover:bg-primary/90 transition-all duration-200 hover:shadow-lg flex-shrink-0 cursor-pointer';

/**
 * Survey footer navigation — matches BuyerDetails button sizing (px-6 py-3).
 * Back slides in from the left while Next shrinks via flex layout.
 */
export default function SurveyNavigationButtons({
  showBack,
  onBack,
  onNext,
  nextDisabled = false,
  nextLabel = 'Next',
  backLabel = '<',
  nextClassName = '',
  backClassName = DEFAULT_BACK_CLASS,
}) {
  return (
    <div className="flex w-full items-center">
      <motion.div
        className="flex-shrink-0 overflow-hidden"
        initial={false}
        animate={{
          width: showBack ? BACK_SLOT_WIDTH : 0,
          marginRight: showBack ? BACK_GAP : 0,
        }}
        transition={NAV_TRANSITION}
      >
        <motion.button
          type="button"
          onClick={onBack}
          tabIndex={showBack ? 0 : -1}
          initial={false}
          animate={{
            x: showBack ? 0 : -BACK_SLOT_WIDTH,
            opacity: showBack ? 1 : 0,
          }}
          transition={NAV_TRANSITION}
          style={{
            width: BACK_SLOT_WIDTH,
            pointerEvents: showBack ? 'auto' : 'none',
          }}
          className={`box-border inline-flex items-center justify-center ${backClassName}`}
        >
          {backLabel}
        </motion.button>
      </motion.div>

      <button
        type="button"
        onClick={onNext}
        disabled={nextDisabled}
        className={`min-w-0 flex-1 px-6 py-3 rounded-full border border-primary font-medium ${nextClassName}`}
      >
        {nextLabel}
      </button>
    </div>
  );
}
