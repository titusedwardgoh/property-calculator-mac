"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { X, AlertTriangle } from 'lucide-react';
import EndOfSurveyPrompt from './EndOfSurveyPrompt';

export default function NavigationWarning({ hasUnsavedChanges, onSave, onDiscard, onLinkToAccount, propertyAddress, onReturningToDashboard, allFormsComplete }) {
  const [showWarning, setShowWarning] = useState(false);
  const [showEndOfSurveyPrompt, setShowEndOfSurveyPrompt] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  
  // Only show warning if user is logged in AND property address is set
  const shouldShowWarning = hasUnsavedChanges && user && propertyAddress && propertyAddress.trim() !== '';
  
  // Show end-of-survey prompt if survey is complete (for both logged in and anonymous users)
  const shouldShowEndOfSurveyPrompt = allFormsComplete;

  useEffect(() => {
    if (!shouldShowWarning) return;

    // Handle browser back/forward and page refresh
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
      return '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [shouldShowWarning]);

  // Function to check navigation (called from parent component)
  const checkNavigation = (url) => {
    // If survey is complete, show end-of-survey prompt instead of regular warning
    if (shouldShowEndOfSurveyPrompt && url !== pathname) {
      setPendingNavigation(url);
      setShowEndOfSurveyPrompt(true);
      return false; // Prevent navigation
    }
    if (shouldShowWarning && url !== pathname) {
      setPendingNavigation(url);
      setShowWarning(true);
      return false; // Prevent navigation
    }
    return true; // Allow navigation
  };

  // Expose checkNavigation to parent via window (hacky but works)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__navigationWarning = { 
        checkNavigation, 
        hasUnsavedChanges: shouldShowWarning || shouldShowEndOfSurveyPrompt 
      };
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete window.__navigationWarning;
      }
    };
  }, [shouldShowWarning, shouldShowEndOfSurveyPrompt, pathname]);

  const handleConfirm = async () => {
    setShowWarning(false);
    if (onSave) {
      await onSave();
    }
    if (pendingNavigation) {
      // Check if navigating to dashboard
      if (pendingNavigation === '/dashboard' && onReturningToDashboard) {
        onReturningToDashboard();
      }
      router.push(pendingNavigation);
      setPendingNavigation(null);
    } else {
      // If no pending navigation, navigate to dashboard if logged in, home if not
      const targetUrl = user ? '/dashboard' : '/';
      if (user && onReturningToDashboard) {
        // Show overlay when returning to dashboard
        onReturningToDashboard();
      }
      router.push(targetUrl);
    }
  };

  const handleDiscard = () => {
    setShowWarning(false);
    if (onDiscard) {
      onDiscard();
    }
    if (pendingNavigation) {
      // Check if navigating to dashboard
      if (pendingNavigation === '/dashboard' && onReturningToDashboard) {
        onReturningToDashboard();
      }
      router.push(pendingNavigation);
      setPendingNavigation(null);
    } else {
      // If no pending navigation, navigate to dashboard if logged in, home if not
      const targetUrl = user ? '/dashboard' : '/';
      if (user && onReturningToDashboard) {
        // Show overlay when returning to dashboard
        onReturningToDashboard();
      }
      router.push(targetUrl);
    }
  };

  const handleCancel = () => {
    setShowWarning(false);
    setPendingNavigation(null);
  };

  const handleEndOfSurveySave = async () => {
    setShowEndOfSurveyPrompt(false);
    if (onSave) {
      await onSave(true); // Set user_saved = true
    }
    if (pendingNavigation) {
      // Check if navigating to dashboard
      if (pendingNavigation === '/dashboard' && onReturningToDashboard) {
        onReturningToDashboard();
      }
      router.push(pendingNavigation);
      setPendingNavigation(null);
    } else {
      // If no pending navigation, navigate to dashboard if logged in, home if not
      const targetUrl = user ? '/dashboard' : '/';
      if (user && onReturningToDashboard) {
        // Show overlay when returning to dashboard
        onReturningToDashboard();
      }
      router.push(targetUrl);
    }
  };

  const handleEndOfSurveyDismiss = () => {
    setShowEndOfSurveyPrompt(false);
    if (onDiscard) {
      onDiscard();
    }
    if (pendingNavigation) {
      // Check if navigating to dashboard
      if (pendingNavigation === '/dashboard' && onReturningToDashboard) {
        onReturningToDashboard();
      }
      router.push(pendingNavigation);
      setPendingNavigation(null);
    } else {
      // If no pending navigation, navigate to dashboard if logged in, home if not
      const targetUrl = user ? '/dashboard' : '/';
      if (user && onReturningToDashboard) {
        // Show overlay when returning to dashboard
        onReturningToDashboard();
      }
      router.push(targetUrl);
    }
  };

  return (
    <>
      {/* End of Survey Prompt - shown when user tries to navigate away after completion */}
      {showEndOfSurveyPrompt && (
        <EndOfSurveyPrompt
          show={showEndOfSurveyPrompt}
          onSave={handleEndOfSurveySave}
          onDismiss={handleEndOfSurveyDismiss}
          onLinkToAccount={onLinkToAccount}
          onReturningToDashboard={onReturningToDashboard}
        />
      )}
      
      <AnimatePresence>
        {showWarning && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCancel}
            className="fixed inset-0 bg-blue-900/30 z-50"
          />
          
          {/* Modal - Styled like the image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
              {/* Top Illustration Section */}
              <div className="bg-pink-50 px-8 pt-8 pb-6">
                <div className="flex items-end justify-center gap-2 mb-4">
                  {/* Hand holding block */}
                  <div className="relative">
                    <div className="w-8 h-8 bg-yellow-400 rounded transform rotate-12"></div>
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white rounded-full"></div>
                  </div>
                  {/* Building blocks structure */}
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-6 h-6 bg-red-500 rounded-t-full"></div>
                    <div className="w-8 h-4 bg-blue-500 rounded"></div>
                    <div className="w-6 h-4 bg-yellow-400 rounded"></div>
                    <div className="w-10 h-3 bg-red-500 rounded"></div>
                    <div className="flex gap-1">
                      <div className="w-3 h-3 bg-blue-500 rounded"></div>
                      <div className="w-3 h-3 bg-yellow-400 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Middle Text Section */}
              <div className="px-8 py-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Save changes?
                </h3>
                <p className="text-gray-600 text-base">
                  Your unsaved changes will be lost. Save changes before closing?
                </p>
              </div>
              
              {/* Bottom Action Buttons */}
              <div className="px-8 pb-8 flex gap-3">
                <button
                  onClick={handleDiscard}
                  className="flex-1 border-2 border-blue-500 text-blue-600 bg-white hover:bg-blue-50 px-6 py-3 rounded-full font-medium transition-all duration-200"
                >
                  QUIT WITHOUT SAVING
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-full font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  SAVE
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
    </>
  );
}

