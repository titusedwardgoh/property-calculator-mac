"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function EmailModal({ isOpen, onClose, onEmailSubmit, propertyId }) {
  const [email, setEmail] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [emailExists, setEmailExists] = useState(null);
  const [userId, setUserId] = useState(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
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
      // Call the parent handler with email and existence status
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

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6 relative"
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute cursor-pointer top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Get Your Results by Email
            </h2>
            <p className="text-gray-600 text-sm">
              Enter your email address to receive your property purchase summary
            </p>
          </div>

          {/* Email input form */}
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
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  disabled={isChecking || isSubmitting}
                  required
                />
                {!emailExists && (
                  <button
                    type="button"
                    onClick={handleCheckEmail}
                    disabled={isChecking || !email.trim() || isSubmitting}
                    className="px-4 py-2 cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
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

            {/* Error message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            {/* Email exists message */}
            {emailExists === true && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2 text-blue-700 text-sm bg-blue-50 p-3 rounded-lg"
              >
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium mb-1">Account Found</p>
                  <p className="text-blue-600">
                    It looks like you already have an account! Sign in to save these results to your profile, or we can send a one-time copy to this email.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Email doesn't exist message */}
            {emailExists === false && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2 text-green-700 text-sm bg-green-50 p-3 rounded-lg"
              >
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium mb-1">New Email</p>
                  <p className="text-green-600">
                    We&apos;ll send your results to this email. You can create an account later to save and track your surveys.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Submit button */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 cursor-pointer border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !email.trim() || !validateEmail(email)}
                className="flex-1 px-4 py-2 cursor-pointer bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

