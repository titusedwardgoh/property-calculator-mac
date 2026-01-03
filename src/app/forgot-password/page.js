"use client";

import { useState, Suspense } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Mail, Loader2, CheckCircle2 } from 'lucide-react';

function ForgotPasswordPageContent() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        setError(result.error || 'Failed to send reset email');
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-200 flex items-start justify-center px-4 py-16 lg:py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-base-100 rounded-lg w-full max-w-md md:max-w-xl p-8"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex items-center justify-center mb-6"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary">
              <Mail className="w-8 h-8" />
            </div>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-6"
          >
            {success ? 'Check your email' : 'Forgot password?'}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            className="text-lg md:text-xl text-gray-600"
          >
            {success ? (
              <>
                We've sent a password reset link to <strong>{email}</strong>
              </>
            ) : (
              <>
                No worries! Enter your email address and we'll send you a link to reset your password.
              </>
            )}
          </motion.p>
        </div>

        {success ? (
          <div className="space-y-6">
            <div className="bg-success/20 border border-success rounded-lg p-4 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
              <p className="text-sm text-success">
                If an account exists with this email, you'll receive password reset instructions shortly.
              </p>
            </div>
            <div className="text-center">
              <Link 
                href="/login" 
                className="text-primary hover:text-primary-focus font-medium underline"
              >
                Back to login
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Your email address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="w-full px-4 py-3 border border-base-300 rounded-lg bg-base-200 focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50"
                placeholder="you@example.com"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-error/20 border border-error rounded-lg p-3 text-sm text-error">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <motion.button
              type="submit"
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              disabled={loading}
              className="w-full cursor-pointer bg-primary hover:bg-primary-focus text-secondary font-medium py-3 px-6 rounded-full transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                'Send reset link'
              )}
            </motion.button>

            {/* Back to Login Link */}
            <div className="text-center">
              <Link 
                href="/login" 
                className="text-md font-medium text-gray-600 hover:text-primary hover:underline transition-colors"
              >
                Back to login
              </Link>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <ForgotPasswordPageContent />
    </Suspense>
  );
}

