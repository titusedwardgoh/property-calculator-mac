"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { syncActivityTimestamp } from '@/lib/lastActivity';
import { Shield, Loader2 } from 'lucide-react';

export default function Verify2FAPage() {
  const supabase = createClient();
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    // If user doesn't need 2FA, redirect to dashboard
    const check = async () => {
      const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (data?.currentLevel === 'aal2') {
        router.replace('/dashboard');
      } else if (!data?.nextLevel || data?.nextLevel === 'aal1') {
        router.replace('/dashboard');
      }
    };
    check();
  }, []);

  const handleVerify = async () => {
    if (!code || code.length !== 6) {
      setError('Please enter a 6-digit code.');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
      if (factorsError) throw factorsError;

      const totpFactor = factors?.totp?.find(f => f.status === 'verified');
      if (!totpFactor) throw new Error('No 2FA factor found.');

      const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
        factorId: totpFactor.id,
        code,
      });
      if (verifyError) throw verifyError;

      syncActivityTimestamp();
      router.replace('/dashboard');
    } catch (err) {
      setError('Invalid code. Please check your authenticator app and try again.');
      setCode('');
      inputRef.current?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleVerify();
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 aurora-page-bg">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-primary/10 px-8 pt-8 pb-6">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-gray-900">Two-Factor Authentication</h1>
          </div>
        </div>
        <div className="px-8 py-6">
          <p className="text-gray-600 text-sm mb-6">
            Enter the 6-digit code from your authenticator app to complete sign in.
          </p>
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(e) => { setCode(e.target.value.replace(/\D/g, '')); setError(''); }}
            onKeyDown={handleKeyDown}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-center text-3xl tracking-[0.6em] font-mono focus:outline-none focus:ring-2 focus:ring-primary mb-2"
          />
          {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
          <button
            onClick={handleVerify}
            disabled={isSubmitting || code.length !== 6}
            className="w-full mt-4 cursor-pointer bg-primary hover:bg-primary-focus text-secondary px-6 py-3 rounded-full font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Verify
          </button>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              router.push('/login');
            }}
            className="w-full mt-3 cursor-pointer text-gray-500 hover:text-gray-700 text-sm transition-colors"
          >
            Sign in with a different account
          </button>
        </div>
      </div>
    </div>
  );
}
