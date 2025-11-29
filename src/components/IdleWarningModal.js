"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, LogOut } from 'lucide-react';

export default function IdleWarningModal({ isOpen, onStayLoggedIn, onLogoutNow }) {
  const [countdown, setCountdown] = useState(60); // 60 seconds countdown

  useEffect(() => {
    if (!isOpen) {
      setCountdown(60);
      return;
    }

    // Countdown timer
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          // Auto-logout when countdown reaches 0
          if (onLogoutNow) {
            onLogoutNow();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, onLogoutNow]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[100]"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
              {/* Top Section with Icon */}
              <div className="bg-primary/10 px-8 pt-8 pb-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                    <Clock className="w-8 h-8 text-primary" />
                  </div>
                </div>
              </div>
              
              {/* Middle Text Section */}
              <div className="px-8 py-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  You&apos;ve been idle for a while
                </h3>
                <p className="text-gray-600 text-base mb-4">
                  You&apos;ll be automatically logged out in{' '}
                  <span className="font-semibold text-primary">{countdown}</span> second{countdown !== 1 ? 's' : ''} for security.
                </p>
                <p className="text-sm text-gray-500">
                  Click &quot;Stay Logged In&quot; to continue your session.
                </p>
              </div>
              
              {/* Bottom Action Buttons */}
              <div className="px-8 pb-8 flex gap-3">
                <button
                  onClick={onLogoutNow}
                  className="flex-1 border-2 border-gray-300 text-gray-700 bg-white hover:bg-gray-50 px-6 py-3 rounded-full font-medium transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Log Out Now
                </button>
                <button
                  onClick={onStayLoggedIn}
                  className="flex-1 bg-primary hover:bg-primary-focus text-secondary px-6 py-3 rounded-full font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  Stay Logged In
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

