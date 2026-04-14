"use client";

import { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { User, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

function LoginPageContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // Get the 'next' parameter from URL to know where to redirect after login
  const nextUrl = searchParams.get('next') || '/dashboard';
  
  // Pre-fill email from URL parameter and check for email verification
  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
    const emailVerifiedParam = searchParams.get('emailVerified');
    if (emailVerifiedParam === 'true') {
      setEmailVerified(true);
      // Clean up URL parameter
      router.replace('/login', { scroll: false });
    }
    // Check for error parameter (e.g., expired email confirmation link)
    const errorParam = searchParams.get('error');
    if (errorParam === 'alreadyConfirmed') {
      setError('Email already confirmed. Please log in with your email and password.');
      // Clean up URL parameter
      router.replace('/login', { scroll: false });
    } else if (errorParam === 'expired') {
      setError('Email confirmation link has expired. Please request a new confirmation email by signing up again.');
      // Clean up URL parameter
      router.replace('/login', { scroll: false });
    } else if (errorParam) {
      setError(errorParam);
      // Clean up URL parameter
      router.replace('/login', { scroll: false });
    }
  }, [searchParams, router]);

  // Check for expired OTP error in URL hash (from Supabase redirect)
  // Be conservative: only redirect to forgot-password if we're certain it's a password reset
  // Otherwise, show error on login page (likely email confirmation)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // If we already have an error query parameter, don't check the hash
    // This prevents double-processing errors from the callback route
    const errorParam = searchParams.get('error');
    if (errorParam) {
      return;
    }
    
    const hash = window.location.hash;
    if (hash) {
      const urlParams = new URLSearchParams(hash.substring(1));
      const errorCode = urlParams.get('error_code');
      const errorDescription = urlParams.get('error_description');
      const type = urlParams.get('type');
      
      // Check if this is an expired OTP error
      if (errorCode === 'otp_expired' || errorDescription?.includes('expired')) {
        // Only redirect to forgot-password if type is explicitly 'recovery'
        // Otherwise, assume it's an email confirmation and show error on login page
        if (type === 'recovery') {
          // This is definitely a password reset flow
          router.replace('/forgot-password?error=expired');
          return;
        } else {
          // Likely an email confirmation - show error on login page
          // Note: We can't check email status from hash errors, so show generic message
          setError('This link has expired. Please request a new confirmation email by signing up again, or try logging in if your email is already confirmed.');
          // Clean up the hash
          window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
          return;
        }
      }
    }
  }, [router, searchParams]);

  // Check if user is already logged in and redirect to dashboard
  // Skip auto-redirect if coming from password reset flow or email verification
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Skip auto-redirect if coming from email verification
        if (emailVerified) {
          return;
        }
        
        // Check if user came from password reset page
        const fromPasswordReset = sessionStorage.getItem('fromPasswordReset');
        if (fromPasswordReset === 'true') {
          // Clear the flag and sign out to allow normal login
          sessionStorage.removeItem('fromPasswordReset');
          await supabase.auth.signOut();
          return;
        }
        
        const { data: { user }, error } = await supabase.auth.getUser();
        if (!error && user) {
          // Matches server-side getUser() validation — avoids redirecting when session
          // cookies are stale or only in memory (common without middleware refresh).
          router.replace(nextUrl);
        }
      } catch (err) {
        console.error('Error checking auth:', err);
      }
    };

    checkAuth();
  }, [router, nextUrl, supabase, emailVerified]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Use server-side API route for login to ensure cookies are properly set
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include', // Important: include cookies in request
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        setError(result.error || 'Login failed');
        setLoading(false);
        return;
      }

      // Wait a moment for cookies to be fully set, then redirect
      // This ensures the server-side dashboard page can read the session
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Check if there's a property to link after auth
      const linkPropertyId = sessionStorage.getItem('linkPropertyIdAfterAuth');
      if (linkPropertyId) {
        // Link the property to the user's account
        try {
          const linkResponse = await fetch('/api/supabase', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: 'linkPropertyToUser',
              propertyId: linkPropertyId
            })
          });
          
          const linkResult = await linkResponse.json();
          if (linkResponse.ok) {
            console.log('✅ Property linked to account:', linkResult.message);
            sessionStorage.removeItem('linkPropertyIdAfterAuth');
          } else {
            console.error('Error linking property:', linkResult.error);
          }
        } catch (error) {
          console.error('Error linking property to account:', error);
        }
      }
      
      // Show message about linked surveys if any were merged
      if (result.linkedSurveys > 0) {
        // Store message in sessionStorage to show on dashboard
        sessionStorage.setItem('linkedSurveysMessage', `Great! We've linked ${result.linkedSurveys} survey${result.linkedSurveys > 1 ? 's' : ''} from your email to your account.`);
      }
      
      // Use window.location for full page reload to ensure auth state updates
      window.location.href = nextUrl;
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
            radial-gradient(ellipse 84% 62% at 6% 38%, rgba(67, 151, 117, 0.36), transparent 67%),
            radial-gradient(ellipse 74% 60% at 44% 46%, rgba(67, 151, 117, 0.26), transparent 67%),
            radial-gradient(ellipse 66% 52% at 84% 76%, rgba(242, 255, 229, 0.62), transparent 63%),
            radial-gradient(ellipse 60% 48% at 76% 20%, rgba(67, 151, 117, 0.24), transparent 66%),
            radial-gradient(ellipse 58% 48% at 82% 82%, rgba(226, 149, 120, 0.24), transparent 66%),
            radial-gradient(ellipse 52% 40% at 30% 72%, rgba(226, 149, 120, 0.16), transparent 68%),
            linear-gradient(180deg, #ffffff 0%, #ffffff 36%, #f2ffe5 100%)
          `,
        }}
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 bg-white/80 backdrop-blur-sm shadow-md rounded-lg border border-white/60 w-full max-w-md md:max-w-xl p-8"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex items-center justify-center mb-6"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary">
              <User className="w-8 h-8" />
            </div>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-6"
          >
            Welcome back
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            className="text-lg md:text-xl text-gray-600"
          >
            New to PropWiz?{' '}
            <Link href="/signup" className="text-primary hover:text-primary-focus font-medium underline">
              Sign up
            </Link>
          </motion.p>
        </div>

        {/* Email Verified Success Message */}
        {emailVerified && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-6 flex items-start gap-3"
          >
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-800 mb-1">Email verified successfully!</p>
              <p className="text-sm text-green-700">Please log in with your email and password to continue.</p>
            </div>
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-6">
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
              className="w-full px-4 py-3 border border-primary rounded-lg bg-base-200 focus:ring-2 focus:ring-primary focus:border-primary transition-all disabled:opacity-50"
              placeholder="you@example.com"
            />
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
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
                className="w-full px-4 py-3 pr-12 border border-primary rounded-lg bg-base-200 focus:ring-2 focus:ring-primary focus:border-primary transition-all disabled:opacity-50"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                className="absolute right-3 cursor-pointer top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none transition-colors disabled:opacity-50"
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

          {/* Error Message */}
          {error && (
            <div className="bg-error/20 border border-error rounded-lg p-3 text-sm text-error">
              {error}
            </div>
          )}

          {/* Login Button */}
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
                <span>Logging in...</span>
              </>
            ) : (
              'Log in'
            )}
          </motion.button>

          {/* Forgot Password Link */}
          <div className="text-start">
            <Link href="/forgot-password" className="text-md font-medium text-gray-600 hover:text-primary hover:underline transition-colors">
              Trouble logging in?
            </Link>
          </div>
        </form>

        {/* Divider */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-3 py-0.5 rounded-full bg-white text-gray-700 border border-gray-300 shadow-sm">Or log in with</span>
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
            className="flex cursor-pointer items-center justify-center w-12 h-12 border-2 border-primary/35 bg-white rounded-full shadow-sm hover:border-primary hover:bg-primary/10 transition-all disabled:opacity-50"
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
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}


