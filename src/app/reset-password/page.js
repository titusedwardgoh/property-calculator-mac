"use client";

import { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

function ResetPasswordPageContent() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);
  const [isExchangingToken, setIsExchangingToken] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    // Handle password reset token exchange
    const handleTokenExchange = async () => {
      if (typeof window === 'undefined') return;

      const hash = window.location.hash;
      const urlParams = new URLSearchParams(hash.substring(1)); // Remove # and parse
      const accessToken = urlParams.get('access_token');
      const refreshToken = urlParams.get('refresh_token');
      const type = urlParams.get('type');

      // Check for code parameter (PKCE flow)
      const code = searchParams.get('code');

      if (code) {
        // Exchange code for session
        try {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            setError('Invalid or expired reset link. Please request a new password reset.');
            setIsExchangingToken(false);
            return;
          }
          setError(''); // Clear any previous errors
          setIsValidToken(true);
          setIsExchangingToken(false);
          // Clear the code from URL
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch (err) {
          setError('Invalid or expired reset link. Please request a new password reset.');
          setIsExchangingToken(false);
        }
      } else if (accessToken && refreshToken && type === 'recovery') {
        // Set the session using the tokens from hash
        try {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (sessionError) {
            setError('Invalid or expired reset link. Please request a new password reset.');
            setIsExchangingToken(false);
            return;
          }
          setError(''); // Clear any previous errors
          setIsValidToken(true);
          setIsExchangingToken(false);
          // Clear the hash from URL
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch (err) {
          setError('Invalid or expired reset link. Please request a new password reset.');
          setIsExchangingToken(false);
        }
      } else {
        // Check if we already have a valid session (user might have been redirected after token exchange)
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setError(''); // Clear any previous errors
          setIsValidToken(true);
          setIsExchangingToken(false);
        } else {
          // No valid token found
          setError('Invalid or expired reset link. Please request a new password reset.');
          setIsExchangingToken(false);
        }
      }
    };

    handleTokenExchange();
  }, [searchParams, supabase]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        setError(result.error || 'Failed to reset password');
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  if (isExchangingToken) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center px-4">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-gray-600">Verifying reset link...</p>
        </div>
      </div>
    );
  }

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
              {success ? (
                <CheckCircle2 className="w-8 h-8" />
              ) : (
                <Lock className="w-8 h-8" />
              )}
            </div>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-6"
          >
            {success ? 'Password reset!' : 'Reset your password'}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            className="text-lg md:text-xl text-gray-600"
          >
            {success ? (
              'Your password has been successfully reset. Redirecting to login...'
            ) : (
              'Enter your new password below.'
            )}
          </motion.p>
        </div>

        {success ? (
          <div className="space-y-6">
            <div className="bg-success/20 border border-success rounded-lg p-4 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
              <p className="text-sm text-success">
                Your password has been updated successfully.
              </p>
            </div>
            <div className="text-center">
              <Link 
                href="/login" 
                className="text-primary hover:text-primary-focus font-medium underline"
              >
                Go to login
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                New password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full px-4 py-3 pr-12 border border-base-300 rounded-lg bg-base-200 focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50"
                  placeholder="Enter your new password"
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  className="absolute cursor-pointer right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none transition-colors disabled:opacity-50"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm new password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full px-4 py-3 pr-12 border border-base-300 rounded-lg bg-base-200 focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50"
                  placeholder="Confirm your new password"
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                  className="absolute cursor-pointer right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none transition-colors disabled:opacity-50"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
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
                  <span>Resetting password...</span>
                </>
              ) : (
                'Reset password'
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <ResetPasswordPageContent />
    </Suspense>
  );
}

