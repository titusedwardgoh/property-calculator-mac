"use client";

import { motion } from "framer-motion";
import { useFormStore } from "../stores/formStore";

export default function ReviewGapFiller({ missingFields }) {
  const updateFormData = useFormStore((s) => s.updateFormData);

  if (!missingFields || missingFields.length === 0) return null;

  const handleAnswerNow = () => {
    updateFormData("additionalQuestionsFields", missingFields);
    updateFormData("showAdditionalQuestions", true);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 rounded-lg border border-primary/30 bg-primary/5 p-4 md:p-5"
    >
      <div className="flex gap-3">
        <div className="flex-shrink-0 text-primary">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-800 mb-1">
            Additional details required
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Some answers have changed. Please complete the following so we can
            generate your report.
          </p>
          <button
            type="button"
            onClick={handleAnswerNow}
            className="px-4 py-2 cursor-pointer rounded-lg text-sm font-medium bg-primary text-white border border-primary hover:bg-primary/90 transition-colors"
          >
            Answer now
          </button>
        </div>
      </div>
    </motion.div>
  );
}
