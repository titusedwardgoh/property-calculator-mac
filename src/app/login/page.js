"use client";

import { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { LogIn, Eye, EyeOff, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

function LoginPageContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // Get the 'next' parameter from URL to know where to redirect after login
  const nextUrl = searchParams.get('next') || '/dashboard';

  // Check for expired OTP error in URL hash (from Supabase redirect)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const hash = window.location.hash;
    if (hash) {
      const urlParams = new URLSearchParams(hash.substring(1));
      const errorCode = urlParams.get('error_code');
      const errorDescription = urlParams.get('error_description');
      
      // Check if this is an expired OTP error
      if (errorCode === 'otp_expired' || errorDescription?.includes('expired')) {
        // Redirect to forgot password page
        router.replace('/forgot-password?error=expired');
        return;
      }
    }
  }, [router]);

  // Check if user is already logged in and redirect to dashboard
  // Skip auto-redirect if coming from password reset flow (check sessionStorage)
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if user came from password reset page
        const fromPasswordReset = sessionStorage.getItem('fromPasswordReset');
        if (fromPasswordReset === 'true') {
          // Clear the flag and sign out to allow normal login
          sessionStorage.removeItem('fromPasswordReset');
          await supabase.auth.signOut();
          return;
        }
        
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
              <LogIn className="w-8 h-8" />
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
              className="w-full px-4 py-3 border border-base-300 rounded-lg bg-base-200 focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50"
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
                className="w-full px-4 py-3 pr-12 border border-base-300 rounded-lg bg-base-200 focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50"
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
            className="w-full bg-primary hover:bg-primary-focus text-secondary font-medium py-3 px-6 rounded-full transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
            <span className="px-2 bg-base-100 text-gray-500">Or log in with</span>
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
            className="flex items-center justify-center w-12 h-12 border-2 border-base-300 rounded-full hover:border-primary hover:bg-primary/10 transition-all disabled:opacity-50"
            aria-label="Continue with Google"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          </motion.button>

          {/* Facebook */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleOAuthLogin('facebook')}
            disabled={loading}
            className="flex items-center justify-center w-12 h-12 border-2 border-base-300 rounded-full hover:border-primary hover:bg-primary/10 transition-all disabled:opacity-50"
            aria-label="Continue with Facebook"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </motion.button>

          {/* Apple */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleOAuthLogin('apple')}
            disabled={loading}
            className="flex items-center justify-center w-12 h-12 border-2 border-base-300 rounded-full hover:border-primary hover:bg-primary/10 transition-all disabled:opacity-50"
            aria-label="Continue with Apple"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/>
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


