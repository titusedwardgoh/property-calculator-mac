"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, AlertCircle, CheckCircle, Loader2, Eye, EyeOff } from 'lucide-react';

export default function EditPasswordModal({ isOpen, onClose, onUpdatePassword }) {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setError('');
            setIsSuccess(false);
            setShowCurrentPassword(false);
            setShowNewPassword(false);
            setShowConfirmPassword(false);
        }
    }, [isOpen]);

    const validatePassword = (password) => {
        // Minimum 6 characters (Supabase default requirement)
        return password.length >= 6;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        // Validate new password
        if (!validatePassword(newPassword)) {
            setError('Password must be at least 6 characters long');
            setIsSubmitting(false);
            return;
        }

        // Check if passwords match
        if (newPassword !== confirmPassword) {
            setError('New passwords do not match');
            setIsSubmitting(false);
            return;
        }

        // Check if new password is different from current
        if (newPassword === currentPassword) {
            setError('New password must be different from your current password');
            setIsSubmitting(false);
            return;
        }

        // Validate current password
        if (!currentPassword) {
            setError('Please enter your current password to authenticate this change');
            setIsSubmitting(false);
            return;
        }

        try {
            await onUpdatePassword(newPassword, currentPassword);
            setIsSuccess(true);
        } catch (err) {
            setError(err.message || 'Failed to update password. Please try again.');
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
                                            <Lock className="w-6 h-6 text-primary" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-gray-900">Change Password</h3>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="cursor-pointer text-gray-400 hover:text-gray-600 transition-colors"
                                        aria-label="Close"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="px-8 py-6">
                                {isSuccess ? (
                                    <div className="text-center">
                                        <div className="flex justify-center mb-4">
                                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                                                <CheckCircle className="w-8 h-8 text-green-600" />
                                            </div>
                                        </div>
                                        <h4 className="text-xl font-semibold text-gray-900 mb-2">
                                            Password Updated Successfully
                                        </h4>
                                        <p className="text-gray-600 mb-6">
                                            Your password has been changed successfully. You will need to use your new password to sign in next time.
                                        </p>
                                        <button
                                            onClick={onClose}
                                            className="cursor-pointer w-full bg-primary hover:bg-primary-focus text-secondary px-6 py-3 rounded-full font-medium transition-all duration-200 hover:shadow-lg"
                                        >
                                            Close
                                        </button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit}>
                                        <div className="mb-4">
                                            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                                Current Password
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showCurrentPassword ? "text" : "password"}
                                                    id="currentPassword"
                                                    value={currentPassword}
                                                    onChange={(e) => {
                                                        setCurrentPassword(e.target.value);
                                                        setError('');
                                                    }}
                                                    placeholder="Enter your current password"
                                                    required
                                                    disabled={isSubmitting}
                                                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                    className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                                    tabIndex={-1}
                                                >
                                                    {showCurrentPassword ? (
                                                        <EyeOff className="w-5 h-5" />
                                                    ) : (
                                                        <Eye className="w-5 h-5" />
                                                    )}
                                                </button>
                                            </div>
                                            <p className="mt-1 text-xs text-gray-500">
                                                Please enter your current password to authenticate this change
                                            </p>
                                        </div>

                                        <div className="mb-4">
                                            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                                New Password
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showNewPassword ? "text" : "password"}
                                                    id="newPassword"
                                                    value={newPassword}
                                                    onChange={(e) => {
                                                        setNewPassword(e.target.value);
                                                        setError('');
                                                    }}
                                                    placeholder="Enter your new password"
                                                    required
                                                    disabled={isSubmitting}
                                                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                                    className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                                    tabIndex={-1}
                                                >
                                                    {showNewPassword ? (
                                                        <EyeOff className="w-5 h-5" />
                                                    ) : (
                                                        <Eye className="w-5 h-5" />
                                                    )}
                                                </button>
                                            </div>
                                            <p className="mt-1 text-xs text-gray-500">
                                                Password must be at least 6 characters long
                                            </p>
                                        </div>

                                        <div className="mb-6">
                                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                                Confirm New Password
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showConfirmPassword ? "text" : "password"}
                                                    id="confirmPassword"
                                                    value={confirmPassword}
                                                    onChange={(e) => {
                                                        setConfirmPassword(e.target.value);
                                                        setError('');
                                                    }}
                                                    placeholder="Re-enter your new password"
                                                    required
                                                    disabled={isSubmitting}
                                                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                                    tabIndex={-1}
                                                >
                                                    {showConfirmPassword ? (
                                                        <EyeOff className="w-5 h-5" />
                                                    ) : (
                                                        <Eye className="w-5 h-5" />
                                                    )}
                                                </button>
                                            </div>
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
                                                className="cursor-pointer flex-1 border-2 border-gray-300 text-gray-700 bg-white hover:bg-gray-50 px-6 py-3 rounded-full font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={isSubmitting || !currentPassword || !newPassword || !confirmPassword}
                                                className="cursor-pointer flex-1 bg-primary hover:bg-primary-focus text-secondary px-6 py-3 rounded-full font-medium transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                            >
                                                {isSubmitting ? (
                                                    <>
                                                        <Loader2 className="w-5 h-5 animate-spin" />
                                                        <span>Updating...</span>
                                                    </>
                                                ) : (
                                                    'Update Password'
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

