"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, ShieldCheck, ShieldOff, Loader2, Copy, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function TwoFactorModal({ isOpen, onClose, onStatusChange }) {
  const supabase = createClient();
  const [step, setStep] = useState('loading');
  // steps: loading | status | enroll | verify | unenroll | success | error
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [factorId, setFactorId] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [isEnabled, setIsEnabled] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setStep('loading');
      setVerifyCode('');
      setErrorMessage('');
      checkMFAStatus();
    }
  }, [isOpen]);

  useEffect(() => {
    if ((step === 'verify' || step === 'unenroll') && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [step]);

  const checkMFAStatus = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      const verifiedFactor = data?.totp?.find(f => f.status === 'verified');
      if (verifiedFactor) {
        setFactorId(verifiedFactor.id);
        setIsEnabled(true);
        setStep('status');
      } else {
        // Clean up any unverified leftover factors before enrolling
        const unverified = data?.totp?.filter(f => f.status === 'unverified') || [];
        for (const f of unverified) {
          await supabase.auth.mfa.unenroll({ factorId: f.id });
        }
        setIsEnabled(false);
        setStep('status');
      }
    } catch (err) {
      setErrorMessage('Unable to load 2FA status. Please try again.');
      setStep('error');
    }
  };

  const handleStartEnroll = async () => {
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'PropWiz Authenticator',
      });
      if (error) throw error;
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setFactorId(data.id);
      setStep('enroll');
    } catch (err) {
      setErrorMessage(err.message || 'Failed to start 2FA setup. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify = async () => {
    if (!verifyCode || verifyCode.length !== 6) {
      setErrorMessage('Please enter a 6-digit code.');
      return;
    }
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code: verifyCode,
      });
      if (error) throw error;
      setIsEnabled(true);
      setStep('success');
      onStatusChange?.('enabled');
    } catch (err) {
      setErrorMessage('Invalid code. Please check your authenticator app and try again.');
      setVerifyCode('');
      inputRef.current?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnenroll = async () => {
    if (!verifyCode || verifyCode.length !== 6) {
      setErrorMessage('Please enter your current 6-digit code to confirm.');
      return;
    }
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      // Must verify current code before unenrolling
      const { error: challengeError } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code: verifyCode,
      });
      if (challengeError) throw new Error('Invalid code. Please try again.');

      const { error: unenrollError } = await supabase.auth.mfa.unenroll({ factorId });
      if (unenrollError) throw unenrollError;

      setIsEnabled(false);
      setStep('success');
      onStatusChange?.('disabled');
    } catch (err) {
      setErrorMessage(err.message || 'Failed to disable 2FA. Please try again.');
      setVerifyCode('');
      inputRef.current?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopySecret = async () => {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard not available
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (step === 'verify') handleVerify();
      if (step === 'unenroll') handleUnenroll();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-[200]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
              {/* Header */}
              <div className="bg-primary/10 px-8 pt-8 pb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className="w-6 h-6 text-primary" />
                    <h3 className="text-2xl font-bold text-gray-900">Two-Factor Authentication</h3>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                    aria-label="Close"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="px-8 py-6">

                {/* Loading */}
                {step === 'loading' && (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                )}

                {/* Error */}
                {step === 'error' && (
                  <div className="text-center py-4">
                    <p className="text-red-600 mb-6">{errorMessage}</p>
                    <button
                      onClick={onClose}
                      className="px-6 py-3 rounded-full border-2 border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                )}

                {/* Status — show current state and action button */}
                {step === 'status' && (
                  <div>
                    <div className={`flex items-center gap-3 p-4 rounded-xl mb-6 ${isEnabled ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
                      {isEnabled
                        ? <ShieldCheck className="w-5 h-5 text-green-600 shrink-0" />
                        : <ShieldOff className="w-5 h-5 text-gray-400 shrink-0" />
                      }
                      <div>
                        <p className={`font-semibold ${isEnabled ? 'text-green-700' : 'text-gray-700'}`}>
                          {isEnabled ? '2FA is enabled' : '2FA is not enabled'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {isEnabled
                            ? 'Your account is protected with an authenticator app.'
                            : 'Add an extra layer of security to your account.'}
                        </p>
                      </div>
                    </div>

                    {!isEnabled && (
                      <>
                        <p className="text-gray-600 text-sm mb-6">
                          When enabled, you will be asked for a code from your authenticator app each time you sign in. Works with Google Authenticator, Authy, 1Password, and any TOTP-compatible app.
                        </p>
                        <div className="flex gap-3">
                          <button
                            onClick={onClose}
                            className="flex-1 cursor-pointer border-2 border-gray-300 text-gray-700 bg-white hover:bg-gray-50 px-6 py-3 rounded-full font-medium transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleStartEnroll}
                            disabled={isSubmitting}
                            className="flex-1 cursor-pointer bg-primary hover:bg-primary/90 text-secondary px-6 py-3 rounded-full font-medium transition-all duration-200 hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                            Enable 2FA
                          </button>
                        </div>
                      </>
                    )}

                    {isEnabled && (
                      <>
                        <p className="text-gray-600 text-sm mb-6">
                          To disable 2FA, you will need to enter your current authenticator code to confirm.
                        </p>
                        <div className="flex gap-3">
                          <button
                            onClick={onClose}
                            className="flex-1 cursor-pointer border-2 border-gray-300 text-gray-700 bg-white hover:bg-gray-50 px-6 py-3 rounded-full font-medium transition-colors"
                          >
                            Close
                          </button>
                          <button
                            onClick={() => { setStep('unenroll'); setVerifyCode(''); setErrorMessage(''); }}
                            className="flex-1 cursor-pointer bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-full font-medium transition-colors"
                          >
                            Disable 2FA
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Enroll — show QR code */}
                {step === 'enroll' && (
                  <div>
                    <p className="text-gray-600 text-sm mb-4">
                      Scan this QR code with your authenticator app (Google Authenticator, Authy, 1Password etc.), then enter the 6-digit code below to confirm.
                    </p>
                    {qrCode && (
                      <div className="flex justify-center mb-4">
                        <img
                          src={qrCode}
                          alt="QR code for 2FA setup"
                          className="w-48 h-48 border border-gray-200 rounded-xl"
                        />
                      </div>
                    )}
                    {/* Manual entry fallback */}
                    <div className="bg-gray-50 rounded-xl p-3 mb-4">
                      <p className="text-xs text-gray-500 mb-1">Can&apos;t scan? Enter this code manually:</p>
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-mono text-gray-800 break-all flex-1">{secret}</code>
                        <button
                          onClick={handleCopySecret}
                          className="shrink-0 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
                          aria-label="Copy secret"
                        >
                          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <input
                      ref={inputRef}
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="Enter 6-digit code"
                      value={verifyCode}
                      onChange={(e) => { setVerifyCode(e.target.value.replace(/\D/g, '')); setErrorMessage(''); }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleVerify();
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl text-center text-2xl tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-primary mb-2"
                    />
                    {errorMessage && <p className="text-red-500 text-sm mb-2">{errorMessage}</p>}
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={() => { setStep('status'); setVerifyCode(''); setErrorMessage(''); }}
                        className="flex-1 cursor-pointer border-2 border-gray-300 text-gray-700 bg-white hover:bg-gray-50 px-6 py-3 rounded-full font-medium transition-colors"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleVerify}
                        disabled={isSubmitting || verifyCode.length !== 6}
                        className="flex-1 cursor-pointer bg-primary hover:bg-primary/90 text-secondary px-6 py-3 rounded-full font-medium transition-all duration-200 hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        Verify & Enable
                      </button>
                    </div>
                  </div>
                )}

                {/* Unenroll — confirm with current code */}
                {step === 'unenroll' && (
                  <div>
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                      <p className="text-red-700 text-sm font-medium">You are about to disable 2FA</p>
                      <p className="text-red-600 text-sm mt-1">Enter your current authenticator code to confirm. Your account will be less secure without 2FA.</p>
                    </div>
                    <input
                      ref={inputRef}
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="Enter 6-digit code"
                      value={verifyCode}
                      onChange={(e) => { setVerifyCode(e.target.value.replace(/\D/g, '')); setErrorMessage(''); }}
                      onKeyDown={handleKeyDown}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl text-center text-2xl tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-primary mb-2"
                    />
                    {errorMessage && <p className="text-red-500 text-sm mb-2">{errorMessage}</p>}
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={() => { setStep('status'); setVerifyCode(''); setErrorMessage(''); }}
                        className="flex-1 cursor-pointer border-2 border-gray-300 text-gray-700 bg-white hover:bg-gray-50 px-6 py-3 rounded-full font-medium transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleUnenroll}
                        disabled={isSubmitting || verifyCode.length !== 6}
                        className="flex-1 cursor-pointer bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-full font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        Confirm Disable
                      </button>
                    </div>
                  </div>
                )}

                {/* Success */}
                {step === 'success' && (
                  <div className="text-center py-4">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                      <ShieldCheck className="w-8 h-8 text-green-600" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 mb-2">
                      {isEnabled ? '2FA Enabled' : '2FA Disabled'}
                    </h4>
                    <p className="text-gray-600 text-sm mb-6">
                      {isEnabled
                        ? 'Your account is now protected with two-factor authentication. You will be asked for a code from your authenticator app each time you sign in.'
                        : '2FA has been disabled. You can re-enable it at any time from Security Settings.'}
                    </p>
                    <button
                      onClick={onClose}
                      className="w-full cursor-pointer bg-primary hover:bg-primary/90 text-secondary px-6 py-3 rounded-full font-medium transition-all duration-200 hover:shadow-lg"
                    >
                      Done
                    </button>
                  </div>
                )}

              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
