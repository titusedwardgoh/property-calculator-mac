"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import { Lock, Edit2, ExternalLink } from 'lucide-react';
import EditPasswordModal from '@/components/EditPasswordModal';
import NotificationModal from '@/components/NotificationModal';

// Helper function to check if error is an invalid refresh token error
function isRefreshTokenError(error) {
    if (!error) return false;
    const message = error.message || '';
    return (
        message.includes('Invalid Refresh Token') ||
        message.includes('Refresh Token Not Found') ||
        message.includes('refresh_token_not_found') ||
        error.status === 401
    );
}

export default function SecuritySettingsPage() {
    const router = useRouter();
    const { user, loading } = useAuth();
    const supabase = createClient();
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [notification, setNotification] = useState({ isOpen: false, type: 'success', title: '', message: '' });

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!loading && !user) {
            router.push('/login?next=/settings/security');
        }
    }, [loading, user, router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-base-200 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    const handleEditPassword = () => {
        setIsPasswordModalOpen(true);
    };

    const handleChangePassword = async (newPassword, currentPassword) => {
        if (!user) return;

        try {
            // First, verify the current password by attempting to sign in
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: currentPassword
            });

            if (signInError) {
                if (isRefreshTokenError(signInError)) {
                    console.error('Invalid refresh token detected, redirecting to login...');
                    router.push('/login?next=/settings/security');
                    return;
                }
                throw new Error('Invalid password. Please try again.');
            }

            // Password is correct, now update password in Supabase Auth
            const { error: updateError } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (updateError) {
                if (isRefreshTokenError(updateError)) {
                    console.error('Invalid refresh token detected, redirecting to login...');
                    router.push('/login?next=/settings/security');
                    return;
                }
                throw new Error(updateError.message || 'Failed to update password');
            }

            // Success - the modal will show success message
            return Promise.resolve();
        } catch (error) {
            console.error('Error updating password:', error);
            if (isRefreshTokenError(error)) {
                console.error('Invalid refresh token detected, redirecting to login...');
                router.push('/login?next=/settings/security');
                return;
            }
            throw error;
        }
    };

    const handleSetup2FA = () => {
        // TODO: Implement 2FA setup flow
        console.log('Setup 2FA clicked');
    };

    return (
        <div className="min-h-screen bg-base-200 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="space-y-6">
                    {/* Account Security Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
                        className="bg-base-100 rounded-lg shadow-lg p-6"
                    >
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Account Security</h2>
                        
                        {/* Password Section */}
                        <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg mb-6">
                            <div className="flex items-center gap-3">
                                <span className="text-gray-900 font-medium">Password</span>
                                <Lock className="w-4 h-4 text-gray-900" />
                                <span className="text-gray-900">••••••••</span>
                            </div>
                            <button
                                onClick={handleEditPassword}
                                className="flex items-center gap-2 text-primary hover:text-green-700 transition-colors cursor-pointer"
                            >
                                <Edit2 className="w-4 h-4" />
                                <span className="font-medium">Edit</span>
                            </button>
                        </div>

                        {/* Two-Factor Authentication Section */}
                        <div className="bg-base-100 rounded-lg border border-gray-200 p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Protect your account</h3>
                            <p className="text-sm text-gray-700 mb-6">
                                Strengthen your account security by requiring both your password and a second step to sign in.
                            </p>
                            <button
                                onClick={handleSetup2FA}
                                className="flex items-center gap-2 text-primary hover:text-green-700 transition-colors"
                            >
                                <Lock className="w-4 h-4" />
                                <span className="font-medium">Setup 2 Factor Authentication</span>
                                <ExternalLink className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Password Change Modal */}
            <EditPasswordModal
                isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
                onUpdatePassword={handleChangePassword}
            />

            {/* Notification Modal */}
            <NotificationModal
                isOpen={notification.isOpen}
                onClose={() => setNotification({ ...notification, isOpen: false })}
                type={notification.type}
                title={notification.title}
                message={notification.message}
            />
        </div>
    );
}

