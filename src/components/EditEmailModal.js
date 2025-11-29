"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

export default function EditEmailModal({ isOpen, onClose, currentEmail, onUpdateEmail }) {
    const [newEmail, setNewEmail] = useState('');
    const [confirmEmail, setConfirmEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setNewEmail('');
            setConfirmEmail('');
            setPassword('');
            setError('');
            setIsSuccess(false);
        }
    }, [isOpen]);

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        // Validate email format
        if (!validateEmail(newEmail)) {
            setError('Please enter a valid email address');
            setIsSubmitting(false);
            return;
        }

        // Check if emails match
        if (newEmail !== confirmEmail) {
            setError('Email addresses do not match');
            setIsSubmitting(false);
            return;
        }

        // Check if email is different from current
        if (newEmail.toLowerCase() === currentEmail?.toLowerCase()) {
            setError('New email must be different from your current email');
            setIsSubmitting(false);
            return;
        }

        // Validate password
        if (!password) {
            setError('Please enter your current password to authenticate this change');
            setIsSubmitting(false);
            return;
        }

        try {
            await onUpdateEmail(newEmail, password);
            setIsSuccess(true);
        } catch (err) {
            setError(err.message || 'Failed to update email. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 z-[200]"
                    />
                    
                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center p-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
                            {/* Header */}
                            <div className="bg-primary/10 px-8 pt-8 pb-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                                            <Mail className="w-6 h-6 text-primary" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-gray-900">Change Email</h3>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="text-gray-400 hover:text-gray-600 transition-colors"
                                        aria-label="Close"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="px-8 py-6">
                                {/* Warning about login username change */}
                                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <p className="text-sm text-yellow-800">
                                        <strong>Note:</strong> Changing your email will change your login username. You will need to use your new email address to log in after verification.
                                    </p>
                                </div>

                                {isSuccess ? (
                                    <div className="text-center">
                                        <div className="flex justify-center mb-4">
                                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                                                <CheckCircle className="w-8 h-8 text-green-600" />
                                            </div>
                                        </div>
                                        <h4 className="text-xl font-semibold text-gray-900 mb-2">
                                            Verification Email Sent
                                        </h4>
                                        <p className="text-gray-600 mb-4">
                                            We've sent a verification email to <strong>{newEmail}</strong>. 
                                            Please check your inbox and click the verification link to complete the email change.
                                        </p>
                                        <p className="text-sm text-gray-500 mb-6">
                                            Your current email ({currentEmail}) will remain active until you verify the new one.
                                        </p>
                                        <button
                                            onClick={onClose}
                                            className="w-full bg-primary hover:bg-primary-focus text-secondary px-6 py-3 rounded-full font-medium transition-all duration-200 hover:shadow-lg"
                                        >
                                            Close
                                        </button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit}>
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Current Email
                                            </label>
                                            <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-600">
                                                {currentEmail}
                                            </div>
                                        </div>

                                        <div className="mb-4">
                                            <label htmlFor="newEmail" className="block text-sm font-medium text-gray-700 mb-2">
                                                New Email
                                            </label>
                                            <input
                                                type="email"
                                                id="newEmail"
                                                value={newEmail}
                                                onChange={(e) => {
                                                    setNewEmail(e.target.value);
                                                    setError('');
                                                }}
                                                placeholder="Enter your new email address"
                                                required
                                                disabled={isSubmitting}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                            />
                                        </div>

                                        <div className="mb-4">
                                            <label htmlFor="confirmEmail" className="block text-sm font-medium text-gray-700 mb-2">
                                                Confirm New Email
                                            </label>
                                            <input
                                                type="email"
                                                id="confirmEmail"
                                                value={confirmEmail}
                                                onChange={(e) => {
                                                    setConfirmEmail(e.target.value);
                                                    setError('');
                                                }}
                                                placeholder="Re-enter your new email address"
                                                required
                                                disabled={isSubmitting}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                            />
                                        </div>

                                        <div className="mb-6">
                                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                                Current Password
                                            </label>
                                            <input
                                                type="password"
                                                id="password"
                                                value={password}
                                                onChange={(e) => {
                                                    setPassword(e.target.value);
                                                    setError('');
                                                }}
                                                placeholder="Enter your current password"
                                                required
                                                disabled={isSubmitting}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                            />
                                            <p className="mt-1 text-xs text-gray-500">
                                                Please enter your current password to authenticate this change
                                            </p>
                                        </div>

                                        {error && (
                                            <div className="mb-6 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                                                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                                <p className="text-sm text-red-600">{error}</p>
                                            </div>
                                        )}

                                        <div className="flex gap-3">
                                            <button
                                                type="button"
                                                onClick={onClose}
                                                disabled={isSubmitting}
                                                className="flex-1 border-2 border-gray-300 text-gray-700 bg-white hover:bg-gray-50 px-6 py-3 rounded-full font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={isSubmitting || !newEmail || !confirmEmail || !password}
                                                className="flex-1 bg-primary hover:bg-primary-focus text-secondary px-6 py-3 rounded-full font-medium transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                            >
                                                {isSubmitting ? (
                                                    <>
                                                        <Loader2 className="w-5 h-5 animate-spin" />
                                                        <span>Updating...</span>
                                                    </>
                                                ) : (
                                                    'Update Email'
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

