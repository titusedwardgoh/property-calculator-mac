"use client";

import { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { UserPlus, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

function SignupPageContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // Get the 'next' parameter from URL to know where to redirect after signup
  const nextUrl = searchParams.get('next') || '/dashboard';
  
  // Pre-fill email from URL parameter
  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  // Check if user is already logged in and redirect to dashboard
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // User is already logged in, redirect to dashboard or next URL
          router.replace(nextUrl);
        }
      } catch (err) {
        console.error('Error checking auth:', err);
      }
    };

    checkAuth();
  }, [router, nextUrl, supabase]);

  const handleSignup = async (e) => {
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
      // Read propertyId from sessionStorage if available (from "Log in to save" flow)
      const linkPropertyId = typeof window !== 'undefined' ? sessionStorage.getItem('linkPropertyIdAfterAuth') : null;
      
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          password,
          propertyId: linkPropertyId || null
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Signup failed');
        setLoading(false);
        return;
      }

      // Wait a moment for cookies to be fully set
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Note: Property linking is now handled by the signup API route via survey_leads
      // The propertyId was passed to the API and saved to survey_leads
      // It will be linked when the user logs in after email confirmation
      if (linkPropertyId) {
        sessionStorage.removeItem('linkPropertyIdAfterAuth');
      }
      
      // Show message about linked surveys if any were merged
      if (data.linkedSurveys > 0) {
        // Store message in sessionStorage to show on dashboard
        sessionStorage.setItem('linkedSurveysMessage', `Great! We've linked ${data.linkedSurveys} survey${data.linkedSurveys > 1 ? 's' : ''} from your email to your account.`);
      }
      
      // Show success message instead of redirecting
      setLoading(false);
      setShowSuccessMessage(true);
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider) => {
    setError('');
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(nextUrl)}`,
        },
      });

      if (error) {
        setError(error.message);
      }
      // OAuth will redirect automatically
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <div className="min-h-screen w-full relative flex items-start justify-center px-4 py-16 lg:py-12">
      <div
        className="absolute inset-0 z-0"
        style={{
          background: `
            radial-gradient(ellipse 90% 68% at 84% 22%, rgba(67, 151, 117, 0.30), transparent 69%),
            radial-gradient(ellipse 82% 60% at 20% 24%, rgba(242, 255, 229, 0.56), transparent 70%),
            radial-gradient(ellipse 76% 58% at 12% 78%, rgba(226, 149, 120, 0.22), transparent 72%),
            radial-gradient(ellipse 88% 66% at 70% 82%, rgba(67, 151, 117, 0.18), transparent 74%),
            radial-gradient(ellipse 64% 50% at 56% 52%, rgba(226, 149, 120, 0.14), transparent 75%),
            linear-gradient(165deg, #ffffff 0%, #ffffff 34%, #f2ffe5 100%)
          `,
        }}
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 bg-white/80 backdrop-blur-sm border border-white/60 shadow-[0_10px_24px_rgba(15,23,42,0.12),-4px_-4px_14px_rgba(255,255,255,0.78)] rounded-3xl w-full max-w-md md:max-w-xl p-8"
      >
        {showSuccessMessage ? (
          /* Success Message */
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="flex items-center justify-center mb-6"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600">
                <CheckCircle2 className="w-8 h-8" />
              </div>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
              className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-6"
            >
              Account created successfully!
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
              className="text-lg md:text-xl text-gray-600 mb-8"
            >
              Please check your email to activate your account. We&apos;ve sent a verification link to <strong>{email}</strong>.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push(`/login?email=${encodeURIComponent(email)}`)}
                className="w-full bg-primary cursor-pointer hover:bg-primary-focus text-secondary font-medium py-3 px-6 rounded-full transition-all duration-200 hover:shadow-lg flex items-center justify-center gap-2"
              >
                Go to Login
              </motion.button>
            </motion.div>
          </div>
        ) : (
          <>
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex items-center justify-center mb-6"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary">
              <UserPlus className="w-8 h-8" />
            </div>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-6"
          >
            Create your account
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            className="text-lg md:text-xl text-gray-600"
          >
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:text-primary-focus font-medium underline">
              Log in
            </Link>
          </motion.p>
        </div>

        {/* Form */}
        <form onSubmit={handleSignup} className="space-y-6">
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-800 mb-2">
              Your email address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="w-full px-4 py-3 border border-primary rounded-lg bg-white focus:ring-2 focus:ring-primary focus:border-primary transition-all disabled:opacity-50"
              placeholder="you@example.com"
            />
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-800 mb-2">
              Your password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="w-full px-4 py-3 pr-12 border border-primary rounded-lg bg-white focus:ring-2 focus:ring-primary focus:border-primary transition-all disabled:opacity-50"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none transition-colors disabled:opacity-50"
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
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-800 mb-2">
              Confirm your password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                className="w-full px-4 py-3 pr-12 border border-primary rounded-lg bg-white focus:ring-2 focus:ring-primary focus:border-primary transition-all disabled:opacity-50"
                placeholder="Confirm your password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={loading}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none transition-colors disabled:opacity-50"
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

          {/* Signup Button */}
          <motion.button
            type="submit"
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            disabled={loading}
            className="w-full bg-primary cursor-pointer hover:bg-primary-focus text-secondary font-medium py-3 px-6 rounded-full transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Creating account...</span>
              </>
            ) : (
              'Create account'
            )}
          </motion.button>
        </form>

        {/* Divider */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-3 py-0.5 rounded-full bg-white text-gray-700 border border-gray-300 shadow-sm">Or sign up with</span>
          </div>
        </div>

        {/* Social Login Buttons */}
        <div className="flex items-center justify-center gap-4">
          {/* Google */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleOAuthLogin('google')}
            disabled={loading}
            className="flex items-center justify-center w-12 h-12 border-2 border-primary/35 bg-white rounded-full shadow-sm hover:border-primary hover:bg-primary/10 transition-all disabled:opacity-50"
            aria-label="Continue with Google"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          </motion.button>

        </div>
          </>
        )}
      </motion.div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <SignupPageContent />
    </Suspense>
  );
}

