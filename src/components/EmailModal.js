"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function EmailModal({ isOpen, onClose, onEmailSubmit }) {
  const [email, setEmail] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [emailExists, setEmailExists] = useState(null);
  const [userId, setUserId] = useState(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateEmail = (emailValue) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailValue);
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    setError('');
    setEmailExists(null);
  };

  const handleCheckEmail = async () => {
    if (!email.trim()) {
      setError('Please enter an email address');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsChecking(true);
    setError('');

    try {
      const response = await fetch('/api/check-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check email');
      }

      setEmailExists(data.exists);
      setUserId(data.userId || null);
    } catch (err) {
      console.error('Error checking email:', err);
      setError(err.message || 'Failed to check email. Please try again.');
    } finally {
      setIsChecking(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      setError('Please enter an email address');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onEmailSubmit(email, emailExists, userId);
    } catch (err) {
      console.error('Error submitting email:', err);
      setError(err.message || 'Failed to submit email. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setError('');
    setEmailExists(null);
    setUserId(null);
    setIsChecking(false);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
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
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-2xl font-bold text-gray-900">Get Your Results by Email</h3>
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="text-gray-400 cursor-pointer hover:text-gray-600 transition-colors shrink-0 disabled:opacity-50"
                    aria-label="Close"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="px-8 py-6">
                <p className="text-gray-600 text-base mb-6">
                  Enter your email address to receive your property purchase summary.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={handleEmailChange}
                        placeholder="your@email.com"
                        className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-full focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none text-gray-900"
                        disabled={isChecking || isSubmitting}
                        required
                      />
                      {emailExists !== true && (
                        <button
                          type="button"
                          onClick={handleCheckEmail}
                          disabled={isChecking || !email.trim() || isSubmitting}
                          className="px-4 py-3 cursor-pointer border-2 border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-full font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                          {isChecking ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            'Check'
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-xl"
                    >
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{error}</span>
                    </motion.div>
                  )}

                  {emailExists === true && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-2 text-blue-700 text-sm bg-blue-50 p-3 rounded-xl"
                    >
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium mb-1">Account Found</p>
                        <p className="text-blue-600">
                          It looks like you already have an account! Sign in to save these results to
                          your profile, or we can send a one-time copy to this email.
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {emailExists === false && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-2 text-green-700 text-sm bg-green-50 p-3 rounded-xl"
                    >
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium mb-1">New Email</p>
                        <p className="text-green-600">
                          We&apos;ll send your results to this email. You can create an account later
                          to save and track your surveys.
                        </p>
                      </div>
                    </motion.div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={isSubmitting}
                      className="flex-1 cursor-pointer border-2 border-gray-300 text-gray-700 bg-white hover:bg-gray-50 px-6 py-3 rounded-full font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !email.trim() || !validateEmail(email)}
                      className="flex-1 cursor-pointer bg-primary hover:bg-primary/90 text-secondary px-6 py-3 rounded-full font-medium transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4" />
                          Send Results
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
