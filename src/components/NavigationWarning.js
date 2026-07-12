"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { X } from 'lucide-react';
import { setPendingSurveyLink, isAuthFlowPath } from '@/lib/pendingSurveyLink';

const getPathFromUrl = (url) => {
  try {
    return new URL(url, typeof window !== 'undefined' ? window.location.origin : 'http://localhost').pathname;
  } catch {
    return url;
  }
};

function startNavigationOverlay(url) {
  if (typeof window !== 'undefined' && window.__surveyHeaderOverlay?.startLoadingState) {
    window.__surveyHeaderOverlay.startLoadingState(url);
  }
}

function clearNavigationOverlay() {
  if (typeof window !== 'undefined' && window.__surveyHeaderOverlay?.clearLoadingState) {
    window.__surveyHeaderOverlay.clearLoadingState();
  }
}

function clearExitPendingState() {
  if (typeof window !== 'undefined' && window.__surveyHeaderOverlay?.clearExitPending) {
    window.__surveyHeaderOverlay.clearExitPending();
  }
}

export default function NavigationWarning({ hasUnsavedChanges, onSave, onDiscard, propertyAddress, onReturningToDashboard, propertyId, allFormsComplete }) {
  const [showWarning, setShowWarning] = useState(false);
  const [showAnonymousWarning, setShowAnonymousWarning] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();

  const hasAddress = Boolean(propertyAddress && propertyAddress.trim() !== '');
  // Logged-in: prompt for incomplete surveys (even after auto-save) or when there are real edits.
  // Completed + no edits → silent exit to dashboard.
  const shouldShowWarning =
    Boolean(user) && hasAddress && (hasUnsavedChanges || !allFormsComplete);
  // Anonymous: always prompt when there is survey progress — including Results Summary —
  // so they can log in to save (same modal used mid-form).
  const shouldShowAnonymousWarning = !user && hasAddress;
  const shouldPromptOnExit = shouldShowWarning || shouldShowAnonymousWarning;
  
  useEffect(() => {
    if (!shouldShowWarning && !shouldShowAnonymousWarning) return;

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
  }, [shouldShowWarning, shouldShowAnonymousWarning]);

  // Function to check navigation (called from parent component)
  const checkNavigation = (url) => {
    if (url === pathname) {
      return true;
    }

    // Silent exit only when survey is complete and there are no unsaved edits
    if (!shouldPromptOnExit) {
      return true;
    }

    // Allow navigation to login/signup without warning — user is choosing to save
    if (shouldShowAnonymousWarning && isAuthFlowPath(getPathFromUrl(url))) {
      return true;
    }

    // Check anonymous warning (mid-survey exit when not logging in to save)
    if (shouldShowAnonymousWarning) {
      setPendingNavigation(url);
      setShowAnonymousWarning(true);
      return false;
    }

    // Check logged-in user warning
    if (shouldShowWarning) {
      setPendingNavigation(url);
      setShowWarning(true);
      return false;
    }

    return true;
  };

  // Expose checkNavigation to parent via window (hacky but works)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__navigationWarning = { 
        checkNavigation, 
        hasUnsavedChanges: shouldShowWarning || shouldShowAnonymousWarning,
      };
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete window.__navigationWarning;
      }
    };
  }, [shouldShowWarning, shouldShowAnonymousWarning, shouldPromptOnExit, pathname]);

  const handleConfirm = async () => {
    setShowWarning(false);
    if (onSave) {
      await onSave();
    }
    if (pendingNavigation) {
      const destination = pendingNavigation;
      if (destination === '/dashboard' && onReturningToDashboard) {
        onReturningToDashboard();
      }
      startNavigationOverlay(destination);
      router.push(destination);
      setPendingNavigation(null);
    } else {
      const targetUrl = user ? '/dashboard' : '/';
      if (user && onReturningToDashboard) {
        onReturningToDashboard();
      }
      startNavigationOverlay(targetUrl);
      router.push(targetUrl);
    }
  };

  const handleDiscard = () => {
    setShowWarning(false);
    if (onDiscard) {
      onDiscard();
    }
    if (pendingNavigation) {
      const destination = pendingNavigation;
      if (destination === '/dashboard' && onReturningToDashboard) {
        onReturningToDashboard();
      }
      startNavigationOverlay(destination);
      router.push(destination);
      setPendingNavigation(null);
    } else {
      const targetUrl = user ? '/dashboard' : '/';
      if (user && onReturningToDashboard) {
        onReturningToDashboard();
      }
      startNavigationOverlay(targetUrl);
      router.push(targetUrl);
    }
  };

  const handleCancel = () => {
    setShowWarning(false);
    setPendingNavigation(null);
    clearNavigationOverlay();
    clearExitPendingState();
  };

  const handleAnonymousLoginToSave = () => {
    setShowAnonymousWarning(false);
    // Store propertyId in sessionStorage so we can link it after login
    if (propertyId) {
      setPendingSurveyLink(propertyId, '/calculator');
    }
    router.push('/login?returnTo=calculator');
  };

  const handleAnonymousDiscard = () => {
    setShowAnonymousWarning(false);
    if (onDiscard) {
      onDiscard();
    }
    if (pendingNavigation) {
      const destination = pendingNavigation;
      startNavigationOverlay(destination);
      router.push(destination);
      setPendingNavigation(null);
    } else {
      startNavigationOverlay('/');
      router.push('/');
    }
  };

  const handleAnonymousCancel = () => {
    setShowAnonymousWarning(false);
    setPendingNavigation(null);
    clearNavigationOverlay();
    clearExitPendingState();
  };

  return (
    <>
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
                    className="flex-1 cursor-pointer bg-primary hover:bg-primary/90 text-secondary px-6 py-3 rounded-full font-medium transition-all duration-200 hover:shadow-lg"
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
                    className="flex-1 cursor-pointer bg-primary hover:bg-primary/90 text-secondary px-6 py-3 rounded-full font-medium transition-all duration-200 hover:shadow-lg"
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

