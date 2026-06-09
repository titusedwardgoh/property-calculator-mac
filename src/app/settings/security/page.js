"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import { Lock, Edit2, ExternalLink, ShieldCheck } from 'lucide-react';
import EditPasswordModal from '@/components/EditPasswordModal';
import NotificationModal from '@/components/NotificationModal';
import TwoFactorModal from '@/components/TwoFactorModal';

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
    const [isTwoFactorModalOpen, setIsTwoFactorModalOpen] = useState(false);
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!loading && !user) {
            router.push('/login?next=/settings/security');
        }
    }, [loading, user, router]);

    useEffect(() => {
        if (!user) return;
        const checkStatus = async () => {
            const { data } = await supabase.auth.mfa.listFactors();
            const verified = data?.totp?.some(f => f.status === 'verified');
            setTwoFactorEnabled(!!verified);
        };
        checkStatus();
    }, [user]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
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
        setIsTwoFactorModalOpen(true);
    };

    return (
        <div className="max-w-3xl space-y-6">
            {/* Security Hero Header Section */}
            <div className="border-b border-gray-200/60 pb-5 mb-8">
                <motion.h1
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
                    className="mb-1 text-3xl font-bold leading-tight text-gray-900 md:text-4xl lg:text-5xl"
                >
                    Security Settings
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
                    className="mb-0 text-base text-gray-500 md:text-lg lg:text-xl"
                >
                    Manage your password, protection methods, and login preferences
                </motion.p>
            </div>

            {/* Account Security Card */}
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
                className="bg-white border border-base-300 rounded-3xl shadow-sm p-6 sm:p-8"
            >
                <h2 className="text-gray-900 font-bold text-xl mb-6">Account Security</h2>
                
                {/* Password Section */}
                <div className="flex items-center justify-between p-4 border border-base-300 rounded-2xl bg-white/50 mb-6">
                    <div className="flex items-center gap-3">
                        <Lock className="w-5 h-5 text-gray-400" />
                        <div>
                            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Password</div>
                            <span className="text-gray-900 font-medium">••••••••</span>
                        </div>
                    </div>
                    <button
                        onClick={handleEditPassword}
                        className="text-primary hover:underline text-sm font-semibold cursor-pointer transition-colors"
                    >
                        Edit
                    </button>
                </div>

                {/* Two-Factor Authentication Section */}
                <div className="bg-white/50 rounded-2xl border border-base-300 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Protect your account</h3>
                    <p className="text-sm text-gray-600 mb-4">
                        Strengthen your account security by requiring both your password and a second step to sign in.
                    </p>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {twoFactorEnabled
                                ? <ShieldCheck className="w-4 h-4 text-green-600" />
                                : <Lock className="w-4 h-4 text-gray-400" />
                            }
                            <span className={`text-sm font-semibold ${twoFactorEnabled ? 'text-green-600' : 'text-gray-500'}`}>
                                {twoFactorEnabled ? '2FA enabled' : '2FA not enabled'}
                            </span>
                        </div>
                        <button
                            onClick={handleSetup2FA}
                            className="flex items-center gap-2 text-primary cursor-pointer hover:underline transition-colors font-semibold text-sm"
                        >
                            <span>
                                {twoFactorEnabled ? 'Manage 2FA' : 'Setup 2FA'}
                            </span>
                            <ExternalLink className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </motion.div>

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

            <TwoFactorModal
                isOpen={isTwoFactorModalOpen}
                onClose={() => setIsTwoFactorModalOpen(false)}
                onStatusChange={(status) => setTwoFactorEnabled(status === 'enabled')}
            />
        </div>
    );
}

