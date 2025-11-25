"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { CheckCircle, X, Save, UserPlus, LogIn } from 'lucide-react';

export default function EndOfSurveyPrompt({ onSave, onDismiss, onLinkToAccount }) {
  const [showPrompt, setShowPrompt] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  // Listen for auth changes (when user logs in or creates account)
  useEffect(() => {
    if (user && !isSaving) {
      // User just logged in/created account - link the record to their account
      if (onLinkToAccount) {
        onLinkToAccount(user.id);
      }
      // Save will automatically link to user's account
      if (onSave) {
        handleSave();
      }
    }
  }, [user]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (onSave) {
        await onSave();
      }
      setShowPrompt(false);
      if (user) {
        // Redirect to dashboard to see saved survey
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error saving survey:', error);
      setIsSaving(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    if (onDismiss) {
      onDismiss();
    }
    // Navigate to dashboard if logged in, home if not
    const targetUrl = user ? '/dashboard' : '/';
    router.push(targetUrl);
  };

  const handleCreateAccount = () => {
    // Store current URL to redirect back after signup
    sessionStorage.setItem('returnAfterAuth', window.location.pathname);
    setShowPrompt(false);
    router.push('/signup');
  };

  const handleLogin = () => {
    // Store current URL to redirect back after login
    sessionStorage.setItem('returnAfterAuth', window.location.pathname);
    setShowPrompt(false);
    router.push('/login');
  };

  if (!showPrompt) return null;

  return (
    <AnimatePresence>
      {showPrompt && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleDismiss}
            className="fixed inset-0 bg-black/50 z-50"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-base-100 rounded-2xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {user ? 'Save your survey?' : 'Save your survey results?'}
                  </h3>
                  <p className="text-gray-600">
                    {user ? (
                      'Would you like to save this survey to your dashboard so you can access it later?'
                    ) : (
                      <>
                        Create an account or log in to save your survey results and access them anytime from your dashboard.
                      </>
                    )}
                  </p>
                </div>
                <button
                  onClick={handleDismiss}
                  className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col gap-3">
                {user ? (
                  <>
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="w-full bg-primary hover:bg-primary-focus text-secondary px-6 py-3 rounded-full font-medium transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSaving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5" />
                          <span>Save to Dashboard</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleDismiss}
                      className="w-full bg-base-200 hover:bg-base-300 text-gray-700 px-6 py-3 rounded-full font-medium transition-all duration-200"
                    >
                      No Thanks
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleCreateAccount}
                      className="w-full bg-primary hover:bg-primary-focus text-secondary px-6 py-3 rounded-full font-medium transition-all duration-200 hover:shadow-lg flex items-center justify-center gap-2"
                    >
                      <UserPlus className="w-5 h-5" />
                      <span>Create Account</span>
                    </button>
                    <button
                      onClick={handleLogin}
                      className="w-full bg-base-200 hover:bg-base-300 text-gray-700 px-6 py-3 rounded-full font-medium transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <LogIn className="w-5 h-5" />
                      <span>Log In</span>
                    </button>
                    <button
                      onClick={handleDismiss}
                      className="w-full bg-base-200 hover:bg-base-300 text-gray-700 px-6 py-3 rounded-full font-medium transition-all duration-200"
                    >
                      No Thanks
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

