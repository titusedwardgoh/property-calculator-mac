"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { X, AlertTriangle } from 'lucide-react';
import EndOfSurveyPrompt from './EndOfSurveyPrompt';

export default function NavigationWarning({ hasUnsavedChanges, onSave, onDiscard, onLinkToAccount, propertyAddress, onReturningToDashboard, allFormsComplete, propertyId }) {
  const [showWarning, setShowWarning] = useState(false);
  const [showAnonymousWarning, setShowAnonymousWarning] = useState(false);
  const [showEndOfSurveyPrompt, setShowEndOfSurveyPrompt] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  
  // Only show warning if user is logged in AND property address is set
  const shouldShowWarning = hasUnsavedChanges && user && propertyAddress && propertyAddress.trim() !== '';
  
  // Show anonymous warning if user is NOT logged in, has unsaved changes, and survey is NOT complete
  const shouldShowAnonymousWarning = hasUnsavedChanges && !user && !allFormsComplete;
  
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
    if (shouldShowAnonymousWarning && url !== pathname) {
      setPendingNavigation(url);
      setShowAnonymousWarning(true);
      return false; // Prevent navigation
    }
    return true; // Allow navigation
  };

  // Expose checkNavigation to parent via window (hacky but works)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__navigationWarning = { 
        checkNavigation, 
        hasUnsavedChanges: shouldShowWarning || shouldShowAnonymousWarning || shouldShowEndOfSurveyPrompt 
      };
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete window.__navigationWarning;
      }
    };
  }, [shouldShowWarning, shouldShowAnonymousWarning, shouldShowEndOfSurveyPrompt, pathname]);

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
    // Clear loading state in SurveyHeaderOverlay if navigation was cancelled
    if (typeof window !== 'undefined' && window.__surveyHeaderOverlay) {
      window.__surveyHeaderOverlay.clearLoadingState();
    }
  };

  const handleAnonymousLoginToSave = () => {
    setShowAnonymousWarning(false);
    // Store propertyId in sessionStorage so we can link it after login
    if (propertyId && typeof window !== 'undefined') {
      sessionStorage.setItem('linkPropertyIdAfterAuth', propertyId);
    }
    // Store return URL to come back to calculator after login
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('returnAfterAuth', '/calculator');
    }
    router.push('/login?returnTo=calculator');
  };

  const handleAnonymousDiscard = () => {
    setShowAnonymousWarning(false);
    if (onDiscard) {
      onDiscard();
    }
    if (pendingNavigation) {
      router.push(pendingNavigation);
      setPendingNavigation(null);
    } else {
      router.push('/');
    }
  };

  const handleAnonymousCancel = () => {
    setShowAnonymousWarning(false);
    setPendingNavigation(null);
    // Clear loading state in SurveyHeaderOverlay if navigation was cancelled
    if (typeof window !== 'undefined' && window.__surveyHeaderOverlay) {
      window.__surveyHeaderOverlay.clearLoadingState();
    }
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
    // Note: This always navigates, so don't clear loading state - it will clear when navigation completes
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
      
      {/* Anonymous User Warning - shown when anonymous user tries to exit early */}
      <AnimatePresence>
        {showAnonymousWarning && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleAnonymousCancel}
            className="fixed inset-0 bg-black/50 z-[200]"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
              {/* Header */}
              <div className="bg-primary/10 px-8 pt-8 pb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-2xl font-bold text-gray-900">Save your progress?</h3>
                  </div>
                  <button
                    onClick={handleAnonymousCancel}
                    className="text-gray-400 cursor-pointer hover:text-gray-600 transition-colors"
                    aria-label="Close"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
              
              {/* Content */}
              <div className="px-8 py-6">
                <p className="text-gray-600 text-base mb-6">
                  Your unsaved changes will be lost. Log in to save your progress and access it later from your dashboard.
                </p>
                
                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleAnonymousDiscard}
                    className="flex-1 cursor-pointer border-2 border-gray-300 text-gray-700 bg-white hover:bg-gray-50 px-6 py-3 rounded-full font-medium transition-all duration-200"
                  >
                    Don&apos;t Save
                  </button>
                  <button
                    onClick={handleAnonymousLoginToSave} 
                    className="flex-1 cursor-pointer bg-primary hover:bg-primary-focus text-secondary px-6 py-3 rounded-full font-medium transition-all duration-200 hover:shadow-lg"
                  >
                    Log in to Save
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
      </AnimatePresence>
      
      <AnimatePresence>
        {showWarning && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCancel}
            className="fixed inset-0 bg-black/50 z-[200]"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
              {/* Header */}
              <div className="bg-primary/10 px-8 pt-8 pb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    
                    <h3 className="text-2xl font-bold text-gray-900">Save changes?</h3>
                  </div>
                  <button
                    onClick={handleCancel}
                    className="text-gray-400 cursor-pointer hover:text-gray-600 transition-colors"
                    aria-label="Close"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
              
              {/* Content */}
              <div className="px-8 py-6">
                <p className="text-gray-600 text-base mb-6">
                  Your unsaved changes will be lost. Save changes before closing?
                </p>
              
                {/* Action Buttons */}
                <div className="flex gap-3">
                <button
                  onClick={handleDiscard}
                    className="flex-1 cursor-pointer border-2 border-gray-300 text-gray-700 bg-white hover:bg-gray-50 px-6 py-3 rounded-full font-medium transition-all duration-200"
                >
                    Don&apos;t Save
                </button>
                <button
                  onClick={handleConfirm}
                    className="flex-1 cursor-pointer bg-primary hover:bg-primary-focus text-secondary px-6 py-3 rounded-full font-medium transition-all duration-200 hover:shadow-lg"
                >
                    Save
                </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
    </>
  );
}

