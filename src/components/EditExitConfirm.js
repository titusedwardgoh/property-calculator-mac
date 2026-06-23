'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export default function EditExitConfirm({ isOpen, onStay, onDiscard }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onStay}
            className="fixed inset-0 bg-black/50 z-[200]"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
              <div className="bg-primary/10 px-8 pt-8 pb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold text-gray-900">Discard your changes?</h3>
                  <button
                    type="button"
                    onClick={onStay}
                    className="text-gray-400 cursor-pointer hover:text-gray-600 transition-colors"
                    aria-label="Close"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="px-8 py-6">
                <p className="text-gray-600 text-base mb-6">
                  Your answers will not be saved.
                </p>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={onDiscard}
                    className="flex-1 cursor-pointer border-2 border-gray-300 text-gray-700 bg-white hover:bg-gray-50 px-6 py-3 rounded-full font-medium transition-all duration-200"
                  >
                    Discard
                  </button>
                  <button
                    type="button"
                    onClick={onStay}
                    className="flex-1 cursor-pointer bg-primary hover:bg-primary/90 text-secondary px-6 py-3 rounded-full font-medium transition-all duration-200 hover:shadow-lg"
                  >
                    Stay
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
